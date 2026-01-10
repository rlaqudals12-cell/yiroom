/**
 * 피부 일기 Mock 데이터
 * @description 피부 Phase C: 샘플 일기 데이터 및 Mock 인사이트
 * @version 1.0
 * @date 2026-01-10
 */

import type {
  SkinDiaryEntry,
  CorrelationInsight,
  MonthlyReport,
  SkinConditionScore,
  WeeklyAverage,
} from '@/types/skin-diary';

// ================================================
// 샘플 일기 데이터
// ================================================

/**
 * 30일간 샘플 일기 데이터 생성
 */
export function generateSampleEntries(clerkUserId: string): SkinDiaryEntry[] {
  const entries: SkinDiaryEntry[] = [];
  const today = new Date();

  for (let i = 29; i >= 0; i--) {
    const date = new Date(today);
    date.setDate(date.getDate() - i);
    date.setHours(0, 0, 0, 0);

    // 약간의 랜덤성을 더해 자연스러운 데이터 생성
    const sleepHours = 5.5 + Math.random() * 3; // 5.5 ~ 8.5시간
    const stressLevel = Math.ceil(Math.random() * 5) as SkinConditionScore;
    const waterIntake = 1000 + Math.floor(Math.random() * 1500); // 1000 ~ 2500ml

    // 수면과 스트레스에 따라 피부 컨디션 결정
    let baseCondition = 3;
    if (sleepHours >= 7) baseCondition += 1;
    if (sleepHours >= 8) baseCondition += 0.5;
    if (stressLevel <= 2) baseCondition += 0.5;
    if (stressLevel >= 4) baseCondition -= 0.5;
    if (waterIntake >= 1800) baseCondition += 0.5;

    // 1~5 범위로 제한
    const skinCondition = Math.max(1, Math.min(5, Math.round(baseCondition))) as SkinConditionScore;

    entries.push({
      id: `mock-${i}`,
      clerkUserId,
      entryDate: date,
      skinCondition,
      conditionNotes: i % 5 === 0 ? '오늘 피부가 조금 민감해요' : undefined,
      sleepHours: Math.round(sleepHours * 10) / 10,
      sleepQuality: Math.ceil(sleepHours / 2) as SkinConditionScore,
      waterIntakeMl: waterIntake,
      stressLevel,
      weather: getRandomWeather(),
      outdoorHours: Math.round(Math.random() * 4 * 10) / 10,
      morningRoutineCompleted: Math.random() > 0.2, // 80% 완료
      eveningRoutineCompleted: Math.random() > 0.3, // 70% 완료
      specialTreatments: i % 7 === 0 ? ['시트마스크'] : [],
      createdAt: date,
      updatedAt: date,
    });
  }

  return entries;
}

function getRandomWeather() {
  const weathers = ['sunny', 'cloudy', 'rainy', 'cold', 'hot', 'humid', 'dry'] as const;
  return weathers[Math.floor(Math.random() * weathers.length)];
}

// ================================================
// Mock 인사이트
// ================================================

/** 샘플 상관관계 인사이트 */
export const SAMPLE_CORRELATION_INSIGHTS: CorrelationInsight[] = [
  {
    factor: '수면 시간',
    factorKey: 'sleepHours',
    correlation: 0.72,
    confidence: 85,
    insight: '수면 7시간 이상일 때 피부 컨디션이 평균 20% 좋아집니다',
    recommendation: '매일 7시간 이상 수면을 취해보세요',
    isPositive: true,
  },
  {
    factor: '수분 섭취',
    factorKey: 'waterIntakeMl',
    correlation: 0.58,
    confidence: 78,
    insight: '1.5L 이상 수분 섭취 시 피부 수분도가 개선됩니다',
    recommendation: '하루 1.5L 이상 물을 마셔보세요',
    isPositive: true,
  },
  {
    factor: '스트레스',
    factorKey: 'stressLevel',
    correlation: -0.65,
    confidence: 82,
    insight: '스트레스가 높을 때 피부 컨디션이 저하되는 경향이 있습니다',
    recommendation: '스트레스 관리를 위한 휴식 시간을 가져보세요',
    isPositive: false,
  },
  {
    factor: '아침 루틴',
    factorKey: 'morningRoutineCompleted',
    correlation: 0.45,
    confidence: 70,
    insight: '아침 루틴 완료 시 하루 피부 컨디션이 좋습니다',
    recommendation: '아침 스킨케어 루틴을 꾸준히 유지해보세요',
    isPositive: true,
  },
  {
    factor: '저녁 루틴',
    factorKey: 'eveningRoutineCompleted',
    correlation: 0.52,
    confidence: 75,
    insight: '저녁 루틴 완료가 다음 날 피부 상태에 긍정적입니다',
    recommendation: '저녁 스킨케어 루틴을 잊지 마세요',
    isPositive: true,
  },
  {
    factor: '수면 품질',
    factorKey: 'sleepQuality',
    correlation: 0.68,
    confidence: 80,
    insight: '수면 품질이 좋을수록 피부 회복이 잘 됩니다',
    recommendation: '숙면을 위한 환경을 만들어보세요',
    isPositive: true,
  },
];

