/**
 * Email service.
 *
 * Transport strategy:
 *   - If SMTP_* env vars are set  → send for real via Nodemailer (Phase 9).
 *   - Otherwise (development)      → "console transport": we log the message
 *                                    and, crucially, the action link so you
 *                                    can test verification / reset flows with
 *                                    no mail provider configured.
 *
 * Callers use the high-level helpers (sendVerificationEmail, …) and never
 * touch the transport directly — so swapping providers later changes nothing
 * elsewhere.
 */
import nodemailer from 'nodemailer';
import env from '../config/env.js';
import logger from '../utils/logger.js';

let cachedTransport;

/** Build (once) a real SMTP transport, or return null if unconfigured. */
function getTransport() {
  if (cachedTransport !== undefined) return cachedTransport;

  const { host, port, user, pass } = env.email.smtp;
  if (host && user && pass) {
    cachedTransport = nodemailer.createTransport({
      host,
      port,
      secure: port === 465, // 465 = implicit TLS; 587 = STARTTLS
      auth: { user, pass },
    });
  } else {
    cachedTransport = null; // dev / console mode
  }
  return cachedTransport;
}

/** True when real SMTP credentials are present (i.e. mail actually sends). */
export function isEmailConfigured() {
  return getTransport() !== null;
}

/** Low-level send. Falls back to logging in development. */
async function sendEmail({ to, subject, html, text }) {
  const transport = getTransport();

  if (!transport) {
    logger.info('──────────── 📧 DEV EMAIL (not actually sent) ────────────');
    logger.info(`To:      ${to}`);
    logger.info(`Subject: ${subject}`);
    if (text) logger.info(`\n${text}`);
    logger.info('──────────────────────────────────────────────────────────');
    return { delivered: false };
  }

  try {
    const info = await transport.sendMail({ from: env.email.from, to, subject, html, text });
    logger.info(`Email sent to ${to} (id: ${info.messageId})`);
    return { delivered: true, messageId: info.messageId };
  } catch (error) {
    // Never let a mail-transport failure bubble into a request. Provider errors
    // ("535 Username and Password not accepted", quota, DNS) are operator
    // problems, not something to show a student mid-signup — and letting them
    // throw here would fail a registration whose account was already created.
    logger.error(`Email to ${to} failed: ${error.message}`);
    // Fall back to the console link so local development still works when
    // credentials are wrong.
    if (text) logger.info(`Undelivered email body:\n${text}`);
    return { delivered: false, error: error.message };
  }
}

// Base URL the frontend serves its pages from (first allowed client origin).
const clientBaseUrl = env.clientUrls[0];

/** Verification email with a link the user clicks to confirm their address. */
export async function sendVerificationEmail(user, rawToken) {
  const url = `${clientBaseUrl}/verify-email?token=${rawToken}`;
  return sendEmail({
    to: user.email,
    subject: 'Verify your Squadly email',
    text: `Hi ${user.name},\n\nConfirm your email to activate your Squadly account:\n${url}\n\nThis link expires in ${env.auth.emailTokenExpiresMinutes} minutes.`,
    html: `<p>Hi ${user.name},</p>
           <p>Confirm your email to activate your Squadly account:</p>
           <p><a href="${url}">Verify my email</a></p>
           <p>This link expires in ${env.auth.emailTokenExpiresMinutes} minutes.</p>`,
  });
}

/** Password-reset email with a link to the reset page. */
export async function sendPasswordResetEmail(user, rawToken) {
  const url = `${clientBaseUrl}/reset-password?token=${rawToken}`;
  return sendEmail({
    to: user.email,
    subject: 'Reset your Squadly password',
    text: `Hi ${user.name},\n\nReset your Squadly password using the link below:\n${url}\n\nIf you didn't request this, you can safely ignore this email.\nThis link expires in ${env.auth.emailTokenExpiresMinutes} minutes.`,
    html: `<p>Hi ${user.name},</p>
           <p>Reset your Squadly password using the link below:</p>
           <p><a href="${url}">Reset my password</a></p>
           <p>If you didn't request this, you can safely ignore this email.</p>
           <p>This link expires in ${env.auth.emailTokenExpiresMinutes} minutes.</p>`,
  });
}

/** Notify a post's author that someone expressed interest in it. */
export async function sendInterestEmail(author, fromUser, post, message = '') {
  const url = `${clientBaseUrl}/posts/${post.id}`;
  const noteText = message ? `\n\nTheir note: "${message}"` : '';
  const noteHtml = message ? `<p><em>Their note:</em> "${message}"</p>` : '';

  return sendEmail({
    to: author.email,
    subject: `${fromUser.name} is interested in "${post.title}"`,
    text: `Hi ${author.name},\n\n${fromUser.name} is interested in your opportunity "${post.title}".${noteText}\n\nView it here:\n${url}`,
    html: `<p>Hi ${author.name},</p>
           <p><strong>${fromUser.name}</strong> is interested in your opportunity <strong>"${post.title}"</strong>.</p>
           ${noteHtml}
           <p><a href="${url}">View the opportunity</a></p>`,
  });
}
