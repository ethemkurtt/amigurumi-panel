import mongoose, { Schema, Document } from 'mongoose';

export interface ISettings extends Document {
  // Prompt ayarlari
  defaultPose: string;
  defaultSize: string;
  defaultStyle: string;
  defaultAngle: string;
  promptRules: string;

  // Baslik/Aciklama sablonlari
  titleTemplate: string;
  descriptionTemplate: string;
  defaultTags: string[];

  // Etsy ayarlari
  shopName: string;
  currency: string;

  updatedAt: Date;
}

const SettingsSchema = new Schema<ISettings>(
  {
    defaultPose: { type: String, default: 'sitting' },
    defaultSize: { type: String, default: '25' },
    defaultStyle: { type: String, default: 'realistic' },
    defaultAngle: { type: String, default: 'front-45' },
    promptRules: {
      type: String,
      default:
        'Keep the amigurumi toy EXACTLY as it is - do not modify, reshape, or distort the toy in any way. Only change the background. The toy should look like a real handmade crochet product. Professional Etsy product photography style. Soft natural lighting.',
    },
    titleTemplate: {
      type: String,
      default:
        'Cute {name} Amigurumi Crochet Toy | Handmade {name} Stuffed Animal | Crochet {name} Plushie Gift',
    },
    descriptionTemplate: {
      type: String,
      default:
        'Meet this adorable handmade {name} amigurumi! This cute crochet {name} toy is approximately {size}cm tall, made with premium quality yarn and filled with hypoallergenic stuffing.\n\nPerfect as a gift for kids, nursery decor, or a collectible for amigurumi lovers. Each piece is carefully handcrafted with attention to detail.\n\nFeatures:\n- Handmade with love\n- Approximately {size}cm tall\n- Made with premium acrylic yarn\n- Hypoallergenic polyester filling\n- Safety eyes\n- Machine washable (gentle cycle)',
    },
    defaultTags: {
      type: [String],
      default: [
        'amigurumi',
        'crochet toy',
        'handmade gift',
        'stuffed animal',
        'plushie',
        'nursery decor',
        'baby gift',
        'crochet animal',
        'kawaii',
        'handmade toy',
      ],
    },
    shopName: { type: String, default: '' },
    currency: { type: String, default: 'USD' },
  },
  { timestamps: true }
);

export const Settings =
  mongoose.models.Settings ||
  mongoose.model<ISettings>('Settings', SettingsSchema);
