/**
 * DB 저장 + 합성 응답 폴백 헬퍼
 *
 * @see ADR-068 분석 API DB 저장 실패 시 합성 응답
 * @see ADR-085
 */

import type { DBSaveResult } from './types';

/**
 * DB 저장 시도, 실패 시 합성 ID로 폴백 (분석 결과 유실 방지)
 *
 * @param saveOp - DB 저장 함수 (성공 시 저장된 row 반환)
 * @param syntheticFactory - DB 실패 시 합성 응답 생성 함수
 * @returns 저장된 데이터 + 실패 여부
 *
 * @example
 * const { data, dbSaveFailed } = await saveWithFallback(
 *   async () => {
 *     const { data, error } = await supabase.from('skin_assessments').insert({...}).select().single();
 *     if (error) throw error;
 *     return data;
 *   },
 *   (userId) => ({ id: crypto.randomUUID(), clerk_user_id: userId, created_at: new Date().toISOString() })
 * );
 */
export async function saveWithFallback<T>(
  saveOp: () => Promise<T>,
  syntheticFactory: () => T
): Promise<DBSaveResult<T>> {
  try {
    const data = await saveOp();
    return { data, dbSaveFailed: false };
  } catch (error) {
    console.error('[DB] 저장 실패, 합성 응답 반환:', error);
    return { data: syntheticFactory(), dbSaveFailed: true };
  }
}
