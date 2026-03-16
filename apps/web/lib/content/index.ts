// lib/content 공개 API
export {
  getAccessoryRecommendations,
  getGenderAdaptiveTerm,
  filterCategoriesByGender,
  getProductCategoryLabel,
  getStyleSectionTitle,
  isValidGenderProfile,
  createDefaultGenderProfile,
  MALE_ACCESSORY_RECOMMENDATIONS,
  FEMALE_ACCESSORY_RECOMMENDATIONS,
  UNISEX_ACCESSORY_RECOMMENDATIONS,
} from './gender-adaptive';
export type {
  GenderPreference,
  StylePreference,
  UserGenderProfile,
  AccessoryRecommendation,
} from './gender-adaptive';
