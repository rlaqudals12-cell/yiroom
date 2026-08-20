/**
 * 모바일 Analytics 세션 관리
 *
 * 브라우저용 sessionStorage를 사용하던 복사본을 RN 런타임 세션으로 교체한다.
 * 앱 프로세스가 살아 있는 동안 하나의 세션 ID를 유지하고, 30분 비활동 시 새 세션을 만든다.
 */
import { Dimensions, Platform } from 'react-native';

const SESSION_TIMEOUT_MS = 30 * 60 * 1000;

let currentSessionId: string | null = null;
let sessionStartedAt: number | null = null;
let lastActivityAt: number | null = null;
let fallbackSequence = 0;

/** Hermes에 randomUUID가 없을 때도 충돌 가능성을 낮춘 런타임 세션 ID를 만든다. */
function generateSessionId(): string {
  const webCrypto = (globalThis as { crypto?: { randomUUID?: () => string } }).crypto;
  if (typeof webCrypto?.randomUUID === 'function') {
    return `mobile_${webCrypto.randomUUID()}`;
  }

  fallbackSequence += 1;
  return `mobile_${Date.now().toString(36)}_${fallbackSequence.toString(36)}`;
}

/** 현재 유효한 세션 ID. 없거나 만료됐으면 null이다. */
export function getSessionId(): string | null {
  if (!currentSessionId || lastActivityAt === null) return null;

  if (Date.now() - lastActivityAt > SESSION_TIMEOUT_MS) {
    endSession();
    return null;
  }

  return currentSessionId;
}

/** 현재 세션을 반환하거나 새 앱 세션을 만든다. */
export function getOrCreateSession(): string {
  const existing = getSessionId();
  if (existing) return existing;

  const now = Date.now();
  currentSessionId = generateSessionId();
  sessionStartedAt = now;
  lastActivityAt = now;
  return currentSessionId;
}

/** 이벤트 발생 시 비활동 타이머만 갱신한다. */
export function refreshSession(): void {
  if (getSessionId()) {
    lastActivityAt = Date.now();
  }
}

/** 로그아웃·테스트 종료 등에서 런타임 세션을 명시적으로 끝낸다. */
export function endSession(): void {
  currentSessionId = null;
  sessionStartedAt = null;
  lastActivityAt = null;
}

export function getSessionStartTime(): number | null {
  return sessionStartedAt;
}

export function getSessionDuration(): number {
  if (sessionStartedAt === null) return 0;
  return Math.floor((Date.now() - sessionStartedAt) / 1000);
}

/** RN 화면 폭 기준. 네이티브 앱은 desktop으로 분류하지 않는다. */
export function detectDeviceType(): 'mobile' | 'tablet' | 'desktop' {
  const width = Dimensions.get('window').width;
  if (Platform.OS === 'web' && width >= 1024) return 'desktop';
  return width >= 768 ? 'tablet' : 'mobile';
}

/** 브라우저명이 없는 네이티브 요청은 Expo 런타임으로 명시한다. */
export function detectBrowser(): string {
  return Platform.OS === 'web' ? 'Web' : 'Expo';
}

export function detectOS(): string {
  const labels: Record<string, string> = {
    android: 'Android',
    ios: 'iOS',
    web: 'Web',
    windows: 'Windows',
    macos: 'macOS',
  };
  return labels[Platform.OS] ?? Platform.OS;
}
