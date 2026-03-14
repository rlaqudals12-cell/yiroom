/**
 * DB 저장 + 합성 응답 폴백 헬퍼 테스트
 * @description lib/api/analysis-helpers/db-save.ts의 saveWithFallback 함수 테스트
 * @see ADR-068, ADR-085
 */
import { describe, it, expect, vi } from 'vitest';
import { saveWithFallback } from '@/lib/api/analysis-helpers/db-save';

describe('saveWithFallback', () => {
  describe('정상 케이스', () => {
    it('DB 저장 성공 시 실제 데이터를 반환한다', async () => {
      const dbRow = { id: 'row-123', clerk_user_id: 'user_1', name: '피부 분석' };
      const { data, dbSaveFailed } = await saveWithFallback(
        async () => dbRow,
        () => ({ id: 'synthetic', clerk_user_id: 'user_1', name: '' })
      );

      expect(data).toEqual(dbRow);
      expect(dbSaveFailed).toBe(false);
    });

    it('DB 저장 성공 시 합성 팩토리를 호출하지 않는다', async () => {
      const syntheticFactory = vi.fn();
      await saveWithFallback(async () => ({ id: '1' }), syntheticFactory);

      expect(syntheticFactory).not.toHaveBeenCalled();
    });

    it('비동기 DB 저장 함수의 resolve 값을 정확히 전달한다', async () => {
      const complexResult = {
        id: 'uuid-abc',
        clerk_user_id: 'user_xyz',
        scores: { hydration: 65, oiliness: 40 },
        created_at: '2026-01-15T10:00:00Z',
      };

      const { data } = await saveWithFallback(
        () => Promise.resolve(complexResult),
        () => ({ id: 'fallback' })
      );

      expect(data).toEqual(complexResult);
      expect((data as typeof complexResult).scores).toEqual({ hydration: 65, oiliness: 40 });
    });

    it('null 데이터도 정상적으로 반환한다', async () => {
      const { data, dbSaveFailed } = await saveWithFallback(
        async () => null,
        () => 'fallback'
      );

      expect(data).toBeNull();
      expect(dbSaveFailed).toBe(false);
    });

    it('빈 객체도 성공으로 처리한다', async () => {
      const { data, dbSaveFailed } = await saveWithFallback(
        async () => ({}),
        () => ({ id: 'synthetic' })
      );

      expect(data).toEqual({});
      expect(dbSaveFailed).toBe(false);
    });
  });

  describe('에러 케이스 (DB 실패 시 합성 폴백)', () => {
    it('DB 저장 실패 시 합성 응답을 반환한다', async () => {
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      const synthetic = { id: 'synth-id', clerk_user_id: 'user_1', created_at: '2026-01-15' };
      const { data, dbSaveFailed } = await saveWithFallback(
        async () => {
          throw new Error('DB connection lost');
        },
        () => synthetic
      );

      expect(data).toEqual(synthetic);
      expect(dbSaveFailed).toBe(true);
      consoleSpy.mockRestore();
    });

    it('DB 저장 실패 시 콘솔에 에러를 출력한다', async () => {
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      const dbError = new Error('PGRST301: relation not found');

      await saveWithFallback(
        async () => {
          throw dbError;
        },
        () => ({ id: 'fallback' })
      );

      expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining('DB'), expect.any(Error));
      consoleSpy.mockRestore();
    });

    it('비동기 에러도 폴백 처리한다', async () => {
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      const { data, dbSaveFailed } = await saveWithFallback(
        () => Promise.reject(new Error('timeout')),
        () => ({ id: 'timeout-fallback' })
      );

      expect(data).toEqual({ id: 'timeout-fallback' });
      expect(dbSaveFailed).toBe(true);
      consoleSpy.mockRestore();
    });

    it('문자열 에러도 폴백 처리한다', async () => {
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      const { dbSaveFailed } = await saveWithFallback(
        async () => {
          throw 'string error';
        },
        () => ({ id: 'fallback' })
      );

      expect(dbSaveFailed).toBe(true);
      consoleSpy.mockRestore();
    });
  });

  describe('엣지 케이스', () => {
    it('합성 팩토리가 복잡한 객체를 반환할 수 있다', async () => {
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      const { data, dbSaveFailed } = await saveWithFallback(
        async () => {
          throw new Error('fail');
        },
        () => ({
          id: crypto.randomUUID(),
          clerk_user_id: 'user_1',
          created_at: new Date().toISOString(),
          nested: { scores: [1, 2, 3] },
        })
      );

      expect(dbSaveFailed).toBe(true);
      expect(data).toHaveProperty('id');
      expect(data).toHaveProperty('nested.scores');
      consoleSpy.mockRestore();
    });

    it('제네릭 타입으로 다양한 데이터 타입을 지원한다', async () => {
      // 숫자 타입
      const numResult = await saveWithFallback(
        async () => 42,
        () => 0
      );
      expect(numResult.data).toBe(42);

      // 문자열 타입
      const strResult = await saveWithFallback(
        async () => 'success',
        () => 'fallback'
      );
      expect(strResult.data).toBe('success');

      // 배열 타입
      const arrResult = await saveWithFallback(
        async () => [1, 2, 3],
        () => [] as number[]
      );
      expect(arrResult.data).toEqual([1, 2, 3]);
    });

    it('saveOp이 지연되어도 정상적으로 동작한다', async () => {
      const { data, dbSaveFailed } = await saveWithFallback(
        () => new Promise((resolve) => setTimeout(() => resolve({ id: 'delayed' }), 10)),
        () => ({ id: 'fallback' })
      );

      expect(data).toEqual({ id: 'delayed' });
      expect(dbSaveFailed).toBe(false);
    });

    it('saveOp과 syntheticFactory가 동일한 타입을 반환한다', async () => {
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      const successResult = await saveWithFallback(
        async () => ({ id: 'real', score: 85 }),
        () => ({ id: 'synthetic', score: 0 })
      );
      const failResult = await saveWithFallback(
        async (): Promise<{ id: string; score: number }> => {
          throw new Error('fail');
        },
        () => ({ id: 'synthetic', score: 0 })
      );

      // 둘 다 같은 shape
      expect(Object.keys(successResult.data)).toEqual(Object.keys(failResult.data));
      consoleSpy.mockRestore();
    });
  });
});
