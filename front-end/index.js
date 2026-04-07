const API = "http://localhost:3001/tasks";

const titleInput = document.getElementById("title");
const dateInput = document.getElementById("due_date");
const emailInput = document.getElementById("email");
const addBtn = document.getElementById("addBtn");
const messageEl = document.getElementById("message");

const statusFilter = document.getElementById("statusFilter");
const dateFilter = document.getElementById("dateFilter");
const filterBtn = document.getElementById("filterBtn");
const resetBtn = document.getElementById("resetBtn");
const refreshBtn = document.getElementById("refreshBtn");

const taskList = document.getElementById("taskList");

addBtn.addEventListener("click", addTask);
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

    const res = await fetch(url);
    const tasks = await res.json();

    renderTasks(tasks);
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
    div.className = `task-item ${task.status === "done" ? "done" : ""}`;

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
        <button class="btn primary" onclick="markDone(${task.id})">Pažymėti Done</button>
        <button class="btn secondary" onclick="deleteTask(${task.id})">Ištrinti</button>
    </div>
    `;

    taskList.appendChild(div);
  });
}

async function addTask() {
  const title = titleInput.value.trim();
  const due_date = dateInput.value;
  const email = emailInput.value.trim();

  if (!title) {
    showMessage("Pavadinimas yra privalomas.", true);
    return;
  }

  const body = {
    title,
    due_date,
    email
  };

  try {
    const res = await fetch(API, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify(body)
    });

    const data = await res.json();

    if (!res.ok) {
      showMessage(data.error || "Nepavyko sukurti užduoties.", true);
      return;
    }

    titleInput.value = "";
    dateInput.value = "";
    emailInput.value = "";

    showMessage("Užduotis sėkmingai pridėta.");
    loadTasks();
  } catch (error) {
    showMessage("Serverio klaida kuriant užduotį.", true);
  }
}

async function markDone(id) {
  try {
    const res = await fetch(`http://localhost:3001/tasks/${id}/status`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ status: "done" })
    });

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
    const res = await fetch(`http://localhost:3001/tasks/${id}`, {
      method: "DELETE"
    });

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
  };

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