/**
 * composeBriefing 규칙 전수 검증 (ADR-114 결정 4 · 정직성 가드)
 *
 * 이 테스트가 브리핑 화법의 본체다:
 *  - 데이터 없음 → 관찰/조언 생략(일반론 채움 금지)
 *  - 관찰엔 근거 수치(±점)/대상명 동반
 *  - 관찰 우선순위: 피부 추이 > 제품함 후속 > 최근 분석 경과
 *  - 시간대별 인사 · 이름 생략형
 *  - 금지 표현(치료·보장·사라져) 필터
 */

import { describe, it, expect } from 'vitest';
import {
  composeBriefing,
  getTimeSlot,
  TONE_GUIDE,
  ratingToFeedback,
  SHELF_FEEDBACK_RATING,
} from '@/lib/briefing';

// 특정 시각의 Date 생성 헬퍼 (로컬 시간 기준)
function at(hour: number): Date {
  return new Date(2026, 6, 9, hour, 0, 0);
}

describe('getTimeSlot', () => {
  it('시간대를 아침/오후/저녁/밤으로 구분한다', () => {
    expect(getTimeSlot(6)).toBe('morning');
    expect(getTimeSlot(11)).toBe('morning');
    expect(getTimeSlot(12)).toBe('afternoon');
    expect(getTimeSlot(17)).toBe('afternoon');
    expect(getTimeSlot(18)).toBe('evening');
    expect(getTimeSlot(21)).toBe('evening');
    expect(getTimeSlot(22)).toBe('night');
    expect(getTimeSlot(3)).toBe('night');
  });
});

describe('composeBriefing — 인사', () => {
  it('이름이 있으면 "○○님" 형태로 인사한다', () => {
    const b = composeBriefing({ userName: '지민', now: at(9) });
    expect(b.greeting).toContain('지민님');
    expect(b.greeting).toContain('좋은 아침');
  });

  it('이름이 없으면 이름 생략형으로 인사한다', () => {
    const b = composeBriefing({ now: at(9) });
    expect(b.greeting).not.toContain('님');
    expect(b.greeting).toBe('좋은 아침이에요');
  });

  it('공백뿐인 이름은 생략한다', () => {
    const b = composeBriefing({ userName: '   ', now: at(9) });
    expect(b.greeting).not.toContain('님');
  });

  it('시간대별 인사가 다르다', () => {
    expect(composeBriefing({ now: at(9) }).greeting).toContain('아침');
    expect(composeBriefing({ now: at(14) }).greeting).toContain('오후');
    expect(composeBriefing({ now: at(20) }).greeting).toContain('저녁');
    expect(composeBriefing({ now: at(23) }).greeting).toContain('고생');
  });
});

describe('composeBriefing — 정직성 가드(일반론 금지)', () => {
  it('아무 데이터도 없으면 관찰을 생략하고 조언은 빈 배열이다', () => {
    const b = composeBriefing({ userName: '지민', now: at(9) });
    expect(b.observation).toBeUndefined();
    expect(b.advice).toEqual([]);
    // 프레이밍(인사/맺음말)은 항상 존재
    expect(b.greeting).toBeTruthy();
    expect(b.closing).toBeTruthy();
  });

  it('금지 표현이 담긴 조언은 걸러낸다', () => {
    const b = composeBriefing({
      now: at(9),
      capsulePriority: { name: '보습 크림', reason: '3일이면 여드름이 사라져요' },
      weatherTip: '자외선이 강해요, 선크림 챙겨봐요',
    });
    // "사라져"가 든 캡슐 조언은 제거, 깨끗한 날씨 팁만 남음
    expect(b.advice).toEqual(['자외선이 강해요, 선크림 챙겨봐요']);
    b.advice.forEach((line) => {
      TONE_GUIDE.forbidden.forEach((word) => expect(line).not.toContain(word));
    });
  });
});

