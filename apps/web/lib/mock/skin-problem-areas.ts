/**
 * 피부 문제 영역 Mock 데이터
 * Phase E - SDD-PHASE-E-SKIN-ZOOM.md
 */

import type { ProblemArea } from '@/types/skin-problem-area';

// 개발/테스트용 Mock 데이터
export const MOCK_PROBLEM_AREAS: ProblemArea[] = [
  {
    id: 'area-1',
    type: 'pores',
    severity: 'moderate',
    location: { x: 50, y: 38, radius: 12 },
    description:
      'T존 코 주변 모공이 넓어져 있어요. 피지 분비가 활발한 부위라 모공이 막히기 쉬워요.',
    recommendations: ['BHA 토너', '클레이 마스크', '모공 세럼'],
  },
  {
    id: 'area-2',
    type: 'pigmentation',
    severity: 'mild',
    location: { x: 30, y: 48, radius: 10 },
    description: '왼쪽 볼 부위에 가벼운 색소침착이 보여요. 자외선 노출로 인한 잔반점일 수 있어요.',
    recommendations: ['비타민C 세럼', '나이아신아마이드', '자외선 차단제'],
  },
  {
    id: 'area-3',
    type: 'dryness',
    severity: 'moderate',
    location: { x: 70, y: 55, radius: 14 },
    description: '오른쪽 볼 아래쪽이 건조해 보여요. 수분 장벽이 약해져 당김이 느껴질 수 있어요.',
    recommendations: ['히알루론산 세럼', '세라마이드 크림', '수분 마스크'],
  },
  {
    id: 'area-4',
    type: 'darkCircles',
    severity: 'mild',
    location: { x: 35, y: 50, radius: 8 },
    description: '눈 아래 다크서클이 약간 보여요. 수면 부족이나 피로가 원인일 수 있어요.',
    recommendations: ['아이크림', '비타민K 함유 제품', '충분한 수면'],
  },
];

// 심각도별 필터된 Mock
export const getMockProblemAreasBySeverity = (severity: ProblemArea['severity']): ProblemArea[] => {
  return MOCK_PROBLEM_AREAS.filter((area) => area.severity === severity);
};

// 유형별 Mock
export const getMockProblemAreasByType = (type: ProblemArea['type']): ProblemArea[] => {
  return MOCK_PROBLEM_AREAS.filter((area) => area.type === type);
};

// AI Fallback용 - 분석 결과 기반 문제 영역 생성
export function generateMockProblemAreas(
  metrics: { name: string; score: number }[]
): ProblemArea[] {
  const areas: ProblemArea[] = [];
  let areaId = 1;

  // 점수가 낮은 지표를 문제 영역으로 변환
  metrics.forEach((metric, index) => {
    if (metric.score < 60) {
      const severity: ProblemArea['severity'] =
        metric.score < 30 ? 'severe' : metric.score < 45 ? 'moderate' : 'mild';

      const typeMap: Record<string, ProblemArea['type']> = {
        hydration: 'dryness',
        oiliness: 'oiliness',
        pores: 'pores',
        wrinkles: 'wrinkles',
        pigmentation: 'pigmentation',
        acne: 'acne',
        redness: 'redness',
        darkCircles: 'darkCircles',
      };

      const type = typeMap[metric.name.toLowerCase()] || 'dryness';

      // 위치 분산 (겹치지 않도록)
      const baseX = 30 + (index % 3) * 20;
      const baseY = 35 + Math.floor(index / 3) * 20;

      areas.push({
        id: `generated-${areaId++}`,
        type,
        severity,
        location: {
          x: baseX + Math.random() * 10,
          y: baseY + Math.random() * 10,
          radius: severity === 'severe' ? 14 : severity === 'moderate' ? 11 : 8,
        },
        description: getDescriptionForType(type, severity),
        recommendations: getRecommendationsForType(type),
      });
    }
  });

  return areas.slice(0, 4); // 최대 4개
}

function getDescriptionForType(
  type: ProblemArea['type'],
  severity: ProblemArea['severity']
): string {
  const severityText =
    severity === 'severe' ? '심한' : severity === 'moderate' ? '보통의' : '가벼운';

  const descriptions: Record<ProblemArea['type'], string> = {
    pores: `${severityText} 모공 확장이 관찰돼요. 피지 관리가 필요해 보여요.`,
    pigmentation: `${severityText} 색소침착이 있어요. 미백 케어를 권장해요.`,
    dryness: `${severityText} 건조함이 보여요. 수분 공급이 필요해요.`,
    wrinkles: `${severityText} 주름이 관찰돼요. 탄력 케어가 도움이 될 거예요.`,
    acne: `${severityText} 트러블이 있어요. 진정 케어를 추천해요.`,
    oiliness: `${severityText} 유분이 많아요. 유수분 밸런스 관리가 필요해요.`,
    redness: `${severityText} 붉은기가 있어요. 진정 케어가 필요해요.`,
    darkCircles: `${severityText} 다크서클이 있어요. 아이 케어가 도움이 될 거예요.`,
  };

  return descriptions[type];
}

function getRecommendationsForType(type: ProblemArea['type']): string[] {
  const recommendations: Record<ProblemArea['type'], string[]> = {
    pores: ['BHA 토너', '클레이 마스크', '모공 세럼'],
    pigmentation: ['비타민C 세럼', '나이아신아마이드', '자외선 차단제'],
    dryness: ['히알루론산 세럼', '세라마이드 크림', '수분 마스크'],
    wrinkles: ['레티놀', '펩타이드 세럼', '탄력 크림'],
    acne: ['티트리 오일', '살리실산', '진정 크림'],
    oiliness: ['나이아신아마이드', '흡유 토너', '가벼운 로션'],
    redness: ['시카 크림', '알로에 젤', '진정 앰플'],
    darkCircles: ['아이크림', '비타민K', '카페인 함유 제품'],
  };

  return recommendations[type];
}
