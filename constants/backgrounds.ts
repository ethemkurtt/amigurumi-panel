export interface BackgroundPreset {
  id: string;
  label: string;
  emoji: string;
  category: string;
  prompt: string;
}

export const BACKGROUND_CATEGORIES = [
  { id: 'living', label: 'Oturma Alanlari', emoji: '🛋️' },
  { id: 'bedroom', label: 'Yatak & Bebek Odasi', emoji: '🛏️' },
  { id: 'kids', label: 'Cocuk & Oyun', emoji: '🧸' },
  { id: 'kitchen', label: 'Mutfak & Yemek', emoji: '🍳' },
  { id: 'nature', label: 'Dis Mekan & Doga', emoji: '🌿' },
  { id: 'cozy', label: 'Sicak & Samimi', emoji: '🕯️' },
  { id: 'modern', label: 'Modern & Minimal', emoji: '✨' },
  { id: 'seasonal', label: 'Mevsimsel & Ozel', emoji: '🎄' },
];

export const BACKGROUND_PRESETS: BackgroundPreset[] = [
  // ── Oturma Alanlari ──
  { id: 'living-sofa', label: 'Kanepe Ustu', emoji: '🛋️', category: 'living', prompt: 'Place the amigurumi toy on a cozy beige sofa in a modern living room. Soft cushions around, warm ambient lighting.' },
  { id: 'living-armchair', label: 'Koltuk', emoji: '💺', category: 'living', prompt: 'Place the amigurumi toy on a comfortable armchair in a stylish living room. Soft fabric, warm reading lamp light.' },
  { id: 'living-coffee-table', label: 'Sehpa', emoji: '☕', category: 'living', prompt: 'Place the amigurumi toy on a round wooden coffee table in a living room. Magazine and coffee cup nearby, cozy vibe.' },
  { id: 'living-rug', label: 'Salon Halisi', emoji: '🟫', category: 'living', prompt: 'Place the amigurumi toy on a soft fluffy rug in a bright living room. Warm natural light from large windows.' },

  // ── Yatak & Bebek Odasi ──
  { id: 'bed-white', label: 'Beyaz Yatak', emoji: '🛏️', category: 'bedroom', prompt: 'Place the amigurumi toy on a neatly made bed with white soft bedding and pillows. Cozy bedroom, soft morning light.' },
  { id: 'bed-colorful', label: 'Renkli Yatak', emoji: '🌈', category: 'bedroom', prompt: 'Place the amigurumi toy on a colorful patterned bedspread. Bright cheerful bedroom with playful decor.' },
  { id: 'baby-crib', label: 'Bebek Besigi', emoji: '👶', category: 'bedroom', prompt: 'Place the amigurumi toy next to a white baby crib in a soft pastel nursery room. Gentle lighting, dreamy atmosphere, mobile hanging above.' },
  { id: 'baby-changing', label: 'Bebek Bakimi', emoji: '🍼', category: 'bedroom', prompt: 'Place the amigurumi toy on a baby changing table in a pastel nursery. Soft lighting, baby accessories nearby.' },
  { id: 'nightstand', label: 'Komodin', emoji: '🕯️', category: 'bedroom', prompt: 'Place the amigurumi toy on a bedroom nightstand next to a soft glowing lamp. Cozy evening atmosphere.' },

  // ── Cocuk & Oyun ──
  { id: 'kids-carpet', label: 'Cocuk Halisi', emoji: '🧸', category: 'kids', prompt: 'Place the amigurumi toy on a soft colorful carpet in a bright childrens room. Pastel walls, toys in soft bokeh background.' },
  { id: 'kids-playroom', label: 'Oyun Odasi', emoji: '🎮', category: 'kids', prompt: 'Place the amigurumi toy in a bright playroom surrounded by blurred colorful toys and books. Fun happy atmosphere.' },
  { id: 'kids-desk', label: 'Calisma Masasi', emoji: '📚', category: 'kids', prompt: 'Place the amigurumi toy on a childs study desk with colorful pencils and books blurred in background.' },
  { id: 'kids-tent', label: 'Oyun Cadiri', emoji: '⛺', category: 'kids', prompt: 'Place the amigurumi toy at the entrance of a cute indoor kids play tent with fairy lights. Magical cozy atmosphere.' },
  { id: 'kids-shelf', label: 'Oyuncak Rafi', emoji: '🧩', category: 'kids', prompt: 'Place the amigurumi toy on a wooden kids shelf with other toys blurred behind. Organized playful room.' },

  // ── Mutfak & Yemek ──
  { id: 'kitchen-marble', label: 'Mermer Tezgah', emoji: '🍳', category: 'kitchen', prompt: 'Place the amigurumi toy on a clean white marble kitchen counter. Bright modern kitchen, warm natural light.' },
  { id: 'kitchen-wooden', label: 'Ahsap Tezgah', emoji: '🪵', category: 'kitchen', prompt: 'Place the amigurumi toy on a warm wooden kitchen counter. Rustic farmhouse kitchen with herbs and jars in background.' },
  { id: 'dining-table', label: 'Yemek Masasi', emoji: '🪑', category: 'kitchen', prompt: 'Place the amigurumi toy on a clean wooden dining table in a bright minimalist home. Soft natural window light.' },
  { id: 'breakfast-table', label: 'Kahvalti Masasi', emoji: '🥐', category: 'kitchen', prompt: 'Place the amigurumi toy on a breakfast table with a cup of coffee and pastry blurred in background. Morning light.' },

  // ── Dis Mekan & Doga ──
  { id: 'balcony', label: 'Balkon', emoji: '🌿', category: 'nature', prompt: 'Place the amigurumi toy on a small round coffee table on a cozy balcony. Green plants, soft outdoor natural light.' },
  { id: 'garden-grass', label: 'Bahce Cimeni', emoji: '🌱', category: 'nature', prompt: 'Place the amigurumi toy on fresh green grass in a beautiful garden. Soft sunlight, flowers blurred in background.' },
  { id: 'garden-bench', label: 'Bahce Banki', emoji: '🪑', category: 'nature', prompt: 'Place the amigurumi toy on a rustic garden bench surrounded by flowers. Warm golden hour sunlight.' },
  { id: 'park-blanket', label: 'Piknik Ortusu', emoji: '🧺', category: 'nature', prompt: 'Place the amigurumi toy on a cute picnic blanket in a park. Green trees and soft sunlight in background.' },
  { id: 'beach-sand', label: 'Kumsal', emoji: '🏖️', category: 'nature', prompt: 'Place the amigurumi toy on soft beach sand with gentle waves blurred in background. Warm sunny vacation atmosphere.' },

  // ── Sicak & Samimi ──
  { id: 'fireplace', label: 'Somine Onu', emoji: '🔥', category: 'cozy', prompt: 'Place the amigurumi toy on a cozy rug in front of a warm fireplace. Warm golden glow, knit blanket nearby.' },
  { id: 'window-sill', label: 'Pencere Kenari', emoji: '🪟', category: 'cozy', prompt: 'Place the amigurumi toy on a bright window sill with natural daylight. Soft blurred outdoor greenery visible.' },
  { id: 'bookshelf', label: 'Kitaplik', emoji: '📚', category: 'cozy', prompt: 'Place the amigurumi toy in front of a cozy bookshelf with colorful books. Warm lighting, hygge atmosphere.' },
  { id: 'reading-nook', label: 'Okuma Kosesi', emoji: '📖', category: 'cozy', prompt: 'Place the amigurumi toy in a cozy reading nook with soft cushions and a warm throw blanket. Fairy lights, dreamy.' },
  { id: 'candle-setup', label: 'Mum Isigi', emoji: '🕯️', category: 'cozy', prompt: 'Place the amigurumi toy on a surface surrounded by soft glowing candles. Warm intimate romantic atmosphere.' },
  { id: 'knit-blanket', label: 'Orgu Battaniye', emoji: '🧶', category: 'cozy', prompt: 'Place the amigurumi toy on a soft chunky knit blanket. Cozy hygge atmosphere, warm tones.' },

  // ── Modern & Minimal ──
  { id: 'white-desk', label: 'Beyaz Masa', emoji: '🖥️', category: 'modern', prompt: 'Place the amigurumi toy on a clean white modern desk. Minimalist workspace, bright natural light, clean aesthetic.' },
  { id: 'concrete-shelf', label: 'Beton Raf', emoji: '🏗️', category: 'modern', prompt: 'Place the amigurumi toy on a concrete shelf in a modern industrial loft. Raw textures, cool tones, designer atmosphere.' },
  { id: 'pastel-wall', label: 'Pastel Duvar', emoji: '🎨', category: 'modern', prompt: 'Place the amigurumi toy on a white surface against a soft pastel colored wall. Clean minimal aesthetic, studio lighting.' },
  { id: 'floating-shelf', label: 'Duvar Rafi', emoji: '📐', category: 'modern', prompt: 'Place the amigurumi toy on a modern floating wall shelf. Clean lines, minimal decor, bright room.' },

  // ── Mevsimsel & Ozel ──
  { id: 'christmas', label: 'Yilbasi', emoji: '🎄', category: 'seasonal', prompt: 'Place the amigurumi toy next to a Christmas tree with twinkling lights. Festive holiday atmosphere, gift boxes nearby.' },
  { id: 'autumn-leaves', label: 'Sonbahar', emoji: '🍂', category: 'seasonal', prompt: 'Place the amigurumi toy surrounded by colorful autumn leaves and a warm scarf. Golden fall atmosphere, warm tones.' },
  { id: 'spring-flowers', label: 'Ilkbahar', emoji: '🌸', category: 'seasonal', prompt: 'Place the amigurumi toy surrounded by fresh spring flowers. Bright pastel colors, fresh cheerful atmosphere.' },
  { id: 'valentines', label: 'Sevgililer Gunu', emoji: '❤️', category: 'seasonal', prompt: 'Place the amigurumi toy surrounded by soft red hearts and rose petals. Romantic Valentine atmosphere.' },
  { id: 'easter', label: 'Paskalya', emoji: '🐣', category: 'seasonal', prompt: 'Place the amigurumi toy in an Easter scene with painted eggs and spring flowers. Pastel cheerful atmosphere.' },
  { id: 'gift-box', label: 'Hediye Kutusu', emoji: '🎁', category: 'seasonal', prompt: 'Place the amigurumi toy peeking out of a beautiful gift box with ribbon. Gift-giving celebration atmosphere.' },
];

export const getPresetById = (id: string) =>
  BACKGROUND_PRESETS.find((p) => p.id === id);

export const getPresetsByCategory = (category: string) =>
  BACKGROUND_PRESETS.filter((p) => p.category === category);
