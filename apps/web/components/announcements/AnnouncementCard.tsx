'use client';

import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Pin, Bell, Eye } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { Announcement } from '@/types/announcements';
import {
  ANNOUNCEMENT_CATEGORY_NAMES,
  ANNOUNCEMENT_CATEGORY_COLORS,
  formatAnnouncementDate,
} from '@/lib/announcements';

interface AnnouncementCardProps {
  /** 공지사항 */
  announcement: Announcement;
  /** 읽음 여부 */
  isRead?: boolean;
  /** 클릭 핸들러 */
  onClick?: () => void;
  /** 간략 보기 (목록용) */
  compact?: boolean;
  'data-testid'?: string;
}

/**
 * 공지사항 카드 컴포넌트
 */
export function AnnouncementCard({
  announcement,
  isRead = false,
  onClick,
  compact = false,
  'data-testid': testId,
}: AnnouncementCardProps) {
  const categoryColors = ANNOUNCEMENT_CATEGORY_COLORS[announcement.category];
  const categoryName = ANNOUNCEMENT_CATEGORY_NAMES[announcement.category];
  const dateStr = formatAnnouncementDate(
    announcement.publishedAt ?? announcement.createdAt
  );

  return (
    <Card
      className={cn(
        'cursor-pointer transition-colors hover:bg-accent/50',
        !isRead && 'border-l-4 border-l-primary',
        announcement.isPinned && 'bg-accent/30'
      )}
      onClick={onClick}
      data-testid={testId || `announcement-card-${announcement.id}`}
    >
      <CardContent className={cn('p-4', compact && 'py-3')}>
        <div className="flex items-start gap-3">
          {/* 상태 아이콘 */}
          <div className="flex-shrink-0 mt-1">
            {announcement.isPinned ? (
              <Pin className="h-4 w-4 text-primary" />
            ) : announcement.category === 'important' ? (
              <Bell className="h-4 w-4 text-red-500" />
            ) : null}
          </div>

          <div className="flex-1 min-w-0 space-y-1">
            {/* 헤더: 카테고리 + 날짜 */}
            <div className="flex items-center gap-2 text-sm">
              <Badge
                variant="secondary"
                className={cn(categoryColors.bg, categoryColors.text)}
              >
                {categoryName}
              </Badge>
              <span className="text-muted-foreground">{dateStr}</span>
              {!isRead && (
                <Badge variant="default" className="text-xs">
                  NEW
                </Badge>
              )}
            </div>

            {/* 제목 */}
            <h3
              className={cn(
                'font-medium truncate',
                !isRead && 'font-semibold'
              )}
            >
              {announcement.title}
            </h3>

            {/* 내용 (상세 모드) */}
            {!compact && (
              <p className="text-sm text-muted-foreground line-clamp-2">
                {announcement.content}
              </p>
            )}

            {/* 조회수 */}
            {!compact && announcement.viewCount > 0 && (
              <div className="flex items-center gap-1 text-xs text-muted-foreground">
                <Eye className="h-3 w-3" />
                <span>{announcement.viewCount.toLocaleString()}회 조회</span>
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export default AnnouncementCard;
