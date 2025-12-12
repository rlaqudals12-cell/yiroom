/**
 * P3-5.3: 통합 알림 시스템 - 타입 정의
 *
 * 크로스 모듈 알림을 위한 공통 타입 및 설정
 */

/**
 * 소스/타겟 모듈
 */
export type ModuleType = 'nutrition' | 'workout' | 'skin' | 'body';

/**
 * 알림 타입
 */
export type CrossModuleAlertType =
  | 'calorie_surplus'        // N-1 → W-1: 칼로리 초과 운동 유도
  | 'post_workout_nutrition' // W-1 → N-1: 운동 후 영양 추천
  | 'post_workout_skin'      // W-1 → S-1: 운동 후 피부 관리
  | 'hydration_reminder'     // S-1 → N-1: 수분 섭취 권장
  | 'weight_change';         // C-1 → N-1: 체중 변화 알림

/**
 * 알림 우선순위
 */
export type AlertPriority = 'high' | 'medium' | 'low';

/**
 * 알림 레벨 (시각적 강조)
 */
export type AlertLevel = 'info' | 'warning' | 'danger' | 'success';

/**
 * 크로스 모듈 알림 데이터
 */
export interface CrossModuleAlertData {
  /** 알림 고유 ID */
  id: string;
  /** 알림 타입 */
  type: CrossModuleAlertType;
  /** 소스 모듈 */
  sourceModule: ModuleType;
  /** 타겟 모듈 */
  targetModule: ModuleType;
  /** 알림 제목 */
  title: string;
  /** 알림 메시지 */
  message: string;
  /** 알림 우선순위 */
  priority: AlertPriority;
  /** 알림 레벨 */
  level: AlertLevel;
  /** CTA 버튼 텍스트 */
  ctaText: string;
  /** CTA 링크 */
  ctaHref: string;
  /** 추가 데이터 */
  metadata?: Record<string, unknown>;
  /** 생성 시간 */
  createdAt: Date;
  /** 만료 시간 (옵션) */
  expiresAt?: Date;
}

/**
 * 알림 타입별 설정
 */
export const ALERT_TYPE_CONFIG: Record<CrossModuleAlertType, {
  sourceModule: ModuleType;
  targetModule: ModuleType;
  priority: AlertPriority;
  defaultLevel: AlertLevel;
  icon: string;
  ctaText: string;
  ctaHref: string;
}> = {
  calorie_surplus: {
    sourceModule: 'nutrition',
    targetModule: 'workout',
    priority: 'high',
    defaultLevel: 'warning',
    icon: 'flame',
    ctaText: '운동하러 가기',
    ctaHref: '/workout',
  },
  post_workout_nutrition: {
    sourceModule: 'workout',
    targetModule: 'nutrition',
    priority: 'medium',
    defaultLevel: 'info',
    icon: 'utensils',
    ctaText: '식단 기록하기',
    ctaHref: '/nutrition',
  },
  post_workout_skin: {
    sourceModule: 'workout',
    targetModule: 'skin',
    priority: 'low',
    defaultLevel: 'info',
    icon: 'droplets',
    ctaText: '피부 분석 받기',
    ctaHref: '/analysis/skin',
  },
  hydration_reminder: {
    sourceModule: 'skin',
    targetModule: 'nutrition',
    priority: 'medium',
    defaultLevel: 'info',
    icon: 'droplet',
    ctaText: '수분 섭취 기록',
    ctaHref: '/nutrition',
  },
  weight_change: {
    sourceModule: 'body',
    targetModule: 'nutrition',
    priority: 'low',
    defaultLevel: 'info',
    icon: 'scale',
    ctaText: '식단 조정하기',
    ctaHref: '/nutrition',
  },
};

/**
 * 알림 레벨별 스타일
 */
export const ALERT_LEVEL_STYLES: Record<AlertLevel, {
  bg: string;
  border: string;
  text: string;
  button: string;
  iconColor: string;
}> = {
  info: {
    bg: 'bg-blue-50',
    border: 'border-blue-200',
    text: 'text-blue-800',
    button: 'bg-blue-500 hover:bg-blue-600',
    iconColor: 'text-blue-500',
  },
  warning: {
    bg: 'bg-amber-50',
    border: 'border-amber-200',
    text: 'text-amber-800',
    button: 'bg-amber-500 hover:bg-amber-600',
    iconColor: 'text-amber-500',
  },
  danger: {
    bg: 'bg-red-50',
    border: 'border-red-200',
    text: 'text-red-800',
    button: 'bg-red-500 hover:bg-red-600',
    iconColor: 'text-red-500',
  },
  success: {
    bg: 'bg-green-50',
    border: 'border-green-200',
    text: 'text-green-800',
    button: 'bg-green-500 hover:bg-green-600',
    iconColor: 'text-green-500',
  },
};

/**
 * 모듈별 라벨
 */
export const MODULE_LABELS: Record<ModuleType, string> = {
  nutrition: 'N-1 영양',
  workout: 'W-1 운동',
  skin: 'S-1 피부',
  body: 'C-1 체형',
};