describe('composeBriefing — 관찰 우선순위 및 근거 수치', () => {
  it('피부 추이가 있으면 최우선으로 관찰한다(근거 수치 +점 동반)', () => {
    const b = composeBriefing({
      now: at(9),
      skinTrend: { direction: 'up', delta: 2, daysSinceLast: 1 },
      recentProduct: { name: '토너' },
      lastAnalysisDaysAgo: 10,
    });
    expect(b.observation).toContain('피부');
    expect(b.observation).toContain('+2점');
    expect(b.observation).toContain('어제'); // daysSinceLast 1 → 어제
    // 제품/경과 관찰이 아닌 피부 관찰이어야 함
    expect(b.observation).not.toContain('토너');
  });

  it('하락 추이도 근거 수치(-점)를 동반한다', () => {
    const b = composeBriefing({
      now: at(9),
      skinTrend: { direction: 'down', delta: -3, daysSinceLast: 2 },
    });
    expect(b.observation).toContain('-3점');
    expect(b.observation).toContain('2일 전');
  });

  it('유지(flat)는 ±0점을 명시한다', () => {
    const b = composeBriefing({
      now: at(9),
      skinTrend: { direction: 'flat', delta: 0 },
    });
    expect(b.observation).toContain('±0점');
  });

  it('피부 추이가 없으면 제품함 후속을 관찰한다(대상명 동반)', () => {
    const b = composeBriefing({
      now: at(9),
      recentProduct: { name: '수분 앰플' },
      lastAnalysisDaysAgo: 10,
    });
    expect(b.observation).toContain('수분 앰플');
  });

  it('피부·제품이 없고 분석이 오래됐을 때만 경과 관찰을 낸다(근거 N일 동반)', () => {
    const b = composeBriefing({ now: at(9), lastAnalysisDaysAgo: 5 });
    expect(b.observation).toContain('5일');
  });

  it('최근에 분석했으면(임계 미만) 경과 관찰을 생략한다', () => {
    const b = composeBriefing({ now: at(9), lastAnalysisDaysAgo: 1 });
    expect(b.observation).toBeUndefined();
  });
});

describe('제품함 후속 폐루프 v1 — rating ↔ 응답 매핑', () => {
  it('rating 4~5는 긍정, 1~3은 부정, 그 외(null·NaN·범위밖)는 미응답으로 해석한다', () => {
    expect(ratingToFeedback(5)).toBe('positive');
    expect(ratingToFeedback(4)).toBe('positive');
    expect(ratingToFeedback(3)).toBe('negative');
    expect(ratingToFeedback(2)).toBe('negative');
    expect(ratingToFeedback(1)).toBe('negative');
    expect(ratingToFeedback(null)).toBeNull();
    expect(ratingToFeedback(undefined)).toBeNull();
    expect(ratingToFeedback(0)).toBeNull();
    expect(ratingToFeedback(NaN)).toBeNull();
  });

  // 재발 방지: 저장 값이 DB 제약(rating INTEGER CHECK 1..5)을 벗어나면 응답이 통째로 유실된다
  it('저장에 쓰는 rating 값은 DB 제약(1~5) 안이고, 매핑과 왕복 일치한다', () => {
    expect(SHELF_FEEDBACK_RATING.positive).toBeGreaterThanOrEqual(1);
    expect(SHELF_FEEDBACK_RATING.positive).toBeLessThanOrEqual(5);
    expect(SHELF_FEEDBACK_RATING.negative).toBeGreaterThanOrEqual(1);
    expect(SHELF_FEEDBACK_RATING.negative).toBeLessThanOrEqual(5);
    expect(Number.isInteger(SHELF_FEEDBACK_RATING.positive)).toBe(true);
    expect(Number.isInteger(SHELF_FEEDBACK_RATING.negative)).toBe(true);
    // 저장한 값을 다시 해석하면 같은 응답으로 돌아와야 한다(왕복 무결)
    expect(ratingToFeedback(SHELF_FEEDBACK_RATING.positive)).toBe('positive');
    expect(ratingToFeedback(SHELF_FEEDBACK_RATING.negative)).toBe('negative');
  });
});

