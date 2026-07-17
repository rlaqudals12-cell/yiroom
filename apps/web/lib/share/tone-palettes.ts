/**
 * 공유카드용 12톤 큐레이션 팔레트 — 진단 톤의 "표준 스와치"
 * (베스트 6 + 피해야 할 색 4 + 포인트 컬러 3 + 액세서리 금속 2)
 *
 * 포인트 컬러: 베스트 6이 웨어러블 기본색이라면, 포인트는 같은 톤 안에서 립·네일·
 * 포인트 아이템에 쓰는 진하고 또렷한 강조 축(12톤 표준 관습). 금속은 톤별 수작업이
 * 아니라 시즌 패밀리 파생 — 웜(spring/autumn)=골드·로즈 골드, 쿨(summer/winter)=실버·화이트 골드.
 *
 * 왜 별도 큐레이션인가: 통합 플로우의 정적 v2 팔레트(personal-color-v2/classify.ts)는
 * 웹세이프 제네릭 색(뮤티드 서머=회색 6단계, 브라이트 윈터=순수 RGB 원색)이라
 * 뷰티 공유카드에 올리면 신뢰를 깎는다. 여기 팔레트는 퍼스널컬러 업계의 12톤 표준
 * 시즌 팔레트 관습(웨어러블·뷰티 톤)을 따라 수작업 큐레이션한 것이다.
 *
 * 정직성: 오프라인 진단의 관습 그대로 "진단된 톤 → 그 톤의 표준 팔레트"를 보여주는
 * 것이므로 지어내기가 아니다(개인 실측 색이 이름과 함께 존재하면 호출부가 그것을 우선).
 *
 * 이름 로케일: ko 큐레이션 + en(뷰티 관용 표기). ja/zh는 en 폴백(외래어 표기 관습).
 *
 * @module lib/share/tone-palettes
 * @see memory design-taste-moat(진단 팔레트=주인공) · 조사 2026-07-15(업계 팔레트 관습)
 */

import type { OutputLocale } from '@/lib/gemini/client';

export interface CardPaletteColor {
  hex: string;
  /** 로케일 해석된 색이름 */
  name: string;
}

export interface CardPalette {
  /** 베스트 컬러 6 — 카드 전면 밴드(이름 포함) */
  best: CardPaletteColor[];
  /** 피해야 할 색 4 — 소밴드(이름 없음, 재미·전문성 신호) */
  avoid: { hex: string }[];
  /** 포인트 컬러 3 — 립·네일·포인트 아이템용 강조 축(베스트가 웨어러블 기본색이라면 이쪽은 같은 톤의 진한 축) */
  accent: CardPaletteColor[];
  /** 액세서리 금속 2 — 시즌 패밀리 파생(웜=골드·로즈 골드 / 쿨=실버·화이트 골드) */
  metals: CardPaletteColor[];
}

interface CuratedColor {
  hex: string;
  ko: string;
  en: string;
}

interface CuratedTone {
  best: CuratedColor[];
  avoid: string[];
  /** 포인트 컬러 3 — best와 hex 중복 금지(테스트가 강제) */
  accent: CuratedColor[];
}

