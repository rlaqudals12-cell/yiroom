'use client';

import { SignedOut, SignInButton, SignedIn, UserButton } from '@clerk/nextjs';
import Link from 'next/link';
import { useTransition } from 'react';
import { useLocale } from 'next-intl';
import {
  Heart,
  ChevronDown,
  Palette,
  Sparkles,
  Scissors,
  Wand2,
  Activity,
  PersonStanding,
  SmilePlus,
  BarChart3,
  LayoutGrid,
  Apple,
  Search,
  Droplets,
  UtensilsCrossed,
  Dumbbell,
  ClipboardList,
  StretchHorizontal,
  Target,
  TrendingUp,
  Gem,
  Box,
  Globe,
  Check,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useRouter } from 'next/navigation';
import { ThemeToggle } from '@/components/ThemeToggle';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
  DropdownMenuLabel,
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
  return (
    <header
      className="flex justify-between items-center p-4 gap-4 h-16 max-w-7xl mx-auto"
      role="banner"
    >
      <Link
        href="/"
        className="text-2xl font-bold focus:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 rounded"
        aria-label="이룸 홈으로 이동"
        style={{
          background: 'linear-gradient(to right, #f9a8d4, #e879f9, #a855f7)',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
          backgroundClip: 'text',
        }}
      >
        이룸
      </Link>
      <div className="flex gap-4 items-center">
        <SignedOut>
          <NavLocaleSwitcher />
          <ThemeToggle compact />
          <SignInButton mode="modal">
            <Button>로그인</Button>
          </SignInButton>
        </SignedOut>
        <SignedIn>
          <nav
            className="hidden md:flex items-center gap-4"
            aria-label="주요 메뉴"
            role="navigation"
          >
            <Link
              href="/dashboard"
              className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 rounded px-1"
            >
              대시보드
            </Link>
            {/* 분석 드롭다운 메뉴 */}
            <DropdownMenu>
              <DropdownMenuTrigger className="flex items-center gap-1 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 rounded px-1">
                분석
                <ChevronDown className="h-3 w-3" />
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start" className="w-56">
                {/* 뷰티 카테고리 */}
                <DropdownMenuLabel className="text-xs text-muted-foreground">
                  뷰티
                </DropdownMenuLabel>
                <DropdownMenuItem asChild>
                  <Link
                    href="/analysis/personal-color"
                    className="flex items-center gap-2 cursor-pointer"
                  >
                    <Palette className="h-4 w-4 text-pink-500" />
                    퍼스널 컬러
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link href="/analysis/skin" className="flex items-center gap-2 cursor-pointer">
                    <Sparkles className="h-4 w-4 text-blue-400" />
                    피부 분석
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link href="/analysis/makeup" className="flex items-center gap-2 cursor-pointer">
                    <Wand2 className="h-4 w-4 text-fuchsia-500" />
                    메이크업
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link href="/analysis/hair" className="flex items-center gap-2 cursor-pointer">
                    <Scissors className="h-4 w-4 text-amber-500" />
                    헤어 분석
                  </Link>
                </DropdownMenuItem>

                <DropdownMenuSeparator />

                {/* 건강 카테고리 */}
                <DropdownMenuLabel className="text-xs text-muted-foreground">
                  건강
                </DropdownMenuLabel>
                <DropdownMenuItem asChild>
                  <Link href="/analysis/body" className="flex items-center gap-2 cursor-pointer">
                    <Activity className="h-4 w-4 text-violet-500" />
                    체형 분석
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link href="/analysis/posture" className="flex items-center gap-2 cursor-pointer">
                    <PersonStanding className="h-4 w-4 text-sky-500" />
                    자세 분석
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link
                    href="/analysis/oral-health"
                    className="flex items-center gap-2 cursor-pointer"
                  >
                    <SmilePlus className="h-4 w-4 text-emerald-500" />
                    구강 건강
                  </Link>
                </DropdownMenuItem>

                <DropdownMenuSeparator />

                {/* 내 분석 결과 + 허브 */}
                <DropdownMenuItem asChild>
                  <Link href="/dashboard" className="flex items-center gap-2 cursor-pointer">
                    <BarChart3 className="h-4 w-4 text-primary" />내 분석 결과 보기
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link href="/analysis" className="flex items-center gap-2 cursor-pointer">
                    <LayoutGrid className="h-4 w-4 text-primary" />
                    분석 허브 전체보기
                  </Link>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
            {/* 영양 드롭다운 메뉴 */}
            <DropdownMenu>
              <DropdownMenuTrigger className="flex items-center gap-1 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 rounded px-1">
                영양
                <ChevronDown className="h-3 w-3" />
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start" className="w-48">
                <DropdownMenuItem asChild>
                  <Link href="/nutrition" className="flex items-center gap-2 cursor-pointer">
                    <Apple className="h-4 w-4 text-green-500" />
                    영양 홈
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild>
                  <Link href="/nutrition/recipe" className="flex items-center gap-2 cursor-pointer">
                    <UtensilsCrossed className="h-4 w-4 text-orange-500" />
                    레시피
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link href="/nutrition/water" className="flex items-center gap-2 cursor-pointer">
                    <Droplets className="h-4 w-4 text-blue-400" />물 섭취
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link href="/nutrition/search" className="flex items-center gap-2 cursor-pointer">
                    <Search className="h-4 w-4 text-gray-500" />
                    음식 검색
                  </Link>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
            {/* 운동 드롭다운 메뉴 */}
            <DropdownMenu>
              <DropdownMenuTrigger className="flex items-center gap-1 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 rounded px-1">
                운동
                <ChevronDown className="h-3 w-3" />
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start" className="w-48">
                <DropdownMenuItem asChild>
                  <Link href="/workout" className="flex items-center gap-2 cursor-pointer">
                    <Dumbbell className="h-4 w-4 text-violet-500" />
                    운동 홈
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild>
                  <Link href="/workout/log" className="flex items-center gap-2 cursor-pointer">
                    <ClipboardList className="h-4 w-4 text-indigo-500" />
                    운동 로그
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link
                    href="/workout/stretching"
                    className="flex items-center gap-2 cursor-pointer"
                  >
                    <StretchHorizontal className="h-4 w-4 text-teal-500" />
                    스트레칭
                  </Link>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
            {/* 리포트 드롭다운 메뉴 */}
            <DropdownMenu>
              <DropdownMenuTrigger className="flex items-center gap-1 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 rounded px-1">
                리포트
                <ChevronDown className="h-3 w-3" />
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start" className="w-48">
                <DropdownMenuItem asChild>
                  <Link href="/reports" className="flex items-center gap-2 cursor-pointer">
                    <BarChart3 className="h-4 w-4 text-primary" />
                    리포트 홈
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild>
                  <Link
                    href="/reports/weight-goal"
                    className="flex items-center gap-2 cursor-pointer"
                  >
                    <Target className="h-4 w-4 text-rose-500" />
                    체중 목표
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link
                    href="/reports/body-progress"
                    className="flex items-center gap-2 cursor-pointer"
                  >
                    <TrendingUp className="h-4 w-4 text-emerald-500" />
                    체형 변화
                  </Link>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
            <Link
              href="/products"
              className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 rounded px-1"
            >
              제품
            </Link>
            <Link
              href="/capsule"
              className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 rounded px-1"
            >
              <span className="flex items-center gap-1">
                <Box className="h-3.5 w-3.5" />
                캡슐
              </span>
            </Link>
            <Link
              href="/badges"
              className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 rounded px-1"
            >
              <span className="flex items-center gap-1">
                <Gem className="h-3.5 w-3.5" />
                뱃지
              </span>
            </Link>
          </nav>
          <Link
            href="/wishlist"
            className="p-2 rounded-full text-muted-foreground hover:text-pink-500 hover:bg-pink-50 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-primary"
            aria-label="위시리스트"
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
              나
            </Link>
          </div>
        </SignedIn>
      </div>
    </header>
  );
};

export default Navbar;
