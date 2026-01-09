/**
 * 피부 다이어리 상관관계 분석 로직 (Phase 3)
 * 생활 요인과 피부 상태 간의 상관관계를 AI로 분석
 */

import type { SupabaseClient } from '@supabase/supabase-js';
import { geminiLogger } from '@/lib/utils/logger';

// ============================================
// 타입 정의
// ============================================

/** 다이어리 엔트리 (DB에서 조회) */
export interface DiaryEntryForAnalysis {
  id: string;
  entry_date: string;
  skin_condition: number;
  sleep_hours: number | null;
  sleep_quality: number | null;
  water_intake_ml: number | null;
  stress_level: number | null;
  weather: string | null;
  outdoor_hours: number | null;
  morning_routine_completed: boolean;
  evening_routine_completed: boolean;
  special_treatments: string[] | null;
}

/** 상관관계 분석 결과 */
export interface CorrelationAnalysisResult {
  /** 분석 기간 */
  period: {
    start: string;
    end: string;
    totalDays: number;
    entriesCount: number;
  };
  /** 요인별 상관관계 점수 (-100 ~ +100, 양수일수록 양의 상관관계) */
  correlations: {
    sleepHours: CorrelationScore;
    sleepQuality: CorrelationScore;
    waterIntake: CorrelationScore;
    stressLevel: CorrelationScore;
    outdoorHours: CorrelationScore;
    morningRoutine: CorrelationScore;
    eveningRoutine: CorrelationScore;
  };
  /** 가장 영향력 있는 요인 TOP 3 */
  topInfluencers: {
    factor: string;
    factorLabel: string;
    impact: 'positive' | 'negative';
    strength: 'strong' | 'moderate' | 'weak';
    description: string;
  }[];
  /** AI 인사이트 */
  insights: string[];
  /** 개인화 권장사항 */
  recommendations: {
    priority: 'high' | 'medium' | 'low';
    category: string;
    action: string;
    reason: string;
  }[];
  /** 분석 신뢰도 */
  confidence: 'high' | 'medium' | 'low';
  confidenceReason: string;
}

/** 상관관계 점수 */
interface CorrelationScore {
  score: number; // -100 ~ +100
  strength: 'strong' | 'moderate' | 'weak' | 'none';
  direction: 'positive' | 'negative' | 'neutral';
  sampleSize: number;
}

// ============================================
// 요인 라벨 매핑
// ============================================

const FACTOR_LABELS: Record<string, string> = {
  sleepHours: '수면 시간',
  sleepQuality: '수면 품질',
  waterIntake: '수분 섭취',
  stressLevel: '스트레스',
  outdoorHours: '야외 활동',
  morningRoutine: '아침 루틴',
  eveningRoutine: '저녁 루틴',
};

// ============================================
// 상관관계 계산 유틸리티
// ============================================

/**
 * 피어슨 상관계수 계산
 */
function calculatePearsonCorrelation(x: number[], y: number[]): number {
  if (x.length !== y.length || x.length < 3) return 0;

  const n = x.length;
  const sumX = x.reduce((a, b) => a + b, 0);
  const sumY = y.reduce((a, b) => a + b, 0);
  const sumXY = x.reduce((acc, xi, i) => acc + xi * y[i], 0);
  const sumX2 = x.reduce((acc, xi) => acc + xi * xi, 0);
  const sumY2 = y.reduce((acc, yi) => acc + yi * yi, 0);

  const numerator = n * sumXY - sumX * sumY;
  const denominator = Math.sqrt((n * sumX2 - sumX * sumX) * (n * sumY2 - sumY * sumY));

  if (denominator === 0) return 0;
  return numerator / denominator;
}

/**
 * 상관계수 → 상관관계 점수 변환
 */
function correlationToScore(r: number, sampleSize: number): CorrelationScore {
  const score = Math.round(r * 100);
  const absScore = Math.abs(score);

  let strength: CorrelationScore['strength'];
  if (absScore >= 50) strength = 'strong';
  else if (absScore >= 30) strength = 'moderate';
  else if (absScore >= 10) strength = 'weak';
  else strength = 'none';

  let direction: CorrelationScore['direction'];
  if (score > 10) direction = 'positive';
  else if (score < -10) direction = 'negative';
  else direction = 'neutral';

  return { score, strength, direction, sampleSize };
}

