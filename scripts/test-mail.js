// scripts/test-mail.js
import 'dotenv/config';
import nodemailer from 'nodemailer';

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || 'sandbox.smtp.mailtrap.io',
  port: Number(process.env.SMTP_PORT || 2525),
  secure: false,
  auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS },
});

const info = await transporter.sendMail({
  from: process.env.SMTP_FROM || 'MUDECOOP <no-reply@mudecoop.cr>',
  to: 'admin@mudecoop.cr',
  subject: 'Prueba Mailtrap ✅',
  text: 'Hola, esto es una prueba desde MUDECOOP.',
  html: '<p><b>Hola</b>, esto es una prueba desde MUDECOOP.</p>',
});

console.log('Enviado:', info.messageId);
