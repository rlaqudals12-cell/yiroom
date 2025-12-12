'use client';

import { SignedOut, SignInButton, SignedIn, UserButton } from "@clerk/nextjs";
import Link from "next/link";
import React from "react";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/ThemeToggle";

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
          <ThemeToggle compact />
          <UserButton />
        </SignedIn>
      </div>
    </header>
  );
};

export default Navbar;
