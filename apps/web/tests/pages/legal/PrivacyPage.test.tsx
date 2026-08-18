import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import PrivacyPolicyPage from '@/app/privacy/page';

vi.mock('next/link', () => ({
  default: ({
    children,
    href,
    prefetch: _prefetch,
    ...props
  }: {
    children: React.ReactNode;
    href: string;
    prefetch?: boolean;
    lang?: string;
    'aria-current'?: 'page';
  }) => (
    <a href={href} {...props}>
      {children}
    </a>
  ),
}));

describe('PrivacyPolicyPage', () => {
  it('지원하지 않는 언어는 서버에서 한국어로 제한한다', async () => {
    render(await PrivacyPolicyPage({ searchParams: Promise.resolve({ lang: 'invalid' }) }));

    expect(screen.getByRole('heading', { name: '개인정보처리방침' })).toBeInTheDocument();
    expect(screen.getByTestId('privacy-page')).toHaveAttribute('lang', 'ko');
  });

  it('lang=en 쿼리는 영어 문서와 현재 언어 상태를 렌더링한다', async () => {
    render(await PrivacyPolicyPage({ searchParams: Promise.resolve({ lang: 'en' }) }));

    expect(screen.getByRole('heading', { name: 'Privacy Policy' })).toBeInTheDocument();
    expect(screen.getByTestId('privacy-page')).toHaveAttribute('lang', 'en');
    expect(screen.getByRole('link', { name: 'View in English' })).toHaveAttribute(
      'aria-current',
      'page'
    );
  });
});
