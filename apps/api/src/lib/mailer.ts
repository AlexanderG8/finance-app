import nodemailer from 'nodemailer';

// ─── Transporter ──────────────────────────────────────────────────────────────

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

// ─── Shared HTML helpers ──────────────────────────────────────────────────────

function emailWrapper(content: string): string {
  return `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #F8FAFC; padding: 24px; border-radius: 8px;">
      <div style="background: white; border-radius: 8px; padding: 32px; box-shadow: 0 1px 3px rgba(0,0,0,0.1);">
        ${content}
      </div>
      <p style="text-align: center; margin-top: 16px; font-size: 12px; color: #94A3B8;">
        Personal Finance App — Gestión de finanzas personales
      </p>
    </div>
  `;
}

function primaryButton(url: string, label: string): string {
  return `
    <a href="${url}" style="
      display: inline-block;
      padding: 12px 24px;
      background-color: #2E86AB;
      color: white;
      text-decoration: none;
      border-radius: 6px;
      font-weight: bold;
      margin: 16px 0;
    ">${label}</a>
  `;
}

function formatPEN(amount: number): string {
  return new Intl.NumberFormat('es-PE', { style: 'currency', currency: 'PEN' }).format(amount);
}

// ─── 1. Welcome email ─────────────────────────────────────────────────────────

export async function sendWelcomeEmail(name: string, email: string): Promise<void> {
  await sendMail({
    to: email,
    subject: 'Bienvenido a Personal Finance App',
    html: emailWrapper(`
      <h1 style="color: #1E3A5F; margin-top: 0;">Bienvenido, ${name}! 👋</h1>
      <p style="color: #475569;">Tu cuenta en <strong>Personal Finance App</strong> ha sido creada exitosamente.</p>
      <p style="color: #475569;">Ya puedes empezar a gestionar tus finanzas personales: registra gastos, préstamos, deudas y metas de ahorro.</p>
      <hr style="border: none; border-top: 1px solid #E2E8F0; margin: 24px 0;" />
      <p style="color: #2E86AB; margin-bottom: 0;">El equipo de Personal Finance</p>
    `),
    text: `Bienvenido, ${name}! Tu cuenta ha sido creada exitosamente en Personal Finance App.`,
  });
}

// ─── 2. Password reset ────────────────────────────────────────────────────────

export async function sendPasswordResetEmail(email: string, resetUrl: string): Promise<void> {
  await sendMail({
    to: email,
    subject: 'Restablecer contraseña — Personal Finance App',
    html: emailWrapper(`
      <h1 style="color: #1E3A5F; margin-top: 0;">Restablecer contraseña</h1>
      <p style="color: #475569;">Recibimos una solicitud para restablecer tu contraseña.</p>
      <p style="color: #475569;">Haz clic en el siguiente enlace (válido por 1 hora):</p>
      ${primaryButton(resetUrl, 'Restablecer contraseña')}
      <p style="color: #94A3B8; font-size: 13px;">Si no solicitaste esto, puedes ignorar este correo con seguridad.</p>
    `),
    text: `Para restablecer tu contraseña visita: ${resetUrl}`,
  });
}

// ─── 3. Installment reminder (3 days before) ─────────────────────────────────

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
    subject: `Recordatorio: Cuota de préstamo a ${daysUntilDue} día(s)`,
    html: emailWrapper(`
      <h1 style="color: #F4A261; margin-top: 0;">⏰ Recordatorio de cuota</h1>
      <p style="color: #475569;">
        La cuota del préstamo de <strong>${borrowerName}</strong> vence en
        <strong>${daysUntilDue} día(s)</strong>.
      </p>
      <div style="background: #FFF7ED; border-left: 4px solid #F4A261; padding: 16px; border-radius: 4px; margin: 16px 0;">
        <p style="margin: 0; color: #92400E;"><strong>Monto:</strong> ${formatPEN(amount)}</p>
        <p style="margin: 8px 0 0; color: #92400E;"><strong>Fecha de vencimiento:</strong> ${formattedDate}</p>
      </div>
      <p style="color: #94A3B8; font-size: 13px;">Asegúrate de estar al día para mantener un buen historial financiero.</p>
    `),
    text: `Recordatorio: Cuota de ${borrowerName} por S/ ${amount.toFixed(2)} vence el ${formattedDate} (en ${daysUntilDue} día(s)).`,
  });
}

// ─── 4. Overdue installment email ─────────────────────────────────────────────

