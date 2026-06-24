import nodemailer from "nodemailer";
import { env } from "../config/env.js";

let transporter = null;

function getTransporter() {
  if (transporter) return transporter;
  if (!env.outlookUser || !env.outlookPass) return null;
  transporter = nodemailer.createTransport({
    host: "smtp-mail.outlook.com",
    port: 587,
    secure: false, // STARTTLS
    auth: { user: env.outlookUser, pass: env.outlookPass },
  });
  return transporter;
}

export async function sendBillReminder(to, { name, amount, dueDay, currency }) {
  const tx = getTransporter();
  const subject = `Reminder: ${name} due on day ${dueDay}`;
  const text = `Hi,\n\nYour bill "${name}" of ${currency} ${amount} is due on day ${dueDay} this month.\nIf it isn't marked paid by then, the app will auto-deduct it from your budget. You can edit the amount or mark it paid anytime.\n\n— Budget Computer`;

  if (!tx) {
    console.log(`[email] (no SMTP configured) would send to ${to}: ${subject}`);
    return { sent: false, reason: "smtp_not_configured" };
  }
  await tx.sendMail({ from: env.outlookUser, to, subject, text });
  return { sent: true };
}
