'use client';

import { useRouter } from 'next/navigation';
import { useAnalysisStatus } from '@/hooks/useAnalysisStatus';

/**
 * 홈 오늘의 추천 - Client Component
 * 기존 사용자만 표시 (분석 완료 후)
 */
export default function HomeTodayRecommendation() {
  const router = useRouter();
  const { isLoading, isNewUser } = useAnalysisStatus();

  // 로딩 중이거나 신규 사용자면 렌더링 안 함
  if (isLoading || isNewUser) {
    return null;
  }

  return (
    <section
      aria-label="오늘의 맞춤 추천"
      className="animate-fade-in-up animation-delay-200"
    >
      <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-3 flex items-center gap-2">
        {/* Sparkles 아이콘 - 인라인 SVG */}
        <svg
          className="w-5 h-5 text-amber-500"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
          strokeWidth={2}
          aria-hidden="true"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M9.813 15.904 9 18.75l-.813-2.846a4.5 4.5 0 0 0-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 0 0 3.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 0 0 3.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 0 0-3.09 3.09ZM18.259 8.715 18 9.75l-.259-1.035a3.375 3.375 0 0 0-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 0 0 2.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 0 0 2.456 2.456L21.75 6l-1.035.259a3.375 3.375 0 0 0-2.456 2.456ZM16.894 20.567 16.5 21.75l-.394-1.183a2.25 2.25 0 0 0-1.423-1.423L13.5 18.75l1.183-.394a2.25 2.25 0 0 0 1.423-1.423l.394-1.183.394 1.183a2.25 2.25 0 0 0 1.423 1.423l1.183.394-1.183.394a2.25 2.25 0 0 0-1.423 1.423Z"
          />
        </svg>
        오늘의 추천
      </h3>
      <div className="grid grid-cols-2 gap-3">
        {/* 피부 맞춤 추천 */}
        <button
          onClick={() => router.push('/beauty')}
          className="group relative bg-white/60 dark:bg-slate-800/60 backdrop-blur-xl rounded-2xl border border-white/50 dark:border-slate-700/50 p-4 text-left hover:shadow-lg hover:shadow-pink-500/10 hover:scale-[1.02] transition-all duration-300 overflow-hidden"
          aria-label="피부 맞춤 제품 추천 보기"
        >
          <div className="absolute top-0 right-0 w-20 h-20 bg-gradient-to-br from-pink-400/20 to-rose-400/20 rounded-full blur-2xl" />
          <div className="relative">
            <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-pink-400 to-rose-500 flex items-center justify-center mb-3 shadow-lg shadow-pink-500/30">
              {/* Droplet 아이콘 */}
              <svg
                className="w-5 h-5 text-white"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                strokeWidth={2}
                aria-hidden="true"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M12 21a9.004 9.004 0 0 0 8.716-6.747M12 21a9.004 9.004 0 0 1-8.716-6.747M12 21c2.485 0 4.5-4.03 4.5-9S14.485 3 12 3m0 18c-2.485 0-4.5-4.03-4.5-9S9.515 3 12 3m0 0a8.997 8.997 0 0 1 7.843 4.582M12 3a8.997 8.997 0 0 0-7.843 4.582m15.686 0A11.953 11.953 0 0 1 12 10.5c-2.998 0-5.74-1.1-7.843-2.918m15.686 0A8.959 8.959 0 0 1 21 12c0 .778-.099 1.533-.284 2.253m0 0A17.919 17.919 0 0 1 12 16.5c-3.162 0-6.133-.815-8.716-2.247m0 0A9.015 9.015 0 0 1 3 12c0-1.605.42-3.113 1.157-4.418"
                />
              </svg>
            </div>
            <p className="font-semibold text-slate-900 dark:text-white">피부 맞춤</p>
            <p className="text-sm text-slate-500 dark:text-slate-400">스킨케어 추천</p>
            {/* ChevronRight 아이콘 */}
            <svg
              className="w-4 h-4 text-slate-400 mt-2 group-hover:translate-x-1 transition-transform"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              strokeWidth={2}
              aria-hidden="true"
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="m8.25 4.5 7.5 7.5-7.5 7.5" />
            </svg>
          </div>
        </button>
        {/* 체형 맞춤 추천 */}
        <button
          onClick={() => router.push('/style')}
          className="group relative bg-white/60 dark:bg-slate-800/60 backdrop-blur-xl rounded-2xl border border-white/50 dark:border-slate-700/50 p-4 text-left hover:shadow-lg hover:shadow-blue-500/10 hover:scale-[1.02] transition-all duration-300 overflow-hidden"
          aria-label="체형 맞춤 코디 추천 보기"
        >
          <div className="absolute top-0 right-0 w-20 h-20 bg-gradient-to-br from-blue-400/20 to-indigo-400/20 rounded-full blur-2xl" />
          <div className="relative">
            <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-blue-400 to-indigo-500 flex items-center justify-center mb-3 shadow-lg shadow-blue-500/30">
              {/* Shirt 아이콘 */}
              <svg
                className="w-5 h-5 text-white"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                strokeWidth={2}
                aria-hidden="true"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M15.75 10.5V6a3.75 3.75 0 1 0-7.5 0v4.5m11.356-1.993 1.263 12c.07.665-.45 1.243-1.119 1.243H4.25a1.125 1.125 0 0 1-1.12-1.243l1.264-12A1.125 1.125 0 0 1 5.513 7.5h12.974c.576 0 1.059.435 1.119 1.007ZM8.625 10.5a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm7.5 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Z"
                />
              </svg>
            </div>
            <p className="font-semibold text-slate-900 dark:text-white">체형 맞춤</p>
            <p className="text-sm text-slate-500 dark:text-slate-400">코디 추천</p>
            {/* ChevronRight 아이콘 */}
            <svg
              className="w-4 h-4 text-slate-400 mt-2 group-hover:translate-x-1 transition-transform"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              strokeWidth={2}
              aria-hidden="true"
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="m8.25 4.5 7.5 7.5-7.5 7.5" />
            </svg>
          </div>
        </button>
      </div>
    </section>
  );
}
