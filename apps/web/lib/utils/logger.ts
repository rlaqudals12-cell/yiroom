/**
 * 중앙화된 로깅 시스템
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
  minLevel: process.env.NODE_ENV === 'production' ? 'warn' : 'debug',
  showTimestamp: process.env.NODE_ENV !== 'production',
  enableInProduction: false,
};

// 프로덕션 환경 체크
const isProduction = process.env.NODE_ENV === 'production';
const isDevelopment = process.env.NODE_ENV === 'development';
const isTest = process.env.NODE_ENV === 'test';

/**
 * 모듈별 로거 생성
 * @param module 모듈 이름 (예: 'Affiliate', 'Workout', 'Gemini')
 * @param config 로거 설정 (선택)
 */
export function createLogger(module: string, config: Partial<LoggerConfig> = {}) {
  const finalConfig = { ...DEFAULT_CONFIG, ...config };

  const shouldLog = (level: LogLevel): boolean => {
    // 테스트 환경에서는 error만 출력
    if (isTest && level !== 'error') {
      return false;
    }

    // 프로덕션에서는 error만 출력 (enableInProduction이 false인 경우)
    if (isProduction && !finalConfig.enableInProduction && level !== 'error') {
      return false;
    }

    return LOG_LEVELS[level] >= LOG_LEVELS[finalConfig.minLevel];
  };

  const formatMessage = (level: LogLevel, message: string): string => {
    const prefix = `[${module}]`;
    const timestamp = finalConfig.showTimestamp ? `[${new Date().toISOString()}]` : '';
    const levelTag = `[${level.toUpperCase()}]`;

    return `${timestamp}${prefix}${levelTag} ${message}`.trim();
  };

  return {
    /**
     * 디버그 로그 (개발 환경에서만 출력)
     */
    debug: (message: string, ...args: unknown[]) => {
      if (shouldLog('debug')) {
        console.debug(formatMessage('debug', message), ...args);
      }
    },

    /**
     * 정보 로그 (개발 환경에서만 출력)
     */
    info: (message: string, ...args: unknown[]) => {
      if (shouldLog('info')) {
        console.info(formatMessage('info', message), ...args);
      }
    },

    /**
     * 경고 로그
     */
    warn: (message: string, ...args: unknown[]) => {
      if (shouldLog('warn')) {
        console.warn(formatMessage('warn', message), ...args);
      }
    },

    /**
     * 에러 로그 (항상 출력)
     */
    error: (message: string, ...args: unknown[]) => {
      if (shouldLog('error')) {
        console.error(formatMessage('error', message), ...args);
      }
    },

    /**
     * 조건부 로그 (조건이 true일 때만 출력)
     */
    logIf: (condition: boolean, level: LogLevel, message: string, ...args: unknown[]) => {
      if (condition && shouldLog(level)) {
        const logFn = console[level] || console.log;
        logFn(formatMessage(level, message), ...args);
      }
    },

    /**
     * 그룹 로그 시작
     */
    group: (label: string) => {
      if (isDevelopment) {
        console.group(`[${module}] ${label}`);
      }
    },

    /**
     * 그룹 로그 종료
     */
    groupEnd: () => {
      if (isDevelopment) {
        console.groupEnd();
      }
    },

    /**
     * 테이블 형식 로그
     */
    table: (data: unknown) => {
      if (isDevelopment) {
        console.table(data);
      }
    },

    /**
     * 성능 측정 시작
     */
    time: (label: string) => {
      if (isDevelopment) {
        console.time(`[${module}] ${label}`);
      }
    },

    /**
     * 성능 측정 종료
     */
    timeEnd: (label: string) => {
      if (isDevelopment) {
        console.timeEnd(`[${module}] ${label}`);
      }
    },
  };
}

// ============================================
// 사전 정의된 모듈별 로거
// ============================================

/** 어필리에이트 모듈 로거 */
export const affiliateLogger = createLogger('Affiliate');

/** 운동 모듈 로거 */
export const workoutLogger = createLogger('Workout');

/** 영양 모듈 로거 */
export const nutritionLogger = createLogger('Nutrition');

/** AI/Gemini 모듈 로거 */
export const geminiLogger = createLogger('Gemini');

/** 인증 모듈 로거 */
export const authLogger = createLogger('Auth');

/** 데이터베이스 로거 */
export const dbLogger = createLogger('DB');

/** 제품 모듈 로거 */
export const productLogger = createLogger('Product');

/** 게이미피케이션 로거 */
export const gamificationLogger = createLogger('Gamification');

/** 챌린지 로거 */
export const challengeLogger = createLogger('Challenge');

/** 친구/소셜 로거 */
export const socialLogger = createLogger('Social');

/** 관리자 로거 */
export const adminLogger = createLogger('Admin');

/** API 로거 */
export const apiLogger = createLogger('API');

/** 크롤러 로거 */
export const crawlerLogger = createLogger('Crawler');

/** 리더보드 로거 */
export const leaderboardLogger = createLogger('Leaderboard');

/** 웰니스 로거 */
export const wellnessLogger = createLogger('Wellness');

/** 인벤토리 로거 */
export const inventoryLogger = createLogger('Inventory');

/** 스마트 매칭 로거 */
export const smartMatchingLogger = createLogger('SmartMatching');

/** 오프라인 동기화 로거 */
export const offlineLogger = createLogger('Offline');

/** RAG 로거 */
export const ragLogger = createLogger('RAG');

/** 스타일 로거 */
export const styleLogger = createLogger('Style');

/** 분석 로거 */
export const analyticsLogger = createLogger('Analytics');

/** 피드백 로거 */
export const feedbackLogger = createLogger('Feedback');

/** 코치 로거 */
export const coachLogger = createLogger('Coach');

/** 채팅 로거 */
export const chatLogger = createLogger('Chat');

/** 공유 로거 */
export const shareLogger = createLogger('Share');

/** 위시리스트 로거 */
export const wishlistLogger = createLogger('Wishlist');

// ============================================
// 유틸리티
// ============================================

/**
 * 에러 객체를 안전하게 문자열로 변환
 */
export function formatError(error: unknown): string {
  if (error instanceof Error) {
    return `${error.name}: ${error.message}${error.stack ? `\n${error.stack}` : ''}`;
  }
  return String(error);
}

/**
 * 민감 정보 마스킹
 */
export function maskSensitive(value: string, visibleChars = 4): string {
  if (value.length <= visibleChars) {
    return '*'.repeat(value.length);
  }
  return value.slice(0, visibleChars) + '*'.repeat(value.length - visibleChars);
}
