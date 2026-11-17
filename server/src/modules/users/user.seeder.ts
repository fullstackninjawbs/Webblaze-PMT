import crypto from 'crypto';
import { User } from './user.model';
import { Role } from '../../types';
import { logger } from '../../utils/logger';
import dotenv from 'dotenv';

dotenv.config();

/**
 * Creates the first admin account, and only when the database has no admin at all.
 * It never changes an existing user: passwords, roles and active flags are left alone.
 *
 * Credentials come from SEED_ADMIN_EMAIL / SEED_ADMIN_PASSWORD. In production, if no
 * password is configured, a random one is generated and printed once to the log; it
 * must be changed after first login.
 */
export const seedAdmin = async () => {
  try {
    const existingAdmin = await User.exists({ role: Role.ADMIN });

    if (!existingAdmin) {
      const email = (process.env.SEED_ADMIN_EMAIL || 'admin@webblaze.com').trim().toLowerCase();
      const configuredPassword = process.env.SEED_ADMIN_PASSWORD;
      const isProduction = process.env.NODE_ENV === 'production';

      const password =
        configuredPassword ||
        (isProduction ? crypto.randomBytes(12).toString('base64url') : 'password123');

      const emailTaken = await User.exists({ email });
      if (emailTaken) {
        logger.warn(`[Seed] No admin exists, but ${email} is already used by a non-admin account. Skipping admin seed.`);
      } else {
        await User.create({ name: 'Super Admin', email, password, role: Role.ADMIN, isActive: true });
        if (configuredPassword) {
          logger.info(`[Seed] Initial admin created: ${email} (password from SEED_ADMIN_PASSWORD).`);
        } else if (isProduction) {
          logger.warn(`[Seed] Initial admin created: ${email} / ${password}  <- change this password after first login.`);
        } else {
          logger.info(`[Seed] Development admin created: ${email} / ${password}`);
        }
      }
    }

    // Ensure Admin and PM do not have department assigned
    await User.updateMany(
      { role: { $in: [Role.ADMIN, Role.PM] }, department: { $ne: null } },
      { $unset: { department: 1 } }
    );
  } catch (error) {
    logger.error('Failed to seed admin user:', error);
  }
};
