'use client';

import { useState } from 'react';
import {
  RefreshCw,
  Play,
  Clock,
  CheckCircle,
  AlertTriangle,
  Package,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';

// 크롤러 상태 타입
interface CrawlerStatus {
  name: string;
  lastRun: Date | null;
  status: 'idle' | 'running' | 'success' | 'error';
  itemsUpdated: number;
  description: string;
}

// 초기 크롤러 상태 (실제 구현 시 API에서 가져옴)
const INITIAL_CRAWLERS: CrawlerStatus[] = [
  {
    name: 'cosmetic_price',
    lastRun: null,
    status: 'idle',
    itemsUpdated: 0,
    description: '화장품 가격 업데이트',
  },
  {
    name: 'supplement_price',
    lastRun: null,
    status: 'idle',
    itemsUpdated: 0,
    description: '영양제 가격 업데이트',
  },
  {
    name: 'equipment_price',
    lastRun: null,
    status: 'idle',
    itemsUpdated: 0,
    description: '운동기구 가격 업데이트',
  },
  {
    name: 'health_food_price',
    lastRun: null,
    status: 'idle',
    itemsUpdated: 0,
    description: '건강식품 가격 업데이트',
  },
];

export default function CrawlerPage() {
  const [crawlers, setCrawlers] = useState<CrawlerStatus[]>(INITIAL_CRAWLERS);
  const [runningAll, setRunningAll] = useState(false);

  // 개별 크롤러 실행
  const runCrawler = async (name: string) => {
    setCrawlers((prev) =>
      prev.map((c) => (c.name === name ? { ...c, status: 'running' } : c))
    );

    // 실제 구현: API 호출
    // const response = await fetch(`/api/admin/crawler/${name}`, { method: 'POST' });

    // 시뮬레이션 (2-5초 후 완료)
    setTimeout(() => {
      const itemsUpdated = Math.floor(Math.random() * 50) + 10;
      setCrawlers((prev) =>
        prev.map((c) =>
          c.name === name
            ? {
                ...c,
                status: 'success',
                lastRun: new Date(),
                itemsUpdated,
              }
            : c
        )
      );
      toast.success(`${name} 크롤러 완료: ${itemsUpdated}개 업데이트`);
    }, 2000 + Math.random() * 3000);
  };

  // 전체 크롤러 실행
  const runAllCrawlers = async () => {
    setRunningAll(true);
    toast.info('모든 크롤러를 실행합니다...');

    for (const crawler of crawlers) {
      await runCrawler(crawler.name);
      // 각 크롤러 사이에 간격
      await new Promise((resolve) => setTimeout(resolve, 1000));
    }

    setRunningAll(false);
    toast.success('모든 크롤러 실행 완료');
  };

  // 상태 아이콘
  const getStatusIcon = (status: CrawlerStatus['status']) => {
    switch (status) {
      case 'running':
        return <RefreshCw className="h-5 w-5 text-blue-500 animate-spin" />;
      case 'success':
        return <CheckCircle className="h-5 w-5 text-green-500" />;
      case 'error':
        return <AlertTriangle className="h-5 w-5 text-red-500" />;
      default:
        return <Clock className="h-5 w-5 text-gray-400" />;
    }
  };

  // 상태 텍스트
  const getStatusText = (status: CrawlerStatus['status']) => {
    switch (status) {
      case 'running':
        return '실행 중';
      case 'success':
        return '완료';
      case 'error':
        return '오류';
      default:
        return '대기';
    }
  };

  return (
    <div className="space-y-6">
      {/* 헤더 */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">크롤러 관리</h2>
          <p className="text-gray-500 mt-1">
            제품 가격을 최신 상태로 유지하세요.
          </p>
        </div>
        <Button
          onClick={runAllCrawlers}
          disabled={runningAll || crawlers.some((c) => c.status === 'running')}
        >
          <Play className="h-4 w-4 mr-2" />
          전체 실행
        </Button>
      </div>

      {/* 안내 메시지 */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-sm text-blue-800">
        <p className="font-medium">크롤러 정보</p>
        <p className="mt-1">
          크롤러는 각 쇼핑몰에서 제품 가격을 수집합니다. 자동 실행은 매일 새벽
          3시에 진행되며, 필요 시 수동으로 실행할 수 있습니다.
        </p>
      </div>

      {/* 크롤러 목록 */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {crawlers.map((crawler) => (
          <Card key={crawler.name}>
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base flex items-center gap-2">
                  <Package className="h-5 w-5 text-gray-500" />
                  {crawler.description}
                </CardTitle>
                {getStatusIcon(crawler.status)}
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">상태</span>
                  <span
                    className={`font-medium ${
                      crawler.status === 'running'
                        ? 'text-blue-600'
                        : crawler.status === 'success'
                          ? 'text-green-600'
                          : crawler.status === 'error'
                            ? 'text-red-600'
                            : 'text-gray-600'
                    }`}
                  >
                    {getStatusText(crawler.status)}
                  </span>
                </div>

                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">마지막 실행</span>
                  <span className="text-gray-900">
                    {crawler.lastRun
                      ? crawler.lastRun.toLocaleString('ko-KR')
                      : '-'}
                  </span>
                </div>

                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">업데이트 항목</span>
                  <span className="text-gray-900">{crawler.itemsUpdated}개</span>
                </div>

                <Button
                  variant="outline"
                  size="sm"
                  className="w-full mt-2"
                  onClick={() => runCrawler(crawler.name)}
                  disabled={crawler.status === 'running'}
                >
                  {crawler.status === 'running' ? (
                    <>
                      <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                      실행 중...
                    </>
                  ) : (
                    <>
                      <Play className="h-4 w-4 mr-2" />
                      실행
                    </>
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* 최근 실행 히스토리 (향후 구현) */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">실행 히스토리</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-gray-500 text-sm text-center py-8">
            실행 히스토리는 추후 지원 예정입니다.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
