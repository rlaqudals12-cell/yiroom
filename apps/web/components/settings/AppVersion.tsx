'use client';

import { Info, RefreshCw, CheckCircle } from 'lucide-react';

import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

interface AppVersionProps {
  /** 현재 버전 */
  version?: string;
  /** 빌드 날짜 */
  buildDate?: string;
  /** 업데이트 가능 여부 */
  hasUpdate?: boolean;
  /** 새 버전 */
  latestVersion?: string;
  /** 업데이트 핸들러 (PWA용) */
  onUpdate?: () => void;
  'data-testid'?: string;
}

/**
 * 앱 버전 표시 컴포넌트
 * - 현재 버전, 빌드 날짜 표시
 * - PWA 업데이트 알림 (선택)
 */
export function AppVersion({
  version = '2.0.0',
  buildDate,
  hasUpdate = false,
  latestVersion,
  onUpdate,
  'data-testid': testId,
}: AppVersionProps) {
  // 빌드 날짜 포맷
  const formattedBuildDate = buildDate
    ? new Date(buildDate).toLocaleDateString('ko-KR', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      })
    : null;

  return (
    <Card data-testid={testId || 'app-version'}>
      <CardContent className="p-4">
        <div className="flex items-start justify-between">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <Info className="h-4 w-4 text-muted-foreground" />
              <span className="font-medium">앱 버전</span>
            </div>
            <div className="flex items-center gap-2">
              <span
                className="text-lg font-semibold"
                data-testid="current-version"
              >
                v{version}
              </span>
              {!hasUpdate && (
                <Badge variant="secondary" className="text-green-600">
                  <CheckCircle className="h-3 w-3 mr-1" />
                  최신
                </Badge>
              )}
            </div>
            {formattedBuildDate && (
              <p
                className="text-sm text-muted-foreground"
                data-testid="build-date"
              >
                빌드: {formattedBuildDate}
              </p>
            )}
          </div>

          {/* 업데이트 알림 */}
          {hasUpdate && latestVersion && (
            <div className="text-right space-y-2">
              <Badge variant="default" data-testid="update-badge">
                v{latestVersion} 사용 가능
              </Badge>
              {onUpdate && (
                <Button
                  size="sm"
                  onClick={onUpdate}
                  data-testid="update-button"
                >
                  <RefreshCw className="h-4 w-4 mr-1" />
                  업데이트
                </Button>
              )}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

export default AppVersion;
