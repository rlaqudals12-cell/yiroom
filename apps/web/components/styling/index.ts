/**
 * Phase J: AI 스타일링 컴포넌트 모듈
 */

// P1: 색상 조합 & 운동복
export {
  default as ColorCombination,
  ColorSwatch,
  OutfitPreview,
  CombinationCard,
} from './ColorCombination';
export { default as WorkoutStyling, WorkoutCard, WorkoutOutfitPreview } from './WorkoutStyling';

// P2: 악세서리 & 메이크업
export { default as AccessoryStyling, MetalToneCard, AccessoryCard } from './AccessoryStyling';
export { default as MakeupStyling, PaletteCard } from './MakeupStyling';

// P3: 전체 코디
export {
  default as FullOutfit,
  ClothingSection,
  AccessorySection,
  MakeupSection,
  OutfitPreviewCard,
} from './FullOutfit';
