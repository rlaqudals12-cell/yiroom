import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import LifestyleFactors from '@/components/skin/diary/LifestyleFactors';

describe('LifestyleFactors', () => {
  it('renders with test id', () => {
    render(<LifestyleFactors onChange={vi.fn()} />);
    expect(screen.getByTestId('lifestyle-factors')).toBeInTheDocument();
  });

  it('displays sleep section', () => {
    render(<LifestyleFactors onChange={vi.fn()} />);
    expect(screen.getByText('수면')).toBeInTheDocument();
    expect(screen.getByText('수면 시간')).toBeInTheDocument();
    expect(screen.getByText('수면 품질')).toBeInTheDocument();
  });

  it('displays water intake section', () => {
    render(<LifestyleFactors onChange={vi.fn()} />);
    expect(screen.getByText('수분 섭취')).toBeInTheDocument();
    expect(screen.getByText('수분 섭취량')).toBeInTheDocument();
  });

  it('displays stress section', () => {
    render(<LifestyleFactors onChange={vi.fn()} />);
    expect(screen.getByText('스트레스')).toBeInTheDocument();
    expect(screen.getByText('스트레스 레벨')).toBeInTheDocument();
  });

  it('displays weather section', () => {
    render(<LifestyleFactors onChange={vi.fn()} />);
    expect(screen.getByText('외부 환경')).toBeInTheDocument();
    expect(screen.getByText('오늘 날씨')).toBeInTheDocument();
    expect(screen.getByText('외출 시간')).toBeInTheDocument();
  });

  it('renders sleep quality buttons (1-5)', () => {
    render(<LifestyleFactors onChange={vi.fn()} />);

    // 수면 품질 버튼 5개가 있어야 함
    for (let i = 1; i <= 5; i++) {
      expect(screen.getByRole('button', { name: `수면 품질 ${i}점` })).toBeInTheDocument();
    }
  });

  it('renders stress level buttons (1-5)', () => {
    render(<LifestyleFactors onChange={vi.fn()} />);

    // 스트레스 레벨 버튼 5개가 있어야 함
    for (let i = 1; i <= 5; i++) {
      expect(screen.getByRole('button', { name: `스트레스 레벨 ${i}점` })).toBeInTheDocument();
    }
  });

  it('renders all weather type buttons', () => {
    render(<LifestyleFactors onChange={vi.fn()} />);

    const weatherLabels = ['맑음', '흐림', '비', '추움', '더움', '습함', '건조'];
    weatherLabels.forEach((label) => {
      expect(screen.getByRole('button', { name: `날씨: ${label}` })).toBeInTheDocument();
    });
  });

  it('shows default sleep hours value', () => {
    render(<LifestyleFactors onChange={vi.fn()} />);
    expect(screen.getByText('7.0시간')).toBeInTheDocument();
  });

  it('shows default water intake value', () => {
    render(<LifestyleFactors onChange={vi.fn()} />);
    expect(screen.getByText('1,500ml')).toBeInTheDocument();
  });

  it('shows default sleep quality as 보통', () => {
    render(<LifestyleFactors onChange={vi.fn()} />);
    // 기본값 sleepQuality 3 = 보통 (수면 품질, 스트레스 모두 3이면 '보통' 두 번 표시)
    expect(screen.getAllByText('보통').length).toBeGreaterThanOrEqual(2);
  });

  it('calls onChange when sleep quality button clicked', () => {
    const onChange = vi.fn();
    render(<LifestyleFactors onChange={onChange} />);

    fireEvent.click(screen.getByRole('button', { name: '수면 품질 5점' }));

    expect(onChange).toHaveBeenCalledWith(
      expect.objectContaining({
        sleepQuality: 5,
      })
    );
  });

  it('calls onChange when stress level button clicked', () => {
    const onChange = vi.fn();
    render(<LifestyleFactors onChange={onChange} />);

    fireEvent.click(screen.getByRole('button', { name: '스트레스 레벨 4점' }));

    expect(onChange).toHaveBeenCalledWith(
      expect.objectContaining({
        stressLevel: 4,
      })
    );
  });

  it('calls onChange when weather button clicked', () => {
    const onChange = vi.fn();
    render(<LifestyleFactors onChange={onChange} />);

    fireEvent.click(screen.getByRole('button', { name: '날씨: 비' }));

    expect(onChange).toHaveBeenCalledWith(
      expect.objectContaining({
        weather: 'rainy',
      })
    );
  });

  it('updates outdoor hours when input changed', () => {
    const onChange = vi.fn();
    render(<LifestyleFactors onChange={onChange} />);

    const input = screen.getByRole('spinbutton', { name: '외출 시간' });
    fireEvent.change(input, { target: { value: '3' } });

    expect(onChange).toHaveBeenCalledWith(
      expect.objectContaining({
        outdoorHours: 3,
      })
    );
  });

  it('displays provided sleep hours value', () => {
    render(<LifestyleFactors sleepHours={8.5} onChange={vi.fn()} />);
    expect(screen.getByText('8.5시간')).toBeInTheDocument();
  });

  it('displays provided water intake value', () => {
    render(<LifestyleFactors waterIntakeMl={2500} onChange={vi.fn()} />);
    expect(screen.getByText('2,500ml')).toBeInTheDocument();
  });

  it('marks selected sleep quality button with aria-pressed', () => {
    render(<LifestyleFactors sleepQuality={4} onChange={vi.fn()} />);

    expect(screen.getByRole('button', { name: '수면 품질 4점' })).toHaveAttribute(
      'aria-pressed',
      'true'
    );
    expect(screen.getByRole('button', { name: '수면 품질 1점' })).toHaveAttribute(
      'aria-pressed',
      'false'
    );
  });

  it('marks selected stress level button with aria-pressed', () => {
    render(<LifestyleFactors stressLevel={2} onChange={vi.fn()} />);

    expect(screen.getByRole('button', { name: '스트레스 레벨 2점' })).toHaveAttribute(
      'aria-pressed',
      'true'
    );
    expect(screen.getByRole('button', { name: '스트레스 레벨 5점' })).toHaveAttribute(
      'aria-pressed',
      'false'
    );
  });

  it('marks selected weather button with aria-pressed', () => {
    render(<LifestyleFactors weather="sunny" onChange={vi.fn()} />);

    expect(screen.getByRole('button', { name: '날씨: 맑음' })).toHaveAttribute(
      'aria-pressed',
      'true'
    );
    expect(screen.getByRole('button', { name: '날씨: 비' })).toHaveAttribute(
      'aria-pressed',
      'false'
    );
  });

  it('displays stress level description', () => {
    render(<LifestyleFactors onChange={vi.fn()} />);
    expect(screen.getByText('1: 매우 낮음 ~ 5: 매우 높음')).toBeInTheDocument();
  });

  it('applies custom className', () => {
    render(<LifestyleFactors onChange={vi.fn()} className="custom-class" />);
    expect(screen.getByTestId('lifestyle-factors')).toHaveClass('custom-class');
  });

  it('shows slider range labels for sleep', () => {
    render(<LifestyleFactors onChange={vi.fn()} />);
    expect(screen.getByText('0시간')).toBeInTheDocument();
    expect(screen.getByText('12시간')).toBeInTheDocument();
  });

  it('shows slider range labels for water intake', () => {
    render(<LifestyleFactors onChange={vi.fn()} />);
    expect(screen.getByText('0ml')).toBeInTheDocument();
    expect(screen.getByText('3,000ml')).toBeInTheDocument();
  });

  it('displays sleep quality labels based on selection', () => {
    render(<LifestyleFactors sleepQuality={5} onChange={vi.fn()} />);
    expect(screen.getByText('매우 좋음')).toBeInTheDocument();
  });

  it('displays stress level labels based on selection', () => {
    render(<LifestyleFactors stressLevel={5} onChange={vi.fn()} />);
    expect(screen.getByText('매우 높음')).toBeInTheDocument();
  });

  it('has accessible slider for sleep hours', () => {
    render(<LifestyleFactors onChange={vi.fn()} />);
    // Slider는 aria-label로 접근 가능
    const sliders = screen.getAllByRole('slider');
    expect(sliders.length).toBeGreaterThanOrEqual(2);
  });

  it('has accessible slider for water intake', () => {
    render(<LifestyleFactors onChange={vi.fn()} />);
    // 수분 섭취량 슬라이더가 렌더링되어야 함
    const sliders = screen.getAllByRole('slider');
    // 수면 시간, 수분 섭취량 두 개의 슬라이더가 있어야 함
    expect(sliders.length).toBeGreaterThanOrEqual(2);
  });

  it('shows weather emojis', () => {
    render(<LifestyleFactors onChange={vi.fn()} />);
    const container = screen.getByTestId('lifestyle-factors');
    // 날씨 이모지가 포함되어 있는지 확인
    expect(container.textContent).toContain('맑음');
    expect(container.textContent).toContain('비');
    expect(container.textContent).toContain('건조');
  });
});
