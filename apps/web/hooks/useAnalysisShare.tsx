'use client';

import { useState, useCallback, useRef, useEffect } from 'react';
import { createRoot, Root } from 'react-dom/client';
import { useTranslations } from 'next-intl';
import { toast } from 'sonner';
import { formatDate } from '@/lib/utils/date-format';
import { AnalysisShareCard } from '@/components/share';
import type { ShareCardData, ShareCardTheme } from '@/components/share/AnalysisShareCard';
import { captureElementAsImage, shareImage } from '@/lib/share';
import { THEME_STYLES } from '@/components/share/AnalysisShareCard';

export type { ShareCardData, ShareCardTheme };

/** 전체 분석 모듈 타입 (S-0) */
export type AnalysisType =
  | 'personal-color'
  | 'skin'
  | 'body'
  | 'hair'
  | 'makeup'
  | 'oral-health'
  | 'posture'
  | 'badge';

// 공유 카드에 포함할 사용자 프로필 정보
interface ShareProfileOptions {
  profileImage?: string;
  userName?: string;
}

// 퍼스널 컬러 결과에서 공유 데이터 생성
interface PersonalColorData {
  seasonType: string;
  seasonLabel: string;
  bestColors?: Array<{ hex: string }>;
}

export function createPersonalColorShareData(
  result: PersonalColorData,
  profile?: ShareProfileOptions
): ShareCardData {
  const seasonEmoji: Record<string, string> = {
    spring: '🌸',
    summer: '🌊',
    autumn: '🍂',
    winter: '❄️',
  };

  return {
    analysisType: 'personal-color',
    title: '나의 퍼스널 컬러',
    subtitle: '이룸 AI 분석 결과',
    typeLabel: result.seasonLabel,
    typeEmoji: seasonEmoji[result.seasonType] || '🎨',
    colors: result.bestColors?.slice(0, 5).map((c) => c.hex),
    profileImage: profile?.profileImage,
    userName: profile?.userName,
  };
}

// 피부 분석 결과에서 공유 데이터 생성
interface SkinData {
  overallScore: number;
  identityLabel?: string;
  metrics?: Array<{ name: string; value: number }>;
}

export function createSkinShareData(
  result: SkinData,
  profile?: ShareProfileOptions
): ShareCardData {
  // 가장 좋은/나쁜 지표
  const sorted = result.metrics ? [...result.metrics].sort((a, b) => b.value - a.value) : [];
  const best = sorted[0];
  const worst = sorted[sorted.length - 1];

  const highlights: ShareCardData['highlights'] = [];
  if (best) highlights.push({ label: 'Best', value: best.name });
  if (worst) highlights.push({ label: 'Focus', value: worst.name });

  return {
    analysisType: 'skin',
    title: result.identityLabel || '피부 건강 점수',
    subtitle: '이룸 AI 분석 결과',
    score: result.overallScore,
    typeLabel: result.identityLabel,
    highlights,
    profileImage: profile?.profileImage,
    userName: profile?.userName,
  };
}

// 체형 분석 결과에서 공유 데이터 생성
interface BodyData {
  bodyType: string;
  bodyTypeLabel: string;
  strengths?: string[];
}

export function createBodyShareData(
  result: BodyData,
  profile?: ShareProfileOptions
): ShareCardData {
  const bodyEmoji: Record<string, string> = {
    S: '⏳',
    W: '📐',
    N: '📏',
    X: '⌛',
    A: '🔺',
    V: '🔻',
    H: '▬',
    O: '⬭',
    I: '|',
    Y: '🔽',
    '8': '∞',
  };

  const highlights: ShareCardData['highlights'] = result.strengths?.slice(0, 2).map((s) => ({
    label: '강점',
    value: s,
  }));

  return {
    analysisType: 'body',
    title: '나의 체형 타입',
    subtitle: '이룸 AI 분석 결과',
    typeLabel: result.bodyTypeLabel,
    typeEmoji: bodyEmoji[result.bodyType] || '👤',
    highlights,
    profileImage: profile?.profileImage,
    userName: profile?.userName,
  };
}

// 헤어 분석 결과에서 공유 데이터 생성
interface HairData {
  overallScore: number;
  hairTypeLabel: string;
  hairThicknessLabel: string;
  metrics?: Array<{ name: string; value: number }>;
}

export function createHairShareData(
  result: HairData,
  profile?: ShareProfileOptions
): ShareCardData {
  const sorted = result.metrics ? [...result.metrics].sort((a, b) => b.value - a.value) : [];
  const best = sorted[0];
  const worst = sorted[sorted.length - 1];

  const highlights: ShareCardData['highlights'] = [];
  if (best) highlights.push({ label: 'Best', value: best.name });
  if (worst) highlights.push({ label: 'Focus', value: worst.name });

  return {
    analysisType: 'hair',
    title: '헤어 건강 점수',
    subtitle: '이룸 AI 분석 결과',
    score: result.overallScore,
    typeLabel: `${result.hairTypeLabel} · ${result.hairThicknessLabel}`,
    typeEmoji: '💇',
    highlights,
    profileImage: profile?.profileImage,
    userName: profile?.userName,
  };
}

// 메이크업 분석 결과에서 공유 데이터 생성
interface MakeupData {
  overallScore: number;
  undertoneLabel: string;
  styleLabel?: string;
  metrics?: Array<{ name: string; value: number }>;
}

