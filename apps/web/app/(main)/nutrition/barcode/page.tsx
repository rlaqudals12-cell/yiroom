/**
 * 바코드 스캔 페이지
 *
 * /nutrition/barcode
 * - 바코드 스캔 → 식품 조회 → 기록
 * - 미등록 식품 직접 등록
 */

'use client';

import { useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import dynamic from 'next/dynamic';
import {
  ArrowLeft,
  ScanBarcode,
  Plus,
  Minus,
  Check,
  AlertCircle,
  Loader2,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import type { BarcodeFood, BarcodeSearchResponse, MealType } from '@/types/nutrition';

// 바코드 스캐너는 동적 import (카메라 API는 클라이언트 전용)
const BarcodeScanner = dynamic(
  () => import('@/components/nutrition/BarcodeScanner'),
  { ssr: false }
);

// 상태 타입
type PageState = 'idle' | 'scanning' | 'loading' | 'found' | 'not-found' | 'registering' | 'error';

// 식사 시간 옵션
const MEAL_OPTIONS: { value: MealType; label: string }[] = [
  { value: 'breakfast', label: '아침' },
  { value: 'lunch', label: '점심' },
  { value: 'dinner', label: '저녁' },
  { value: 'snack', label: '간식' },
];

export default function BarcodeScanPage() {
  const router = useRouter();

  const [state, setState] = useState<PageState>('idle');
  const [scannedBarcode, setScannedBarcode] = useState<string>('');
  const [food, setFood] = useState<BarcodeFood | null>(null);
  const [servings, setServings] = useState(1);
  const [mealType, setMealType] = useState<MealType>('lunch');
  const [error, setError] = useState<string>('');
  const [isRecording, setIsRecording] = useState(false);

  // 등록 폼 상태
  const [registerForm, setRegisterForm] = useState({
    name: '',
    brand: '',
    servingSize: 100,
    calories: 0,
    protein: 0,
    carbs: 0,
    fat: 0,
  });

  // 바코드 스캔 성공
  const handleScan = useCallback(async (barcode: string) => {
    setScannedBarcode(barcode);
    setState('loading');

    try {
      const response = await fetch(`/api/nutrition/foods/barcode/${barcode}`);
      const data: BarcodeSearchResponse = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'API 오류');
      }

      if (data.found && data.food) {
        setFood(data.food);
        setState('found');
      } else {
        setState('not-found');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : '조회 실패');
      setState('error');
    }
  }, []);

  // 스캐너 에러
  const handleScanError = useCallback((errorMsg: string) => {
    setError(errorMsg);
    setState('error');
  }, []);

  // 스캐너 닫기
  const handleScannerClose = useCallback(() => {
    setState('idle');
  }, []);

  // 섭취량 조절
  const adjustServings = (delta: number) => {
    setServings((prev) => Math.max(0.5, Math.min(5, prev + delta)));
  };

  // 기록하기
  const handleRecord = async () => {
    if (!food) return;

    setIsRecording(true);

    try {
      const response = await fetch('/api/nutrition/meals', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          mealType,
          recordType: 'barcode',
          foods: [
            {
              name: food.name,
              servings,
              calories: Math.round(food.calories * servings),
              protein: Math.round(food.protein * servings),
              carbs: Math.round(food.carbs * servings),
              fat: Math.round(food.fat * servings),
            },
          ],
        }),
      });

      if (!response.ok) {
        throw new Error('기록 실패');
      }

      // 성공 시 영양 페이지로 이동
      router.push('/nutrition');
    } catch (err) {
      setError(err instanceof Error ? err.message : '기록 실패');
    } finally {
      setIsRecording(false);
    }
  };

  // 새 식품 등록
  const handleRegister = async () => {
    if (!registerForm.name || registerForm.calories <= 0) {
      setError('이름과 칼로리는 필수입니다');
      return;
    }

    setState('loading');

    try {
      const response = await fetch('/api/nutrition/foods/barcode', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          barcode: scannedBarcode,
          ...registerForm,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || '등록 실패');
      }

      setFood(data.food);
      setState('found');
    } catch (err) {
      setError(err instanceof Error ? err.message : '등록 실패');
      setState('error');
    }
  };

  // 다시 스캔
  const handleRescan = () => {
    setFood(null);
    setScannedBarcode('');
    setError('');
    setServings(1);
    setState('scanning');
  };

  return (
    <div className="min-h-screen bg-background" data-testid="barcode-scan-page">
      {/* 스캐너 모달 */}
      {state === 'scanning' && (
        <BarcodeScanner
          onScan={handleScan}
          onError={handleScanError}
          onClose={handleScannerClose}
        />
      )}

      {/* 헤더 */}
      <header className="sticky top-0 z-10 bg-background border-b border-border">
        <div className="max-w-lg mx-auto px-4 h-14 flex items-center gap-3">
          <button
            onClick={() => router.back()}
            className="p-2 -ml-2 hover:bg-muted rounded-lg transition-colors"
            aria-label="뒤로가기"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <h1 className="font-semibold">바코드 스캔</h1>
        </div>
      </header>

      <main className="max-w-lg mx-auto px-4 py-6">
        {/* 초기 상태 */}
        {state === 'idle' && (
          <div className="text-center py-12">
            <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-6">
              <ScanBarcode className="w-10 h-10 text-primary" />
            </div>
            <h2 className="text-xl font-semibold mb-2">바코드로 음식 기록</h2>
            <p className="text-muted-foreground mb-8">
              식품 포장의 바코드를 스캔하면
              <br />
              영양 정보가 자동으로 입력됩니다
            </p>
            <button
              onClick={() => setState('scanning')}
              className="px-8 py-3 bg-primary text-primary-foreground rounded-xl font-medium hover:bg-primary/90 transition-colors"
              data-testid="start-scan-button"
            >
              스캔 시작하기
            </button>
          </div>
        )}

        {/* 로딩 상태 */}
        {state === 'loading' && (
          <div className="text-center py-12">
            <Loader2 className="w-10 h-10 animate-spin text-primary mx-auto mb-4" />
            <p className="text-muted-foreground">식품 정보 조회 중...</p>
          </div>
        )}

        {/* 에러 상태 */}
        {state === 'error' && (
          <div className="text-center py-12">
            <div className="w-16 h-16 rounded-full bg-destructive/10 flex items-center justify-center mx-auto mb-4">
              <AlertCircle className="w-8 h-8 text-destructive" />
            </div>
            <p className="text-destructive mb-6">{error}</p>
            <button
              onClick={handleRescan}
              className="px-6 py-2 bg-primary text-primary-foreground rounded-lg font-medium"
            >
              다시 스캔
            </button>
          </div>
        )}

        {/* 식품 발견 */}
        {state === 'found' && food && (
          <div className="space-y-6">
            {/* 식품 정보 */}
            <div className="bg-card rounded-xl p-4 border border-border">
              <div className="flex items-start gap-4">
                {food.imageUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={food.imageUrl}
                    alt={food.name}
                    className="w-20 h-20 rounded-lg object-cover"
                  />
                ) : (
                  <div className="w-20 h-20 rounded-lg bg-muted flex items-center justify-center">
                    <ScanBarcode className="w-8 h-8 text-muted-foreground" />
                  </div>
                )}
                <div className="flex-1">
                  <h3 className="font-semibold text-lg">{food.name}</h3>
                  {food.brand && (
                    <p className="text-sm text-muted-foreground">{food.brand}</p>
                  )}
                  <p className="text-sm text-muted-foreground mt-1">
                    {food.servingSize}{food.servingUnit} 기준
                  </p>
                </div>
              </div>
            </div>

            {/* 영양 정보 */}
            <div className="bg-card rounded-xl p-4 border border-border">
              <h4 className="font-medium mb-3">영양 정보</h4>
              <div className="grid grid-cols-4 gap-2 text-center">
                <div className="bg-muted rounded-lg p-3">
                  <p className="text-lg font-semibold">
                    {Math.round(food.calories * servings)}
                  </p>
                  <p className="text-xs text-muted-foreground">kcal</p>
                </div>
                <div className="bg-blue-50 dark:bg-blue-950 rounded-lg p-3">
                  <p className="text-lg font-semibold text-blue-600">
                    {Math.round(food.protein * servings)}g
                  </p>
                  <p className="text-xs text-muted-foreground">단백질</p>
                </div>
                <div className="bg-yellow-50 dark:bg-yellow-950 rounded-lg p-3">
                  <p className="text-lg font-semibold text-yellow-600">
                    {Math.round(food.carbs * servings)}g
                  </p>
                  <p className="text-xs text-muted-foreground">탄수화물</p>
                </div>
                <div className="bg-red-50 dark:bg-red-950 rounded-lg p-3">
                  <p className="text-lg font-semibold text-red-600">
                    {Math.round(food.fat * servings)}g
                  </p>
                  <p className="text-xs text-muted-foreground">지방</p>
                </div>
              </div>
            </div>

            {/* 섭취량 조절 */}
            <div className="bg-card rounded-xl p-4 border border-border">
              <h4 className="font-medium mb-3">섭취량</h4>
              <div className="flex items-center justify-center gap-4">
                <button
                  onClick={() => adjustServings(-0.5)}
                  className="w-10 h-10 rounded-full bg-muted flex items-center justify-center hover:bg-muted/80 transition-colors"
                  aria-label="0.5인분 줄이기"
                >
                  <Minus className="w-5 h-5" />
                </button>
                <span className="text-2xl font-semibold min-w-[80px] text-center">
                  {servings}인분
                </span>
                <button
                  onClick={() => adjustServings(0.5)}
                  className="w-10 h-10 rounded-full bg-muted flex items-center justify-center hover:bg-muted/80 transition-colors"
                  aria-label="0.5인분 늘리기"
                >
                  <Plus className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* 식사 시간 선택 */}
            <div className="bg-card rounded-xl p-4 border border-border">
              <h4 className="font-medium mb-3">식사 시간</h4>
              <div className="grid grid-cols-4 gap-2">
                {MEAL_OPTIONS.map((option) => (
                  <button
                    key={option.value}
                    onClick={() => setMealType(option.value)}
                    className={cn(
                      'py-2 rounded-lg font-medium transition-colors',
                      mealType === option.value
                        ? 'bg-primary text-primary-foreground'
                        : 'bg-muted hover:bg-muted/80'
                    )}
                  >
                    {option.label}
                  </button>
                ))}
              </div>
            </div>

            {/* 버튼 */}
            <div className="flex gap-3">
              <button
                onClick={handleRescan}
                className="flex-1 py-3 border border-border rounded-xl font-medium hover:bg-muted transition-colors"
              >
                다시 스캔
              </button>
              <button
                onClick={handleRecord}
                disabled={isRecording}
                className="flex-1 py-3 bg-primary text-primary-foreground rounded-xl font-medium hover:bg-primary/90 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {isRecording ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    기록 중...
                  </>
                ) : (
                  <>
                    <Check className="w-4 h-4" />
                    기록하기
                  </>
                )}
              </button>
            </div>
          </div>
        )}

        {/* 미등록 식품 */}
        {state === 'not-found' && (
          <div className="space-y-6">
            <div className="text-center py-6">
              <div className="w-16 h-16 rounded-full bg-yellow-100 dark:bg-yellow-900 flex items-center justify-center mx-auto mb-4">
                <AlertCircle className="w-8 h-8 text-yellow-600" />
              </div>
              <h3 className="font-semibold text-lg mb-2">등록되지 않은 식품</h3>
              <p className="text-muted-foreground text-sm">
                바코드: {scannedBarcode}
              </p>
            </div>

            {/* 등록 폼 */}
            <div className="bg-card rounded-xl p-4 border border-border space-y-4">
              <h4 className="font-medium">직접 등록하기</h4>

              <div>
                <label className="text-sm text-muted-foreground">식품명 *</label>
                <input
                  type="text"
                  value={registerForm.name}
                  onChange={(e) =>
                    setRegisterForm((prev) => ({ ...prev, name: e.target.value }))
                  }
                  className="w-full mt-1 px-3 py-2 border border-border rounded-lg bg-background"
                  placeholder="예: 신라면"
                />
              </div>

              <div>
                <label className="text-sm text-muted-foreground">브랜드</label>
                <input
                  type="text"
                  value={registerForm.brand}
                  onChange={(e) =>
                    setRegisterForm((prev) => ({ ...prev, brand: e.target.value }))
                  }
                  className="w-full mt-1 px-3 py-2 border border-border rounded-lg bg-background"
                  placeholder="예: 농심"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-sm text-muted-foreground">1회 제공량</label>
                  <div className="flex mt-1">
                    <input
                      type="number"
                      value={registerForm.servingSize}
                      onChange={(e) =>
                        setRegisterForm((prev) => ({
                          ...prev,
                          servingSize: Number(e.target.value),
                        }))
                      }
                      className="flex-1 px-3 py-2 border border-border rounded-l-lg bg-background"
                    />
                    <span className="px-3 py-2 bg-muted border border-l-0 border-border rounded-r-lg">
                      g
                    </span>
                  </div>
                </div>
                <div>
                  <label className="text-sm text-muted-foreground">칼로리 *</label>
                  <div className="flex mt-1">
                    <input
                      type="number"
                      value={registerForm.calories}
                      onChange={(e) =>
                        setRegisterForm((prev) => ({
                          ...prev,
                          calories: Number(e.target.value),
                        }))
                      }
                      className="flex-1 px-3 py-2 border border-border rounded-l-lg bg-background"
                    />
                    <span className="px-3 py-2 bg-muted border border-l-0 border-border rounded-r-lg">
                      kcal
                    </span>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="text-sm text-muted-foreground">단백질</label>
                  <div className="flex mt-1">
                    <input
                      type="number"
                      value={registerForm.protein}
                      onChange={(e) =>
                        setRegisterForm((prev) => ({
                          ...prev,
                          protein: Number(e.target.value),
                        }))
                      }
                      className="flex-1 px-3 py-2 border border-border rounded-l-lg bg-background"
                    />
                    <span className="px-2 py-2 bg-muted border border-l-0 border-border rounded-r-lg text-sm">
                      g
                    </span>
                  </div>
                </div>
                <div>
                  <label className="text-sm text-muted-foreground">탄수화물</label>
                  <div className="flex mt-1">
                    <input
                      type="number"
                      value={registerForm.carbs}
                      onChange={(e) =>
                        setRegisterForm((prev) => ({
                          ...prev,
                          carbs: Number(e.target.value),
                        }))
                      }
                      className="flex-1 px-3 py-2 border border-border rounded-l-lg bg-background"
                    />
                    <span className="px-2 py-2 bg-muted border border-l-0 border-border rounded-r-lg text-sm">
                      g
                    </span>
                  </div>
                </div>
                <div>
                  <label className="text-sm text-muted-foreground">지방</label>
                  <div className="flex mt-1">
                    <input
                      type="number"
                      value={registerForm.fat}
                      onChange={(e) =>
                        setRegisterForm((prev) => ({
                          ...prev,
                          fat: Number(e.target.value),
                        }))
                      }
                      className="flex-1 px-3 py-2 border border-border rounded-l-lg bg-background"
                    />
                    <span className="px-2 py-2 bg-muted border border-l-0 border-border rounded-r-lg text-sm">
                      g
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* 버튼 */}
            <div className="flex gap-3">
              <button
                onClick={handleRescan}
                className="flex-1 py-3 border border-border rounded-xl font-medium hover:bg-muted transition-colors"
              >
                다시 스캔
              </button>
              <button
                onClick={handleRegister}
                className="flex-1 py-3 bg-primary text-primary-foreground rounded-xl font-medium hover:bg-primary/90 transition-colors flex items-center justify-center gap-2"
              >
                <Plus className="w-4 h-4" />
                등록하기
              </button>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
