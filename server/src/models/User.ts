import mongoose, { Schema, Document } from 'mongoose';

export interface IUser extends Document {
  email: string;
  password?: string; // optional for OAuth users
  name: string;
  googleId?: string;
  createdAt: Date;
  updatedAt: Date;
}

const userSchema = new Schema<IUser>(
  {
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    password: {
      type: String,
      default: null, // null for Google OAuth users
    },
    name: {
      type: String,
      required: true,
    },
    googleId: {
      type: String,
      default: null,
    },
  },
  { timestamps: true }
);

export const User = mongoose.model<IUser>('User', userSchema);