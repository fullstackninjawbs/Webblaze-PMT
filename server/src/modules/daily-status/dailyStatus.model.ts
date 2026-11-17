import mongoose, { Document, Schema, Types } from 'mongoose';

/**
 * One line of an EOD report. Lines linked to a task carry the task, its project and the
 * hours the user logged on it that day (computed server-side from time logs). Free-text
 * lines only carry `title`.
 */
export interface IDailyStatusEntry {
  task?: Types.ObjectId;
  title: string;
  project?: Types.ObjectId;
  projectName?: string;
  taskStatus?: string;
  hours?: number;
}

export interface IDailyStatus extends Document {
  user: Types.ObjectId;
  project?: Types.ObjectId;
  workDone: string;
  plannedWork?: string;
  blockers?: string;
  entries: IDailyStatusEntry[];
  totalHours: number;
  /** Business day "YYYY-MM-DD" in APP_TIMEZONE; one report per user per dayKey. */
  dayKey?: string;
  date: Date;
  createdAt: Date;
  updatedAt: Date;
}

const entrySchema = new Schema<IDailyStatusEntry>(
  {
    task: { type: Schema.Types.ObjectId, ref: 'Task' },
    title: { type: String, required: true, trim: true },
    project: { type: Schema.Types.ObjectId, ref: 'Project' },
    projectName: { type: String },
    taskStatus: { type: String },
    hours: { type: Number, default: 0, min: 0 },
  },
  { _id: false }
);

const dailyStatusSchema = new Schema<IDailyStatus>(
  {
    user: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'User is required'],
    },
    project: {
      type: Schema.Types.ObjectId,
      ref: 'Project',
    },
    workDone: {
      type: String,
      required: [true, 'Work done description is required'],
      trim: true,
    },
    plannedWork: {
      type: String,
      trim: true,
      default: '',
    },
    blockers: {
      type: String,
      trim: true,
      default: '',
    },
    entries: {
      type: [entrySchema],
      default: [],
    },
    totalHours: {
      type: Number,
      default: 0,
      min: 0,
    },
    dayKey: {
      type: String,
    },
    date: {
      type: Date,
      default: Date.now,
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

// Indexes
dailyStatusSchema.index({ user: 1 });
dailyStatusSchema.index({ date: -1 });
// One report per user per business day, enforced by the database. Older reports without
// a dayKey are not covered until the merge script gives the kept report its key.
dailyStatusSchema.index(
  { user: 1, dayKey: 1 },
  { unique: true, partialFilterExpression: { dayKey: { $exists: true } }, name: 'one_report_per_user_per_day' }
);
dailyStatusSchema.index({ project: 1 });

export const DailyStatus = mongoose.model<IDailyStatus>('DailyStatus', dailyStatusSchema);
