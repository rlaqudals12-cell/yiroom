/**
 * 신체 치수 Repository
 * @description 사용자 신체 측정 데이터 관리
 */

import { supabase } from '@/lib/supabase/client';
import type {
  UserBodyMeasurements,
  UserBodyMeasurementsDB,
  PreferredFit,
} from '@/types/smart-matching';
import { mapMeasurementsRow } from '@/types/smart-matching';

/**
 * 신체 치수 조회
 */
export async function getMeasurements(clerkUserId: string): Promise<UserBodyMeasurements | null> {
  const { data, error } = await supabase
    .from('user_body_measurements')
    .select('*')
    .eq('clerk_user_id', clerkUserId)
    .single();

  if (error || !data) {
    return null;
  }

  return mapMeasurementsRow(data as UserBodyMeasurementsDB);
}

/**
 * 신체 치수 생성/업데이트 (Upsert)
 */
export async function upsertMeasurements(
  clerkUserId: string,
  measurements: Partial<Omit<UserBodyMeasurements, 'clerkUserId' | 'createdAt' | 'updatedAt'>>
): Promise<UserBodyMeasurements | null> {
  const { data, error } = await supabase
    .from('user_body_measurements')
    .upsert({
      clerk_user_id: clerkUserId,
      height: measurements.height ?? null,
      weight: measurements.weight ?? null,
      body_type: measurements.bodyType ?? null,
      chest: measurements.chest ?? null,
      waist: measurements.waist ?? null,
      hip: measurements.hip ?? null,
      shoulder: measurements.shoulder ?? null,
      arm_length: measurements.armLength ?? null,
      inseam: measurements.inseam ?? null,
      foot_length: measurements.footLength ?? null,
      preferred_fit: measurements.preferredFit ?? 'regular',
    })
    .select()
    .single();

  if (error) {
    console.error('[Measurements] Upsert 실패:', error);
    return null;
  }

  return mapMeasurementsRow(data as UserBodyMeasurementsDB);
}

/**
 * 기본 신체 정보 업데이트 (키, 몸무게, 체형)
 */
export async function updateBasicInfo(
  clerkUserId: string,
  info: {
    height?: number;
    weight?: number;
    bodyType?: string;
  }
): Promise<boolean> {
  const updates: Record<string, unknown> = {};

  if (info.height !== undefined) updates.height = info.height;
  if (info.weight !== undefined) updates.weight = info.weight;
  if (info.bodyType !== undefined) updates.body_type = info.bodyType;

  const { error } = await supabase
    .from('user_body_measurements')
    .update(updates)
    .eq('clerk_user_id', clerkUserId);

  if (error) {
    console.error('[Measurements] 기본 정보 업데이트 실패:', error);
    return false;
  }

  return true;
}

/**
 * 상세 치수 업데이트
 */
export async function updateDetailedMeasurements(
  clerkUserId: string,
  measurements: {
    chest?: number;
    waist?: number;
    hip?: number;
    shoulder?: number;
    armLength?: number;
    inseam?: number;
    footLength?: number;
  }
): Promise<boolean> {
  const updates: Record<string, unknown> = {};

  if (measurements.chest !== undefined) updates.chest = measurements.chest;
  if (measurements.waist !== undefined) updates.waist = measurements.waist;
  if (measurements.hip !== undefined) updates.hip = measurements.hip;
  if (measurements.shoulder !== undefined) updates.shoulder = measurements.shoulder;
  if (measurements.armLength !== undefined) updates.arm_length = measurements.armLength;
  if (measurements.inseam !== undefined) updates.inseam = measurements.inseam;
  if (measurements.footLength !== undefined) updates.foot_length = measurements.footLength;

  const { error } = await supabase
    .from('user_body_measurements')
    .update(updates)
    .eq('clerk_user_id', clerkUserId);

  if (error) {
    console.error('[Measurements] 상세 치수 업데이트 실패:', error);
    return false;
  }

  return true;
}

/**
 * 선호 핏 업데이트
 */
export async function updatePreferredFit(
  clerkUserId: string,
  preferredFit: PreferredFit
): Promise<boolean> {
  const { error } = await supabase
    .from('user_body_measurements')
    .update({ preferred_fit: preferredFit })
    .eq('clerk_user_id', clerkUserId);

  if (error) {
    console.error('[Measurements] 선호 핏 업데이트 실패:', error);
    return false;
  }

  return true;
}

/**
 * C-1 체형 분석 결과와 동기화
 * @description body_type_assessments 테이블의 결과를 measurements에 반영
 */
export async function syncFromBodyAnalysis(
  clerkUserId: string,
  analysisResult: {
    height?: number;
    weight?: number;
    bodyType?: string;
  }
): Promise<boolean> {
  // 기존 데이터 조회
  const existing = await getMeasurements(clerkUserId);

  // 분석 결과로 업데이트 (기존 상세 치수는 유지)
  const result = await upsertMeasurements(clerkUserId, {
    ...existing,
    height: analysisResult.height ?? existing?.height,
    weight: analysisResult.weight ?? existing?.weight,
    bodyType: analysisResult.bodyType ?? existing?.bodyType,
  });

  return result !== null;
}
