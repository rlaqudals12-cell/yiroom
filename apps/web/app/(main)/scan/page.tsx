'use client';

/**
 * 제품 스캔 페이지
 * - 바코드 스캔으로 제품 정보 조회
 * - 성분표 OCR 촬영 + Safety 분석
 * - 수동 입력 지원
 */

import { useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { ScanLine, Keyboard, ArrowLeft, Package, FlaskConical, ImageOff } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { ScanCamera } from '@/components/scan/ScanCamera';
import { BarcodeInput } from '@/components/scan/BarcodeInput';
import { ScanResult } from '@/components/scan/ScanResult';
import { ScanVerdict, type ScanVerdictData } from '@/components/scan/ScanVerdict';
import { IngredientCapture } from '@/components/scan/IngredientCapture';
import { lookupProduct } from '@/lib/scan';
import type { BarcodeResult, OcrResult } from '@/lib/scan';
import type { ProductLookupResult } from '@/types/scan';

type ScanMode = 'camera' | 'manual' | 'ingredient';
type ScanState = 'scanning' | 'loading' | 'result' | 'not_found' | 'ocr_result';

export default function ScanPage() {
  const router = useRouter();
  const [mode, setMode] = useState<ScanMode>('camera');
  const [state, setState] = useState<ScanState>('scanning');
  const [result, setResult] = useState<ProductLookupResult | null>(null);
  const [lastBarcode, setLastBarcode] = useState<string | null>(null);
  const [addingToShelf, setAddingToShelf] = useState(false);
  const [ocrResult, setOcrResult] = useState<OcrResult | null>(null);
  const [compatibilityResult, setCompatibilityResult] = useState<ScanVerdictData | null>(null);
  const [compatibilityLoading, setCompatibilityLoading] = useState(false);

  // 바코드 조회 처리
  const handleLookup = useCallback(async (barcode: string) => {
    setState('loading');
    setLastBarcode(barcode);

    try {
      const lookupResult = await lookupProduct(barcode);
      setResult(lookupResult);

      if (lookupResult.found && lookupResult.product) {
        setState('result');
      } else {
        setState('not_found');
      }
    } catch (error) {
      console.error('[ScanPage] 제품 조회 실패:', error);
      setState('not_found');
    }
  }, []);

  // 카메라 스캔 성공
  const handleCameraScan = useCallback(
    (scanResult: BarcodeResult) => {
      handleLookup(scanResult.text);
    },
    [handleLookup]
  );

  // 수동 입력 제출
  const handleManualSubmit = useCallback(
    (barcode: string) => {
      handleLookup(barcode);
    },
    [handleLookup]
  );

  // 다시 스캔
  const handleRescan = useCallback(() => {
    setResult(null);
    setLastBarcode(null);
    setOcrResult(null);
    setCompatibilityResult(null);
    setState('scanning');
    setMode('camera');
  }, []);

  // 제품함 추가 — POST /api/scan/shelf (user_product_shelf 테이블)
  const handleAddToShelf = useCallback(async () => {
    const product = result?.product;
    if (!product || addingToShelf) return;

    setAddingToShelf(true);
    try {
      const response = await fetch('/api/scan/shelf', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          // product_id는 내부 DB 제품일 때만 유효한 FK — 외부 소스 id는 보내지 않음
          productId: result.source === 'internal_db' ? product.id : undefined,
          productName: product.name,
          productBrand: product.brand,
          productBarcode: product.barcode ?? lastBarcode ?? undefined,
          productImageUrl: product.imageUrl,
          productIngredients: product.ingredients ?? [],
          scanMethod: mode === 'manual' ? 'manual' : 'barcode',
        }),
      });

      if (!response.ok) {
        const errorBody = await response.json().catch(() => ({}));
        throw new Error(errorBody.error || `HTTP ${response.status}`);
      }

      toast.success('내 제품함에 추가했어요', {
        action: {
          label: '제품함 보기',
          onClick: () => router.push('/scan/shelf'),
        },
      });
    } catch (error) {
      console.error('[ScanPage] 제품함 추가 실패:', error);
      toast.error('제품함 추가에 실패했어요. 잠시 후 다시 시도해 주세요.');
    } finally {
      setAddingToShelf(false);
    }
  }, [result, lastBarcode, mode, addingToShelf, router]);

  // [DEFERRED] 공유 기능 — Web Share API 기본 구현, 세부 커스터마이징은 향후
  const handleShare = useCallback(() => {
    if (result?.product) {
      navigator.share?.({
        title: result.product.name,
        text: `${result.product.brand} ${result.product.name}`,
        url: window.location.href,
      });
    }
  }, [result]);

  // OCR 분석 완료 → 호환성 분석 요청
  const handleOcrResult = useCallback(async (ocr: OcrResult) => {
    setOcrResult(ocr);
    setState('ocr_result');

    if (ocr.success && ocr.ingredients.length > 0) {
      setCompatibilityLoading(true);
      try {
        const response = await fetch('/api/scan/analyze', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ ingredients: ocr.ingredients }),
        });
        if (response.ok) {
          const compat: ScanVerdictData = await response.json();
          setCompatibilityResult(compat);
        }
      } catch (error) {
        console.error('[ScanPage] 호환성 분석 실패:', error);
      } finally {
        setCompatibilityLoading(false);
      }
    }
  }, []);

  // 다시 스캔 (OCR 포함)
  const handleRescanAll = useCallback(() => {
    setResult(null);
    setLastBarcode(null);
    setOcrResult(null);
    setCompatibilityResult(null);
    setState('scanning');
  }, []);

  return (
    <div data-testid="scan-page" className="min-h-screen bg-background">
      {/* 헤더 */}
      <header className="sticky top-0 z-10 bg-background/95 backdrop-blur border-b">
        <div className="container mx-auto px-4 h-14 flex items-center gap-3">
          {state !== 'scanning' && (
            <button
              onClick={handleRescanAll}
              className="p-2 -ml-2 hover:bg-muted rounded-lg"
              aria-label="뒤로 가기"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
          )}
          <h1 className="font-semibold text-lg">제품 스캔</h1>
        </div>
      </header>

      <div className="container mx-auto px-4 py-6">
        {/* 로딩 상태 */}
        {state === 'loading' && (
          <div className="flex flex-col items-center justify-center py-20">
            <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin" />
            <p className="mt-4 text-muted-foreground">제품 정보를 조회하고 있어요...</p>
            {lastBarcode && (
              <p className="mt-2 text-sm text-muted-foreground font-mono">{lastBarcode}</p>
            )}
          </div>
        )}

        {/* 결과 표시 */}
        {state === 'result' && result?.product && (
          <ScanResult
            product={result.product}
            source={result.source}
            confidence={result.confidence}
            onAddToShelf={handleAddToShelf}
            onShare={handleShare}
            onRescan={handleRescan}
          />
        )}

        {/* 제품 없음 */}
        {state === 'not_found' && (
          <div className="flex flex-col items-center justify-center py-20">
            <div className="w-20 h-20 bg-muted rounded-full flex items-center justify-center">
              <Package className="w-10 h-10 text-muted-foreground" />
            </div>
            <h2 className="mt-6 text-xl font-semibold">제품을 찾을 수 없어요</h2>
            <p className="mt-2 text-muted-foreground text-center">
              {lastBarcode && (
                <>
                  <span className="font-mono">{lastBarcode}</span>
                  <br />
                </>
              )}
              데이터베이스에 등록되지 않은 제품이에요
            </p>
            <button
              onClick={handleRescan}
              className="mt-6 px-6 py-3 bg-primary text-primary-foreground rounded-xl font-medium"
            >
              다른 제품 스캔하기
            </button>
          </div>
        )}

        {/* OCR 성분 분석 결과 — "나와의 적합도" 컨설팅 정본 */}
        {state === 'ocr_result' && ocrResult && (
          <div className="space-y-6">
            {/* 호환성 분석 로딩 */}
            {compatibilityLoading && (
              <div className="p-4 bg-card rounded-xl border flex items-center gap-3">
                <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                <span className="text-muted-foreground">나와의 적합도를 분석하고 있어요...</span>
              </div>
            )}

            {/* 판정 결과 (정본 컴포넌트) */}
            {!compatibilityLoading && compatibilityResult && (
              <ScanVerdict
                verdict={compatibilityResult}
                ingredients={ocrResult.ingredients}
                productName={ocrResult.productName}
                brandName={ocrResult.brandName}
                ocrConfidence={ocrResult.confidence}
                onRescan={handleRescanAll}
              />
            )}

            {/* 성분을 읽지 못했거나 분석에 실패한 경우 */}
            {!compatibilityLoading && !compatibilityResult && (
              <div className="flex flex-col items-center justify-center py-16 text-center">
                <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center">
                  <ImageOff className="w-8 h-8 text-muted-foreground" />
                </div>
                <h2 className="mt-4 text-lg font-semibold">성분을 분석하지 못했어요</h2>
                <p className="mt-1 text-sm text-muted-foreground">
                  성분표가 선명하게 보이도록 다시 촬영해 주세요
                </p>
                <Button onClick={handleRescanAll} className="mt-5">
                  다시 스캔하기
                </Button>
              </div>
            )}
          </div>
        )}

        {/* 스캔 모드 */}
        {state === 'scanning' && (
          <div className="space-y-6">
            {/* 모드 선택 탭 */}
            <div className="flex gap-1 p-1 bg-muted rounded-lg">
              <button
                onClick={() => setMode('camera')}
                className={cn(
                  'flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-md transition-colors text-sm',
                  mode === 'camera'
                    ? 'bg-background shadow-sm font-medium'
                    : 'text-muted-foreground hover:text-foreground'
                )}
              >
                <ScanLine className="w-4 h-4" />
                바코드
              </button>
              <button
                onClick={() => setMode('ingredient')}
                className={cn(
                  'flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-md transition-colors text-sm',
                  mode === 'ingredient'
                    ? 'bg-background shadow-sm font-medium'
                    : 'text-muted-foreground hover:text-foreground'
                )}
              >
                <FlaskConical className="w-4 h-4" />
                성분표
              </button>
              <button
                onClick={() => setMode('manual')}
                className={cn(
                  'flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-md transition-colors text-sm',
                  mode === 'manual'
                    ? 'bg-background shadow-sm font-medium'
                    : 'text-muted-foreground hover:text-foreground'
                )}
              >
                <Keyboard className="w-4 h-4" />
                직접 입력
              </button>
            </div>

            {/* 카메라 모드 */}
            {mode === 'camera' && (
              <div className="space-y-4">
                <ScanCamera
                  onScan={handleCameraScan}
                  onError={(error) => console.error('[ScanPage]', error)}
                  active={state === 'scanning'}
                  mode="barcode"
                  className="aspect-[3/4]"
                />
                <p className="text-center text-sm text-muted-foreground">
                  제품 뒷면의 바코드를 카메라에 비춰주세요
                </p>
              </div>
            )}

            {/* 성분표 촬영 모드 */}
            {mode === 'ingredient' && (
              <div className="space-y-4">
                <IngredientCapture onResult={handleOcrResult} onCancel={() => setMode('camera')} />
              </div>
            )}

            {/* 수동 입력 모드 */}
            {mode === 'manual' && (
              <div className="space-y-4">
                <div className="p-6 bg-card rounded-xl border">
                  <h2 className="font-medium mb-4">바코드 번호 직접 입력</h2>
                  <BarcodeInput onSubmit={handleManualSubmit} loading={false} />
                </div>
                <p className="text-center text-sm text-muted-foreground">
                  제품 포장에 있는 바코드 아래 숫자를 입력해주세요
                </p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
