/**
 * 피부 일기 Repository 테스트
 *
 * @module tests/lib/skin-diary/diary-repository
 * @description getDiaryEntries, getCalendarMonth, saveDiaryNote, deleteDiaryNote 테스트
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  getDiaryEntries,
  getCalendarMonth,
  saveDiaryNote,
  deleteDiaryNote,
} from '@/lib/skin-diary/diary-repository';
import type { DiaryNote } from '@/lib/skin-diary/types';

// ============================================
// Supabase Mock 헬퍼
// ============================================

/**
 * 체이닝 가능한 Supabase 클라이언트 Mock 생성
 * from().select().eq().gte().lte().order() 패턴 지원
 */
function createMockSupabase(overrides?: {
  assessmentsResult?: { data: unknown[] | null; error: unknown | null };
  notesResult?: { data: unknown[] | null; error: unknown | null };
  upsertResult?: { error: unknown | null };
  deleteResult?: { error: unknown | null };
}) {
  const defaults = {
    assessmentsResult: { data: [], error: null },
    notesResult: { data: [], error: null },
    upsertResult: { error: null },
    deleteResult: { error: null },
  };
  const config = { ...defaults, ...overrides };

  // 테이블별로 다른 결과를 반환하도록 구성
  const createChain = (tableName: string) => {
    let resolvedResult = { data: [] as unknown[], error: null as unknown };
    if (tableName === 'skin_assessments') {
      resolvedResult = config.assessmentsResult;
    } else if (tableName === 'skin_diary_notes') {
      resolvedResult = config.notesResult;
    }

    const chain: Record<string, ReturnType<typeof vi.fn>> = {
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      gte: vi.fn().mockReturnThis(),
      lte: vi.fn().mockReturnThis(),
      order: vi.fn().mockResolvedValue(resolvedResult),
      upsert: vi.fn().mockResolvedValue(config.upsertResult),
      delete: vi.fn().mockReturnThis(),
    };

    // select 체인: select → eq → gte → lte → order (resolve)
    chain.select.mockReturnValue(chain);
    chain.eq.mockReturnValue(chain);
    chain.gte.mockReturnValue(chain);
    chain.lte.mockReturnValue(chain);

    // delete 체인: delete → eq → eq (resolve)
    // delete().eq().eq() 마지막 eq가 결과를 반환
    let deleteEqCount = 0;
    const deleteEq = vi.fn().mockImplementation(() => {
      deleteEqCount++;
      if (deleteEqCount >= 2) {
        deleteEqCount = 0;
        return Promise.resolve(config.deleteResult);
      }
      return { eq: deleteEq };
    });
    chain.delete.mockReturnValue({ eq: deleteEq });

    return chain;
  };

  const supabase = {
    from: vi.fn().mockImplementation((table: string) => createChain(table)),
  };

  return supabase as unknown as Parameters<typeof getDiaryEntries>[0];
}

// ============================================
// 테스트 데이터
// ============================================

const TEST_USER_ID = 'user_test_123';

function createAssessmentRow(
  overrides: Partial<{
    id: string;
    created_at: string;
    scores: Record<string, unknown> | null;
    concerns: string[] | null;
    skin_type: string | null;
  }> = {}
) {
  const defaults = {
    id: `assessment-${Math.random().toString(36).slice(2, 8)}`,
    created_at: '2026-03-10T09:00:00Z',
    scores: {
      vitalityScore: 72,
      vitalityGrade: 'B',
      scoreBreakdown: {
        hydration: 65,
        elasticity: 70,
        clarity: 75,
        tone: 68,
      },
    } as Record<string, unknown> | null,
    concerns: ['건조함', '모공'] as string[] | null,
    skin_type: 'combination' as string | null,
  };
  // Object.assign으로 null 값도 올바르게 오버라이드
  return { ...defaults, ...overrides };
}

// ============================================
// getDiaryEntries
// ============================================

