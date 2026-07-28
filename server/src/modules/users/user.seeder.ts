import { User } from './user.model';
import { Role } from '../../types';
import { logger } from '../../utils/logger';
import dotenv from 'dotenv';

dotenv.config();

export const seedAdmin = async () => {
  try {
    const adminExists = await User.findOne({ role: Role.ADMIN });
    if (!adminExists) {
      await User.create({
        name: 'Super Admin',
        email: 'admin@webblaze.com',
        password: 'password123', // In a real scenario, force change on first login
        role: Role.ADMIN,
        isActive: true,
      });
      logger.info('Default admin seeded successfully');
    }
  } catch (error) {
    logger.error('Failed to seed admin user:', error);
  }
};
