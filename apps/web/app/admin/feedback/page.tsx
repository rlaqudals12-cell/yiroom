'use client';

/**
 * 관리자 피드백 관리 페이지
 * Sprint D Day 9: 운영 기능
 */

import { useState, useEffect } from 'react';
import { MessageSquare, Filter, RefreshCw, ChevronDown } from 'lucide-react';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import {
  FEEDBACK_TYPE_NAMES,
  FEEDBACK_TYPE_ICONS,
  FEEDBACK_STATUS_NAMES,
  FEEDBACK_STATUS_COLORS,
  getFeedbackStats,
  filterFeedbackByStatus,
  filterFeedbackByType,
  sortFeedbackByDate,
} from '@/lib/feedback';
import type { Feedback, FeedbackStatus, FeedbackType } from '@/types/feedback';

// 피드백 API 호출 함수
async function fetchFeedbacks(): Promise<Feedback[]> {
  try {
    const res = await fetch('/api/feedback');
    if (!res.ok) {
      console.error('[AdminFeedback] API error:', res.status);
      return [];
    }
    const data = await res.json();
    // Date 문자열을 Date 객체로 변환
    return (data.feedbacks || []).map((f: Feedback & { createdAt: string; updatedAt: string }) => ({
      ...f,
      createdAt: new Date(f.createdAt),
      updatedAt: new Date(f.updatedAt),
    }));
  } catch (error) {
    console.error('[AdminFeedback] Fetch error:', error);
    return [];
  }
}

