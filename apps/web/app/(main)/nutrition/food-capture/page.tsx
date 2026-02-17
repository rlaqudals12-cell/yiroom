'use client';

import { useState, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, AlertCircle, Loader2 } from 'lucide-react';
import { FoodPhotoCapture, FoodAnalysisLoading } from '@/components/nutrition';
import { Button } from '@/components/ui/button';
import Image from 'next/image';

// 식사 타입 옵션
const MEAL_TYPES = [
  { id: 'breakfast', label: '아침', icon: '🌅' },
  { id: 'lunch', label: '점심', icon: '☀️' },
  { id: 'dinner', label: '저녁', icon: '🌙' },
  { id: 'snack', label: '간식', icon: '🍿' },
] as const;

type MealType = (typeof MEAL_TYPES)[number]['id'];

// 페이지 상태
type PageState = 'capture' | 'analyzing' | 'error';

/**
 * N-1 음식 사진 촬영 페이지 (Task 2.4)
 *
 * 플로우:
 * 1. 식사 타입 선택
 * 2. 사진 촬영/갤러리 선택
 * 3. AI 분석 중 로딩
 * 4. 분석 결과 페이지로 이동 (Task 2.5)
 */
export default function FoodCapturePage() {
  const router = useRouter();

  const [pageState, setPageState] = useState<PageState>('capture');
  const [mealType, setMealType] = useState<MealType>('lunch');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [previewImage, setPreviewImage] = useState<string | null>(null);

  // API 요청 취소를 위한 AbortController
  const abortControllerRef = useRef<AbortController | null>(null);

  // 파일을 Base64로 변환
  const fileToBase64 = useCallback((file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        const result = reader.result as string;
        // data:image/...;base64,... 형식에서 base64 부분만 추출
        const base64 = result.split(',')[1] || result;
        resolve(base64);
      };
      reader.onerror = () => reject(new Error('파일 읽기에 실패했어요.'));
      reader.readAsDataURL(file);
    });
  }, []);

  // 사진 선택 처리
  const handlePhotoSelect = useCallback(
    async (file: File) => {
      try {
        setErrorMessage(null);

        // 파일을 Base64로 변환 (프리뷰 및 API 호출용)
        const imageBase64 = await fileToBase64(file);

        // 프리뷰 이미지 설정 (data URL 형식으로)
        setPreviewImage(`data:${file.type};base64,${imageBase64}`);
        setPageState('analyzing');

        // 이전 요청 취소
        if (abortControllerRef.current) {
          abortControllerRef.current.abort();
        }

        // 새로운 AbortController 생성
        abortControllerRef.current = new AbortController();

        // API 호출
        const response = await fetch('/api/nutrition/foods/analyze', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            imageBase64,
            mealType,
            saveToDb: false, // 결과 확인 후 저장 (Task 2.5에서 처리)
          }),
          signal: abortControllerRef.current.signal,
        });

        if (!response.ok) {
          const error = await response.json();
          throw new Error(error.error || '음식 분석에 실패했어요.');
        }

        const data = await response.json();

        if (!data.success) {
          throw new Error(data.error || '음식 분석에 실패했어요.');
        }

        // 음식이 인식되지 않은 경우
        if (data.warning || data.result.foods.length === 0) {
          setErrorMessage('음식을 인식하지 못했어요. 다시 촬영해주세요.');
          setPageState('error');
          return;
        }

        // 결과를 sessionStorage에 저장하고 결과 페이지로 이동
        // (Task 2.5에서 결과 페이지 구현 시 사용)
        sessionStorage.setItem(
          'foodAnalysisResult',
          JSON.stringify({
            result: data.result,
            mealType,
            usedMock: data.usedMock,
            imageBase64, // 결과 페이지에서 이미지 표시용
          })
        );

        // 결과 페이지로 이동
        router.push('/nutrition/food-result');
      } catch (error) {
        // 취소된 요청은 에러로 처리하지 않음
        if (error instanceof Error && error.name === 'AbortError') {
          return;
        }

        console.error(
          '[Food Capture] Analysis error:',
          error instanceof Error ? error.message : 'Unknown error'
        );
        setErrorMessage('음식 분석에 실패했어요.');
        setPageState('error');
      }
    },
    [mealType, fileToBase64, router]
  );

  // 분석 완료 처리 (로딩 애니메이션 완료 후)
  const handleAnalysisComplete = useCallback(() => {
    // 실제로는 API 응답 완료 후 결과 페이지로 이동
    // 여기서는 분석이 끝날 때까지 로딩 표시
  }, []);

  // 분석 취소
  const handleCancel = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
    setPageState('capture');
    setPreviewImage(null);
  }, []);

  // 다시 시도
  const handleRetry = useCallback(() => {
    setPageState('capture');
    setErrorMessage(null);
    setPreviewImage(null);
  }, []);

  // 뒤로 가기
  const handleBack = useCallback(() => {
    router.back();
  }, [router]);

  // 로딩 상태
  if (pageState === 'analyzing') {
    return (
      <div className="space-y-6">
        {/* 헤더 */}
        <div className="flex items-center gap-4">
          <h1 className="text-xl font-bold text-foreground">음식 분석 중</h1>
        </div>

        {/* 촬영된 사진 프리뷰 */}
        {previewImage && (
          <div className="relative aspect-square w-full max-w-xs mx-auto rounded-2xl overflow-hidden bg-muted">
            <Image src={previewImage} alt="촬영된 음식 사진" fill className="object-cover" />
            {/* 로딩 오버레이 */}
            <div className="absolute inset-0 bg-black/30 flex items-center justify-center">
              <div className="bg-card/90 rounded-full p-4">
                <Loader2 className="w-8 h-8 text-purple-600 animate-spin" />
              </div>
            </div>
          </div>
        )}

        {/* 분석 상태 표시 */}
        <FoodAnalysisLoading onComplete={handleAnalysisComplete} />

        {/* 취소 버튼 */}
        <div className="flex justify-center">
          <Button onClick={handleCancel} variant="outline" className="w-full max-w-xs h-12">
            취소
          </Button>
        </div>
      </div>
    );
  }

  // 에러 상태
  if (pageState === 'error') {
    return (
      <div className="space-y-6">
        {/* 헤더 */}
        <div className="flex items-center gap-4">
          <button
            onClick={handleBack}
            className="p-2 -ml-2 rounded-lg hover:bg-muted transition-colors"
            aria-label="뒤로 가기"
          >
            <ArrowLeft className="w-5 h-5 text-muted-foreground" />
          </button>
          <h1 className="text-xl font-bold text-foreground">음식 분석</h1>
        </div>

        {/* 에러 메시지 */}
        <div className="bg-red-50 dark:bg-red-950/50 rounded-2xl p-6 text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-red-100 dark:bg-red-900/50 rounded-full mb-4">
            <AlertCircle className="w-8 h-8 text-red-600 dark:text-red-400" />
          </div>
          <h2 className="text-lg font-bold text-red-900 dark:text-red-100 mb-2">분석 실패</h2>
          <p className="text-red-700 dark:text-red-300 mb-6">{errorMessage}</p>

          <div className="space-y-3">
            <Button onClick={handleRetry} className="w-full h-12" variant="default">
              다시 촬영하기
            </Button>
            <Button onClick={handleBack} className="w-full h-12" variant="outline">
              돌아가기
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // 캡처 상태
  return (
    <div className="space-y-6">
      {/* 헤더 */}
      <div className="flex items-center gap-4">
        <button
          onClick={handleBack}
          className="p-2 -ml-2 rounded-lg hover:bg-muted transition-colors"
          aria-label="뒤로 가기"
        >
          <ArrowLeft className="w-5 h-5 text-muted-foreground" />
        </button>
        <h1 className="text-xl font-bold text-foreground">음식 사진 촬영</h1>
      </div>

      {/* 식사 타입 선택 */}
      <div className="bg-card rounded-2xl p-4 shadow-sm border border-border/50">
        <p className="text-sm text-muted-foreground mb-3">식사 종류를 선택해주세요</p>
        <div className="grid grid-cols-4 gap-2">
          {MEAL_TYPES.map((type) => (
            <button
              key={type.id}
              onClick={() => setMealType(type.id)}
              className={`flex flex-col items-center gap-1 p-3 rounded-xl transition-all ${
                mealType === type.id
                  ? 'bg-green-100 border-2 border-green-500'
                  : 'bg-muted border-2 border-transparent hover:bg-muted/80'
              }`}
              aria-pressed={mealType === type.id}
            >
              <span className="text-2xl" role="img" aria-hidden="true">
                {type.icon}
              </span>
              <span
                className={`text-xs font-medium ${
                  mealType === type.id ? 'text-green-700' : 'text-muted-foreground'
                }`}
              >
                {type.label}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* 사진 촬영 UI */}
      <FoodPhotoCapture onPhotoSelect={handlePhotoSelect} />

      {/* 안내 문구 */}
      <p className="text-center text-xs text-muted-foreground">
        AI가 음식을 인식하여 칼로리와 영양 정보를 분석해요
      </p>
    </div>
  );
}
