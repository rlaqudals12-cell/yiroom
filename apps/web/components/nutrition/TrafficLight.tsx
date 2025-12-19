'use client';

/**
 * N-1 신호등 표시 컴포넌트 (Task 2.6)
 *
 * 눔(Noom) 방식 음식 신호등 시스템:
 * - 🟢 초록: 칼로리 밀도 < 1 (저칼로리)
 * - 🟡 노랑: 칼로리 밀도 1~2.5 (적당)
 * - 🔴 빨강: 칼로리 밀도 > 2.5 (고칼로리)
 */

// 신호등 타입
export type TrafficLightColor = 'green' | 'yellow' | 'red';

// 신호등 색상별 스타일 설정
export const TRAFFIC_LIGHT_CONFIG = {
  green: {
    emoji: '🟢',
    bgColor: 'bg-green-50',
    borderColor: 'border-green-200',
    textColor: 'text-green-700',
    barColor: 'bg-green-500',
    label: '초록',
    description: '저칼로리',
  },
  yellow: {
    emoji: '🟡',
    bgColor: 'bg-yellow-50',
    borderColor: 'border-yellow-200',
    textColor: 'text-yellow-700',
    barColor: 'bg-yellow-500',
    label: '노랑',
    description: '적당',
  },
  red: {
    emoji: '🔴',
    bgColor: 'bg-red-50',
    borderColor: 'border-red-200',
    textColor: 'text-red-700',
    barColor: 'bg-red-500',
    label: '빨강',
    description: '고칼로리',
  },
} as const;

// 목표 비율 (눔 권장)
export const TRAFFIC_LIGHT_TARGETS = {
  green: { min: 30, label: '30% 이상' },
  yellow: { max: 45, label: '45% 이하' },
  red: { max: 25, label: '25% 이하' },
} as const;

// 신호등 비율 타입
export interface TrafficLightRatio {
  green: number;
  yellow: number;
  red: number;
}

// ==================== 단일 신호등 인디케이터 ====================

interface TrafficLightIndicatorProps {
  color: TrafficLightColor;
  showLabel?: boolean;
  showDescription?: boolean;
  size?: 'sm' | 'md' | 'lg';
}

/**
 * 단일 신호등 인디케이터
 * 음식 카드, 목록 등에서 개별 음식의 신호등 표시에 사용
 */
export function TrafficLightIndicator({
  color,
  showLabel = false,
  showDescription = false,
  size = 'md',
}: TrafficLightIndicatorProps) {
  const config = TRAFFIC_LIGHT_CONFIG[color];

  const sizeClasses = {
    sm: 'text-sm',
    md: 'text-base',
    lg: 'text-lg',
  };

  return (
    <span
      className={`inline-flex items-center gap-1 ${sizeClasses[size]}`}
      data-testid="traffic-light-indicator"
    >
      <span>{config.emoji}</span>
      {showLabel && <span className={config.textColor}>{config.label}</span>}
      {showDescription && (
        <span className="text-muted-foreground text-sm">({config.description})</span>
      )}
    </span>
  );
}

// ==================== 신호등 비율 요약 (인라인) ====================

interface TrafficLightSummaryInlineProps {
  ratio: TrafficLightRatio;
  size?: 'sm' | 'md';
}

/**
 * 신호등 비율 인라인 요약
 * 주간 리포트 등에서 한 줄로 표시: 🟢 32% 🟡 45% 🔴 23%
 */
export function TrafficLightSummaryInline({
  ratio,
  size = 'md',
}: TrafficLightSummaryInlineProps) {
  const textSize = size === 'sm' ? 'text-xs' : 'text-sm';

  return (
    <div
      className={`flex items-center gap-3 ${textSize}`}
      data-testid="traffic-light-summary-inline"
    >
      <span>
        {TRAFFIC_LIGHT_CONFIG.green.emoji} {ratio.green}%
      </span>
      <span>
        {TRAFFIC_LIGHT_CONFIG.yellow.emoji} {ratio.yellow}%
      </span>
      <span>
        {TRAFFIC_LIGHT_CONFIG.red.emoji} {ratio.red}%
      </span>
    </div>
  );
}

// ==================== 신호등 비율 카드 ====================

interface TrafficLightCardProps {
  ratio: TrafficLightRatio;
  showTargets?: boolean;
  title?: string;
}

/**
 * 신호등 비율 카드
 * 대시보드에서 오늘의 음식 신호등 현황 표시에 사용
 */
