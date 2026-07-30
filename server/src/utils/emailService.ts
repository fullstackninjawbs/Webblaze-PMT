import nodemailer from 'nodemailer';
import { logger } from './logger';

interface SendInviteParams {
  to: string;
  name: string;
  role: string;
  inviteUrl: string;
  tempPassword?: string;
}

const createTransporter = () => {
  const host = process.env.SMTP_HOST;
  const port = parseInt(process.env.SMTP_PORT || '587', 10);
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;

  if (host && user && pass) {
    return nodemailer.createTransport({
      host,
      port,
      secure: port === 465,
      auth: { user, pass },
    });
  }

  // Fallback dev transporter: logs to console
  return {
    sendMail: async (options: any) => {
      logger.info('=============== EMAIL INVITATION GENERATED (DEV MODE) ===============');
      logger.info(`To: ${options.to}`);
      logger.info(`Subject: ${options.subject}`);
      logger.info(`Invite Link: ${inviteLinkFromHtml(options.html)}`);
      logger.info('=====================================================================');
      return { messageId: 'dev-mode-mock-id' };
    },
  } as any;
};

const inviteLinkFromHtml = (html: string): string => {
  const match = html.match(/href="([^"]+)"/);
  return match ? match[1] : 'N/A';
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
    await transporter.sendMail({
      from,
      to,
      subject: 'You have been invited to WebBlaze PMS',
      html,
    });
    logger.info(`Invitation email dispatched successfully to ${to}`);
  } catch (error) {
    logger.error('Error sending invitation email:', error);
    // Non-blocking error for user creation
  }
};
