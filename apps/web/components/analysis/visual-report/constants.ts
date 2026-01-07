// 비주얼 리포트 시스템 상수 및 유틸리티

// 분석 등급 타입
export type AnalysisGrade = 'diamond' | 'gold' | 'silver' | 'bronze';

// 등급 설정 인터페이스
export interface GradeConfig {
  grade: AnalysisGrade;
  label: string; // 한국어 라벨
  minScore: number; // 최소 점수 (이상)
  maxScore: number; // 최대 점수 (미만)
  color: string; // 텍스트 색상 클래스
  bgColor: string; // 배경 색상 클래스
  borderColor: string; // 테두리 색상 클래스
  progressColor: string; // Progress 바 색상 클래스
  icon: 'Gem' | 'Crown' | 'Medal' | 'Shield'; // Lucide 아이콘
  message: string; // 등급별 메시지
  description: string; // 설명
}

// 등급별 설정
export const GRADE_CONFIGS: GradeConfig[] = [
  {
    grade: 'diamond',
    label: '다이아몬드',
    minScore: 85,
    maxScore: 101,
    color: 'text-cyan-500',
    bgColor: 'bg-gradient-to-r from-cyan-50 to-blue-50 dark:from-cyan-950/30 dark:to-blue-950/30',
    borderColor: 'border-cyan-300 dark:border-cyan-700',
    progressColor: 'bg-gradient-to-r from-cyan-400 to-blue-500',
    icon: 'Gem',
    message: '최고 수준이에요!',
    description: '지금처럼 유지해주세요',
  },
  {
    grade: 'gold',
    label: '골드',
    minScore: 70,
    maxScore: 85,
    color: 'text-yellow-500',
    bgColor:
      'bg-gradient-to-r from-yellow-50 to-amber-50 dark:from-yellow-950/30 dark:to-amber-950/30',
    borderColor: 'border-yellow-300 dark:border-yellow-700',
    progressColor: 'bg-gradient-to-r from-yellow-400 to-amber-500',
    icon: 'Crown',
    message: '우수한 상태예요!',
    description: '조금만 더 관리하면 최고가 될 수 있어요',
  },
  {
    grade: 'silver',
    label: '실버',
    minScore: 50,
    maxScore: 70,
    color: 'text-gray-500',
    bgColor: 'bg-gradient-to-r from-gray-50 to-slate-50 dark:from-gray-900/30 dark:to-slate-900/30',
    borderColor: 'border-gray-300 dark:border-gray-600',
    progressColor: 'bg-gradient-to-r from-gray-400 to-slate-500',
    icon: 'Medal',
    message: '양호한 상태예요!',
    description: '꾸준한 관리로 더 나아질 수 있어요',
  },
  {
    grade: 'bronze',
    label: '브론즈',
    minScore: 0,
    maxScore: 50,
    color: 'text-orange-500',
    bgColor:
      'bg-gradient-to-r from-orange-50 to-amber-50 dark:from-orange-950/30 dark:to-amber-950/30',
    borderColor: 'border-orange-300 dark:border-orange-700',
    progressColor: 'bg-gradient-to-r from-orange-400 to-amber-500',
    icon: 'Shield',
    message: '성장 가능성이 커요!',
    description: '함께 케어해볼까요?',
  },
];

/**
 * 점수 → 등급 변환 함수
 * @param score 0-100 점수
 * @returns 해당 등급 설정
 */
export function getGradeFromScore(score: number): GradeConfig {
  // 유효 범위로 클램핑
  const clampedScore = Math.max(0, Math.min(100, score));

  const config = GRADE_CONFIGS.find(
    (config) => clampedScore >= config.minScore && clampedScore < config.maxScore
  );

  // 기본값: 브론즈
  return config || GRADE_CONFIGS[GRADE_CONFIGS.length - 1];
}

/**
 * 등급별 아이콘 컴포넌트 매핑 (Lucide)
 */
export const GRADE_ICONS = {
  diamond: 'Gem',
  gold: 'Crown',
  silver: 'Medal',
  bronze: 'Shield',
} as const;