export function TrafficLightCard({
  ratio,
  showTargets = true,
  title = '오늘의 음식 신호등',
}: TrafficLightCardProps) {
  // 목표 달성 여부 확인
  const isGreenMet = ratio.green >= TRAFFIC_LIGHT_TARGETS.green.min;
  const isYellowMet = ratio.yellow <= TRAFFIC_LIGHT_TARGETS.yellow.max;
  const isRedMet = ratio.red <= TRAFFIC_LIGHT_TARGETS.red.max;
  const isBalanced = isGreenMet && isYellowMet && isRedMet;

  return (
    <div
      className="bg-card rounded-2xl p-4 border border-border"
      data-testid="traffic-light-card"
    >
      <h3 className="text-sm font-medium text-foreground mb-4 flex items-center gap-2">
        🚦 {title}
      </h3>

      {/* 비율 바 */}
      <div className="h-4 rounded-full overflow-hidden flex mb-4">
        <div
          className={`${TRAFFIC_LIGHT_CONFIG.green.barColor} transition-all`}
          style={{ width: `${ratio.green}%` }}
        />
        <div
          className={`${TRAFFIC_LIGHT_CONFIG.yellow.barColor} transition-all`}
          style={{ width: `${ratio.yellow}%` }}
        />
        <div
          className={`${TRAFFIC_LIGHT_CONFIG.red.barColor} transition-all`}
          style={{ width: `${ratio.red}%` }}
        />
      </div>

      {/* 상세 비율 */}
      <div className="space-y-2">
        <TrafficLightRatioRow
          color="green"
          ratio={ratio.green}
          showTarget={showTargets}
          isMet={isGreenMet}
        />
        <TrafficLightRatioRow
          color="yellow"
          ratio={ratio.yellow}
          showTarget={showTargets}
          isMet={isYellowMet}
        />
        <TrafficLightRatioRow
          color="red"
          ratio={ratio.red}
          showTarget={showTargets}
          isMet={isRedMet}
        />
      </div>

      {/* 균형 메시지 */}
      <div className="mt-4 pt-3 border-t border-border/50">
        {isBalanced ? (
          <p className="text-sm text-green-600">✅ 균형 잡힌 식단이에요!</p>
        ) : (
          <p className="text-sm text-amber-600">
            💡 초록색 음식을 조금 더 섭취해보세요
          </p>
        )}
      </div>
    </div>
  );
}

// ==================== 신호등 비율 행 (내부 컴포넌트) ====================

interface TrafficLightRatioRowProps {
  color: TrafficLightColor;
  ratio: number;
  showTarget?: boolean;
  isMet?: boolean;
}

function TrafficLightRatioRow({
  color,
  ratio,
  showTarget = true,
  isMet = true,
}: TrafficLightRatioRowProps) {
  const config = TRAFFIC_LIGHT_CONFIG[color];

  // 색상별 목표 라벨 생성
  let targetLabel: string;
  if (color === 'green') {
    targetLabel = `목표 ${TRAFFIC_LIGHT_TARGETS.green.min}%↑`;
  } else if (color === 'yellow') {
    targetLabel = `목표 ${TRAFFIC_LIGHT_TARGETS.yellow.max}%↓`;
  } else {
    targetLabel = `목표 ${TRAFFIC_LIGHT_TARGETS.red.max}%↓`;
  }

  return (
    <div className="flex items-center justify-between text-sm">
      <span className="flex items-center gap-2">
        <span>{config.emoji}</span>
        <span className={config.textColor}>{config.label}:</span>
        <span className="font-medium">{ratio}%</span>
      </span>
      {showTarget && (
        <span className={`text-xs ${isMet ? 'text-green-600' : 'text-muted-foreground'}`}>
          ({targetLabel}) {isMet && '✓'}
        </span>
      )}
    </div>
  );
}

// ==================== 유틸리티 함수 ====================

/**
 * 음식 배열에서 신호등 비율 계산
 */
export function calculateTrafficLightRatio(
  foods: Array<{ trafficLight: TrafficLightColor }>
): TrafficLightRatio {
  if (foods.length === 0) {
    return { green: 0, yellow: 0, red: 0 };
  }

  const counts = foods.reduce(
    (acc, food) => {
      acc[food.trafficLight]++;
      return acc;
    },
    { green: 0, yellow: 0, red: 0 }
  );

  const total = foods.length;
  return {
    green: Math.round((counts.green / total) * 100),
    yellow: Math.round((counts.yellow / total) * 100),
    red: Math.round((counts.red / total) * 100),
  };
}

/**
 * 칼로리 밀도로 신호등 색상 결정
 * - 칼로리 밀도 = 칼로리 / 무게(g)
 */
export function getTrafficLightFromCalorieDensity(
  calories: number,
  weightInGrams: number
): TrafficLightColor {
  if (weightInGrams <= 0) return 'yellow';

  const density = calories / weightInGrams;

  if (density < 1) return 'green';
  if (density <= 2.5) return 'yellow';
  return 'red';
}
