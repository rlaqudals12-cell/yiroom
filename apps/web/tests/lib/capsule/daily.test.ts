/**
 * Daily Capsule 테스트
 * @see lib/capsule/daily.ts
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { _clearRegistry, registerDomain, getDomainCount } from '@/lib/capsule/registry';
import type { BeautyProfile, DailyItem } from '@/types/capsule';

// =============================================================================
// Mock 설정
// =============================================================================

// Supabase mock
const mockSupabaseFrom = vi.fn();
vi.mock('@/lib/supabase/service-role', () => ({
  createServiceRoleClient: () => ({
    from: mockSupabaseFrom,
  }),
}));

// Profile mock
vi.mock('@/lib/capsule/profile', () => ({
  getBeautyProfile: vi.fn(),
}));

// Context mock
vi.mock('@/lib/capsule/context', () => ({
  collectContext: vi.fn().mockResolvedValue({
    dayOfWeek: 'mon',
    season: 'spring',
    recentUsageHistory: {
      lastUsedItems: [],
      lastRotationDate: null,
      frequency: {},
    },
  }),
}));

// Safety mock
vi.mock('@/lib/safety', () => ({
  getSafetyProfile: vi.fn().mockResolvedValue(null),
  checkProductSafety: vi.fn().mockReturnValue({
    grade: 'SAFE',
    score: 100,
    alerts: [],
    blockedIngredients: [],
    disclaimer: '',
  }),
}));

import { generateDailyCapsule, checkDailyItem, syncRoutineToCapsule } from '@/lib/capsule/daily';
import { getBeautyProfile } from '@/lib/capsule/profile';

// =============================================================================
// Mock 데이터
// =============================================================================

function createProfile(): BeautyProfile {
  return {
    userId: 'user_test',
    updatedAt: new Date().toISOString(),
    completedModules: ['S', 'PC'],
    personalizationLevel: 2,
    lastFullUpdate: new Date().toISOString(),
    skin: { type: 'combination', concerns: ['acne'], scores: {} },
  };
}

// =============================================================================
// 테스트
// =============================================================================

describe('Daily Capsule', () => {
  beforeEach(() => {
    _clearRegistry();
    vi.clearAllMocks();

    // 기본 Supabase mock: 캐시 miss
    mockSupabaseFrom.mockReturnValue({
      select: vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            maybeSingle: vi.fn().mockResolvedValue({ data: null, error: null }),
          }),
        }),
      }),
      insert: vi.fn().mockReturnValue({
        select: vi.fn().mockReturnValue({
          single: vi.fn().mockResolvedValue({
            data: {
              id: 'daily-1',
              clerk_user_id: 'user_test',
              date: '2026-03-04',
              items: [],
              total_ccs: 80,
              estimated_minutes: 15,
              status: 'pending',
              completed_at: null,
              created_at: new Date().toISOString(),
            },
            error: null,
          }),
        }),
      }),
    });
  });

  // =========================================================================
  // generateDailyCapsule
  // =========================================================================

  describe('generateDailyCapsule', () => {
    it('should return empty capsule if no profile', async () => {
      // 프로필 없는 시나리오 (방어적 null 체크 테스트)
      vi.mocked(getBeautyProfile).mockResolvedValue(null as unknown as BeautyProfile);

      const result = await generateDailyCapsule('user_test');

      expect(result.id).toBe('empty');
      expect(result.items).toEqual([]);
      expect(result.totalCcs).toBe(0);
    });

    it('should generate daily capsule with registered domains', async () => {
      vi.mocked(getBeautyProfile).mockResolvedValue(createProfile());

      // Mock 도메인 엔진 등록
      const mockEngine = {
        domainId: 'test-domain',
        domainName: '테스트',
        curate: vi.fn().mockResolvedValue([
          { id: 'item-1', name: 'Test Item 1' },
          { id: 'item-2', name: 'Test Item 2' },
        ]),
        getOptimalN: vi.fn().mockReturnValue(5),
        checkCompatibility: vi
          .fn()
          .mockReturnValue({ overall: 80, layer1: 80, layer2: 0, layer3: 0 }),
        getPairwiseScore: vi.fn().mockReturnValue(80),
        personalize: vi.fn((items: unknown[]) => items),
        shouldRotate: vi.fn().mockReturnValue(false),
        rotate: vi.fn(),
        minimize: vi.fn((items: unknown[]) => items),
      };
      registerDomain(mockEngine);

      // getCrossDomainRules mock
      mockSupabaseFrom.mockImplementation((table: string) => {
        if (table === 'daily_capsules') {
          return {
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                eq: vi.fn().mockReturnValue({
                  maybeSingle: vi.fn().mockResolvedValue({ data: null, error: null }),
                }),
              }),
            }),
            insert: vi.fn().mockReturnValue({
              select: vi.fn().mockReturnValue({
                single: vi.fn().mockResolvedValue({
                  data: {
                    id: 'daily-generated',
                    clerk_user_id: 'user_test',
                    date: '2026-03-04',
                    items: [
                      {
                        id: 'item-1',
                        moduleCode: 'S',
                        name: 'Test Item 1',
                        reason: '오늘의 루틴에 추천드려요',
                        compatibilityScore: 80,
                        isChecked: false,
                      },
                    ],
                    total_ccs: 80,
                    estimated_minutes: 10,
                    status: 'pending',
                    completed_at: null,
                    created_at: new Date().toISOString(),
                  },
                  error: null,
                }),
              }),
            }),
          };
        }
        if (table === 'cross_domain_rules') {
          return {
            select: vi.fn().mockResolvedValue({ data: [], error: null }),
          };
        }
        return {
          select: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                maybeSingle: vi.fn().mockResolvedValue({ data: null, error: null }),
              }),
            }),
          }),
        };
      });

      const result = await generateDailyCapsule('user_test');

      expect(result.id).toBe('daily-generated');
      expect(mockEngine.curate).toHaveBeenCalled();
      expect(mockEngine.personalize).toHaveBeenCalled();
      expect(mockEngine.minimize).toHaveBeenCalled();
    });

    it('should auto-register domains when registry is empty (dead-registration 회귀 방지)', async () => {
      // registry는 beforeEach의 _clearRegistry()로 비어 있음.
      // 앱 부트스트랩에서 registerAllDomains가 호출되지 않아도, generateDailyCapsule이
      // 스스로 등록하여 빈 캡슐이 아닌 실제 아이템을 생성해야 한다.
      vi.mocked(getBeautyProfile).mockResolvedValue(createProfile());
      expect(getDomainCount()).toBe(0);

      const insertSpy = vi.fn().mockReturnValue({
        select: vi.fn().mockReturnValue({
          single: vi.fn().mockResolvedValue({
            data: {
              id: 'daily-autoreg',
              clerk_user_id: 'user_test',
              date: '2026-03-04',
              items: [],
              total_ccs: 0,
              estimated_minutes: 0,
              status: 'pending',
              completed_at: null,
              created_at: new Date().toISOString(),
            },
            error: null,
          }),
        }),
      });

      mockSupabaseFrom.mockImplementation((table: string) => {
        if (table === 'daily_capsules') {
          return {
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                eq: vi.fn().mockReturnValue({
                  maybeSingle: vi.fn().mockResolvedValue({ data: null, error: null }),
                }),
              }),
            }),
            insert: insertSpy,
          };
        }
        if (table === 'cross_domain_rules') {
          return { select: vi.fn().mockResolvedValue({ data: [], error: null }) };
        }
        return {
          select: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                maybeSingle: vi.fn().mockResolvedValue({ data: null, error: null }),
              }),
            }),
          }),
        };
      });

      await generateDailyCapsule('user_test');

      // 자동 등록되어 9개 도메인이 채워짐
      expect(getDomainCount()).toBeGreaterThan(0);
      // 저장 시 실제 도메인 curate 결과가 비어 있지 않아야 함 (빈 캡슐 아님)
      expect(insertSpy).toHaveBeenCalledTimes(1);
      const savedPayload = insertSpy.mock.calls[0][0] as { items: unknown[] };
      expect(savedPayload.items.length).toBeGreaterThan(0);
    });

    it('should return cached capsule if exists', async () => {
      const cachedData = {
        id: 'daily-cached',
        clerk_user_id: 'user_test',
        date: '2026-03-04',
        items: [
          {
            id: 'cached-item',
            moduleCode: 'S',
            name: 'Cached',
            reason: '캐시',
            compatibilityScore: 90,
            isChecked: false,
          },
        ],
        total_ccs: 90,
        estimated_minutes: 10,
        status: 'pending',
        completed_at: null,
        created_at: new Date().toISOString(),
      };

      mockSupabaseFrom.mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              maybeSingle: vi.fn().mockResolvedValue({ data: cachedData, error: null }),
            }),
          }),
        }),
      });

      const result = await generateDailyCapsule('user_test');

      expect(result.id).toBe('daily-cached');
      expect(result.totalCcs).toBe(90);
      // getBeautyProfile은 캐시 히트 시 호출되지 않아야 함
      expect(getBeautyProfile).not.toHaveBeenCalled();
    });
  });

  // =========================================================================
  // checkDailyItem
  // =========================================================================

  describe('checkDailyItem', () => {
    it('should update item check status', async () => {
      const items: DailyItem[] = [
        {
          id: 'item-1',
          moduleCode: 'S',
          name: 'Item 1',
          reason: '이유',
          compatibilityScore: 80,
          isChecked: false,
        },
        {
          id: 'item-2',
          moduleCode: 'N',
          name: 'Item 2',
          reason: '이유',
          compatibilityScore: 80,
          isChecked: false,
        },
      ];

      mockSupabaseFrom.mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({
              data: {
                id: 'daily-1',
                clerk_user_id: 'user_test',
                date: '2026-03-04',
                items,
                total_ccs: 80,
                estimated_minutes: 15,
                status: 'pending',
                completed_at: null,
                created_at: new Date().toISOString(),
              },
              error: null,
            }),
          }),
        }),
        update: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            select: vi.fn().mockReturnValue({
              single: vi.fn().mockResolvedValue({
                data: {
                  id: 'daily-1',
                  clerk_user_id: 'user_test',
                  date: '2026-03-04',
                  items: [{ ...items[0], isChecked: true }, items[1]],
                  total_ccs: 80,
                  estimated_minutes: 15,
                  status: 'in_progress',
                  completed_at: null,
                  created_at: new Date().toISOString(),
                },
                error: null,
              }),
            }),
          }),
        }),
      });

      const result = await checkDailyItem('daily-1', 'item-1', true);

      expect(result).not.toBeNull();
      expect(result!.status).toBe('in_progress');
    });

    it('should return null if capsule not found', async () => {
      mockSupabaseFrom.mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({
              data: null,
              error: { message: 'not found' },
            }),
          }),
        }),
      });

      const result = await checkDailyItem('nonexistent', 'item-1', true);
      expect(result).toBeNull();
    });
  });

  // =========================================================================
  // syncRoutineToCapsule (루틴-캡슐 동기화)
  // =========================================================================

  describe('syncRoutineToCapsule', () => {
    it('should auto-check first unchecked N item when nutrition recorded', async () => {
      const items: DailyItem[] = [
        {
          id: 'skin-1',
          moduleCode: 'S',
          name: 'Skin',
          reason: '',
          compatibilityScore: 80,
          isChecked: false,
        },
        {
          id: 'nut-1',
          moduleCode: 'N',
          name: 'Nutrition',
          reason: '',
          compatibilityScore: 80,
          isChecked: false,
        },
      ];

      // getCachedDailyCapsule 호출 시
      const selectChain = {
        eq: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            maybeSingle: vi.fn().mockResolvedValue({
              data: {
                id: 'daily-1',
                clerk_user_id: 'user_test',
                date: new Date().toISOString().split('T')[0],
                items,
                total_ccs: 80,
                estimated_minutes: 15,
                status: 'pending',
                completed_at: null,
                created_at: new Date().toISOString(),
              },
              error: null,
            }),
          }),
        }),
      };

      // checkDailyItem 호출 시
      const singleSelectChain = {
        eq: vi.fn().mockReturnValue({
          single: vi.fn().mockResolvedValue({
            data: {
              id: 'daily-1',
              clerk_user_id: 'user_test',
              date: new Date().toISOString().split('T')[0],
              items,
              total_ccs: 80,
              estimated_minutes: 15,
              status: 'pending',
              completed_at: null,
              created_at: new Date().toISOString(),
            },
            error: null,
          }),
        }),
      };

      let callCount = 0;
      mockSupabaseFrom.mockImplementation(() => {
        callCount++;
        if (callCount === 1) {
          // getCachedDailyCapsule → daily_capsules select
          return { select: vi.fn().mockReturnValue(selectChain) };
        }
        // checkDailyItem → select + update
        return {
          select: vi.fn().mockReturnValue(singleSelectChain),
          update: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              select: vi.fn().mockReturnValue({
                single: vi.fn().mockResolvedValue({
                  data: {
                    id: 'daily-1',
                    clerk_user_id: 'user_test',
                    date: new Date().toISOString().split('T')[0],
                    items: [items[0], { ...items[1], isChecked: true }],
                    total_ccs: 80,
                    estimated_minutes: 15,
                    status: 'in_progress',
                    completed_at: null,
                    created_at: new Date().toISOString(),
                  },
                  error: null,
                }),
              }),
            }),
          }),
        };
      });

      // 에러 없이 실행되어야 함
      await expect(syncRoutineToCapsule('user_test', 'N')).resolves.not.toThrow();
    });

    it('should not throw if no cached capsule exists', async () => {
      mockSupabaseFrom.mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              maybeSingle: vi.fn().mockResolvedValue({ data: null, error: null }),
            }),
          }),
        }),
      });

      await expect(syncRoutineToCapsule('user_test', 'W')).resolves.not.toThrow();
    });
  });
});