// 12톤 표준 시즌 팔레트 (kebab-case 키 = personal-color-v2 TwelveTone과 동일)
const CURATED: Record<string, CuratedTone> = {
  'light-spring': {
    best: [
      { hex: '#F6C9A0', ko: '아프리콧', en: 'Apricot' },
      { hex: '#F9A98F', ko: '코랄 피치', en: 'Coral Peach' },
      { hex: '#F7E3A1', ko: '버터 크림', en: 'Butter Cream' },
      { hex: '#BFE0B2', ko: '스프링 민트', en: 'Spring Mint' },
      { hex: '#F8CBD5', ko: '베이비 핑크', en: 'Baby Pink' },
      { hex: '#A9D8DC', ko: '라이트 아쿠아', en: 'Light Aqua' },
    ],
    avoid: ['#101014', '#5C2233', '#46295E', '#33363F'],
    // 라이트 스프링 포인트 — 맑고 밝은 웜 계열에서 채도만 올린 축(무거운 색은 톤 파괴)
    accent: [
      { hex: '#F2765C', ko: '피치 코랄', en: 'Peach Coral' },
      { hex: '#EF6A85', ko: '워터멜론 핑크', en: 'Watermelon Pink' },
      { hex: '#EFA94A', ko: '마리골드', en: 'Marigold' },
    ],
  },
  'true-spring': {
    best: [
      { hex: '#F4795B', ko: '웜 코랄', en: 'Warm Coral' },
      { hex: '#F2B33D', ko: '골든 옐로우', en: 'Golden Yellow' },
      { hex: '#9CCC65', ko: '애플 그린', en: 'Apple Green' },
      { hex: '#45C6B8', ko: '터쿼이즈', en: 'Turquoise' },
      { hex: '#FF8FA3', ko: '웜 핑크', en: 'Warm Pink' },
      { hex: '#D9A05B', ko: '카멜 베이지', en: 'Camel Beige' },
    ],
    avoid: ['#33363F', '#9A86A6', '#71829A', '#101014'],
    // 트루 스프링 포인트 — 노랑 기가 살아있는 선명한 레드·오렌지 축(블루 베이스 레드는 회피)
    accent: [
      { hex: '#E03C31', ko: '토마토 레드', en: 'Tomato Red' },
      { hex: '#E8622C', ko: '캐럿 오렌지', en: 'Carrot Orange' },
      { hex: '#E85D75', ko: '코랄 로즈', en: 'Coral Rose' },
    ],
  },
  'bright-spring': {
    best: [
      { hex: '#FF5A4E', ko: '브라이트 코랄', en: 'Bright Coral' },
      { hex: '#FF8C42', ko: '선셋 오렌지', en: 'Sunset Orange' },
      { hex: '#FFD23F', ko: '브라이트 옐로우', en: 'Bright Yellow' },
      { hex: '#17C3B2', ko: '브라이트 아쿠아', en: 'Bright Aqua' },
      { hex: '#FF4E88', ko: '체리 핑크', en: 'Cherry Pink' },
      { hex: '#59C959', ko: '프레시 그린', en: 'Fresh Green' },
    ],
    avoid: ['#A08B76', '#71829A', '#9AA57C', '#4E342E'],
    // 브라이트 스프링 포인트 — 최고 채도를 견디는 톤이라 포인트도 비비드로(뮤트가 최대 리스크)
    accent: [
      { hex: '#E0313A', ko: '포피 레드', en: 'Poppy Red' },
      { hex: '#FF6F3C', ko: '탠저린', en: 'Tangerine' },
      { hex: '#F0389C', ko: '핫 핑크', en: 'Hot Pink' },
    ],
  },
  'light-summer': {
    best: [
      { hex: '#AEC9E8', ko: '파우더 블루', en: 'Powder Blue' },
      { hex: '#CDB8E0', ko: '라일락', en: 'Lilac' },
      { hex: '#F3C1CE', ko: '로즈 핑크', en: 'Rose Pink' },
      { hex: '#BFE3D4', ko: '아이스 민트', en: 'Ice Mint' },
      { hex: '#E8B7C4', ko: '로즈 쿼츠', en: 'Rose Quartz' },
      { hex: '#B8C4D9', ko: '미스티 블루', en: 'Misty Blue' },
    ],
    avoid: ['#BF6A3F', '#C99A3C', '#A34A33', '#4E342E'],
    // 라이트 서머 포인트 — 파스텔 베이스에서 한 단계만 진해진 쿨 핑크·퍼플·블루 축
    accent: [
      { hex: '#D8618F', ko: '라즈베리 소르베', en: 'Raspberry Sorbet' },
      { hex: '#B87BC7', ko: '오키드', en: 'Orchid' },
      { hex: '#6C8CD5', ko: '콘플라워 블루', en: 'Cornflower Blue' },
    ],
  },
  'true-summer': {
    best: [
      { hex: '#7A9CC6', ko: '소프트 블루', en: 'Soft Blue' },
      { hex: '#D98A9F', ko: '로즈 핑크', en: 'Rose Pink' },
      { hex: '#A98BB8', ko: '소프트 퍼플', en: 'Soft Purple' },
      { hex: '#6E88A6', ko: '스틸 블루', en: 'Steel Blue' },
      { hex: '#C4849C', ko: '모브 로즈', en: 'Mauve Rose' },
      { hex: '#8FB3AB', ko: '세이지 민트', en: 'Sage Mint' },
    ],
    avoid: ['#E07E38', '#C99A3C', '#A34A33', '#C09A6B'],
    // 트루 서머 포인트 — 블루 베이스의 진한 베리·바이올렛 축(옐로 베이스 레드는 회피)
    accent: [
      { hex: '#B3446C', ko: '라즈베리', en: 'Raspberry' },
      { hex: '#CE4967', ko: '워터멜론', en: 'Watermelon' },
      { hex: '#8A62A8', ko: '아메시스트', en: 'Amethyst' },
    ],
  },
  'muted-summer': {
    best: [
      { hex: '#C79AA0', ko: '더스티 로즈', en: 'Dusty Rose' },
      { hex: '#9A86A6', ko: '소프트 라일락', en: 'Soft Lilac' },
      { hex: '#A7BACF', ko: '파우더 블루', en: 'Powder Blue' },
      { hex: '#B98BA4', ko: '모브 핑크', en: 'Mauve Pink' },
      { hex: '#71829A', ko: '슬레이트', en: 'Slate' },
      { hex: '#A67E84', ko: '로즈 브라운', en: 'Rose Brown' },
    ],
    // 실제 원단 염료 수준의 비비드(네온 RGB 금지 — 패널 5인 만장일치: 뮤트 지면을 깨는 유일 요소)
    avoid: ['#E04A40', '#E8BE3A', '#E07E38', '#0E9E72'],
    // 뮤트 서머 포인트 — 회기 머금은 베리·플럼·로즈우드 축(비비드는 톤 파괴, 깊이로만 강조)
    accent: [
      { hex: '#8E4A5B', ko: '뮤트 베리', en: 'Muted Berry' },
      { hex: '#7E6293', ko: '더스티 플럼', en: 'Dusty Plum' },
      { hex: '#A85860', ko: '로즈우드', en: 'Rosewood' },
    ],
  },
  'muted-autumn': {
    best: [
      { hex: '#C09A6B', ko: '카멜', en: 'Camel' },
      { hex: '#9AA57C', ko: '세이지', en: 'Sage' },
      { hex: '#C08063', ko: '더스티 테라코타', en: 'Dusty Terracotta' },
      { hex: '#A08B76', ko: '토프', en: 'Taupe' },
      { hex: '#9E6B63', ko: '뮤트 마르살라', en: 'Muted Marsala' },
      { hex: '#8A8B5C', ko: '올리브', en: 'Olive' },
    ],
    avoid: ['#C93A80', '#3158C4', '#C42C88', '#AEC9E8'],
    // 뮤트 어텀 포인트 — 흙기 있는 스파이스 축(시나몬·앤틱 골드·마르살라), 채도는 낮게 유지
    accent: [
      { hex: '#9B5A3C', ko: '시나몬', en: 'Cinnamon' },
      { hex: '#A9853C', ko: '앤틱 골드', en: 'Antique Gold' },
      { hex: '#964F4C', ko: '마르살라', en: 'Marsala' },
    ],
  },
  'true-autumn': {
    best: [
      { hex: '#BF6A3F', ko: '테라코타', en: 'Terracotta' },
      { hex: '#C99A3C', ko: '머스터드', en: 'Mustard' },
      { hex: '#77803F', ko: '올리브 그린', en: 'Olive Green' },
      { hex: '#A34A33', ko: '브릭 레드', en: 'Brick Red' },
      { hex: '#B37B4C', ko: '캐러멜', en: 'Caramel' },
      { hex: '#5C6B44', ko: '포레스트', en: 'Forest' },
    ],
    avoid: ['#F3C1CE', '#AEC9E8', '#C42C88', '#CDB8E0'],
    // 트루 어텀 포인트 — 벽돌·버건디·스파이스의 진한 웜 축(업계 표준: 러스트 립이 대표)
    accent: [
      { hex: '#9E4624', ko: '러스트', en: 'Rust' },
      { hex: '#7C3030', ko: '웜 버건디', en: 'Warm Burgundy' },
      { hex: '#C77A2B', ko: '사프란', en: 'Saffron' },
    ],
  },
  'deep-autumn': {
    best: [
      { hex: '#7B3F2E', ko: '마호가니', en: 'Mahogany' },
      { hex: '#55603A', ko: '다크 올리브', en: 'Dark Olive' },
      { hex: '#4E342E', ko: '초콜릿', en: 'Chocolate' },
      { hex: '#9C7A3C', ko: '다크 골드', en: 'Dark Gold' },
      { hex: '#6E3B3B', ko: '와인 브라운', en: 'Wine Brown' },
      { hex: '#2F5D5A', ko: '딥 티일', en: 'Deep Teal' },
    ],
    avoid: ['#F3C1CE', '#AEC9E8', '#BFE3D4', '#F7E3A1'],
    // 딥 어텀 포인트 — 어둡고 농밀한 축(옥스블러드 립·퍼시몬·브론즈), 파스텔은 금물
    accent: [
      { hex: '#63282B', ko: '옥스블러드', en: 'Oxblood' },
      { hex: '#C34A2C', ko: '퍼시몬', en: 'Persimmon' },
      { hex: '#8C6239', ko: '브론즈', en: 'Bronze' },
    ],
  },
  'deep-winter': {
    best: [
      { hex: '#1F2A56', ko: '딥 네이비', en: 'Deep Navy' },
      { hex: '#6B2237', ko: '버건디', en: 'Burgundy' },
      { hex: '#46295E', ko: '다크 퍼플', en: 'Dark Purple' },
      { hex: '#0F5148', ko: '딥 에메랄드', en: 'Deep Emerald' },
      { hex: '#8E2C48', ko: '크랜베리', en: 'Cranberry' },
      { hex: '#33363F', ko: '차콜', en: 'Charcoal' },
    ],
    avoid: ['#F6C9A0', '#C99A3C', '#C09A6B', '#F7E3A1'],
    // 딥 윈터 포인트 — 어둠 속에서 선명한 보석 축(루비·푸시아·플럼), 흐린 색은 회피
    accent: [
      { hex: '#9E1B32', ko: '루비 레드', en: 'Ruby Red' },
      { hex: '#A3216F', ko: '딥 푸시아', en: 'Deep Fuchsia' },
      { hex: '#6D2A66', ko: '딥 플럼', en: 'Deep Plum' },
    ],
  },
  'true-winter': {
    best: [
      { hex: '#C8102E', ko: '트루 레드', en: 'True Red' },
      { hex: '#2648C8', ko: '로열 블루', en: 'Royal Blue' },
      { hex: '#C42C88', ko: '푸시아', en: 'Fuchsia' },
      { hex: '#0E7C61', ko: '에메랄드', en: 'Emerald' },
      { hex: '#FFFFFF', ko: '퓨어 화이트', en: 'Pure White' },
      { hex: '#101014', ko: '블랙', en: 'Black' },
    ],
    avoid: ['#D2B48C', '#C09A6B', '#F6C9A0', '#A08B76'],
    // 트루 윈터 포인트 — 블루 베이스 고채도 축(라즈베리·바이올렛·사파이어), 웜 브라운은 금물
    accent: [
      { hex: '#C51E5A', ko: '라즈베리', en: 'Raspberry' },
      { hex: '#7F3F98', ko: '비비드 바이올렛', en: 'Vivid Violet' },
      { hex: '#1D50A2', ko: '사파이어', en: 'Sapphire' },
    ],
  },
  'bright-winter': {
    best: [
      { hex: '#E0218A', ko: '마젠타', en: 'Magenta' },
      { hex: '#2757D9', ko: '코발트 블루', en: 'Cobalt Blue' },
      { hex: '#00A878', ko: '브라이트 에메랄드', en: 'Bright Emerald' },
      { hex: '#E4173E', ko: '체리 레드', en: 'Cherry Red' },
      { hex: '#F6C9DC', ko: '아이스 핑크', en: 'Ice Pink' },
      { hex: '#101014', ko: '블랙', en: 'Black' },
    ],
    avoid: ['#A08B76', '#9AA57C', '#C09A6B', '#A67E84'],
    // 브라이트 윈터 포인트 — 푸시아·블루 레드 계열 최고 채도 축(뮤트가 최대 리스크)
    accent: [
      { hex: '#C2185B', ko: '립스틱 레드', en: 'Lipstick Red' },
      { hex: '#8F2BBC', ko: '일렉트릭 퍼플', en: 'Electric Purple' },
      { hex: '#F02D9C', ko: '쇼킹 핑크', en: 'Shocking Pink' },
    ],
  },
};