/**
 * 불리언 값을 숫자로 변환 (루틴 완료 여부)
 */
function boolToNum(val: boolean | null | undefined): number {
  return val ? 1 : 0;
}

// ============================================
// 상관관계 분석 메인 함수
// ============================================

/**
 * 피부 다이어리 상관관계 분석 실행
 * @param supabase - Supabase 클라이언트
 * @param days - 분석할 최근 일수 (기본 30일)
 */
export async function analyzeSkinCorrelation(
  supabase: SupabaseClient,
  days: number = 30
): Promise<CorrelationAnalysisResult> {
  geminiLogger.info('[Correlation] Starting skin correlation analysis');

  // 다이어리 데이터 조회
  const endDate = new Date();
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - days);

  const { data: entries, error } = await supabase
    .from('skin_diary_entries')
    .select('*')
    .gte('entry_date', startDate.toISOString().split('T')[0])
    .lte('entry_date', endDate.toISOString().split('T')[0])
    .order('entry_date', { ascending: true });

  if (error) {
    geminiLogger.error('[Correlation] Failed to fetch diary entries:', error);
    throw new Error('다이어리 데이터를 불러오는데 실패했습니다.');
  }

  const diaryEntries = (entries || []) as DiaryEntryForAnalysis[];

  // 최소 데이터 확인
  if (diaryEntries.length < 5) {
    return generateInsufficientDataResult(startDate, endDate, diaryEntries.length);
  }

  // 피부 상태 배열
  const skinConditions = diaryEntries.map((e) => e.skin_condition);

  // 각 요인별 상관관계 계산
  const correlations = {
    sleepHours: calculateFactorCorrelation(
      diaryEntries.filter((e) => e.sleep_hours !== null),
      (e) => e.sleep_hours!,
      skinConditions
    ),
    sleepQuality: calculateFactorCorrelation(
      diaryEntries.filter((e) => e.sleep_quality !== null),
      (e) => e.sleep_quality!,
      skinConditions
    ),
    waterIntake: calculateFactorCorrelation(
      diaryEntries.filter((e) => e.water_intake_ml !== null),
      (e) => e.water_intake_ml! / 500, // 500ml 단위로 정규화
      skinConditions
    ),
    stressLevel: calculateFactorCorrelation(
      diaryEntries.filter((e) => e.stress_level !== null),
      (e) => e.stress_level!,
      skinConditions
      // 스트레스는 자연스럽게 음의 상관관계 (높은 스트레스 → 나쁜 피부)
    ),
    outdoorHours: calculateFactorCorrelation(
      diaryEntries.filter((e) => e.outdoor_hours !== null),
      (e) => e.outdoor_hours!,
      skinConditions
    ),
    morningRoutine: calculateFactorCorrelation(
      diaryEntries,
      (e) => boolToNum(e.morning_routine_completed),
      skinConditions
    ),
    eveningRoutine: calculateFactorCorrelation(
      diaryEntries,
      (e) => boolToNum(e.evening_routine_completed),
      skinConditions
    ),
  };

  // TOP 3 영향 요인 추출
  const topInfluencers = extractTopInfluencers(correlations);

  // 인사이트 생성
  const insights = generateInsights(correlations, diaryEntries);

  // 권장사항 생성
  const recommendations = generateRecommendations(correlations, diaryEntries);

  // 신뢰도 판정
  const { confidence, confidenceReason } = assessConfidence(diaryEntries.length, correlations);

  geminiLogger.info('[Correlation] Analysis completed', {
    entries: diaryEntries.length,
    confidence,
  });

  return {
    period: {
      start: startDate.toISOString().split('T')[0],
      end: endDate.toISOString().split('T')[0],
      totalDays: days,
      entriesCount: diaryEntries.length,
    },
    correlations,
    topInfluencers,
    insights,
    recommendations,
    confidence,
    confidenceReason,
  };
}

/**
 * 개별 요인 상관관계 계산
 */
function calculateFactorCorrelation(
  entries: DiaryEntryForAnalysis[],
  extractor: (e: DiaryEntryForAnalysis) => number,
  _allSkinConditions: number[]
): CorrelationScore {
  if (entries.length < 3) {
    return { score: 0, strength: 'none', direction: 'neutral', sampleSize: entries.length };
  }

  const factorValues = entries.map(extractor);
  const skinValues = entries.map((e) => e.skin_condition);

  const r = calculatePearsonCorrelation(factorValues, skinValues);

  return correlationToScore(r, entries.length);
}

