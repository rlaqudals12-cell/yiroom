/**
 * Analytics 세션 관리
 * @description 브라우저 세션 ID 생성 및 관리
 */

// 세션 ID 저장 키
const SESSION_ID_KEY = 'yiroom_session_id';
const SESSION_START_KEY = 'yiroom_session_start';
const SESSION_TIMEOUT_MS = 30 * 60 * 1000; // 30분

/**
 * UUID v4 생성 (브라우저 환경)
 */
function generateUUID(): string {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  // Fallback for older browsers
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

/**
 * 세션 ID 가져오기 (없으면 null)
 */
export function getSessionId(): string | null {
  if (typeof window === 'undefined') return null;

  try {
    const sessionId = sessionStorage.getItem(SESSION_ID_KEY);
    const sessionStart = sessionStorage.getItem(SESSION_START_KEY);

    if (!sessionId || !sessionStart) return null;

    // 세션 타임아웃 체크
    const startTime = parseInt(sessionStart, 10);
    if (Date.now() - startTime > SESSION_TIMEOUT_MS) {
      // 세션 만료
      sessionStorage.removeItem(SESSION_ID_KEY);
      sessionStorage.removeItem(SESSION_START_KEY);
      return null;
    }

    return sessionId;
  } catch {
    return null;
  }
}

/**
 * 세션 ID 가져오거나 생성
 */
export function getOrCreateSession(): string {
  if (typeof window === 'undefined') {
    return `server_${generateUUID()}`;
  }

  try {
    let sessionId = getSessionId();

    if (!sessionId) {
      sessionId = `sess_${generateUUID()}`;
      sessionStorage.setItem(SESSION_ID_KEY, sessionId);
      sessionStorage.setItem(SESSION_START_KEY, Date.now().toString());
    }

    return sessionId;
  } catch {
    // sessionStorage 사용 불가 시
    return `temp_${generateUUID()}`;
  }
}

/**
 * 세션 활동 갱신 (타임아웃 리셋)
 */
export function refreshSession(): void {
  if (typeof window === 'undefined') return;

  try {
    const sessionId = sessionStorage.getItem(SESSION_ID_KEY);
    if (sessionId) {
      sessionStorage.setItem(SESSION_START_KEY, Date.now().toString());
    }
  } catch {
    // 무시
  }
}

/**
 * 세션 종료
 */
export function endSession(): void {
  if (typeof window === 'undefined') return;

  try {
    sessionStorage.removeItem(SESSION_ID_KEY);
    sessionStorage.removeItem(SESSION_START_KEY);
  } catch {
    // 무시
  }
}

/**
 * 세션 시작 시간 가져오기
 */
export function getSessionStartTime(): number | null {
  if (typeof window === 'undefined') return null;

  try {
    const sessionStart = sessionStorage.getItem(SESSION_START_KEY);
    return sessionStart ? parseInt(sessionStart, 10) : null;
  } catch {
    return null;
  }
}

/**
 * 세션 지속 시간 (초)
 */
export function getSessionDuration(): number {
  const startTime = getSessionStartTime();
  if (!startTime) return 0;
  return Math.floor((Date.now() - startTime) / 1000);
}

/**
 * 디바이스 타입 감지
 */
export function detectDeviceType(): 'mobile' | 'tablet' | 'desktop' {
  if (typeof window === 'undefined') return 'desktop';

  const userAgent = navigator.userAgent.toLowerCase();
  const width = window.innerWidth;

  // 모바일 UA 패턴
  const mobilePatterns = /android|webos|iphone|ipod|blackberry|iemobile|opera mini/i;
  // 태블릿 UA 패턴
  const tabletPatterns = /ipad|tablet|playbook|silk/i;

  if (tabletPatterns.test(userAgent) || (width >= 768 && width < 1024)) {
    return 'tablet';
  }

  if (mobilePatterns.test(userAgent) || width < 768) {
    return 'mobile';
  }

  return 'desktop';
}

/**
 * 브라우저 감지
 */
export function detectBrowser(): string {
  if (typeof window === 'undefined') return 'unknown';

  const userAgent = navigator.userAgent;

  if (userAgent.includes('Firefox')) return 'Firefox';
  if (userAgent.includes('SamsungBrowser')) return 'Samsung';
  if (userAgent.includes('Opera') || userAgent.includes('OPR')) return 'Opera';
  if (userAgent.includes('Edge')) return 'Edge';
  if (userAgent.includes('Chrome')) return 'Chrome';
  if (userAgent.includes('Safari')) return 'Safari';

  return 'Other';
}

/**
 * OS 감지
 */
export function detectOS(): string {
  if (typeof window === 'undefined') return 'unknown';

  const userAgent = navigator.userAgent;

  // Android UA에 'Linux'가 포함되므로 Android를 먼저 체크
  if (userAgent.includes('Android')) return 'Android';
  if (userAgent.includes('Windows')) return 'Windows';
  if (userAgent.includes('Mac OS')) return 'macOS';
  if (userAgent.includes('iOS') || userAgent.includes('iPhone') || userAgent.includes('iPad')) {
    return 'iOS';
  }
  if (userAgent.includes('Linux')) return 'Linux';

  return 'Other';
}
