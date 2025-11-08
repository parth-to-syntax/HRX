import nodemailer from 'nodemailer';

function toBool(v, def = false) {
  if (v === undefined) return def;
  return String(v).toLowerCase() === 'true';
}

function buildTransporter() {
  // Prefer explicit SMTP_*; fallback to Gmail if EMAIL_USER/EMAIL_PASS provided
  const host = process.env.SMTP_HOST || (process.env.EMAIL_USER ? 'smtp.gmail.com' : undefined);
  const port = parseInt(process.env.SMTP_PORT || (process.env.EMAIL_USER ? '587' : '0'), 10) || 587;
  const user = process.env.SMTP_USER || process.env.EMAIL_USER;
  const pass = process.env.SMTP_PASS || (process.env.EMAIL_PASS ? process.env.EMAIL_PASS.replace(/\s+/g, '') : undefined);

  if (!host || !user || !pass) {
    return null; // No mail transport configured
  }

  // TLS/SSL options (dev-friendly overrides allowed via env)
  const secure = toBool(process.env.SMTP_SECURE, port === 465 || false);
  const ignoreTLS = toBool(process.env.SMTP_IGNORE_TLS, false);
  const requireTLS = toBool(process.env.SMTP_REQUIRE_TLS, false);
  const rejectUnauthorized = process.env.SMTP_REJECT_UNAUTHORIZED !== undefined
    ? toBool(process.env.SMTP_REJECT_UNAUTHORIZED)
    : !toBool(process.env.EMAIL_INSECURE_TLS, false); // EMAIL_INSECURE_TLS=true => do not reject

  const transporter = nodemailer.createTransport({
    host,
    port,
    secure, // true for 465, false for 587 STARTTLS
    ignoreTLS,
    requireTLS,
    auth: { user, pass },
    tls: { rejectUnauthorized },
  });
  return transporter;
}

export async function sendMail({ to, subject, text, html }) {
  const transporter = buildTransporter();
  if (!transporter) {
    // For MVP: if no transporter, just log and resolve
    console.warn('Email not configured; skipping send. Subject:', subject);
    return { skipped: true };
  }
  const from = process.env.SMTP_FROM || process.env.EMAIL_USER || 'no-reply@workzen.local';
  return transporter.sendMail({ from, to, subject, text, html });
}

export function isEmailConfigured() {
  return !!(process.env.SMTP_HOST || process.env.EMAIL_USER);
}

export async function verifyEmail() {
  const transporter = buildTransporter();
  if (!transporter) {
    return { configured: false, ok: false, message: 'Email not configured' };
  }
  try {
    const info = await transporter.verify();
    return { configured: true, ok: true, message: 'Transport verified', info };
  } catch (e) {
    return { configured: true, ok: false, message: e.message };
  }
}
