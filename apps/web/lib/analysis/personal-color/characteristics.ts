/**
 * PC-2: 12-Tone 서브타입 특성 및 팔레트
 *
 * @module lib/analysis/personal-color/characteristics
 * @description 12-Tone별 특성 정보 및 색상 팔레트 생성
 * @see {@link docs/principles/color-science.md} 12-Tone 색상 특성
 */

import type {
  TwelveTone,
  SubtypeCharacteristics,
} from './types';

// ============================================
// 12-Tone 특성 데이터
// ============================================

/**
 * 12-Tone별 상세 특성 정보
 */
const TWELVE_TONE_CHARACTERISTICS: Record<TwelveTone, SubtypeCharacteristics> = {
  'light-spring': {
    tone: 'light-spring',
    season: 'spring',
    subtype: 'light',
    koreanName: '라이트 스프링',
    displayName: 'Light Spring',
    description: '밝고 산뜻한 봄 타입. 옅은 파스텔 톤이 어울리며, 피부가 맑고 화사해 보입니다.',
    keywords: ['밝은', '산뜻한', '파스텔', '화사한', '경쾌한'],
    labRange: { L: { min: 68, max: 78 }, a: { min: 5, max: 12 }, b: { min: 18, max: 26 } },
    referenceLab: { L: 72, a: 8, b: 22 },
  },
  'true-spring': {
    tone: 'true-spring',
    season: 'spring',
    subtype: 'true',
    koreanName: '트루 스프링',
    displayName: 'True Spring',
    description: '전형적인 봄 타입. 밝고 따뜻한 색상이 어울리며, 자연스러운 화사함이 특징입니다.',
    keywords: ['따뜻한', '화사한', '생기있는', '자연스러운', '맑은'],
    labRange: { L: { min: 64, max: 72 }, a: { min: 8, max: 16 }, b: { min: 20, max: 28 } },
    referenceLab: { L: 68, a: 12, b: 24 },
  },
  'bright-spring': {
    tone: 'bright-spring',
    season: 'spring',
    subtype: 'bright',
    koreanName: '브라이트 스프링',
    displayName: 'Bright Spring',
    description: '선명한 봄 타입. 채도 높은 밝은 색상이 어울리며, 생동감 있는 분위기를 줍니다.',
    keywords: ['선명한', '생동감', '활기찬', '밝은', '또렷한'],
    labRange: { L: { min: 62, max: 70 }, a: { min: 10, max: 18 }, b: { min: 22, max: 30 } },
    referenceLab: { L: 66, a: 14, b: 26 },
  },
  'light-summer': {
    tone: 'light-summer',
    season: 'summer',
    subtype: 'light',
    koreanName: '라이트 서머',
    displayName: 'Light Summer',
    description: '밝고 부드러운 여름 타입. 연한 파스텔과 차분한 색상이 어울립니다.',
    keywords: ['밝은', '부드러운', '차분한', '우아한', '시원한'],
    labRange: { L: { min: 66, max: 76 }, a: { min: 2, max: 8 }, b: { min: 8, max: 16 } },
    referenceLab: { L: 70, a: 4, b: 12 },
  },
  'true-summer': {
    tone: 'true-summer',
    season: 'summer',
    subtype: 'true',
    koreanName: '트루 서머',
    displayName: 'True Summer',
    description: '전형적인 여름 타입. 부드럽고 시원한 색상이 어울리며, 우아한 분위기를 줍니다.',
    keywords: ['시원한', '부드러운', '세련된', '우아한', '청량한'],
    labRange: { L: { min: 62, max: 70 }, a: { min: 4, max: 10 }, b: { min: 10, max: 18 } },
    referenceLab: { L: 66, a: 6, b: 14 },
  },
  'muted-summer': {
    tone: 'muted-summer',
    season: 'summer',
    subtype: 'muted',
    koreanName: '뮤트 서머',
    displayName: 'Muted Summer',
    description: '차분한 여름 타입. 탁한 파스텔과 그레이 톤이 어울리며, 정제된 분위기를 줍니다.',
    keywords: ['차분한', '정제된', '소프트한', '고급스러운', '은은한'],
    labRange: { L: { min: 60, max: 68 }, a: { min: 3, max: 8 }, b: { min: 7, max: 15 } },
    referenceLab: { L: 64, a: 5, b: 11 },
  },
  'muted-autumn': {
    tone: 'muted-autumn',
    season: 'autumn',
    subtype: 'muted',
    koreanName: '뮤트 오텀',
    displayName: 'Muted Autumn',
    description: '차분한 가을 타입. 흙빛과 올리브 톤이 어울리며, 자연스럽고 포근한 분위기를 줍니다.',
    keywords: ['차분한', '자연스러운', '포근한', '따뜻한', '빈티지'],
    labRange: { L: { min: 54, max: 62 }, a: { min: 6, max: 14 }, b: { min: 14, max: 22 } },
    referenceLab: { L: 58, a: 10, b: 18 },
  },
  'true-autumn': {
    tone: 'true-autumn',
    season: 'autumn',
    subtype: 'true',
    koreanName: '트루 오텀',
    displayName: 'True Autumn',
    description: '전형적인 가을 타입. 따뜻하고 풍부한 색상이 어울리며, 풍성한 분위기를 줍니다.',
    keywords: ['따뜻한', '풍부한', '자연스러운', '풍성한', '클래식'],
    labRange: { L: { min: 50, max: 58 }, a: { min: 10, max: 18 }, b: { min: 18, max: 26 } },
    referenceLab: { L: 54, a: 14, b: 22 },
  },
  'deep-autumn': {
    tone: 'deep-autumn',
    season: 'autumn',
    subtype: 'deep',
    koreanName: '딥 오텀',
    displayName: 'Deep Autumn',
    description: '깊은 가을 타입. 진하고 깊은 따뜻한 색상이 어울리며, 중후하고 고급스러운 분위기를 줍니다.',
    keywords: ['깊은', '진한', '중후한', '고급스러운', '풍부한'],
    labRange: { L: { min: 44, max: 52 }, a: { min: 12, max: 20 }, b: { min: 20, max: 28 } },
    referenceLab: { L: 48, a: 16, b: 24 },
  },
  'true-winter': {
    tone: 'true-winter',
    season: 'winter',
    subtype: 'true',
    koreanName: '트루 윈터',
    displayName: 'True Winter',
    description: '전형적인 겨울 타입. 차갑고 선명한 색상이 어울리며, 시크하고 도시적인 분위기를 줍니다.',
    keywords: ['시크한', '선명한', '차가운', '도시적인', '모던'],
    labRange: { L: { min: 48, max: 56 }, a: { min: 4, max: 10 }, b: { min: 6, max: 14 } },
    referenceLab: { L: 52, a: 6, b: 10 },
  },
  'bright-winter': {
    tone: 'bright-winter',
    season: 'winter',
    subtype: 'bright',
    koreanName: '브라이트 윈터',
    displayName: 'Bright Winter',
    description: '선명한 겨울 타입. 비비드한 색상과 강한 대비가 어울리며, 강렬하고 임팩트 있는 분위기를 줍니다.',
    keywords: ['선명한', '강렬한', '비비드', '임팩트', '대담한'],
    labRange: { L: { min: 52, max: 60 }, a: { min: 5, max: 12 }, b: { min: 8, max: 16 } },
    referenceLab: { L: 56, a: 8, b: 12 },
  },
  'deep-winter': {
    tone: 'deep-winter',
    season: 'winter',
    subtype: 'deep',
    koreanName: '딥 윈터',
    displayName: 'Deep Winter',
    description: '깊은 겨울 타입. 진하고 어두운 차가운 색상이 어울리며, 신비롭고 세련된 분위기를 줍니다.',
    keywords: ['깊은', '신비로운', '세련된', '고급스러운', '차가운'],
    labRange: { L: { min: 40, max: 48 }, a: { min: 2, max: 8 }, b: { min: 4, max: 12 } },
    referenceLab: { L: 44, a: 4, b: 8 },
  },
};

/**
 * 12-Tone 서브타입 특성 조회
 */
export function getSubtypeCharacteristics(tone: TwelveTone): SubtypeCharacteristics {
  return { ...TWELVE_TONE_CHARACTERISTICS[tone] };
}

/**
 * 모든 12-Tone 특성 목록 조회
 */
export function getAllToneCharacteristics(): SubtypeCharacteristics[] {
  return Object.values(TWELVE_TONE_CHARACTERISTICS);
}
