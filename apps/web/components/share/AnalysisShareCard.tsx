'use client';

import { forwardRef } from 'react';
import { cn } from '@/lib/utils';

// 분석 타입별 설정
type AnalysisType =
  | 'personal-color'
  | 'skin'
  | 'body'
  | 'hair'
  | 'makeup'
  | 'oral-health'
  | 'badge';

// 공유 카드 테마 (5종)
export type ShareCardTheme = 'default' | 'midnight' | 'sunset' | 'forest' | 'minimal';

// 공유 카드 포맷 (1:1 정사각형 / 9:16 스토리)
export type ShareCardFormat = '1:1' | '9:16';

export interface ShareCardData {
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

  // 테마 선택
  theme?: ShareCardTheme;

  // 공유 포맷 (1:1 정사각형 / 9:16 스토리)
  format?: ShareCardFormat;

  // 사용자 이름 오버레이
  userName?: string;

  // 프로필 사진 URL (Clerk user.imageUrl)
  profileImage?: string;
}

interface AnalysisShareCardProps {
  data: ShareCardData;
  className?: string;
}

// 테마별 스타일 정의
interface ThemeStyle {
  background: string;
  accent: string;
  textPrimary: string;
  textSecondary: string;
  textMuted: string;
  border: string;
  scoreRingBg: string;
  scoreInnerBg: string;
  captureBackground: string;
}

export const THEME_STYLES: Record<ShareCardTheme, ThemeStyle> = {
  default: {
    background: '', // 분석 타입별 BACKGROUNDS 사용
    accent: '', // 분석 타입별 GRADIENTS 사용
    textPrimary: 'text-gray-800',
    textSecondary: 'text-gray-500',
    textMuted: 'text-gray-400',
    border: 'border-gray-200/50',
    scoreRingBg: '',
    scoreInnerBg: 'bg-white',
    captureBackground: '#ffffff',
  },
  midnight: {
    background: 'bg-gradient-to-br from-slate-900 via-gray-900 to-slate-800',
    accent: 'from-violet-400 via-purple-500 to-indigo-500',
    textPrimary: 'text-white',
    textSecondary: 'text-gray-300',
    textMuted: 'text-gray-500',
    border: 'border-gray-700/50',
    scoreRingBg: 'from-violet-400 via-purple-500 to-indigo-500',
    scoreInnerBg: 'bg-slate-900',
    captureBackground: '#0f172a',
  },
  sunset: {
    background: 'bg-gradient-to-br from-orange-50 via-rose-50 to-pink-100',
    accent: 'from-orange-400 via-rose-500 to-pink-500',
    textPrimary: 'text-rose-900',
    textSecondary: 'text-rose-600',
    textMuted: 'text-rose-400',
    border: 'border-rose-200/50',
    scoreRingBg: 'from-orange-400 via-rose-500 to-pink-500',
    scoreInnerBg: 'bg-white',
    captureBackground: '#ffffff',
  },
  forest: {
    background: 'bg-gradient-to-br from-emerald-50 via-green-50 to-teal-100',
    accent: 'from-emerald-500 via-green-500 to-teal-500',
    textPrimary: 'text-emerald-900',
    textSecondary: 'text-emerald-600',
    textMuted: 'text-emerald-400',
    border: 'border-emerald-200/50',
    scoreRingBg: 'from-emerald-500 via-green-500 to-teal-500',
    scoreInnerBg: 'bg-white',
    captureBackground: '#ffffff',
  },
  minimal: {
    background: 'bg-white',
    accent: 'from-gray-700 via-gray-800 to-gray-900',
    textPrimary: 'text-gray-900',
    textSecondary: 'text-gray-600',
    textMuted: 'text-gray-400',
    border: 'border-gray-300',
    scoreRingBg: 'from-gray-700 via-gray-800 to-gray-900',
    scoreInnerBg: 'bg-white',
    captureBackground: '#ffffff',
  },
};

