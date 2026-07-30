import { User } from './user.model';
import { Role } from '../../types';
import { logger } from '../../utils/logger';
import dotenv from 'dotenv';

dotenv.config();

export const seedAdmin = async () => {
  try {
    const admin = await User.findOne({ email: 'admin@webblaze.com' });
    if (!admin) {
      await User.create({
        name: 'Super Admin',
        email: 'admin@webblaze.com',
        password: 'password123',
        role: Role.ADMIN,
        isActive: true,
      });
      logger.info('Default admin created successfully: admin@webblaze.com / password123');
    } else {
      admin.password = 'password123';
      admin.role = Role.ADMIN;
      admin.isActive = true;
      await admin.save();
      logger.info('Default admin reset/updated successfully: admin@webblaze.com / password123');
    }
  } catch (error) {
    logger.error('Failed to seed admin user:', error);
  }
};
