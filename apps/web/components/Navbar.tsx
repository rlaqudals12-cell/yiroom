'use client';

import { SignedOut, SignInButton, SignedIn, UserButton } from "@clerk/nextjs";
import Link from "next/link";
import React from "react";
import { Heart, ChevronDown, Palette, Sparkles, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/ThemeToggle";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const Navbar = () => {
  return (
    <header
      className="flex justify-between items-center p-4 gap-4 h-16 max-w-7xl mx-auto"
      role="banner"
    >
      <Link
        href="/"
        className="text-2xl font-bold text-gradient-brand focus:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 rounded"
        aria-label="이룸 홈으로 이동"
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
              <DropdownMenuContent align="start">
                <DropdownMenuItem asChild>
                  <Link href="/analysis/personal-color" className="flex items-center gap-2 cursor-pointer">
                    <Palette className="h-4 w-4 text-pink-500" />
                    퍼스널 컬러
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link href="/analysis/skin" className="flex items-center gap-2 cursor-pointer">
                    <Sparkles className="h-4 w-4 text-emerald-500" />
                    피부 분석
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link href="/analysis/body" className="flex items-center gap-2 cursor-pointer">
                    <User className="h-4 w-4 text-blue-500" />
                    체형 분석
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
          <UserButton />
        </SignedIn>
      </div>
    </header>
  );
};

export default Navbar;
