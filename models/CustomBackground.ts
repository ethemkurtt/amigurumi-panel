import mongoose, { Schema, Document } from 'mongoose';

export interface ICustomBackground extends Document {
  id: string;
  label: string;
  emoji: string;
  category: string;
  prompt: string;
  createdAt: Date;
}

const CustomBackgroundSchema = new Schema<ICustomBackground>(
  {
    id: { type: String, required: true, unique: true },
    label: { type: String, required: true },
    emoji: { type: String, default: '🎨' },
    category: { type: String, required: true },
    prompt: { type: String, required: true },
  },
  { timestamps: true }
);

export const CustomBackground =
  mongoose.models.CustomBackground ||
  mongoose.model<ICustomBackground>('CustomBackground', CustomBackgroundSchema);
