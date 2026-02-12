/**
 * M-1 메이크업 분석 결과 DB → 뷰 변환
 *
 * result/[id]/page.tsx에서 분리된 데이터 변환 모듈
 */

import type {
  UndertoneId,
  EyeShapeId,
  LipShapeId,
  FaceShapeId,
  MakeupStyleId,
  MakeupConcernId,
  ColorRecommendation,
} from '@/lib/mock/makeup-analysis';
import { UNDERTONES, EYE_SHAPES, LIP_SHAPES, FACE_SHAPES } from '@/lib/mock/makeup-analysis';

// DB 행 타입
export interface DbMakeupAnalysis {
  id: string;
  clerk_user_id: string;
  image_url: string;
  undertone: UndertoneId;
  eye_shape: EyeShapeId;
  lip_shape: LipShapeId;
  face_shape: FaceShapeId;
  skin_texture: number | null;
  skin_tone_uniformity: number | null;
  hydration: number | null;
  pore_visibility: number | null;
  oil_balance: number | null;
  overall_score: number;
  concerns: MakeupConcernId[];
  recommendations: {
    insight?: string;
    styles?: MakeupStyleId[];
    colors?: ColorRecommendation[];
    tips?: Array<{ category: string; tips: string[] }>;
    personalColorConnection?: {
      season: string;
      compatibility: 'high' | 'medium' | 'low';
      note: string;
    };
    analysisReliability?: 'high' | 'medium' | 'low';
  } | null;
  analysis_reliability: 'high' | 'medium' | 'low' | null;
  created_at: string;
}

// 뷰 지표 타입
export interface MakeupMetric {
  id: string;
  name: string;
  value: number;
  status: 'good' | 'normal' | 'warning';
  description: string;
}

// 뷰 결과 타입
export interface MakeupResultView {
  overallScore: number;
  metrics: MakeupMetric[];
  undertone: UndertoneId;
  undertoneLabel: string;
  eyeShape: EyeShapeId;
  eyeShapeLabel: string;
  lipShape: LipShapeId;
  lipShapeLabel: string;
  faceShape: FaceShapeId;
  faceShapeLabel: string;
  concerns: MakeupConcernId[];
  insight: string;
  recommendedStyles: MakeupStyleId[];
  colorRecommendations: ColorRecommendation[];
  makeupTips: Array<{ category: string; tips: string[] }>;
  personalColorConnection?: {
    season: string;
    compatibility: 'high' | 'medium' | 'low';
    note: string;
  };
  analyzedAt: Date;
}

// 점수 → 상태
function getStatus(value: number): 'good' | 'normal' | 'warning' {
  if (value >= 71) return 'good';
  if (value >= 41) return 'normal';
  return 'warning';
}

// 점수에 따른 설명 생성
function getDescription(name: string, value: number): string {
  if (value >= 71) return `${name}(이)가 좋은 상태예요`;
  if (value >= 41) return `${name}(이)가 보통 수준이에요`;
  return `${name} 관리가 필요해요`;
}

// DB 데이터 → 뷰 데이터 변환
export function transformDbToResult(dbData: DbMakeupAnalysis): MakeupResultView {
  const createMetric = (id: string, name: string, value: number | null): MakeupMetric => ({
    id,
    name,
    value: value ?? 50,
    status: getStatus(value ?? 50),
    description: getDescription(name, value ?? 50),
  });

  const undertoneLabel =
    UNDERTONES.find((t) => t.id === dbData.undertone)?.label || dbData.undertone;
  const eyeShapeLabel =
    EYE_SHAPES.find((t) => t.id === dbData.eye_shape)?.label || dbData.eye_shape;
  const lipShapeLabel =
    LIP_SHAPES.find((t) => t.id === dbData.lip_shape)?.label || dbData.lip_shape;
  const faceShapeLabel =
    FACE_SHAPES.find((t) => t.id === dbData.face_shape)?.label || dbData.face_shape;

  return {
    overallScore: dbData.overall_score,
    metrics: [
      createMetric('skinTexture', '피부 결', dbData.skin_texture),
      createMetric('skinTone', '피부톤 고르기', dbData.skin_tone_uniformity),
      createMetric('hydration', '수분감', dbData.hydration),
      createMetric('poreVisibility', '모공 상태', dbData.pore_visibility),
      createMetric('oilBalance', '유수분 균형', dbData.oil_balance),
    ],
    undertone: dbData.undertone,
    undertoneLabel,
    eyeShape: dbData.eye_shape,
    eyeShapeLabel,
    lipShape: dbData.lip_shape,
    lipShapeLabel,
    faceShape: dbData.face_shape,
    faceShapeLabel,
    concerns: dbData.concerns || [],
    insight: dbData.recommendations?.insight || '메이크업 분석이 완료되었어요!',
    recommendedStyles: dbData.recommendations?.styles || [],
    colorRecommendations: dbData.recommendations?.colors || [],
    makeupTips: dbData.recommendations?.tips || [],
    personalColorConnection: dbData.recommendations?.personalColorConnection,
    analyzedAt: new Date(dbData.created_at),
  };
}
