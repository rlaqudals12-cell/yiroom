'use client';

/**
 * 제품함 상세 페이지
 * - 스캔한 제품의 상세 정보
 * - 성분 분석 결과
 * - 피부 호환성 정보
 */

import { useState, useEffect, useCallback } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Image from 'next/image';
import {
  ArrowLeft,
  Package,
  Star,
  Calendar,
  FlaskConical,
  AlertTriangle,
  CheckCircle,
  Loader2,
  Trash2,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { cn } from '@/lib/utils';
import type { ShelfItem, ShelfStatus } from '@/lib/scan/product-shelf';

const STATUS_LABELS: Record<ShelfStatus, string> = {
  owned: '보유 중',
  wishlist: '위시리스트',
  used_up: '다 씀',
  archived: '보관함',
};

const STATUS_COLORS: Record<ShelfStatus, string> = {
  owned: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400',
  wishlist: 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400',
  used_up: 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400',
  archived: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400',
};

export default function ShelfDetailPage() {
  const router = useRouter();
  const params = useParams();
  const id = params.id as string;

  const [item, setItem] = useState<ShelfItem | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // 아이템 로드
  const loadItem = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch(`/api/scan/shelf/${id}`);
      if (!response.ok) {
        if (response.status === 404) {
          setError('제품을 찾을 수 없습니다.');
        } else {
          throw new Error('Failed to load item');
        }
        return;
      }

      const data = await response.json();
      setItem(data);
    } catch (err) {
      console.error('[ShelfDetail] Load error:', err);
      setError('제품 정보를 불러오는 중 오류가 발생했습니다.');
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    if (id) {
      loadItem();
    }
  }, [id, loadItem]);

  // 삭제
  const handleDelete = async () => {
    try {
      const response = await fetch(`/api/scan/shelf/${id}`, {
        method: 'DELETE',
      });

      if (!response.ok) throw new Error('Failed to delete');

      router.push('/scan/shelf');
    } catch (err) {
      console.error('[ShelfDetail] Delete error:', err);
    }
  };

  // 로딩 상태
  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  // 에러 상태
  if (error || !item) {
    return (
      <div
        data-testid="shelf-detail-error"
        className="flex min-h-screen flex-col items-center justify-center gap-4 p-4"
      >
        <Package className="h-16 w-16 text-muted-foreground" />
        <p className="text-muted-foreground">{error || '제품을 찾을 수 없습니다.'}</p>
        <Button onClick={() => router.push('/scan/shelf')}>제품함으로 돌아가기</Button>
      </div>
    );
  }

  // 호환성 점수 색상
  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-500';
    if (score >= 60) return 'text-yellow-500';
    return 'text-red-500';
  };

  return (
    <div data-testid="shelf-detail" className="min-h-screen bg-background pb-20">
      {/* 헤더 */}
      <header className="sticky top-0 z-10 bg-background/95 backdrop-blur border-b">
        <div className="container mx-auto px-4 h-14 flex items-center justify-between">
          <button
            onClick={() => router.back()}
            className="p-2 -ml-2 hover:bg-muted rounded-lg"
            aria-label="뒤로 가기"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="ghost" size="icon">
                <Trash2 className="w-5 h-5 text-destructive" />
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>제품 삭제</AlertDialogTitle>
                <AlertDialogDescription>
                  이 제품을 제품함에서 삭제하시겠습니까? 이 작업은 취소할 수 없습니다.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>취소</AlertDialogCancel>
                <AlertDialogAction onClick={handleDelete}>삭제</AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </header>

      <div className="container mx-auto px-4 py-6 space-y-6">
        {/* 제품 기본 정보 */}
        <div className="flex gap-4">
          <div className="relative h-24 w-24 flex-shrink-0 overflow-hidden rounded-lg bg-muted">
            {item.productImageUrl ? (
              <Image
                src={item.productImageUrl}
                alt={item.productName}
                fill
                className="object-cover"
              />
            ) : (
              <div className="flex h-full w-full items-center justify-center">
                <Package className="h-10 w-10 text-muted-foreground" />
              </div>
            )}
          </div>
          <div className="flex flex-col justify-center">
            <h1 className="text-xl font-semibold">{item.productName}</h1>
            {item.productBrand && <p className="text-muted-foreground">{item.productBrand}</p>}
            <div className="mt-2 flex items-center gap-2">
              <Badge className={cn('text-xs', STATUS_COLORS[item.status])}>
                {STATUS_LABELS[item.status]}
              </Badge>
              {item.rating && (
                <span className="flex items-center gap-0.5 text-sm">
                  <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                  {item.rating}
                </span>
              )}
            </div>
          </div>
        </div>

        {/* 호환성 점수 */}
        {item.compatibilityScore !== undefined && (
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base flex items-center gap-2">
                <FlaskConical className="h-5 w-5" />
                피부 호환성
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-4">
                <div className={cn('text-4xl font-bold', getScoreColor(item.compatibilityScore))}>
                  {item.compatibilityScore}점
                </div>
                <div className="text-sm text-muted-foreground">
                  {item.compatibilityScore >= 80
                    ? '내 피부에 잘 맞아요!'
                    : item.compatibilityScore >= 60
                      ? '주의가 필요해요'
                      : '주의 성분이 있어요'}
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* 성분 분석 */}
        {item.analysisResult && item.analysisResult.ingredientAnalysis && (
          <>
            {/* 주의 성분 */}
            {item.analysisResult.ingredientAnalysis.caution &&
              item.analysisResult.ingredientAnalysis.caution.length > 0 && (
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-base flex items-center gap-2 text-yellow-600">
                      <AlertTriangle className="h-5 w-5" />
                      주의 성분
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ul className="space-y-2">
                      {item.analysisResult.ingredientAnalysis.caution.map((item, i) => (
                        <li key={i} className="text-sm">
                          <span className="font-medium">{item.nameKo || item.ingredient}</span>
                          {item.reason && (
                            <span className="text-muted-foreground"> - {item.reason}</span>
                          )}
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                </Card>
              )}

            {/* 긍정 성분 */}
            {item.analysisResult.ingredientAnalysis.beneficial &&
              item.analysisResult.ingredientAnalysis.beneficial.length > 0 && (
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-base flex items-center gap-2 text-green-600">
                      <CheckCircle className="h-5 w-5" />
                      좋은 성분
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ul className="space-y-2">
                      {item.analysisResult.ingredientAnalysis.beneficial.map((item, i) => (
                        <li key={i} className="text-sm">
                          <span className="font-medium">{item.nameKo || item.ingredient}</span>
                          {item.reason && (
                            <span className="text-muted-foreground"> - {item.reason}</span>
                          )}
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                </Card>
              )}
          </>
        )}

        {/* 스캔 정보 */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              스캔 정보
            </CardTitle>
          </CardHeader>
          <CardContent>
            <dl className="space-y-2 text-sm">
              <div className="flex justify-between">
                <dt className="text-muted-foreground">스캔 날짜</dt>
                <dd>{new Date(item.scannedAt).toLocaleDateString('ko-KR')}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-muted-foreground">스캔 방법</dt>
                <dd>
                  {item.scanMethod === 'barcode'
                    ? '바코드 스캔'
                    : item.scanMethod === 'ocr'
                      ? '성분 OCR'
                      : item.scanMethod === 'search'
                        ? '검색'
                        : '수동 입력'}
                </dd>
              </div>
              {item.productBarcode && (
                <div className="flex justify-between">
                  <dt className="text-muted-foreground">바코드</dt>
                  <dd className="font-mono">{item.productBarcode}</dd>
                </div>
              )}
            </dl>
          </CardContent>
        </Card>

        {/* 메모 */}
        {item.userNote && (
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base">메모</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground whitespace-pre-wrap">{item.userNote}</p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
