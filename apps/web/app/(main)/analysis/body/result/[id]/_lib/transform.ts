import {
  type BodyAnalysisResult,
  type BodyType,
  type BodyType3,
  BODY_TYPES_3,
  EASY_BODY_TIPS,
  mapBodyTypeTo3Type,
} from '@/lib/mock/body-analysis';
import type {
  BodyAnalysisEvidence,
  BodyImageQuality,
} from '@/components/analysis/BodyAnalysisEvidenceReport';

// DB 데이터 타입
export interface DbBodyAnalysis {
  id: string;
  clerk_user_id: string;
  body_type: string;
  height: number | null;
  weight: number | null;
  shoulder: number | null;
  waist: number | null;
  hip: number | null;
  ratio: number | null;
  strengths: string[] | null;
  improvements: string[] | null;
  style_recommendations:
    | {
        items?: Array<{ item: string; reason: string }>;
        insight?: string;
        colorTips?: string[];
        analysisEvidence?: BodyAnalysisEvidence;
        imageQuality?: BodyImageQuality;
        confidence?: number;
        matchedFeatures?: number;
        usedMock?: boolean;
      }
    | Array<{
        category: string;
        items: string[];
        tip: string;
      }>
    | null;
  personal_color_season: string | null;
  color_recommendations: {
    topColors?: string[];
    bottomColors?: string[];
    avoidColors?: string[];
  } | null;
  created_at: string;
}

// 측정값 설명 생성
function getMeasurementDescription(name: string, value: number): string {
  if (value >= 70) return `${name}가 넓은 편이에요`;
  if (value >= 40) return `${name}가 균형 잡힌 편이에요`;
  return `${name}가 좁은 편이에요`;
}

/**
 * DB 데이터 → BodyAnalysisResult 변환
 * Hybrid 전략: DB는 핵심 데이터만, 표시용은 최신 Mock 사용
 */
export function transformDbToResult(dbData: DbBodyAnalysis): BodyAnalysisResult {
  const rawBodyType = dbData.body_type as BodyType | BodyType3;

  // 3타입인지 8타입인지 확인하고 매핑
  const isNew3Type = ['S', 'W', 'N'].includes(rawBodyType);
  const bodyType3: BodyType3 = isNew3Type
    ? (rawBodyType as BodyType3)
    : mapBodyTypeTo3Type(rawBodyType as BodyType);

  const info = BODY_TYPES_3[bodyType3];

  // Hybrid 전략: 표시 데이터는 항상 최신 Mock 사용
  const mockEasyBodyTip = EASY_BODY_TIPS[bodyType3];

  // DB의 style_recommendations를 StyleRecommendation[] 형식으로 변환
  let styleRecs: Array<{ item: string; reason: string }> = [];
  if (dbData.style_recommendations) {
    if (Array.isArray(dbData.style_recommendations)) {
      // 레거시 배열 형식
      styleRecs = dbData.style_recommendations.flatMap((rec) =>
        rec.items.map((item: string) => ({
          item,
          reason: rec.tip || `${rec.category}에 어울리는 아이템`,
        }))
      );
    } else if (dbData.style_recommendations.items) {
      // 새 객체 형식
      styleRecs = dbData.style_recommendations.items;
    }
  }
  if (styleRecs.length === 0) {
    styleRecs = info.recommendations || [];
  }

  // insights 배열을 하나의 문장으로 결합
  const insightText =
    info.insights?.length > 0
      ? info.insights[0]
      : `${info.label} 체형의 특징을 가지고 있어요! ${info.characteristics}`;

  return {
    bodyType: bodyType3,
    bodyTypeLabel: info.label,
    bodyTypeDescription: info.description,
    measurements: [
      {
        name: '어깨',
        value: dbData.shoulder || 50,
        description: getMeasurementDescription('어깨', dbData.shoulder || 50),
      },
      {
        name: '허리',
        value: dbData.waist || 50,
        description: getMeasurementDescription('허리', dbData.waist || 50),
      },
      {
        name: '골반',
        value: dbData.hip || 50,
        description: getMeasurementDescription('골반', dbData.hip || 50),
      },
    ],
    strengths: dbData.strengths || info.strengths,
    insight: insightText,
    styleRecommendations: styleRecs,
    analyzedAt: new Date(dbData.created_at),
    userInput:
      dbData.height && dbData.weight
        ? {
            height: dbData.height,
            weight: dbData.weight,
          }
        : undefined,
    bmi:
      dbData.height && dbData.weight
        ? Math.round((dbData.weight / (dbData.height / 100) ** 2) * 10) / 10
        : undefined,
    personalColorSeason: dbData.personal_color_season,
    colorRecommendations: dbData.color_recommendations
      ? {
          topColors: dbData.color_recommendations.topColors || [],
          bottomColors: dbData.color_recommendations.bottomColors || [],
          avoidColors: dbData.color_recommendations.avoidColors || [],
          bestCombinations: [],
          accessories: [],
        }
      : null,
    easyBodyTip: mockEasyBodyTip,
  };
}
