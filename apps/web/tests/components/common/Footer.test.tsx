/**
 * Footer 컴포넌트 테스트
 * - 법적 링크 렌더링
 * - 제휴·통신판매중개자 백스톱 고지 (표시광고법·공정위 추천보증 심사지침·FTC §255.5 + 전자상거래법 §20)
 */

import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { Footer } from '@/components/common/Footer';

// next/link 모킹 (jsdom 렌더용)
vi.mock('next/link', () => ({
  default: ({ children, href }: { children: React.ReactNode; href: string }) => (
    <a href={href}>{children}</a>
  ),
}));

describe('Footer', () => {
  it('푸터 컨테이너를 렌더링한다', () => {
    render(<Footer />);
    expect(screen.getByTestId('footer')).toBeInTheDocument();
  });

  it('법적 페이지 링크를 표시한다', () => {
    render(<Footer />);
    expect(screen.getByText('이용약관')).toBeInTheDocument();
    expect(screen.getByText('개인정보처리방침')).toBeInTheDocument();
  });

  it('제휴 마케팅 고지를 백스톱으로 상시 노출한다', () => {
    render(<Footer />);

    const disclosure = screen.getByTestId('footer-affiliate-disclosure');
    expect(disclosure).toBeInTheDocument();
    expect(disclosure).toHaveTextContent(/수수료를 제공받습니다/);
  });

  it('통신판매중개자 지위 고지를 상시 노출한다 (전자상거래법 §20)', () => {
    render(<Footer />);

    const disclosure = screen.getByTestId('footer-affiliate-disclosure');
    expect(disclosure).toHaveTextContent(/통신판매중개자/);
    expect(disclosure).toHaveTextContent(/통신판매의 당사자가 아니며/);
  });
});
