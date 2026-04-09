const nodemailer = require("nodemailer");
const { getTransporter } = require("../services/mailer");
const { loadTasks, persistTasks } = require("../services/tasksService");

async function checkAndSendReminders() {
	const transporter = getTransporter();
	if (!transporter) {
		console.log("Mailer dar neparuoštas.");
		return;
	}

	const tasks = loadTasks();
	let changed = false;
	const now = new Date();

	for (const task of tasks) {
		if (!task.due_date || !task.email || task.reminder_sent) {
			continue;
		} //jei ner tu duomenu tai skippinam

		const dueDate = new Date(task.due_date);
		const diffMs = dueDate - now;
		const diffDays = diffMs / (1000 * 60 * 60 * 24); //konvertuojam i dienas

		if (diffDays <= 3 && diffDays > 0) {
			try {
				const info = await transporter.sendMail({
					from: '"ToDo App" <todo@test.com>',
					to: task.email,
					subject: "Priminimas apie artėjančią užduotį",
					text: `Sveiki! Primename, kad užduotis "${task.title}" turi terminą ${task.due_date}.`
				});

				console.log(`Priminimas išsiųstas uždučiai: ${task.title}`);
				console.log("Peržiūros nuoroda:", nodemailer.getTestMessageUrl(info));

				task.reminder_sent = true;
				changed = true;
			} catch (error) {
				console.error("Klaida siunčiant laišką:", error.message);
			}
		}
	}

	if (changed) {
		persistTasks(tasks);
	} //jei buvo pakeista bent viena uzduotis, issaugom atgal i faila
}

function startReminderJob(intervalMs = 60000) {
	setInterval(() => {
		checkAndSendReminders();
	}, intervalMs);
} // tikrinam kas minute

module.exports = { checkAndSendReminders, startReminderJob };
