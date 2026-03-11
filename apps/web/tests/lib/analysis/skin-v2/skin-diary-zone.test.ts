/**
 * S-2 피부 일기 존별 연동 테스트
 */

import { describe, it, expect } from 'vitest';
import {
  analyzeSkinTrend,
  detectDeteriorationAlerts,
  calculateDiaryStreak,
  createDiaryEntryFromAnalysis,
} from '@/lib/analysis/skin-v2/skin-diary-zone';
import type { SkinDiaryEntry } from '@/lib/analysis/skin-v2/skin-diary-zone';
import type { DetailedZoneId } from '@/types/skin-zones';

// 헬퍼: 일기 엔트리 생성
function makeEntry(
  daysAgo: number,
  vitality: number,
  zoneOverrides: Partial<Record<DetailedZoneId, number>> = {}
): SkinDiaryEntry {
  const date = new Date();
  date.setDate(date.getDate() - daysAgo);
  return {
    date: date.toISOString(),
    vitalityScore: vitality,
    zoneScores: {
      forehead_center: 60,
      cheek_left: 65,
      cheek_right: 65,
      nose_tip: 55,
      chin_center: 60,
      ...zoneOverrides,
    },
  };
}

describe('analyzeSkinTrend', () => {
  it('엔트리 부족하면 안정 트렌드를 반환한다', () => {
    const result = analyzeSkinTrend([makeEntry(0, 70)], 30);
    expect(result.vitalityTrend).toBe('stable');
    expect(result.entryCount).toBe(1);
  });

  it('빈 배열은 안정 트렌드를 반환한다', () => {
    const result = analyzeSkinTrend([], 30);
    expect(result.vitalityTrend).toBe('stable');
    expect(result.entryCount).toBe(0);
  });

  it('바이탈리티 상승 시 improving 트렌드', () => {
    const entries = [makeEntry(20, 50), makeEntry(10, 60), makeEntry(0, 70)];
    const result = analyzeSkinTrend(entries, 30);
    expect(result.vitalityTrend).toBe('improving');
    expect(result.vitalityChange).toBeGreaterThan(0);
  });

  it('바이탈리티 하락 시 worsening 트렌드', () => {
    const entries = [makeEntry(20, 80), makeEntry(10, 70), makeEntry(0, 60)];
    const result = analyzeSkinTrend(entries, 30);
    expect(result.vitalityTrend).toBe('worsening');
    expect(result.vitalityChange).toBeLessThan(0);
  });

  it('존별 트렌드를 분류한다', () => {
    const entries = [
      makeEntry(20, 60, { cheek_left: 40, nose_tip: 70 }),
      makeEntry(10, 65, { cheek_left: 50, nose_tip: 65 }),
      makeEntry(0, 70, { cheek_left: 60, nose_tip: 60 }),
    ];
    const result = analyzeSkinTrend(entries, 30);
    expect(result.improvedZones).toContain('cheek_left');
    expect(result.worsenedZones).toContain('nose_tip');
  });

  it('기간 외 엔트리를 필터링한다', () => {
    const entries = [
      makeEntry(60, 50), // 기간 밖
      makeEntry(5, 60),
      makeEntry(0, 65),
    ];
    const result = analyzeSkinTrend(entries, 7);
    expect(result.entryCount).toBe(2);
  });
});