// 분석 타입별 라벨
export const ANALYSIS_TYPE_LABELS = {
  skin: '피부 건강',
  body: '체형 분석',
  'personal-color': '퍼스널 컬러',
} as const;

// 분석 타입별 아이콘
export const ANALYSIS_TYPE_ICONS = {
  skin: 'Sparkles',
  body: 'User',
  'personal-color': 'Palette',
} as const;

// 분석 타입별 색상 테마
export const ANALYSIS_TYPE_COLORS = {
  skin: {
    primary: 'emerald',
    text: 'text-emerald-600',
    bg: 'bg-emerald-50 dark:bg-emerald-950/30',
    border: 'border-emerald-200 dark:border-emerald-800',
  },
  body: {
    primary: 'blue',
    text: 'text-blue-600',
    bg: 'bg-blue-50 dark:bg-blue-950/30',
    border: 'border-blue-200 dark:border-blue-800',
  },
  'personal-color': {
    primary: 'pink',
    text: 'text-pink-600',
    bg: 'bg-pink-50 dark:bg-pink-950/30',
    border: 'border-pink-200 dark:border-pink-800',
  },
} as const;

// 긍정적 UX 메시지 템플릿
export const POSITIVE_MESSAGES = {
  // 강점 섹션
  strengthsTitle: '나의 강점',
  strengthsEmpty: '분석 중입니다...',

  // 성장 가능성 섹션
  growthTitle: '성장 가능성',
  growthEmpty: '모든 항목이 우수해요!',
  growthSuffix: '을(를) 개선하면 더 좋아질 수 있어요',

  // 등급 상승 메시지
  upgradeMessage: (current: string, target: string) => `${current}에서 ${target}까지 조금만 더!`,

  // 점수 차이 메시지
  scoreDiff: (diff: number, target: string) => `${diff}점만 더 올리면 ${target} 달성!`,
} as const;

// 퍼스널 컬러 분석용 등급 메시지 (신뢰도 기반)
// 퍼스널 컬러는 타고난 특성이므로 "유지/개선" 개념이 아닌 "정확도" 개념으로 표현
export const PERSONAL_COLOR_GRADE_MESSAGES: Record<
  AnalysisGrade,
  { message: string; description: string }
> = {
  diamond: {
    message: '매우 정확해요!',
    description: '여러 특징이 일관되게 나타났어요',
  },
  gold: {
    message: '신뢰할 수 있어요!',
    description: '주요 특징들이 잘 분석되었어요',
  },
  silver: {
    message: '참고해주세요',
    description: '추가 분석으로 정확도를 높일 수 있어요',
  },
  bronze: {
    message: '재분석을 권장해요',
    description: '더 밝은 조명에서 다시 촬영해보세요',
  },
};

/**
 * 분석 타입에 따른 등급 설정 조회
 * 퍼스널 컬러는 신뢰도 기반 메시지 사용
 */
export function getGradeForAnalysis(
  score: number,
  analysisType?: 'skin' | 'body' | 'personal-color'
): GradeConfig {
  const baseConfig = getGradeFromScore(score);

  // 퍼스널 컬러는 전용 메시지 사용
  if (analysisType === 'personal-color') {
    const pcMessages = PERSONAL_COLOR_GRADE_MESSAGES[baseConfig.grade];
    return {
      ...baseConfig,
      message: pcMessages.message,
      description: pcMessages.description,
    };
  }

  return baseConfig;
}

// 크기별 스타일
export const SIZE_STYLES = {
  sm: {
    iconSize: 'w-4 h-4',
    fontSize: 'text-sm',
    scoreSize: 'text-lg',
    padding: 'p-3',
    gap: 'gap-2',
  },
  md: {
    iconSize: 'w-5 h-5',
    fontSize: 'text-base',
    scoreSize: 'text-2xl',
    padding: 'p-4',
    gap: 'gap-3',
  },
  lg: {
    iconSize: 'w-6 h-6',
    fontSize: 'text-lg',
    scoreSize: 'text-3xl',
    padding: 'p-6',
    gap: 'gap-4',
  },
} as const;
