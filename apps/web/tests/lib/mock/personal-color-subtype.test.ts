/**
 * 12톤 서브타입 복원 헬퍼 테스트
 *
 * @see lib/mock/personal-color.ts resolveSubtype
 */

import { describe, it, expect } from 'vitest';
import { resolveSubtype } from '@/lib/mock/personal-color';

describe('resolveSubtype (12톤 서브타입 복원)', () => {
  it('여름 + mute → 여름 쿨 뮤트 (cool/light) — 하드코딩 "라이트" 오류 해소', () => {
    const s = resolveSubtype('summer', 'mute');
    expect(s).not.toBeNull();
    expect(s?.id).toBe('summer-mute');
    expect(s?.label).toBe('여름 쿨 뮤트');
    expect(s?.tone).toBe('cool');
    expect(s?.depth).toBe('light');
  });

  it('가을 + deep → 가을 웜 딥 (warm/deep)', () => {
    const s = resolveSubtype('autumn', 'deep');
    expect(s?.id).toBe('autumn-deep');
    expect(s?.tone).toBe('warm');
    expect(s?.depth).toBe('deep');
  });

  it('봄 + bright → 봄 웜 브라이트', () => {
    expect(resolveSubtype('spring', 'bright')?.id).toBe('spring-bright');
  });

  it('대소문자 무관', () => {
    expect(resolveSubtype('winter', 'BRIGHT')?.id).toBe('winter-bright');
  });

  it('시즌에 없는 조합(봄+mute)은 null → 시즌 기반 파생 폴백', () => {
    expect(resolveSubtype('spring', 'mute')).toBeNull();
  });

  it('null/undefined/미지원 값은 null (구 데이터 하위호환)', () => {
    expect(resolveSubtype('summer', null)).toBeNull();
    expect(resolveSubtype('summer', undefined)).toBeNull();
    expect(resolveSubtype('summer', 'invalid')).toBeNull();
  });
});
