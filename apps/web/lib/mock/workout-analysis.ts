/**
 * W-1 운동 분석 Mock 데이터 생성기
 * AI 실패 시 Fallback으로 사용
 */

import {
  GeminiWorkoutAnalysisResult,
  WorkoutAnalysisInput,
  GeminiExerciseRecommendationResult,
  ExerciseRecommendationInput,
  GeminiWorkoutInsightResult,
  WorkoutInsightInput,
} from '@/lib/gemini';
import { classifyWorkoutType } from '@/lib/workout/classifyWorkoutType';

/**
 * Mock 운동 분석 결과 생성
 */
export function generateMockWorkoutAnalysis(
  input: WorkoutAnalysisInput
): GeminiWorkoutAnalysisResult {
  // 기존 분류 로직 사용
  const classification = classifyWorkoutType({
    goals: input.goals,
    concerns: input.concerns,
    frequency: input.frequency,
    equipment: input.equipment,
  });

  // 타입별 상세 정보
  const typeDetails: Record<
    string,
    {
      label: string;
      description: string;
      intensity: 'low' | 'medium' | 'high';
      exercises: Array<{ name: string; category: string; reason: string }>;
    }
  > = {
    toner: {
      label: '토너',
      description: '근육 탄력과 라인 만들기에 집중하는 운동 타입입니다.',
      intensity: 'medium',
      exercises: [
        { name: '플랭크', category: 'core', reason: '코어 강화와 전신 탄력에 효과적' },
        { name: '스쿼트', category: 'lower', reason: '하체 라인 정리에 좋음' },
        { name: '팔굽혀펴기', category: 'upper', reason: '상체 탄력 강화' },
        { name: '런지', category: 'lower', reason: '하체 균형과 라인 개선' },
        { name: '덤벨 로우', category: 'upper', reason: '등 라인 강화' },
      ],
    },
    builder: {
      label: '빌더',
      description: '근육량 증가와 근력 강화에 집중하는 운동 타입입니다.',
      intensity: 'high',
      exercises: [
        { name: '벤치프레스', category: 'upper', reason: '가슴 근육 발달' },
        { name: '데드리프트', category: 'lower', reason: '전신 근력 강화' },
        { name: '바벨 스쿼트', category: 'lower', reason: '하체 근력 발달' },
        { name: '풀업', category: 'upper', reason: '등 근육 발달' },
        { name: '숄더프레스', category: 'upper', reason: '어깨 근육 강화' },
      ],
    },
    burner: {
      label: '버너',
      description: '체지방 연소와 체중 감량에 집중하는 운동 타입입니다.',
      intensity: 'high',
      exercises: [
        { name: '버피', category: 'cardio', reason: '고강도 칼로리 소모' },
        { name: '마운틴 클라이머', category: 'cardio', reason: '전신 유산소 효과' },
        { name: '점프 스쿼트', category: 'cardio', reason: '하체와 심폐 기능 동시 강화' },
        { name: '로잉', category: 'cardio', reason: '전신 유산소 운동' },
        { name: 'HIIT 인터벌', category: 'cardio', reason: '단시간 고효율 칼로리 소모' },
      ],
    },
    mover: {
      label: '무버',
      description: '체력 향상과 심폐 기능 강화에 집중하는 운동 타입입니다.',
      intensity: 'medium',
      exercises: [
        { name: '조깅', category: 'cardio', reason: '기초 심폐 기능 향상' },
        { name: '자전거', category: 'cardio', reason: '지구력 강화' },
        { name: '줄넘기', category: 'cardio', reason: '민첩성과 심폐 기능 향상' },
        { name: '케틀벨 스윙', category: 'cardio', reason: '전신 기능성 운동' },
        { name: '복싱', category: 'cardio', reason: '심폐 기능과 민첩성 향상' },
      ],
    },
    flexer: {
      label: '플렉서',
      description: '유연성과 균형감각 향상에 집중하는 운동 타입입니다.',
      intensity: 'low',
      exercises: [
        { name: '요가', category: 'core', reason: '유연성과 마음의 안정' },
        { name: '필라테스', category: 'core', reason: '코어 강화와 자세 교정' },
        { name: '스트레칭', category: 'core', reason: '근육 이완과 유연성 향상' },
        { name: '폼롤러', category: 'core', reason: '근막 이완과 회복' },
        { name: '밸런스 보드', category: 'core', reason: '균형감각 향상' },
      ],
    },
  };

  const details = typeDetails[classification.type] || typeDetails.toner;

  // 빈도에 따른 주간 운동일 계산
  const frequencyMap: Record<string, number> = {
    '1-2': 2,
    '3-4': 4,
    '5-6': 5,
    daily: 7,
  };
  const workoutDays = frequencyMap[input.frequency] || 3;

  // 고민 부위에 따른 집중 영역
  const concernToArea: Record<string, string> = {
    belly: '복부',
    thigh: '허벅지',
    arm: '팔',
    back: '등',
    hip: '엉덩이',
    calf: '종아리',
    shoulder: '어깨',
    overall: '전신',
  };
  const focusAreas = input.concerns.map((c) => concernToArea[c] || c).slice(0, 2);

  // 부상 관련 주의사항
  let cautionAdvice: string | undefined;
  if (input.injuries && input.injuries.length > 0) {
    const injuryLabels: Record<string, string> = {
      neck: '목',
      shoulder: '어깨',
      back: '허리',
      knee: '무릎',
      ankle: '발목',
      wrist: '손목',
    };
    const injuryNames = input.injuries.map((i) => injuryLabels[i] || i).join(', ');
    cautionAdvice = `${injuryNames} 부위에 무리가 가는 운동은 피하시고, 통증이 느껴지면 즉시 중단하세요.`;
  }

  return {
    workoutType: classification.type,
    workoutTypeLabel: details.label,
    workoutTypeDescription: details.description,
    confidence: 75,
    reason: classification.reason,
    bodyTypeAdvice: input.bodyType
      ? `${input.bodyType}형 체형에 맞춰 상체와 하체의 균형을 고려한 운동을 추천합니다.`
      : '체형에 맞는 균형 잡힌 운동 루틴을 추천합니다.',
    goalAdvice: `선택하신 목표를 달성하기 위해 꾸준한 운동이 중요합니다. ${frequencyMap[input.frequency] || 3}회 운동을 목표로 시작해보세요.`,
    cautionAdvice,
    recommendedExercises: details.exercises,
    weeklyPlanSuggestion: {
      workoutDays,
      focusAreas: focusAreas.length > 0 ? focusAreas : ['전신'],
      intensity: details.intensity,
    },
  };
}

