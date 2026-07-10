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

import {
  generateDailyCapsule,
  checkDailyItem,
  syncRoutineToCapsule,
  isCapsuleStale,
  CAPSULE_ENGINE_VERSION,
} from '@/lib/capsule/daily';
import { getBeautyProfile } from '@/lib/capsule/profile';
import type { DailyCapsule } from '@/types/capsule';

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
      upsert: vi.fn().mockReturnValue({
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
            upsert: vi.fn().mockReturnValue({
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

      const upsertSpy = vi.fn().mockReturnValue({
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
            upsert: upsertSpy,
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
      expect(upsertSpy).toHaveBeenCalledTimes(1);
      const savedPayload = upsertSpy.mock.calls[0][0] as { items: unknown[] };
      expect(savedPayload.items.length).toBeGreaterThan(0);
    });

    it('스텝에 하우투가 담기고 off-thesis(자세/스트레칭) 항목이 없다 (2026-07-08 피드백)', async () => {
      // 실제 도메인 엔진(자동 등록)으로 생성한 payload를 검사
      vi.mocked(getBeautyProfile).mockResolvedValue({
        userId: 'user_test',
        updatedAt: new Date().toISOString(),
        completedModules: ['S', 'PC', 'C', 'H', 'M'],
        personalizationLevel: 2,
        lastFullUpdate: new Date().toISOString(),
        personalColor: {
          season: 'summer',
          subType: 'light',
          palette: ['#AABBCC'],
          paletteNames: ['세레니티 블루'],
        },
        skin: { type: 'combination', concerns: [], scores: {}, foundation: '쿨톤 베이지 21호' },
        body: {
          shape: 'pear',
          measurements: {},
          styleTips: { tops: ['세미오버 셔츠'], bottoms: ['와이드 팬츠'], avoid: ['스키니 팬츠'] },
        },
        hair: { type: 'wavy', scalp: 'oily', concerns: ['frizz'] },
        makeup: { preferences: {}, skillLevel: 'beginner' },
      });

      const upsertSpy = vi.fn().mockReturnValue({
        select: vi.fn().mockReturnValue({
          single: vi.fn().mockResolvedValue({
            data: {
              id: 'daily-howto',
              clerk_user_id: 'user_test',
              date: '2026-07-08',
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
            upsert: upsertSpy,
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

      expect(upsertSpy).toHaveBeenCalledTimes(1);
      const items = (upsertSpy.mock.calls[0][0] as { items: DailyItem[] }).items;
      expect(items.length).toBeGreaterThan(0);

      // ① 저녁 스킨케어에 세럼 포함 (저녁 상식 루틴 = 클렌징→토너→세럼→크림)
      const eveningSkin = items.filter((i) => i.moduleCode === 'S' && i.timeOfDay === 'evening');
      expect(eveningSkin.some((i) => i.category === 'serum')).toBe(true);

      // ② ADR-098: 자세교정/스트레칭류 off-thesis 문구가 사용자 표면에 없다
      for (const item of items) {
        expect(item.name).not.toMatch(/자세|스트레칭|근력/);
      }

      // ③ 체형 아이템 = 아침(옷 입기 전 점검) + 실행 방법(solution) 포함
      const bodyItems = items.filter((i) => i.moduleCode === 'C');
      expect(bodyItems.length).toBeGreaterThan(0);
      for (const item of bodyItems) {
        expect(item.timeOfDay).toBe('morning');
        expect(item.solution).toBeTruthy();
      }

      // ④ 헤어·메이크업 아이템에 하우투(solution) 포함
      const hairItems = items.filter((i) => i.moduleCode === 'H');
      expect(hairItems.length).toBeGreaterThan(0);
      for (const item of hairItems) {
        expect(item.solution).toBeTruthy();
      }
      const makeupItems = items.filter((i) => i.moduleCode === 'M');
      expect(makeupItems.length).toBeGreaterThan(0);
      for (const item of makeupItems) {
        expect(item.solution).toBeTruthy();
      }
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
            // 현재 엔진 버전 스탬프 → 신선한 캐시로 간주되어 그대로 반환
            engineVersion: CAPSULE_ENGINE_VERSION,
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

    it('스테일(옛 엔진 버전) 캐시는 삭제 후 재생성한다 (2026-07-10 캐시 무효화)', async () => {
      vi.mocked(getBeautyProfile).mockResolvedValue(createProfile());

      // 옛 엔진 버전 스탬프가 붙은 캐시 (또는 버전 없음)
      const staleData = {
        id: 'daily-stale',
        clerk_user_id: 'user_test',
        date: '2026-03-04',
        items: [
          {
            id: 'stale-item',
            moduleCode: 'S',
            name: 'Old routine',
            reason: '옛 루틴',
            compatibilityScore: 90,
            isChecked: false,
            engineVersion: 'v1-old',
          },
        ],
        total_ccs: 90,
        estimated_minutes: 10,
        status: 'pending',
        completed_at: null,
        created_at: new Date().toISOString(),
      };

      const deleteSpy = vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          eq: vi.fn().mockResolvedValue({ error: null }),
        }),
      });

      mockSupabaseFrom.mockImplementation((table: string) => {
        if (table === 'daily_capsules') {
          return {
            // 캐시 조회 → 스테일 반환
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                eq: vi.fn().mockReturnValue({
                  maybeSingle: vi.fn().mockResolvedValue({ data: staleData, error: null }),
                }),
              }),
            }),
            delete: deleteSpy,
            upsert: vi.fn().mockReturnValue({
              select: vi.fn().mockReturnValue({
                single: vi.fn().mockResolvedValue({
                  data: {
                    id: 'daily-regenerated',
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
            }),
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

      const result = await generateDailyCapsule('user_test');

      // 스테일 → 삭제 호출 + 재생성(getBeautyProfile 호출) + 새 캡슐 반환
      expect(deleteSpy).toHaveBeenCalledTimes(1);
      expect(getBeautyProfile).toHaveBeenCalled();
      expect(result.id).toBe('daily-regenerated');
    });

    it('스테일 삭제가 실패해도 upsert로 최신 캡슐을 반환한다 (무한 스테일 반환 방지)', async () => {
      vi.mocked(getBeautyProfile).mockResolvedValue(createProfile());

      const staleData = {
        id: 'daily-stale',
        clerk_user_id: 'user_test',
        date: '2026-03-04',
        items: [
          {
            id: 'stale-item',
            moduleCode: 'S',
            name: 'Old routine',
            reason: '옛 루틴',
            compatibilityScore: 90,
            isChecked: false,
            engineVersion: 'v1-old',
          },
        ],
        total_ccs: 90,
        estimated_minutes: 10,
        status: 'pending',
        completed_at: null,
        created_at: new Date().toISOString(),
      };

      // 삭제가 실패(error 반환)해도 upsert가 옛 행을 덮어써 최신 캡슐이 반환돼야 한다.
      const failingDelete = vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          eq: vi.fn().mockResolvedValue({ error: { message: 'delete failed' } }),
        }),
      });
      const upsertSpy = vi.fn().mockReturnValue({
        select: vi.fn().mockReturnValue({
          single: vi.fn().mockResolvedValue({
            data: {
              id: 'daily-upserted-fresh',
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
                  maybeSingle: vi.fn().mockResolvedValue({ data: staleData, error: null }),
                }),
              }),
            }),
            delete: failingDelete,
            upsert: upsertSpy,
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

      const result = await generateDailyCapsule('user_test');

      // 삭제 실패에도 upsert가 호출되고, 스테일이 아닌 갱신 캡슐이 반환된다
      expect(upsertSpy).toHaveBeenCalledTimes(1);
      expect(upsertSpy.mock.calls[0][1]).toEqual({ onConflict: 'clerk_user_id,date' });
      expect(result.id).toBe('daily-upserted-fresh');
      expect(result.id).not.toBe('daily-stale');
    });
  });

  // =========================================================================
  // isCapsuleStale (캐시 버전 무효화)
  // =========================================================================

  describe('isCapsuleStale', () => {
    const makeCapsule = (items: DailyItem[]): DailyCapsule => ({
      id: 'c1',
      userId: 'user_test',
      date: '2026-03-04',
      items,
      totalCcs: 0,
      estimatedMinutes: 0,
      status: 'pending',
      completedAt: null,
      createdAt: new Date().toISOString(),
    });
    const item = (extra: Partial<DailyItem> = {}): DailyItem => ({
      id: 'i1',
      moduleCode: 'S',
      name: 'x',
      reason: 'y',
      compatibilityScore: 0,
      isChecked: false,
      ...extra,
    });

    it('현재 엔진 버전이면 신선(false)', () => {
      const c = makeCapsule([{ ...item(), engineVersion: CAPSULE_ENGINE_VERSION } as DailyItem]);
      expect(isCapsuleStale(c)).toBe(false);
    });

    it('버전 없는 옛 캐시는 스테일(true)', () => {
      expect(isCapsuleStale(makeCapsule([item()]))).toBe(true);
    });

    it('다른 버전이면 스테일(true)', () => {
      const c = makeCapsule([{ ...item(), engineVersion: 'v0-legacy' } as DailyItem]);
      expect(isCapsuleStale(c)).toBe(true);
    });

    it('빈 캡슐은 무효화 대상 아님(false) — 재생성 루프 방지', () => {
      expect(isCapsuleStale(makeCapsule([]))).toBe(false);
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