// 테마 메타 정보 (UI 표시용)
export const SHARE_THEME_OPTIONS: Array<{
  id: ShareCardTheme;
  name: string;
  preview: string; // 프리뷰 색상 CSS
}> = [
  { id: 'default', name: '기본', preview: 'bg-gradient-to-r from-pink-200 to-purple-200' },
  { id: 'midnight', name: '미드나잇', preview: 'bg-gradient-to-r from-slate-800 to-indigo-900' },
  { id: 'sunset', name: '선셋', preview: 'bg-gradient-to-r from-orange-300 to-pink-400' },
  { id: 'forest', name: '포레스트', preview: 'bg-gradient-to-r from-emerald-300 to-teal-400' },
  { id: 'minimal', name: '미니멀', preview: 'bg-gray-100 border border-gray-300' },
];

// 포맷별 치수 상수
const FORMAT_DIMS = {
  '1:1': { w: 400, h: 400, pad: 'p-6' },
  '9:16': { w: 360, h: 640, pad: 'p-8' },
} as const;

// 분석 타입별 그라데이션 (default 테마용)
const GRADIENTS: Record<AnalysisType, string> = {
  'personal-color': 'from-pink-500 via-purple-500 to-indigo-500',
  skin: 'from-emerald-400 via-teal-500 to-cyan-500',
  body: 'from-blue-500 via-indigo-500 to-purple-500',
  hair: 'from-amber-400 via-orange-500 to-yellow-500',
  makeup: 'from-rose-400 via-pink-500 to-fuchsia-500',
  'oral-health': 'from-cyan-400 via-blue-500 to-indigo-500',
  badge: 'from-yellow-400 via-amber-500 to-orange-500',
};

// 분석 타입별 배경 (default 테마용)
const BACKGROUNDS: Record<AnalysisType, string> = {
  'personal-color': 'bg-gradient-to-br from-pink-50 via-white to-purple-50',
  skin: 'bg-gradient-to-br from-emerald-50 via-white to-teal-50',
  body: 'bg-gradient-to-br from-blue-50 via-white to-indigo-50',
  hair: 'bg-gradient-to-br from-amber-50 via-white to-orange-50',
  makeup: 'bg-gradient-to-br from-rose-50 via-white to-pink-50',
  'oral-health': 'bg-gradient-to-br from-cyan-50 via-white to-blue-50',
  badge: 'bg-gradient-to-br from-yellow-50 via-white to-amber-50',
};

/**
 * SNS 공유용 분석 결과 카드
 * - 1:1 (400×400) 인스타그램 / 9:16 (360×640) 스토리 포맷
 * - 핵심 정보만 표시
 * - 시각적으로 매력적인 디자인
 */