describe('detectDeteriorationAlerts', () => {
  it('엔트리 부족하면 빈 배열을 반환한다', () => {
    const alerts = detectDeteriorationAlerts([makeEntry(0, 70)]);
    expect(alerts).toHaveLength(0);
  });

  it('급격한 하락 시 알림을 생성한다', () => {
    const entries = [
      makeEntry(15, 80, { cheek_left: 80 }),
      makeEntry(12, 78, { cheek_left: 78 }),
      makeEntry(10, 75, { cheek_left: 75 }),
      makeEntry(8, 70, { cheek_left: 70 }),
      makeEntry(5, 60, { cheek_left: 55 }),
      makeEntry(2, 55, { cheek_left: 50 }),
      makeEntry(0, 50, { cheek_left: 45 }),
    ];
    const alerts = detectDeteriorationAlerts(entries, 3);
    expect(alerts.length).toBeGreaterThan(0);
  });

  it('안정적이면 알림이 없다', () => {
    const entries = Array.from({ length: 10 }, (_, i) => makeEntry(i, 70, { cheek_left: 70 }));
    const alerts = detectDeteriorationAlerts(entries, 3);
    // 모든 존이 안정적이므로 알림 없음
    expect(alerts.length).toBe(0);
  });

  it('심각도 순으로 정렬한다', () => {
    const alerts = detectDeteriorationAlerts(
      [
        makeEntry(20, 90, { cheek_left: 90, nose_tip: 85 }),
        makeEntry(15, 88, { cheek_left: 88, nose_tip: 83 }),
        makeEntry(10, 85, { cheek_left: 85, nose_tip: 80 }),
        makeEntry(8, 80, { cheek_left: 80, nose_tip: 75 }),
        makeEntry(5, 50, { cheek_left: 45, nose_tip: 65 }),
        makeEntry(2, 45, { cheek_left: 40, nose_tip: 60 }),
        makeEntry(0, 40, { cheek_left: 35, nose_tip: 55 }),
      ],
      3
    );
    if (alerts.length >= 2) {
      const severityOrder = { severe: 0, moderate: 1, mild: 2 } as const;
      expect(severityOrder[alerts[0].severity]).toBeLessThanOrEqual(
        severityOrder[alerts[1].severity]
      );
    }
  });
});

describe('calculateDiaryStreak', () => {
  it('빈 배열은 0 스트릭을 반환한다', () => {
    const streak = calculateDiaryStreak([]);
    expect(streak.currentStreak).toBe(0);
    expect(streak.longestStreak).toBe(0);
    expect(streak.thisMonthCount).toBe(0);
  });

  it('오늘 기록이 있으면 현재 스트릭 1이상이다', () => {
    const streak = calculateDiaryStreak([makeEntry(0, 70)]);
    expect(streak.currentStreak).toBeGreaterThanOrEqual(1);
  });

  it('연속 기록의 스트릭을 계산한다', () => {
    const entries = [makeEntry(2, 70), makeEntry(1, 72), makeEntry(0, 75)];
    const streak = calculateDiaryStreak(entries);
    expect(streak.currentStreak).toBe(3);
  });

  it('최장 스트릭을 추적한다', () => {
    const entries = [
      makeEntry(20, 60),
      makeEntry(19, 62),
      makeEntry(18, 64),
      makeEntry(17, 66),
      // 16일 전 빈 날
      makeEntry(1, 70),
      makeEntry(0, 72),
    ];
    const streak = calculateDiaryStreak(entries);
    expect(streak.longestStreak).toBe(4);
    expect(streak.currentStreak).toBe(2);
  });
});

describe('createDiaryEntryFromAnalysis', () => {
  it('분석 결과를 일기 엔트리로 변환한다', () => {
    const zoneScores: Record<DetailedZoneId, number> = {
      forehead_center: 70,
      forehead_left: 65,
      forehead_right: 65,
      eye_left: 60,
      eye_right: 60,
      cheek_left: 75,
      cheek_right: 75,
      nose_bridge: 55,
      nose_tip: 50,
      chin_center: 65,
      chin_left: 60,
      chin_right: 60,
    };
    const entry = createDiaryEntryFromAnalysis(zoneScores, 68, { weather: 'sunny' });
    expect(entry.date).toBeTruthy();
    expect(entry.vitalityScore).toBe(68);
    expect(entry.zoneScores.cheek_left).toBe(75);
    expect(entry.environment?.weather).toBe('sunny');
  });
});