describe('제품함 후속 폐루프 v1 — 관찰 분기(미응답 질문 / 긍정·부정 회고)', () => {
  it('미응답이고 shelfItemId가 있으면 다시 묻고, 응답 버튼용 후속 정보를 낸다', () => {
    const b = composeBriefing({
      now: at(9),
      recentProduct: { name: '수분 앰플', shelfItemId: 'shelf-1' },
    });
    expect(b.observation).toContain('수분 앰플');
    expect(b.observation).toContain('잘 맞고 있어요?');
    // 재발 방지: 후속 질문은 반드시 "답할 수단"(shelfFollowup)을 동반한다(죽은 질문 금지)
    expect(b.shelfFollowup).toEqual({ shelfItemId: 'shelf-1', productName: '수분 앰플' });
  });

  it('미응답이어도 shelfItemId가 없으면 후속 정보를 내지 않는다(하위호환)', () => {
    const b = composeBriefing({ now: at(9), recentProduct: { name: '수분 앰플' } });
    expect(b.observation).toContain('잘 맞고 있어요?');
    expect(b.shelfFollowup).toBeUndefined();
  });

  it('긍정 응답이면 그 답을 기억해 회고하고, 후속 질문(버튼)은 내지 않는다', () => {
    const b = composeBriefing({
      now: at(9),
      recentProduct: { name: '수분 앰플', shelfItemId: 'shelf-1', feedback: 'positive' },
    });
    expect(b.observation).toContain('수분 앰플');
    expect(b.observation).toContain('잘 맞는다고');
    // 재발 방지(정직성): 오늘 루틴 배치 여부는 입력에 없어 알 수 없음 →
    // "루틴에 넣어뒀어요" 같은 단정을 하지 않고 중립 권유로만 회고한다
    expect(b.observation).not.toContain('루틴');
    expect(b.observation).toContain('챙겨');
    expect(b.observation).not.toContain('잘 맞고 있어요?'); // 재질문 아님
    expect(b.shelfFollowup).toBeUndefined();
  });

  it('부정 응답이고 대안이 없으면 정직한 재탐색 안내를 낸다(제품명 지어내지 않음)', () => {
    const b = composeBriefing({
      now: at(9),
      recentProduct: {
        name: '수분 앰플',
        shelfItemId: 'shelf-1',
        feedback: 'negative',
        feedbackDaysAgo: 3,
      },
    });
    expect(b.observation).toContain('수분 앰플');
    expect(b.observation).toContain('잘 안 맞는다고');
    expect(b.observation).toContain('다른 제품');
    expect(b.observation).toContain('3일 전'); // 근거 경과일
    // 재발 방지: 3일 전 응답을 "어제"라 말하지 않는다(정직성)
    expect(b.observation).not.toContain('어제');
    expect(b.shelfFollowup).toBeUndefined();
  });

  it('부정 응답이고 대안이 주입되면 대안을 함께 제시한다', () => {
    const b = composeBriefing({
      now: at(9),
      recentProduct: {
        name: '수분 앰플',
        feedback: 'negative',
        feedbackDaysAgo: 1,
        alternativeName: '세라마이드 크림',
      },
    });
    expect(b.observation).toContain('어제'); // feedbackDaysAgo 1 → 어제
    expect(b.observation).toContain('대신 세라마이드 크림');
    expect(b.shelfFollowup).toBeUndefined();
  });

  it('피부 추이가 있으면 제품함 응답보다 우선하고, 후속 질문(버튼)도 내지 않는다', () => {
    const b = composeBriefing({
      now: at(9),
      skinTrend: { direction: 'up', delta: 2, daysSinceLast: 1 },
      recentProduct: { name: '수분 앰플', shelfItemId: 'shelf-1' },
    });
    expect(b.observation).toContain('피부');
    expect(b.observation).not.toContain('수분 앰플');
    expect(b.shelfFollowup).toBeUndefined();
  });
});

describe('composeBriefing — 조언', () => {
  it('캡슐 우선 항목과 날씨 팁에서 조언을 만든다', () => {
    const b = composeBriefing({
      now: at(9),
      capsulePriority: { name: '수분 크림', reason: '건조한 날씨' },
      weatherTip: '습도가 낮아요, 보습 챙겨봐요',
    });
    expect(b.advice).toHaveLength(2);
    expect(b.advice[0]).toContain('수분 크림');
    expect(b.advice[0]).toContain('챙겨봐요'); // 권유 어미
    expect(b.advice[1]).toContain('습도');
  });

  it('조언은 최대 2개로 제한한다', () => {
    const b = composeBriefing({
      now: at(9),
      capsulePriority: { name: 'A', reason: 'r' },
      weatherTip: '자외선 주의',
    });
    expect(b.advice.length).toBeLessThanOrEqual(2);
  });
});

describe('composeBriefing — 맺음말', () => {
  it('저녁/밤에는 수고를 격려하는 맺음말을 낸다', () => {
    expect(composeBriefing({ now: at(20) }).closing).toContain('수고');
    expect(composeBriefing({ now: at(9) }).closing).toContain('도울게요');
  });
});
