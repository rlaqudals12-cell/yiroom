/**
 * 복귀자 환영 메시지 로직
 *
 * @module lib/engagement/welcome-back
 * @description last_active 기반 부재 기간 계산 + 환영 메시지 생성
 */

export interface WelcomeBackMessage {
  /** 메시지 제목 */
  title: string;
  /** 메시지 본문 */
  description: string;
  /** 부재 기간 (일) */
  absentDays: number;
  /** CTA 텍스트 (선택) */
  ctaText?: string;
  /** CTA 링크 (선택) */
  ctaHref?: string;
}

/** 부재 기간 분류 */
type AbsenceLevel = 'short' | 'medium' | 'long';

function classifyAbsence(days: number): AbsenceLevel | null {
  if (days < 3) return null; // 3일 미만은 환영 메시지 불필요
  if (days < 7) return 'short';
  if (days < 14) return 'medium';
  return 'long';
}

/**
 * 부재 일수 계산
 */
export function calculateAbsentDays(lastActiveAt: string | Date | null): number {
  if (!lastActiveAt) return 0;

  const lastActive = typeof lastActiveAt === 'string' ? new Date(lastActiveAt) : lastActiveAt;
  const now = new Date();
  const diffMs = now.getTime() - lastActive.getTime();
  return Math.floor(diffMs / (1000 * 60 * 60 * 24));
}

/**
 * 환영 메시지 생성
 *
 * @param lastActiveAt - 마지막 활동 시간
 * @param newInsightCount - 부재 중 생성된 인사이트 수 (선택)
 * @returns 환영 메시지 또는 null (3일 미만 부재 시)
 */
export function generateWelcomeBackMessage(
  lastActiveAt: string | Date | null,
  newInsightCount: number = 0
): WelcomeBackMessage | null {
  const absentDays = calculateAbsentDays(lastActiveAt);
  const level = classifyAbsence(absentDays);

  if (!level) return null;

  switch (level) {
    case 'short':
      return {
        title: '다시 오셨네요!',
        description:
          newInsightCount > 0
            ? `그동안 새로운 인사이트가 ${newInsightCount}개 쌓였어요`
            : `${absentDays}일 만이에요. 오늘의 루틴을 확인해보세요`,
        absentDays,
      };

    case 'medium':
      return {
        title: `${absentDays}일 만에 돌아오셨군요!`,
        description: '오랜만에 내 상태를 다시 확인해보세요',
        absentDays,
        // 배너가 홈에 표시되므로 /dashboard(자기 자신) 대신 통합 분석으로 유도 (ADR-111)
        ctaText: '다시 분석하기',
        ctaHref: '/analysis/integrated',
      };

    case 'long':
      return {
        title: '오랜만이에요! 보고 싶었어요',
        description: '지난번 분석 이후 피부 변화를 확인해보세요',
        absentDays,
        ctaText: '다시 분석하기',
        ctaHref: '/analysis/skin',
      };
  }
}

/** localStorage 키 */
const DISMISS_KEY = 'yiroom-welcome-back-dismissed';
const PERMANENT_DISMISS_KEY = 'yiroom-welcome-back-permanent';

/** 닫기 여부 확인 (영구 또는 24시간) */
export function isDismissed(): boolean {
  try {
    // 영구 닫기 확인
    if (localStorage.getItem(PERMANENT_DISMISS_KEY) === 'true') return true;

    const dismissed = localStorage.getItem(DISMISS_KEY);
    if (!dismissed) return false;
    const dismissedAt = new Date(dismissed).getTime();
    const now = Date.now();
    // 24시간 경과 시 자동 해제
    return now - dismissedAt < 24 * 60 * 60 * 1000;
  } catch {
    return false;
  }
}

/** 닫기 기록 (24시간) */
export function dismissWelcomeBack(): void {
  try {
    localStorage.setItem(DISMISS_KEY, new Date().toISOString());
  } catch {
    /* 저장 실패 무시 */
  }
}

/** 영구 닫기 */
export function dismissWelcomeBackPermanently(): void {
  try {
    localStorage.setItem(PERMANENT_DISMISS_KEY, 'true');
  } catch {
    /* 저장 실패 무시 */
  }
}
