'use client';

import { useState } from 'react';
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

// Mock 데이터 (실제로는 서버에서 가져옴)
const mockAnnouncements: Announcement[] = [
  {
    id: '1',
    title: '이룸 2.0 업데이트 안내',
    content: `안녕하세요, 이룸 팀입니다.

새로운 기능이 대거 추가된 이룸 2.0 버전이 출시되었습니다!

주요 업데이트 내용:
- 친구 시스템: 친구를 추가하고 함께 챌린지에 참여하세요
- 리더보드: 전체 사용자와 순위를 경쟁하세요
- 웰니스 스코어: 통합 건강 점수를 확인하세요
- 팀 챌린지: 팀을 만들어 함께 목표를 달성하세요

많은 이용 부탁드립니다!`,
    category: 'update',
    priority: 10,
    isPinned: true,
    isPublished: true,
    publishedAt: new Date('2025-12-24'),
    expiresAt: null,
    authorId: 'admin-1',
    viewCount: 1234,
    createdAt: new Date('2025-12-24'),
    updatedAt: new Date('2025-12-24'),
  },
  {
    id: '2',
    title: '연말 이벤트: 30일 챌린지에 참여하세요!',
    content: `2025년을 건강하게 마무리하세요!

이룸 연말 특별 챌린지에 참여하시면 특별 배지와 XP를 드립니다.

기간: 12월 1일 ~ 12월 31일
보상:
- 완주 시 "2025 챌린저" 특별 배지
- 500 XP 추가 지급
- 추첨을 통해 스마트워치 증정

지금 바로 챌린지 탭에서 참여하세요!`,
    category: 'event',
    priority: 5,
    isPinned: false,
    isPublished: true,
    publishedAt: new Date('2025-12-01'),
    expiresAt: new Date('2025-12-31'),
    authorId: 'admin-1',
    viewCount: 567,
    createdAt: new Date('2025-12-01'),
    updatedAt: new Date('2025-12-01'),
  },
  {
    id: '3',
    title: '12월 25일 서버 점검 안내',
    content: `안녕하세요, 이룸 팀입니다.

서버 안정화 및 성능 개선을 위해 점검을 진행합니다.

점검 일시: 12월 25일(수) 오전 4시 ~ 6시 (약 2시간)

점검 중에는 서비스 이용이 불가합니다.
점검 완료 후 빠른 시간 내에 서비스를 재개하겠습니다.

불편을 드려 죄송합니다.`,
    category: 'maintenance',
    priority: 8,
    isPinned: false,
    isPublished: true,
    publishedAt: new Date('2025-12-23'),
    expiresAt: null,
    authorId: 'admin-1',
    viewCount: 234,
    createdAt: new Date('2025-12-23'),
    updatedAt: new Date('2025-12-23'),
  },
  {
    id: '4',
    title: '이용약관 개정 안내',
    content: `이룸 서비스 이용약관이 개정됩니다.

주요 변경사항:
- 개인정보 처리방침 업데이트
- 서비스 이용 규칙 명확화

시행일: 2025년 1월 1일

자세한 내용은 설정 > 약관에서 확인하세요.`,
    category: 'important',
    priority: 7,
    isPinned: false,
    isPublished: true,
    publishedAt: new Date('2025-12-20'),
    expiresAt: null,
    authorId: 'admin-1',
    viewCount: 89,
    createdAt: new Date('2025-12-20'),
    updatedAt: new Date('2025-12-20'),
  },
];

export default function AnnouncementsPage() {
  const [selectedAnnouncement, setSelectedAnnouncement] =
    useState<Announcement | null>(null);
  const [readIds, setReadIds] = useState<Set<string>>(new Set());

  // 공지사항 선택 시 읽음 처리
  const handleSelect = (announcement: Announcement) => {
    setSelectedAnnouncement(announcement);
    setReadIds((prev) => new Set([...prev, announcement.id]));
  };

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
      <AnnouncementList
        announcements={mockAnnouncements}
        readIds={readIds}
        onSelect={handleSelect}
      />

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
                    className={`${
                      ANNOUNCEMENT_CATEGORY_COLORS[selectedAnnouncement.category].bg
                    } ${
                      ANNOUNCEMENT_CATEGORY_COLORS[selectedAnnouncement.category].text
                    }`}
                  >
                    {ANNOUNCEMENT_CATEGORY_NAMES[selectedAnnouncement.category]}
                  </Badge>
                  <span className="text-sm text-muted-foreground">
                    {formatAnnouncementDate(
                      selectedAnnouncement.publishedAt ??
                        selectedAnnouncement.createdAt
                    )}
                  </span>
                </div>
                <SheetTitle>{selectedAnnouncement.title}</SheetTitle>
                <SheetDescription className="sr-only">
                  공지사항 상세 내용
                </SheetDescription>
              </SheetHeader>

              <div className="mt-6 whitespace-pre-wrap text-sm">
                {selectedAnnouncement.content}
              </div>
            </>
          )}
        </SheetContent>
      </Sheet>
    </div>
  );
}