export function createMakeupShareData(
  result: MakeupData,
  profile?: ShareProfileOptions
): ShareCardData {
  const highlights: ShareCardData['highlights'] = [];
  if (result.undertoneLabel) highlights.push({ label: '언더톤', value: result.undertoneLabel });
  if (result.styleLabel) highlights.push({ label: '스타일', value: result.styleLabel });

  return {
    analysisType: 'makeup',
    title: '메이크업 분석 점수',
    subtitle: '이룸 AI 분석 결과',
    score: result.overallScore,
    typeEmoji: '💄',
    highlights,
    profileImage: profile?.profileImage,
    userName: profile?.userName,
  };
}

// 구강건강 분석 결과에서 공유 데이터 생성
interface OralHealthShareInput {
  overallScore: number;
  identityLabel?: string;
  brightnessLabel?: string;
  inflammationScore?: number;
}

export function createOralHealthShareData(
  result: OralHealthShareInput,
  profile?: ShareProfileOptions
): ShareCardData {
  const highlights: ShareCardData['highlights'] = [];
  if (result.brightnessLabel) {
    highlights.push({ label: '밝기', value: result.brightnessLabel });
  }
  if (result.inflammationScore !== undefined) {
    highlights.push({ label: '잇몸', value: `${100 - result.inflammationScore}점` });
  }

  return {
    analysisType: 'oral-health',
    title: result.identityLabel || '구강건강 점수',
    subtitle: '이룸 AI 분석 결과',
    score: result.overallScore,
    typeLabel: result.identityLabel,
    typeEmoji: '🦷',
    highlights,
    profileImage: profile?.profileImage,
    userName: profile?.userName,
  };
}

// 배지 공유 데이터 생성
interface BadgeShareInput {
  badgeName: string;
  badgeIcon: string;
  rarityLabel?: string;
  earnedAt?: Date;
}

export function createBadgeShareData(input: BadgeShareInput, locale: string = 'ko'): ShareCardData {
  return {
    analysisType: 'badge',
    title: `🏆 ${input.badgeName} 획득!`,
    subtitle: '이룸 배지',
    typeLabel: input.rarityLabel,
    typeEmoji: input.badgeIcon,
    highlights: input.earnedAt
      ? [{ label: '획득일', value: formatDate(input.earnedAt, locale) }]
      : undefined,
  };
}

// 자세 분석 결과에서 공유 데이터 생성 (S-0)
interface PostureShareInput {
  postureType: string;
  postureTypeLabel: string;
  overallScore: number;
}

export function createPostureShareData(
  result: PostureShareInput,
  profile?: ShareProfileOptions
): ShareCardData {
  return {
    analysisType: 'posture',
    title: '나의 자세 분석',
    subtitle: '이룸 AI 분석 결과',
    typeLabel: result.postureTypeLabel,
    typeEmoji: '🧘',
    score: result.overallScore,
    highlights: [
      { label: '자세 유형', value: result.postureTypeLabel },
      { label: '종합 점수', value: `${result.overallScore}점` },
    ],
    profileImage: profile?.profileImage,
    userName: profile?.userName,
  };
}

interface UseAnalysisShareReturn {
  share: () => Promise<void>;
  loading: boolean;
}

/**
 * 분석 결과 공유 훅
 * - SNS 최적화된 공유 카드 자동 생성
 * - Web Share API 또는 다운로드 지원
 *
 * @param data 공유 카드 데이터
 * @param title 공유 제목 (파일명)
 */
export function useAnalysisShare(data: ShareCardData, title: string): UseAnalysisShareReturn {
  const t = useTranslations('share');
  const [loading, setLoading] = useState(false);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const rootRef = useRef<Root | null>(null);

  // 숨겨진 컨테이너 생성
  useEffect(() => {
    if (typeof document === 'undefined') return;

    const container = document.createElement('div');
    container.style.position = 'fixed';
    container.style.left = '-9999px';
    container.style.top = '0';
    container.style.zIndex = '-1';
    document.body.appendChild(container);
    containerRef.current = container;

    return () => {
      if (rootRef.current) {
        rootRef.current.unmount();
      }
      container.remove();
    };
  }, []);

  const share = useCallback(async () => {
    if (!containerRef.current) {
      toast.error(t('sharePrepareFailed'));
      return;
    }

    setLoading(true);

    try {
      // 공유 카드 렌더링
      const cardElement = document.createElement('div');
      containerRef.current.appendChild(cardElement);

      // React 18 createRoot 사용
      const root = createRoot(cardElement);
      rootRef.current = root;

      // 카드 렌더링을 위한 Promise
      await new Promise<void>((resolve) => {
        root.render(<AnalysisShareCard data={data} className="share-card-capture" />);
        // 렌더링 완료를 위한 짧은 딜레이
        setTimeout(resolve, 100);
      });

      // 렌더링된 카드 요소 찾기
      const shareCard = cardElement.querySelector(
        '[data-testid="analysis-share-card"]'
      ) as HTMLElement;

      if (!shareCard) {
        throw new Error('공유 카드를 생성할 수 없습니다');
      }

      // 테마에 따른 캡처 배경색
      const captureBackground = THEME_STYLES[data.theme ?? 'default'].captureBackground;

      // 이미지로 캡처
      const blob = await captureElementAsImage(shareCard, {
        quality: 0.95,
        scale: 2,
        backgroundColor: captureBackground,
      });

      // 정리
      root.unmount();
      cardElement.remove();
      rootRef.current = null;

      if (!blob) {
        throw new Error('이미지 생성에 실패했습니다');
      }

      // 공유
      const success = await shareImage(blob, title, t('checkOnYiroom', { title }));

      if (success && !navigator.share) {
        toast.success(t('imageSaved'));
      }
    } catch (error) {
      console.error('[이룸] 공유 오류:', error);
      toast.error(t('shareFailed'));
    } finally {
      setLoading(false);
    }
  }, [data, title]);

  return { share, loading };
}

export default useAnalysisShare;
