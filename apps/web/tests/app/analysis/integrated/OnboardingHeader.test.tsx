/**
 * OnboardingHeader 테스트 (ADR-114 가입=첫 미팅)
 *
 * - ?onboarding=1 진입 시에만 "첫 미팅" 헤더 렌더
 * - "나중에 할게요" 스킵 링크 → /home
 * - 파라미터 없으면 미렌더 (일반 재분석 진입 무영향)
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { OnboardingHeader } from '@/app/(main)/analysis/integrated/_components/OnboardingHeader';

const getMock = vi.fn();

vi.mock('next/navigation', () => ({
  useSearchParams: () => ({ get: getMock }),
}));

describe('OnboardingHeader', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('onboarding=1이면 첫 미팅 헤더를 렌더한다', () => {
    getMock.mockReturnValue('1');
    render(<OnboardingHeader />);

    expect(screen.getByTestId('onboarding-header')).toBeInTheDocument();
    expect(screen.getByText('첫 미팅이에요 👋')).toBeInTheDocument();
    expect(screen.getByText(/전속 뷰티팀/)).toBeInTheDocument();
  });

  it('"나중에 할게요" 링크는 /home으로 연결된다', () => {
    getMock.mockReturnValue('1');
    render(<OnboardingHeader />);

    const skipLink = screen.getByTestId('onboarding-skip-link');
    expect(skipLink).toHaveTextContent('나중에 할게요');
    expect(skipLink).toHaveAttribute('href', '/home');
  });

  it('onboarding 파라미터가 없으면 아무것도 렌더하지 않는다', () => {
    getMock.mockReturnValue(null);
    const { container } = render(<OnboardingHeader />);

    expect(screen.queryByTestId('onboarding-header')).not.toBeInTheDocument();
    expect(container).toBeEmptyDOMElement();
  });

  it('onboarding 값이 1이 아니면 렌더하지 않는다', () => {
    getMock.mockReturnValue('0');
    render(<OnboardingHeader />);

    expect(screen.queryByTestId('onboarding-header')).not.toBeInTheDocument();
  });
});
