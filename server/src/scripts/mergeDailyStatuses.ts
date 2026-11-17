/**
 * One-off maintenance: merge duplicate daily status reports (same user, same day)
 * created before the one-report-per-day rule.
 *
 * Run from server/:  npx ts-node src/scripts/mergeDailyStatuses.ts
 */
import dotenv from 'dotenv';
import mongoose from 'mongoose';
import { connectDB } from '../config/db';
import { mergeDuplicateDailyStatuses } from '../modules/daily-status/dailyStatus.service';
import { logger } from '../utils/logger';

dotenv.config();

const run = async () => {
  await connectDB();
  const removed = await mergeDuplicateDailyStatuses();
  logger.info(`Merged duplicate daily reports. Removed ${removed} duplicate(s).`);
  await mongoose.connection.close();
  process.exit(0);
};

run().catch((err) => {
  logger.error('Merge failed:', err);
  process.exit(1);
});
