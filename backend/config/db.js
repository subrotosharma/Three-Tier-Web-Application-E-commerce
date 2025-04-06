import mongoose from 'mongoose';
import { MONGODB_URI } from './utils.js';

export default async function connectDB() {
  try {
    await mongoose.connect(MONGODB_URI);

    const dbConnection = mongoose.connection;

    dbConnection.once('open', () => {
      console.log(`Database connected: ${MONGODB_URI}`);
    });

    dbConnection.on('error', (err) => {
      console.error(`Connection error: ${err.message}`);
    });
  } catch (err) {
    console.error(`Database connection failed: ${err.message}`);
    process.exit(1);
  }
}