/**
 * TOP 3 영향 요인 추출
 */
function extractTopInfluencers(
  correlations: CorrelationAnalysisResult['correlations']
): CorrelationAnalysisResult['topInfluencers'] {
  const factors = Object.entries(correlations)
    .map(([factor, data]) => ({
      factor,
      factorLabel: FACTOR_LABELS[factor] || factor,
      absScore: Math.abs(data.score),
      score: data.score,
      strength: data.strength,
      direction: data.direction,
    }))
    .filter((f) => f.strength !== 'none')
    .sort((a, b) => b.absScore - a.absScore)
    .slice(0, 3);

  return factors.map((f) => ({
    factor: f.factor,
    factorLabel: f.factorLabel,
    impact: f.score > 0 ? ('positive' as const) : ('negative' as const),
    strength: f.strength as 'strong' | 'moderate' | 'weak',
    description: generateInfluencerDescription(f.factorLabel, f.score, f.strength),
  }));
}

/**
 * 영향 요인 설명 생성
 */
function generateInfluencerDescription(
  factorLabel: string,
  score: number,
  strength: string
): string {
  const strengthText = strength === 'strong' ? '강한' : strength === 'moderate' ? '보통의' : '약한';
  const directionText = score > 0 ? '양의' : '음의';

  if (score > 0) {
    return `${factorLabel}이(가) 좋을수록 피부 상태도 좋아지는 ${strengthText} ${directionText} 상관관계가 있습니다.`;
  } else {
    return `${factorLabel}이(가) 높을수록 피부 상태가 나빠지는 ${strengthText} 상관관계가 있습니다.`;
  }
}

/**
 * 인사이트 생성
 */
function generateInsights(
  correlations: CorrelationAnalysisResult['correlations'],
  entries: DiaryEntryForAnalysis[]
): string[] {
  const insights: string[] = [];

  // 수면 관련 인사이트
  if (
    correlations.sleepQuality.strength === 'strong' ||
    correlations.sleepHours.strength === 'strong'
  ) {
    insights.push(
      '수면의 질이 피부 상태에 큰 영향을 미치고 있습니다. 규칙적인 수면 습관을 유지해보세요.'
    );
  }

  // 스트레스 관련 인사이트
  if (correlations.stressLevel.strength === 'strong') {
    insights.push(
      '스트레스가 피부 상태에 직접적인 영향을 주고 있습니다. 스트레스 관리가 필요합니다.'
    );
  }

  // 루틴 관련 인사이트
  const routineCompliance =
    entries.filter((e) => e.morning_routine_completed && e.evening_routine_completed).length /
    entries.length;

  if (routineCompliance < 0.5) {
    insights.push('스킨케어 루틴 완료율이 낮습니다. 꾸준한 관리가 피부 개선에 도움이 됩니다.');
  } else if (routineCompliance > 0.8) {
    insights.push('스킨케어 루틴을 잘 지키고 계십니다. 좋은 습관이 피부 건강에 기여하고 있습니다.');
  }

  // 수분 섭취 인사이트
  const avgWater = entries.reduce((sum, e) => sum + (e.water_intake_ml || 0), 0) / entries.length;
  if (avgWater < 1500) {
    insights.push('평균 수분 섭취량이 권장량(2L)보다 낮습니다. 수분 섭취를 늘려보세요.');
  }

  // 기본 인사이트
  if (insights.length === 0) {
    insights.push('데이터가 더 쌓이면 더 정확한 분석이 가능합니다. 꾸준히 기록해주세요!');
  }

  return insights.slice(0, 4);
}

/**
 * 권장사항 생성
 */
