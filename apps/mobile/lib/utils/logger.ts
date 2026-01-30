/**
 * 중앙화된 로깅 시스템 (Mobile)
 * @description console.log 대신 사용하여 환경별 로깅 제어
 *
 * 사용법:
 * ```typescript
 * import { createLogger } from '@/lib/utils/logger';
 * const logger = createLogger('ModuleName');
 *
 * logger.debug('상세 정보');
 * logger.info('일반 정보');
 * logger.warn('경고');
 * logger.error('에러', error);
 * ```
 */

type LogLevel = 'debug' | 'info' | 'warn' | 'error';

interface LoggerConfig {
  /** 최소 로그 레벨 */
  minLevel: LogLevel;
  /** 타임스탬프 표시 여부 */
  showTimestamp: boolean;
  /** 프로덕션에서도 로그 출력 여부 */
  enableInProduction: boolean;
}

const LOG_LEVELS: Record<LogLevel, number> = {
  debug: 0,
  info: 1,
  warn: 2,
  error: 3,
};

const DEFAULT_CONFIG: LoggerConfig = {
  minLevel: __DEV__ ? 'debug' : 'warn',
  showTimestamp: __DEV__,
  enableInProduction: false,
};

/**
 * 모듈별 로거 생성
 * @param module 모듈 이름 (예: 'Workout', 'Nutrition', 'Camera')
 * @param config 로거 설정 (선택)
 */
export function createLogger(
  module: string,
  config: Partial<LoggerConfig> = {}
) {
  const finalConfig = { ...DEFAULT_CONFIG, ...config };

  const shouldLog = (level: LogLevel): boolean => {
    // 프로덕션에서는 error만 출력 (enableInProduction이 false인 경우)
    if (!__DEV__ && !finalConfig.enableInProduction && level !== 'error') {
      return false;
    }

    return LOG_LEVELS[level] >= LOG_LEVELS[finalConfig.minLevel];
  };

  const formatMessage = (level: LogLevel, message: string): string => {
    const prefix = `[${module}]`;
    const timestamp = finalConfig.showTimestamp
      ? `[${new Date().toISOString()}]`
      : '';
    const levelTag = `[${level.toUpperCase()}]`;

    return `${timestamp}${prefix}${levelTag} ${message}`.trim();
  };

  return {
    /**
     * 디버그 로그 (개발 환경에서만 출력)
     */
    debug: (message: string, ...args: unknown[]) => {
      if (shouldLog('debug')) {
        // eslint-disable-next-line no-console
        console.debug(formatMessage('debug', message), ...args);
      }
    },

    /**
     * 정보 로그 (개발 환경에서만 출력)
     */
    info: (message: string, ...args: unknown[]) => {
      if (shouldLog('info')) {
        // eslint-disable-next-line no-console
        console.info(formatMessage('info', message), ...args);
      }
    },

    /**
     * 경고 로그
     */
    warn: (message: string, ...args: unknown[]) => {
      if (shouldLog('warn')) {
        // eslint-disable-next-line no-console
        console.warn(formatMessage('warn', message), ...args);
      }
    },

    /**
     * 에러 로그 (항상 출력)
     */
    error: (message: string, ...args: unknown[]) => {
      if (shouldLog('error')) {
        // eslint-disable-next-line no-console
        console.error(formatMessage('error', message), ...args);
      }
    },
  };
}

// ============================================
// 사전 정의된 모듈별 로거
// ============================================

/** 앱 로거 (레이아웃, 초기화 등) */
export const appLogger = createLogger('App');

/** 인증 모듈 로거 */
export const authLogger = createLogger('Auth');

/** 운동 모듈 로거 */
export const workoutLogger = createLogger('Workout');

/** 영양 모듈 로거 */
export const nutritionLogger = createLogger('Nutrition');

/** 물 섭취 로거 */
export const waterLogger = createLogger('Water');

/** 건강 데이터 로거 */
export const healthLogger = createLogger('Health');

/** 제품 로거 */
export const productLogger = createLogger('Product');

/** 분석 로거 */
export const analysisLogger = createLogger('Analysis');

/** 챌린지 로거 */
export const challengeLogger = createLogger('Challenge');

/** 옷장 로거 */
export const closetLogger = createLogger('Closet');

/** 설정 로거 */
export const settingsLogger = createLogger('Settings');

/** 프로필 로거 */
export const profileLogger = createLogger('Profile');

/** 알림 로거 */
export const notificationLogger = createLogger('Notification');

/** 카메라 로거 */
export const cameraLogger = createLogger('Camera');

/** 공유 로거 */
export const shareLogger = createLogger('Share');

/** 에러 바운더리 로거 */
export const errorLogger = createLogger('ErrorBoundary');

/** 위젯 로거 */
export const widgetLogger = createLogger('Widget');

/** 딥링크 로거 */
export const deepLinkLogger = createLogger('DeepLink');

/** 피드 로거 */
export const feedLogger = createLogger('Feed');

/** 오프라인 로거 */
export const offlineLogger = createLogger('Offline');

/** 푸시 로거 */
export const pushLogger = createLogger('Push');

/** 소셜 로거 */
export const socialLogger = createLogger('Social');

/** 분석/모니터링 로거 */
export const analyticsLogger = createLogger('Analytics');

/** 앱 투어 로거 */
export const tourLogger = createLogger('Tour');

/** 동기화 로거 */
export const syncLogger = createLogger('Sync');

/** 온보딩 로거 */
export const onboardingLogger = createLogger('Onboarding');

/** 스킨케어 로거 */
export const skincareLogger = createLogger('Skincare');

/** 어필리에이트 로거 */
export const affiliateLogger = createLogger('Affiliate');

/** Gemini AI 로거 */
export const geminiLogger = createLogger('Gemini');

/** DB(Supabase) 로거 */
export const dbLogger = createLogger('DB');

/** Sentry 로거 */
export const sentryLogger = createLogger('Sentry');

/** 코치 AI 로거 */
export const coachLogger = createLogger('Coach');

// ============================================
// 유틸리티
// ============================================

/**
 * 에러 객체를 안전하게 문자열로 변환
 */
export function formatError(error: unknown): string {
  if (error instanceof Error) {
    return `${error.name}: ${error.message}`;
  }
  return String(error);
}
