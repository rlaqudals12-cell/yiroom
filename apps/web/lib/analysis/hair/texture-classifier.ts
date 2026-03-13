/**
 * Andre Walker 모발 텍스처 분류 시스템
 *
 * 12종 텍스처 (1a-4c) 분류 및 케어 가이드
 * @see https://en.wikipedia.org/wiki/Andre_Walker_Hair_Typing_System
 */

// =============================================================================
// 타입
// =============================================================================

/**
 * Andre Walker 12종 텍스처 코드
 */
export type TextureCode =
  | '1a'
  | '1b'
  | '1c' // Type 1: 직모 (Straight)
  | '2a'
  | '2b'
  | '2c' // Type 2: 웨이브 (Wavy)
  | '3a'
  | '3b'
  | '3c' // Type 3: 곱슬 (Curly)
  | '4a'
  | '4b'
  | '4c'; // Type 4: 코일리 (Coily)

/**
 * 텍스처 주 분류 (4종)
 */
export type TextureGroup = 1 | 2 | 3 | 4;

/**
 * 텍스처 부 분류 (3종)
 */
export type TextureSubgroup = 'a' | 'b' | 'c';

/**
 * 모발 탄력도 (텍스처 판별 보조 지표)
 */
export type Porosity = 'low' | 'medium' | 'high';

/**
 * 텍스처 분류 결과
 */
export interface TextureClassification {
  code: TextureCode;
  group: TextureGroup;
  subgroup: TextureSubgroup;
  label: string;
  labelEn: string;
  description: string;
  curlPattern: string;
  /** 권장 관리 난이도 (1=쉬움, 5=어려움) */
  maintenanceLevel: number;
  /** 수분 필요도 (1=낮음, 5=높음) */
  moistureNeed: number;
  /** 볼륨 특성 */
  volumeCharacteristic: 'flat' | 'slight' | 'moderate' | 'full' | 'maximum';
  /** 취약 요인 */
  vulnerabilities: string[];
  /** 필수 케어 키워드 */
  careKeywords: string[];
}

// =============================================================================
// 텍스처 데이터베이스
// =============================================================================

