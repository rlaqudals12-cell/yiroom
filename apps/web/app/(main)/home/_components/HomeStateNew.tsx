'use client';

/**
 * Home State: New (분석 0개)
 *
 * ADR-114: "첫 미팅" — 전속 뷰티팀을 만나 통합 분석으로 시작.
 * 온보딩을 스킵한 사용자를 위한 진입점(통합 분석 CTA 유지).
 */

import NewUserHero from './NewUserHero';

export default function HomeStateNew() {
  return (
    <div className="space-y-5" data-testid="home-state-new">
      {/* 히어로 + 통합 분석 CTA (첫 미팅) */}
      <NewUserHero />
    </div>
  );
}
