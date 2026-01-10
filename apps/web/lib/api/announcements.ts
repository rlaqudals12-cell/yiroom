/**
 * 공지사항/FAQ API
 * @description Launch - DB 연동 (Mock → Supabase)
 */

import { createClerkSupabaseClient } from '@/lib/supabase/server';
import { toAnnouncement, toFAQ, sortAnnouncements } from '@/lib/announcements';
import type { Announcement, AnnouncementRow, FAQ, FAQRow } from '@/types/announcements';

// ============================================================
// 공지사항 API
// ============================================================

/**
 * 발행된 공지사항 목록 조회
 * @param limit 조회 개수 (기본 50)
 */
export async function getPublishedAnnouncements(limit = 50): Promise<Announcement[]> {
  const supabase = createClerkSupabaseClient();

  const { data, error } = await supabase
    .from('announcements')
    .select('*')
    .eq('is_published', true)
    .or('expires_at.is.null,expires_at.gt.now()')
    .order('is_pinned', { ascending: false })
    .order('priority', { ascending: false })
    .order('published_at', { ascending: false })
    .limit(limit);

  if (error) {
    console.error('[Announcements] Fetch error:', error);
    return [];
  }

  const announcements = (data as AnnouncementRow[]).map(toAnnouncement);
  return sortAnnouncements(announcements);
}

/**
 * 특정 공지사항 조회
 */
export async function getAnnouncementById(id: string): Promise<Announcement | null> {
  const supabase = createClerkSupabaseClient();

  const { data, error } = await supabase
    .from('announcements')
    .select('*')
    .eq('id', id)
    .eq('is_published', true)
    .single();

  if (error || !data) {
    console.error('[Announcements] Fetch by ID error:', error);
    return null;
  }

  return toAnnouncement(data as AnnouncementRow);
}

/**
 * 사용자의 읽음 표시 ID 목록 조회
 */
export async function getUserReadAnnouncementIds(clerkUserId: string): Promise<string[]> {
  const supabase = createClerkSupabaseClient();

  const { data, error } = await supabase
    .from('announcement_reads')
    .select('announcement_id')
    .eq('clerk_user_id', clerkUserId);

  if (error) {
    console.error('[Announcements] Fetch read IDs error:', error);
    return [];
  }

  return data.map((row) => row.announcement_id);
}

/**
 * 공지사항 읽음 표시
 */
export async function markAnnouncementAsRead(
  announcementId: string,
  clerkUserId: string
): Promise<boolean> {
  const supabase = createClerkSupabaseClient();

  const { error } = await supabase.from('announcement_reads').upsert(
    {
      announcement_id: announcementId,
      clerk_user_id: clerkUserId,
    },
    { onConflict: 'announcement_id,clerk_user_id' }
  );

  if (error) {
    console.error('[Announcements] Mark as read error:', error);
    return false;
  }

  return true;
}

/**
 * 공지사항 조회수 증가
 */
export async function incrementAnnouncementViewCount(announcementId: string): Promise<void> {
  const supabase = createClerkSupabaseClient();

  const { error } = await supabase.rpc('increment_announcement_view_count', {
    announcement_id: announcementId,
  });

  if (error) {
    // RPC 함수가 없을 수 있음 - 로그만 남기고 무시
    console.warn('[Announcements] View count increment skipped:', error.message);
  }
}

// ============================================================
// FAQ API
// ============================================================

/**
 * 발행된 FAQ 목록 조회
 */
export async function getPublishedFAQs(): Promise<FAQ[]> {
  const supabase = createClerkSupabaseClient();

  const { data, error } = await supabase
    .from('faqs')
    .select('*')
    .eq('is_published', true)
    .order('category')
    .order('sort_order');

  if (error) {
    console.error('[FAQ] Fetch error:', error);
    return [];
  }

  return (data as FAQRow[]).map(toFAQ);
}

/**
 * FAQ 도움됨/안됨 피드백 업데이트
 */
export async function updateFAQFeedback(faqId: string, helpful: boolean): Promise<boolean> {
  const supabase = createClerkSupabaseClient();

  // 현재 카운트 조회
  const { data: current, error: fetchError } = await supabase
    .from('faqs')
    .select('helpful_count, not_helpful_count')
    .eq('id', faqId)
    .single();

  if (fetchError || !current) {
    console.error('[FAQ] Fetch for feedback error:', fetchError);
    return false;
  }

  // 카운트 업데이트
  const updateData = helpful
    ? { helpful_count: (current.helpful_count || 0) + 1 }
    : { not_helpful_count: (current.not_helpful_count || 0) + 1 };

  const { error: updateError } = await supabase.from('faqs').update(updateData).eq('id', faqId);

  if (updateError) {
    console.error('[FAQ] Feedback update error:', updateError);
    return false;
  }

  return true;
}
