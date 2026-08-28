/**
 * 생체정보 동의 철회 + 분석 이미지 파기 오케스트레이터.
 *
 * PostgreSQL과 Supabase Storage는 하나의 트랜잭션으로 묶을 수 없다. 따라서 이 함수는
 * (1) 수집·저장 동의를 먼저 fail-closed 상태로 바꾸고, (2) 모든 이미지/메타데이터
 * 파기 단계를 끝까지 시도하며, (3) 하나라도 실패하면 그 대상을 호출자에게 반환한다.
 * 일부 성공을 전체 성공으로 위장하지 않는 것이 이 경계의 원자성 계약이다.
 */
import type { createServiceRoleClient } from '@/lib/supabase/service-role';
import { BIOMETRIC_STORAGE_BUCKETS, purgeUserStorageBuckets } from '@/lib/api/storage-purge';

type ServiceClient = ReturnType<typeof createServiceRoleClient>;

const IMAGE_CONSENT_TYPES = [
  'skin',
  'body',
  'personal-color',
  'hair',
  'makeup',
  'posture',
  'twin',
] as const;

type ImageConsentType = (typeof IMAGE_CONSENT_TYPES)[number];

/**
 * 축별 원본 버킷과 결과 포인터. 공용 analysis_images 정리가 실패하면 어떤 축도
 * 완료로 확정하지 않는다. 축과 무관한 통합 세션·AI 트윈은 각자의 재시도 큐로 관리한다.
 */
const AXIS_PURGE_TARGETS: Record<ImageConsentType, { storage: string; metadata: string }> = {
  skin: { storage: 'storage:skin-images', metadata: 'db:skin_analyses' },
  body: { storage: 'storage:body-images', metadata: 'db:body_analyses' },
  'personal-color': {
    storage: 'storage:personal-color-images',
    metadata: 'db:personal_color_assessments',
  },
  hair: { storage: 'storage:hair-images', metadata: 'db:hair_analyses' },
  makeup: { storage: 'storage:makeup-images', metadata: 'db:makeup_analyses' },
  posture: { storage: 'storage:posture-images', metadata: 'db:posture_analyses' },
  twin: { storage: 'storage:twins', metadata: 'db:user_twins' },
};

/**
 * 실제 분석 테이블에 저장되는 이미지 경로 필드.
 * 이미지 자체는 Storage에서 지우고, 아래 단계는 삭제된 파일을 가리키는 경로도 남기지 않는다.
 */
const IMAGE_POINTER_CLEAR_STEPS = [
  {
    table: 'personal_color_assessments',
    values: { face_image_url: null, left_image_url: null, right_image_url: null },
  },
  { table: 'skin_analyses', values: { image_url: '' } },
  {
    table: 'body_analyses',
    values: {
      image_url: '',
      left_side_image_url: null,
      right_side_image_url: null,
      back_image_url: null,
    },
  },
  { table: 'hair_analyses', values: { image_url: '' } },
  { table: 'makeup_analyses', values: { image_url: '' } },
  { table: 'posture_analyses', values: { front_image_url: '', side_image_url: null } },
] as const;

export interface BiometricWithdrawalResult {
  /** 글로벌 생체 수집·이용 동의가 false로 바뀌었거나 이미 동의 행이 없었는지 여부 */
  consentRevoked: boolean;
  /** Storage에서 실제 삭제된 이미지 파일 수 */
  imagesDeleted: number;
  /** 성공한 DB 이미지 메타데이터/경로 정리 단계 수 (삭제 행 수가 아님) */
  databaseTargetsCleared: number;
  /** 모든 동의·DB·Storage 단계가 성공했는지 여부 */
  fullyPurged: boolean;
  /** 실패한 비민감 대상 라벨. 사용자 ID·파일 경로는 포함하지 않는다. */
  failedTargets: string[];
}

async function revokeConsentFlags(
  supabase: ServiceClient,
  userId: string,
  withdrawalAt: string
): Promise<{ consentRevoked: boolean; completed: number; failedTargets: string[] }> {
  let completed = 0;
  const failedTargets: string[] = [];

  try {
    const { error } = await supabase
      .from('user_agreements')
      .update({
        biometric_agreed: false,
        biometric_agreed_at: null,
      })
      .eq('clerk_user_id', userId);
    if (error) {
      failedTargets.push('db:user_agreements');
    } else {
      completed += 1;
    }
  } catch {
    failedTargets.push('db:user_agreements');
  }

  try {
    const { error } = await supabase
      .from('image_consents')
      .update({
        consent_given: false,
        withdrawal_at: withdrawalAt,
        // 완료 확정 전에는 cron이 재시도할 수 있는 영속 표식을 유지한다.
        retention_until: withdrawalAt,
        cleanup_reconciled_at: null,
      })
      .eq('clerk_user_id', userId)
      .in('analysis_type', IMAGE_CONSENT_TYPES);
    if (error) {
      failedTargets.push('db:image_consents');
    } else {
      completed += 1;
    }
  } catch {
    failedTargets.push('db:image_consents');
  }

  return {
    consentRevoked: !failedTargets.includes('db:user_agreements'),
    completed,
    failedTargets,
  };
}

