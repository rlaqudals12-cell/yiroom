import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import HelpPage from '@/app/(main)/help/page';

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
    ArrowLeft: MockIcon,
    HelpCircle: MockIcon,
    MessageSquare: MockIcon,
    Mail: MockIcon,
    FileText: MockIcon,
    Shield: MockIcon,
    Bell: MockIcon,
    ChevronRight: MockIcon,
    ExternalLink: MockIcon,
  };
});

// Mock AppVersion component
vi.mock('@/components/settings', () => ({
  AppVersion: () => <div data-testid="app-version">v1.0.0</div>,
}));

describe('HelpPage', () => {
  it('renders the page with correct test id', () => {
    render(<HelpPage />);
    expect(screen.getByTestId('help-page')).toBeInTheDocument();
  });

  it('displays the page title', () => {
    render(<HelpPage />);
    // h1 heading in the header contains "고객센터"
    const headings = screen.getAllByRole('heading');
    const mainTitle = headings.find(
      (h) => h.tagName === 'H1' && h.textContent?.includes('고객센터')
    );
    expect(mainTitle).toBeTruthy();
  });

  it('has a back link to dashboard', () => {
    render(<HelpPage />);
    const backLink = screen.getByRole('link', { name: /대시보드로 돌아가기/i });
    expect(backLink).toHaveAttribute('href', '/dashboard');
  });

  describe('Help Menu Section', () => {
    it('displays help section title', () => {
      render(<HelpPage />);
      expect(screen.getByText('도움말')).toBeInTheDocument();
    });

    it('renders FAQ menu item', () => {
      render(<HelpPage />);
      expect(screen.getByTestId('help-menu-faq')).toBeInTheDocument();
      expect(screen.getByText('자주 묻는 질문')).toBeInTheDocument();
      expect(screen.getByText('궁금한 점을 빠르게 확인하세요')).toBeInTheDocument();
    });

    it('renders feedback menu item', () => {
      render(<HelpPage />);
      expect(screen.getByTestId('help-menu-feedback')).toBeInTheDocument();
      expect(screen.getByText('피드백 / 건의하기')).toBeInTheDocument();
    });

    it('renders announcements menu item', () => {
      render(<HelpPage />);
      expect(screen.getByTestId('help-menu-announcements')).toBeInTheDocument();
      expect(screen.getByText('공지사항')).toBeInTheDocument();
    });

    it('renders email contact menu item with external link', () => {
      render(<HelpPage />);
      const emailItem = screen.getByTestId('help-menu-contact');
      expect(emailItem).toBeInTheDocument();
      expect(screen.getByText('이메일 문의')).toBeInTheDocument();
      expect(screen.getByText('support@yiroom.app')).toBeInTheDocument();
      expect(emailItem).toHaveAttribute('href', 'mailto:support@yiroom.app');
      expect(emailItem).toHaveAttribute('target', '_blank');
    });
  });

  describe('Legal Menu Section', () => {
    it('displays legal section title', () => {
      render(<HelpPage />);
      expect(screen.getByText('약관 및 정책')).toBeInTheDocument();
    });

    it('renders terms menu item', () => {
      render(<HelpPage />);
      expect(screen.getByTestId('help-menu-terms')).toBeInTheDocument();
      expect(screen.getByText('이용약관')).toBeInTheDocument();
    });

    it('renders privacy policy menu item', () => {
      render(<HelpPage />);
      expect(screen.getByTestId('help-menu-privacy')).toBeInTheDocument();
      expect(screen.getByText('개인정보처리방침')).toBeInTheDocument();
    });

    it('links to correct pages', () => {
      render(<HelpPage />);
      const termsLink = screen.getByTestId('help-menu-terms');
      const privacyLink = screen.getByTestId('help-menu-privacy');

      expect(termsLink).toHaveAttribute('href', '/terms');
      expect(privacyLink).toHaveAttribute('href', '/privacy-policy');
    });
  });

  describe('Operating Hours Section', () => {
    it('displays operating hours information', () => {
      render(<HelpPage />);
      expect(screen.getByText('고객센터 운영 안내')).toBeInTheDocument();
      expect(screen.getByText(/평일 10:00 - 18:00/i)).toBeInTheDocument();
      expect(screen.getByText(/최대 2영업일/i)).toBeInTheDocument();
    });
  });

  describe('App Version Section', () => {
    it('displays app version component', () => {
      render(<HelpPage />);
      expect(screen.getByTestId('app-version')).toBeInTheDocument();
    });
  });
});
