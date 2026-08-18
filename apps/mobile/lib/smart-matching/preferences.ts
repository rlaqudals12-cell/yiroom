/**
 * 사용자 설정 API 클라이언트
 * @description 예산, 브랜드 선호, 알림 설정 관리를 웹 정본 API에 위임
 */

import type {
  UserPreferences,
  BudgetSettings,
  NotificationFrequency,
} from '@/types/smart-matching';

import { requestSmartMatching } from './api-client';

type PreferencesInput = Omit<UserPreferences, 'clerkUserId' | 'createdAt' | 'updatedAt'>;
type SerializedPreferences = Omit<UserPreferences, 'createdAt' | 'updatedAt'> & {
  createdAt?: string;
  updatedAt?: string;
};

const DEFAULT_PREFERENCES: PreferencesInput = {
  budget: {},
  favoriteBrands: [],
  blockedBrands: [],
  preferredPlatforms: [],
  prioritizeFreeDelivery: true,
  prioritizeFastDelivery: false,
  prioritizePoints: false,
  showAlternatives: true,
  showPriceComparison: true,
  notifyPriceDrop: true,
  notifyRestock: true,
  notificationEmail: true,
  notificationPush: true,
  notificationFrequency: 'daily',
};

function toPreferences(payload: SerializedPreferences): UserPreferences | null {
  // 왜: 웹의 기본 응답(저장 행 없음)을 실제 저장된 설정처럼 위장하지 않는다.
  if (!payload.createdAt || !payload.updatedAt) return null;
  return {
    ...payload,
    createdAt: new Date(payload.createdAt),
    updatedAt: new Date(payload.updatedAt),
  };
}

function toPreferencesInput(value: UserPreferences | null): PreferencesInput {
  if (!value) {
    // 왜: 부분 업데이트가 모듈 전역 기본값을 오염시켜 다음 사용자 요청에 번지지 않게 한다.
    return {
      ...DEFAULT_PREFERENCES,
      budget: {},
      favoriteBrands: [],
      blockedBrands: [],
      preferredPlatforms: [],
    };
  }
  return {
    budget: value.budget,
    favoriteBrands: value.favoriteBrands,
    blockedBrands: value.blockedBrands,
    preferredPlatforms: value.preferredPlatforms,
    prioritizeFreeDelivery: value.prioritizeFreeDelivery,
    prioritizeFastDelivery: value.prioritizeFastDelivery,
    prioritizePoints: value.prioritizePoints,
    showAlternatives: value.showAlternatives,
    showPriceComparison: value.showPriceComparison,
    notifyPriceDrop: value.notifyPriceDrop,
    notifyRestock: value.notifyRestock,
    notificationEmail: value.notificationEmail,
    notificationPush: value.notificationPush,
    notificationFrequency: value.notificationFrequency,
  };
}

/**
 * 사용자 설정 조회
 */
export async function getPreferences(
  _clerkUserId: string,
  clerkToken?: string
): Promise<UserPreferences | null> {
  const payload = await requestSmartMatching<SerializedPreferences>(
    '/api/smart-matching/preferences',
    clerkToken,
    { method: 'GET' }
  );
  return toPreferences(payload);
}

/**
 * 사용자 설정 생성/업데이트 (Upsert)
 */
export async function upsertPreferences(
  _clerkUserId: string,
  preferences: Partial<PreferencesInput>,
  clerkToken?: string
): Promise<UserPreferences | null> {
  const payload = await requestSmartMatching<SerializedPreferences>(
    '/api/smart-matching/preferences',
    clerkToken,
    {
      method: 'PUT',
      body: JSON.stringify(preferences),
    }
  );
  return toPreferences(payload);
}

/**
 * 예산 설정 업데이트
 */
export async function updateBudget(
  clerkUserId: string,
  budget: BudgetSettings,
  clerkToken?: string
): Promise<boolean> {
  const current = await getPreferences(clerkUserId, clerkToken);
  return (
    (await upsertPreferences(
      clerkUserId,
      { ...toPreferencesInput(current), budget },
      clerkToken
    )) !== null
  );
}

/**
 * 즐겨찾기 브랜드 추가
 */
export async function addFavoriteBrand(
  clerkUserId: string,
  brand: string,
  clerkToken?: string
): Promise<boolean> {
  // 현재 설정 조회
  const current = await getPreferences(clerkUserId, clerkToken);
  const favoriteBrands = current?.favoriteBrands ?? [];

  // 이미 추가된 경우
  if (favoriteBrands.includes(brand)) {
    return true;
  }

  return (
    (await upsertPreferences(
      clerkUserId,
      { ...toPreferencesInput(current), favoriteBrands: [...favoriteBrands, brand] },
      clerkToken
    )) !== null
  );
}

/**
 * 즐겨찾기 브랜드 제거
 */
export async function removeFavoriteBrand(
  clerkUserId: string,
  brand: string,
  clerkToken?: string
): Promise<boolean> {
  const current = await getPreferences(clerkUserId, clerkToken);
  const favoriteBrands = (current?.favoriteBrands ?? []).filter((b) => b !== brand);

  return (
    (await upsertPreferences(
      clerkUserId,
      { ...toPreferencesInput(current), favoriteBrands },
      clerkToken
    )) !== null
  );
}

/**
 * 차단 브랜드 추가
 */
export async function addBlockedBrand(
  clerkUserId: string,
  brand: string,
  clerkToken?: string
): Promise<boolean> {
  const current = await getPreferences(clerkUserId, clerkToken);
  const blockedBrands = current?.blockedBrands ?? [];

  if (blockedBrands.includes(brand)) {
    return true;
  }

  return (
    (await upsertPreferences(
      clerkUserId,
      { ...toPreferencesInput(current), blockedBrands: [...blockedBrands, brand] },
      clerkToken
    )) !== null
  );
}

/**
 * 차단 브랜드 제거
 */
export async function removeBlockedBrand(
  clerkUserId: string,
  brand: string,
  clerkToken?: string
): Promise<boolean> {
  const current = await getPreferences(clerkUserId, clerkToken);
  const blockedBrands = (current?.blockedBrands ?? []).filter((b) => b !== brand);

  return (
    (await upsertPreferences(
      clerkUserId,
      { ...toPreferencesInput(current), blockedBrands },
      clerkToken
    )) !== null
  );
}

/**
 * 알림 설정 업데이트
 */
export async function updateNotificationSettings(
  clerkUserId: string,
  settings: {
    email?: boolean;
    push?: boolean;
    frequency?: NotificationFrequency;
    priceDrop?: boolean;
    restock?: boolean;
  },
  clerkToken?: string
): Promise<boolean> {
  const current = await getPreferences(clerkUserId, clerkToken);
  const merged = toPreferencesInput(current);
  if (settings.email !== undefined) merged.notificationEmail = settings.email;
  if (settings.push !== undefined) merged.notificationPush = settings.push;
  if (settings.frequency !== undefined) merged.notificationFrequency = settings.frequency;
  if (settings.priceDrop !== undefined) merged.notifyPriceDrop = settings.priceDrop;
  if (settings.restock !== undefined) merged.notifyRestock = settings.restock;

  return (await upsertPreferences(clerkUserId, merged, clerkToken)) !== null;
}
