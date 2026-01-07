'use client';

import { forwardRef } from 'react';
import { cn } from '@/lib/utils';

// 분석 타입별 설정
type AnalysisType = 'personal-color' | 'skin' | 'body' | 'hair' | 'makeup';

interface ShareCardData {
  // 공통
  analysisType: AnalysisType;
  title: string;
  subtitle: string;

  // 점수형 (피부)
  score?: number;

  // 타입형 (퍼스널컬러, 체형)
  typeLabel?: string;
  typeEmoji?: string;

  // 하이라이트 정보
  highlights?: Array<{
    label: string;
    value: string;
  }>;

  // 컬러 팔레트 (퍼스널컬러용)
  colors?: string[];
}

interface AnalysisShareCardProps {
  data: ShareCardData;
  className?: string;
}

// 분석 타입별 그라데이션
const GRADIENTS: Record<AnalysisType, string> = {
  'personal-color': 'from-pink-500 via-purple-500 to-indigo-500',
  skin: 'from-emerald-400 via-teal-500 to-cyan-500',
  body: 'from-blue-500 via-indigo-500 to-purple-500',
  hair: 'from-amber-400 via-orange-500 to-yellow-500',
  makeup: 'from-rose-400 via-pink-500 to-fuchsia-500',
};

// 분석 타입별 배경
const BACKGROUNDS: Record<AnalysisType, string> = {
  'personal-color': 'bg-gradient-to-br from-pink-50 via-white to-purple-50',
  skin: 'bg-gradient-to-br from-emerald-50 via-white to-teal-50',
  body: 'bg-gradient-to-br from-blue-50 via-white to-indigo-50',
  hair: 'bg-gradient-to-br from-amber-50 via-white to-orange-50',
  makeup: 'bg-gradient-to-br from-rose-50 via-white to-pink-50',
};

/**
 * SNS 공유용 분석 결과 카드
 * - 1:1 비율 (인스타그램 최적화)
 * - 핵심 정보만 표시
 * - 시각적으로 매력적인 디자인
 */
export const AnalysisShareCard = forwardRef<HTMLDivElement, AnalysisShareCardProps>(
  function AnalysisShareCard({ data, className }, ref) {
    const { analysisType, title, subtitle, score, typeLabel, typeEmoji, highlights, colors } = data;

    return (
      <div
        ref={ref}
        className={cn(
          'w-[400px] h-[400px] p-6 rounded-3xl shadow-xl',
          BACKGROUNDS[analysisType],
          className
        )}
        data-testid="analysis-share-card"
      >
        {/* 상단 로고 */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <div
              className={cn(
                'w-8 h-8 rounded-lg flex items-center justify-center text-white font-bold text-sm',
                `bg-gradient-to-br ${GRADIENTS[analysisType]}`
              )}
            >
              이
            </div>
            <span className="text-sm font-medium text-gray-600">이룸</span>
          </div>
          <span className="text-xs text-gray-400">yiroom.app</span>
        </div>

        {/* 메인 콘텐츠 */}
        <div className="flex-1 flex flex-col items-center justify-center text-center py-4">
          {/* 점수형 (피부 분석) */}
          {score !== undefined && (
            <div className="relative mb-4">
              <div
                className={cn(
                  'w-32 h-32 rounded-full flex items-center justify-center',
                  `bg-gradient-to-br ${GRADIENTS[analysisType]}`
                )}
              >
                <div className="w-28 h-28 rounded-full bg-white flex flex-col items-center justify-center shadow-inner">
                  <span className="text-4xl font-bold text-gray-800">{score}</span>
                  <span className="text-sm text-gray-500">점</span>
                </div>
              </div>
            </div>
          )}

          {/* 타입형 (퍼스널컬러, 체형) */}
          {typeLabel && (
            <div className="mb-4">
              {typeEmoji && <span className="text-5xl mb-2 block">{typeEmoji}</span>}
              <div
                className={cn(
                  'inline-block px-6 py-2 rounded-full text-white font-bold text-xl',
                  `bg-gradient-to-r ${GRADIENTS[analysisType]}`
                )}
              >
                {typeLabel}
              </div>
            </div>
          )}

          {/* 제목 */}
          <h2 className="text-xl font-bold text-gray-800 mb-1">{title}</h2>
          <p className="text-sm text-gray-500 mb-4">{subtitle}</p>

          {/* 컬러 팔레트 (퍼스널컬러용) */}
          {colors && colors.length > 0 && (
            <div className="flex gap-2 mb-4">
              {colors.slice(0, 5).map((color, idx) => (
                <div
                  key={idx}
                  className="w-8 h-8 rounded-full border-2 border-white shadow-md"
                  style={{ backgroundColor: color }}
                />
              ))}
            </div>
          )}

          {/* 하이라이트 정보 */}
          {highlights && highlights.length > 0 && (
            <div className="flex gap-4 justify-center">
              {highlights.slice(0, 3).map((item, idx) => (
                <div key={idx} className="text-center">
                  <p className="text-lg font-bold text-gray-800">{item.value}</p>
                  <p className="text-xs text-gray-500">{item.label}</p>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* 하단 CTA */}
        <div className={cn('mt-auto pt-4 border-t border-gray-200/50 text-center')}>
          <p className="text-xs text-gray-400">AI 분석으로 나만의 뷰티 솔루션을 찾아보세요</p>
        </div>
      </div>
    );
  }
);

export default AnalysisShareCard;
