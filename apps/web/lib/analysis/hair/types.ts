/**
 * H-1 헤어분석 타입 정의
 *
 * @description 얼굴형 기반 헤어스타일 추천 시스템
 * @see docs/specs/SDD-HAIR-ANALYSIS.md
 */

import type { LabColor } from '../personal-color-v2';
import type { Landmark33 } from '../body-v2';

// =============================================================================
// 얼굴형 타입
// =============================================================================

/**
 * 얼굴형 분류 (7가지)
 */
export type FaceShapeType =
  | 'oval'        // 타원형 (이상적)
  | 'round'       // 둥근형
  | 'square'      // 사각형
  | 'heart'       // 하트형 (역삼각형)
  | 'oblong'      // 긴 형
  | 'diamond'     // 다이아몬드형
  | 'rectangle';  // 직사각형

/**
 * 얼굴형 한국어 라벨
 */
export const FACE_SHAPE_LABELS: Record<FaceShapeType, string> = {
  oval: '타원형',
  round: '둥근형',
  square: '사각형',
  heart: '하트형',
  oblong: '긴 형',
  diamond: '다이아몬드형',
  rectangle: '직사각형',
};

/**
 * 얼굴형별 설명
 */
export const FACE_SHAPE_DESCRIPTIONS: Record<FaceShapeType, string> = {
  oval: '이상적인 얼굴형으로 대부분의 헤어스타일이 잘 어울립니다.',
  round: '볼이 넓고 턱선이 부드러운 형태로, 세로 길이감을 주는 스타일이 좋습니다.',
  square: '이마와 턱이 넓고 각진 형태로, 부드러운 곡선의 스타일이 어울립니다.',
  heart: '이마가 넓고 턱이 좁은 형태로, 볼륨을 아래에 주는 스타일이 좋습니다.',
  oblong: '세로로 긴 형태로, 가로 볼륨을 주는 스타일이 어울립니다.',
  diamond: '광대가 넓고 이마와 턱이 좁은 형태로, 이마와 턱에 볼륨을 주는 스타일이 좋습니다.',
  rectangle: '세로로 길고 각진 형태로, 부드러운 웨이브와 가로 볼륨이 어울립니다.',
};

// =============================================================================
// 헤어 타입
// =============================================================================

/**
 * 헤어 굵기
 */
export type HairThickness = 'fine' | 'medium' | 'thick';

/**
 * 헤어 질감
 */
export type HairTexture = 'straight' | 'wavy' | 'curly' | 'coily';

/**
 * 헤어 밀도
 */
export type HairDensity = 'thin' | 'normal' | 'dense';

/**
 * 두피 상태
 */
export type ScalpCondition = 'dry' | 'normal' | 'oily' | 'sensitive';

// =============================================================================
// 헤어스타일 추천
// =============================================================================

/**
 * 헤어 길이
 */
export type HairLength = 'short' | 'medium' | 'long';

/**
 * 헤어스타일 추천
 */
export interface HairstyleRecommendation {
  name: string;
  description: string;
  length: HairLength;
  suitability: number; // 0-100
  imageUrl?: string;
  tags: string[];
}

/**
 * 헤어컬러 추천
 */
export interface HairColorRecommendation {
  name: string;
  hexColor: string;
  labColor?: LabColor;
  suitability: number;
  seasonMatch: string; // 퍼스널컬러 시즌 연계
  tags: string[];
}

// =============================================================================
// 분석 입출력
// =============================================================================

/**
 * H-1 분석 입력
 */
export interface HairAnalysisInput {
  /** 얼굴 이미지 (Base64) */
  imageBase64: string;
  /** 얼굴 랜드마크 (선택, 클라이언트에서 추출 시) */
  faceLandmarks?: Landmark33[];
  /** 현재 헤어 정보 (선택) */
  currentHair?: {
    length?: HairLength;
    texture?: HairTexture;
    thickness?: HairThickness;
    density?: HairDensity;
    scalpCondition?: ScalpCondition;
  };
  /** 퍼스널컬러 시즌 (선택, 연동 시) */
  personalColorSeason?: string;
}

