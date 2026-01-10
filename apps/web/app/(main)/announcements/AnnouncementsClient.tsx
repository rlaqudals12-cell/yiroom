'use client';

import { useState, useCallback } from 'react';
import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';

import { Button } from '@/components/ui/button';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from '@/components/ui/sheet';
import { Badge } from '@/components/ui/badge';
import { AnnouncementList } from '@/components/announcements';
import type { Announcement } from '@/types/announcements';
import {
  ANNOUNCEMENT_CATEGORY_NAMES,
  ANNOUNCEMENT_CATEGORY_COLORS,
  formatAnnouncementDate,
} from '@/lib/announcements';

interface AnnouncementsClientProps {
  announcements: Announcement[];
  initialReadIds: string[];
}

export function AnnouncementsClient({ announcements, initialReadIds }: AnnouncementsClientProps) {
  const [selectedAnnouncement, setSelectedAnnouncement] = useState<Announcement | null>(null);
  const [readIds, setReadIds] = useState<Set<string>>(new Set(initialReadIds));

  // 공지사항 선택 시 읽음 처리
  const handleSelect = useCallback(
    async (announcement: Announcement) => {
      setSelectedAnnouncement(announcement);

      // 이미 읽은 공지는 API 호출 안함
      if (readIds.has(announcement.id)) return;

      // 읽음 처리 (백그라운드)
      setReadIds((prev) => new Set([...prev, announcement.id]));

      try {
        await fetch('/api/announcements/read', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ announcementId: announcement.id }),
        });
      } catch (error) {
        console.error('[Announcements] Mark read error:', error);
      }
    },
    [readIds]
  );

  // 시트 닫기
  const handleClose = () => {
    setSelectedAnnouncement(null);
  };

  return (
    <div className="container max-w-2xl py-6 space-y-6">
      {/* 헤더 */}
      <div className="flex items-center gap-4">
        <Link href="/dashboard">
          <Button variant="ghost" size="icon">
            <ArrowLeft className="h-5 w-5" />
          </Button>
        </Link>
        <h1 className="text-2xl font-bold">공지사항</h1>
      </div>

      {/* 공지사항 목록 */}
      {announcements.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground">등록된 공지사항이 없습니다.</div>
      ) : (
        <AnnouncementList announcements={announcements} readIds={readIds} onSelect={handleSelect} />
      )}

      {/* 상세 시트 */}
      <Sheet open={!!selectedAnnouncement} onOpenChange={handleClose}>
        <SheetContent
          side="bottom"
          className="h-[80vh] overflow-y-auto"
          data-testid="announcement-detail-sheet"
        >
          {selectedAnnouncement && (
            <>
              <SheetHeader>
                <div className="flex items-center gap-2 mb-2">
                  <Badge
                    className={`${ANNOUNCEMENT_CATEGORY_COLORS[selectedAnnouncement.category].bg} ${
                      ANNOUNCEMENT_CATEGORY_COLORS[selectedAnnouncement.category].text
                    }`}
                  >
                    {ANNOUNCEMENT_CATEGORY_NAMES[selectedAnnouncement.category]}
                  </Badge>
                  <span className="text-sm text-muted-foreground">
                    {formatAnnouncementDate(
                      selectedAnnouncement.publishedAt ?? selectedAnnouncement.createdAt
                    )}
                  </span>
                </div>
                <SheetTitle>{selectedAnnouncement.title}</SheetTitle>
                <SheetDescription className="sr-only">공지사항 상세 내용</SheetDescription>
              </SheetHeader>

              <div className="mt-6 whitespace-pre-wrap text-sm">{selectedAnnouncement.content}</div>
            </>
          )}
        </SheetContent>
      </Sheet>
    </div>
  );
}
