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

    // 15개 조항 + 부칙 (2026-07 필수조항 보강: 미성년자·서비스 변경/종료·게시물·손해배상 신설)
    expect(screen.getByText('제1조 (목적)')).toBeInTheDocument();
    expect(screen.getByText('제2조 (정의)')).toBeInTheDocument();
    expect(screen.getByText('제3조 (약관의 효력 및 변경)')).toBeInTheDocument();
    expect(screen.getByText('제4조 (서비스 이용 계약)')).toBeInTheDocument();
    expect(screen.getByText('제5조 (미성년자의 이용)')).toBeInTheDocument();
    expect(screen.getByText('제6조 (서비스의 제공)')).toBeInTheDocument();
    expect(screen.getByText('제7조 (서비스의 변경 및 중단·종료)')).toBeInTheDocument();
    expect(screen.getByText('제8조 (회사의 의무)')).toBeInTheDocument();
    expect(screen.getByText('제9조 (이용자의 의무)')).toBeInTheDocument();
    expect(screen.getByText('제10조 (이용자 게시물 및 콘텐츠 관리)')).toBeInTheDocument();
    expect(screen.getByText('제11조 (계정 관리 및 해지)')).toBeInTheDocument();
    expect(screen.getByText('제12조 (지적재산권)')).toBeInTheDocument();
    expect(screen.getByText('제13조 (면책조항)')).toBeInTheDocument();
    expect(screen.getByText('제14조 (손해배상 및 책임의 제한)')).toBeInTheDocument();
    expect(screen.getByText('제15조 (분쟁 해결)')).toBeInTheDocument();
    expect(screen.getByText('부칙')).toBeInTheDocument();
  });

  it('includes required statutory clauses (minors, liability, UGC, service termination)', () => {
    render(<TermsPage />);

    // 미성년자: 실제 연령 게이트(만 14세)와 일치해야 함
    expect(
      screen.getByText(/만 14세 미만의 아동은 서비스 가입 및 이용이 제한/i)
    ).toBeInTheDocument();
    expect(screen.getByText(/법정대리인\(부모 등\)의 동의를 받아야/i)).toBeInTheDocument();

    // 손해배상·책임제한: 무료 서비스 특성 + 고의·중과실 예외
    expect(
      screen.getByText(/고의 또는 중대한 과실로 인한 손해의 경우에는 그러하지 아니합니다/i)
    ).toBeInTheDocument();

    // 게시물/UGC 모더레이션: 삭제·블라인드 권한
    expect(screen.getByText(/게시 중단\(블라인드\)/i)).toBeInTheDocument();

    // 서비스 종료 사전 고지
    expect(screen.getByText(/종료일로부터 최소 30일 전에/i)).toBeInTheDocument();
  });

  it('includes service description content', () => {
    render(<TermsPage />);
    expect(screen.getByText(/이룸\(Yiroom, 이하 "서비스"\)/i)).toBeInTheDocument();
    // 현행 서비스 정의: 다섯 가지 분석 (운동·영양/소셜은 ADR-098로 제공 목록에서 제외)
    expect(
      screen.getByText(/AI 퍼스널컬러 진단, 피부·체형·헤어·메이크업 분석/i)
    ).toBeInTheDocument();
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