function generateRecommendations(
  correlations: CorrelationAnalysisResult['correlations'],
  entries: DiaryEntryForAnalysis[]
): CorrelationAnalysisResult['recommendations'] {
  const recommendations: CorrelationAnalysisResult['recommendations'] = [];

  // 수면 개선 권장
  if (correlations.sleepQuality.score > 30) {
    const avgSleep = entries.reduce((sum, e) => sum + (e.sleep_hours || 0), 0) / entries.length;
    if (avgSleep < 7) {
      recommendations.push({
        priority: 'high',
        category: '수면',
        action: '7시간 이상 수면 확보하기',
        reason: '수면 시간이 피부 상태와 강한 양의 상관관계를 보입니다.',
      });
    }
  }

  // 스트레스 관리 권장
  if (correlations.stressLevel.score < -30) {
    recommendations.push({
      priority: 'high',
      category: '스트레스',
      action: '스트레스 관리 루틴 도입하기',
      reason: '스트레스가 피부 상태에 부정적인 영향을 주고 있습니다.',
    });
  }

  // 루틴 완료 권장
  if (correlations.eveningRoutine.score > 20) {
    const eveningRate = entries.filter((e) => e.evening_routine_completed).length / entries.length;
    if (eveningRate < 0.7) {
      recommendations.push({
        priority: 'medium',
        category: '스킨케어',
        action: '저녁 스킨케어 루틴 꾸준히 하기',
        reason: '저녁 루틴 완료가 피부 상태 개선과 관련이 있습니다.',
      });
    }
  }

  // 수분 섭취 권장
  if (correlations.waterIntake.score > 15) {
    recommendations.push({
      priority: 'medium',
      category: '수분',
      action: '하루 2L 이상 물 마시기',
      reason: '수분 섭취가 피부 수분도와 연관이 있습니다.',
    });
  }

  return recommendations.slice(0, 4);
}

/**
 * 분석 신뢰도 평가
 */
function assessConfidence(
  entryCount: number,
  _correlations: CorrelationAnalysisResult['correlations']
): { confidence: 'high' | 'medium' | 'low'; confidenceReason: string } {
  if (entryCount >= 21) {
    return {
      confidence: 'high',
      confidenceReason: '3주 이상의 충분한 데이터로 신뢰할 수 있는 분석입니다.',
    };
  } else if (entryCount >= 14) {
    return {
      confidence: 'medium',
      confidenceReason:
        '2주간의 데이터로 참고할 수 있는 분석입니다. 더 많은 기록이 쌓이면 정확도가 높아집니다.',
    };
  } else {
    return {
      confidence: 'low',
      confidenceReason:
        '데이터가 적어 참고용으로만 활용해주세요. 최소 2주 이상 기록하면 더 정확한 분석이 가능합니다.',
    };
  }
}

/**
 * 데이터 부족 시 기본 결과 생성
 */
function generateInsufficientDataResult(
  startDate: Date,
  endDate: Date,
  entriesCount: number
): CorrelationAnalysisResult {
  const emptyScore: CorrelationScore = {
    score: 0,
    strength: 'none',
    direction: 'neutral',
    sampleSize: entriesCount,
  };

  return {
    period: {
      start: startDate.toISOString().split('T')[0],
      end: endDate.toISOString().split('T')[0],
      totalDays: Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)),
      entriesCount,
    },
    correlations: {
      sleepHours: emptyScore,
      sleepQuality: emptyScore,
      waterIntake: emptyScore,
      stressLevel: emptyScore,
      outdoorHours: emptyScore,
      morningRoutine: emptyScore,
      eveningRoutine: emptyScore,
    },
    topInfluencers: [],
    insights: [
      '상관관계 분석을 위해 최소 5일 이상의 기록이 필요합니다.',
      '매일 조금씩 기록하면 나만의 피부 패턴을 발견할 수 있어요!',
    ],
    recommendations: [
      {
        priority: 'high',
        category: '기록',
        action: '피부 다이어리를 매일 작성해보세요',
        reason: '데이터가 쌓일수록 더 정확한 분석이 가능합니다.',
      },
    ],
    confidence: 'low',
    confidenceReason: `현재 ${entriesCount}개의 기록만 있습니다. 최소 5개 이상의 기록이 필요합니다.`,
  };
}

/**
 * 다이어리 AI 인사이트 업데이트 (백그라운드)
 */
export async function updateDiaryAiInsights(
  supabase: SupabaseClient,
  entryId: string,
  insights: Record<string, unknown>
): Promise<void> {
  const { error } = await supabase
    .from('skin_diary_entries')
    .update({
      ai_insights: insights,
      ai_correlation_score: (insights as { correlationScore?: number }).correlationScore || null,
    })
    .eq('id', entryId);

  if (error) {
    geminiLogger.error('[Correlation] Failed to update AI insights:', error);
  }
}