export const AnalysisShareCard = forwardRef<HTMLDivElement, AnalysisShareCardProps>(
  function AnalysisShareCard({ data, className }, ref) {
    const {
      analysisType,
      title,
      subtitle,
      score,
      typeLabel,
      typeEmoji,
      highlights,
      colors,
      theme = 'default',
      format = '1:1',
      userName,
      profileImage,
    } = data;

    const ts = THEME_STYLES[theme];
    const gradient = theme === 'default' ? GRADIENTS[analysisType] : ts.accent;
    const background = theme === 'default' ? BACKGROUNDS[analysisType] : ts.background;
    const scoreRing = theme === 'default' ? GRADIENTS[analysisType] : ts.scoreRingBg;

    const dim = FORMAT_DIMS[format];
    const isStory = format === '9:16';

    return (
      <div
        ref={ref}
        className={cn('rounded-3xl shadow-xl flex flex-col', dim.pad, background, className)}
        style={{ width: dim.w, height: dim.h }}
        data-testid="analysis-share-card"
      >
        {/* 상단 로고 */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <div
              className={cn(
                'w-8 h-8 rounded-lg flex items-center justify-center text-white font-bold text-sm',
                `bg-gradient-to-br ${gradient}`
              )}
            >
              이
            </div>
            <span className={cn('text-sm font-medium', ts.textSecondary)}>이룸</span>
          </div>
          <span className={cn('text-xs', ts.textMuted)}>yiroom.app</span>
        </div>

        {/* 메인 콘텐츠 */}
        <div
          className={cn(
            'flex-1 flex flex-col items-center justify-center text-center',
            isStory ? 'py-6' : 'py-4'
          )}
        >
          {/* 점수형 (피부 분석) */}
          {score !== undefined && (
            <div className="relative mb-4">
              <div
                className={cn(
                  'rounded-full flex items-center justify-center',
                  isStory ? 'w-40 h-40' : 'w-32 h-32',
                  `bg-gradient-to-br ${scoreRing}`
                )}
              >
                <div
                  className={cn(
                    'rounded-full flex flex-col items-center justify-center shadow-inner',
                    isStory ? 'w-36 h-36' : 'w-28 h-28',
                    ts.scoreInnerBg
                  )}
                >
                  <span
                    className={cn('font-bold', isStory ? 'text-5xl' : 'text-4xl', ts.textPrimary)}
                  >
                    {score}
                  </span>
                  <span className={cn('text-sm', ts.textSecondary)}>점</span>
                </div>
              </div>
            </div>
          )}

          {/* 타입형 (퍼스널컬러, 체형) */}
          {typeLabel && (
            <div className="mb-4">
              {typeEmoji && (
                <span className={cn('mb-2 block', isStory ? 'text-6xl' : 'text-5xl')}>
                  {typeEmoji}
                </span>
              )}
              <div
                className={cn(
                  'inline-block px-6 py-2 rounded-full text-white font-bold',
                  isStory ? 'text-2xl' : 'text-xl',
                  `bg-gradient-to-r ${gradient}`
                )}
              >
                {typeLabel}
              </div>
            </div>
          )}

          {/* 제목 */}
          <h2 className={cn('font-bold mb-1', isStory ? 'text-2xl' : 'text-xl', ts.textPrimary)}>
            {title}
          </h2>
          <p className={cn('text-sm mb-4', ts.textSecondary)}>{subtitle}</p>

          {/* 사용자 프로필 */}
          {(userName || profileImage) && (
            <div className="flex items-center gap-2 mb-2">
              {profileImage && (
                // eslint-disable-next-line @next/next/no-img-element -- html-to-image 캡처용, next/image 사용 불가
                <img
                  src={profileImage}
                  alt=""
                  className="w-6 h-6 rounded-full object-cover border border-white/50"
                  crossOrigin="anonymous"
                />
              )}
              {userName && <span className={cn('text-xs', ts.textMuted)}>@{userName}</span>}
            </div>
          )}

          {/* 컬러 팔레트 (퍼스널컬러용) */}
          {colors && colors.length > 0 && (
            <div className="flex gap-2 mb-4">
              {colors.slice(0, 5).map((color, idx) => (
                <div
                  key={idx}
                  className={cn(
                    'rounded-full border-2 border-white shadow-md',
                    isStory ? 'w-10 h-10' : 'w-8 h-8'
                  )}
                  style={{ backgroundColor: color }}
                />
              ))}
            </div>
          )}

          {/* 하이라이트 정보 */}
          {highlights && highlights.length > 0 && (
            <div className={cn('justify-center', isStory ? 'flex flex-col gap-3' : 'flex gap-4')}>
              {highlights.slice(0, 3).map((item, idx) => (
                <div key={idx} className="text-center">
                  <p className={cn('text-lg font-bold', ts.textPrimary)}>{item.value}</p>
                  <p className={cn('text-xs', ts.textSecondary)}>{item.label}</p>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* 하단 CTA */}
        <div className={cn('mt-auto pt-4 border-t text-center', ts.border)}>
          <p className={cn('text-xs', ts.textMuted)}>AI 분석으로 나만의 뷰티 솔루션을 찾아보세요</p>
        </div>
      </div>
    );
  }
);

export default AnalysisShareCard;