// 4계절 폴백 — tone이 12톤이 아니라 계절(season)만 있을 때 트루 톤 팔레트로 매핑
const SEASON_FALLBACK: Record<string, string> = {
  spring: 'true-spring',
  summer: 'true-summer',
  autumn: 'true-autumn',
  winter: 'true-winter',
};

// 액세서리 금속 — 톤별 수작업이 아닌 시즌 패밀리 파생(업계 관습: 웜=골드 베이스, 쿨=실버 베이스).
// hex는 스와치 렌더용 자연스러운 금속 톤(순색 노랑/회색이 아니라 실제 주얼리 색감으로 큐레이션).
const METALS_BY_FAMILY: Record<'warm' | 'cool', CuratedColor[]> = {
  warm: [
    { hex: '#D4A548', ko: '골드', en: 'Gold' },
    { hex: '#C48A7E', ko: '로즈 골드', en: 'Rose Gold' },
  ],
  cool: [
    { hex: '#C8CCD2', ko: '실버', en: 'Silver' },
    { hex: '#D9D5C9', ko: '화이트 골드', en: 'White Gold' },
  ],
};

// 12톤 키는 전부 '-spring/-summer/-autumn/-winter'로 끝난다 — 접미사로 웜/쿨 패밀리 판정
function metalFamilyOf(toneKey: string): 'warm' | 'cool' {
  return toneKey.endsWith('spring') || toneKey.endsWith('autumn') ? 'warm' : 'cool';
}

