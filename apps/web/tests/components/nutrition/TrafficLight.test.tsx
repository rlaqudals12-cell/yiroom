/**
 * N-1 TrafficLight 컴포넌트 테스트
 * Task 2.6: 신호등 표시 컴포넌트
 */

import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import {
  TrafficLightIndicator,
  TrafficLightSummaryInline,
  TrafficLightCard,
  calculateTrafficLightRatio,
  getTrafficLightFromCalorieDensity,
  TRAFFIC_LIGHT_CONFIG,
} from '@/components/nutrition/TrafficLight';

// i18n 도입(next-intl)으로 컴포넌트가 번역 키를 사용 —
// tests/setup.ts 기본 목은 키를 그대로 반환하므로 실제 ko 메시지로 오버라이드해
// 한국어 문구 검증을 유지한다.
vi.mock('next-intl', async () => {
  const messages = (await import('@/messages/ko.json')).default as Record<
    string,
    Record<string, string>
  >;
  return {
    useTranslations: (namespace?: string) => (key: string) =>
      (namespace ? messages[namespace]?.[key] : undefined) ?? key,
    useLocale: () => 'ko',
    useMessages: () => messages,
    NextIntlClientProvider: ({ children }: { children?: unknown }) => children,
  };
});

describe('TrafficLightIndicator', () => {
  it('초록색 신호등을 렌더링한다', () => {
    render(<TrafficLightIndicator color="green" />);

    expect(screen.getByTestId('traffic-light-indicator')).toBeInTheDocument();
  });

  it('노란색 신호등을 렌더링한다', () => {
    render(<TrafficLightIndicator color="yellow" />);

    expect(screen.getByTestId('traffic-light-indicator')).toBeInTheDocument();
  });

  it('빨간색 신호등을 렌더링한다', () => {
    render(<TrafficLightIndicator color="red" />);

    expect(screen.getByTestId('traffic-light-indicator')).toBeInTheDocument();
  });

  it('showLabel=true일 때 라벨을 표시한다', () => {
    render(<TrafficLightIndicator color="green" showLabel />);

    expect(screen.getByText('초록')).toBeInTheDocument();
  });

  it('showDescription=true일 때 설명을 표시한다', () => {
    render(<TrafficLightIndicator color="green" showDescription />);

    expect(screen.getByText('(저칼로리)')).toBeInTheDocument();
  });

  it('showLabel과 showDescription을 함께 표시한다', () => {
    render(<TrafficLightIndicator color="yellow" showLabel showDescription />);

    expect(screen.getByText('노랑')).toBeInTheDocument();
    expect(screen.getByText('(적당)')).toBeInTheDocument();
  });

  it('다양한 size를 지원한다', () => {
    const { rerender } = render(<TrafficLightIndicator color="green" size="sm" />);
    expect(screen.getByTestId('traffic-light-indicator')).toHaveClass('text-sm');

    rerender(<TrafficLightIndicator color="green" size="lg" />);
    expect(screen.getByTestId('traffic-light-indicator')).toHaveClass('text-lg');
  });
});

describe('TrafficLightSummaryInline', () => {
  const mockRatio = { green: 32, yellow: 45, red: 23 };

  it('신호등 비율을 인라인으로 표시한다', () => {
    render(<TrafficLightSummaryInline ratio={mockRatio} />);

    expect(screen.getByTestId('traffic-light-summary-inline')).toBeInTheDocument();
    expect(screen.getByText(/32%/)).toBeInTheDocument();
    expect(screen.getByText(/45%/)).toBeInTheDocument();
    expect(screen.getByText(/23%/)).toBeInTheDocument();
  });

  it('각 색상 비율을 표시한다', () => {
    render(<TrafficLightSummaryInline ratio={mockRatio} />);

    // 이모지 제거됨 - 비율 퍼센트 값으로 검증
    expect(screen.getByText(/32%/)).toBeInTheDocument();
    expect(screen.getByText(/45%/)).toBeInTheDocument();
    expect(screen.getByText(/23%/)).toBeInTheDocument();
  });

  it('size=sm일 때 작은 텍스트를 사용한다', () => {
    render(<TrafficLightSummaryInline ratio={mockRatio} size="sm" />);

    expect(screen.getByTestId('traffic-light-summary-inline')).toHaveClass('text-xs');
  });
});

describe('TrafficLightCard', () => {
  it('기본 타이틀을 표시한다', () => {
    render(<TrafficLightCard ratio={{ green: 35, yellow: 40, red: 25 }} />);

    expect(screen.getByText(/오늘의 음식 신호등/)).toBeInTheDocument();
    expect(screen.getByTestId('traffic-light-card')).toBeInTheDocument();
  });

  it('커스텀 타이틀을 표시한다', () => {
    render(<TrafficLightCard ratio={{ green: 35, yellow: 40, red: 25 }} title="이번 주 신호등" />);

    expect(screen.getByText(/이번 주 신호등/)).toBeInTheDocument();
  });

  it('각 색상의 비율을 표시한다', () => {
    render(<TrafficLightCard ratio={{ green: 35, yellow: 40, red: 25 }} />);

    expect(screen.getByText('35%')).toBeInTheDocument();
    expect(screen.getByText('40%')).toBeInTheDocument();
    expect(screen.getByText('25%')).toBeInTheDocument();
  });

  it('균형 잡힌 식단일 때 성공 메시지를 표시한다', () => {
    // green >= 30, yellow <= 45, red <= 25
    render(<TrafficLightCard ratio={{ green: 35, yellow: 40, red: 25 }} />);

    expect(screen.getByText('균형 잡힌 식단이에요!')).toBeInTheDocument();
  });

  it('균형이 맞지 않을 때 개선 메시지를 표시한다', () => {
    // green < 30 (불균형)
    render(<TrafficLightCard ratio={{ green: 20, yellow: 50, red: 30 }} />);

    expect(screen.getByText(/초록색 음식을 조금 더 섭취/)).toBeInTheDocument();
  });

  it('showTargets=false일 때 목표를 숨긴다', () => {
    render(<TrafficLightCard ratio={{ green: 35, yellow: 40, red: 25 }} showTargets={false} />);

    expect(screen.queryByText(/목표/)).not.toBeInTheDocument();
  });

  it('목표 달성 시 체크 표시를 보여준다', () => {
    render(<TrafficLightCard ratio={{ green: 35, yellow: 40, red: 25 }} />);

    // 3개 모두 목표 달성 - 체크 표시가 포함된 요소 확인
    // 3개 모두 목표 달성 - 체크 표시가 포함된 요소 확인
    const checkmarks = screen.getAllByText(/✓/);
    expect(checkmarks.length).toBe(3);
  });
});

