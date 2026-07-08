'use client';

/**
 * 온보딩 헤더 (가입 = 첫 미팅) — ADR-114
 *
 * 통합분석 페이지가 `?onboarding=1`로 진입했을 때만 상단에 렌더.
 * 기존 분석 플로우는 그대로 두고, "전속 뷰티팀 첫 미팅" 맥락만 얹는다.
 * 파라미터가 없으면 아무것도 렌더하지 않는다(일반 재분석 진입).
 */

import Link from 'next/link';
import { useSearchParams } from 'next/navigation';

export function OnboardingHeader(): React.JSX.Element | null {
  const searchParams = useSearchParams();
  const isOnboarding = searchParams.get('onboarding') === '1';

  if (!isOnboarding) {
    return null;
  }

  return (
    <section
      className="rounded-2xl border border-pink-500/30 bg-pink-500/5 px-5 py-4"
      data-testid="onboarding-header"
    >
      <p className="text-base font-semibold text-white">첫 미팅이에요 👋</p>
      <p className="mt-1.5 text-sm leading-relaxed text-zinc-300">
        사진 한 번이면 전속 뷰티팀(스타일리스트·컨설턴트·피부 관리사)이 당신을 파악해요. 5분이면
        충분해요.
      </p>
      <Link
        href="/home"
        className="mt-3 inline-block text-xs text-zinc-400 underline underline-offset-2 hover:text-zinc-200"
        data-testid="onboarding-skip-link"
      >
        나중에 할게요
      </Link>
    </section>
  );
}
