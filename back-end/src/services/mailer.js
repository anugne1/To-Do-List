const nodemailer = require("nodemailer");

let transporter = null;

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
    }); //sukuriam transporteri

    console.log("Ethereal test account sukurtas:");
    console.log("User:", testAccount.user);
    console.log("Pass:", testAccount.pass);
  } catch (error) {
    console.error("Nepavyko sukurti Ethereal paskyros:", error.message);
  }
}

function getTransporter() {
  return transporter;
}

module.exports = { createMailer, getTransporter };