describe('calculateTrafficLightRatio', () => {
  it('빈 배열일 때 모두 0을 반환한다', () => {
    const result = calculateTrafficLightRatio([]);

    expect(result).toEqual({ green: 0, yellow: 0, red: 0 });
  });

  it('단일 음식의 비율을 계산한다', () => {
    const result = calculateTrafficLightRatio([{ trafficLight: 'green' }]);

    expect(result).toEqual({ green: 100, yellow: 0, red: 0 });
  });

  it('여러 음식의 비율을 올바르게 계산한다', () => {
    const foods = [
      { trafficLight: 'green' as const },
      { trafficLight: 'green' as const },
      { trafficLight: 'yellow' as const },
      { trafficLight: 'red' as const },
    ];
    const result = calculateTrafficLightRatio(foods);

    expect(result.green).toBe(50); // 2/4 = 50%
    expect(result.yellow).toBe(25); // 1/4 = 25%
    expect(result.red).toBe(25); // 1/4 = 25%
  });

  it('비율을 반올림한다', () => {
    const foods = [
      { trafficLight: 'green' as const },
      { trafficLight: 'green' as const },
      { trafficLight: 'yellow' as const },
    ];
    const result = calculateTrafficLightRatio(foods);

    // 2/3 = 66.67% -> 67%
    expect(result.green).toBe(67);
    // 1/3 = 33.33% -> 33%
    expect(result.yellow).toBe(33);
  });
});

describe('getTrafficLightFromCalorieDensity', () => {
  it('칼로리 밀도 < 1일 때 초록색을 반환한다', () => {
    // 50 kcal / 100g = 0.5
    expect(getTrafficLightFromCalorieDensity(50, 100)).toBe('green');
  });

  it('칼로리 밀도 1~2.5일 때 노란색을 반환한다', () => {
    // 150 kcal / 100g = 1.5
    expect(getTrafficLightFromCalorieDensity(150, 100)).toBe('yellow');
    // 100 kcal / 100g = 1.0 (경계값)
    expect(getTrafficLightFromCalorieDensity(100, 100)).toBe('yellow');
    // 250 kcal / 100g = 2.5 (경계값)
    expect(getTrafficLightFromCalorieDensity(250, 100)).toBe('yellow');
  });

  it('칼로리 밀도 > 2.5일 때 빨간색을 반환한다', () => {
    // 300 kcal / 100g = 3.0
    expect(getTrafficLightFromCalorieDensity(300, 100)).toBe('red');
    // 500 kcal / 100g = 5.0
    expect(getTrafficLightFromCalorieDensity(500, 100)).toBe('red');
  });

  it('무게가 0 이하일 때 노란색을 기본값으로 반환한다', () => {
    expect(getTrafficLightFromCalorieDensity(100, 0)).toBe('yellow');
    expect(getTrafficLightFromCalorieDensity(100, -10)).toBe('yellow');
  });
});

describe('TRAFFIC_LIGHT_CONFIG', () => {
  it('모든 색상에 필요한 속성이 있다', () => {
    const colors = ['green', 'yellow', 'red'] as const;

    colors.forEach((color) => {
      const config = TRAFFIC_LIGHT_CONFIG[color];
      expect(config.emoji).toBeDefined();
      expect(config.bgColor).toBeDefined();
      expect(config.borderColor).toBeDefined();
      expect(config.textColor).toBeDefined();
      expect(config.barColor).toBeDefined();
      expect(config.label).toBeDefined();
      expect(config.description).toBeDefined();
    });
  });

  it('초록색 설정이 올바르다', () => {
    expect(TRAFFIC_LIGHT_CONFIG.green.emoji).toBe('');
    expect(TRAFFIC_LIGHT_CONFIG.green.label).toBe('초록');
    expect(TRAFFIC_LIGHT_CONFIG.green.description).toBe('저칼로리');
  });

  it('노란색 설정이 올바르다', () => {
    expect(TRAFFIC_LIGHT_CONFIG.yellow.emoji).toBe('');
    expect(TRAFFIC_LIGHT_CONFIG.yellow.label).toBe('노랑');
    expect(TRAFFIC_LIGHT_CONFIG.yellow.description).toBe('적당');
  });

  it('빨간색 설정이 올바르다', () => {
    expect(TRAFFIC_LIGHT_CONFIG.red.emoji).toBe('');
    expect(TRAFFIC_LIGHT_CONFIG.red.label).toBe('빨강');
    expect(TRAFFIC_LIGHT_CONFIG.red.description).toBe('고칼로리');
  });
});
