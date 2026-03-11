import nodemailer from 'nodemailer';

function createTransporter(): nodemailer.Transporter {
  const host = process.env['SMTP_HOST'];
  const port = parseInt(process.env['SMTP_PORT'] ?? '587', 10);
  const user = process.env['SMTP_USER'];
  const pass = process.env['SMTP_PASS'];

  if (!host || !user || !pass) {
    throw new Error('SMTP configuration is incomplete. Check SMTP_HOST, SMTP_USER, SMTP_PASS env vars.');
  }

  return nodemailer.createTransport({
    host,
    port,
    secure: port === 465,
    auth: { user, pass },
  });
}

interface SendMailOptions {
  to: string;
  subject: string;
  html: string;
  text?: string;
}

export async function sendMail(options: SendMailOptions): Promise<void> {
  const transporter = createTransporter();
  const from = process.env['SMTP_FROM'] ?? process.env['SMTP_USER'];

  await transporter.sendMail({
    from,
    to: options.to,
    subject: options.subject,
    html: options.html,
    text: options.text,
  });
}

export async function sendWelcomeEmail(name: string, email: string): Promise<void> {
  await sendMail({
    to: email,
    subject: 'Bienvenido a Personal Finance App',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h1 style="color: #1E3A5F;">Bienvenido, ${name}!</h1>
        <p>Tu cuenta en <strong>Personal Finance App</strong> ha sido creada exitosamente.</p>
        <p>Ya puedes empezar a gestionar tus finanzas personales.</p>
        <p style="color: #2E86AB;">El equipo de Personal Finance</p>
      </div>
    `,
    text: `Bienvenido, ${name}! Tu cuenta ha sido creada exitosamente.`,
  });
}

export async function sendPasswordResetEmail(email: string, resetUrl: string): Promise<void> {
  await sendMail({
    to: email,
    subject: 'Restablecer contraseña — Personal Finance App',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h1 style="color: #1E3A5F;">Restablecer contraseña</h1>
        <p>Recibimos una solicitud para restablecer tu contraseña.</p>
        <p>Haz clic en el siguiente enlace (válido por 1 hora):</p>
        <a href="${resetUrl}" style="
          display: inline-block;
          padding: 12px 24px;
          background-color: #2E86AB;
          color: white;
          text-decoration: none;
          border-radius: 6px;
          margin: 16px 0;
        ">Restablecer contraseña</a>
        <p>Si no solicitaste esto, ignora este correo.</p>
      </div>
    `,
    text: `Para restablecer tu contraseña visita: ${resetUrl}`,
  });
}

export async function sendInstallmentReminderEmail(
  email: string,
  borrowerName: string,
  amount: number,
  dueDate: Date,
  daysUntilDue: number
): Promise<void> {
  const formattedDate = dueDate.toLocaleDateString('es-PE', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  await sendMail({
    to: email,
    subject: `Recordatorio: Cuota de préstamo a ${daysUntilDue} días`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h1 style="color: #F4A261;">Recordatorio de cuota</h1>
        <p>La cuota del préstamo de <strong>${borrowerName}</strong> vence en ${daysUntilDue} días.</p>
        <ul>
          <li><strong>Monto:</strong> S/ ${amount.toFixed(2)}</li>
          <li><strong>Fecha de vencimiento:</strong> ${formattedDate}</li>
        </ul>
      </div>
    `,
    text: `Cuota de ${borrowerName} por S/ ${amount.toFixed(2)} vence el ${formattedDate}.`,
  });
}
