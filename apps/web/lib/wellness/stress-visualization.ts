/**
 * 스트레스 → 뷰티 영향 시각화 유틸리티
 * @description 바이오리듬 스트레스 점수를 시각화 데이터로 변환
 */

// ============================================
// 타입
// ============================================

/** 스트레스 등급 */
export type StressGrade = 'low' | 'moderate' | 'high' | 'critical';

/** 스트레스→뷰티 영향 항목 */
export interface SkinImpactItem {
  area: string;
  impact: string;
  severity: 1 | 2 | 3;
}

/** 스트레스 시각화 데이터 */
export interface StressVisualizationData {
  /** 스트레스 레벨 (1-10) */
  stressLevel: number;
  /** 스트레스 점수 (0-25, 높을수록 좋음) */
  stressScore: number;
  /** 등급 */
  grade: StressGrade;
  /** 등급 라벨 */
  gradeLabel: string;
  /** 색상 (CSS color) */
  color: string;
  /** 피부 영향 항목 */
  skinImpacts: SkinImpactItem[];
  /** 권장 사항 */
  recommendations: string[];
  /** 게이지 퍼센트 (0-100, 낮을수록 스트레스 높음) */
  gaugePercent: number;
}

/** 주간 스트레스 트렌드 데이터 포인트 */
export interface StressTrendPoint {
  date: string;
  stressLevel: number;
  grade: StressGrade;
}

/** 주간 스트레스 트렌드 분석 */
export interface StressTrendAnalysis {
  points: StressTrendPoint[];
  averageLevel: number;
  trend: 'improving' | 'worsening' | 'stable';
  trendMessage: string;
}

// ============================================
// 상수
// ============================================

const GRADE_CONFIG: Record<StressGrade, { label: string; color: string; minLevel: number }> = {
  low: { label: '안정', color: '#22c55e', minLevel: 1 },
  moderate: { label: '보통', color: '#f59e0b', minLevel: 4 },
  high: { label: '높음', color: '#f97316', minLevel: 7 },
  critical: { label: '매우 높음', color: '#ef4444', minLevel: 9 },
};

// ============================================
// 등급 판별
// ============================================

/**
 * 스트레스 레벨(1-10) → 등급
 */
export function getStressGrade(stressLevel: number): StressGrade {
  if (stressLevel >= 9) return 'critical';
  if (stressLevel >= 7) return 'high';
  if (stressLevel >= 4) return 'moderate';
  return 'low';
}

// ============================================
// 피부 영향 분석
// ============================================

/**
 * 스트레스 레벨에 따른 피부 영향 항목 생성
 */
export function getSkinImpacts(stressLevel: number): SkinImpactItem[] {
  const impacts: SkinImpactItem[] = [];

  if (stressLevel >= 4) {
    impacts.push({
      area: '피지 분비',
      impact: '코르티솔이 피지선을 자극해 유분이 증가해요.',
      severity: stressLevel >= 7 ? 3 : 2,
    });
  }

  if (stressLevel >= 5) {
    impacts.push({
      area: '피부 장벽',
      impact: '스트레스가 피부 장벽 회복을 늦춰요.',
      severity: stressLevel >= 8 ? 3 : 2,
    });
  }

  if (stressLevel >= 6) {
    impacts.push({
      area: '트러블',
      impact: '면역력 저하로 여드름/트러블이 생기기 쉬워요.',
      severity: stressLevel >= 8 ? 3 : 2,
    });
  }

  if (stressLevel >= 7) {
    impacts.push({
      area: '노화',
      impact: '만성 스트레스는 활성산소를 증가시켜 피부 노화를 앞당겨요.',
      severity: 3,
    });
  }

  if (stressLevel >= 8) {
    impacts.push({
      area: '탈모',
      impact: '극심한 스트레스는 모낭 성장 주기에 영향을 줄 수 있어요.',
      severity: 3,
    });
  }

  return impacts;
}

