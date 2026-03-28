/**
 * T-2: 체형 스켈레톤 오버레이 좌표 검증 + 접근성 테스트
 */
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { PoseSkeletonOverlay } from '@/components/analysis/overlay/PoseSkeletonOverlay';
import type { Landmark33 } from '@/lib/analysis/body-v2/types';
import { SKELETON_CONNECTIONS } from '@/components/analysis/overlay/internal/skeleton-renderer';

// 33개 관절 Mock 데이터 (정규화 좌표 0-1)
function createMockLandmarks(): Landmark33[] {
  return Array.from({ length: 33 }, (_, i) => ({
    x: 0.3 + (i % 5) * 0.1,
    y: 0.1 + Math.floor(i / 5) * 0.12,
    z: 0,
    visibility: i < 29 ? 0.9 : 0.3, // 핵심 관절만 높은 visibility
  }));
}

describe('PoseSkeletonOverlay', () => {
  it('should render empty div when landmarks is null', () => {
    render(
      <PoseSkeletonOverlay
        imageUrl="/test.jpg"
        landmarks={null}
        measurements={{ shoulderWidth: 75, hipWidth: 68 }}
        bodyType="S"
      />
    );
    const el = screen.getByTestId('pose-skeleton-overlay');
    expect(el).toBeInTheDocument();
    // Canvas가 없어야 함
    expect(el.querySelector('canvas')).toBeNull();
  });

  it('should render overlay container when landmarks provided', () => {
    render(
      <PoseSkeletonOverlay
        imageUrl="/test.jpg"
        landmarks={createMockLandmarks()}
        measurements={{ shoulderWidth: 75, hipWidth: 68 }}
        bodyType="S"
      />
    );
    const el = screen.getByTestId('pose-skeleton-overlay');
    // JSDOM에서 Canvas 렌더링 제한, 컨테이너 존재만 확인
    expect(el.childElementCount).toBeGreaterThan(0);
  });

  it('should have sr-only accessibility text (ADR-097 D7)', () => {
    render(
      <PoseSkeletonOverlay
        imageUrl="/test.jpg"
        landmarks={createMockLandmarks()}
        measurements={{ shoulderWidth: 75, hipWidth: 68, shoulderTilt: 2.3 }}
        bodyType="S"
      />
    );
    // sr-only 텍스트에 측정값 포함
    const srElements = screen.getAllByRole('img');
    const srEl = srElements.find((el) => el.getAttribute('aria-label')?.includes('S형'));
    expect(srEl).toBeDefined();
    expect(srEl!.getAttribute('aria-label')).toContain('어깨 비율 75');
  });
});

describe('SKELETON_CONNECTIONS', () => {
  it('should define shoulder connection [11, 12]', () => {
    expect(SKELETON_CONNECTIONS).toContainEqual([11, 12]);
  });

  it('should define hip connection [23, 24]', () => {
    expect(SKELETON_CONNECTIONS).toContainEqual([23, 24]);
  });

  it('should have at least 12 connections for full skeleton', () => {
    expect(SKELETON_CONNECTIONS.length).toBeGreaterThanOrEqual(12);
  });
});