/** 기본 인사이트 (데이터 부족 시) */
export const DEFAULT_INSIGHTS: CorrelationInsight[] = [
  {
    factor: '수면',
    factorKey: 'sleepHours',
    correlation: 0,
    confidence: 0,
    insight: '데이터를 더 모으면 수면과 피부의 관계를 분석해드려요',
    recommendation: '7일 이상 기록하면 인사이트를 확인할 수 있어요',
    isPositive: true,
  },
];

// ================================================
// Mock 월간 리포트
// ================================================

/**
 * 샘플 월간 리포트 생성
 */
export function generateSampleMonthlyReport(
  clerkUserId: string,
  year: number,
  month: number
): MonthlyReport {
  const entries = generateSampleEntries(clerkUserId);

  // 해당 월의 엔트리만 필터링
  const monthEntries = entries.filter((e) => {
    const d = e.entryDate;
    return d.getFullYear() === year && d.getMonth() + 1 === month;
  });

  const totalCondition = monthEntries.reduce((sum, e) => sum + e.skinCondition, 0);
  const avgCondition = monthEntries.length > 0 ? totalCondition / monthEntries.length : 0;

  // 최고/최저 찾기
  let bestDay = monthEntries[0]?.entryDate || null;
  let worstDay = monthEntries[0]?.entryDate || null;
  let bestScore = 0;
  let worstScore = 6;

  for (const entry of monthEntries) {
    if (entry.skinCondition > bestScore) {
      bestScore = entry.skinCondition;
      bestDay = entry.entryDate;
    }
    if (entry.skinCondition < worstScore) {
      worstScore = entry.skinCondition;
      worstDay = entry.entryDate;
    }
  }

  // 루틴 완료율
  const morningCount = monthEntries.filter((e) => e.morningRoutineCompleted).length;
  const eveningCount = monthEntries.filter((e) => e.eveningRoutineCompleted).length;

  // 주간 평균
  const weeklyAverages: WeeklyAverage[] = [];
  const weekMap = new Map<string, SkinDiaryEntry[]>();

  for (const entry of monthEntries) {
    const weekStart = getWeekStart(entry.entryDate);
    const key = weekStart.toISOString().split('T')[0];
    if (!weekMap.has(key)) {
      weekMap.set(key, []);
    }
    weekMap.get(key)!.push(entry);
  }

  for (const [key, weekEntries] of weekMap) {
    const total = weekEntries.reduce((sum, e) => sum + e.skinCondition, 0);
    weeklyAverages.push({
      weekStart: new Date(key),
      avgCondition: Math.round((total / weekEntries.length) * 10) / 10,
      entriesCount: weekEntries.length,
    });
  }

  weeklyAverages.sort((a, b) => a.weekStart.getTime() - b.weekStart.getTime());

  return {
    month: `${year}-${String(month).padStart(2, '0')}`,
    totalEntries: monthEntries.length,
    avgCondition: Math.round(avgCondition * 10) / 10,
    bestDay,
    worstDay,
    topFactors: SAMPLE_CORRELATION_INSIGHTS.slice(0, 3),
    routineCompletionRate: {
      morning: monthEntries.length > 0 ? Math.round((morningCount / monthEntries.length) * 100) : 0,
      evening: monthEntries.length > 0 ? Math.round((eveningCount / monthEntries.length) * 100) : 0,
    },
    trendDirection: 'improving',
    weeklyAverages,
  };
}

