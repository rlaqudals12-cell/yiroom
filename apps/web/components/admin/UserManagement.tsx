'use client';

/**
 * 사용자 관리 컴포넌트
 * @description 사용자 목록 조회, 검색, 상세 보기
 * @module K-5: 관리자/프로필 페이지
 */

import { useEffect, useState, useCallback } from 'react';
import {
  Users,
  Search,
  ChevronLeft,
  ChevronRight,
  Check,
  X,
  RefreshCw,
  Eye,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import type { UserListItem } from '@/lib/admin/stats';

interface UserManagementProps {
  /** 사용자 목록을 가져오는 함수 */
  fetchUsers?: (page: number, limit: number) => Promise<{ users: UserListItem[]; total: number }>;
  /** 페이지당 항목 수 */
  pageSize?: number;
}

interface UserDetailModalProps {
  user: UserListItem;
}

// 사용자 상세 모달
function UserDetailModal({ user }: UserDetailModalProps) {
  const analysisStatuses = [
    { label: '퍼스널컬러', completed: user.hasPersonalColor },
    { label: '피부 분석', completed: user.hasSkin },
    { label: '체형 분석', completed: user.hasBody },
    { label: '운동 분석', completed: user.hasWorkout },
    { label: '영양 설정', completed: user.hasNutrition },
  ];

  const completedCount = analysisStatuses.filter((s) => s.completed).length;
  const completionRate = Math.round((completedCount / analysisStatuses.length) * 100);

  return (
    <DialogContent className="max-w-md" data-testid="user-detail-modal">
      <DialogHeader>
        <DialogTitle className="flex items-center gap-2">
          <Users className="h-5 w-5" />
          사용자 상세 정보
        </DialogTitle>
        <DialogDescription>
          사용자의 가입 정보 및 분석 완료 현황
        </DialogDescription>
      </DialogHeader>

      <div className="space-y-6">
        {/* 기본 정보 */}
        <div className="space-y-3">
          <h4 className="text-sm font-medium text-muted-foreground">기본 정보</h4>
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">이름</span>
              <span className="text-sm font-medium">{user.name || '-'}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">이메일</span>
              <span className="text-sm font-medium">{user.email || '-'}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">가입일</span>
              <span className="text-sm font-medium">
                {user.createdAt.toLocaleDateString('ko-KR', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric',
                })}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Clerk ID</span>
              <span className="text-xs font-mono text-muted-foreground">
                {user.clerkUserId.slice(0, 16)}...
              </span>
            </div>
          </div>
        </div>

        {/* 분석 완료 현황 */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h4 className="text-sm font-medium text-muted-foreground">분석 완료 현황</h4>
            <Badge variant={completionRate === 100 ? 'default' : 'secondary'}>
              {completionRate}% 완료
            </Badge>
          </div>
          <div className="space-y-2">
            {analysisStatuses.map((status) => (
              <div
                key={status.label}
                className="flex items-center justify-between p-2 bg-muted/30 rounded-lg"
              >
                <span className="text-sm">{status.label}</span>
                {status.completed ? (
                  <Badge variant="default" className="bg-green-600">
                    <Check className="h-3 w-3 mr-1" />
                    완료
                  </Badge>
                ) : (
                  <Badge variant="outline" className="text-muted-foreground">
                    <X className="h-3 w-3 mr-1" />
                    미완료
                  </Badge>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* 진행률 바 */}
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">전체 진행률</span>
            <span className="font-medium">{completedCount}/5</span>
          </div>
          <div className="w-full bg-muted rounded-full h-2">
            <div
              className="bg-primary rounded-full h-2 transition-all"
              style={{ width: `${completionRate}%` }}
              data-testid="completion-progress-bar"
            />
          </div>
        </div>
      </div>
    </DialogContent>
  );
}

// 분석 완료 배지 컴포넌트
function AnalysisBadge({ completed, label }: { completed: boolean; label: string }) {
  return (
    <Badge
      variant={completed ? 'default' : 'outline'}
      className={`text-xs ${completed ? 'bg-green-100 text-green-700' : 'text-muted-foreground'}`}
      title={`${label}: ${completed ? '완료' : '미완료'}`}
    >
      {completed ? <Check className="h-3 w-3" /> : <X className="h-3 w-3" />}
    </Badge>
  );
}

// 로딩 스켈레톤
function TableSkeleton({ rows = 5 }: { rows?: number }) {
  return (
    <div className="space-y-3" data-testid="user-table-loading">
      {[...Array(rows)].map((_, i) => (
        <div key={i} className="flex items-center gap-4 p-4 bg-muted/30 rounded-lg">
          <Skeleton className="h-10 w-10 rounded-full" />
          <div className="flex-1 space-y-2">
            <Skeleton className="h-4 w-32" />
            <Skeleton className="h-3 w-48" />
          </div>
          <div className="flex gap-2">
            {[...Array(5)].map((_, j) => (
              <Skeleton key={j} className="h-6 w-6 rounded-full" />
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

// 메인 UserManagement 컴포넌트
export function UserManagement({ fetchUsers, pageSize = 10 }: UserManagementProps) {
  const [users, setUsers] = useState<UserListItem[]>([]);
  const [total, setTotal] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const totalPages = Math.ceil(total / pageSize);

  const loadUsers = useCallback(async () => {
    if (!fetchUsers) return;

    try {
      const { users: userData, total: totalCount } = await fetchUsers(currentPage, pageSize);
      setUsers(userData);
      setTotal(totalCount);
    } catch (error) {
      console.error('[UserManagement] 사용자 목록 로드 실패:', error);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, [fetchUsers, currentPage, pageSize]);

  useEffect(() => {
    if (fetchUsers) {
      loadUsers();
    }
  }, [fetchUsers, loadUsers]);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await loadUsers();
  };

  const handlePageChange = (page: number) => {
    if (page < 1 || page > totalPages) return;
    setIsLoading(true);
    setCurrentPage(page);
  };

  // 검색 필터링 (클라이언트 사이드)
  const filteredUsers = searchQuery
    ? users.filter(
        (user) =>
          user.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
          user.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
          user.clerkUserId.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : users;

  return (
    <Card data-testid="user-management">
      <CardHeader className="pb-3">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <CardTitle className="flex items-center gap-2 text-lg">
            <Users className="h-5 w-5" />
            사용자 관리
          </CardTitle>
          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground">
              총 {total.toLocaleString()}명
            </span>
            {fetchUsers && (
              <Button
                variant="outline"
                size="sm"
                onClick={handleRefresh}
                disabled={isRefreshing}
                data-testid="refresh-users-button"
              >
                <RefreshCw className={`h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} />
              </Button>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {/* 검색 */}
        <div className="relative mb-4">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="이름, 이메일, ID로 검색..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
            data-testid="user-search-input"
          />
        </div>

        {/* 사용자 목록 */}
        {isLoading ? (
          <TableSkeleton rows={pageSize} />
        ) : filteredUsers.length === 0 ? (
          <div
            className="text-center py-12 text-muted-foreground"
            data-testid="no-users-message"
          >
            {searchQuery ? '검색 결과가 없습니다.' : '등록된 사용자가 없습니다.'}
          </div>
        ) : (
          <div className="space-y-1">
            {/* 테이블 헤더 (데스크톱) */}
            <div className="hidden md:grid grid-cols-12 gap-4 p-3 bg-muted/50 rounded-lg text-sm font-medium text-muted-foreground">
              <div className="col-span-3">사용자</div>
              <div className="col-span-2">가입일</div>
              <div className="col-span-5 text-center">분석 현황</div>
              <div className="col-span-2 text-right">액션</div>
            </div>

            {/* 사용자 목록 */}
            {filteredUsers.map((user) => (
              <div
                key={user.id}
                className="grid grid-cols-1 md:grid-cols-12 gap-4 p-4 hover:bg-muted/30 rounded-lg transition-colors items-center"
                data-testid={`user-row-${user.id}`}
              >
                {/* 사용자 정보 */}
                <div className="md:col-span-3">
                  <p className="font-medium truncate">{user.name || '이름 없음'}</p>
                  <p className="text-sm text-muted-foreground truncate">
                    {user.email || '이메일 없음'}
                  </p>
                </div>

                {/* 가입일 */}
                <div className="md:col-span-2 text-sm text-muted-foreground">
                  {user.createdAt.toLocaleDateString('ko-KR')}
                </div>

                {/* 분석 현황 배지 */}
                <div className="md:col-span-5 flex flex-wrap gap-2 justify-center">
                  <AnalysisBadge completed={user.hasPersonalColor} label="퍼스널컬러" />
                  <AnalysisBadge completed={user.hasSkin} label="피부" />
                  <AnalysisBadge completed={user.hasBody} label="체형" />
                  <AnalysisBadge completed={user.hasWorkout} label="운동" />
                  <AnalysisBadge completed={user.hasNutrition} label="영양" />
                </div>

                {/* 액션 */}
                <div className="md:col-span-2 flex justify-end gap-2">
                  <Dialog>
                    <DialogTrigger asChild>
                      <Button
                        variant="outline"
                        size="sm"
                        data-testid={`view-user-${user.id}`}
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                    </DialogTrigger>
                    <UserDetailModal user={user} />
                  </Dialog>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* 페이지네이션 */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between mt-6 pt-4 border-t">
            <p className="text-sm text-muted-foreground">
              {(currentPage - 1) * pageSize + 1} -{' '}
              {Math.min(currentPage * pageSize, total)} / {total}
            </p>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => handlePageChange(currentPage - 1)}
                disabled={currentPage === 1 || isLoading}
                data-testid="prev-page-button"
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <span className="text-sm font-medium px-2">
                {currentPage} / {totalPages}
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={() => handlePageChange(currentPage + 1)}
                disabled={currentPage === totalPages || isLoading}
                data-testid="next-page-button"
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export default UserManagement;
