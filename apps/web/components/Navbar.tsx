'use client';

import { SignedOut, SignInButton, SignedIn, UserButton } from '@clerk/nextjs';
import Link from 'next/link';
import React from 'react';
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
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ThemeToggle } from '@/components/ThemeToggle';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
  DropdownMenuLabel,
} from '@/components/ui/dropdown-menu';

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
            <Link
              href="/nutrition"
              className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 rounded px-1"
            >
              영양
            </Link>
            <Link
              href="/workout"
              className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 rounded px-1"
            >
              운동
            </Link>
            <Link
              href="/reports"
              className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 rounded px-1"
            >
              리포트
            </Link>
            <Link
              href="/products"
              className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 rounded px-1"
            >
              제품
            </Link>
          </nav>
          <Link
            href="/wishlist"
            className="p-2 rounded-full text-muted-foreground hover:text-pink-500 hover:bg-pink-50 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-primary"
            aria-label="위시리스트"
          >
            <Heart className="h-5 w-5" />
          </Link>
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
