import mongoose, { Schema } from 'mongoose';

interface ICounter {
  _id: string;
  seq: number;
}

const counterSchema = new Schema<ICounter>({ _id: { type: String }, seq: { type: Number, default: 0 } }, { versionKey: false });

export const Counter =
  (mongoose.models.Counter as mongoose.Model<ICounter>) || mongoose.model<ICounter>('Counter', counterSchema);

/**
 * Atomically returns the next number in a named sequence. Unlike "read the highest code
 * and add one", two simultaneous callers can never get the same number.
 * `initialFloor` is called once, when the sequence does not exist yet, so numbering
 * continues after any codes created before the counter existed.
 */
export const nextSequence = async (name: string, initialFloor: () => Promise<number>): Promise<number> => {
  if (!(await Counter.exists({ _id: name }))) {
    const floor = await initialFloor();
    try {
      await Counter.updateOne({ _id: name }, { $max: { seq: floor } }, { upsert: true });
    } catch (error: any) {
      // Another request created the counter at the same moment; that is fine
      if (error?.code !== 11000) throw error;
    }
  }
  const doc = await Counter.findOneAndUpdate({ _id: name }, { $inc: { seq: 1 } }, { new: true, upsert: true });
  return doc!.seq;
};
