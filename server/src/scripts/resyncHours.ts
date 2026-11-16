/**
 * One-off maintenance: rebuild Task.spentHours and Milestone.spentHours/status
 * from the time logs that actually exist.
 *
 * Run from server/:  npx ts-node src/scripts/resyncHours.ts
 */
import dotenv from 'dotenv';
import mongoose from 'mongoose';
import { connectDB } from '../config/db';
import { Task } from '../modules/tasks/task.model';
import { Milestone } from '../modules/milestones/milestone.model';
import { syncTaskHours } from '../modules/timelogs/timeLog.service';
import { evaluateAndUpdateMilestoneStatus } from '../modules/milestones/milestone.service';
import { logger } from '../utils/logger';

dotenv.config();

const run = async () => {
  await connectDB();

  const taskIds = await Task.find().distinct('_id');
  logger.info(`Resyncing ${taskIds.length} task(s) from their time logs...`);
  for (const id of taskIds) {
    await syncTaskHours(String(id));
  }

  const milestoneIds = await Milestone.find().distinct('_id');
  logger.info(`Re-evaluating ${milestoneIds.length} milestone(s)...`);
  for (const id of milestoneIds) {
    await evaluateAndUpdateMilestoneStatus(String(id));
  }

  logger.info('Resync complete.');
  await mongoose.connection.close();
  process.exit(0);
};

run().catch((err) => {
  logger.error('Resync failed:', err);
  process.exit(1);
});
