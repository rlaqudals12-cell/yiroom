'use client';

/**
 * 제품 스캔 페이지
 * - 바코드 스캔으로 제품 정보 조회
 * - 성분표 OCR 촬영 + Safety 분석
 * - 수동 입력 지원
 */

import { useState, useCallback } from 'react';
import {
  ScanLine,
  Keyboard,
  ArrowLeft,
  Package,
  FlaskConical,
  ShieldCheck,
  AlertTriangle,
  XCircle,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { ScanCamera } from '@/components/scan/ScanCamera';
import { BarcodeInput } from '@/components/scan/BarcodeInput';
import { ScanResult } from '@/components/scan/ScanResult';
import { IngredientCapture } from '@/components/scan/IngredientCapture';
import { lookupProduct } from '@/lib/scan';
import type { BarcodeResult, OcrResult, CompatibilityResult } from '@/lib/scan';
import type { ProductLookupResult } from '@/types/scan';

type ScanMode = 'camera' | 'manual' | 'ingredient';
type ScanState = 'scanning' | 'loading' | 'result' | 'not_found' | 'ocr_result';

// EWG 등급별 배지 색상 클래스
function getEwgGradeClass(grade: number): string {
  if (grade <= 2) return 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400';
  if (grade <= 6) return 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400';
  return 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400';
}

export default function ScanPage() {
  const [mode, setMode] = useState<ScanMode>('camera');
  const [state, setState] = useState<ScanState>('scanning');
  const [result, setResult] = useState<ProductLookupResult | null>(null);
  const [lastBarcode, setLastBarcode] = useState<string | null>(null);
  const [ocrResult, setOcrResult] = useState<OcrResult | null>(null);
  const [compatibilityResult, setCompatibilityResult] = useState<CompatibilityResult | null>(null);
  const [compatibilityLoading, setCompatibilityLoading] = useState(false);
  const [showAllIngredients, setShowAllIngredients] = useState(false);

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
    setShowAllIngredients(false);
    setState('scanning');
    setMode('camera');
  }, []);

  // 제품함 추가
  // [DEFERRED] 실제 API 구현 - user_product_shelves 테이블 필요
  // 선행 조건: 사용자 제품함 DB 스키마 설계
  // 재검토 트리거: 제품함 기능 요청 시
  const handleAddToShelf = useCallback(() => {
    alert('내 제품함에 추가되었어요.');
  }, []);

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
          const compat: CompatibilityResult = await response.json();
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
    setShowAllIngredients(false);
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

        {/* OCR 성분 분석 결과 */}
        {state === 'ocr_result' && ocrResult && (
          <div className="space-y-6">
            {/* 제품 정보 (있는 경우) */}
            {(ocrResult.productName || ocrResult.brandName) && (
              <div className="p-4 bg-card rounded-xl border">
                {ocrResult.brandName && (
                  <p className="text-sm text-muted-foreground">{ocrResult.brandName}</p>
                )}
                {ocrResult.productName && (
                  <h2 className="font-semibold text-lg">{ocrResult.productName}</h2>
                )}
              </div>
            )}

            {/* 호환성 점수 */}
            {compatibilityLoading && (
              <div className="p-4 bg-card rounded-xl border flex items-center gap-3">
                <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                <span className="text-muted-foreground">피부 호환성을 분석하고 있어요...</span>
              </div>
            )}

            {compatibilityResult &&
              (() => {
                let scoreColorClass: string;
                if (compatibilityResult.overallScore >= 80) {
                  scoreColorClass = 'text-green-600 dark:text-green-400';
                } else if (compatibilityResult.overallScore >= 60) {
                  scoreColorClass = 'text-amber-600 dark:text-amber-400';
                } else {
                  scoreColorClass = 'text-red-600 dark:text-red-400';
                }
                return (
                  <div className="p-4 bg-card rounded-xl border space-y-3">
                    <div className="flex items-center justify-between">
                      <h3 className="font-semibold">피부 호환성</h3>
                      <span className={cn('text-2xl font-bold', scoreColorClass)}>
                        {compatibilityResult.overallScore}점
                      </span>
                    </div>

                    {/* 좋은 점 */}
                    {compatibilityResult.skinCompatibility.goodPoints.length > 0 && (
                      <div className="space-y-1">
                        {compatibilityResult.skinCompatibility.goodPoints.map((point, i) => (
                          <div key={i} className="flex items-start gap-2 text-sm">
                            <ShieldCheck className="w-4 h-4 text-green-500 mt-0.5 shrink-0" />
                            <span>{point.description}</span>
                          </div>
                        ))}
                      </div>
                    )}

                    {/* 주의 */}
                    {compatibilityResult.skinCompatibility.warnings.length > 0 && (
                      <div className="space-y-1">
                        {compatibilityResult.skinCompatibility.warnings.map((warning, i) => (
                          <div key={i} className="flex items-start gap-2 text-sm">
                            <AlertTriangle className="w-4 h-4 text-amber-500 mt-0.5 shrink-0" />
                            <span>{warning.description}</span>
                          </div>
                        ))}
                      </div>
                    )}

                    {/* 위험 성분 */}
                    {compatibilityResult.ingredientAnalysis.avoid.length > 0 && (
                      <div className="p-3 bg-red-50 dark:bg-red-900/20 rounded-lg space-y-1">
                        <p className="text-sm font-medium text-red-700 dark:text-red-300">
                          주의 성분
                        </p>
                        {compatibilityResult.ingredientAnalysis.avoid.map((item, i) => (
                          <div
                            key={i}
                            className="flex items-start gap-2 text-sm text-red-600 dark:text-red-400"
                          >
                            <XCircle className="w-4 h-4 mt-0.5 shrink-0" />
                            <span>
                              {item.ingredient}: {item.reason}
                            </span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })()}

            {/* 추출된 성분 목록 */}
            <div className="p-4 bg-card rounded-xl border">
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-semibold">추출된 성분 ({ocrResult.ingredients.length}개)</h3>
                {(() => {
                  let confidenceBadgeClass: string;
                  let confidenceText: string;
                  if (ocrResult.confidence === 'high') {
                    confidenceBadgeClass =
                      'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400';
                    confidenceText = '높은 정확도';
                  } else if (ocrResult.confidence === 'medium') {
                    confidenceBadgeClass =
                      'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400';
                    confidenceText = '보통 정확도';
                  } else {
                    confidenceBadgeClass =
                      'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400';
                    confidenceText = '낮은 정확도';
                  }
                  return (
                    <span className={cn('text-xs px-2 py-0.5 rounded-full', confidenceBadgeClass)}>
                      {confidenceText}
                    </span>
                  );
                })()}
              </div>

              <div className="space-y-2">
                {(showAllIngredients
                  ? ocrResult.ingredients
                  : ocrResult.ingredients.slice(0, 5)
                ).map((ing, i) => (
                  <div
                    key={i}
                    className="flex items-center justify-between text-sm py-1 border-b border-border/50 last:border-0"
                  >
                    <div>
                      <span className="text-muted-foreground mr-2">{ing.order}.</span>
                      <span>{ing.nameKo || ing.inciName}</span>
                      {ing.nameKo && ing.inciName && (
                        <span className="text-xs text-muted-foreground ml-1">({ing.inciName})</span>
                      )}
                    </div>
                    {ing.ewgGrade !== undefined && (
                      <span
                        className={cn(
                          'text-xs font-medium px-1.5 py-0.5 rounded',
                          getEwgGradeClass(ing.ewgGrade)
                        )}
                      >
                        EWG {ing.ewgGrade}
                      </span>
                    )}
                  </div>
                ))}
              </div>

              {ocrResult.ingredients.length > 5 && (
                <button
                  onClick={() => setShowAllIngredients(!showAllIngredients)}
                  className="mt-3 w-full flex items-center justify-center gap-1 text-sm text-primary hover:underline"
                >
                  {showAllIngredients ? (
                    <>
                      접기 <ChevronUp className="w-4 h-4" />
                    </>
                  ) : (
                    <>
                      전체 보기 ({ocrResult.ingredients.length - 5}개 더){' '}
                      <ChevronDown className="w-4 h-4" />
                    </>
                  )}
                </button>
              )}
            </div>

            {/* 면책 조항 */}
            <p className="text-xs text-muted-foreground text-center px-4">
              이 분석은 참고용이며 의학적 조언을 대체하지 않습니다. 알레르기가 있는 경우 전문가와
              상담하세요.
            </p>

            {/* 액션 */}
            <div className="flex gap-3">
              <Button variant="outline" onClick={handleRescanAll} className="flex-1">
                다시 스캔
              </Button>
            </div>
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
