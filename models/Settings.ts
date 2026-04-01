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

  // PDF ayarlari
  defaultPdfPrompt: string;

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
        'Amigurumi Horse Crochet Pattern – Low Sew Farm Animal (PDF Pattern)',
    },
    descriptionTemplate: {
      type: String,
      default:
        '🐴 Amigurumi Horse Crochet Pattern – PDF Tutorial\n\nThis adorable Amigurumi Horse Crochet Pattern is a perfect project for both beginners and experienced crocheters. With step-by-step instructions, detailed explanations, and clear guidance, you can easily create this cute, soft, and farm-themed horse plush. It\'s a wonderful choice for children, nursery décor, farm animal lovers, or anyone who enjoys collecting cute handmade plushies!\n\n📥 What\'s Included in the PDF\n\n🧶 Step-by-step written instructions\n📸 Clear reference photos\n✂️ Materials and tools list\n🪡 Hook size and yarn details\n🐣 Beginner-friendly techniques explained simply\n\nYou can print the pattern as many times as you like and reuse it whenever needed.\n\n⭐ Skill Level\nBeginner – Intermediate\nAnyone familiar with basic stitches, increases, and decreases can easily complete this project.\n\n📦 Instant Digital Download\nOnce your payment is completed, you can instantly access your PDF file.\nYour pattern will always be available in your Etsy Purchases & Reviews section.\n\n❤️ Usage & Permissions\nYou may sell the finished items made from this pattern.\nPlease do not share, copy, or resell the pattern itself.\n\n⚠️ IMPORTANT\nThis is a DIGITAL crochet pattern.\nNo physical item will be shipped.\nDigital downloads are non-refundable and cannot be canceled.',
    },
    defaultTags: {
      type: [String],
      default: [
        'amigurumi crochet pdf',
        'amigurumi pattern',
        'crochet toy pattern',
        'stuffed animal diy',
        'farm animal toy',
        'crochet tutorial',
        'amigurumi toy',
        'easy crochet pattern',
        'cute plush pattern',
        'beginner crochet',
        'amigurumi pdf',
        'handmade toy pattern',
        'nursery decor diy',
      ],
    },
    defaultPdfPrompt: {
      type: String,
      default:
        'Bu PDF\'teki matematiksel verileri ve tarifleri ASLA degistirme. Ornegin "R18: OR [ssc 15], WH [ssc 3], OR [ssc 12], WH [ssc 3], OR [ssc 15]. {48}" gibi satirlar AYNEN kalmali, formati degistirme.\n\nGorselleri ve telif hakki iceren icerik/logolari kaldir.\n\nMarka: TinyAmigurumiStudio - bunu kullan.\n\nSen bir ogretmen degilsin, uzman bir amigurumi tarifcisisin. Ona gore sayfalara uzman notlari ekle (sohbet balonu tarzi, PDF tasarimindan bagimsiz gorunen notlar).\n\nTum bolumleri guzelce ayir: Kafa, Body, Kulaklar, Bacaklar vs. karistirma.\n\nHer bolume guzel bir tarif semasi olustur.\n\nHer sayfaya faydali uzman notlari ekle.\n\nBasliklar, bolum ayiricilar, tasarim cok iyi olmali. Profesyonel ve guzel bir PDF tasarimi yap.',
    },
    shopName: { type: String, default: '' },
    currency: { type: String, default: 'USD' },
  },
  { timestamps: true }
);

export const Settings =
  mongoose.models.Settings ||
  mongoose.model<ISettings>('Settings', SettingsSchema);
