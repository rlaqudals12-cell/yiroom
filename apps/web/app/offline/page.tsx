'use client';

/**
 * 오프라인 페이지
 * Sprint F Day 12: 오프라인 지원
 */

import { useEffect, useState } from 'react';
import { WifiOff, RefreshCw, Home } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

export default function OfflinePage() {
  const [isOnline, setIsOnline] = useState(false);

  useEffect(() => {
    // 초기 온라인 상태 확인
    setIsOnline(navigator.onLine);

    // 온라인/오프라인 이벤트 리스너
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const handleRetry = () => {
    if (navigator.onLine) {
      // 온라인이면 이전 페이지로 돌아가거나 홈으로
      window.history.back();
    } else {
      // 오프라인이면 페이지 새로고침
      window.location.reload();
    }
  };

  const handleGoHome = () => {
    window.location.href = '/';
  };

  return (
    <div
      className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-b from-background to-muted"
      data-testid="offline-page"
    >
      <Card className="w-full max-w-md text-center">
        <CardHeader className="pb-4">
          <div className="mx-auto mb-4 h-20 w-20 rounded-full bg-muted flex items-center justify-center">
            <WifiOff className="h-10 w-10 text-muted-foreground" />
          </div>
          <CardTitle className="text-2xl">오프라인 상태</CardTitle>
          <CardDescription>
            인터넷 연결이 끊어졌습니다.
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-6">
          {/* 상태 표시 */}
          <div className="flex items-center justify-center gap-2">
            <div
              className={`h-3 w-3 rounded-full ${
                isOnline ? 'bg-green-500' : 'bg-red-500'
              }`}
            />
            <span className="text-sm text-muted-foreground">
              {isOnline ? '온라인 - 연결됨' : '오프라인 - 연결 안됨'}
            </span>
          </div>

          {/* 안내 메시지 */}
          <div className="text-sm text-muted-foreground space-y-2">
            <p>Wi-Fi 또는 모바일 데이터 연결을 확인해 주세요.</p>
            <p>연결이 복구되면 자동으로 동기화됩니다.</p>
          </div>

          {/* 캐시된 데이터 안내 */}
          <div className="p-4 bg-muted rounded-lg text-sm">
            <p className="font-medium mb-1">오프라인에서도 사용 가능:</p>
            <ul className="text-muted-foreground space-y-1">
              <li>• 저장된 운동 기록 확인</li>
              <li>• 식단 기록 입력 (나중에 동기화)</li>
              <li>• 이전에 본 리포트 확인</li>
            </ul>
          </div>

          {/* 버튼 */}
          <div className="flex gap-3">
            <Button
              variant="outline"
              className="flex-1"
              onClick={handleGoHome}
              data-testid="go-home-button"
            >
              <Home className="h-4 w-4 mr-2" />
              홈으로
            </Button>
            <Button
              className="flex-1"
              onClick={handleRetry}
              data-testid="retry-button"
            >
              <RefreshCw className="h-4 w-4 mr-2" />
              다시 시도
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