// ============================================
// 권장 사항
// ============================================

/**
 * 스트레스 등급별 권장 사항
 */
export function getStressRecommendations(grade: StressGrade): string[] {
  switch (grade) {
    case 'low':
      return [
        '현재 스트레스 상태가 좋아요! 유지해주세요.',
        '가벼운 운동으로 컨디션을 더 올려보세요.',
      ];
    case 'moderate':
      return [
        '수분 크림을 충분히 발라 피부 장벽을 보호하세요.',
        '취침 전 10분 스트레칭이 도움이 돼요.',
        '카페인 섭취를 줄여보세요.',
      ];
    case 'high':
      return [
        '진정 성분(시카, 알로에) 제품을 사용해보세요.',
        '고강도 운동 대신 가벼운 산책을 추천해요.',
        '수면 시간을 7시간 이상 확보하세요.',
        '비타민B, 마그네슘이 풍부한 음식이 도움이 돼요.',
      ];
    case 'critical':
      return [
        '피부 자극을 최소화하세요 — 순한 클렌저 + 보습만.',
        '오늘은 운동을 쉬고 충분히 휴식하세요.',
        '따뜻한 차 한 잔과 깊은 호흡이 도움이 돼요.',
        '지속되면 전문가 상담을 고려해보세요.',
      ];
  }
}

// ============================================
// 시각화 데이터 생성
// ============================================

/**
 * 스트레스 레벨 → 시각화 데이터 변환
 */
export function buildStressVisualization(
  stressLevel: number,
  stressScore: number
): StressVisualizationData {
  const clamped = Math.max(1, Math.min(10, stressLevel));
  const grade = getStressGrade(clamped);
  const config = GRADE_CONFIG[grade];

  return {
    stressLevel: clamped,
    stressScore,
    grade,
    gradeLabel: config.label,
    color: config.color,
    skinImpacts: getSkinImpacts(clamped),
    recommendations: getStressRecommendations(grade),
    // 게이지: 스트레스 낮을수록 높은 값 (좋은 상태)
    gaugePercent: Math.round(((10 - clamped) / 9) * 100),
  };
}

// ============================================
// 주간 트렌드 분석
// ============================================

/**
 * 주간 스트레스 트렌드 분석
 */
export function analyzeStressTrend(points: StressTrendPoint[]): StressTrendAnalysis {
  if (points.length === 0) {
    return {
      points: [],
      averageLevel: 0,
      trend: 'stable',
      trendMessage: '스트레스 데이터가 없어요. 기록을 시작해보세요.',
    };
  }

  const sorted = [...points].sort(
    (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
  );

  const averageLevel = sorted.reduce((sum, p) => sum + p.stressLevel, 0) / sorted.length;

  // 트렌드: 최근 절반 vs 이전 절반 비교
  let trend: 'improving' | 'worsening' | 'stable' = 'stable';
  let trendMessage = '스트레스가 일정하게 유지되고 있어요.';

  if (sorted.length >= 3) {
    const mid = Math.floor(sorted.length / 2);
    const earlier = sorted.slice(0, mid);
    const recent = sorted.slice(mid);

    const earlierAvg = earlier.reduce((s, p) => s + p.stressLevel, 0) / earlier.length;
    const recentAvg = recent.reduce((s, p) => s + p.stressLevel, 0) / recent.length;

    const diff = recentAvg - earlierAvg;

    if (diff < -1) {
      trend = 'improving';
      trendMessage = '스트레스가 줄어들고 있어요! 좋은 흐름이에요.';
    } else if (diff > 1) {
      trend = 'worsening';
      trendMessage = '최근 스트레스가 높아지고 있어요. 휴식을 늘려보세요.';
    }
  }

  return {
    points: sorted,
    averageLevel: Math.round(averageLevel * 10) / 10,
    trend,
    trendMessage,
  };
}