describe('getDiaryEntries', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    // console.error, console.warn 억제
    vi.spyOn(console, 'error').mockImplementation(() => {});
    vi.spyOn(console, 'warn').mockImplementation(() => {});
  });

  describe('정상 케이스', () => {
    it('7d 기간 엔트리를 반환한다', async () => {
      const row = createAssessmentRow({
        id: 'a1',
        created_at: '2026-03-10T09:00:00Z',
      });
      const supabase = createMockSupabase({
        assessmentsResult: { data: [row], error: null },
      });

      const entries = await getDiaryEntries(supabase, TEST_USER_ID, '7d');

      expect(entries).toHaveLength(1);
      expect(entries[0].id).toBe('a1');
      expect(entries[0].date).toBe('2026-03-10');
      expect(supabase.from).toHaveBeenCalledWith('skin_assessments');
    });

    it('30d 기간 엔트리를 반환한다', async () => {
      const rows = [
        createAssessmentRow({ id: 'a1', created_at: '2026-03-10T09:00:00Z' }),
        createAssessmentRow({ id: 'a2', created_at: '2026-02-20T09:00:00Z' }),
      ];
      const supabase = createMockSupabase({
        assessmentsResult: { data: rows, error: null },
      });

      const entries = await getDiaryEntries(supabase, TEST_USER_ID, '30d');

      expect(entries).toHaveLength(2);
    });

    it('90d 기간 엔트리를 반환한다', async () => {
      const rows = [
        createAssessmentRow({ id: 'a1', created_at: '2026-03-10T09:00:00Z' }),
        createAssessmentRow({ id: 'a2', created_at: '2026-01-15T09:00:00Z' }),
        createAssessmentRow({ id: 'a3', created_at: '2026-01-01T09:00:00Z' }),
      ];
      const supabase = createMockSupabase({
        assessmentsResult: { data: rows, error: null },
      });

      const entries = await getDiaryEntries(supabase, TEST_USER_ID, '90d');

      expect(entries).toHaveLength(3);
    });

    it('분석 결과를 DiaryEntry로 올바르게 매핑한다', async () => {
      const row = createAssessmentRow({
        id: 'mapping-test',
        created_at: '2026-03-08T14:30:00Z',
        scores: {
          vitalityScore: 85,
          vitalityGrade: 'A',
          scoreBreakdown: {
            hydration: 80,
            elasticity: 90,
            clarity: 85,
            tone: 82,
          },
        },
        concerns: ['잔주름'],
        skin_type: 'dry',
      });
      const supabase = createMockSupabase({
        assessmentsResult: { data: [row], error: null },
      });

      const entries = await getDiaryEntries(supabase, TEST_USER_ID, '7d');

      expect(entries[0]).toEqual(
        expect.objectContaining({
          id: 'mapping-test',
          date: '2026-03-08',
          vitalityScore: 85,
          vitalityGrade: 'A',
          scoreBreakdown: {
            hydration: 80,
            elasticity: 90,
            clarity: 85,
            tone: 82,
          },
          primaryConcerns: ['잔주름'],
          skinType: 'dry',
        })
      );
    });

    it('scores가 null인 경우 기본값으로 매핑한다', async () => {
      const row = createAssessmentRow({
        scores: null as unknown as Record<string, unknown>,
        concerns: null as unknown as string[],
        skin_type: null as unknown as string,
      });
      const supabase = createMockSupabase({
        assessmentsResult: { data: [row], error: null },
      });

      const entries = await getDiaryEntries(supabase, TEST_USER_ID, '7d');

      expect(entries[0].vitalityScore).toBe(0);
      expect(entries[0].vitalityGrade).toBe('D');
      expect(entries[0].scoreBreakdown).toEqual({
        hydration: 0,
        elasticity: 0,
        clarity: 0,
        tone: 0,
      });
      expect(entries[0].primaryConcerns).toEqual([]);
      expect(entries[0].skinType).toBe('unknown');
    });
  });

  describe('빈 결과', () => {
    it('데이터가 없으면 빈 배열을 반환한다', async () => {
      const supabase = createMockSupabase({
        assessmentsResult: { data: [], error: null },
      });

      const entries = await getDiaryEntries(supabase, TEST_USER_ID, '7d');

      expect(entries).toEqual([]);
    });

    it('data가 null이면 빈 배열을 반환한다', async () => {
      const supabase = createMockSupabase({
        assessmentsResult: { data: null, error: null },
      });

      const entries = await getDiaryEntries(supabase, TEST_USER_ID, '30d');

      expect(entries).toEqual([]);
    });
  });

  describe('에러 케이스', () => {
    it('Supabase 에러 시 빈 배열을 반환한다', async () => {
      const supabase = createMockSupabase({
        assessmentsResult: {
          data: null,
          error: { message: 'Table not found', code: '42P01' },
        },
      });

      const entries = await getDiaryEntries(supabase, TEST_USER_ID, '7d');

      expect(entries).toEqual([]);
      expect(console.error).toHaveBeenCalled();
    });
  });
});

