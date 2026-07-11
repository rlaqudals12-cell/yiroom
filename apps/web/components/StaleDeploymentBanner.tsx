'use client';

import { useEffect, useState } from 'react';
import { AlertTriangle, ArrowRight } from 'lucide-react';

/**
 * 옛 배포(프리뷰 스냅샷) 경고 배너
 *
 * Vercel 프리뷰 URL(yiroom-<hash>-xcs-projects-….vercel.app)은 그날의 코드로
 * 영구 고정된 스냅샷이라, 북마크로 그 URL에 들어오면 최신 수정이 안 보인다
 * (이미지 깨짐·추천 0개 등 옛 버그가 그대로). 정식 도메인으로 안내한다.
 *
 * 정식 = yiroom.vercel.app. 프리뷰 = 'yiroom-'로 시작하는 하위 도메인.
 */
const CANONICAL_HOST = 'yiroom.vercel.app';

function isStalePreviewHost(host: string): boolean {
  // 정식 도메인·로컬·커스텀 도메인은 제외. 'yiroom-…'.vercel.app 형태만 프리뷰로 본다.
  if (host === CANONICAL_HOST) return false;
  if (host === 'localhost' || host.startsWith('127.') || host.endsWith('.local')) return false;
  return /^yiroom-.+\.vercel\.app$/.test(host);
}

export function StaleDeploymentBanner() {
  const [stale, setStale] = useState(false);

  useEffect(() => {
    setStale(isStalePreviewHost(window.location.hostname));
  }, []);

  if (!stale) return null;

  const canonicalUrl = `https://${CANONICAL_HOST}${window.location.pathname}${window.location.search}`;

  return (
    <div
      className="fixed top-0 left-0 right-0 z-[60] flex items-center justify-center gap-2 bg-amber-500 px-4 py-2.5 text-sm font-medium text-white"
      role="alert"
      aria-live="polite"
      data-testid="stale-deployment-banner"
    >
      <AlertTriangle className="h-4 w-4 flex-shrink-0" />
      <span>옛 버전을 보고 있어요. 최신 버전에서 다시 확인해 주세요.</span>
      <a
        href={canonicalUrl}
        className="ml-1 inline-flex items-center gap-1 rounded-full bg-white/25 px-3 py-1 font-semibold hover:bg-white/35"
      >
        최신으로 이동
        <ArrowRight className="h-3.5 w-3.5" />
      </a>
    </div>
  );
}

export { isStalePreviewHost };
export default StaleDeploymentBanner;