const TEXTURE_DATABASE: Record<TextureCode, TextureClassification> = {
  // Type 1: 직모 (Straight)
  '1a': {
    code: '1a',
    group: 1,
    subgroup: 'a',
    label: '매우 가는 직모',
    labelEn: 'Fine Straight',
    description: '가늘고 부드러운 직모로, 볼륨이 부족하기 쉽습니다.',
    curlPattern: '완전 직모, 컬 없음',
    maintenanceLevel: 1,
    moistureNeed: 1,
    volumeCharacteristic: 'flat',
    vulnerabilities: ['유분 과다', '볼륨 부족', '정전기'],
    careKeywords: ['볼륨', '경량 제품', '드라이 샴푸'],
  },
  '1b': {
    code: '1b',
    group: 1,
    subgroup: 'b',
    label: '중간 직모',
    labelEn: 'Medium Straight',
    description: '중간 굵기의 직모로, 약간의 볼륨이 있습니다.',
    curlPattern: '직모, 끝부분 미세 굴곡 가능',
    maintenanceLevel: 1,
    moistureNeed: 2,
    volumeCharacteristic: 'slight',
    vulnerabilities: ['열 손상', '끝 갈라짐'],
    careKeywords: ['열 보호', '윤기', '보습 밸런스'],
  },
  '1c': {
    code: '1c',
    group: 1,
    subgroup: 'c',
    label: '굵은 직모',
    labelEn: 'Coarse Straight',
    description: '굵고 강한 직모로, 스타일링이 잘 유지되지 않을 수 있습니다.',
    curlPattern: '직모, 거친 질감',
    maintenanceLevel: 2,
    moistureNeed: 2,
    volumeCharacteristic: 'moderate',
    vulnerabilities: ['거친 질감', '스타일 유지 어려움', '건조'],
    careKeywords: ['연화 트리트먼트', '실리콘 세럼', '보습'],
  },

  // Type 2: 웨이브 (Wavy)
  '2a': {
    code: '2a',
    group: 2,
    subgroup: 'a',
    label: '가벼운 웨이브',
    labelEn: 'Loose Wave',
    description: '자연스러운 S자 웨이브가 있는 모발입니다.',
    curlPattern: 'S자 웨이브, 뿌리 직모',
    maintenanceLevel: 2,
    moistureNeed: 2,
    volumeCharacteristic: 'slight',
    vulnerabilities: ['웨이브 풀림', '습기 민감'],
    careKeywords: ['웨이브 크림', '디퓨저', '가벼운 홀드'],
  },
  '2b': {
    code: '2b',
    group: 2,
    subgroup: 'b',
    label: '중간 웨이브',
    labelEn: 'Medium Wave',
    description: '뚜렷한 S자 웨이브로, 볼륨감이 좋습니다.',
    curlPattern: '뚜렷한 S자, 중간부터 웨이브',
    maintenanceLevel: 3,
    moistureNeed: 3,
    volumeCharacteristic: 'moderate',
    vulnerabilities: ['부스스함', '습기 팽창', '엉킴'],
    careKeywords: ['안티-프리즈', '리브인 컨디셔너', '무스'],
  },
  '2c': {
    code: '2c',
    group: 2,
    subgroup: 'c',
    label: '강한 웨이브',
    labelEn: 'Deep Wave',
    description: '곱슬에 가까운 깊은 웨이브가 있습니다.',
    curlPattern: '깊은 S자, 뿌리부터 웨이브',
    maintenanceLevel: 3,
    moistureNeed: 3,
    volumeCharacteristic: 'full',
    vulnerabilities: ['부스스함', '건조', '정리 어려움'],
    careKeywords: ['컬 크림', '딥 컨디셔닝', '오일'],
  },

  // Type 3: 곱슬 (Curly)
  '3a': {
    code: '3a',
    group: 3,
    subgroup: 'a',
    label: '느슨한 곱슬',
    labelEn: 'Loose Curl',
    description: '큰 루프의 곱슬머리로, 탄력 있는 컬이 특징입니다.',
    curlPattern: '루프형 컬 (지름 2-3cm)',
    maintenanceLevel: 3,
    moistureNeed: 4,
    volumeCharacteristic: 'full',
    vulnerabilities: ['건조', '엉킴', '컬 풀림'],
    careKeywords: ['컬 디파이닝', '보습 마스크', '와이드 콤'],
  },
  '3b': {
    code: '3b',
    group: 3,
    subgroup: 'b',
    label: '중간 곱슬',
    labelEn: 'Springy Curl',
    description: '스프링 같은 탄력 있는 곱슬머리입니다.',
    curlPattern: '스프링 컬 (지름 1-2cm)',
    maintenanceLevel: 4,
    moistureNeed: 4,
    volumeCharacteristic: 'full',
    vulnerabilities: ['건조', '수축', '엉킴', '끊어짐'],
    careKeywords: ['딥 모이스처', '젤', '핑거 코일링'],
  },
  '3c': {
    code: '3c',
    group: 3,
    subgroup: 'c',
    label: '타이트 곱슬',
    labelEn: 'Tight Curl',
    description: '촘촘하고 밀도 높은 곱슬머리입니다.',
    curlPattern: '타이트 코르크스크류 (지름 <1cm)',
    maintenanceLevel: 4,
    moistureNeed: 5,
    volumeCharacteristic: 'maximum',
    vulnerabilities: ['극도 건조', '수축 심함', '끊어짐', '엉킴'],
    careKeywords: ['LOC 메서드', '버터/오일', '프로텍티브 스타일'],
  },

  // Type 4: 코일리 (Coily)
  '4a': {
    code: '4a',
    group: 4,
    subgroup: 'a',
    label: '소프트 코일',
    labelEn: 'Soft Coil',
    description: 'S자 패턴의 촘촘한 코일 모발입니다.',
    curlPattern: 'S형 코일 (지름 ~볼펜)',
    maintenanceLevel: 5,
    moistureNeed: 5,
    volumeCharacteristic: 'maximum',
    vulnerabilities: ['극도 건조', '수축 70%+', '끊어짐', '두피 건조'],
    careKeywords: ['프리푸', '딥 컨디셔닝', '프로텍티브 스타일', '실링 오일'],
  },
  '4b': {
    code: '4b',
    group: 4,
    subgroup: 'b',
    label: 'Z형 코일',
    labelEn: 'Z-pattern Coil',
    description: 'Z자 패턴의 앵글형 코일 모발입니다.',
    curlPattern: 'Z형 앵글 (급격한 꺾임)',
    maintenanceLevel: 5,
    moistureNeed: 5,
    volumeCharacteristic: 'maximum',
    vulnerabilities: ['극도 건조', '끊어짐 취약', '수축 75%+', '매듭'],
    careKeywords: ['LOC/LCO 메서드', '시어버터', '트위스트 아웃', '보호 스타일'],
  },
  '4c': {
    code: '4c',
    group: 4,
    subgroup: 'c',
    label: '타이트 코일',
    labelEn: 'Tight Coil',
    description: '가장 촘촘하고 섬세한 코일 모발입니다.',
    curlPattern: '매우 촘촘한 코일/지그재그',
    maintenanceLevel: 5,
    moistureNeed: 5,
    volumeCharacteristic: 'maximum',
    vulnerabilities: ['극도 건조', '끊어짐 매우 취약', '수축 80%+', '얇은 가닥'],
    careKeywords: ['워시앤고', '트위스트', '버터 실링', '프로텍티브', '로우 매니퓰레이션'],
  },
};

