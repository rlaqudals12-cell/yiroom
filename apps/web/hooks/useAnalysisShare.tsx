'use client';

import { useState, useCallback, useRef, useEffect } from 'react';
import { createRoot, Root } from 'react-dom/client';
import { toast } from 'sonner';
import { AnalysisShareCard } from '@/components/share';
import { captureElementAsImage, shareImage } from '@/lib/share';

// 분석 타입
type AnalysisType = 'personal-color' | 'skin' | 'body' | 'hair' | 'makeup';

// 공유 카드 데이터
interface ShareCardData {
  analysisType: AnalysisType;
  title: string;
  subtitle: string;
  score?: number;
  typeLabel?: string;
  typeEmoji?: string;
  highlights?: Array<{ label: string; value: string }>;
  colors?: string[];
}

// 퍼스널 컬러 결과에서 공유 데이터 생성
interface PersonalColorData {
  seasonType: string;
  seasonLabel: string;
  bestColors?: Array<{ hex: string }>;
}

export function createPersonalColorShareData(result: PersonalColorData): ShareCardData {
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
  };
}

// 피부 분석 결과에서 공유 데이터 생성
interface SkinData {
  overallScore: number;
  metrics?: Array<{ name: string; value: number }>;
}

export function createSkinShareData(result: SkinData): ShareCardData {
  // 가장 좋은/나쁜 지표
  const sorted = result.metrics ? [...result.metrics].sort((a, b) => b.value - a.value) : [];
  const best = sorted[0];
  const worst = sorted[sorted.length - 1];

  const highlights: ShareCardData['highlights'] = [];
  if (best) highlights.push({ label: 'Best', value: best.name });
  if (worst) highlights.push({ label: 'Focus', value: worst.name });

  return {
    analysisType: 'skin',
    title: '피부 건강 점수',
    subtitle: '이룸 AI 분석 결과',
    score: result.overallScore,
    highlights,
  };
}

// 체형 분석 결과에서 공유 데이터 생성
interface BodyData {
  bodyType: string;
  bodyTypeLabel: string;
  strengths?: string[];
}

export function createBodyShareData(result: BodyData): ShareCardData {
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
  };
}

// 헤어 분석 결과에서 공유 데이터 생성
interface HairData {
  overallScore: number;
  hairTypeLabel: string;
  hairThicknessLabel: string;
  metrics?: Array<{ name: string; value: number }>;
}

export function createHairShareData(result: HairData): ShareCardData {
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
  };
}

// 메이크업 분석 결과에서 공유 데이터 생성
interface MakeupData {
  overallScore: number;
  undertoneLabel: string;
  styleLabel?: string;
  metrics?: Array<{ name: string; value: number }>;
}

export function createMakeupShareData(result: MakeupData): ShareCardData {
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
      toast.error('공유 준비 중 오류가 발생했습니다');
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

      // 이미지로 캡처
      const blob = await captureElementAsImage(shareCard, {
        quality: 0.95,
        scale: 2,
        backgroundColor: '#ffffff',
      });

      // 정리
      root.unmount();
      cardElement.remove();
      rootRef.current = null;

      if (!blob) {
        throw new Error('이미지 생성에 실패했습니다');
      }

      // 공유
      const success = await shareImage(blob, title, `${title} - 이룸에서 확인하세요!`);

      if (success && !navigator.share) {
        toast.success('이미지가 저장되었습니다');
      }
    } catch (error) {
      console.error('[이룸] 공유 오류:', error);
      toast.error('공유 중 오류가 발생했습니다');
    } finally {
      setLoading(false);
    }
  }, [data, title]);

  return { share, loading };
}

export default useAnalysisShare;
