import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import PrivacyPolicyPage from '@/app/(main)/privacy-policy/page';

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

describe('PrivacyPolicyPage', () => {
  it('renders the page with correct test id', () => {
    render(<PrivacyPolicyPage />);
    expect(screen.getByTestId('privacy-policy-page')).toBeInTheDocument();
  });

  it('displays the page title', () => {
    render(<PrivacyPolicyPage />);
    expect(screen.getByRole('heading', { name: /개인정보처리방침/i })).toBeInTheDocument();
  });

  it('shows the last modified date and effective date', () => {
    render(<PrivacyPolicyPage />);
    expect(screen.getByText(/최종 수정일.*시행일/i)).toBeInTheDocument();
  });

  it('renders all privacy sections', () => {
    render(<PrivacyPolicyPage />);

    // 9개 섹션
    expect(screen.getByText('1. 개인정보 수집 및 이용 목적')).toBeInTheDocument();
    expect(screen.getByText('2. 수집하는 개인정보 항목')).toBeInTheDocument();
    expect(screen.getByText('3. 개인정보 보유 및 이용 기간')).toBeInTheDocument();
    expect(screen.getByText('4. 개인정보 제3자 제공')).toBeInTheDocument();
    expect(screen.getByText('5. 개인정보 처리 위탁')).toBeInTheDocument();
    expect(screen.getByText('6. 정보주체의 권리')).toBeInTheDocument();
    expect(screen.getByText('7. 개인정보 보호 조치')).toBeInTheDocument();
    expect(screen.getByText('8. 개인정보 보호책임자')).toBeInTheDocument();
    expect(screen.getByText('9. 개인정보 처리방침 변경')).toBeInTheDocument();
  });

  it('includes PIPA compliance statement', () => {
    render(<PrivacyPolicyPage />);
    expect(screen.getByText(/개인정보보호법\(PIPA\)/i)).toBeInTheDocument();
  });

  it('has a back link to help page', () => {
    render(<PrivacyPolicyPage />);
    const backLink = screen.getByRole('link', { name: /고객센터로 돌아가기/i });
    expect(backLink).toHaveAttribute('href', '/help');
  });

  it('displays data collection items', () => {
    render(<PrivacyPolicyPage />);
    expect(screen.getByText(/이메일 주소, 이름, 프로필 사진/i)).toBeInTheDocument();
    expect(screen.getByText(/얼굴\/신체 이미지/i)).toBeInTheDocument();
  });

  it('displays data processing partners', () => {
    render(<PrivacyPolicyPage />);
    // Supabase appears multiple times (in processing section and security section)
    expect(screen.getAllByText(/Supabase/i).length).toBeGreaterThan(0);
    expect(screen.getByText(/Google \(Gemini API\)/i)).toBeInTheDocument();
    expect(screen.getByText(/Clerk/i)).toBeInTheDocument();
  });

  it('displays user rights information', () => {
    render(<PrivacyPolicyPage />);
    expect(screen.getByText(/개인정보 열람 요청/i)).toBeInTheDocument();
    expect(screen.getByText(/개인정보 삭제 요청/i)).toBeInTheDocument();
    expect(screen.getByText(/동의 철회/i)).toBeInTheDocument();
  });

  it('displays security measures', () => {
    render(<PrivacyPolicyPage />);
    expect(screen.getByText(/TLS.*AES-256/i)).toBeInTheDocument();
    expect(screen.getByText(/Supabase RLS/i)).toBeInTheDocument();
  });

  it('displays privacy officer contact', () => {
    render(<PrivacyPolicyPage />);
    expect(screen.getByText(/privacy@yiroom.app/i)).toBeInTheDocument();
  });
});
