import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { AgreementHistory } from '@/components/settings/AgreementHistory';

// Mock Clerk
vi.mock('@clerk/nextjs', () => ({
  useAuth: vi.fn(() => ({ isSignedIn: true, isLoaded: true })),
}));

// Mock Next.js Link
vi.mock('next/link', () => ({
  default: ({ children, href, ...props }: { children: React.ReactNode; href: string }) => (
    <a href={href} {...props}>
      {children}
    </a>
  ),
}));

// Mock lucide-react icons
vi.mock('lucide-react', async (importOriginal) => {
  const actual = await importOriginal<typeof import('lucide-react')>();
  const MockIcon = ({ className, ...props }: { className?: string }) => (
    <span className={className} {...props}>
      Icon
    </span>
  );
  return {
    ...actual,
    FileText: MockIcon,
    Shield: MockIcon,
    CheckCircle: MockIcon,
    XCircle: MockIcon,
    ChevronRight: MockIcon,
    Loader2: MockIcon,
  };
});

// Mock Supabase client
const mockSelect = vi.fn();
const mockMaybeSingle = vi.fn();

vi.mock('@/lib/supabase/clerk-client', () => ({
  useClerkSupabaseClient: vi.fn(() => ({
    from: () => ({
      select: mockSelect.mockReturnValue({
        maybeSingle: mockMaybeSingle,
      }),
    }),
  })),
}));

describe('AgreementHistory', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders loading state initially', () => {
    mockMaybeSingle.mockResolvedValue({ data: null, error: null });
    render(<AgreementHistory />);

    // 로딩 상태가 표시됨
    expect(screen.getByTestId('agreement-history-loading')).toBeInTheDocument();
  });

  it('renders agreement history after loading', async () => {
    mockMaybeSingle.mockResolvedValue({
      data: {
        terms_agreed: true,
        terms_agreed_at: '2026-01-01T00:00:00Z',
        terms_version: 'v1.0',
        privacy_agreed: true,
        privacy_agreed_at: '2026-01-01T00:00:00Z',
        privacy_version: 'v1.0',
        marketing_agreed: false,
        marketing_agreed_at: null,
        created_at: '2026-01-01T00:00:00Z',
      },
      error: null,
    });

    render(<AgreementHistory />);

    // 데이터 로딩 후 표시
    await vi.waitFor(() => {
      expect(screen.getByTestId('agreement-history')).toBeInTheDocument();
    });

    expect(screen.getByText('약관 동의 내역')).toBeInTheDocument();
    expect(screen.getByText('이용약관')).toBeInTheDocument();
    expect(screen.getByText('개인정보처리방침')).toBeInTheDocument();
  });

  it('displays agreement dates correctly', async () => {
    mockMaybeSingle.mockResolvedValue({
      data: {
        terms_agreed: true,
        terms_agreed_at: '2026-01-15T00:00:00Z',
        terms_version: 'v1.0',
        privacy_agreed: true,
        privacy_agreed_at: '2026-01-15T00:00:00Z',
        privacy_version: 'v1.0',
        marketing_agreed: false,
        marketing_agreed_at: null,
        created_at: '2026-01-15T00:00:00Z',
      },
      error: null,
    });

    render(<AgreementHistory />);

    await vi.waitFor(() => {
      expect(screen.getByTestId('agreement-history')).toBeInTheDocument();
    });

    // 날짜가 한국어 형식으로 표시됨
    expect(screen.getAllByText(/2026년 1월 15일/)).toHaveLength(2);
  });

  it('shows links to terms and privacy policy pages', async () => {
    mockMaybeSingle.mockResolvedValue({
      data: {
        terms_agreed: true,
        terms_agreed_at: '2026-01-01T00:00:00Z',
        terms_version: 'v1.0',
        privacy_agreed: true,
        privacy_agreed_at: '2026-01-01T00:00:00Z',
        privacy_version: 'v1.0',
        marketing_agreed: false,
        marketing_agreed_at: null,
        created_at: '2026-01-01T00:00:00Z',
      },
      error: null,
    });

    render(<AgreementHistory />);

    await vi.waitFor(() => {
      expect(screen.getByTestId('agreement-history')).toBeInTheDocument();
    });

    const links = screen.getAllByRole('link');
    const termsLink = links.find((link) => link.getAttribute('href') === '/terms');
    const privacyLink = links.find((link) => link.getAttribute('href') === '/privacy-policy');

    expect(termsLink).toBeInTheDocument();
    expect(privacyLink).toBeInTheDocument();
  });

  it('shows help center button', async () => {
    mockMaybeSingle.mockResolvedValue({
      data: {
        terms_agreed: true,
        terms_agreed_at: '2026-01-01T00:00:00Z',
        terms_version: 'v1.0',
        privacy_agreed: true,
        privacy_agreed_at: '2026-01-01T00:00:00Z',
        privacy_version: 'v1.0',
        marketing_agreed: false,
        marketing_agreed_at: null,
        created_at: '2026-01-01T00:00:00Z',
      },
      error: null,
    });

    render(<AgreementHistory />);

    await vi.waitFor(() => {
      expect(screen.getByTestId('agreement-history')).toBeInTheDocument();
    });

    const helpLink = screen.getByRole('link', { name: /고객센터 문의하기/i });
    expect(helpLink).toHaveAttribute('href', '/help');
  });

  it('handles null agreement data gracefully', async () => {
    mockMaybeSingle.mockResolvedValue({
      data: null,
      error: null,
    });

    render(<AgreementHistory />);

    await vi.waitFor(() => {
      expect(screen.getByTestId('agreement-history')).toBeInTheDocument();
    });

    // 기본값으로 동의 상태 표시
    expect(screen.getByText('이용약관')).toBeInTheDocument();
    expect(screen.getByText('개인정보처리방침')).toBeInTheDocument();
  });
});
