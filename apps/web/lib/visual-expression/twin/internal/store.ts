/**
 * AI 트윈 저장소 — 비공개 Storage 버킷 + user_twins 테이블 (ADR-115)
 *
 * Storage(비공개 버킷 `twins`)는 storage.objects RLS 정책이 없어 서명 URL·업로드·삭제에
 * **service role**이 필요하다. 일관성을 위해 DB(user_twins)도 같은 클라이언트를 쓰되,
 * 모든 쿼리는 인증된 `userId`(clerk_user_id)로 소유권을 강제한다(방어적 심층).
 *
 * @module lib/visual-expression/twin/internal/store
 * @see ADR-115, SDD-AI-TWIN §1, docs/adr/ADR-113
 */

import { randomUUID } from 'node:crypto';
import { createServiceRoleClient } from '@/lib/supabase/service-role';
import type { TwinRecord, TwinStatus } from '../types';
import { TwinNotFoundError } from './errors';

/** 비공개 버킷 이름 (분석 이미지 경로와 분리) */
export const TWIN_BUCKET = 'twins';

/** 서명 URL 유효 시간(초) */
const SIGNED_URL_TTL = 60 * 60; // 1시간

/** user_twins 행 형태 (필요한 컬럼만) */
interface TwinRow {
  id: string;
  clerk_user_id: string;
  image_path: string;
  status: TwinStatus;
  source_meta: Record<string, unknown> | null;
  created_at: string;
}

/** 사용자별 Storage 경로 규칙: `{userId}/{twinId}.png` (버킷 내 키) */
export function buildTwinPath(userId: string, twinId: string): string {
  return `${userId}/${twinId}.png`;
}

type ServiceClient = ReturnType<typeof createServiceRoleClient>;

/** 버킷 내 경로에 대한 서명 URL 발급 */
async function signPath(client: ServiceClient, path: string): Promise<string> {
  const { data, error } = await client.storage
    .from(TWIN_BUCKET)
    .createSignedUrl(path, SIGNED_URL_TTL);
  if (error || !data?.signedUrl) {
    throw new Error(`[twin/store] createSignedUrl failed: ${error?.message ?? 'no url'}`);
  }
  return data.signedUrl;
}

/** 행 → TwinRecord (서명 URL 포함) */
async function toRecord(client: ServiceClient, row: TwinRow): Promise<TwinRecord> {
  const imageUrl = await signPath(client, row.image_path);
  return { id: row.id, imageUrl, status: row.status, aiGenerated: true };
}

/**
 * 트윈 이미지 업로드 + 행 삽입 (status: pending).
 *
 * twinId를 미리 생성해 Storage 경로와 행 id를 일치시킨다.
 */
export async function insertTwin(params: {
  userId: string;
  imageBase64: string; // raw base64 (data URL 접두사 없음)
  mimeType: string;
  sourceMeta: Record<string, unknown>;
}): Promise<TwinRecord> {
  const client = createServiceRoleClient();
  const twinId = randomUUID();
  const path = buildTwinPath(params.userId, twinId);
  const buffer = Buffer.from(params.imageBase64, 'base64');

  const { error: uploadError } = await client.storage
    .from(TWIN_BUCKET)
    .upload(path, buffer, { contentType: params.mimeType, upsert: false });
  if (uploadError) {
    throw new Error(`[twin/store] upload failed: ${uploadError.message}`);
  }

  const { data, error } = await client
    .from('user_twins')
    .insert({
      id: twinId,
      clerk_user_id: params.userId,
      image_path: path,
      status: 'pending',
      source_meta: params.sourceMeta,
    })
    .select('id, clerk_user_id, image_path, status, source_meta, created_at')
    .single();

  if (error || !data) {
    // 행 삽입 실패 시 고아 파일 정리(베스트 에포트)
    await client.storage.from(TWIN_BUCKET).remove([path]);
    throw new Error(`[twin/store] insert failed: ${error?.message ?? 'no row'}`);
  }

  return toRecord(client, data as TwinRow);
}

/** id + 소유자로 단건 조회 (없으면 null) */
export async function getTwinRowById(userId: string, id: string): Promise<TwinRow | null> {
  const client = createServiceRoleClient();
  const { data } = await client
    .from('user_twins')
    .select('id, clerk_user_id, image_path, status, source_meta, created_at')
    .eq('id', id)
    .eq('clerk_user_id', userId)
    .maybeSingle();
  return (data as TwinRow | null) ?? null;
}

