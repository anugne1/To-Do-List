const express = require("express");
const { checkAndSendReminders } = require("../jobs/reminders");

const router = express.Router();

router.post("/send-reminders-now", async (req, res) => {
  await checkAndSendReminders();
  res.json({ message: "Reminder check completed" });
}); //rankiniu budu patikrinti ir issiusti priminimus dabar va pat

module.exports = router;
