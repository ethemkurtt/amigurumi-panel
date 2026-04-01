import mongoose, { Schema, Document, Types } from 'mongoose';

export interface IGeneratedImage {
  _id?: string;
  url: string;
  backgroundId: string;
  backgroundLabel: string;
  type: 'gemini' | 'reference';
  createdAt: Date;
}

export interface IProduct extends Document {
  _id: Types.ObjectId;
  name: string;
  size?: string;
  referenceImageUrl: string;
  generatedImages: IGeneratedImage[];
  title: string;
  description: string;
  tags: string[];
  status: 'draft' | 'generating' | 'completed';
  originalPdfUrl?: string;
  originalPdfBase64?: string;
  processedPdfUrl?: string;
  processedPdfBase64?: string;
  pdfPrompt?: string;
  videoUrl?: string;
  videoStatus?: 'idle' | 'generating' | 'completed' | 'failed';
  videoError?: string;
  pdfUrl?: string;
  lastError?: string;
  createdAt: Date;
  updatedAt: Date;
}

const GeneratedImageSchema = new Schema<IGeneratedImage>({
  url: { type: String, required: true },
  backgroundId: { type: String, required: true },
  backgroundLabel: { type: String, required: true },
  type: { type: String, enum: ['gemini', 'reference'], required: true },
  createdAt: { type: Date, default: Date.now },
});

const ProductSchema = new Schema<IProduct>(
  {
    name: { type: String, required: true },
    size: { type: String, default: '25' },
    referenceImageUrl: { type: String, required: true },
    originalPdfUrl: { type: String },
    originalPdfBase64: { type: String },
    processedPdfUrl: { type: String },
    processedPdfBase64: { type: String },
    pdfPrompt: { type: String },
    generatedImages: { type: [GeneratedImageSchema], default: [] },
    title: { type: String, default: '' },
    description: { type: String, default: '' },
    tags: { type: [String], default: [] },
    status: {
      type: String,
      enum: ['draft', 'generating', 'completed'],
      default: 'draft',
    },
    videoUrl: { type: String },
    videoStatus: { type: String, enum: ['idle', 'generating', 'completed', 'failed'], default: 'idle' },
    videoError: { type: String },
    pdfUrl: { type: String },
    lastError: { type: String },
  },
  { timestamps: true }
);

export const Product =
  mongoose.models.Product ||
  mongoose.model<IProduct>('Product', ProductSchema);