function getWeekStart(date: Date): Date {
  const d = new Date(date);
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1);
  d.setDate(diff);
  d.setHours(0, 0, 0, 0);
  return d;
}

// ================================================
// 인사이트 생성 템플릿
// ================================================

/** 요인별 인사이트 템플릿 */
export const INSIGHT_TEMPLATES: Record<
  string,
  {
    positive: { threshold: number; insight: string; recommendation: string };
    negative: { threshold: number; insight: string; recommendation: string };
  }
> = {
  sleepHours: {
    positive: {
      threshold: 7,
      insight: '수면 {threshold}시간 이상일 때 피부 상태가 {percent}% 좋아요',
      recommendation: '매일 {threshold}시간 이상 수면을 취해보세요',
    },
    negative: {
      threshold: 6,
      insight: '수면 부족 시 피부 컨디션이 {percent}% 저하됩니다',
      recommendation: '수면 시간을 늘려보세요',
    },
  },
  waterIntakeMl: {
    positive: {
      threshold: 1500,
      insight: '수분 섭취가 충분할 때 피부 수분도가 {percent}% 개선됩니다',
      recommendation: '하루 1.5L 이상 물을 마셔보세요',
    },
    negative: {
      threshold: 1000,
      insight: '수분 섭취가 부족할 때 피부가 건조해지는 경향이 있어요',
      recommendation: '물을 더 자주 마셔보세요',
    },
  },
  stressLevel: {
    positive: {
      threshold: 2,
      insight: '스트레스가 낮을 때 피부 상태가 {percent}% 좋아요',
      recommendation: '스트레스 관리를 잘 하고 계시네요!',
    },
    negative: {
      threshold: 4,
      insight: '스트레스가 높을 때 피부 트러블이 증가하는 경향이 있어요',
      recommendation: '스트레스 해소를 위한 휴식 시간을 가져보세요',
    },
  },
  morningRoutineCompleted: {
    positive: {
      threshold: 1,
      insight: '아침 루틴 완료 시 하루 피부 컨디션이 {percent}% 좋아요',
      recommendation: '아침 루틴을 꾸준히 유지해보세요',
    },
    negative: {
      threshold: 0,
      insight: '아침 루틴을 건너뛰면 피부 보호력이 떨어질 수 있어요',
      recommendation: '아침 선크림만이라도 꼭 발라주세요',
    },
  },
  eveningRoutineCompleted: {
    positive: {
      threshold: 1,
      insight: '저녁 루틴 완료가 다음 날 피부 회복에 도움이 돼요',
      recommendation: '저녁 스킨케어 루틴을 잊지 마세요',
    },
    negative: {
      threshold: 0,
      insight: '저녁 루틴을 건너뛰면 피부 재생이 느려질 수 있어요',
      recommendation: '클렌징이라도 꼭 해주세요',
    },
  },
};

// ================================================
// 특별 케어 옵션
// ================================================

/** 특별 케어 옵션 목록 */
export const SPECIAL_TREATMENT_OPTIONS = [
  { id: 'sheet_mask', label: '시트마스크', emoji: '🎭' },
  { id: 'peeling', label: '필링', emoji: '✨' },
  { id: 'essence_care', label: '에센스 집중케어', emoji: '💎' },
  { id: 'eye_mask', label: '아이마스크', emoji: '👁️' },
  { id: 'clay_mask', label: '클레이 마스크', emoji: '🧴' },
  { id: 'sleeping_pack', label: '수면팩', emoji: '🌙' },
  { id: 'facial_massage', label: '페이셜 마사지', emoji: '💆' },
  { id: 'spot_treatment', label: '스팟 케어', emoji: '🎯' },
] as const;

export type SpecialTreatmentId = (typeof SPECIAL_TREATMENT_OPTIONS)[number]['id'];
