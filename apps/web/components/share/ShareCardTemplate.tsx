'use client';

import { forwardRef } from 'react';
import { cn } from '@/lib/utils';

interface ShareCardHighlight {
  label: string;
  value: string;
}

interface ShareCardTemplateProps {
  analysisType: string;
  typeLabel: string;
  score: number;
  subtitle: string;
  highlights: ShareCardHighlight[];
  className?: string;
}

// 분석 타입별 그라데이션 배경
const GRADIENT_MAP: Record<string, string> = {
  'personal-color': 'from-pink-500 to-purple-600',
  skin: 'from-green-500 to-teal-600',
  body: 'from-blue-500 to-indigo-600',
  hair: 'from-amber-500 to-orange-600',
  makeup: 'from-rose-500 to-pink-600',
  'oral-health': 'from-cyan-500 to-blue-600',
  posture: 'from-violet-500 to-purple-600',
};

// 기본 그라데이션 (매핑되지 않는 타입 대비)
const DEFAULT_GRADIENT = 'from-gray-500 to-gray-700';

/**
 * 공유용 카드 템플릿
 * - 분석 타입별 그라데이션 배경
 * - 점수 원, 하이라이트 목록, 이룸 워터마크
 * - forwardRef로 html-to-image 캡처 지원
 */
export const ShareCardTemplate = forwardRef<HTMLDivElement, ShareCardTemplateProps>(
  function ShareCardTemplate(
    { analysisType, typeLabel, score, subtitle, highlights, className },
    ref
  ) {
    const gradient = GRADIENT_MAP[analysisType] ?? DEFAULT_GRADIENT;

    return (
      <div
        ref={ref}
        className={cn(
          'w-[400px] rounded-3xl overflow-hidden shadow-xl bg-gradient-to-br',
          gradient,
          className
        )}
        data-testid="share-card-template"
      >
        <div className="px-8 pt-8 pb-6 text-white">
          {/* 타입 라벨 */}
          <p className="text-lg font-semibold opacity-90 mb-1">{subtitle}</p>
          <h2 className="text-3xl font-bold mb-6">{typeLabel}</h2>

          {/* 점수 원형 표시 */}
          <div className="flex justify-center mb-6">
            <div className="w-28 h-28 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center">
              <div className="w-24 h-24 rounded-full bg-white flex flex-col items-center justify-center">
                <span className="text-4xl font-bold text-gray-800">{score}</span>
                <span className="text-xs text-gray-500 font-medium">점</span>
              </div>
            </div>
          </div>

          {/* 하이라이트 목록 */}
          {highlights.length > 0 && (
            <div className="space-y-2 mb-6">
              {highlights.slice(0, 4).map((item, idx) => (
                <div
                  key={idx}
                  className="flex items-center justify-between bg-white/15 backdrop-blur-sm rounded-xl px-4 py-2.5"
                >
                  <span className="text-sm opacity-90">{item.label}</span>
                  <span className="text-sm font-bold">{item.value}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* 이룸 워터마크 */}
        <div className="px-8 py-4 bg-white/10 backdrop-blur-sm flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-md bg-white/90 flex items-center justify-center">
              <span className="text-xs font-bold text-gray-800">이</span>
            </div>
            <span className="text-sm font-medium text-white/90">이룸</span>
          </div>
          <span className="text-xs text-white/70">yiroom.app</span>
        </div>
      </div>
    );
  }
);
