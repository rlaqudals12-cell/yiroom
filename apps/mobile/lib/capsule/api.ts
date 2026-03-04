/**
 * 캡슐 에코시스템 API 클라이언트
 *
 * 웹 API 엔드포인트 호출 + Supabase 직접 조회
 * @see docs/adr/ADR-069-capsule-ecosystem-architecture.md
 * @see docs/adr/ADR-073-one-button-daily.md
 */

const API_BASE_URL = process.env.EXPO_PUBLIC_API_URL ?? 'https://yiroom.vercel.app';

// =============================================================================
// 타입 정의
// =============================================================================

export interface DailyItem {
  id: string;
  moduleCode: string;
  name: string;
  reason: string;
  compatibilityScore: number;
  isChecked: boolean;
}

export interface DailyCapsule {
  id: string;
  userId: string;
  date: string;
  items: DailyItem[];
  totalCcs: number;
  estimatedMinutes: number;
  status: 'pending' | 'in_progress' | 'completed';
  completedAt: string | null;
  createdAt: string;
}

export interface BeautyProfile {
  userId: string;
  updatedAt: string;
  completedModules: string[];
  personalizationLevel: number;
  skin?: { type: string; concerns: string[]; scores: Record<string, number> };
  personalColor?: { season: string; subType: string; palette: string[] };
  body?: { shape: string; measurements: Record<string, number> };
  workout?: { fitnessLevel: string; goals: string[]; history: string[] };
  nutrition?: { deficiencies: string[]; dietType: string; allergies: string[] };
  hair?: { type: string; scalp: string; concerns: string[] };
  makeup?: { preferences: Record<string, string>; skillLevel: string };
  oral?: { conditions: string[]; goals: string[] };
  fashion?: { style: string; sizeProfile: Record<string, string>; wardrobe: string[] };
}

export interface CapsuleOverview {
  domainId: string;
  domainName: string;
  itemCount: number;
  optimalN: number;
  ccs: number;
  status: string;
}

export interface RotationResult {
  removedCount: number;
  addedCount: number;
  compatibilityBefore: number;
  compatibilityAfter: number;
}

export interface ApiError {
  code: string;
  message: string;
}

// =============================================================================
// API 호출 헬퍼
// =============================================================================

async function apiRequest<T>(
  path: string,
  options: RequestInit = {},
  authToken?: string
): Promise<{ data: T | null; error: ApiError | null }> {
  try {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };
    if (authToken) {
      headers['Authorization'] = `Bearer ${authToken}`;
    }

    const response = await fetch(`${API_BASE_URL}${path}`, {
      ...options,
      headers: { ...headers, ...options.headers },
    });

    const json = await response.json();

    if (!response.ok || json.success === false) {
      return {
        data: null,
        error: json.error ?? { code: 'UNKNOWN_ERROR', message: '서버 오류가 발생했습니다.' },
      };
    }

    return { data: json.data ?? json, error: null };
  } catch {
    return {
      data: null,
      error: { code: 'NETWORK_ERROR', message: '네트워크 연결을 확인해주세요.' },
    };
  }
}

// =============================================================================
// Daily Capsule API
// =============================================================================

/** Daily Capsule 생성 또는 조회 */
export async function generateDailyCapsule(
  authToken: string
): Promise<{ data: DailyCapsule | null; error: ApiError | null }> {
  return apiRequest<DailyCapsule>('/api/capsule/daily', {
    method: 'POST',
  }, authToken);
}

/** 오늘의 Daily Capsule 조회 (캐시) */
export async function getTodayDailyCapsule(
  authToken: string
): Promise<{ data: DailyCapsule | null; error: ApiError | null }> {
  return apiRequest<DailyCapsule>('/api/capsule/daily', {
    method: 'GET',
  }, authToken);
}

/** Daily 아이템 완료 체크 */
export async function checkDailyItem(
  capsuleId: string,
  itemId: string,
  isChecked: boolean,
  authToken: string
): Promise<{ data: DailyCapsule | null; error: ApiError | null }> {
  return apiRequest<DailyCapsule>(`/api/capsule/daily/${capsuleId}`, {
    method: 'PATCH',
    body: JSON.stringify({ itemId, isChecked }),
  }, authToken);
}

// =============================================================================
// BeautyProfile API
// =============================================================================

/** BeautyProfile 조회 */
export async function getBeautyProfile(
  authToken: string
): Promise<{ data: BeautyProfile | null; error: ApiError | null }> {
  return apiRequest<BeautyProfile>('/api/capsule/profile', {
    method: 'GET',
  }, authToken);
}

// =============================================================================
// Domain Capsule API
// =============================================================================

/** 도메인별 캡슐 조회 */
export async function getDomainCapsule(
  domainId: string,
  authToken: string
): Promise<{ data: CapsuleOverview | null; error: ApiError | null }> {
  return apiRequest<CapsuleOverview>(`/api/capsule/${domainId}`, {
    method: 'GET',
  }, authToken);
}

// =============================================================================
// Rotation API
// =============================================================================

/** 캡슐 로테이션 실행 */
export async function rotateCapsule(
  domainId: string,
  authToken: string,
  reason: 'time-based' | 'trigger-based' | 'user-requested' = 'user-requested'
): Promise<{ data: RotationResult | null; error: ApiError | null }> {
  return apiRequest<RotationResult>('/api/capsule/rotate', {
    method: 'POST',
    body: JSON.stringify({ domainId, reason }),
  }, authToken);
}
