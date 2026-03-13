/**
 * useWidgetOrder 단위 테스트
 * - 유효성 검사 로직과 기본 순서 검증
 * - Clerk/Supabase는 mock으로 분리 (환경 초기화 부하 최소화)
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';

// Clerk mock — 비로그인 상태
vi.mock('@clerk/nextjs', () => ({
  useUser: () => ({ user: null }),
}));

// Supabase mock — 비연결 상태 (localStorage fallback)
vi.mock('@/lib/supabase/clerk-client', () => ({
  useClerkSupabaseClient: () => null,
}));

// localStorage mock
const store: Record<string, string> = {};
const localStorageMock = {
  getItem: vi.fn((key: string) => store[key] ?? null),
  setItem: vi.fn((key: string, value: string) => {
    store[key] = value;
  }),
  removeItem: vi.fn((key: string) => {
    delete store[key];
  }),
};
Object.defineProperty(window, 'localStorage', { value: localStorageMock });

// import 후에 mock이 적용됨
import { useWidgetOrder, DEFAULT_WIDGET_ORDER } from '@/hooks/useWidgetOrder';
import type { WidgetId } from '@/hooks/useWidgetOrder';

describe('useWidgetOrder', () => {
  beforeEach(() => {
    // store 비우기
    Object.keys(store).forEach((k) => delete store[k]);
    vi.clearAllMocks();
  });

  it('should return default order initially', () => {
    const { result } = renderHook(() => useWidgetOrder());
    expect(result.current.order).toEqual([...DEFAULT_WIDGET_ORDER]);
    expect(result.current.isCustomized).toBe(false);
  });

  it('should load order from localStorage', async () => {
    const customOrder: WidgetId[] = [
      'capsule',
      'insight',
      'analysis-summary',
      'recently-viewed',
      'activity-bar',
    ];
    store['yiroom_widget_order'] = JSON.stringify(customOrder);

    const { result } = renderHook(() => useWidgetOrder());

    await act(async () => {
      await new Promise((r) => setTimeout(r, 50));
    });

    expect(result.current.order).toEqual(customOrder);
    expect(result.current.isCustomized).toBe(true);
  });

  it('should ignore invalid localStorage data', async () => {
    store['yiroom_widget_order'] = JSON.stringify(['insight', 'capsule']);

    const { result } = renderHook(() => useWidgetOrder());

    await act(async () => {
      await new Promise((r) => setTimeout(r, 50));
    });

    expect(result.current.order).toEqual([...DEFAULT_WIDGET_ORDER]);
    expect(result.current.isCustomized).toBe(false);
  });

  it('should update order and save to localStorage', () => {
    const { result } = renderHook(() => useWidgetOrder());

    const newOrder: WidgetId[] = [
      'recently-viewed',
      'capsule',
      'insight',
      'analysis-summary',
      'activity-bar',
    ];

    act(() => {
      result.current.setOrder(newOrder);
    });

    expect(result.current.order).toEqual(newOrder);
    expect(result.current.isCustomized).toBe(true);
    expect(localStorageMock.setItem).toHaveBeenCalledWith(
      'yiroom_widget_order',
      JSON.stringify(newOrder)
    );
  });

  it('should reset order to default', () => {
    const { result } = renderHook(() => useWidgetOrder());

    act(() => {
      result.current.setOrder([
        'capsule',
        'insight',
        'analysis-summary',
        'activity-bar',
        'recently-viewed',
      ]);
    });

    act(() => {
      result.current.resetOrder();
    });

    expect(result.current.order).toEqual([...DEFAULT_WIDGET_ORDER]);
    expect(result.current.isCustomized).toBe(false);
    expect(localStorageMock.removeItem).toHaveBeenCalledWith('yiroom_widget_order');
  });

  it('should export DEFAULT_WIDGET_ORDER with 5 widgets', () => {
    expect(DEFAULT_WIDGET_ORDER).toHaveLength(5);
    expect(DEFAULT_WIDGET_ORDER).toContain('insight');
    expect(DEFAULT_WIDGET_ORDER).toContain('capsule');
    expect(DEFAULT_WIDGET_ORDER).toContain('analysis-summary');
    expect(DEFAULT_WIDGET_ORDER).toContain('activity-bar');
    expect(DEFAULT_WIDGET_ORDER).toContain('recently-viewed');
  });
});
