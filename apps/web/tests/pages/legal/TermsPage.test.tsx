import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import TermsPage from '@/app/(main)/terms/page';

// Mock Next.js Link
vi.mock('next/link', () => ({
  default: ({
    children,
    href,
    ...props
  }: {
    children: React.ReactNode;
    href: string;
    'aria-label'?: string;
  }) => (
    <a href={href} {...props}>
      {children}
    </a>
  ),
}));

describe('TermsPage', () => {
  it('renders the page with correct test id', () => {
    render(<TermsPage />);
    expect(screen.getByTestId('terms-page')).toBeInTheDocument();
  });

  it('displays the page title', () => {
    render(<TermsPage />);
    expect(screen.getByRole('heading', { name: /이용약관/i })).toBeInTheDocument();
  });

  it('shows the last modified date', () => {
    render(<TermsPage />);
    expect(screen.getByText(/최종 수정일/i)).toBeInTheDocument();
  });

  it('renders all terms sections', () => {
    render(<TermsPage />);

    // 10개 조항 + 부칙
    expect(screen.getByText('제1조 (목적)')).toBeInTheDocument();
    expect(screen.getByText('제2조 (정의)')).toBeInTheDocument();
    expect(screen.getByText('제3조 (약관의 효력 및 변경)')).toBeInTheDocument();
    expect(screen.getByText('제4조 (서비스 이용 계약)')).toBeInTheDocument();
    expect(screen.getByText('제5조 (서비스의 제공)')).toBeInTheDocument();
    expect(screen.getByText('제6조 (회사의 의무)')).toBeInTheDocument();
    expect(screen.getByText('제7조 (이용자의 의무)')).toBeInTheDocument();
    expect(screen.getByText('제8조 (서비스 이용 제한 및 해지)')).toBeInTheDocument();
    expect(screen.getByText('제9조 (면책조항)')).toBeInTheDocument();
    expect(screen.getByText('제10조 (분쟁 해결)')).toBeInTheDocument();
    expect(screen.getByText('부칙')).toBeInTheDocument();
  });

  it('includes service description content', () => {
    render(<TermsPage />);
    expect(screen.getByText(/이룸\(Yiroom, 이하 "서비스"\)/i)).toBeInTheDocument();
    expect(screen.getByText(/AI 피부 분석, 체형 분석, 퍼스널컬러 진단/i)).toBeInTheDocument();
  });

  it('has a back link to help page', () => {
    render(<TermsPage />);
    const backLink = screen.getByRole('link', { name: /고객센터로 돌아가기/i });
    expect(backLink).toHaveAttribute('href', '/help');
  });

  it('displays disclaimer about AI analysis', () => {
    render(<TermsPage />);
    expect(
      screen.getByText(/AI 분석 결과는 참고용이며, 의료적 진단이나 치료를 대체하지 않습니다/i)
    ).toBeInTheDocument();
  });
});
