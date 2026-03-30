export interface VariantOption {
  id: string;
  label: string;
  emoji: string;
}

export const SCENE_DETAIL_OPTIONS: VariantOption[] = [
  { id: 'simple', label: 'Sade', emoji: '○' },
  { id: 'medium', label: 'Orta', emoji: '◐' },
  { id: 'detailed', label: 'Detayli', emoji: '●' },
];

export const CAMERA_DISTANCE_OPTIONS: VariantOption[] = [
  { id: 'close', label: 'Yakin', emoji: '🔍' },
  { id: 'medium', label: 'Orta', emoji: '📷' },
  { id: 'far', label: 'Uzak', emoji: '🏞️' },
];

export const TOY_SIZE_OPTIONS: VariantOption[] = [
  { id: 'small', label: 'Kucuk', emoji: '🤏' },
  { id: 'medium', label: 'Orta', emoji: '✋' },
  { id: 'large', label: 'Buyuk', emoji: '🖐️' },
];

export const CAMERA_ANGLE_OPTIONS: VariantOption[] = [
  { id: 'front', label: 'On', emoji: '⬆️' },
  { id: 'front-45', label: '45°', emoji: '↗️' },
  { id: 'side', label: 'Yan', emoji: '➡️' },
  { id: 'top', label: 'Ust', emoji: '⬇️' },
  { id: 'low', label: 'Alt', emoji: '⤴️' },
];

export const TOY_POSE_OPTIONS: VariantOption[] = [
  { id: 'keep', label: 'Ayni Kalsın', emoji: '📌' },
  { id: 'sitting', label: 'Oturan', emoji: '🧸' },
  { id: 'standing', label: 'Ayakta', emoji: '🧍' },
  { id: 'lying', label: 'Yatan', emoji: '😴' },
  { id: 'tilted', label: 'Egik', emoji: '↩️' },
];

export interface ConceptVariant {
  sceneDetail: string;
  cameraDistance: string;
  toySize: string;
  cameraAngle: string;
  toyPose: string;
  count: number;
}

export const DEFAULT_VARIANT: ConceptVariant = {
  sceneDetail: 'medium',
  cameraDistance: 'medium',
  toySize: 'medium',
  cameraAngle: 'front-45',
  toyPose: 'keep',
  count: 1,
};

export function variantToPrompt(v: ConceptVariant): string {
  const parts: string[] = [];

  // Scene detail
  if (v.sceneDetail === 'simple') parts.push('Very clean and simple scene with minimal props.');
  else if (v.sceneDetail === 'detailed') parts.push('Rich detailed scene with many contextual props and decorations.');

  // Camera distance
  if (v.cameraDistance === 'close') parts.push('Close-up shot, toy fills most of the frame.');
  else if (v.cameraDistance === 'far') parts.push('Wide shot showing the full room environment, toy is smaller in frame.');

  // Toy size in frame
  if (v.toySize === 'small') parts.push('The toy appears small in the scene, environment is dominant.');
  else if (v.toySize === 'large') parts.push('The toy is prominently large in the frame, filling most of the image.');

  // Camera angle
  if (v.cameraAngle === 'front') parts.push('Photographed straight from the front.');
  else if (v.cameraAngle === 'side') parts.push('Photographed from the side angle.');
  else if (v.cameraAngle === 'top') parts.push('Top-down bird eye view photograph.');
  else if (v.cameraAngle === 'low') parts.push('Low angle photograph looking slightly upward at the toy.');

  // Toy pose
  if (v.toyPose === 'sitting') parts.push('The toy is in a cute sitting position.');
  else if (v.toyPose === 'standing') parts.push('The toy is standing upright.');
  else if (v.toyPose === 'lying') parts.push('The toy is lying on its side in a relaxed pose.');
  else if (v.toyPose === 'tilted') parts.push('The toy is slightly tilted to one side in a playful pose.');

  return parts.join(' ');
}