async function clearImageMetadata(
  supabase: ServiceClient,
  userId: string
): Promise<{ completed: number; failedTargets: string[] }> {
  let completed = 0;
  const failedTargets: string[] = [];

  try {
    const { error } = await supabase.from('analysis_images').delete().eq('clerk_user_id', userId);
    if (error) {
      failedTargets.push('db:analysis_images');
    } else {
      completed += 1;
    }
  } catch {
    failedTargets.push('db:analysis_images');
  }

  // AI 트윈은 얼굴에서 파생된 이미지 레코드라 Storage 파일과 메타데이터를 함께 지운다.
  try {
    const { error } = await supabase.from('user_twins').delete().eq('clerk_user_id', userId);
    if (error) {
      failedTargets.push('db:user_twins');
    } else {
      completed += 1;
    }
  } catch {
    failedTargets.push('db:user_twins');
  }

  for (const step of IMAGE_POINTER_CLEAR_STEPS) {
    try {
      const { error } = await supabase
        .from(step.table)
        .update(step.values)
        .eq('clerk_user_id', userId);
      if (error) {
        failedTargets.push(`db:${step.table}`);
      } else {
        completed += 1;
      }
    } catch {
      failedTargets.push(`db:${step.table}`);
    }
  }

  return { completed, failedTargets };
}

function getPurgedConsentTypes(
  storageFailures: readonly string[],
  metadataFailures: readonly string[],
  consentFlagsFailed: boolean
): ImageConsentType[] {
  if (consentFlagsFailed || metadataFailures.includes('db:analysis_images')) return [];

  const failures = new Set([...storageFailures, ...metadataFailures]);
  return IMAGE_CONSENT_TYPES.filter((analysisType) => {
    const targets = AXIS_PURGE_TARGETS[analysisType];
    return !failures.has(targets.storage) && !failures.has(targets.metadata);
  });
}

/** 성공한 축만 withdrawal_at CAS로 완료 상태에 진입시킨다. 실패 축의 retention은 유지된다. */
async function finalizePurgedConsentTypes(
  supabase: ServiceClient,
  userId: string,
  withdrawalAt: string,
  analysisTypes: readonly ImageConsentType[]
): Promise<string[]> {
  if (analysisTypes.length === 0) return [];

  try {
    const { error } = await supabase
      .from('image_consents')
      .update({ retention_until: null, cleanup_reconciled_at: null })
      .eq('clerk_user_id', userId)
      .eq('consent_given', false)
      .eq('withdrawal_at', withdrawalAt)
      .in('analysis_type', analysisTypes);
    return error ? ['db:image_consents_finalize'] : [];
  } catch {
    return ['db:image_consents_finalize'];
  }
}

async function markIntegratedCleanupPending(
  supabase: ServiceClient,
  userId: string
): Promise<{ completed: number; failedTargets: string[] }> {
  try {
    const { error } = await supabase
      .from('integrated_analysis_sessions')
      .update({ image_cleanup_pending: true })
      .eq('clerk_user_id', userId)
      .or('face_image_url.not.is.null,body_image_url.not.is.null');
    if (error) {
      return { completed: 0, failedTargets: ['db:integrated_analysis_sessions_cleanup_queue'] };
    }
    return { completed: 1, failedTargets: [] };
  } catch {
    return { completed: 0, failedTargets: ['db:integrated_analysis_sessions_cleanup_queue'] };
  }
}

/**
 * integrated-sessions는 Storage 실패 때 포인터를 지우면 재시도 경로를 잃는다.
 * 성공 시에만 포인터를 비우고, Storage/DB 어느 쪽이 불확실해도 영속 pending 큐를 남긴다.
 */
async function reconcileIntegratedImages(
  supabase: ServiceClient,
  userId: string,
  storagePurgeFailed: boolean
): Promise<{ completed: number; failedTargets: string[] }> {
  if (storagePurgeFailed) {
    return markIntegratedCleanupPending(supabase, userId);
  }

  try {
    const { error } = await supabase
      .from('integrated_analysis_sessions')
      .update({
        face_image_url: null,
        body_image_url: null,
        image_cleanup_pending: false,
      })
      .eq('clerk_user_id', userId);
    if (!error) return { completed: 1, failedTargets: [] };
  } catch {
    // 아래 영속 재시도 표식으로 수렴한다.
  }

  const queued = await markIntegratedCleanupPending(supabase, userId);
  return {
    completed: 0,
    failedTargets: ['db:integrated_analysis_sessions', ...queued.failedTargets],
  };
}

/**
 * 현재 사용자의 생체 동의를 철회하고 저장된 생체 분석 이미지를 파기한다.
 * 실패한 단계가 있어도 나머지 파기는 계속 시도하며 결과에 정확히 드러낸다.
 */
export async function revokeBiometricConsentAndPurge(
  supabase: ServiceClient,
  userId: string
): Promise<BiometricWithdrawalResult> {
  const withdrawalAt = new Date().toISOString();

  // 장시간 걸리는 Storage 파기 전에 게이트를 닫아 새 분석 저장을 최대한 빨리 차단한다.
  const consent = await revokeConsentFlags(supabase, userId, withdrawalAt);

  const purge = await purgeUserStorageBuckets(supabase, userId, BIOMETRIC_STORAGE_BUCKETS);
  const metadata = await clearImageMetadata(supabase, userId);
  const integrated = await reconcileIntegratedImages(
    supabase,
    userId,
    purge.failedBuckets.includes('storage:integrated-sessions')
  );
  const purgedConsentTypes = getPurgedConsentTypes(
    purge.failedBuckets,
    metadata.failedTargets,
    consent.failedTargets.includes('db:image_consents')
  );
  const consentFinalizationFailures = await finalizePurgedConsentTypes(
    supabase,
    userId,
    withdrawalAt,
    purgedConsentTypes
  );
  const failedTargets = [
    ...consent.failedTargets,
    ...purge.failedBuckets,
    ...metadata.failedTargets,
    ...integrated.failedTargets,
    ...consentFinalizationFailures,
  ];

  return {
    consentRevoked: consent.consentRevoked,
    imagesDeleted: purge.deleted,
    databaseTargetsCleared: consent.completed + metadata.completed + integrated.completed,
    fullyPurged: failedTargets.length === 0,
    failedTargets,
  };
}
