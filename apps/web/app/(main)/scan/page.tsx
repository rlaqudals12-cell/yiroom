'use client';

/**
 * 제품 스캔 페이지
 * - 바코드 스캔으로 제품 정보 조회
 * - 수동 입력 지원
 * - 제품 결과 표시
 */

import { useState, useCallback } from 'react';
import { ScanLine, Keyboard, ArrowLeft, Package } from 'lucide-react';
import { cn } from '@/lib/utils';
import { ScanCamera } from '@/components/scan/ScanCamera';
import { BarcodeInput } from '@/components/scan/BarcodeInput';
import { ScanResult } from '@/components/scan/ScanResult';
import { lookupProduct } from '@/lib/scan';
import type { BarcodeResult } from '@/lib/scan';
import type { ProductLookupResult } from '@/types/scan';

type ScanMode = 'camera' | 'manual';
type ScanState = 'scanning' | 'loading' | 'result' | 'not_found';

export default function ScanPage() {
  const [mode, setMode] = useState<ScanMode>('camera');
  const [state, setState] = useState<ScanState>('scanning');
  const [result, setResult] = useState<ProductLookupResult | null>(null);
  const [lastBarcode, setLastBarcode] = useState<string | null>(null);

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
    setState('scanning');
    setMode('camera');
  }, []);

  // 제품함 추가
  // [DEFERRED] 실제 API 구현 - user_product_shelves 테이블 필요
  // 선행 조건: 사용자 제품함 DB 스키마 설계
  // 재검토 트리거: 제품함 기능 요청 시
  const handleAddToShelf = useCallback(() => {
    alert('내 제품함에 추가되었습니다.');
  }, []);

  // 공유 (TODO: 실제 구현)
  const handleShare = useCallback(() => {
    if (result?.product) {
      navigator.share?.({
        title: result.product.name,
        text: `${result.product.brand} ${result.product.name}`,
        url: window.location.href,
      });
    }
  }, [result]);

  return (
    <div data-testid="scan-page" className="min-h-screen bg-background">
      {/* 헤더 */}
      <header className="sticky top-0 z-10 bg-background/95 backdrop-blur border-b">
        <div className="container mx-auto px-4 h-14 flex items-center gap-3">
          {state !== 'scanning' && (
            <button
              onClick={handleRescan}
              className="p-2 -ml-2 hover:bg-muted rounded-lg"
              aria-label="뒤로 가기"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
          )}
          <h1 className="font-semibold text-lg">제품 스캔</h1>
        </div>
      </header>

      <main className="container mx-auto px-4 py-6">
        {/* 로딩 상태 */}
        {state === 'loading' && (
          <div className="flex flex-col items-center justify-center py-20">
            <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin" />
            <p className="mt-4 text-muted-foreground">제품 정보를 조회하고 있습니다...</p>
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
            <h2 className="mt-6 text-xl font-semibold">제품을 찾을 수 없습니다</h2>
            <p className="mt-2 text-muted-foreground text-center">
              {lastBarcode && (
                <>
                  <span className="font-mono">{lastBarcode}</span>
                  <br />
                </>
              )}
              데이터베이스에 등록되지 않은 제품입니다
            </p>
            <button
              onClick={handleRescan}
              className="mt-6 px-6 py-3 bg-primary text-primary-foreground rounded-xl font-medium"
            >
              다른 제품 스캔하기
            </button>
          </div>
        )}

        {/* 스캔 모드 */}
        {state === 'scanning' && (
          <div className="space-y-6">
            {/* 모드 선택 탭 */}
            <div className="flex gap-2 p-1 bg-muted rounded-lg">
              <button
                onClick={() => setMode('camera')}
                className={cn(
                  'flex-1 flex items-center justify-center gap-2 py-2.5 rounded-md transition-colors',
                  mode === 'camera'
                    ? 'bg-background shadow-sm font-medium'
                    : 'text-muted-foreground hover:text-foreground'
                )}
              >
                <ScanLine className="w-4 h-4" />
                카메라 스캔
              </button>
              <button
                onClick={() => setMode('manual')}
                className={cn(
                  'flex-1 flex items-center justify-center gap-2 py-2.5 rounded-md transition-colors',
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
      </main>
    </div>
  );
}
