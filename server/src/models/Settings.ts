import mongoose, { Schema, Document } from 'mongoose';

export interface ISettings extends Document {
  materialRate: number;
  timeRate: number;
  serviceFee: number;
  updatedAt: Date;
}

const settingsSchema = new Schema<ISettings>({
  materialRate: {
    type: Number,
    required: true,
    default: 0.05,
  },
  timeRate: {
    type: Number,
    required: true,
    default: 10,
  },
  serviceFee: {
    type: Number,
    required: true,
    default: 5,
  },
  updatedAt: {
    type: Date,
    default: Date.now,
  },
});

export const Settings = mongoose.model<ISettings>('Settings', settingsSchema);