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

// i18n 배선 후 서버 컴포넌트는 async — 테스트 setup의 next-intl 목이 t(key)=>key 반환.
// 따라서 렌더된 텍스트는 번역이 아닌 i18n 키 문자열로 검증한다.
describe('AxisFallbackNotice', () => {
  it('Fallback 축이 없으면 렌더링하지 않음', async () => {
    const { container } = render(await AxisFallbackNotice({ usedFallback: [] }));
    expect(container.querySelector('[data-testid="axis-fallback-notice"]')).toBeNull();
  });

  it('Fallback 축이 있으면 샘플 고지 배너를 표시', async () => {
    render(await AxisFallbackNotice({ usedFallback: ['skin'] }));
    expect(screen.getByTestId('axis-fallback-notice')).toBeInTheDocument();
    expect(screen.getByText('fallback.title')).toBeInTheDocument();
  });

  it('Fallback 축 이름이 i18n 키로 매핑되어 나열됨', async () => {
    render(await AxisFallbackNotice({ usedFallback: ['personal_color', 'hair'] }));
    expect(screen.getByText(/axes\.personalColor, axes\.hair/)).toBeInTheDocument();
  });

  it('실제 분석이 아님을 정직하게 안내 (본문·재시도 힌트 키)', async () => {
    render(await AxisFallbackNotice({ usedFallback: ['body'] }));
    expect(screen.getByText(/fallback\.bodyAfterLabels/)).toBeInTheDocument();
    expect(screen.getByText('fallback.retryHint')).toBeInTheDocument();
  });

  it('알 수 없는 축 코드는 걸러내 "undefined" 노출 방지', async () => {
    // @ts-expect-error — 방어 로직 검증: 라벨 없는 축 코드 주입
    render(await AxisFallbackNotice({ usedFallback: ['unknown_axis'] }));
    // 유효 라벨이 0개면 배너 미표시
    expect(screen.queryByTestId('axis-fallback-notice')).toBeNull();
  });
});
