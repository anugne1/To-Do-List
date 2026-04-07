//require("dotenv").config();

const express = require("express");
const cors = require("cors");
const fs = require("fs");
const nodemailer = require("nodemailer");

const app = express();
app.use(cors());
app.use(express.json());

const FILE = "./data/tasks.json";

function readTasks() {
  return JSON.parse(fs.readFileSync(FILE, "utf8"));
}

function saveTasks(tasks) {
  fs.writeFileSync(FILE, JSON.stringify(tasks, null, 2));
}


let transporter;

// Sukuriama testinė Ethereal paskyra
async function createMailer() {
  try {
    const testAccount = await nodemailer.createTestAccount();

    transporter = nodemailer.createTransport({
      host: "smtp.ethereal.email",
      port: 587,
      secure: false,
      auth: {
        user: testAccount.user,
        pass: testAccount.pass
      }
    });

    console.log("Ethereal test account sukurtas:");
    console.log("User:", testAccount.user);
    console.log("Pass:", testAccount.pass);
  } catch (error) {
    console.error("Nepavyko sukurti Ethereal paskyros:", error.message);
  }
}

// Testinis route
app.get("/test", (req, res) => {
  res.json({ message: "test veikia" });
});


//query parametru pavyzdys: http://localhost:3001/tasks?status=pending
//query parametru pavyzdys: http://localhost:3001/tasks?due_date=2024-06-30
app.get("/tasks", (req, res) => {
  let tasks = readTasks();

  const { status, due_date } = req.query;

  if (status) {
    tasks = tasks.filter(t => t.status === status);
  }

  if (due_date) {
    tasks = tasks.filter(t => t.due_date === due_date);
  }

  res.json(tasks);
});

app.post("/tasks", (req, res) => {
  const tasks = readTasks();

  const newTask = {
    id: Date.now(),
    title: req.body.title,
    status: "pending",
    due_date: req.body.due_date,
    email: req.body.email,
    reminder_sent: false
  };

  tasks.push(newTask);
  saveTasks(tasks);

  res.json(newTask);
});

app.put("/tasks/:id", (req, res) => {
  let tasks = readTasks();

  tasks = tasks.map(t =>
    t.id == req.params.id ? { ...t, ...req.body } : t
  );

  saveTasks(tasks);
  res.json({ message: "Updated" });
});

app.patch("/tasks/:id/status", (req, res) => {
  let tasks = readTasks();

  tasks = tasks.map(t =>
    t.id == req.params.id ? { ...t, status: req.body.status } : t
  );

  saveTasks(tasks);
  res.json({ message: "Status updated" });
});

app.delete("/tasks/:id", (req, res) => {
  let tasks = readTasks();

  tasks = tasks.filter(t => t.id != req.params.id);

  saveTasks(tasks);
  res.json({ message: "Deleted" });
});

// Funkcija, kuri tikrina ir siunčia priminimus
async function checkAndSendReminders() {
  if (!transporter) {
    console.log("Mailer dar neparuoštas.");
    return;
  }

  let tasks = readTasks();
  let changed = false;
  const now = new Date();

  for (let task of tasks) {
    if (!task.due_date || !task.email || task.reminder_sent) {
      continue;
    }

    const dueDate = new Date(task.due_date);
    const diffMs = dueDate - now;
    const diffDays = diffMs / (1000 * 60 * 60 * 24);

    // Siųsti, jei iki termino liko 3 dienos ar mažiau, bet terminas dar neatėjo
    if (diffDays <= 3 && diffDays > 0) {
      try {
        const info = await transporter.sendMail({
          from: '"ToDo App" <todo@test.com>',
          to: task.email,
          subject: "Priminimas apie artėjančią užduotį",
          text: `Sveiki! Primename, kad užduotis "${task.title}" turi terminą ${task.due_date}.`
        });

        console.log(`Priminimas išsiųstas užduočiai: ${task.title}`);
        console.log("Peržiūros nuoroda:", nodemailer.getTestMessageUrl(info));

        task.reminder_sent = true;
        changed = true;
      } catch (error) {
        console.error("Klaida siunčiant laišką:", error.message);
      }
    }
  }

  if (changed) {
    saveTasks(tasks);
  }
}

// Rankinis testinis paleidimas per Hoppscotch
app.post("/send-reminders-now", async (req, res) => {
  await checkAndSendReminders();
  res.json({ message: "Reminder check completed" });
});

// tikrina kas 1 minutę
setInterval(() => {
  checkAndSendReminders();
}, 60000);


console.log("NAUJA SERVERIO VERSIJA UZKRAUTA");

app.listen(3001, async () => {
  console.log("Server running on http://localhost:3001");
  await createMailer();
});