import app from '../src/app';
import { connectDB } from '../src/config/db';

export default async function handler(req: any, res: any) {
  try {
    await connectDB();
  } catch (error) {
    console.error('Database connection error in Vercel function:', error);
  }
  return app(req, res);
}
