/**
 * 날씨 코디 페이지 위치 동의 테스트 (위치정보보호법 컴플라이언스)
 * @description 법적 지적: /style/weather 가 목적 고지 없이 navigator.geolocation로
 *   정밀 GPS를 요청할 수 있었다(위치 아이콘 클릭만으로, 동의 고지·기록 없음).
 *   closet/recommend 의 동의 게이트 패턴을 이식한다.
 *   검증: (1) 마운트 시 자동 요청 금지 + 목적 고지 노출 (2) 버튼 클릭 시에만 요청
 *   (3) 좌표는 저장하지 않음(동의 플래그만) (4) 이전 동의자는 자동 반영.
 */
import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';

// 스타일 하위 컴포넌트의 실제 렌더는 이 테스트의 관심사가 아니므로 경량 대체.
vi.mock('@/components/style/WeatherCard', () => ({
  WeatherCard: () => React.createElement('div', { 'data-testid': 'weather-card' }),
}));
vi.mock('@/components/style/OutfitRecommendation', () => ({
  OutfitRecommendation: () =>
    React.createElement('div', { 'data-testid': 'outfit-recommendation' }),
}));
vi.mock('@/components/style/LayeringGuide', () => ({
  LayeringGuide: () => React.createElement('div', { 'data-testid': 'layering-guide' }),
}));

import WeatherOutfitPage from '@/app/(main)/style/weather/page';

const mockFetch = vi.fn();
const getCurrentPosition = vi.fn();

// /api/style/recommend 응답 최소 형태 (region은 초기값과 동일하게 두어 재조회 루프 방지)
const weatherResponse = {
  weather: { region: 'seoul', current: { feelsLike: 18 } },
  recommendation: { items: [] },
};

describe('WeatherOutfitPage 위치 동의(위치정보보호법)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();

    mockFetch.mockResolvedValue({
      ok: true,
      json: () => Promise.resolve(weatherResponse),
    });
    global.fetch = mockFetch as unknown as typeof fetch;

    // jsdom에는 geolocation이 없으므로 주입 (기본 구현은 no-op — success 콜백 미호출)
    Object.defineProperty(global.navigator, 'geolocation', {
      value: { getCurrentPosition },
      configurable: true,
      writable: true,
    });
  });

  it('마운트만으로는 위치를 자동 요청하지 않고, 목적 고지가 있는 동의 컨트롤을 노출한다', async () => {
    render(<WeatherOutfitPage />);

    await waitFor(() => {
      expect(screen.getByTestId('location-consent-button')).toBeInTheDocument();
    });

    // 핵심(재발 방지): 페이지 로드만으로 geolocation 자동 요청 금지
    expect(getCurrentPosition).not.toHaveBeenCalled();

    // 앱 내 명시적 동의 컨트롤 + 목적 고지
    expect(screen.getByTestId('location-consent')).toBeInTheDocument();
    expect(
      screen.getByText(/현재 위치를 일시적으로 사용해요\. 저장하지 않아요\./)
    ).toBeInTheDocument();
  });

  it('동의 버튼을 눌러야만 위치를 요청하고, 좌표가 아닌 동의 플래그만 저장한다', async () => {
    render(<WeatherOutfitPage />);

    await waitFor(() => {
      expect(screen.getByTestId('location-consent-button')).toBeInTheDocument();
    });
    expect(getCurrentPosition).not.toHaveBeenCalled();

    fireEvent.click(screen.getByTestId('location-consent-button'));

    await waitFor(() => {
      expect(getCurrentPosition).toHaveBeenCalledTimes(1);
    });

    // 저장되는 것은 동의 여부 플래그뿐 — 좌표(위/경도)는 저장하지 않는다
    expect(localStorage.getItem('location_consent')).toBe('granted');
    expect(localStorage.length).toBe(1);
  });

  it('위치 반영에 성공하면 동의 컨트롤이 사라지고 좌표는 저장되지 않는다', async () => {
    // 성공 콜백을 즉시 호출해 위치 반영 경로(fetch → active)를 태운다
    getCurrentPosition.mockImplementation(
      (success: (pos: { coords: { latitude: number; longitude: number } }) => void) => {
        success({ coords: { latitude: 37.5, longitude: 127.0 } });
      }
    );

    render(<WeatherOutfitPage />);

    await waitFor(() => {
      expect(screen.getByTestId('location-consent-button')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByTestId('location-consent-button'));

    // 위치가 반영되면 동의 컨트롤은 사라진다
    await waitFor(() => {
      expect(screen.queryByTestId('location-consent')).not.toBeInTheDocument();
    });

    // 동의 플래그만 저장(좌표 없음)
    expect(localStorage.getItem('location_consent')).toBe('granted');
    expect(localStorage.length).toBe(1);
  });

  it('이전에 앱 내 동의한 사용자는 다시 묻지 않고 자동 반영한다', async () => {
    localStorage.setItem('location_consent', 'granted');

    render(<WeatherOutfitPage />);

    await waitFor(() => {
      expect(getCurrentPosition).toHaveBeenCalledTimes(1);
    });
    // 저장된 것은 동의 플래그뿐(좌표 없음)
    expect(localStorage.getItem('location_consent')).toBe('granted');
    expect(localStorage.length).toBe(1);
  });
});
