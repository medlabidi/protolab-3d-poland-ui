import mongoose, { Schema, Document } from 'mongoose';

export interface IUser extends Document {
  name: string;
  email: string;
  passwordHash: string;
  phone?: string;
  address?: string;
  city?: string;
  zipCode?: string;
  country?: string;
  latitude?: number;
  longitude?: number;
  role: 'user' | 'admin';
  createdAt: Date;
  orders: mongoose.Types.ObjectId[];
}

const userSchema = new Schema<IUser>({
  name: {
    type: String,
    required: true,
    trim: true,
  },
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true,
  },
  passwordHash: {
    type: String,
    required: true,
  },
  phone: {
    type: String,
    trim: true,
  },
  address: {
    type: String,
    trim: true,
  },
  city: {
    type: String,
    trim: true,
  },
  zipCode: {
    type: String,
    trim: true,
  },
  country: {
    type: String,
    trim: true,
  },
  latitude: {
    type: Number,
  },
  longitude: {
    type: Number,
  },
  role: {
    type: String,
    enum: ['user', 'admin'],
    default: 'user',
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
  orders: [{
    type: Schema.Types.ObjectId,
    ref: 'Order',
  }],
});

userSchema.index({ email: 1 });

export const User = mongoose.model<IUser>('User', userSchema);