export async function sendOverdueInstallmentEmail(
  email: string,
  borrowerName: string,
  amount: number,
  dueDate: Date,
  daysOverdue: number
): Promise<void> {
  const formattedDate = dueDate.toLocaleDateString('es-PE', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  await sendMail({
    to: email,
    subject: `Alerta: Cuota de préstamo vencida — ${borrowerName}`,
    html: emailWrapper(`
      <h1 style="color: #E63946; margin-top: 0;">🚨 Cuota vencida</h1>
      <p style="color: #475569;">
        La cuota del préstamo de <strong>${borrowerName}</strong> está vencida
        hace <strong>${daysOverdue} día(s)</strong>.
      </p>
      <div style="background: #FFF1F2; border-left: 4px solid #E63946; padding: 16px; border-radius: 4px; margin: 16px 0;">
        <p style="margin: 0; color: #9F1239;"><strong>Monto vencido:</strong> ${formatPEN(amount)}</p>
        <p style="margin: 8px 0 0; color: #9F1239;"><strong>Fecha de vencimiento:</strong> ${formattedDate}</p>
        <p style="margin: 8px 0 0; color: #9F1239;"><strong>Días de mora:</strong> ${daysOverdue}</p>
      </div>
      <p style="color: #475569;">Te recomendamos contactar a <strong>${borrowerName}</strong> para coordinar el pago pendiente.</p>
    `),
    text: `ALERTA: La cuota de ${borrowerName} por S/ ${amount.toFixed(2)} venció el ${formattedDate} (${daysOverdue} día(s) de mora).`,
  });
}

// ─── 5. Budget alert (>= 80%) ─────────────────────────────────────────────────

export async function sendBudgetAlertEmail(
  email: string,
  categoryName: string,
  categoryEmoji: string,
  spent: number,
  budget: number,
  percentage: number
): Promise<void> {
  const isExceeded = percentage >= 100;
  const headerColor = isExceeded ? '#E63946' : '#F4A261';
  const bgColor = isExceeded ? '#FFF1F2' : '#FFF7ED';
  const borderColor = isExceeded ? '#E63946' : '#F4A261';
  const textColor = isExceeded ? '#9F1239' : '#92400E';
  const icon = isExceeded ? '🚨' : '⚠️';
  const statusLabel = isExceeded ? 'excedido' : 'al límite';

  await sendMail({
    to: email,
    subject: `${icon} Presupuesto de ${categoryName} ${statusLabel} (${percentage.toFixed(0)}%)`,
    html: emailWrapper(`
      <h1 style="color: ${headerColor}; margin-top: 0;">${icon} Alerta de presupuesto</h1>
      <p style="color: #475569;">
        Tu presupuesto de <strong>${categoryEmoji} ${categoryName}</strong> ha alcanzado el
        <strong>${percentage.toFixed(0)}%</strong> del total asignado.
      </p>
      <div style="background: ${bgColor}; border-left: 4px solid ${borderColor}; padding: 16px; border-radius: 4px; margin: 16px 0;">
        <p style="margin: 0; color: ${textColor};"><strong>Gastado:</strong> ${formatPEN(spent)}</p>
        <p style="margin: 8px 0 0; color: ${textColor};"><strong>Presupuesto:</strong> ${formatPEN(budget)}</p>
        <p style="margin: 8px 0 0; color: ${textColor};"><strong>Uso:</strong> ${percentage.toFixed(0)}%</p>
      </div>
      <div style="background: #E2E8F0; border-radius: 99px; height: 8px; overflow: hidden; margin: 16px 0;">
        <div style="background: ${headerColor}; width: ${Math.min(percentage, 100).toFixed(0)}%; height: 100%; border-radius: 99px;"></div>
      </div>
      <p style="color: #475569; font-size: 13px;">
        ${isExceeded
          ? 'Has superado tu presupuesto. Considera reducir gastos en esta categoría.'
          : 'Estás cerca del límite. Revisa tus gastos para no exceder el presupuesto.'}
      </p>
    `),
    text: `Alerta: El presupuesto de ${categoryName} está al ${percentage.toFixed(0)}% (Gastado: S/ ${spent.toFixed(2)} de S/ ${budget.toFixed(2)}).`,
  });
}

// ─── 6. Saving goal milestone email ──────────────────────────────────────────

export async function sendSavingGoalMilestoneEmail(
  email: string,
  goalName: string,
  milestone: 50 | 75 | 100,
  currentAmount: number,
  targetAmount: number
): Promise<void> {
  const isCompleted = milestone === 100;
  const milestoneConfig = {
    50:  { icon: '🎯', headerColor: '#2E86AB', title: '¡Llevas la mitad del camino!', message: 'Ya alcanzaste el 50% de tu meta. Sigue así.' },
    75:  { icon: '🚀', headerColor: '#1E3A5F', title: '¡Casi llegas!',                message: 'Estás al 75%. El esfuerzo está dando frutos.' },
    100: { icon: '🎉', headerColor: '#28A745', title: '¡Meta cumplida!',              message: '¡Felicitaciones! Lograste tu meta de ahorro completa.' },
  }[milestone];

  await sendMail({
    to: email,
    subject: `${milestoneConfig.icon} ${milestone}% de tu meta "${goalName}" ${isCompleted ? '¡Completada!' : 'alcanzado'}`,
    html: emailWrapper(`
      <h1 style="color: ${milestoneConfig.headerColor}; margin-top: 0;">${milestoneConfig.icon} ${milestoneConfig.title}</h1>
      <p style="color: #475569;">
        Tu meta de ahorro <strong>"${goalName}"</strong> ha alcanzado el <strong>${milestone}%</strong>.
      </p>
      <div style="background: #F0FDF4; border-left: 4px solid ${milestoneConfig.headerColor}; padding: 16px; border-radius: 4px; margin: 16px 0;">
        <p style="margin: 0; color: #166534;"><strong>Ahorrado:</strong> ${formatPEN(currentAmount)}</p>
        <p style="margin: 8px 0 0; color: #166534;"><strong>Meta:</strong> ${formatPEN(targetAmount)}</p>
        <p style="margin: 8px 0 0; color: #166534;"><strong>Progreso:</strong> ${milestone}%</p>
      </div>
      <div style="background: #E2E8F0; border-radius: 99px; height: 8px; overflow: hidden; margin: 16px 0;">
        <div style="background: ${milestoneConfig.headerColor}; width: ${milestone}%; height: 100%; border-radius: 99px;"></div>
      </div>
      <p style="color: #475569; font-size: 13px;">${milestoneConfig.message}</p>
    `),
    text: `${milestoneConfig.icon} Tu meta "${goalName}" alcanzó el ${milestone}% (S/ ${currentAmount.toFixed(2)} de S/ ${targetAmount.toFixed(2)}).`,
  });
}
