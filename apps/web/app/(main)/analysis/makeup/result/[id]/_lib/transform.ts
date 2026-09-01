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
} from '@/lib/analysis/makeup';
import type { ColorRecommendation } from '@/lib/mock/makeup-analysis';
import type { FoundationRecommendation } from '@/lib/mock/personal-color';
import { UNDERTONES, EYE_SHAPES, LIP_SHAPES, FACE_SHAPES } from '@/lib/analysis/makeup';

// 신뢰도/호환성 수준
type ReliabilityLevel = 'high' | 'medium' | 'low';

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
      compatibility: ReliabilityLevel;
      note: string;
    };
    foundationRecommendations?: FoundationRecommendation[];
    analysisReliability?: ReliabilityLevel;
    usedMock?: boolean;
    /** 저장 출처 ('integrated' = 통합분석 M-1 composer) */
    source?: string;
    /**
     * 실측 여부. 통합분석 경로는 얼굴 상세(눈·입술)를 측정하지 않고,
     * NOT NULL 컬럼 제약 탓에 placeholder를 저장한다 — 이 플래그가 false면 표시하지 않는다.
     * 미표기(undefined)면 단독 M-1 분석 = 전부 실측 (하위호환).
     */
    measured?: {
      faceShape?: boolean;
      eyeShape?: boolean;
      lipShape?: boolean;
    };
  } | null;
  analysis_reliability: ReliabilityLevel | null;
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
  foundationRecommendations: FoundationRecommendation[];
  analysisReliability: 'high' | 'medium' | 'low';
  analyzedAt: Date;
  /**
   * 항목별 실측 여부 — false면 화면에서 해당 행을 렌더하지 않는다.
   * (통합분석 M-1은 조합 레이어라 언더톤·종합점수·얼굴형만 다른 축에서 승계한다)
   */
  measured: {
    faceShape: boolean;
    eyeShape: boolean;
    lipShape: boolean;
  };
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
  return `${name}에 집중하면 좋아요`;
}

// DB 데이터 → 뷰 데이터 변환
export function transformDbToResult(dbData: DbMakeupAnalysis): MakeupResultView {
  // 미측정(null) 지표는 제외 — 예전엔 null을 50점으로 채워 "없는 진단"을 만들어냈다.
  const createMetric = (id: string, name: string, value: number | null): MakeupMetric | null =>
    value === null || value === undefined
      ? null
      : {
          id,
          name,
          value,
          status: getStatus(value),
          description: getDescription(name, value),
        };

  // A1: 영어 raw value 노출 방지 — fallback은 한글 기본값
  const undertoneLabel = UNDERTONES.find((t) => t.id === dbData.undertone)?.label || '알 수 없음';
  const eyeShapeLabel = EYE_SHAPES.find((t) => t.id === dbData.eye_shape)?.label || '알 수 없음';
  const lipShapeLabel = LIP_SHAPES.find((t) => t.id === dbData.lip_shape)?.label || '알 수 없음';
  const faceShapeLabel = FACE_SHAPES.find((t) => t.id === dbData.face_shape)?.label || '알 수 없음';

  const measuredFlags = dbData.recommendations?.measured;

  return {
    overallScore: dbData.overall_score,
    metrics: [
      createMetric('skinTexture', '피부 결', dbData.skin_texture),
      createMetric('skinTone', '피부톤 고르기', dbData.skin_tone_uniformity),
      createMetric('hydration', '수분감', dbData.hydration),
      createMetric('poreVisibility', '모공 상태', dbData.pore_visibility),
      createMetric('oilBalance', '유수분 균형', dbData.oil_balance),
    ].filter((metric): metric is MakeupMetric => metric !== null),
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
    foundationRecommendations: dbData.recommendations?.foundationRecommendations || [],
    analysisReliability:
      dbData.analysis_reliability || dbData.recommendations?.analysisReliability || 'medium',
    analyzedAt: new Date(dbData.created_at),
    // 미표기 = 단독 M-1 분석(전부 실측). 통합분석만 명시적으로 false를 실어 보낸다.
    measured: {
      faceShape: measuredFlags?.faceShape ?? true,
      eyeShape: measuredFlags?.eyeShape ?? true,
      lipShape: measuredFlags?.lipShape ?? true,
    },
  };
}
