const express = require("express");
const cors = require("cors");
const fs = require("fs");
const https = require("https");
const path = require("path");
const tasksRoutes = require("./src/routes/tasks");
const remindersRoutes = require("./src/routes/reminders");
const { createMailer } = require("./src/services/mailer");
const { startReminderJob } = require("./src/jobs/reminders");

const HTTPS_PORT = 3001;
const certDir = path.join(__dirname, "certs");
const keyPath = path.join(certDir, "key.pem");
const certPath = path.join(certDir, "cert.pem");
const app = express();
app.use(
  cors({
    origin: (origin, callback) => {
      callback(null, true);
    }
  })
); //ijungiamas corsas, leidzia visiem domenams kreiptis i  API
app.use(express.json());
app.use("/tasks", tasksRoutes);
app.use("/", remindersRoutes); //prijungiami routai

console.log("NAUJA SERVERIO VERSIJA UZKRAUTA");

const credentials = {
  key: fs.readFileSync(keyPath),
  cert: fs.readFileSync(certPath)
};

const httpsServer = https.createServer(credentials, app); //sukuriam https serveri
httpsServer.listen(HTTPS_PORT, async () => {
  console.log(`HTTPS server running on https://localhost:${HTTPS_PORT}`);
  await createMailer();
  startReminderJob();
});
//paleidus sukuriam meileri ir reminder darba

