export interface BackgroundPreset {
  id: string;
  label: string;
  emoji: string;
  category: string;
  prompt: string;
}

export const BACKGROUND_CATEGORIES = [
  { id: 'living', label: 'Oturma Odasi', emoji: '🛋️' },
  { id: 'bedroom', label: 'Yatak Odasi', emoji: '🛏️' },
  { id: 'baby', label: 'Bebek Odasi', emoji: '👶' },
  { id: 'kids', label: 'Cocuk Odasi', emoji: '🧸' },
  { id: 'kitchen', label: 'Mutfak & Yemek', emoji: '🍳' },
  { id: 'study', label: 'Calisma Odasi', emoji: '📚' },
  { id: 'cozy', label: 'Ev Kosesi', emoji: '🕯️' },
  { id: 'general', label: 'Ev Genel', emoji: '🏠' },
];

export const BACKGROUND_PRESETS: BackgroundPreset[] = [
  // ── Oturma Odasi ──
  { id: 'living-sofa', label: 'Kanepe Ustu', emoji: '🛋️', category: 'living', prompt: 'Place the amigurumi toy on a cozy beige sofa in a modern living room. Soft cushions around, warm ambient lighting.' },
  { id: 'living-armchair', label: 'Koltuk Ustu', emoji: '💺', category: 'living', prompt: 'Place the amigurumi toy on a comfortable armchair in a stylish living room. Soft fabric, warm reading lamp light.' },
  { id: 'living-rug', label: 'Salon Halisi', emoji: '🟫', category: 'living', prompt: 'Place the amigurumi toy on a soft fluffy rug in a bright living room. Warm natural light from large windows.' },
  { id: 'living-coffee-table', label: 'Sehpa Ustu', emoji: '☕', category: 'living', prompt: 'Place the amigurumi toy on a round wooden coffee table in a living room. Magazine and coffee cup nearby, cozy vibe.' },
  { id: 'living-tv-unit', label: 'TV Unitesi', emoji: '📺', category: 'living', prompt: 'Place the amigurumi toy on a modern TV unit shelf in a living room. Clean lines, warm ambient light.' },
  { id: 'living-cushion', label: 'Yastik Yaninda', emoji: '🫧', category: 'living', prompt: 'Place the amigurumi toy leaning against a decorative cushion on a sofa. Soft cozy living room atmosphere.' },

  // ── Yatak Odasi ──
  { id: 'bed-white', label: 'Beyaz Yatak', emoji: '🛏️', category: 'bedroom', prompt: 'Place the amigurumi toy on a neatly made bed with white soft bedding and pillows. Cozy bedroom, soft morning light.' },
  { id: 'bed-colorful', label: 'Renkli Yatak', emoji: '🌈', category: 'bedroom', prompt: 'Place the amigurumi toy on a colorful patterned bedspread. Bright cheerful bedroom with playful decor.' },
  { id: 'nightstand', label: 'Komodin Ustu', emoji: '🕯️', category: 'bedroom', prompt: 'Place the amigurumi toy on a bedroom nightstand next to a soft glowing lamp. Cozy evening atmosphere.' },
  { id: 'bed-pillow', label: 'Yastik Ustu', emoji: '☁️', category: 'bedroom', prompt: 'Place the amigurumi toy resting on a fluffy white pillow on a bed. Soft dreamy bedroom morning light.' },
  { id: 'bedroom-shelf', label: 'Yatak Odasi Rafi', emoji: '📐', category: 'bedroom', prompt: 'Place the amigurumi toy on a bedroom floating shelf with small decorative items. Warm cozy room.' },

  // ── Bebek Odasi ──
  { id: 'baby-crib', label: 'Besik Yaninda', emoji: '🍼', category: 'baby', prompt: 'Place the amigurumi toy next to a white baby crib in a soft pastel nursery room. Gentle lighting, dreamy atmosphere, mobile hanging above.' },
  { id: 'baby-changing', label: 'Bakim Masasi', emoji: '👶', category: 'baby', prompt: 'Place the amigurumi toy on a baby changing table in a pastel nursery. Soft lighting, baby accessories nearby.' },
  { id: 'baby-rocker', label: 'Sallanan Koltuk', emoji: '🪑', category: 'baby', prompt: 'Place the amigurumi toy on a nursing rocking chair in a baby room. Soft pastel tones, peaceful atmosphere.' },
  { id: 'baby-blanket', label: 'Bebek Battaniyesi', emoji: '🧸', category: 'baby', prompt: 'Place the amigurumi toy on a soft baby blanket on the nursery floor. Pastel colors, gentle lighting.' },
  { id: 'baby-shelf', label: 'Bebek Rafi', emoji: '📦', category: 'baby', prompt: 'Place the amigurumi toy on a cute baby room wall shelf with small stuffed animals. Pastel nursery decor.' },

  // ── Cocuk Odasi ──
  { id: 'kids-carpet', label: 'Cocuk Halisi', emoji: '🎨', category: 'kids', prompt: 'Place the amigurumi toy on a soft colorful carpet in a bright childrens room. Pastel walls, toys in soft bokeh.' },
  { id: 'kids-playroom', label: 'Oyun Alani', emoji: '🎮', category: 'kids', prompt: 'Place the amigurumi toy in a bright playroom surrounded by blurred colorful toys and books. Fun happy atmosphere.' },
  { id: 'kids-desk', label: 'Cocuk Masasi', emoji: '✏️', category: 'kids', prompt: 'Place the amigurumi toy on a childs study desk with colorful pencils and books blurred in background.' },
  { id: 'kids-tent', label: 'Oyun Cadiri', emoji: '⛺', category: 'kids', prompt: 'Place the amigurumi toy at the entrance of a cute indoor kids play tent with fairy lights. Magical cozy.' },
  { id: 'kids-shelf', label: 'Oyuncak Rafi', emoji: '🧩', category: 'kids', prompt: 'Place the amigurumi toy on a wooden kids shelf with other toys blurred behind. Organized playful room.' },
  { id: 'kids-bed', label: 'Cocuk Yatagi', emoji: '🛏️', category: 'kids', prompt: 'Place the amigurumi toy on a colorful kids bed with cartoon bedding. Bright cheerful room.' },

  // ── Mutfak & Yemek ──
  { id: 'kitchen-marble', label: 'Mermer Tezgah', emoji: '🍳', category: 'kitchen', prompt: 'Place the amigurumi toy on a clean white marble kitchen counter. Bright modern kitchen, warm natural light.' },
  { id: 'kitchen-wooden', label: 'Ahsap Tezgah', emoji: '🪵', category: 'kitchen', prompt: 'Place the amigurumi toy on a warm wooden kitchen counter. Rustic farmhouse kitchen with herbs and jars in background.' },
  { id: 'dining-table', label: 'Yemek Masasi', emoji: '🪑', category: 'kitchen', prompt: 'Place the amigurumi toy on a clean wooden dining table in a bright minimalist home. Soft natural window light.' },
  { id: 'breakfast-table', label: 'Kahvalti Masasi', emoji: '🥐', category: 'kitchen', prompt: 'Place the amigurumi toy on a breakfast table with a cup of coffee and pastry blurred in background. Morning light.' },

  // ── Calisma Odasi ──
  { id: 'study-desk', label: 'Calisma Masasi', emoji: '🖥️', category: 'study', prompt: 'Place the amigurumi toy on a clean modern study desk. Minimalist workspace, bright natural light, monitor blurred.' },
  { id: 'study-bookshelf', label: 'Kitaplik', emoji: '📚', category: 'study', prompt: 'Place the amigurumi toy in front of a cozy bookshelf with colorful books. Warm lighting, hygge atmosphere.' },
  { id: 'study-shelf', label: 'Duvar Rafi', emoji: '📐', category: 'study', prompt: 'Place the amigurumi toy on a modern floating wall shelf in a study room. Clean lines, minimal decor.' },

  // ── Ev Kosesi ──
  { id: 'fireplace', label: 'Somine Onu', emoji: '🔥', category: 'cozy', prompt: 'Place the amigurumi toy on a cozy rug in front of a warm fireplace. Warm golden glow, knit blanket nearby.' },
  { id: 'window-sill', label: 'Pencere Kenari', emoji: '🪟', category: 'cozy', prompt: 'Place the amigurumi toy on a bright window sill with natural daylight. Soft blurred outdoor greenery visible.' },
  { id: 'reading-nook', label: 'Okuma Kosesi', emoji: '📖', category: 'cozy', prompt: 'Place the amigurumi toy in a cozy reading nook with soft cushions and a warm throw blanket. Fairy lights, dreamy.' },
  { id: 'candle-setup', label: 'Mum Isigi', emoji: '🕯️', category: 'cozy', prompt: 'Place the amigurumi toy on a surface surrounded by soft glowing candles. Warm intimate atmosphere.' },
  { id: 'knit-blanket', label: 'Orgu Battaniye', emoji: '🧶', category: 'cozy', prompt: 'Place the amigurumi toy on a soft chunky knit blanket. Cozy hygge atmosphere, warm tones.' },

  // ── Ev Genel ──
  { id: 'home-entrance', label: 'Giris Holu', emoji: '🚪', category: 'general', prompt: 'Place the amigurumi toy on a small console table in a home entrance hallway. Coat hooks and mirror blurred behind.' },
  { id: 'home-stairs', label: 'Merdiven Basamagi', emoji: '🪜', category: 'general', prompt: 'Place the amigurumi toy sitting on a wooden staircase step in a cozy home. Warm lighting from above.' },
  { id: 'home-random', label: 'Ev Rastgele', emoji: '🏠', category: 'general', prompt: 'Place the amigurumi toy in a random cozy spot inside a beautiful home interior. Natural warm lighting, inviting atmosphere.' },
  { id: 'home-floor', label: 'Ev Zemini', emoji: '🟫', category: 'general', prompt: 'Place the amigurumi toy on a clean hardwood floor in a bright home. Furniture blurred in background, natural light.' },
  { id: 'home-radiator', label: 'Kalorifer Ustu', emoji: '♨️', category: 'general', prompt: 'Place the amigurumi toy on top of a radiator shelf cover near a window. Warm cozy home winter feeling.' },
  { id: 'home-bathroom-shelf', label: 'Banyo Rafi', emoji: '🛁', category: 'general', prompt: 'Place the amigurumi toy on a white bathroom shelf next to fluffy towels. Clean bright spa-like atmosphere.' },
];

export const getPresetById = (id: string) =>
  BACKGROUND_PRESETS.find((p) => p.id === id);

export const getPresetsByCategory = (category: string) =>
  BACKGROUND_PRESETS.filter((p) => p.category === category);
