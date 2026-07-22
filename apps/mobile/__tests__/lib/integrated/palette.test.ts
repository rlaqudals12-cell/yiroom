/**
 * 개인화 팔레트 추출 테스트
 *
 * 회귀 방지: 서버가 주는 PersonalColorAxisData.palette를 모바일 결과 화면이
 * 버리지 않고 렌더하기 위한 추출 유틸 검증 (리스팅 "나만의 컬러 팔레트" 클레임 배선).
 *
 * @see apps/mobile/lib/integrated/palette.ts
 */

import { extractPalette } from '@/lib/integrated/palette';
import type { AxisResult, AxisData } from '@/lib/api';

const failedAxis: AxisResult<AxisData> = {
  success: false,
  error: { code: 'MISSING_INPUT', message: 'x', userMessage: 'x', retryable: true },
};

function successAxis(data: AxisData): AxisResult<AxisData> {
  return { success: true, data, usedFallback: false };
}

describe('extractPalette', () => {
  it('서버 palette hex 배열을 그대로 추출한다', () => {
    const axis = successAxis({
      season: 'summer',
      palette: ['#AEC6CF', '#B39EB5', '#77DD77'],
    });
    expect(extractPalette(axis)).toEqual(['#AEC6CF', '#B39EB5', '#77DD77']);
  });

  it('축 실패 시 빈 배열을 반환한다', () => {
    expect(extractPalette(failedAxis)).toEqual([]);
  });

  it('palette가 없으면 빈 배열을 반환한다', () => {
    expect(extractPalette(successAxis({ season: 'spring' }))).toEqual([]);
  });

  it('palette가 배열이 아니면 빈 배열을 반환한다', () => {
    expect(extractPalette(successAxis({ palette: 'not-array' }))).toEqual([]);
  });

  it('hex 형식이 아닌 항목은 걸러낸다 (방어적 검증)', () => {
    const axis = successAxis({
      palette: ['#FFAA00', 'red', '#12345', 42, '#ABC', '#AABBCCDD', 'javascript:alert(1)'],
    });
    expect(extractPalette(axis)).toEqual(['#FFAA00', '#ABC', '#AABBCCDD']);
  });
});
