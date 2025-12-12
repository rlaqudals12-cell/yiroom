'use client';

import { useEffect, useCallback } from 'react';

interface ConfettiProps {
  /** 애니메이션 트리거 */
  trigger: boolean;
  /** 파티클 색상 (기본: 이룸 브랜드 컬러) */
  colors?: string[];
  /** 파티클 개수 (기본: 100) */
  particleCount?: number;
  /** 퍼짐 각도 (기본: 70) */
  spread?: number;
  /** 원점 Y 위치 (0-1, 기본: 0.6) */
  originY?: number;
}

// 이룸 브랜드 컬러
const DEFAULT_COLORS = [
  '#6366F1', // 인디고 퍼플 (Primary)
  '#EC4899', // 소프트 핑크 (Accent)
  '#10B981', // 에메랄드 그린
  '#F59E0B', // 앰버
  '#8B5CF6', // 바이올렛
];

/**
 * 축하 Confetti 효과
 * 결과 화면 진입 시 사용
 *
 * @example
 * ```tsx
 * const [showConfetti, setShowConfetti] = useState(false);
 *
 * useEffect(() => {
 *   if (!isLoading) setShowConfetti(true);
 * }, [isLoading]);
 *
 * return <Confetti trigger={showConfetti} />;
 * ```
 */
export function Confetti({
  trigger,
  colors = DEFAULT_COLORS,
  particleCount = 100,
  spread = 70,
  originY = 0.6,
}: ConfettiProps) {
  const fireConfetti = useCallback(async () => {
    // 동적 import로 SSR 안전하게 처리
    const confetti = (await import('canvas-confetti')).default;

    // 첫 번째 발사 (중앙)
    confetti({
      particleCount,
      spread,
      origin: { x: 0.5, y: originY },
      colors,
      disableForReducedMotion: true, // 접근성: 모션 감소 설정 존중
    });

    // 두 번째 발사 (약간의 딜레이로 더 풍성하게)
    setTimeout(() => {
      confetti({
        particleCount: Math.floor(particleCount * 0.5),
        spread: spread * 1.2,
        origin: { x: 0.3, y: originY + 0.1 },
        colors,
        disableForReducedMotion: true,
      });
    }, 150);

    // 세 번째 발사 (오른쪽)
    setTimeout(() => {
      confetti({
        particleCount: Math.floor(particleCount * 0.5),
        spread: spread * 1.2,
        origin: { x: 0.7, y: originY + 0.1 },
        colors,
        disableForReducedMotion: true,
      });
    }, 300);
  }, [colors, particleCount, spread, originY]);

  useEffect(() => {
    if (trigger) {
      fireConfetti();
    }
  }, [trigger, fireConfetti]);

  // 이 컴포넌트는 캔버스를 직접 렌더링하지 않음
  // canvas-confetti가 document.body에 캔버스를 생성함
  return null;
}

export default Confetti;
