import nodemailer from 'nodemailer';
import { logger } from './logger';

interface SendInviteParams {
  to: string;
  name: string;
  role: string;
  inviteUrl: string;
  tempPassword?: string;
}

const getSmtpConfig = () => {
  const host = process.env.SMTP_HOST;
  const port = parseInt(process.env.SMTP_PORT || '587', 10);
  const user = process.env.SMTP_USER?.trim();
  // Gmail shows app passwords in groups of four ("abcd efgh ijkl mnop"); spaces are not part of it
  const pass = process.env.SMTP_PASS?.replace(/\s+/g, '');
  const secure = process.env.SMTP_SECURE === 'true' || port === 465;
  return { host, port, user, pass, secure, configured: !!(host && user && pass) };
};

let cachedTransporter: nodemailer.Transporter | null = null;

const createTransporter = () => {
  const { host, port, user, pass, secure, configured } = getSmtpConfig();

  if (configured) {
    if (!cachedTransporter) {
      cachedTransporter = nodemailer.createTransport({
        host,
        port,
        secure,
        auth: { user, pass },
        connectionTimeout: 15000,
        greetingTimeout: 15000,
      });
    }
    return cachedTransporter;
  }

  // Fallback: dev-mode logger (no real SMTP credentials configured)
  logger.warn('[Email] SMTP credentials not found (SMTP_HOST / SMTP_USER / SMTP_PASS missing). Falling back to DEV mode — emails will NOT be sent.');
  return {
    sendMail: async (options: any) => {
      logger.info('=============== EMAIL DISPATCHED (DEV MODE) ===============');
      logger.info(`To: ${options.to}`);
      logger.info(`Subject: ${options.subject}`);
      logger.info(`Link: ${inviteLinkFromHtml(options.html)}`);
      logger.info('===========================================================');
      return { messageId: 'dev-mode-mock-id' };
    },
  } as any;
};

/** Explains common SMTP failures in plain words for the server log. */
const describeSmtpError = (error: any): string => {
  const code = error?.code || '';
  const response = String(error?.response || error?.message || '');
  if (code === 'EAUTH' || response.includes('535')) {
    return 'SMTP login rejected. For Gmail, SMTP_PASS must be a 16-character App Password (Google Account > Security > 2-Step Verification > App passwords), not the normal account password.';
  }
  if (['ETIMEDOUT', 'ECONNECTION', 'ESOCKET', 'ECONNREFUSED'].includes(code)) {
    return `Could not reach ${process.env.SMTP_HOST}:${process.env.SMTP_PORT}. The host may block outbound SMTP ports (many VPS providers block 25/465/587 by default).`;
  }
  return response.slice(0, 300);
};

/**
 * Checks the SMTP login at startup so a broken email setup shows up in the server log
 * immediately, instead of silently failing on the first password reset.
 */
export const verifyEmailTransport = async (): Promise<boolean> => {
  const { host, port, user, configured } = getSmtpConfig();
  if (!configured) {
    logger.warn('[Email] SMTP not configured. Emails will only be logged, not sent.');
    return false;
  }
  try {
    await (createTransporter() as nodemailer.Transporter).verify();
    logger.info(`[Email] SMTP ready: ${user} via ${host}:${port}`);
    return true;
  } catch (error) {
    logger.error(`[Email] SMTP verification FAILED: ${describeSmtpError(error)}`);
    return false;
  }
};

const inviteLinkFromHtml = (html: string): string => {
  const match = html.match(/href="([^"]+)"/);
  return match ? match[1] : 'N/A';
};

interface SendResetPasswordParams {
  to: string;
  name: string;
  resetUrl: string;
}