// ============================================
// getCalendarMonth
// ============================================

describe('getCalendarMonth', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    vi.spyOn(console, 'error').mockImplementation(() => {});
    vi.spyOn(console, 'warn').mockImplementation(() => {});
  });

  describe('정상 케이스', () => {
    it('해당 월의 올바른 일수를 반환한다 (1월: 31일)', async () => {
      const supabase = createMockSupabase();

      const result = await getCalendarMonth(supabase, TEST_USER_ID, 2026, 1);

      expect(result.year).toBe(2026);
      expect(result.month).toBe(1);
      expect(result.days).toHaveLength(31);
      expect(result.days[0].date).toBe('2026-01-01');
      expect(result.days[30].date).toBe('2026-01-31');
    });

    it('2월의 올바른 일수를 반환한다 (28일, 평년)', async () => {
      const supabase = createMockSupabase();

      const result = await getCalendarMonth(supabase, TEST_USER_ID, 2026, 2);

      expect(result.days).toHaveLength(28);
      expect(result.days[27].date).toBe('2026-02-28');
    });

    it('분석이 있는 날짜를 올바르게 표시한다', async () => {
      const assessments = [
        {
          created_at: '2026-03-05T10:00:00Z',
          scores: { vitalityScore: 80, vitalityGrade: 'A' },
        },
        {
          created_at: '2026-03-15T14:00:00Z',
          scores: { vitalityScore: 65, vitalityGrade: 'B' },
        },
      ];
      const supabase = createMockSupabase({
        assessmentsResult: { data: assessments, error: null },
      });

      const result = await getCalendarMonth(supabase, TEST_USER_ID, 2026, 3);

      // 3월 5일 (인덱스 4)
      const day5 = result.days.find((d) => d.date === '2026-03-05');
      expect(day5?.hasAssessment).toBe(true);
      expect(day5?.vitalityGrade).toBe('A');

      // 3월 15일 (인덱스 14)
      const day15 = result.days.find((d) => d.date === '2026-03-15');
      expect(day15?.hasAssessment).toBe(true);
      expect(day15?.vitalityGrade).toBe('B');

      // 3월 1일은 분석 없음
      const day1 = result.days.find((d) => d.date === '2026-03-01');
      expect(day1?.hasAssessment).toBe(false);
    });

    it('assessmentCount와 averageScore를 올바르게 계산한다', async () => {
      const assessments = [
        {
          created_at: '2026-03-05T10:00:00Z',
          scores: { vitalityScore: 80, vitalityGrade: 'A' },
        },
        {
          created_at: '2026-03-10T10:00:00Z',
          scores: { vitalityScore: 60, vitalityGrade: 'B' },
        },
      ];
      const supabase = createMockSupabase({
        assessmentsResult: { data: assessments, error: null },
      });

      const result = await getCalendarMonth(supabase, TEST_USER_ID, 2026, 3);

      expect(result.assessmentCount).toBe(2);
      // (80 + 60) / 2 = 70
      expect(result.averageScore).toBe(70);
    });

    it('날짜 형식이 YYYY-MM-DD 패딩을 포함한다', async () => {
      const supabase = createMockSupabase();

      const result = await getCalendarMonth(supabase, TEST_USER_ID, 2026, 3);

      // 한 자리 일자가 0-패딩
      expect(result.days[0].date).toBe('2026-03-01');
      expect(result.days[8].date).toBe('2026-03-09');
    });
  });

  describe('분석 없는 월', () => {
    it('분석이 없으면 모든 날이 hasAssessment: false이다', async () => {
      const supabase = createMockSupabase({
        assessmentsResult: { data: [], error: null },
      });

      const result = await getCalendarMonth(supabase, TEST_USER_ID, 2026, 4);

      expect(result.days.every((d) => d.hasAssessment === false)).toBe(true);
      expect(result.assessmentCount).toBe(0);
      expect(result.averageScore).toBe(0);
    });

    it('assessments가 null이면 기본값으로 처리한다', async () => {
      const supabase = createMockSupabase({
        assessmentsResult: { data: null, error: null },
      });

      const result = await getCalendarMonth(supabase, TEST_USER_ID, 2026, 5);

      expect(result.days).toHaveLength(31);
      expect(result.assessmentCount).toBe(0);
      expect(result.averageScore).toBe(0);
    });
  });
});

