/**
 * 클릭 가드 (중복/어뷰징 방지)
 * @description 동일 사용자의 반복 클릭과 봇 트래픽 필터링
 */

import { affiliateLogger } from '@/lib/utils/logger';

// 메모리 기반 클릭 캐시 (서버 인스턴스별)
// 프로덕션에서는 Redis/Upstash로 교체 권장
const clickCache = new Map<string, number>();

// 캐시 정리 주기 (10분)
const CACHE_CLEANUP_INTERVAL = 10 * 60 * 1000;

// 중복 클릭 차단 기간 (같은 사용자+제품)
const DEDUP_WINDOW_MS = 30 * 60 * 1000; // 30분

// IP당 분당 최대 클릭 수
const MAX_CLICKS_PER_MINUTE = 10;

// IP별 분당 클릭 카운터
const ipClickCounter = new Map<string, { count: number; resetAt: number }>();

/**
 * 클릭 중복 확인
 * @returns true면 중복 (차단해야 함)
 */
export function isDuplicateClick(
  userId: string | null,
  productId: string,
  sessionId?: string
): boolean {
  // 식별자: userId 우선, 없으면 sessionId
  const identifier = userId || sessionId;
  if (!identifier) return false; // 식별 불가 시 통과

  const key = `click:${identifier}:${productId}`;
  const lastClick = clickCache.get(key);

  if (lastClick && Date.now() - lastClick < DEDUP_WINDOW_MS) {
    affiliateLogger.warn(`중복 클릭 감지: ${key}`);
    return true;
  }

  // 클릭 기록
  clickCache.set(key, Date.now());
  return false;
}

/**
 * IP 기반 속도 제한 확인
 * @returns true면 속도 초과 (차단해야 함)
 */
export function isRateLimited(ipHash: string): boolean {
  const now = Date.now();
  const entry = ipClickCounter.get(ipHash);

  if (!entry || now >= entry.resetAt) {
    // 새 윈도우 시작
    ipClickCounter.set(ipHash, { count: 1, resetAt: now + 60_000 });
    return false;
  }

  entry.count++;
  if (entry.count > MAX_CLICKS_PER_MINUTE) {
    affiliateLogger.warn(`IP 속도 제한 초과: ${ipHash} (${entry.count}회/분)`);
    return true;
  }

  return false;
}

/**
 * 봇 트래픽 감지 (User-Agent 기반)
 * @returns true면 봇 의심
 */
export function isSuspiciousUserAgent(userAgent: string | null): boolean {
  if (!userAgent) return true; // UA 없으면 의심

  const ua = userAgent.toLowerCase();

  // 알려진 봇 패턴
  const botPatterns = [
    'bot',
    'crawler',
    'spider',
    'scraper',
    'curl',
    'wget',
    'python-requests',
    'httpx',
    'go-http',
    'java/',
    'postman',
    'insomnia',
    'headless',
    'phantom',
    'puppeteer',
    'selenium',
  ];

  return botPatterns.some((pattern) => ua.includes(pattern));
}

/**
 * 종합 클릭 검증
 * @returns { allowed, reason } - 허용 여부와 거부 사유
 */
export function validateClick(params: {
  userId: string | null;
  productId: string;
  sessionId?: string;
  ipHash?: string;
  userAgent?: string | null;
}): { allowed: boolean; reason?: string } {
  // 1. 봇 체크
  if (isSuspiciousUserAgent(params.userAgent ?? null)) {
    return { allowed: false, reason: 'bot_detected' };
  }

  // 2. 중복 클릭 체크
  if (isDuplicateClick(params.userId, params.productId, params.sessionId)) {
    return { allowed: false, reason: 'duplicate_click' };
  }

  // 3. IP 속도 제한
  if (params.ipHash && isRateLimited(params.ipHash)) {
    return { allowed: false, reason: 'rate_limited' };
  }

  return { allowed: true };
}

// 주기적 캐시 정리 (메모리 누수 방지)
if (typeof globalThis !== 'undefined') {
  const cleanup = (): void => {
    const now = Date.now();

    // 만료된 클릭 캐시 제거
    for (const [key, timestamp] of clickCache.entries()) {
      if (now - timestamp > DEDUP_WINDOW_MS) {
        clickCache.delete(key);
      }
    }

    // 만료된 IP 카운터 제거
    for (const [key, entry] of ipClickCounter.entries()) {
      if (now >= entry.resetAt) {
        ipClickCounter.delete(key);
      }
    }
  };

  // Node.js 환경에서만 setInterval (Edge Runtime 호환)
  if (typeof setInterval !== 'undefined') {
    const timer = setInterval(cleanup, CACHE_CLEANUP_INTERVAL);
    // 프로세스 종료 시 타이머 정리
    if (typeof timer === 'object' && 'unref' in timer) {
      timer.unref();
    }
  }
}

/**
 * 테스트용: 캐시 초기화
 * @internal
 */
export function _resetClickGuardCache(): void {
  clickCache.clear();
  ipClickCounter.clear();
}