/**
 * Mock 운동 추천 결과 생성 (Task 3.3 Fallback)
 * AI 실패 시 규칙 기반으로 운동 추천
 */
export function generateMockExerciseRecommendation(
  input: ExerciseRecommendationInput
): GeminiExerciseRecommendationResult {
  const { workoutType, concerns, injuries, equipment, availableExercises, userLevel } = input;

  // 운동 타입별 카테고리 우선순위
  const categoryPriority: Record<string, string[]> = {
    toner: ['upper', 'lower', 'core'],
    builder: ['upper', 'lower'],
    burner: ['cardio', 'lower', 'core'],
    mover: ['cardio', 'lower'],
    flexer: ['core', 'lower', 'upper'],
  };

  // 부상 부위에 따른 제외 bodyParts
  const injuryToBodyParts: Record<string, string[]> = {
    neck: ['shoulder'],
    shoulder: ['shoulder', 'chest'],
    back: ['back', 'abs'],
    knee: ['thigh', 'calf'],
    ankle: ['calf'],
    wrist: ['arm'],
  };

  // 부상 부위에 해당하는 bodyParts 수집
  const excludeBodyParts = new Set<string>();
  injuries?.forEach((injury) => {
    const parts = injuryToBodyParts[injury];
    if (parts) parts.forEach((p) => excludeBodyParts.add(p));
  });

  // 장비 필터링
  const availableEquipment = new Set(equipment);
  if (equipment.length === 0) availableEquipment.add('bodyweight');

  // 난이도 필터링
  const difficultyMap: Record<string, string[]> = {
    beginner: ['beginner'],
    intermediate: ['beginner', 'intermediate'],
    advanced: ['beginner', 'intermediate', 'advanced'],
  };
  const allowedDifficulties = difficultyMap[userLevel || 'beginner'];

  // 운동 필터링 및 점수 계산
  const scoredExercises = availableExercises
    .filter((ex) => {
      // 부상 부위 제외
      if (ex.bodyParts.some((part) => excludeBodyParts.has(part))) return false;
      // 장비 필터
      if (!ex.equipment.some((eq) => availableEquipment.has(eq))) return false;
      // 난이도 필터
      if (!allowedDifficulties.includes(ex.difficulty)) return false;
      return true;
    })
    .map((ex) => {
      let score = 0;
      // 카테고리 우선순위 점수
      const priorities = categoryPriority[workoutType] || [];
      const catIndex = priorities.indexOf(ex.category);
      if (catIndex >= 0) score += (priorities.length - catIndex) * 10;
      // 관심 부위 일치 점수
      const concernBodyParts: Record<string, string[]> = {
        belly: ['abs', 'waist'],
        thigh: ['thigh'],
        arm: ['arm'],
        back: ['back'],
        hip: ['hip'],
        calf: ['calf'],
        shoulder: ['shoulder'],
        chest: ['chest'],
      };
      concerns.forEach((concern) => {
        const parts = concernBodyParts[concern] || [];
        if (ex.bodyParts.some((p) => parts.includes(p))) score += 5;
      });
      return { exercise: ex, score };
    })
    .sort((a, b) => b.score - a.score);

  // 상위 운동 선택 (메인 3-5개, 워밍업 2개, 쿨다운 1개) - Feature Spec 4.3 기준
  const mainExercises = scoredExercises.slice(0, 5);
  const warmupCandidates = scoredExercises.filter(
    (e) => e.exercise.difficulty === 'beginner' && e.exercise.category !== 'cardio'
  );
  const cooldownCandidates = scoredExercises.filter(
    (e) => e.exercise.difficulty === 'beginner'
  );

  // 운동 타입별 기본 세트/반복 설정
  const volumeSettings: Record<string, { sets: number; reps: number; rest: number }> = {
    toner: { sets: 3, reps: 15, rest: 45 },
    builder: { sets: 4, reps: 10, rest: 90 },
    burner: { sets: 3, reps: 12, rest: 30 },
    mover: { sets: 3, reps: 12, rest: 45 },
    flexer: { sets: 2, reps: 10, rest: 60 },
  };
  const volume = volumeSettings[workoutType] || volumeSettings.toner;

  // 결과 구성
  const dailyExercises = mainExercises.map((item, index) => ({
    exerciseId: item.exercise.id,
    reason: `${item.exercise.name}은(는) ${concerns[0] ? concerns[0] + ' 부위와 관련된' : '목표에 적합한'} 운동입니다.`,
    sets: volume.sets,
    reps: volume.reps,
    restSeconds: volume.rest,
    weight: item.exercise.equipment.includes('bodyweight')
      ? { male: 0, female: 0, unit: 'bodyweight' as const }
      : { male: 10, female: 5, unit: 'kg' as const },
    duration: item.exercise.category === 'cardio' ? 10 : undefined,
    priority: index < 3 ? 1 : index < 5 ? 2 : 3,
  }));

  const warmupExercises = warmupCandidates.slice(0, 2).map((e) => e.exercise.id);
  const cooldownExercises = cooldownCandidates.slice(0, 1).map((e) => e.exercise.id);

  // 집중 부위 계산
  const focusBodyParts = [...new Set(mainExercises.flatMap((e) => e.exercise.bodyParts))].slice(
    0,
    3
  );

  // 예상 시간 및 칼로리
  const estimatedMinutes =
    dailyExercises.length * 5 + warmupExercises.length * 3 + cooldownExercises.length * 3;
  const avgMet =
    mainExercises.reduce((sum, e) => sum + e.exercise.met, 0) / mainExercises.length || 4;
  const estimatedCalories = Math.round((input.userWeight || 60) * (estimatedMinutes / 60) * avgMet);

  return {
    dailyExercises,
    warmupExercises,
    cooldownExercises,
    focusBodyParts,
    estimatedMinutes,
    estimatedCalories,
    difficultyLevel: userLevel || 'beginner',
    aiTips: [
      '운동 전 충분한 워밍업을 해주세요.',
      '호흡을 멈추지 말고 자연스럽게 유지하세요.',
      '통증이 느껴지면 즉시 운동을 중단하세요.',
    ],
  };
}

