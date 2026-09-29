import nodemailer, { type Transporter } from "nodemailer";

import { env } from "../config/env";

export interface VerificationMail {
  to: string;
  name: string;
  code: string;
  minutes: number;
}

export const mailEnabled = Boolean(env.MAIL_USER && env.MAIL_PASS);

const from = env.MAIL_FROM || `ChatLive <${env.MAIL_USER}>`;

let transporter: Transporter | null = null;

function transport(): Transporter {
  if (!transporter) {
    transporter = nodemailer.createTransport({
      host: env.MAIL_HOST,
      port: env.MAIL_PORT,
      secure: env.MAIL_PORT === 465,
      auth: { user: env.MAIL_USER, pass: env.MAIL_PASS },
    });
  }
  return transporter;
}

function spaced(code: string): string {
  return `${code.slice(0, 3)} ${code.slice(3)}`;
}

function textBody({ name, code, minutes }: VerificationMail): string {
  return [
    `Hello ${name},`,
    "",
    "Here is the confirmation code for your ChatLive sign-up:",
    "",
    `    ${spaced(code)}`,
    "",
    `This code is valid for ${minutes} minutes.`,
    "",
    "If you did not create a ChatLive account, simply ignore this",
    "message: without this code, no account will be activated.",
    "",
    "— The ChatLive team",
  ].join("\n");
}

function htmlBody({ name, code, minutes }: VerificationMail): string {
  return `<div style="margin:0;padding:32px 12px;background:#f4f5fb;font-family:Segoe UI,Roboto,Helvetica,Arial,sans-serif;color:#1b1d2a">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:520px;margin:0 auto;background:#ffffff;border-radius:16px;overflow:hidden;border:1px solid #e6e7f2">
    <tr>
      <td style="padding:28px 32px 8px">
        <p style="margin:0;font-size:13px;letter-spacing:.12em;text-transform:uppercase;color:#6b6f8f">ChatLive</p>
        <h1 style="margin:12px 0 0;font-size:22px;line-height:1.3">Confirm your email address</h1>
      </td>
    </tr>
    <tr>
      <td style="padding:12px 32px 0;font-size:15px;line-height:1.6;color:#3a3d55">
        <p style="margin:0 0 16px">Hello ${escapeHtml(name)},</p>
        <p style="margin:0 0 8px">Enter this code on the confirmation page to activate your account:</p>
      </td>
    </tr>
    <tr>
      <td align="center" style="padding:20px 32px">
        <div style="display:inline-block;padding:16px 28px;border-radius:14px;background:#f0f1fb;border:1px solid #dcdef3;font-size:32px;font-weight:700;letter-spacing:.22em;color:#3b2fd0">${spaced(code)}</div>
      </td>
    </tr>
    <tr>
      <td style="padding:0 32px 28px;font-size:14px;line-height:1.6;color:#5b5f7d">
        <p style="margin:0 0 12px">This code is valid for <strong>${minutes} minutes</strong>.</p>
        <p style="margin:0">If you did not create a ChatLive account, ignore this message: without this code, no account will be activated.</p>
      </td>
    </tr>
  </table>
</div>`;
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

export async function sendVerificationCode(mail: VerificationMail): Promise<boolean> {
  if (!mailEnabled) {
    console.warn(
      `[mail] MAIL_USER/MAIL_PASS absents du .env : aucun e-mail envoye.\n` +
        `[mail] Code de confirmation pour ${mail.to} : ${mail.code} ` +
        `(valable ${mail.minutes} minutes)`,
    );
    return false;
  }
  try {
    await transport().sendMail({
      from,
      to: mail.to,
      subject: `${spaced(mail.code)} is your ChatLive confirmation code`,
      text: textBody(mail),
      html: htmlBody(mail),
    });
    return true;
  } catch (error) {
    console.error(`[mail] Envoi du code a ${mail.to} impossible :`, error);
    return false;
  }
}

export default { sendVerificationCode, mailEnabled };
