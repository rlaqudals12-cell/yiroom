/**
 * SafetyProfile 저장소 (암호화/복호화 CRUD)
 *
 * @see docs/adr/ADR-070-safety-profile-architecture.md
 *
 * - 읽기: DB에서 암호화된 row 조회 → 복호화 → SafetyProfile 반환
 * - 쓰기: SafetyProfile → 암호화 → DB에 upsert
 * - 동의 미완료 사용자: 빈 프로필 반환 (에러 아님)
 */

import { createServiceRoleClient } from '@/lib/supabase/service-role';
import { encrypt, decrypt, isEncryptionAvailable } from './crypto';
import type { SafetyProfile, SafetyProfileRow } from './types';

// 현재 동의 버전
const CURRENT_CONSENT_VERSION = '1.0';

// =============================================================================
// 조회
// =============================================================================

/**
 * SafetyProfile 복호화 조회
 *
 * @returns SafetyProfile (동의 미완료 시 빈 프로필)
 * @throws DB 오류 시
 */
export async function getSafetyProfile(userId: string): Promise<SafetyProfile> {
  const supabase = createServiceRoleClient();

  const { data, error } = await supabase
    .from('safety_profiles')
    .select('*')
    .eq('clerk_user_id', userId)
    .maybeSingle();

  if (error) {
    console.error('[Safety] 프로필 조회 실패:', error);
    throw new Error('안전성 프로필을 불러올 수 없습니다.');
  }

  // 프로필 없음 → 빈 프로필 반환
  if (!data) {
    return createEmptyProfile(userId);
  }

  return rowToProfile(data as SafetyProfileRow);
}

// =============================================================================
// 저장
// =============================================================================

/**
 * SafetyProfile 암호화 저장 (upsert)
 *
 * @throws 암호화 키 미설정 또는 DB 오류 시
 */
export async function upsertSafetyProfile(
  userId: string,
  profile: Partial<SafetyProfile>
): Promise<SafetyProfile> {
  if (!isEncryptionAvailable()) {
    throw new Error('[Safety] 암호화 키가 설정되지 않아 프로필을 저장할 수 없습니다.');
  }

  const supabase = createServiceRoleClient();
  const now = new Date().toISOString();

  // 민감 필드 암호화
  const row: Record<string, unknown> = {
    clerk_user_id: userId,
    age: profile.age ?? null,
    consent_given: profile.consentGiven ?? false,
    consent_version: profile.consentVersion ?? CURRENT_CONSENT_VERSION,
    updated_at: now,
  };

  // 동의 완료 시 동의 시각 기록
  if (profile.consentGiven) {
    row.consent_given_at = now;
  }

  // 배열 필드 암호화 (비어있어도 암호화 — 빈 배열도 보호)
  if (profile.allergies !== undefined) {
    row.allergies_encrypted = encrypt(profile.allergies);
  }
  if (profile.conditions !== undefined) {
    row.conditions_encrypted = encrypt(profile.conditions);
  }
  if (profile.skinConditions !== undefined) {
    row.skin_conditions_encrypted = encrypt(profile.skinConditions);
  }
  if (profile.medications !== undefined) {
    row.medications_encrypted = encrypt(profile.medications);
  }

  const { data, error } = await supabase
    .from('safety_profiles')
    .upsert(row, { onConflict: 'clerk_user_id' })
    .select('*')
    .single();

  if (error) {
    console.error('[Safety] 프로필 저장 실패:', error);
    throw new Error('안전성 프로필 저장에 실패했습니다.');
  }

  return rowToProfile(data as SafetyProfileRow);
}

// =============================================================================
// 내부 헬퍼
// =============================================================================

/** DB row → SafetyProfile (복호화) */
function rowToProfile(row: SafetyProfileRow): SafetyProfile {
  return {
    userId: row.clerk_user_id,
    allergies: safeDecrypt(row.allergies_encrypted),
    conditions: safeDecrypt(row.conditions_encrypted),
    skinConditions: safeDecrypt(row.skin_conditions_encrypted),
    medications: safeDecrypt(row.medications_encrypted),
    age: row.age,
    consentGiven: row.consent_given,
    consentVersion: row.consent_version,
    updatedAt: row.updated_at,
  };
}

/** 암호화된 값을 안전하게 복호화 (null → 빈 배열) */
function safeDecrypt(encrypted: string | null): string[] {
  if (!encrypted) return [];
  try {
    return decrypt(encrypted);
  } catch (e) {
    console.error('[Safety] 복호화 실패:', e);
    return [];
  }
}

/** 빈 SafetyProfile 생성 */
function createEmptyProfile(userId: string): SafetyProfile {
  return {
    userId,
    allergies: [],
    conditions: [],
    skinConditions: [],
    medications: [],
    age: null,
    consentGiven: false,
    consentVersion: CURRENT_CONSENT_VERSION,
    updatedAt: new Date().toISOString(),
  };
}
