import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

(async () => {
  try {
    console.log('Using MONGO_URI:', process.env.MONGO_URI ? process.env.MONGO_URI.replace(/:[^:@]+@/, ':*****@') : '(not set)');
    console.log('MONGO_USER:', process.env.MONGO_USER || '(not set)');
    console.log('MONGO_HOST:', process.env.MONGO_HOST || '(not set)');

    await mongoose.connect(process.env.MONGO_URI || (() => {
      if (process.env.MONGO_USER && process.env.MONGO_PASS && process.env.MONGO_HOST) {
        const enc = encodeURIComponent(process.env.MONGO_PASS);
        return `mongodb+srv://${process.env.MONGO_USER}:${enc}@${process.env.MONGO_HOST}/${process.env.MONGO_DB || 'vn_dairy'}?retryWrites=true&w=majority&appName=Cluster0`;
      }
      return null;
    })());

    console.log('Connected to MongoDB successfully');
    process.exit(0);
  } catch (err) {
    console.error('Connect failed — full error:');
    console.error(err);
    if (err && err.message) console.error('Error message:', err.message);
    if (err && err.stack) console.error('Stack:', err.stack);
    process.exit(1);
  }
})();
