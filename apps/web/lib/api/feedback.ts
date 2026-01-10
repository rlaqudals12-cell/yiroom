/**
 * 피드백 API
 * @description Launch - DB 연동 (Repository 패턴)
 */

import { createClerkSupabaseClient } from '@/lib/supabase/server';
import { createServiceRoleClient } from '@/lib/supabase/service-role';
import type { Feedback, FeedbackRow, FeedbackType, FeedbackStatus } from '@/types/feedback';

// ============================================================
// 변환 함수
// ============================================================

/**
 * DB Row -> Feedback 변환
 */
export function toFeedback(row: FeedbackRow): Feedback {
  return {
    id: row.id,
    clerkUserId: row.clerk_user_id,
    type: row.type as FeedbackType,
    title: row.title,
    content: row.content,
    contactEmail: row.contact_email,
    screenshotUrl: row.screenshot_url,
    status: row.status as FeedbackStatus,
    adminNotes: row.admin_notes,
    createdAt: new Date(row.created_at),
    updatedAt: new Date(row.updated_at),
    userName: row.users?.full_name,
  };
}

// ============================================================
// 피드백 조회 API
// ============================================================

/**
 * 사용자 본인의 피드백 목록 조회
 * @param clerkUserId Clerk 사용자 ID
 * @param limit 조회 개수 (기본 50)
 */
export async function getUserFeedbacks(clerkUserId: string, limit = 50): Promise<Feedback[]> {
  const supabase = createClerkSupabaseClient();

  const { data, error } = await supabase
    .from('feedback')
    .select('*')
    .eq('clerk_user_id', clerkUserId)
    .order('created_at', { ascending: false })
    .limit(limit);

  if (error) {
    console.error('[Feedback] getUserFeedbacks error:', error);
    return [];
  }

  return (data as FeedbackRow[]).map(toFeedback);
}

/**
 * 특정 피드백 조회
 * @param feedbackId 피드백 ID
 * @param clerkUserId Clerk 사용자 ID (본인 확인)
 */
export async function getFeedbackById(
  feedbackId: string,
  clerkUserId: string
): Promise<Feedback | null> {
  const supabase = createClerkSupabaseClient();

  const { data, error } = await supabase
    .from('feedback')
    .select('*')
    .eq('id', feedbackId)
    .eq('clerk_user_id', clerkUserId)
    .single();

  if (error || !data) {
    console.error('[Feedback] getFeedbackById error:', error);
    return null;
  }

  return toFeedback(data as FeedbackRow);
}

// ============================================================
// 피드백 제출 API
// ============================================================

interface SubmitFeedbackParams {
  clerkUserId: string | null;
  type: FeedbackType;
  title: string;
  content: string;
  contactEmail?: string;
  screenshotUrl?: string;
}

/**
 * 피드백 제출 (익명 가능)
 * @description Service Role 클라이언트 사용 (익명 사용자 허용)
 */
export async function submitFeedback(
  params: SubmitFeedbackParams
): Promise<{ success: boolean; id: string | null; error?: string }> {
  const supabase = createServiceRoleClient();

  const { data, error } = await supabase
    .from('feedback')
    .insert({
      clerk_user_id: params.clerkUserId || 'anonymous',
      type: params.type,
      title: params.title,
      content: params.content,
      contact_email: params.contactEmail || null,
      screenshot_url: params.screenshotUrl || null,
      status: 'pending',
    })
    .select()
    .single();

  if (error) {
    console.error('[Feedback] submitFeedback error:', error);
    return { success: false, id: null, error: error.message };
  }

  return { success: true, id: data.id };
}

// ============================================================
// 관리자 API (Service Role)
// ============================================================

/**
 * 전체 피드백 목록 조회 (관리자용)
 * @param limit 조회 개수 (기본 100)
 */
export async function getAllFeedbacks(limit = 100): Promise<Feedback[]> {
  const supabase = createServiceRoleClient();

  const { data, error } = await supabase
    .from('feedback')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(limit);

  if (error) {
    console.error('[Feedback] getAllFeedbacks error:', error);
    return [];
  }

  return (data as FeedbackRow[]).map(toFeedback);
}

/**
 * 피드백 상태 업데이트 (관리자용)
 */
export async function updateFeedbackStatus(
  feedbackId: string,
  status: FeedbackStatus,
  adminNotes?: string
): Promise<boolean> {
  const supabase = createServiceRoleClient();

  const updateData: Record<string, unknown> = { status };
  if (adminNotes !== undefined) {
    updateData.admin_notes = adminNotes;
  }

  const { error } = await supabase.from('feedback').update(updateData).eq('id', feedbackId);

  if (error) {
    console.error('[Feedback] updateFeedbackStatus error:', error);
    return false;
  }

  return true;
}
