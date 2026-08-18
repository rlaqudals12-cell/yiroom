/**
 * 날씨 Mock 정직성 회귀 테스트
 *
 * API 키가 없을 때 만드는 값은 실측치가 아니므로 출처를 명시하고,
 * 같은 입력에서 임의값이 바뀌지 않아야 한다.
 */

import { generateMockWeather } from '@/lib/weather/weatherService';

describe('generateMockWeather', () => {
  it('Mock 출처를 usedFallback으로 명시한다', () => {
    expect(generateMockWeather('seoul').usedFallback).toBe(true);
  });

  it('Math.random 없이 같은 지역에 같은 예시값을 만든다', () => {
    const randomSpy = jest.spyOn(Math, 'random');

    const first = generateMockWeather('seoul');
    const second = generateMockWeather('seoul');

    expect(randomSpy).not.toHaveBeenCalled();
    expect(second.current).toEqual(first.current);
    expect(second.forecast).toEqual(first.forecast);

    randomSpy.mockRestore();
  });
});
