'use client';

/**
 * Home State: New (분석 0개)
 *
 * 감정 목표: "와, 깔끔하다" (Visceral)
 * 정보 블록: 3개 (히어로 + 설문 대안 + 최근 본 제품)
 */

import NewUserHero from './NewUserHero';
import HomeRecentlyViewed from './HomeRecentlyViewed';

export default function HomeStateNew() {
  return (
    <div className="space-y-5" data-testid="home-state-new">
      {/* 히어로 + Social Proof + CTA (정보 블록 1-2) */}
      <NewUserHero />

      {/* 최근 본 제품 — 비로그인/신규도 표시 가능 (정보 블록 3) */}
      <HomeRecentlyViewed />
    </div>
  );
}
