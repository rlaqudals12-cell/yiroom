/**
 * P3-5.3: CrossModuleAlert 컴포넌트 테스트
 */

import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import CrossModuleAlert, {
  CrossModuleAlertList,
  CrossModuleAlertSkeleton,
} from '@/components/common/CrossModuleAlert';
import type { CrossModuleAlertData } from '@/lib/alerts';

describe('CrossModuleAlert', () => {
  // 테스트용 알림 데이터
  const mockAlert: CrossModuleAlertData = {
    id: 'test-alert-1',
    type: 'calorie_surplus',
    sourceModule: 'nutrition',
    targetModule: 'workout',
    title: '칼로리 초과',
    message: '목표 대비 300kcal 초과',
    priority: 'high',
    level: 'warning',
    ctaText: '운동하러 가기',
    ctaHref: '/workout',
    metadata: {
      surplusCalories: 300,
    },
    createdAt: new Date(),
  };

  describe('렌더링', () => {
    it('기본 알림이 렌더링된다', () => {
      render(<CrossModuleAlert alert={mockAlert} />);

      expect(screen.getByTestId('cross-module-alert')).toBeInTheDocument();
      expect(screen.getByText('칼로리 초과')).toBeInTheDocument();
      expect(screen.getByText('목표 대비 300kcal 초과')).toBeInTheDocument();
    });

    it('CTA 버튼이 표시된다', () => {
      render(<CrossModuleAlert alert={mockAlert} />);

      expect(screen.getByTestId('cross-module-alert-cta')).toBeInTheDocument();
      expect(screen.getByText('운동하러 가기')).toBeInTheDocument();
    });

    it('모듈 연동 라벨이 표시된다', () => {
      render(<CrossModuleAlert alert={mockAlert} />);

      expect(screen.getByText('N-1 영양 → W-1 운동')).toBeInTheDocument();
    });

    it('컴팩트 모드로 렌더링된다', () => {
      render(<CrossModuleAlert alert={mockAlert} compact />);

      expect(screen.getByTestId('cross-module-alert-compact')).toBeInTheDocument();
    });
  });

  describe('알림 레벨별 스타일', () => {
    it('warning 레벨은 amber 스타일이 적용된다', () => {
      render(<CrossModuleAlert alert={mockAlert} />);

      const alertElement = screen.getByTestId('cross-module-alert');
      expect(alertElement).toHaveClass('bg-amber-50');
      expect(alertElement).toHaveClass('border-amber-200');
    });

    it('danger 레벨은 red 스타일이 적용된다', () => {
      const dangerAlert = { ...mockAlert, level: 'danger' as const };
      render(<CrossModuleAlert alert={dangerAlert} />);

      const alertElement = screen.getByTestId('cross-module-alert');
      expect(alertElement).toHaveClass('bg-red-50');
      expect(alertElement).toHaveClass('border-red-200');
    });

    it('info 레벨은 blue 스타일이 적용된다', () => {
      const infoAlert = { ...mockAlert, level: 'info' as const };
      render(<CrossModuleAlert alert={infoAlert} />);

      const alertElement = screen.getByTestId('cross-module-alert');
      expect(alertElement).toHaveClass('bg-blue-50');
      expect(alertElement).toHaveClass('border-blue-200');
    });

    it('success 레벨은 green 스타일이 적용된다', () => {
      const successAlert = { ...mockAlert, level: 'success' as const };
      render(<CrossModuleAlert alert={successAlert} />);

      const alertElement = screen.getByTestId('cross-module-alert');
      expect(alertElement).toHaveClass('bg-green-50');
      expect(alertElement).toHaveClass('border-green-200');
    });
  });

  describe('닫기 기능', () => {
    it('닫기 버튼이 표시된다', () => {
      const onDismiss = vi.fn();
      render(<CrossModuleAlert alert={mockAlert} onDismiss={onDismiss} />);

      expect(screen.getByTestId('cross-module-alert-dismiss')).toBeInTheDocument();
    });

    it('닫기 버튼 클릭 시 onDismiss가 호출된다', () => {
      const onDismiss = vi.fn();
      render(<CrossModuleAlert alert={mockAlert} onDismiss={onDismiss} />);

      fireEvent.click(screen.getByTestId('cross-module-alert-dismiss'));

      expect(onDismiss).toHaveBeenCalledWith('test-alert-1');
    });

    it('onDismiss가 없으면 닫기 버튼이 표시되지 않는다', () => {
      render(<CrossModuleAlert alert={mockAlert} />);

      expect(screen.queryByTestId('cross-module-alert-dismiss')).not.toBeInTheDocument();
    });
  });

  describe('클릭 핸들러', () => {
    it('onClick이 있으면 버튼으로 렌더링된다', () => {
      const onClick = vi.fn();
      render(<CrossModuleAlert alert={mockAlert} onClick={onClick} />);

      const ctaButton = screen.getByTestId('cross-module-alert-cta');
      expect(ctaButton.tagName).toBe('BUTTON');
    });

    it('onClick 클릭 시 핸들러가 호출된다', () => {
      const onClick = vi.fn();
      render(<CrossModuleAlert alert={mockAlert} onClick={onClick} />);

      fireEvent.click(screen.getByTestId('cross-module-alert-cta'));

      expect(onClick).toHaveBeenCalledWith(mockAlert);
    });

    it('onClick이 없으면 링크로 렌더링된다', () => {
      render(<CrossModuleAlert alert={mockAlert} />);

      const ctaLink = screen.getByTestId('cross-module-alert-cta');
      expect(ctaLink.tagName).toBe('A');
      expect(ctaLink).toHaveAttribute('href', '/workout');
    });
  });

  describe('접근성', () => {
    it('role="alert"가 적용된다', () => {
      render(<CrossModuleAlert alert={mockAlert} />);

      expect(screen.getByRole('alert')).toBeInTheDocument();
    });

    it('aria-live="polite"가 적용된다', () => {
      render(<CrossModuleAlert alert={mockAlert} />);

      expect(screen.getByRole('alert')).toHaveAttribute('aria-live', 'polite');
    });

    it('닫기 버튼에 aria-label이 있다', () => {
      const onDismiss = vi.fn();
      render(<CrossModuleAlert alert={mockAlert} onDismiss={onDismiss} />);

      expect(screen.getByTestId('cross-module-alert-dismiss')).toHaveAttribute(
        'aria-label',
        '알림 닫기'
      );
    });
  });
});

