/**
 * 사용자 선호/기피 시스템 다국어 레이블
 * @description 문화권별 자연스러운 표현 제공
 * @version 1.0
 */

import type { AvoidLevel, AvoidReason, PreferenceDomain } from '@/types/preferences';

// =============================================================================
// 지원 언어
// =============================================================================

export type SupportedLocale = 'ko' | 'en' | 'ja' | 'zh_CN' | 'zh_TW';

// =============================================================================
// 기피 수준 레이블
// =============================================================================

/**
 * 기피 수준 레이블 - 문화권별 자연스러운 표현
 */
export const AVOID_LEVEL_LABELS: Record<SupportedLocale, Record<AvoidLevel, string>> = {
  ko: {
    dislike: '안 좋아해요',
    avoid: '피하고 싶어요',
    cannot: '못 먹어요',
    danger: '절대 안 돼요',
  },
  en: {
    dislike: "I don't like it",
    avoid: 'I prefer to avoid',
    cannot: "I can't have this",
    danger: 'Life-threatening',
  },
  ja: {
    dislike: '好きじゃない',
    avoid: '避けたい',
    cannot: '食べられない',
    danger: '絶対ダメ',
  },
  zh_CN: {
    dislike: '不太喜欢',
    avoid: '尽量避免',
    cannot: '不能吃',
    danger: '绝对不行',
  },
  zh_TW: {
    dislike: '不太喜歡',
    avoid: '盡量避免',
    cannot: '不能吃',
    danger: '絕對不行',
  },
} as const;

// =============================================================================
// 도메인별 "못 X" 동사 변형
// =============================================================================

/**
 * 도메인별 "cannot" 레벨 동사 변형
 * - 영양: 못 먹어요
 * - 운동: 못 해요
 * - 뷰티: 못 써요
 */
export const CANNOT_VERB_LABELS: Record<SupportedLocale, Record<PreferenceDomain, string>> = {
  ko: {
    nutrition: '못 먹어요',
    workout: '못 해요',
    beauty: '못 써요',
    color: '안 어울려요',
    style: '못 입어요',
  },
  en: {
    nutrition: "I can't eat",
    workout: "I can't do",
    beauty: "I can't use",
    color: "Doesn't suit me",
    style: "I can't wear",
  },
  ja: {
    nutrition: '食べられない',
    workout: 'できない',
    beauty: '使えない',
    color: '似合わない',
    style: '着られない',
  },
  zh_CN: {
    nutrition: '不能吃',
    workout: '不能做',
    beauty: '不能用',
    color: '不适合',
    style: '不能穿',
  },
  zh_TW: {
    nutrition: '不能吃',
    workout: '不能做',
    beauty: '不能用',
    color: '不適合',
    style: '不能穿',
  },
} as const;

// =============================================================================
// 기피 이유 레이블
// =============================================================================

/**
 * 기피 이유 레이블
 */
export const AVOID_REASON_LABELS: Record<SupportedLocale, Record<AvoidReason, string>> = {
  ko: {
    allergy: '알레르기',
    intolerance: '불내증',
    medical: '의료적 제한',
    injury: '부상/통증',
    religious: '종교적 이유',
    ethical: '윤리적 이유',
    health: '건강 관리',
    physical_limitation: '신체적 제약',
    skin_reaction: '피부 반응',
    taste: '맛/식감',
    smell: '냄새',
    uncomfortable: '불편함',
  },
  en: {
    allergy: 'Allergy',
    intolerance: 'Intolerance',
    medical: 'Medical condition',
    injury: 'Injury/Pain',
    religious: 'Religious reason',
    ethical: 'Ethical reason',
    health: 'Health management',
    physical_limitation: 'Physical limitation',
    skin_reaction: 'Skin reaction',
    taste: 'Taste/Texture',
    smell: 'Smell',
    uncomfortable: 'Uncomfortable',
  },
  ja: {
    allergy: 'アレルギー',
    intolerance: '不耐症',
    medical: '医療上の制限',
    injury: '怪我・痛み',
    religious: '宗教上の理由',
    ethical: '倫理的理由',
    health: '健康管理',
    physical_limitation: '身体的制約',
    skin_reaction: '肌の反応',
    taste: '味・食感',
    smell: '匂い',
    uncomfortable: '不快感',
  },
  zh_CN: {
    allergy: '过敏',
    intolerance: '不耐受',
    medical: '医疗限制',
    injury: '受伤/疼痛',
    religious: '宗教原因',
    ethical: '伦理原因',
    health: '健康管理',
    physical_limitation: '身体限制',
    skin_reaction: '皮肤反应',
    taste: '口味/口感',
    smell: '气味',
    uncomfortable: '不舒服',
  },
  zh_TW: {
    allergy: '過敏',
    intolerance: '不耐受',
    medical: '醫療限制',
    injury: '受傷/疼痛',
    religious: '宗教原因',
    ethical: '倫理原因',
    health: '健康管理',
    physical_limitation: '身體限制',
    skin_reaction: '皮膚反應',
    taste: '口味/口感',
    smell: '氣味',
    uncomfortable: '不舒服',
  },
} as const;

// =============================================================================
// UI 색상 코드
// =============================================================================

/**
 * 기피 수준별 UI 색상 코드
 */
export const AVOID_LEVEL_COLORS: Record<
  AvoidLevel,
  { bg: string; text: string; border: string; icon: string }
