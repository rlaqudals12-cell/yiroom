/**
 * AxisFallbackNotice 컴포넌트 테스트
 *
 * 통합 리포트가 축별 Mock Fallback을 사용자에게 정직하게 노출하는지 검증 (감사 B7).
 */

import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';

// lucide-react mock (아이콘 렌더 불필요)
vi.mock('lucide-react', () => ({
  AlertTriangle: () => null,
}));

import { AxisFallbackNotice } from '@/app/(main)/analysis/integrated/result/[sessionId]/_components/AxisFallbackNotice';

describe('AxisFallbackNotice', () => {
  it('Fallback 축이 없으면 렌더링하지 않음', () => {
    const { container } = render(<AxisFallbackNotice usedFallback={[]} />);
    expect(container.querySelector('[data-testid="axis-fallback-notice"]')).toBeNull();
  });

  it('Fallback 축이 있으면 샘플 고지 배너를 표시', () => {
    render(<AxisFallbackNotice usedFallback={['skin']} />);
    expect(screen.getByTestId('axis-fallback-notice')).toBeInTheDocument();
    expect(screen.getByText(/일부 축은 샘플 결과예요/)).toBeInTheDocument();
  });

  it('Fallback 축 이름이 한국어로 매핑되어 나열됨', () => {
    render(<AxisFallbackNotice usedFallback={['personal_color', 'hair']} />);
    expect(screen.getByText(/퍼스널컬러, 헤어/)).toBeInTheDocument();
  });

  it('실제 분석이 아님을 정직하게 안내', () => {
    render(<AxisFallbackNotice usedFallback={['body']} />);
    expect(screen.getByText(/실제 분석 결과가/)).toBeInTheDocument();
    expect(screen.getByText(/다시 분석하시면 정확한 결과/)).toBeInTheDocument();
  });

  it('알 수 없는 축 코드는 걸러내 "undefined" 노출 방지', () => {
    // @ts-expect-error — 방어 로직 검증: 라벨 없는 축 코드 주입
    render(<AxisFallbackNotice usedFallback={['unknown_axis']} />);
    // 유효 라벨이 0개면 배너 미표시
    expect(screen.queryByTestId('axis-fallback-notice')).toBeNull();
  });
});