export const sendResetPasswordEmail = async ({
  to,
  name,
  resetUrl,
}: SendResetPasswordParams): Promise<boolean> => {
  const transporter = createTransporter();
  const from = process.env.SMTP_FROM || '"WebBlaze PMS" <no-reply@webblaze.com>';

  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <title>Reset Your Password - WebBlaze PMS</title>
      <style>
        body { font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background-color: #f8fafc; margin: 0; padding: 20px; color: #0f172a; }
        .container { max-width: 580px; margin: 0 auto; background: #ffffff; border-radius: 16px; border: 1px solid #e8ecf4; overflow: hidden; }
        .header { background: linear-gradient(135deg, #173775 0%, #2563eb 50%, #4f46e5 100%); padding: 32px 24px; text-align: center; color: #ffffff; }
        .header h1 { margin: 0; font-size: 24px; font-weight: 800; letter-spacing: -0.02em; }
        .header p { margin: 6px 0 0; font-size: 14px; opacity: 0.9; }
        .body { padding: 32px 28px; }
        .greeting { font-size: 18px; font-weight: 700; color: #0f172a; margin-bottom: 12px; }
        .text { font-size: 15px; line-height: 1.6; color: #334155; margin-bottom: 24px; }
        .cta-box { text-align: center; margin: 32px 0; }
        .btn { display: inline-block; background: linear-gradient(135deg, #3b82f6 0%, #6366f1 100%); color: #ffffff !important; text-decoration: none; font-weight: 700; font-size: 15px; padding: 14px 32px; border-radius: 10px; box-shadow: 0 4px 14px rgba(59, 130, 246, 0.35); }
        .footer { border-top: 1px solid #f1f4f9; padding: 20px 28px; font-size: 12px; color: #94a3b8; text-align: center; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>WebBlaze PMS</h1>
          <p>Password Reset Request</p>
        </div>
        <div class="body">
          <div class="greeting">Hello ${name},</div>
          <p class="text">
            We received a request to reset your password for your WebBlaze PMS account. Click the button below to choose a new password:
          </p>

          <div class="cta-box">
            <a href="${resetUrl}" class="btn" target="_blank">Reset Password</a>
          </div>

          <p class="text" style="font-size: 13px; color: #64748b;">
            This link will expire in 1 hour. If you did not request a password reset, you can safely ignore this email.
            <br/><br/>
            If the button doesn't work, copy and paste this link into your browser:<br/>
            <a href="${resetUrl}" style="color: #2563eb;">${resetUrl}</a>
          </p>
        </div>
        <div class="footer">
          &copy; ${new Date().getFullYear()} WebBlaze PMS. All rights reserved.
        </div>
      </div>
    </body>
    </html>
  `;

  try {
    await transporter.sendMail({
      from,
      to,
      subject: 'Reset your WebBlaze PMS password',
      html,
    });
    logger.info(`Password reset email dispatched successfully to ${to}`);
    return true;
  } catch (error) {
    logger.error(`[Email] Failed to send password reset email to ${to}: ${describeSmtpError(error)}`);
    return false;
  }
};

export const sendInviteEmail = async ({
  to,
  name,
  role,
  inviteUrl,
  tempPassword,
}: SendInviteParams): Promise<void> => {
  const transporter = createTransporter();
  const from = process.env.SMTP_FROM || '"WebBlaze PMS" <no-reply@webblaze.com>';

  const formattedRole = role.replace('_', ' ').toUpperCase();

  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <title>Invitation to WebBlaze PMS</title>
      <style>
        body { font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background-color: #f8fafc; margin: 0; padding: 20px; color: #0f172a; }
        .container { max-width: 580px; margin: 0 auto; background: #ffffff; border-radius: 16px; border: 1px solid #e8ecf4; overflow: hidden; }
        .header { background: linear-gradient(135deg, #173775 0%, #2563eb 50%, #4f46e5 100%); padding: 32px 24px; text-align: center; color: #ffffff; }
        .header h1 { margin: 0; font-size: 24px; font-weight: 800; letter-spacing: -0.02em; }
        .header p { margin: 6px 0 0; font-size: 14px; opacity: 0.9; }
        .body { padding: 32px 28px; }
        .greeting { font-size: 18px; font-weight: 700; color: #0f172a; margin-bottom: 12px; }
        .text { font-size: 15px; line-height: 1.6; color: #334155; margin-bottom: 24px; }
        .card { background: #f8fafc; border: 1px solid #e8ecf4; border-radius: 12px; padding: 18px 20px; margin-bottom: 24px; }
        .card-item { font-size: 14px; color: #475569; margin-bottom: 6px; }
        .card-item strong { color: #0f172a; }
        .cta-box { text-align: center; margin: 32px 0; }
        .btn { display: inline-block; background: linear-gradient(135deg, #3b82f6 0%, #6366f1 100%); color: #ffffff !important; text-decoration: none; font-weight: 700; font-size: 15px; padding: 14px 32px; border-radius: 10px; box-shadow: 0 4px 14px rgba(59, 130, 246, 0.35); }
        .footer { border-top: 1px solid #f1f4f9; padding: 20px 28px; font-size: 12px; color: #94a3b8; text-align: center; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>WebBlaze PMS</h1>
          <p>Project Management System</p>
        </div>
        <div class="body">
          <div class="greeting">Hello ${name},</div>
          <p class="text">
            You have been invited to join <strong>WebBlaze PMS</strong> as a <strong>${formattedRole}</strong>. Click the link below to access your workspace portal immediately:
          </p>
          
          <div class="card">
            <div class="card-item"><strong>Account Email:</strong> ${to}</div>
            <div class="card-item"><strong>Role:</strong> ${formattedRole}</div>
            ${tempPassword ? `<div class="card-item"><strong>Temporary Password:</strong> <code>${tempPassword}</code></div>` : ''}
          </div>

          <div class="cta-box">
            <a href="${inviteUrl}" class="btn" target="_blank">Accept Invitation & Access Portal</a>
          </div>

          <p class="text" style="font-size: 13px; color: #64748b;">
            If the button doesn't work, copy and paste this URL into your web browser:<br/>
            <a href="${inviteUrl}" style="color: #2563eb;">${inviteUrl}</a>
          </p>
        </div>
        <div class="footer">
          &copy; ${new Date().getFullYear()} WebBlaze PMS. All rights reserved.
        </div>
      </div>
    </body>
    </html>
  `;

  try {
    const info = await transporter.sendMail({
      from,
      to,
      subject: 'You have been invited to WebBlaze PMS',
      html,
    });
    logger.info(`[Email] Invitation dispatched successfully to ${to} (messageId: ${info.messageId})`);
  } catch (error: any) {
    logger.error(`[Email] Failed to send invitation email to ${to}: ${describeSmtpError(error)}`);
    logger.error('[Email] Full SMTP error:', error);
  }
};

interface SendTaskAssignmentParams {
  to: string;
  assigneeName: string;
  taskTitle: string;
  taskDescription?: string;
  estimatedHours: number;
  department?: string;
  taskUrl: string;
}

export const sendTaskAssignmentEmail = async ({
  to,
  assigneeName,
  taskTitle,
  taskDescription,
  estimatedHours,
  department,
  taskUrl,
}: SendTaskAssignmentParams): Promise<void> => {
  const transporter = createTransporter();
  const from = process.env.SMTP_FROM || '"WebBlaze PMS" <no-reply@webblaze.com>';

  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <title>New Task Assigned - WebBlaze PMS</title>
      <style>
        body { font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background-color: #f8fafc; margin: 0; padding: 20px; color: #0f172a; }
        .container { max-width: 580px; margin: 0 auto; background: #ffffff; border-radius: 16px; border: 1px solid #e8ecf4; overflow: hidden; }
        .header { background: linear-gradient(135deg, #173775 0%, #2563eb 50%, #4f46e5 100%); padding: 32px 24px; text-align: center; color: #ffffff; }
        .header h1 { margin: 0; font-size: 24px; font-weight: 800; letter-spacing: -0.02em; }
        .header p { margin: 6px 0 0; font-size: 14px; opacity: 0.9; }
        .body { padding: 32px 28px; }
        .greeting { font-size: 18px; font-weight: 700; color: #0f172a; margin-bottom: 12px; }
        .text { font-size: 15px; line-height: 1.6; color: #334155; margin-bottom: 24px; }
        .card { background: #f8fafc; border: 1px solid #e8ecf4; border-radius: 12px; padding: 18px 20px; margin-bottom: 24px; }
        .card-item { font-size: 14px; color: #475569; margin-bottom: 6px; }
        .card-item strong { color: #0f172a; }
        .cta-box { text-align: center; margin: 32px 0; }
        .btn { display: inline-block; background: linear-gradient(135deg, #3b82f6 0%, #6366f1 100%); color: #ffffff !important; text-decoration: none; font-weight: 700; font-size: 15px; padding: 14px 32px; border-radius: 10px; box-shadow: 0 4px 14px rgba(59, 130, 246, 0.35); }
        .footer { border-top: 1px solid #f1f4f9; padding: 20px 28px; font-size: 12px; color: #94a3b8; text-align: center; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>WebBlaze PMS</h1>
          <p>Task Assignment Notice</p>
        </div>
        <div class="body">
          <div class="greeting">Hello ${assigneeName},</div>
          <p class="text">
            A new task has been assigned to you in WebBlaze PMS:
          </p>

          <div class="card">
            <div class="card-item"><strong>Task:</strong> ${taskTitle}</div>
            ${department ? `<div class="card-item"><strong>Department:</strong> ${department}</div>` : ''}
            <div class="card-item"><strong>Estimated Time:</strong> ${estimatedHours}h</div>
            ${taskDescription ? `<div class="card-item"><strong>Description:</strong> ${taskDescription}</div>` : ''}
          </div>

          <div class="cta-box">
            <a href="${taskUrl}" class="btn" target="_blank">View Task & Start Work</a>
          </div>
        </div>
        <div class="footer">
          &copy; ${new Date().getFullYear()} WebBlaze PMS. All rights reserved.
        </div>
      </div>
    </body>
    </html>
  `;

  try {
    await transporter.sendMail({
      from,
      to,
      subject: `New Task Assigned: ${taskTitle}`,
      html,
    });
    logger.info(`Task assignment email dispatched successfully to ${to}`);
  } catch (error) {
    logger.error(`[Email] Failed to send task assignment email to ${to}: ${describeSmtpError(error)}`);
  }
};

interface SendTaskStatusChangeParams {
  to: string;
  recipientName: string;
  taskTitle: string;
  oldStatus: string;
  newStatus: string;
  taskUrl: string;
}

export const sendTaskStatusChangeEmail = async ({
  to,
  recipientName,
  taskTitle,
  oldStatus,
  newStatus,
  taskUrl,
}: SendTaskStatusChangeParams): Promise<void> => {
  const transporter = createTransporter();
  const from = process.env.SMTP_FROM || '"WebBlaze PMS" <no-reply@webblaze.com>';

  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <title>Task Status Updated - WebBlaze PMS</title>
      <style>
        body { font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background-color: #f8fafc; margin: 0; padding: 20px; color: #0f172a; }
        .container { max-width: 580px; margin: 0 auto; background: #ffffff; border-radius: 16px; border: 1px solid #e8ecf4; overflow: hidden; }
        .header { background: linear-gradient(135deg, #173775 0%, #2563eb 50%, #4f46e5 100%); padding: 32px 24px; text-align: center; color: #ffffff; }
        .header h1 { margin: 0; font-size: 24px; font-weight: 800; letter-spacing: -0.02em; }
        .header p { margin: 6px 0 0; font-size: 14px; opacity: 0.9; }
        .body { padding: 32px 28px; }
        .greeting { font-size: 18px; font-weight: 700; color: #0f172a; margin-bottom: 12px; }
        .text { font-size: 15px; line-height: 1.6; color: #334155; margin-bottom: 24px; }
        .card { background: #f8fafc; border: 1px solid #e8ecf4; border-radius: 12px; padding: 18px 20px; margin-bottom: 24px; }
        .card-item { font-size: 14px; color: #475569; margin-bottom: 6px; }
        .card-item strong { color: #0f172a; }
        .cta-box { text-align: center; margin: 32px 0; }
        .btn { display: inline-block; background: linear-gradient(135deg, #3b82f6 0%, #6366f1 100%); color: #ffffff !important; text-decoration: none; font-weight: 700; font-size: 15px; padding: 14px 32px; border-radius: 10px; box-shadow: 0 4px 14px rgba(59, 130, 246, 0.35); }
        .footer { border-top: 1px solid #f1f4f9; padding: 20px 28px; font-size: 12px; color: #94a3b8; text-align: center; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>WebBlaze PMS</h1>
          <p>Task Update Notification</p>
        </div>
        <div class="body">
          <div class="greeting">Hello ${recipientName},</div>
          <p class="text">
            The status of task <strong>${taskTitle}</strong> has changed from <strong>${oldStatus.replace('_', ' ')}</strong> to <strong>${newStatus.replace('_', ' ')}</strong>.
          </p>

          <div class="cta-box">
            <a href="${taskUrl}" class="btn" target="_blank">View Task</a>
          </div>
        </div>
        <div class="footer">
          &copy; ${new Date().getFullYear()} WebBlaze PMS. All rights reserved.
        </div>
      </div>
    </body>
    </html>
  `;

  try {
    await transporter.sendMail({
      from,
      to,
      subject: `Task Status Update: ${taskTitle} is now ${newStatus.replace('_', ' ')}`,
      html,
    });
    logger.info(`Task status change email dispatched successfully to ${to}`);
  } catch (error) {
    logger.error(`[Email] Failed to send task status email to ${to}: ${describeSmtpError(error)}`);
  }
};

