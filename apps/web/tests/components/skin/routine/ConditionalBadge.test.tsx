import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import ConditionalBadge, {
  SimpleBadge,
  DryRepeatBadge,
  AcneSpotBadge,
  OilySkipBadge,
} from '@/components/skin/routine/ConditionalBadge';
import type { ConditionalModification } from '@/lib/skincare/conditional-routine';

describe('ConditionalBadge', () => {
  const baseModification: ConditionalModification = {
    stepCategory: 'toner',
    condition: '피부가 건조할 때',
    modification: {
      repeatCount: 2,
    },
  };

  it('기본 렌더링이 된다', () => {
    render(<ConditionalBadge conditionalMod={baseModification} />);

    expect(screen.getByTestId('conditional-badge')).toBeInTheDocument();
  });

  it('조건 라벨이 표시된다', () => {
    render(<ConditionalBadge conditionalMod={baseModification} />);

    expect(screen.getByText('건조')).toBeInTheDocument();
  });

  it('반복 횟수가 표시된다', () => {
    render(<ConditionalBadge conditionalMod={baseModification} />);

    expect(screen.getByText('2회')).toBeInTheDocument();
  });

  it('스킵 수정이 표시된다', () => {
    const skipMod: ConditionalModification = {
      stepCategory: 'cream',
      condition: '피부가 번들거릴 때',
      modification: {
        skipStep: true,
      },
    };

    render(<ConditionalBadge conditionalMod={skipMod} />);

    expect(screen.getByText('번들')).toBeInTheDocument();
    expect(screen.getByText('건너뛰기')).toBeInTheDocument();
  });

  it('시간 연장이 표시된다', () => {
    const extendMod: ConditionalModification = {
      stepCategory: 'mask',
      condition: '피부가 칙칙할 때',
      modification: {
        extendDuration: '+5분',
      },
    };

    render(<ConditionalBadge conditionalMod={extendMod} />);

    expect(screen.getByText('칙칙')).toBeInTheDocument();
    expect(screen.getByText('+5분')).toBeInTheDocument();
  });

  it('추가 팁이 표시된다', () => {
    const tipMod: ConditionalModification = {
      stepCategory: 'serum',
      condition: '민감한 피부일 때',
      modification: {
        addTip: '가볍게 톡톡 두드리세요',
      },
    };

    render(<ConditionalBadge conditionalMod={tipMod} />);

    expect(screen.getByText('민감')).toBeInTheDocument();
    // 긴 팁은 잘림
    expect(screen.getByText(/가볍게 톡톡/)).toBeInTheDocument();
  });

  it('대체 제품이 표시된다', () => {
    const substituteMod: ConditionalModification = {
      stepCategory: 'cream',
      condition: '여드름이 있을 때',
      modification: {
        substituteWith: 'spot_treatment',
      },
    };

    render(<ConditionalBadge conditionalMod={substituteMod} />);

    expect(screen.getByText('트러블')).toBeInTheDocument();
    expect(screen.getByText(/spot_treatment/)).toBeInTheDocument();
  });

  it('size=md가 적용된다', () => {
    render(<ConditionalBadge conditionalMod={baseModification} size="md" />);

    const badge = screen.getByTestId('conditional-badge');
    expect(badge.className).toContain('text-sm');
  });

  it('title 속성이 설정된다', () => {
    render(<ConditionalBadge conditionalMod={baseModification} />);

    const badge = screen.getByTestId('conditional-badge');
    expect(badge).toHaveAttribute('title', expect.stringContaining('건조'));
    expect(badge).toHaveAttribute('title', expect.stringContaining('2회'));
  });
});

describe('SimpleBadge', () => {
  it('기본 렌더링이 된다', () => {
    render(<SimpleBadge condition="건조" modificationText="2회" type="repeat" />);

    expect(screen.getByTestId('simple-badge')).toBeInTheDocument();
    expect(screen.getByText('건조')).toBeInTheDocument();
    expect(screen.getByText('2회')).toBeInTheDocument();
  });

  it('타입별 스타일이 적용된다', () => {
    const { rerender } = render(
      <SimpleBadge condition="테스트" modificationText="값" type="repeat" />
    );

    let badge = screen.getByTestId('simple-badge');
    expect(badge.className).toContain('bg-blue');

    rerender(<SimpleBadge condition="테스트" modificationText="값" type="add" />);
    badge = screen.getByTestId('simple-badge');
    expect(badge.className).toContain('bg-emerald');

    rerender(<SimpleBadge condition="테스트" modificationText="값" type="skip" />);
    badge = screen.getByTestId('simple-badge');
    expect(badge.className).toContain('bg-gray');
  });
});

describe('프리셋 뱃지', () => {
  describe('DryRepeatBadge', () => {
    it('기본 렌더링이 된다', () => {
      render(<DryRepeatBadge />);

      expect(screen.getByText('건조')).toBeInTheDocument();
      expect(screen.getByText('2회')).toBeInTheDocument();
    });

    it('커스텀 반복 횟수가 적용된다', () => {
      render(<DryRepeatBadge repeatCount={3} />);

      expect(screen.getByText('3회')).toBeInTheDocument();
    });

    it('size=md가 적용된다', () => {
      render(<DryRepeatBadge size="md" />);

      const badge = screen.getByTestId('simple-badge');
      expect(badge.className).toContain('text-sm');
    });
  });

  describe('AcneSpotBadge', () => {
    it('기본 렌더링이 된다', () => {
      render(<AcneSpotBadge />);

      expect(screen.getByText('트러블')).toBeInTheDocument();
      expect(screen.getByText('+스팟')).toBeInTheDocument();
    });
  });

  describe('OilySkipBadge', () => {
    it('기본 렌더링이 된다', () => {
      render(<OilySkipBadge />);

      expect(screen.getByText('번들')).toBeInTheDocument();
      expect(screen.getByText('건너뛰기')).toBeInTheDocument();
    });
  });
});