/**
 * 진단 톤의 카드 팔레트(베스트 6 + 피해야 할 색 4 + 포인트 3 + 금속 2)를 로케일 해석해 반환.
 * 미지의 톤이면 null — 카드는 팔레트 없이 렌더(지어내지 않음).
 */
export function getCardPalette(
  tone: string | null | undefined,
  locale: OutputLocale = 'ko'
): CardPalette | null {
  if (!tone) return null;
  // SEASON_FALLBACK 경로도 여기서 트루 톤 키로 정규화 — 이후 accent/metals 파생이 동일하게 동작
  const key = CURATED[tone] ? tone : SEASON_FALLBACK[tone];
  if (!key) return null;
  const curated = CURATED[key];
  if (!curated) return null;

  // ja/zh는 en 폴백(뷰티 색이름 외래어 관습) — 별도 큐레이션 비용 없이 4로케일 커버
  const useKo = locale === 'ko';
  const localize = (c: CuratedColor): CardPaletteColor => ({
    hex: c.hex,
    name: useKo ? c.ko : c.en,
  });
  return {
    best: curated.best.map(localize),
    avoid: curated.avoid.map((hex) => ({ hex })),
    accent: curated.accent.map(localize),
    metals: METALS_BY_FAMILY[metalFamilyOf(key)].map(localize),
  };
}
