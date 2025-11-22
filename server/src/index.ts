import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import mongoose from 'mongoose';
import authRoutes from './routes/auth.routes';
import uploadRoutes from './routes/upload.routes';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;
const MONGODB_URI = process.env.MONGODB_URI;

// ...existing middleware...

// Connect MongoDB
mongoose.connect(MONGODB_URI!).then(() => {
  console.log('✅ MongoDB connected');
}).catch(err => {
  console.error('❌ MongoDB connection failed:', err);
});

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/upload', uploadRoutes);

// ...rest of app...

app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});
