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

  it('생체 분석 이미지의 보유기간을 1년 상한과 조기 파기로 일관되게 고지한다', async () => {
    render(await PrivacyPolicyPage({ searchParams: Promise.resolve({ lang: 'ko' }) }));

    expect(screen.getByText(/저장 동의 시 동의일로부터 1년간 보관 후 자동 파기/)).toHaveTextContent(
      /동의 철회·삭제 요청 또는 회원 탈퇴 시 즉시 파기/
    );
    expect(screen.queryByText(/삭제 요청 또는 회원 탈퇴 시까지/)).not.toBeInTheDocument();
  });

  it('영문 생체정보 보유기간도 1년 상한과 철회 시 조기 파기로 고지한다', async () => {
    render(await PrivacyPolicyPage({ searchParams: Promise.resolve({ lang: 'en' }) }));

    expect(
      screen.getByText(/destroyed earlier upon withdrawal, deletion request, or account deletion/)
    ).toHaveTextContent(/retained for 1 year from the consent date/);
    expect(
      screen.queryByText(/Until deletion request or account deletion/)
    ).not.toBeInTheDocument();
  });

  it('한·영문 생체정보 항목에 헤어·메이크업 분석 이미지를 고지한다', async () => {
    const { unmount } = render(
      await PrivacyPolicyPage({ searchParams: Promise.resolve({ lang: 'ko' }) })
    );

    expect(screen.getByText(/피부·메이크업 분석용 얼굴 이미지/)).toHaveTextContent(
      /헤어 분석용 모발·두피 이미지/
    );
    expect(screen.getByText(/AI 기반 피부\/체형\/퍼스널컬러\/헤어\/메이크업 분석/)).toBeVisible();

    unmount();
    render(await PrivacyPolicyPage({ searchParams: Promise.resolve({ lang: 'en' }) }));

    expect(screen.getByText(/Facial images for skin and makeup analysis/)).toHaveTextContent(
      /hair and scalp images for hair analysis/
    );
    expect(screen.getByText(/personal color, hair, and makeup analysis/)).toBeVisible();
  });
});
