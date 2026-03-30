export interface BackgroundPreset {
  id: string;
  label: string;
  emoji: string;
  prompt: string;
}

export const BACKGROUND_PRESETS: BackgroundPreset[] = [
  {
    id: 'simple-table',
    label: 'Sade Ev - Masa Üstü',
    emoji: '🪑',
    prompt:
      'Place the amigurumi toy on a clean wooden dining table in a simple, bright, minimalist home interior. Soft natural window light, clean white walls, cozy home atmosphere. Professional product photography.',
  },
  {
    id: 'kids-room-carpet',
    label: 'Çocuk Odası - Halı Üstü',
    emoji: '🧸',
    prompt:
      'Place the amigurumi toy on a soft colorful carpet in a bright children\'s room. Pastel colored walls, toys and books visible in soft bokeh background. Warm playful atmosphere, natural daylight.',
  },
  {
    id: 'living-room-sofa',
    label: 'Oturma Odası - Kanepe',
    emoji: '🛋️',
    prompt:
      'Place the amigurumi toy on a cozy beige/cream sofa in a modern living room. Soft cushions around, warm ambient lighting, clean and inviting home atmosphere. Shallow depth of field.',
  },
  {
    id: 'bedroom-bed',
    label: 'Yatak Odası - Yatak Üstü',
    emoji: '🛏️',
    prompt:
      'Place the amigurumi toy on a neatly made bed with white/cream soft bedding and pillows. Cozy bedroom atmosphere, soft morning light coming from window, warm and inviting.',
  },
  {
    id: 'window-sill',
    label: 'Pencere Kenarı',
    emoji: '🪟',
    prompt:
      'Place the amigurumi toy on a bright window sill with beautiful natural daylight streaming in. Soft blurred outdoor greenery visible through window. Clean, airy, peaceful atmosphere.',
  },
  {
    id: 'bookshelf',
    label: 'Kitaplık Önü',
    emoji: '📚',
    prompt:
      'Place the amigurumi toy in front of a cozy bookshelf filled with colorful books. Warm ambient lighting, hygge atmosphere, wooden shelf texture visible. Soft bokeh on books behind.',
  },
  {
    id: 'kitchen-counter',
    label: 'Mutfak Tezgahı',
    emoji: '🍳',
    prompt:
      'Place the amigurumi toy on a clean white marble kitchen counter. Bright modern kitchen background with soft bokeh, warm natural light, a few cute kitchen items blurred in background.',
  },
  {
    id: 'baby-room-crib',
    label: 'Bebek Odası - Beşik Yanı',
    emoji: '👶',
    prompt:
      'Place the amigurumi toy next to a white baby crib in a soft pastel baby nursery room. Gentle lighting, pastel pink or blue tones, dreamy peaceful atmosphere, mobile hanging above.',
  },
  {
    id: 'fireplace',
    label: 'Şömine Önü',
    emoji: '🔥',
    prompt:
      'Place the amigurumi toy on a cozy rug in front of a warm fireplace. Warm golden glow from fire, knit blanket nearby, hygge winter evening atmosphere. Soft and inviting.',
  },
  {
    id: 'balcony-table',
    label: 'Balkon - Sehpa',
    emoji: '🌿',
    prompt:
      'Place the amigurumi toy on a small round coffee table on a cozy balcony. Green plants around, soft outdoor natural light, city or garden view blurred in background. Fresh and airy.',
  },
];

export const getPresetById = (id: string) =>
  BACKGROUND_PRESETS.find((p) => p.id === id);