/**
 * Mock 인사이트 결과 생성 (Task 4.1 Fallback)
 * AI 실패 시 규칙 기반으로 인사이트 생성
 */
export function generateMockWorkoutInsights(
  input: WorkoutInsightInput
): GeminiWorkoutInsightResult {
  const insights: GeminiWorkoutInsightResult['insights'] = [];

  // 1. 부위 균형 분석
  const { upper, lower, core, cardio } = input.bodyPartDistribution;
  const minPart = Math.min(upper, lower, core, cardio);
  const partNames: Record<string, string> = {
    upper: '상체',
    lower: '하체',
    core: '코어',
    cardio: '유산소',
  };

  // Feature Spec 7.4: 특정 부위가 30% 미만이면 균형 인사이트 생성
  if (minPart < 0.3) {
    // 30% 미만인 부위 찾기
    const weakParts: string[] = [];
    if (upper < 0.3) weakParts.push(partNames.upper);
    if (lower < 0.3) weakParts.push(partNames.lower);
    if (core < 0.3) weakParts.push(partNames.core);
    if (cardio < 0.3) weakParts.push(partNames.cardio);

    insights.push({
      type: 'balance',
      message: `${weakParts[0]} 운동이 부족해요! 균형 잡힌 운동을 위해 추가해보세요 💪`,
      priority: 'high',
      data: {
        percentage: Math.round(minPart * 100),
        targetArea: weakParts[0],
      },
    });
  }

  // 2. 볼륨 변화 분석
  if (input.previousWeekStats && input.previousWeekStats.totalVolume > 0) {
    const volumeChange =
      ((input.currentWeekStats.totalVolume - input.previousWeekStats.totalVolume) /
        input.previousWeekStats.totalVolume) *
      100;

    if (Math.abs(volumeChange) >= 10) {
      insights.push({
        type: 'progress',
        message:
          volumeChange > 0
            ? `지난주보다 볼륨 +${Math.round(volumeChange)}%! 성장하고 있어요 🔥`
            : `이번 주는 조금 쉬어가는 중이에요. 괜찮아요!`,
        priority: volumeChange > 0 ? 'medium' : 'low',
        data: {
          percentage: Math.round(volumeChange),
          trend: volumeChange > 0 ? 'up' : 'down',
        },
      });
    }
  }

  // 3. 연속 기록 분석
  const { currentStreak } = input.userStats;
  if (currentStreak >= 7) {
    insights.push({
      type: 'streak',
      message: `${currentStreak}일 연속 운동 성공! 대단해요! 🎉`,
      priority: 'high',
      data: {
        percentage: currentStreak,
      },
    });
  } else if (currentStreak >= 3) {
    insights.push({
      type: 'streak',
      message: `${currentStreak}일 연속 운동 중! 조금만 더 힘내요! 💪`,
      priority: 'medium',
      data: {
        percentage: currentStreak,
      },
    });
  }

  // 4. 또래 비교
  if (input.peerComparison?.userPercentile) {
    const percentile = input.peerComparison.userPercentile;
    if (percentile <= 30) {
      insights.push({
        type: 'comparison',
        message: `${input.peerComparison.ageGroup} 중 상위 ${percentile}%! 🏆`,
        priority: 'medium',
        data: {
          percentage: percentile,
        },
      });
    }
  }

  // 5. 운동 타입별 팁
  const workoutTypeTips: Record<string, string> = {
    toner: '근육 탄력을 위해 고반복 저중량으로 운동해보세요!',
    builder: '근성장을 위해 점진적 과부하 원칙을 지켜주세요!',
    burner: '체지방 연소를 위해 심박수를 높게 유지해보세요!',
    mover: '지구력 향상을 위해 일정한 페이스를 유지하세요!',
    flexer: '유연성 향상을 위해 호흡에 집중하며 천천히 스트레칭하세요!',
  };

  if (insights.length < 3 && workoutTypeTips[input.userStats.workoutType]) {
    insights.push({
      type: 'tip',
      message: workoutTypeTips[input.userStats.workoutType],
      priority: 'low',
    });
  }

  // 우선순위 정렬 및 최대 3개로 제한
  const priorityOrder: Record<string, number> = { high: 3, medium: 2, low: 1 };
  const sortedInsights = insights
    .sort((a, b) => priorityOrder[b.priority] - priorityOrder[a.priority])
    .slice(0, 3);

  // 주간 하이라이트 생성
  let weeklyHighlight = '이번 주도 꾸준히 운동하셨네요!';
  if (input.currentWeekStats.totalSessions >= 5) {
    weeklyHighlight = '이번 주 5회 이상 운동 달성! 최고의 한 주였어요!';
  } else if (currentStreak >= 7) {
    weeklyHighlight = `${currentStreak}일 연속 운동 달성! 정말 대단해요!`;
  }

  // 동기부여 메시지 생성
  const motivationalMessages = [
    '오늘의 노력이 내일의 나를 만들어요. 힘내세요!',
    '포기하지 않는 당신이 멋져요. 함께 가요!',
    '작은 변화가 큰 결과를 만들어요. 응원합니다!',
    '꾸준함이 최고의 무기예요. 계속 달려봐요!',
  ];
  const motivationalMessage =
    motivationalMessages[Math.floor(Math.random() * motivationalMessages.length)];

  return {
    insights: sortedInsights,
    weeklyHighlight,
    motivationalMessage,
  };
}