// =============================================================================
// 분류 함수
// =============================================================================

/**
 * 텍스처 코드로 분류 정보 조회
 */
export function getTextureInfo(code: TextureCode): TextureClassification {
  return TEXTURE_DATABASE[code];
}

/**
 * 기본 4-type에서 12-type으로 세분화 추정
 *
 * Gemini 분석 결과 (4종 텍스처 + 보조 지표)를 12종으로 확장
 */
export function classifyTexture(
  baseTexture: 'straight' | 'wavy' | 'curly' | 'coily',
  indicators: {
    /** 모발 굵기 */
    thickness?: 'fine' | 'medium' | 'thick';
    /** 컬 강도 (0-100, 높을수록 강한 컬) */
    curlIntensity?: number;
    /** 모공 흡수도 */
    porosity?: Porosity;
    /** 수축률 (0-1, 젖은 상태 대비 마른 상태 길이 비율) */
    shrinkageRatio?: number;
  } = {}
): TextureCode {
  const { thickness = 'medium', curlIntensity = 50, shrinkageRatio } = indicators;

  switch (baseTexture) {
    case 'straight':
      return classifyStraight(thickness);
    case 'wavy':
      return classifyWavy(curlIntensity);
    case 'curly':
      return classifyCurly(curlIntensity);
    case 'coily':
      return classifyCoily(shrinkageRatio);
  }
}

/** 직모(Type 1) 세분화: 굵기 기반 */
function classifyStraight(thickness: 'fine' | 'medium' | 'thick'): TextureCode {
  if (thickness === 'fine') return '1a';
  if (thickness === 'thick') return '1c';
  return '1b';
}

/** 웨이브(Type 2) 세분화: 컬 강도 기반 */
function classifyWavy(curlIntensity: number): TextureCode {
  if (curlIntensity < 35) return '2a';
  if (curlIntensity > 65) return '2c';
  return '2b';
}

/** 곱슬(Type 3) 세분화: 컬 강도 기반 */
function classifyCurly(curlIntensity: number): TextureCode {
  if (curlIntensity < 35) return '3a';
  if (curlIntensity > 65) return '3c';
  return '3b';
}

/** 코일리(Type 4) 세분화: 수축률 기반 */
function classifyCoily(shrinkageRatio: number | undefined): TextureCode {
  const shrink = shrinkageRatio ?? 0.7;
  if (shrink < 0.7) return '4a';
  if (shrink > 0.8) return '4c';
  return '4b';
}

/**
 * 텍스처 그룹 라벨
 */
export function getTextureGroupLabel(group: TextureGroup): string {
  const labels: Record<TextureGroup, string> = {
    1: '직모 (Straight)',
    2: '웨이브 (Wavy)',
    3: '곱슬 (Curly)',
    4: '코일리 (Coily)',
  };
  return labels[group];
}

/**
 * 텍스처별 추천 제품 카테고리
 */
export function getRecommendedProductCategories(code: TextureCode): string[] {
  const info = TEXTURE_DATABASE[code];
  const categories: string[] = [];

  if (info.moistureNeed >= 4) {
    categories.push('딥 컨디셔너', '헤어 오일', '리브인 트리트먼트');
  } else if (info.moistureNeed >= 3) {
    categories.push('모이스처 크림', '컨디셔너', '헤어 세럼');
  } else {
    categories.push('경량 컨디셔너', '볼륨 스프레이');
  }

  if (info.group >= 3) {
    categories.push('컬 디파이닝 젤', '디퓨저');
  }
  if (info.group === 1) {
    categories.push('드라이 샴푸', '텍스처 스프레이');
  }

  return categories;
}

/**
 * 전체 텍스처 목록 (UI 선택용)
 */
export function getAllTextures(): TextureClassification[] {
  return Object.values(TEXTURE_DATABASE);
}

/**
 * 텍스처 그룹별 필터
 */
export function getTexturesByGroup(group: TextureGroup): TextureClassification[] {
  return Object.values(TEXTURE_DATABASE).filter((t) => t.group === group);
}
