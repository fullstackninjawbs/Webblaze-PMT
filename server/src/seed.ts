import { connectDB } from './config/db';
import { seedAdmin } from './modules/users/user.seeder';
import { logger } from './utils/logger';
import mongoose from 'mongoose';

const runSeed = async () => {
  try {
    await connectDB();
    await seedAdmin();
    logger.info('Admin seed script completed successfully.');
    await mongoose.connection.close();
    process.exit(0);
  } catch (err) {
    logger.error('Error running admin seed script:', err);
    process.exit(1);
  }
};

runSeed();
