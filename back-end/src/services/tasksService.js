const fs = require("fs");
const path = require("path");

const FILE = path.join(__dirname, "../../data/tasks.json");

function loadTasks() {
  return JSON.parse(fs.readFileSync(FILE, "utf8"));
} 

function persistTasks(tasks) {
  fs.writeFileSync(FILE, JSON.stringify(tasks, null, 2));
} //issaugoom

function getTasks(filters = {}) {
  let tasks = loadTasks();

  if (filters.status) {
    tasks = tasks.filter(t => t.status === filters.status);
  }

  if (filters.due_date) {
    tasks = tasks.filter(t => t.due_date === filters.due_date);
  }

  return tasks;
}

function addTask({ title, due_date, email }) {
  const tasks = loadTasks();
  const newTask = {
    id: Date.now(),
    title,
    status: "pending",
    due_date,
    email,
    reminder_sent: false
  };

  tasks.push(newTask); //prided i masyva
  persistTasks(tasks); //issaugoom atgal i faila
  return newTask; 
}

function updateTask(id, data) {
  const tasks = loadTasks().map(t => (t.id == id ? { ...t, ...data } : t));
  persistTasks(tasks);
}

function updateStatus(id, status) {
  updateTask(id, { status });
}

function removeTask(id) {
  const tasks = loadTasks().filter(t => t.id != id);
  persistTasks(tasks);
} //palieka tik tuos kurie nera su siitu id

module.exports = {
  loadTasks,
  persistTasks,
  getTasks,
  addTask,
  updateTask,
  updateStatus,
  removeTask
}; //exportuojam funkcijas, kad galetum naudot kituose failuose