// ============================================
// saveDiaryNote
// ============================================

describe('saveDiaryNote', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    vi.spyOn(console, 'error').mockImplementation(() => {});
    vi.spyOn(console, 'warn').mockImplementation(() => {});
  });

  const validNote: DiaryNote = {
    conditionEmoji: '😊',
    text: '오늘 피부 컨디션 좋다!',
  };

  describe('정상 케이스', () => {
    it('유효한 메모를 성공적으로 저장한다', async () => {
      const supabase = createMockSupabase({
        upsertResult: { error: null },
      });

      const result = await saveDiaryNote(supabase, TEST_USER_ID, '2026-03-12', validNote);

      expect(result).toEqual({ success: true });
      expect(supabase.from).toHaveBeenCalledWith('skin_diary_notes');
    });

    it('빈 텍스트 메모도 저장할 수 있다', async () => {
      const supabase = createMockSupabase({
        upsertResult: { error: null },
      });
      const emptyNote: DiaryNote = { conditionEmoji: '😐', text: '' };

      const result = await saveDiaryNote(supabase, TEST_USER_ID, '2026-03-12', emptyNote);

      expect(result.success).toBe(true);
    });

    it('200자 메모를 저장할 수 있다', async () => {
      const supabase = createMockSupabase({
        upsertResult: { error: null },
      });
      const maxNote: DiaryNote = {
        conditionEmoji: '🙂',
        text: 'A'.repeat(200),
      };

      const result = await saveDiaryNote(supabase, TEST_USER_ID, '2026-03-12', maxNote);

      expect(result.success).toBe(true);
    });
  });

  describe('유효성 검증', () => {
    it('201자 이상 메모는 거부한다', async () => {
      const supabase = createMockSupabase();
      const longNote: DiaryNote = {
        conditionEmoji: '😟',
        text: 'A'.repeat(201),
      };

      const result = await saveDiaryNote(supabase, TEST_USER_ID, '2026-03-12', longNote);

      expect(result.success).toBe(false);
      expect(result.error).toBe('메모는 200자까지 입력할 수 있어요');
      // Supabase 호출이 발생하지 않아야 한다
      expect(supabase.from).not.toHaveBeenCalledWith('skin_diary_notes');
    });
  });

  describe('에러 케이스', () => {
    it('Supabase upsert 에러 시 실패를 반환한다', async () => {
      const supabase = createMockSupabase({
        upsertResult: {
          error: { message: 'Unique constraint violation', code: '23505' },
        },
      });

      const result = await saveDiaryNote(supabase, TEST_USER_ID, '2026-03-12', validNote);

      expect(result.success).toBe(false);
      expect(result.error).toBe('메모 저장에 실패했어요');
      expect(console.error).toHaveBeenCalled();
    });
  });
});

// ============================================
// deleteDiaryNote
// ============================================

describe('deleteDiaryNote', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    vi.spyOn(console, 'error').mockImplementation(() => {});
    vi.spyOn(console, 'warn').mockImplementation(() => {});
  });

  describe('정상 케이스', () => {
    it('메모를 성공적으로 삭제한다', async () => {
      const supabase = createMockSupabase({
        deleteResult: { error: null },
      });

      const result = await deleteDiaryNote(supabase, TEST_USER_ID, '2026-03-12');

      expect(result).toEqual({ success: true });
      expect(supabase.from).toHaveBeenCalledWith('skin_diary_notes');
    });
  });

  describe('에러 케이스', () => {
    it('Supabase 삭제 에러 시 실패를 반환한다', async () => {
      const supabase = createMockSupabase({
        deleteResult: {
          error: { message: 'Permission denied', code: '42501' },
        },
      });

      const result = await deleteDiaryNote(supabase, TEST_USER_ID, '2026-03-12');

      expect(result).toEqual({ success: false });
      expect(console.error).toHaveBeenCalled();
    });
  });
});
