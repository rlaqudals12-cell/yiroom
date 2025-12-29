/**
 * WeatherCard 컴포넌트 테스트
 */

import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { WeatherCard } from '@/components/style/WeatherCard';
import type { WeatherData } from '@/types/weather';

// lucide-react 모킹
vi.mock('lucide-react', async (importOriginal) => {
  const actual = await importOriginal<typeof import('lucide-react')>();
  return {
    ...actual,
    Cloud: () => <span data-testid="icon-cloud">☁</span>,
    Droplets: () => <span data-testid="icon-droplets">💧</span>,
    Sun: () => <span data-testid="icon-sun">☀</span>,
    Thermometer: () => <span data-testid="icon-thermometer">🌡</span>,
    Wind: () => <span data-testid="icon-wind">💨</span>,
  };
});

// Mock 날씨 데이터
const mockWeather: WeatherData = {
  region: 'seoul',
  location: '서울',
  current: {
    temp: 15,
    feelsLike: 13,
    humidity: 60,
    windSpeed: 2.5,
    uvi: 4,
    description: '맑음',
    icon: '01d',
    precipitation: 20,
  },
  forecast: [
    {
      time: '15:00',
      temp: 17,
      feelsLike: 15,
      precipitation: 10,
      description: '맑음',
      icon: '01d',
    },
    {
      time: '18:00',
      temp: 14,
      feelsLike: 12,
      precipitation: 30,
      description: '구름 조금',
      icon: '02d',
    },
  ],
  cachedAt: '2025-01-15T10:00:00Z',
};

describe('WeatherCard', () => {
  it('renders with data-testid', () => {
    render(<WeatherCard weather={mockWeather} />);
    expect(screen.getByTestId('weather-card')).toBeInTheDocument();
  });

  it('displays location', () => {
    render(<WeatherCard weather={mockWeather} />);
    expect(screen.getByText(/서울/)).toBeInTheDocument();
  });

  it('displays current temperature', () => {
    render(<WeatherCard weather={mockWeather} />);
    expect(screen.getByText('15°C')).toBeInTheDocument();
  });

  it('displays feels like temperature', () => {
    render(<WeatherCard weather={mockWeather} />);
    expect(screen.getByText(/체감 13°C/)).toBeInTheDocument();
  });

  it('displays weather description', () => {
    render(<WeatherCard weather={mockWeather} />);
    expect(screen.getByText('맑음')).toBeInTheDocument();
  });

  it('displays humidity', () => {
    render(<WeatherCard weather={mockWeather} />);
    expect(screen.getByText(/습도 60%/)).toBeInTheDocument();
  });

  it('displays wind speed', () => {
    render(<WeatherCard weather={mockWeather} />);
    expect(screen.getByText(/풍속 2.5m\/s/)).toBeInTheDocument();
  });

  it('displays precipitation badge when > 0', () => {
    render(<WeatherCard weather={mockWeather} />);
    expect(screen.getByText(/강수 20%/)).toBeInTheDocument();
  });

  it('displays UV level badge', () => {
    render(<WeatherCard weather={mockWeather} />);
    expect(screen.getByText(/UV/)).toBeInTheDocument();
  });

  it('displays hourly forecast', () => {
    render(<WeatherCard weather={mockWeather} />);
    expect(screen.getByText('15:00')).toBeInTheDocument();
    expect(screen.getByText('17°C')).toBeInTheDocument();
    expect(screen.getByText('18:00')).toBeInTheDocument();
  });

  it('displays forecast precipitation', () => {
    render(<WeatherCard weather={mockWeather} />);
    // 30% 강수 확률
    expect(screen.getByText('30%')).toBeInTheDocument();
  });

  describe('compact mode', () => {
    it('renders compact layout', () => {
      render(<WeatherCard weather={mockWeather} compact />);
      expect(screen.getByTestId('weather-card')).toBeInTheDocument();
    });

    it('displays temperature in compact mode', () => {
      render(<WeatherCard weather={mockWeather} compact />);
      expect(screen.getByText('15°C')).toBeInTheDocument();
    });

    it('displays location in compact mode', () => {
      render(<WeatherCard weather={mockWeather} compact />);
      expect(screen.getByText('서울')).toBeInTheDocument();
    });

    it('does not display hourly forecast in compact mode', () => {
      render(<WeatherCard weather={mockWeather} compact />);
      expect(screen.queryByText('시간별 예보')).not.toBeInTheDocument();
    });
  });

  describe('weather icons', () => {
    it('shows sun icon for clear weather', () => {
      render(<WeatherCard weather={mockWeather} />);
      expect(screen.getAllByTestId('icon-sun').length).toBeGreaterThan(0);
    });

    it('shows cloud icon for cloudy weather', () => {
      const cloudyWeather = {
        ...mockWeather,
        current: { ...mockWeather.current, icon: '03d' },
      };
      render(<WeatherCard weather={cloudyWeather} />);
      expect(screen.getAllByTestId('icon-cloud').length).toBeGreaterThan(0);
    });
  });

  it('applies custom className', () => {
    render(<WeatherCard weather={mockWeather} className="custom-class" />);
    const card = screen.getByTestId('weather-card');
    expect(card.className).toContain('custom-class');
  });
});
