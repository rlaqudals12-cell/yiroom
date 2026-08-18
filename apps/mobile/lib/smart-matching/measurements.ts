/**
 * 신체 치수 API 클라이언트
 * @description 사용자 신체 측정 데이터 관리를 웹 정본 API에 위임
 */

import type { UserBodyMeasurements, PreferredFit } from '@/types/smart-matching';

import { requestSmartMatching } from './api-client';

type SerializedMeasurements = Omit<UserBodyMeasurements, 'createdAt' | 'updatedAt'> & {
  createdAt?: string;
  updatedAt?: string;
};
type MeasurementsInput = Partial<
  Omit<UserBodyMeasurements, 'clerkUserId' | 'createdAt' | 'updatedAt'>
>;

function toMeasurements(payload: SerializedMeasurements): UserBodyMeasurements | null {
  // 왜: 웹의 기본 응답(저장 행 없음)은 타임스탬프가 없다. 이를 실측 행처럼 만들지 않는다.
  if (!payload.createdAt || !payload.updatedAt) return null;

  return {
    ...payload,
    createdAt: new Date(payload.createdAt),
    updatedAt: new Date(payload.updatedAt),
  };
}

function toMeasurementsInput(value: UserBodyMeasurements | null): MeasurementsInput {
  if (!value) return {};
  return {
    height: value.height,
    weight: value.weight,
    bodyType: value.bodyType,
    chest: value.chest,
    waist: value.waist,
    hip: value.hip,
    shoulder: value.shoulder,
    armLength: value.armLength,
    inseam: value.inseam,
    footLength: value.footLength,
    preferredFit: value.preferredFit,
  };
}

/**
 * 신체 치수 조회
 */
export async function getMeasurements(
  _clerkUserId: string,
  clerkToken?: string
): Promise<UserBodyMeasurements | null> {
  const payload = await requestSmartMatching<SerializedMeasurements>(
    '/api/smart-matching/measurements',
    clerkToken,
    { method: 'GET' }
  );
  return toMeasurements(payload);
}

/**
 * 신체 치수 생성/업데이트 (Upsert)
 */
export async function upsertMeasurements(
  _clerkUserId: string,
  measurements: MeasurementsInput,
  clerkToken?: string
): Promise<UserBodyMeasurements | null> {
  const payload = await requestSmartMatching<SerializedMeasurements>(
    '/api/smart-matching/measurements',
    clerkToken,
    {
      method: 'PUT',
      body: JSON.stringify(measurements),
    }
  );
  return toMeasurements(payload);
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
  },
  clerkToken?: string
): Promise<boolean> {
  const current = await getMeasurements(clerkUserId, clerkToken);
  return (
    (await upsertMeasurements(
      clerkUserId,
      { ...toMeasurementsInput(current), ...info },
      clerkToken
    )) !== null
  );
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
  },
  clerkToken?: string
): Promise<boolean> {
  const current = await getMeasurements(clerkUserId, clerkToken);
  return (
    (await upsertMeasurements(
      clerkUserId,
      { ...toMeasurementsInput(current), ...measurements },
      clerkToken
    )) !== null
  );
}

/**
 * 선호 핏 업데이트
 */
export async function updatePreferredFit(
  clerkUserId: string,
  preferredFit: PreferredFit,
  clerkToken?: string
): Promise<boolean> {
  const current = await getMeasurements(clerkUserId, clerkToken);
  return (
    (await upsertMeasurements(
      clerkUserId,
      { ...toMeasurementsInput(current), preferredFit },
      clerkToken
    )) !== null
  );
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
  },
  clerkToken?: string
): Promise<boolean> {
  // 기존 데이터 조회
  const existing = await getMeasurements(clerkUserId, clerkToken);

  // 분석 결과로 업데이트 (기존 상세 치수는 유지)
  const result = await upsertMeasurements(
    clerkUserId,
    {
      ...toMeasurementsInput(existing),
      height: analysisResult.height ?? existing?.height,
      weight: analysisResult.weight ?? existing?.weight,
      bodyType: analysisResult.bodyType ?? existing?.bodyType,
    },
    clerkToken
  );

  return result !== null;
}
