'use client';

/**
 * 포토카드 틸트 — 포인터를 따라 카드가 3D로 기우는 인터랙션 (K-팝 포토카드 문법).
 *
 * 왜 이 방식인가: WebGL/파티클류 "3D 이펙트"는 슬롭 재유입 + 번들 비용 + 캡처 파이프 충돌이라
 * 기각(2026-07-17 검토). 이 틸트는 순수 CSS transform이라 ₩0이고, 캡처는 자식 노드를 평면
 * 상태로 뜨므로 저장 PNG에 아무 영향이 없다(부모 transform은 캡처 클론에 미적용).
 *
 * 절제 규율: 최대 기울기 ±6° — 장난감이 아니라 "실물 카드를 손에 든" 감각까지만.
 */

import { useRef, useState, useCallback } from 'react';

interface PhotocardTiltProps {
  children: React.ReactNode;
  /** 최대 기울기(도) — 기본 6 */
  maxDeg?: number;
  className?: string;
}

export function PhotocardTilt({
  children,
  maxDeg = 6,
  className,
}: PhotocardTiltProps): React.JSX.Element {
  const frameRef = useRef<HTMLDivElement>(null);
  const [transform, setTransform] = useState('perspective(900px)');

  const handleMove = useCallback(
    (e: React.PointerEvent<HTMLDivElement>) => {
      const el = frameRef.current;
      if (!el) return;
      const rect = el.getBoundingClientRect();
      if (rect.width === 0 || rect.height === 0) return;
      // 포인터 위치를 -1~1로 정규화 → 반대축 회전(위를 만지면 위가 눕는 실물 카드 감각)
      const nx = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      const ny = ((e.clientY - rect.top) / rect.height) * 2 - 1;
      const rx = (-ny * maxDeg).toFixed(2);
      const ry = (nx * maxDeg).toFixed(2);
      setTransform(`perspective(900px) rotateX(${rx}deg) rotateY(${ry}deg)`);
    },
    [maxDeg]
  );

  const handleLeave = useCallback(() => {
    setTransform('perspective(900px)');
  }, []);

  return (
    <div
      ref={frameRef}
      onPointerMove={handleMove}
      onPointerLeave={handleLeave}
      className={className}
      data-testid="photocard-tilt"
      style={{
        transform,
        transition: 'transform 180ms ease-out',
        transformStyle: 'preserve-3d',
        willChange: 'transform',
      }}
    >
      {children}
    </div>
  );
}
