import mongoose from 'mongoose';
import dotenv from 'dotenv';
dotenv.config({ path: './.env' });

async function fixIndex() {
  try {
    await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/webblaze-pms');
    console.log('Connected to DB');
    
    const db = mongoose.connection.db;
    if (!db) {
      console.log('DB connection failed');
      return;
    }
    const collection = db.collection('projects');
    
    console.log('Dropping index project_id_1...');
    try {
      await collection.dropIndex('project_id_1');
      console.log('Index dropped successfully!');
    } catch (err: any) {
      console.log('Error dropping index (it might not exist anymore):', err.message);
    }
    
    // Drop any other unwanted indexes just in case
    const indexes = await collection.indexes();
    console.log('Current indexes:', indexes);
    
    mongoose.disconnect();
  } catch (err) {
    console.error(err);
  }
}

fixIndex();