describe('CrossModuleAlertList', () => {
  const mockAlerts: CrossModuleAlertData[] = [
    {
      id: 'alert-1',
      type: 'calorie_surplus',
      sourceModule: 'nutrition',
      targetModule: 'workout',
      title: '칼로리 초과',
      message: '300kcal 초과',
      priority: 'high',
      level: 'warning',
      ctaText: '운동하러 가기',
      ctaHref: '/workout',
      createdAt: new Date(),
    },
    {
      id: 'alert-2',
      type: 'post_workout_nutrition',
      sourceModule: 'workout',
      targetModule: 'nutrition',
      title: '영양 보충',
      message: '단백질 섭취 권장',
      priority: 'medium',
      level: 'info',
      ctaText: '식단 기록',
      ctaHref: '/nutrition',
      createdAt: new Date(),
    },
    {
      id: 'alert-3',
      type: 'post_workout_skin',
      sourceModule: 'workout',
      targetModule: 'skin',
      title: '피부 관리',
      message: '세안 권장',
      priority: 'low',
      level: 'info',
      ctaText: '피부 분석',
      ctaHref: '/analysis/skin',
      createdAt: new Date(),
    },
  ];

  it('알림 목록이 렌더링된다', () => {
    render(<CrossModuleAlertList alerts={mockAlerts} />);

    expect(screen.getByTestId('cross-module-alert-list')).toBeInTheDocument();
    expect(screen.getAllByTestId('cross-module-alert')).toHaveLength(3);
  });

  it('maxCount에 따라 표시 개수가 제한된다', () => {
    render(<CrossModuleAlertList alerts={mockAlerts} maxCount={2} />);

    expect(screen.getAllByTestId('cross-module-alert')).toHaveLength(2);
  });

  it('알림 닫기 시 목록에서 제거된다', () => {
    render(<CrossModuleAlertList alerts={mockAlerts} />);

    expect(screen.getAllByTestId('cross-module-alert')).toHaveLength(3);

    // 첫 번째 알림 닫기
    const dismissButtons = screen.getAllByTestId('cross-module-alert-dismiss');
    fireEvent.click(dismissButtons[0]);

    expect(screen.getAllByTestId('cross-module-alert')).toHaveLength(2);
  });

  it('알림이 없으면 null을 반환한다', () => {
    const { container } = render(<CrossModuleAlertList alerts={[]} />);

    expect(container.firstChild).toBeNull();
  });

  it('컴팩트 모드가 적용된다', () => {
    render(<CrossModuleAlertList alerts={mockAlerts} compact />);

    expect(screen.getAllByTestId('cross-module-alert-compact')).toHaveLength(3);
  });
});

describe('CrossModuleAlertSkeleton', () => {
  it('스켈레톤이 렌더링된다', () => {
    render(<CrossModuleAlertSkeleton />);

    expect(screen.getByTestId('cross-module-alert-skeleton')).toBeInTheDocument();
  });

  it('animate-pulse 클래스가 적용된다', () => {
    render(<CrossModuleAlertSkeleton />);

    expect(screen.getByTestId('cross-module-alert-skeleton')).toHaveClass('animate-pulse');
  });
});