/** 승인된 트윈(최신 1개) — 없으면 null */
export async function getApprovedTwin(userId: string): Promise<TwinRecord | null> {
  const client = createServiceRoleClient();
  const { data } = await client
    .from('user_twins')
    .select('id, clerk_user_id, image_path, status, source_meta, created_at')
    .eq('clerk_user_id', userId)
    .eq('status', 'approved')
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle();
  if (!data) return null;
  return toRecord(client, data as TwinRow);
}

/** 내 트윈 — approved 우선, 없으면 최신(pending 포함) 1개 */
export async function getMyTwin(userId: string): Promise<TwinRecord | null> {
  const approved = await getApprovedTwin(userId);
  if (approved) return approved;

  const client = createServiceRoleClient();
  const { data } = await client
    .from('user_twins')
    .select('id, clerk_user_id, image_path, status, source_meta, created_at')
    .eq('clerk_user_id', userId)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle();
  if (!data) return null;
  return toRecord(client, data as TwinRow);
}

/**
 * 승인 — 기존 approved는 모두 rejected로 강등(사용자당 approved 1개 원칙),
 * 대상은 approved로 전환.
 */
export async function approveTwin(userId: string, id: string): Promise<TwinRecord> {
  const target = await getTwinRowById(userId, id);
  if (!target) throw new TwinNotFoundError();

  const client = createServiceRoleClient();
  const now = new Date().toISOString();

  // 기존 approved → rejected (대상 자신은 아직 approved가 아님)
  await client
    .from('user_twins')
    .update({ status: 'rejected', updated_at: now })
    .eq('clerk_user_id', userId)
    .eq('status', 'approved');

  const { data, error } = await client
    .from('user_twins')
    .update({ status: 'approved', updated_at: now })
    .eq('id', id)
    .eq('clerk_user_id', userId)
    .select('id, clerk_user_id, image_path, status, source_meta, created_at')
    .single();

  if (error || !data) {
    throw new Error(`[twin/store] approve failed: ${error?.message ?? 'no row'}`);
  }
  return toRecord(client, data as TwinRow);
}

/** 거부 — 대상을 rejected로 전환 */
export async function rejectTwin(userId: string, id: string): Promise<TwinRecord> {
  const target = await getTwinRowById(userId, id);
  if (!target) throw new TwinNotFoundError();

  const client = createServiceRoleClient();
  const { data, error } = await client
    .from('user_twins')
    .update({ status: 'rejected', updated_at: new Date().toISOString() })
    .eq('id', id)
    .eq('clerk_user_id', userId)
    .select('id, clerk_user_id, image_path, status, source_meta, created_at')
    .single();

  if (error || !data) {
    throw new Error(`[twin/store] reject failed: ${error?.message ?? 'no row'}`);
  }
  return toRecord(client, data as TwinRow);
}

/** 삭제 — Storage 파일 + DB 행 동시 제거 */
export async function deleteTwin(userId: string, id: string): Promise<void> {
  const target = await getTwinRowById(userId, id);
  if (!target) throw new TwinNotFoundError();

  const client = createServiceRoleClient();

  const { error: removeError } = await client.storage.from(TWIN_BUCKET).remove([target.image_path]);
  if (removeError) {
    throw new Error(`[twin/store] storage remove failed: ${removeError.message}`);
  }

  const { error: deleteError } = await client
    .from('user_twins')
    .delete()
    .eq('id', id)
    .eq('clerk_user_id', userId);
  if (deleteError) {
    throw new Error(`[twin/store] row delete failed: ${deleteError.message}`);
  }
}

/** 승인 트윈의 원본 이미지 바이트를 raw base64로 다운로드(compose용) */
export async function downloadTwinImage(path: string): Promise<{ data: string; mimeType: string }> {
  const client = createServiceRoleClient();
  const { data, error } = await client.storage.from(TWIN_BUCKET).download(path);
  if (error || !data) {
    throw new Error(`[twin/store] download failed: ${error?.message ?? 'no data'}`);
  }
  const arrayBuffer = await data.arrayBuffer();
  const base64 = Buffer.from(arrayBuffer).toString('base64');
  const mimeType = (data as Blob).type || 'image/png';
  return { data: base64, mimeType };
}
