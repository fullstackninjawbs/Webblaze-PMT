/**
 * Checks email delivery on THIS machine (run it on the deployed server).
 *
 *   npx ts-node src/scripts/testEmail.ts                 -> verifies the SMTP login only
 *   npx ts-node src/scripts/testEmail.ts you@company.com -> also sends a test reset email
 */
import 'dotenv/config';
import { verifyEmailTransport, sendResetPasswordEmail } from '../utils/emailService';

const run = async () => {
  const to = process.argv[2];
  const ok = await verifyEmailTransport();
  if (!ok) process.exit(1);

  if (to) {
    const clientUrl = process.env.CLIENT_URL || 'http://localhost:5173';
    const sent = await sendResetPasswordEmail({ to, name: 'Test', resetUrl: `${clientUrl}/reset-password?token=test` });
    console.log(sent ? `Test email sent to ${to}` : 'Test email FAILED, see the error above');
    process.exit(sent ? 0 : 1);
  }
  process.exit(0);
};

run();
