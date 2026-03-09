'use client';

/**
 * 관리자 신고 관리 페이지
 * - 신고 목록 조회 (상태별 필터)
 * - 신고 처리 (resolve/dismiss)
 */

import { useState, useEffect, useCallback } from 'react';
import { Flag, CheckCircle, XCircle, RefreshCw, AlertTriangle } from 'lucide-react';
import { toast } from 'sonner';

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
import type { ReportStatus } from '@/lib/feed/types';
import { REPORT_REASON_LABELS } from '@/lib/feed/types';

// 신고 데이터 타입 (API 응답)
interface ReportRow {
  id: string;
  reporter_clerk_user_id: string;
  post_id: string;
  reason: string;
  description: string | null;
  status: ReportStatus;
  reviewed_at: string | null;
  reviewed_by: string | null;
  created_at: string;
}

const STATUS_LABELS: Record<ReportStatus, string> = {
  pending: '미처리',
  reviewed: '검토 중',
  resolved: '처리 완료',
  dismissed: '기각',
};

const STATUS_COLORS: Record<ReportStatus, string> = {
  pending: 'bg-yellow-100 text-yellow-800',
  reviewed: 'bg-blue-100 text-blue-800',
  resolved: 'bg-green-100 text-green-800',
  dismissed: 'bg-gray-100 text-gray-600',
};

export default function AdminReportsPage() {
  const [reports, setReports] = useState<ReportRow[]>([]);
  const [filter, setFilter] = useState<ReportStatus>('pending');
  const [isLoading, setIsLoading] = useState(true);

  const fetchReports = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await fetch(`/api/admin/reports?status=${filter}`);
      if (!res.ok) throw new Error('조회 실패');
      const json = await res.json();
      setReports(json.data ?? []);
    } catch {
      toast.error('신고 목록을 불러올 수 없어요.');
    } finally {
      setIsLoading(false);
    }
  }, [filter]);

  useEffect(() => {
    fetchReports();
  }, [fetchReports]);

  // 신고 상태 변경
  const handleUpdateStatus = async (reportId: string, newStatus: ReportStatus) => {
    try {
      const res = await fetch('/api/admin/reports', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reportId, status: newStatus }),
      });

      if (!res.ok) throw new Error('업데이트 실패');

      toast.success(newStatus === 'resolved' ? '신고를 처리했어요.' : '신고를 기각했어요.');

      // 목록에서 제거 (현재 필터와 다른 상태로 변경됨)
      setReports((prev) => prev.filter((r) => r.id !== reportId));
    } catch {
      toast.error('상태 변경에 실패했어요.');
    }
  };

  // 상대 시간 포맷
  const formatTime = (dateStr: string): string => {
    const diff = Date.now() - new Date(dateStr).getTime();
    const hours = Math.floor(diff / (1000 * 60 * 60));
    if (hours < 1) return '방금 전';
    if (hours < 24) return `${hours}시간 전`;
    const days = Math.floor(hours / 24);
    return `${days}일 전`;
  };

  return (
    <div className="space-y-6" data-testid="admin-reports-page">
      {/* 헤더 */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">신고 관리</h2>
          <p className="text-gray-500 mt-1">피드 게시물 신고를 검토하고 처리하세요.</p>
        </div>
        <div className="flex items-center gap-3">
          {/* 상태 필터 */}
          <Select value={filter} onValueChange={(v) => setFilter(v as ReportStatus)}>
            <SelectTrigger className="w-[140px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="pending">미처리</SelectItem>
              <SelectItem value="reviewed">검토 중</SelectItem>
              <SelectItem value="resolved">처리 완료</SelectItem>
              <SelectItem value="dismissed">기각</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline" size="icon" onClick={fetchReports} disabled={isLoading}>
            <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
          </Button>
        </div>
      </div>

      {/* 신고 목록 */}
      {isLoading && (
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-32 bg-gray-100 rounded-lg animate-pulse" />
          ))}
        </div>
      )}
      {!isLoading && reports.length === 0 && (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12 text-gray-500">
            <Flag className="h-12 w-12 mb-4 text-gray-300" />
            <p className="text-lg font-medium">{STATUS_LABELS[filter]} 신고가 없어요</p>
            <p className="text-sm mt-1">다른 상태 필터를 확인해보세요.</p>
          </CardContent>
        </Card>
      )}
      {!isLoading && reports.length > 0 && (
        <div className="space-y-4">
          {reports.map((report) => (
            <Card key={report.id}>
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <AlertTriangle className="h-5 w-5 text-amber-500" />
                    <CardTitle className="text-base">
                      {REPORT_REASON_LABELS[report.reason as keyof typeof REPORT_REASON_LABELS] ??
                        report.reason}
                    </CardTitle>
                    <Badge className={STATUS_COLORS[report.status]}>
                      {STATUS_LABELS[report.status]}
                    </Badge>
                  </div>
                  <span className="text-sm text-gray-500">{formatTime(report.created_at)}</span>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {/* 메타 정보 */}
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="text-gray-500">신고자: </span>
                      <span className="font-mono text-xs">{report.reporter_clerk_user_id}</span>
                    </div>
                    <div>
                      <span className="text-gray-500">게시물: </span>
                      <span className="font-mono text-xs">{report.post_id}</span>
                    </div>
                  </div>

                  {/* 상세 설명 */}
                  {report.description && (
                    <div className="bg-gray-50 rounded-lg p-3 text-sm text-gray-700">
                      {report.description}
                    </div>
                  )}

                  {/* 처리자 정보 */}
                  {report.reviewed_by && (
                    <div className="text-xs text-gray-400">
                      처리자: {report.reviewed_by} |{' '}
                      {report.reviewed_at ? formatTime(report.reviewed_at) : ''}
                    </div>
                  )}

                  {/* 액션 버튼 (미처리/검토 중일 때만) */}
                  {(report.status === 'pending' || report.status === 'reviewed') && (
                    <div className="flex gap-2 pt-2">
                      <Button
                        size="sm"
                        variant="default"
                        className="gap-1.5"
                        onClick={() => handleUpdateStatus(report.id, 'resolved')}
                      >
                        <CheckCircle className="h-4 w-4" />
                        처리 완료
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        className="gap-1.5"
                        onClick={() => handleUpdateStatus(report.id, 'dismissed')}
                      >
                        <XCircle className="h-4 w-4" />
                        기각
                      </Button>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
