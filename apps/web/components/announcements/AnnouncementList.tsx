'use client';

import { useState, useMemo } from 'react';
import { Bell, Filter } from 'lucide-react';

import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { AnnouncementCard } from './AnnouncementCard';
import type { Announcement, AnnouncementCategory } from '@/types/announcements';
import {
  ANNOUNCEMENT_CATEGORY_NAMES,
  sortAnnouncements,
} from '@/lib/announcements';

interface AnnouncementListProps {
  /** 공지사항 목록 */
  announcements: Announcement[];
  /** 읽은 공지사항 ID 목록 */
  readIds?: Set<string>;
  /** 공지사항 클릭 핸들러 */
  onSelect?: (announcement: Announcement) => void;
  /** 간략 보기 */
  compact?: boolean;
  'data-testid'?: string;
}

/**
 * 공지사항 목록 컴포넌트
 */
export function AnnouncementList({
  announcements,
  readIds = new Set(),
  onSelect,
  compact = false,
  'data-testid': testId,
}: AnnouncementListProps) {
  const [categoryFilter, setCategoryFilter] = useState<
    AnnouncementCategory | 'all'
  >('all');

  // 필터링 및 정렬
  const filteredAnnouncements = useMemo(() => {
    let result = announcements;

    // 카테고리 필터
    if (categoryFilter !== 'all') {
      result = result.filter((a) => a.category === categoryFilter);
    }

    // 정렬
    return sortAnnouncements(result);
  }, [announcements, categoryFilter]);

  // 읽지 않은 공지 수
  const unreadCount = useMemo(() => {
    return announcements.filter((a) => !readIds.has(a.id)).length;
  }, [announcements, readIds]);

  return (
    <div className="space-y-4" data-testid={testId || 'announcement-list'}>
      {/* 헤더 */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Bell className="h-5 w-5" />
          <h2 className="text-lg font-semibold">공지사항</h2>
          {unreadCount > 0 && (
            <span
              className="text-sm text-muted-foreground"
              data-testid="unread-count"
            >
              ({unreadCount}개 읽지 않음)
            </span>
          )}
        </div>

        {/* 카테고리 필터 */}
        <Select
          value={categoryFilter}
          onValueChange={(v) =>
            setCategoryFilter(v as AnnouncementCategory | 'all')
          }
        >
          <SelectTrigger className="w-32" data-testid="category-filter">
            <Filter className="h-4 w-4 mr-2" />
            <SelectValue placeholder="카테고리" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">전체</SelectItem>
            {(Object.keys(ANNOUNCEMENT_CATEGORY_NAMES) as AnnouncementCategory[]).map(
              (cat) => (
                <SelectItem key={cat} value={cat}>
                  {ANNOUNCEMENT_CATEGORY_NAMES[cat]}
                </SelectItem>
              )
            )}
          </SelectContent>
        </Select>
      </div>

      {/* 목록 */}
      {filteredAnnouncements.length === 0 ? (
        <p
          className="text-center text-muted-foreground py-8"
          data-testid="empty-state"
        >
          공지사항이 없습니다
        </p>
      ) : (
        <div className="space-y-3">
          {filteredAnnouncements.map((announcement) => (
            <AnnouncementCard
              key={announcement.id}
              announcement={announcement}
              isRead={readIds.has(announcement.id)}
              onClick={() => onSelect?.(announcement)}
              compact={compact}
            />
          ))}
        </div>
      )}
    </div>
  );
}

export default AnnouncementList;
