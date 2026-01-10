/**
 * 공지사항 페이지
 * @description Launch - DB 연동 (Mock → Supabase)
 */

import { auth } from '@clerk/nextjs/server';
import { getPublishedAnnouncements, getUserReadAnnouncementIds } from '@/lib/api/announcements';
import { AnnouncementsClient } from './AnnouncementsClient';

export default async function AnnouncementsPage() {
  const { userId } = await auth();

  // 병렬로 공지사항 + 읽음 표시 조회
  const [announcements, readIds] = await Promise.all([
    getPublishedAnnouncements(),
    userId ? getUserReadAnnouncementIds(userId) : Promise.resolve([]),
  ]);

  return <AnnouncementsClient announcements={announcements} initialReadIds={readIds} />;
}
