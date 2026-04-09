const API = "https://localhost:3001/tasks";

const titleInput = document.getElementById("title");
const dateInput = document.getElementById("due_date");
const emailInput = document.getElementById("email");
const addBtn = document.getElementById("addBtn");
const cancelEditBtn = document.getElementById("cancelEditBtn");
const formTitle = document.getElementById("formTitle");
const messageEl = document.getElementById("message");

const statusFilter = document.getElementById("statusFilter");
const dateFilter = document.getElementById("dateFilter");
const filterBtn = document.getElementById("filterBtn");
const resetBtn = document.getElementById("resetBtn");
const refreshBtn = document.getElementById("refreshBtn");

const taskList = document.getElementById("taskList");
let editingId = null;
let tasksCache = []; //laikysim uzduociu sarasa atmintyje, kad nereiktu visada kreiptis i serveri

addBtn.addEventListener("click", saveTask);
cancelEditBtn.addEventListener("click", cancelEdit);
filterBtn.addEventListener("click", applyFilters);
resetBtn.addEventListener("click", resetFilters);
refreshBtn.addEventListener("click", () => loadTasks());

async function loadTasks(filters = {}) {
  try {
    const params = new URLSearchParams();

    if (filters.status) {
      params.append("status", filters.status);
    }

    if (filters.due_date) {
      params.append("due_date", filters.due_date);
    }

    const url = params.toString() ? `${API}?${params.toString()}` : API; 
    //jei yra filtru tai pridedam juos prie url, jei ne tai paliekam api be filtru

    const res = await fetch(url); 
    const tasks = await res.json(); //gaunam uzduociu sarasa is serverio

    tasksCache = tasks; 
    renderTasks(tasks); //atvaizduojam uzduotis
  } catch (error) {
    showMessage("Nepavyko užkrauti užduočių.", true);
  }
}

function renderTasks(tasks) {
  taskList.innerHTML = "";

  if (!tasks.length) {
    taskList.innerHTML = `<div class="empty">Užduočių nerasta.</div>`;
    return;
  }

  tasks.forEach(task => {
    const div = document.createElement("div");
    div.className = `task-item ${task.status === "done" ? "done" : ""}`; //jei done tai kitaip atvaizduosim

    div.innerHTML = `
    <h3 class="task-title">${task.title}</h3>
    <p class="task-meta">
        <strong>Status:</strong>
        <span class="badge ${task.status}">${task.status}</span>
    </p>
    <p class="task-meta"><strong>Termino data:</strong> ${task.due_date || "-"}</p>
    <p class="task-meta"><strong>Email:</strong> ${task.email || "-"}</p>
    <p class="task-meta"><strong>Reminder sent:</strong> ${task.reminder_sent ? "Taip" : "Ne"}</p>

    <div class="task-actions">
        <button class="btn" onclick="startEdit(${task.id})">Redaguoti</button>
        <button class="btn primary" onclick="markDone(${task.id})">Pažymėti Done</button>
        <button class="btn secondary" onclick="deleteTask(${task.id})">Ištrinti</button>
    </div> 
    `; //sukuriam html koda kiekvienai uzduociai ir pridedam mygtukus redaguoti, pazymeti kaip done ir istrinti

    taskList.appendChild(div);
  });
}

async function saveTask() {
  const title = titleInput.value.trim();
  const due_date = dateInput.value;
  const email = emailInput.value.trim();

  if (!title) {
    showMessage("Pavadinimas yra privalomas.", true);
    return;
  }

  try {
    const payload = { title, due_date, email };
    const res = await fetch(editingId ? `${API}/${editingId}` : API, {
      method: editingId ? "PUT" : "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify(payload)
    }); //jei editingId yra tai atnaujinam esama uzduoti, jei ne tai kuriam nauja

    const data = await res.json(); // ats

    if (!res.ok) {
      const errorText = Array.isArray(data.details)
        ? data.details.join("\n")
        : data.error;
      const fallback = editingId
        ? "Nepavyko atnaujinti užduoties."
        : "Nepavyko sukurti užduoties.";
      showMessage(errorText || fallback, true);
      return;
    } 

    titleInput.value = "";
    dateInput.value = "";
    emailInput.value = "";

    if (editingId) {
      showMessage("Užduotis atnaujinta.");
      cancelEdit();
      applyFilters();
    } else {
      showMessage("Užduotis sėkmingai pridėta.");
      loadTasks();
    }
  } catch (error) {
    const fallback = editingId
      ? "Serverio klaida atnaujinant užduotį."
      : "Serverio klaida kuriant užduotį.";
    showMessage(fallback, true);
  }
}

function startEdit(id) {
  const task = tasksCache.find(item => item.id == id);
  if (!task) {
    showMessage("Nepavyko rasti užduoties.", true);
    return;
  }

  editingId = task.id;
  titleInput.value = task.title || "";
  dateInput.value = task.due_date || "";
  emailInput.value = task.email || "";
  formTitle.textContent = "Redaguoti užduotį";
  addBtn.textContent = "Išsaugoti pakeitimus";
  cancelEditBtn.classList.remove("hidden");
} //uzpildom forma su esamos uzduoties duomenimis, kad galetum redaguoti ir issaugoti pakeitimus

function cancelEdit() {
  editingId = null;
  titleInput.value = "";
  dateInput.value = "";
  emailInput.value = "";
  formTitle.textContent = "Nauja užduotis";
  addBtn.textContent = "Pridėti užduotį";
  cancelEditBtn.classList.add("hidden");
} //isvalom forma ir grazinam i pradini stiliu

async function markDone(id) {
  try {
    const res = await fetch(`${API}/${id}/status`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ status: "done" })
    }); //siunciam patch uzklausa, kad pakeistum statusa i done

    const data = await res.json();

    if (!res.ok) {
      showMessage(data.error || "Nepavyko pakeisti statuso.", true); 
      return;
    }

    showMessage("Statusas pakeistas į done.");
    applyFilters();
  } catch (error) {
    showMessage("Serverio klaida keičiant statusą.", true); 
  }
}

async function deleteTask(id) {
  try {
    const res = await fetch(`${API}/${id}`, {
      method: "DELETE"
    }); //siunciam delete uzklausa, kad istrintum uzduoti

    const data = await res.json();

    if (!res.ok) {
      showMessage(data.error || "Nepavyko ištrinti užduoties.", true);
      return;
    }

    showMessage("Užduotis ištrinta.");
    applyFilters();
  } catch (error) {
    showMessage("Serverio klaida trinant užduotį.", true);
  }
}

function applyFilters() {
  const filters = {
    status: statusFilter.value,
    due_date: dateFilter.value
  }; //gaunam filtru reiksmes is inputu

  loadTasks(filters);
}

function resetFilters() {
  statusFilter.value = "";
  dateFilter.value = "";
  loadTasks();
}

function showMessage(text, isError = false) {
  messageEl.textContent = text;
  messageEl.style.color = isError ? "#dc2626" : "#16a34a";

  setTimeout(() => {
    messageEl.textContent = "";
  }, 3000);
}

loadTasks();