export default function AdminFeedbackPage() {
  const [feedbacks, setFeedbacks] = useState<Feedback[]>([]);
  const [statusFilter, setStatusFilter] = useState<FeedbackStatus | 'all'>('all');
  const [typeFilter, setTypeFilter] = useState<FeedbackType | 'all'>('all');
  const [isLoading, setIsLoading] = useState(true);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  // 피드백 로드
  useEffect(() => {
    const loadFeedbacks = async () => {
      setIsLoading(true);
      const data = await fetchFeedbacks();
      setFeedbacks(data);
      setIsLoading(false);
    };
    loadFeedbacks();
  }, []);

  // 필터링된 피드백
  const filteredFeedbacks = sortFeedbackByDate(
    filterFeedbackByType(filterFeedbackByStatus(feedbacks, statusFilter), typeFilter)
  );

  // 통계
  const stats = getFeedbackStats(feedbacks);

  // 새로고침
  const handleRefresh = async () => {
    setIsLoading(true);
    const data = await fetchFeedbacks();
    setFeedbacks(data);
    setIsLoading(false);
  };

  return (
    <div className="container mx-auto py-8 px-4" data-testid="admin-feedback-page">
      {/* 헤더 */}
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-3">
          <MessageSquare className="h-8 w-8 text-primary" />
          <div>
            <h1 className="text-2xl font-bold">피드백 관리</h1>
            <p className="text-muted-foreground">사용자 피드백을 확인하고 처리합니다.</p>
          </div>
        </div>
        <Button variant="outline" size="sm" onClick={handleRefresh} disabled={isLoading}>
          <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
          새로고침
        </Button>
      </div>

      {/* 통계 카드 */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold">{stats.total}</div>
            <div className="text-sm text-muted-foreground">전체</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold text-yellow-600">{stats.pending}</div>
            <div className="text-sm text-muted-foreground">대기 중</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold text-blue-600">{stats.inProgress}</div>
            <div className="text-sm text-muted-foreground">처리 중</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold text-green-600">{stats.resolved}</div>
            <div className="text-sm text-muted-foreground">해결됨</div>
          </CardContent>
        </Card>
      </div>

      {/* 필터 */}
      <div className="flex gap-4 mb-6" data-testid="feedback-filters">
        <Select
          value={statusFilter}
          onValueChange={(v) => setStatusFilter(v as FeedbackStatus | 'all')}
        >
          <SelectTrigger className="w-[150px]">
            <Filter className="h-4 w-4 mr-2" />
            <SelectValue placeholder="상태 필터" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">전체 상태</SelectItem>
            <SelectItem value="pending">대기 중</SelectItem>
            <SelectItem value="in_progress">처리 중</SelectItem>
            <SelectItem value="resolved">해결됨</SelectItem>
            <SelectItem value="closed">종료</SelectItem>
          </SelectContent>
        </Select>

        <Select value={typeFilter} onValueChange={(v) => setTypeFilter(v as FeedbackType | 'all')}>
          <SelectTrigger className="w-[150px]">
            <SelectValue placeholder="유형 필터" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">전체 유형</SelectItem>
            <SelectItem value="bug">버그 신고</SelectItem>
            <SelectItem value="suggestion">기능 제안</SelectItem>
            <SelectItem value="question">문의</SelectItem>
            <SelectItem value="other">기타</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* 피드백 목록 */}
      <div className="space-y-4" data-testid="feedback-list">
        {isLoading ? (
          <Card>
            <CardContent className="py-8 text-center text-muted-foreground">
              불러오는 중...
            </CardContent>
          </Card>
        ) : filteredFeedbacks.length === 0 ? (
          <Card>
            <CardContent className="py-8 text-center text-muted-foreground">
              피드백이 없습니다.
            </CardContent>
          </Card>
        ) : (
          filteredFeedbacks.map((feedback) => (
            <Collapsible
              key={feedback.id}
              open={expandedId === feedback.id}
              onOpenChange={(open) => setExpandedId(open ? feedback.id : null)}
            >
              <Card data-testid={`feedback-item-${feedback.id}`}>
                <CollapsibleTrigger asChild>
                  <CardHeader className="cursor-pointer hover:bg-muted/50 transition-colors">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <span>{FEEDBACK_TYPE_ICONS[feedback.type]}</span>
                          <Badge variant="outline">{FEEDBACK_TYPE_NAMES[feedback.type]}</Badge>
                          <Badge
                            className={`${FEEDBACK_STATUS_COLORS[feedback.status].bg} ${FEEDBACK_STATUS_COLORS[feedback.status].text}`}
                          >
                            {FEEDBACK_STATUS_NAMES[feedback.status]}
                          </Badge>
                        </div>
                        <CardTitle className="text-lg">{feedback.title}</CardTitle>
                        <div className="flex items-center gap-4 mt-2 text-sm text-muted-foreground">
                          <span>{feedback.userName || '익명'}</span>
                          <span>
                            {feedback.createdAt.toLocaleDateString('ko-KR', {
                              year: 'numeric',
                              month: 'short',
                              day: 'numeric',
                            })}
                          </span>
                        </div>
                      </div>
                      <ChevronDown
                        className={`h-5 w-5 transition-transform ${
                          expandedId === feedback.id ? 'rotate-180' : ''
                        }`}
                      />
                    </div>
                  </CardHeader>
                </CollapsibleTrigger>
                <CollapsibleContent>
                  <CardContent className="pt-0">
                    <div className="border-t pt-4 space-y-4">
                      {/* 내용 */}
                      <div>
                        <div className="text-sm font-medium mb-1">내용</div>
                        <p className="text-muted-foreground whitespace-pre-wrap">
                          {feedback.content}
                        </p>
                      </div>

                      {/* 연락처 */}
                      {feedback.contactEmail && (
                        <div>
                          <div className="text-sm font-medium mb-1">연락처</div>
                          <p className="text-muted-foreground">{feedback.contactEmail}</p>
                        </div>
                      )}

                      {/* 관리자 메모 */}
                      {feedback.adminNotes && (
                        <div>
                          <div className="text-sm font-medium mb-1">관리자 메모</div>
                          <p className="text-muted-foreground">{feedback.adminNotes}</p>
                        </div>
                      )}

                      {/* 액션 버튼 */}
                      <div className="flex gap-2 pt-2">
                        <Button variant="outline" size="sm">
                          상태 변경
                        </Button>
                        <Button variant="outline" size="sm">
                          메모 추가
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </CollapsibleContent>
              </Card>
            </Collapsible>
          ))
        )}
      </div>
    </div>
  );
}
