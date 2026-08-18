'use client';

import { SignedOut, SignInButton, SignedIn, UserButton } from '@clerk/nextjs';
import Link from 'next/link';
import { useTransition } from 'react';
import { useLocale, useTranslations } from 'next-intl';
import { Bell, Check, Globe, Heart, Search } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useRouter } from 'next/navigation';
import { ThemeToggle } from '@/components/ThemeToggle';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { locales, localeNames, type Locale } from '@/i18n/config';
import { setLocaleCookie } from '@/lib/utils/locale';

// 헤더용 언어 선택 드롭다운
function NavLocaleSwitcher(): React.JSX.Element {
  const locale = useLocale();
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const handleChange = (newLocale: Locale): void => {
    setLocaleCookie(newLocale);
    startTransition(() => {
      router.refresh();
    });
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        className="p-2 rounded-full text-muted-foreground hover:text-foreground hover:bg-muted transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-primary"
        aria-label="Language"
        disabled={isPending}
      >
        <Globe className="h-5 w-5" />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-36">
        {locales.map((l) => (
          <DropdownMenuItem
            key={l}
            onClick={() => handleChange(l)}
            className="flex items-center justify-between cursor-pointer"
          >
            {localeNames[l]}
            {locale === l && <Check className="h-4 w-4 text-primary" />}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

const Navbar = () => {
  // 헤더 네비게이션 라벨 i18n (messages/*.json의 nav)
  const t = useTranslations('nav');
  // 홈 전용 헤더에서 글로벌 유틸로 옮긴 접근성 라벨은 기존 번역을 재사용한다.
  const homeT = useTranslations('home');

  return (
    <header
      className="flex justify-between items-center p-4 gap-4 h-16 max-w-7xl mx-auto"
      role="banner"
    >
      {/* 공유카드 워드마크(Yiroom 세리프 잉크)와 동일 문법 — 브랜드 마크 1종 렌더 */}
      <Link
        href="/"
        className="text-2xl font-serif font-semibold text-foreground focus:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 rounded"
        aria-label={t('homeAria')}
      >
        이룸
      </Link>
      <div className="flex gap-4 items-center">
        <SignedOut>
          <NavLocaleSwitcher />
          <ThemeToggle compact />
          <SignInButton mode="modal">
            <Button>{t('signIn')}</Button>
          </SignInButton>
        </SignedOut>
        <SignedIn>
          {/* 5탭 단일 IA (ADR-114) — 모바일 BottomNav와 동일 5항목.
              [나]는 우측 프로필 아바타 클러스터가 담당(중복 방지) → 여기선 4개. */}
          <nav
            className="hidden md:flex items-center gap-5"
            aria-label={t('mainMenu')}
            role="navigation"
          >
            <Link
              href="/home"
              className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 rounded px-1"
            >
              {t('today')}
            </Link>
            <Link
              href="/coach"
              className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 rounded px-1"
            >
              {t('coach')}
            </Link>
            <Link
              href="/beauty"
              className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 rounded px-1"
            >
              {t('beauty')}
            </Link>
            <Link
              href="/style"
              className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 rounded px-1"
            >
              {t('style')}
            </Link>
          </nav>
          <Link
            href="/notifications"
            className="hidden md:inline-flex p-2 rounded-full text-muted-foreground hover:text-foreground hover:bg-muted transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-primary"
            aria-label={homeT('notificationLabel')}
          >
            <Bell className="h-5 w-5" aria-hidden="true" />
          </Link>
          <Link
            href="/search"
            className="hidden md:inline-flex p-2 rounded-full text-muted-foreground hover:text-foreground hover:bg-muted transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-primary"
            aria-label={homeT('searchLabel')}
          >
            <Search className="h-5 w-5" aria-hidden="true" />
          </Link>
          <Link
            href="/wishlist"
            className="p-2 rounded-full text-muted-foreground hover:text-foreground hover:bg-muted transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-primary"
            aria-label={t('wishlist')}
          >
            <Heart className="h-5 w-5" />
          </Link>
          <NavLocaleSwitcher />
          <ThemeToggle compact />
          {/* 프로필 영역: 아바타 + "나" 레이블 */}
          <div className="flex flex-col items-center gap-0.5">
            <UserButton />
            <Link
              href="/profile"
              className="text-[10px] font-medium text-muted-foreground hover:text-foreground transition-colors"
            >
              {t('me')}
            </Link>
          </div>
        </SignedIn>
      </div>
    </header>
  );
};

export default Navbar;
