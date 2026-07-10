/**
 * timezone 유틸 — 서울 기준 시각/날짜 변환 (브리핑·루틴 라우트의 UTC 버그 수리)
 *
 * Vercel(UTC) 서버에서 new Date().getHours()/날짜를 그대로 쓰면 한국 자정 직후
 * "어제 날짜/늦은 밤"이 나온다. Intl 기반 헬퍼가 서울 벽시계로 변환하는지 검증한다.
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { getDateKeyInTimezone, getZonedNow, getCurrentHourInTimezone } from '@/lib/utils/timezone';

describe('timezone helpers (서울 기준 변환)', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    // UTC 16:30 → 서울(UTC+9)은 다음 날 01:30
    vi.setSystemTime(new Date('2026-07-10T16:30:00Z'));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('getDateKeyInTimezone은 서울 기준 날짜(다음 날)를 반환한다', () => {
    expect(getDateKeyInTimezone('Asia/Seoul')).toBe('2026-07-11');
    // 같은 순간이라도 UTC 기준은 여전히 전날 — 서버 UTC 버그를 재현/대비
    expect(getDateKeyInTimezone('UTC')).toBe('2026-07-10');
  });

  it('getCurrentHourInTimezone은 서울 시(01시)를 반환한다', () => {
    expect(getCurrentHourInTimezone('Asia/Seoul')).toBe(1);
  });

  it('getZonedNow의 로컬 게터가 서울 벽시계를 돌려준다', () => {
    const now = getZonedNow('Asia/Seoul');
    expect(now.getFullYear()).toBe(2026);
    expect(now.getMonth()).toBe(6); // July (0-index)
    expect(now.getDate()).toBe(11);
    expect(now.getHours()).toBe(1);
  });
});