/**
 * 얼굴형 분석 결과
 */
export interface FaceShapeAnalysis {
  faceShape: FaceShapeType;
  faceShapeLabel: string;
  confidence: number;
  ratios: {
    faceLength: number;      // 얼굴 길이
    faceWidth: number;       // 얼굴 너비
    foreheadWidth: number;   // 이마 너비
    cheekboneWidth: number;  // 광대 너비
    jawWidth: number;        // 턱 너비
    lengthToWidthRatio: number; // 길이/너비 비율
  };
}

/**
 * 헤어컬러 분석 결과
 */
export interface HairColorAnalysis {
  currentColor?: {
    name: string;
    hexColor: string;
    labColor?: LabColor;
  };
  skinToneMatch: number; // 0-100, 현재 헤어컬러와 피부톤 매칭
  recommendedColors: HairColorRecommendation[];
}

/**
 * H-1 헤어분석 결과
 */
export interface HairAnalysisResult {
  id: string;
  faceShapeAnalysis: FaceShapeAnalysis;
  hairColorAnalysis?: HairColorAnalysis;
  currentHairInfo?: {
    length?: HairLength;
    texture?: HairTexture;
    thickness?: HairThickness;
    density?: HairDensity;
    scalpCondition?: ScalpCondition;
  };
  styleRecommendations: HairstyleRecommendation[];
  careTips: string[];
  analyzedAt: string;
  usedFallback: boolean;
}

// =============================================================================
// 상수
// =============================================================================

/**
 * 얼굴형별 추천 스타일 매핑
 */
export const FACE_SHAPE_STYLE_MAPPING: Record<FaceShapeType, {
  recommended: string[];
  avoid: string[];
}> = {
  oval: {
    recommended: ['대부분의 스타일 가능', '레이어드 컷', '뱅 스타일', '숏컷', '롱헤어'],
    avoid: ['극단적으로 볼륨이 큰 스타일'],
  },
  round: {
    recommended: ['긴 레이어드', '사이드 파트', '하이 포니테일', '세로 볼륨 스타일'],
    avoid: ['뭉툭한 단발', '일자 뱅', '턱선 길이 보브', '볼 강조 스타일'],
  },
  square: {
    recommended: ['소프트 레이어드', '사이드 스웹 뱅', '웨이브 헤어', '텍스처드 컷'],
    avoid: ['일자 뱅', '각진 보브', '귀 아래 길이 직선 컷'],
  },
  heart: {
    recommended: ['사이드 파트 보브', '친 렝스 레이어드', '소프트 웨이브', '볼륨 로우 스타일'],
    avoid: ['탑 볼륨 과다', '숏 뱅', '풀 프린지'],
  },
  oblong: {
    recommended: ['사이드 뱅', '레이어드 보브', '웨이브', '미디엄 길이'],
    avoid: ['롱 스트레이트', '센터 파트 롱', '탑 볼륨'],
  },
  diamond: {
    recommended: ['사이드 스웹 뱅', '친 렝스 보브', '레이어드 컷', '소프트 프린지'],
    avoid: ['센터 파트 스트레이트', '슬릭백', '볼 강조'],
  },
  rectangle: {
    recommended: ['소프트 레이어드', '사이드 파트', '웨이브', '뱅 스타일'],
    avoid: ['롱 스트레이트', '센터 파트', '원랭스 롱'],
  },
};

/**
 * 헤어 굵기 라벨
 */
export const HAIR_THICKNESS_LABELS: Record<HairThickness, string> = {
  fine: '가는 모발',
  medium: '중간 모발',
  thick: '굵은 모발',
};

/**
 * 헤어 질감 라벨
 */
export const HAIR_TEXTURE_LABELS: Record<HairTexture, string> = {
  straight: '직모',
  wavy: '웨이브',
  curly: '곱슬',
  coily: '강한 곱슬',
};

/**
 * 두피 상태 라벨
 */
export const SCALP_CONDITION_LABELS: Record<ScalpCondition, string> = {
  dry: '건성 두피',
  normal: '중성 두피',
  oily: '지성 두피',
  sensitive: '민감성 두피',
};