> = {
  dislike: {
    bg: 'bg-gray-100 dark:bg-gray-800',
    text: 'text-gray-600 dark:text-gray-400',
    border: 'border-gray-300 dark:border-gray-600',
    icon: '⚪',
  },
  avoid: {
    bg: 'bg-yellow-100 dark:bg-yellow-900/30',
    text: 'text-yellow-600 dark:text-yellow-400',
    border: 'border-yellow-300 dark:border-yellow-600',
    icon: '🟡',
  },
  cannot: {
    bg: 'bg-orange-100 dark:bg-orange-900/30',
    text: 'text-orange-600 dark:text-orange-400',
    border: 'border-orange-300 dark:border-orange-600',
    icon: '🟠',
  },
  danger: {
    bg: 'bg-red-100 dark:bg-red-900/30',
    text: 'text-red-600 dark:text-red-400',
    border: 'border-red-300 dark:border-red-600',
    icon: '🔴',
  },
} as const;

// =============================================================================
// 유틸리티 함수
// =============================================================================

/**
 * 현재 로케일에 맞는 기피 수준 레이블 반환
 */
export function getAvoidLevelLabel(level: AvoidLevel, locale: SupportedLocale = 'ko'): string {
  return AVOID_LEVEL_LABELS[locale][level];
}

/**
 * 도메인에 맞는 "cannot" 레이블 반환
 */
export function getCannotLabel(domain: PreferenceDomain, locale: SupportedLocale = 'ko'): string {
  return CANNOT_VERB_LABELS[locale][domain];
}

/**
 * 현재 로케일에 맞는 기피 이유 레이블 반환
 */
export function getAvoidReasonLabel(reason: AvoidReason, locale: SupportedLocale = 'ko'): string {
  return AVOID_REASON_LABELS[locale][reason];
}

/**
 * 기피 수준 색상 클래스 반환
 */
export function getAvoidLevelColors(level: AvoidLevel) {
  return AVOID_LEVEL_COLORS[level];
}

// =============================================================================
// FDA 9대 알레르겐 레이블
// =============================================================================

/**
 * FDA 9대 주요 알레르겐 레이블
 */
export const FDA_ALLERGEN_LABELS = {
  ko: {
    milk: '우유',
    eggs: '달걀',
    fish: '생선',
    shellfish: '갑각류',
    tree_nuts: '견과류',
    peanuts: '땅콩',
    wheat: '밀',
    soybeans: '대두',
    sesame: '참깨',
  },
  en: {
    milk: 'Milk',
    eggs: 'Eggs',
    fish: 'Fish',
    shellfish: 'Shellfish',
    tree_nuts: 'Tree Nuts',
    peanuts: 'Peanuts',
    wheat: 'Wheat',
    soybeans: 'Soybeans',
    sesame: 'Sesame',
  },
  ja: {
    milk: '乳',
    eggs: '卵',
    fish: '魚',
    shellfish: '甲殻類',
    tree_nuts: 'ナッツ類',
    peanuts: '落花生',
    wheat: '小麦',
    soybeans: '大豆',
    sesame: 'ごま',
  },
  zh_CN: {
    milk: '牛奶',
    eggs: '鸡蛋',
    fish: '鱼',
    shellfish: '贝类',
    tree_nuts: '坚果',
    peanuts: '花生',
    wheat: '小麦',
    soybeans: '大豆',
    sesame: '芝麻',
  },
  zh_TW: {
    milk: '牛奶',
    eggs: '雞蛋',
    fish: '魚',
    shellfish: '貝類',
    tree_nuts: '堅果',
    peanuts: '花生',
    wheat: '小麥',
    soybeans: '大豆',
    sesame: '芝麻',
  },
} as const;

/**
 * 식이 제한 레이블
 */
export const DIETARY_RESTRICTION_LABELS = {
  ko: {
    vegetarian: '채식',
    vegan: '완전 채식',
    pescatarian: '페스코 채식',
    halal: '할랄',
    kosher: '코셔',
    lactose_free: '유당불내증',
    gluten_free: '글루텐프리',
    low_sodium: '저염식',
    low_sugar: '저당식',
    keto: '키토/저탄수화물',
    fodmap: '저포드맵',
  },
  en: {
    vegetarian: 'Vegetarian',
    vegan: 'Vegan',
    pescatarian: 'Pescatarian',
    halal: 'Halal',
    kosher: 'Kosher',
    lactose_free: 'Lactose-free',
    gluten_free: 'Gluten-free',
    low_sodium: 'Low-sodium',
    low_sugar: 'Low-sugar',
    keto: 'Keto/Low-carb',
    fodmap: 'Low-FODMAP',
  },
  ja: {
    vegetarian: 'ベジタリアン',
    vegan: 'ビーガン',
    pescatarian: 'ペスカタリアン',
    halal: 'ハラール',
    kosher: 'コーシャ',
    lactose_free: '乳糖不耐症対応',
    gluten_free: 'グルテンフリー',
    low_sodium: '減塩',
    low_sugar: '低糖質',
    keto: 'ケト/低炭水化物',
    fodmap: '低FODMAP',
  },
  zh_CN: {
    vegetarian: '素食',
    vegan: '纯素',
    pescatarian: '鱼素',
    halal: '清真',
    kosher: '犹太洁食',
    lactose_free: '无乳糖',
    gluten_free: '无麸质',
    low_sodium: '低钠',
    low_sugar: '低糖',
    keto: '生酮/低碳',
    fodmap: '低FODMAP',
  },
  zh_TW: {
    vegetarian: '素食',
    vegan: '純素',
    pescatarian: '魚素',
    halal: '清真',
    kosher: '猶太潔食',
    lactose_free: '無乳糖',
    gluten_free: '無麩質',
    low_sodium: '低鈉',
    low_sugar: '低糖',
    keto: '生酮/低碳',
    fodmap: '低FODMAP',
  },
} as const;
