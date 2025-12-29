'use client';

import { useState, useCallback, useRef, useEffect } from 'react';
import { useAuth } from '@clerk/nextjs';
import { useClerkSupabaseClient } from '@/lib/supabase/clerk-client';
import Link from 'next/link';
import { Clock, ArrowRight, User } from 'lucide-react';
import {
  type BodyAnalysisResult,
  type UserBodyInput,
  type BodyType3,
  BODY_TYPES_3,
  generateMockBodyAnalysis3,
} from '@/lib/mock/body-analysis';
import BodyPhotographyGuide from './_components/BodyPhotographyGuide';
import InputForm from './_components/InputForm';
import PhotoUpload from './_components/PhotoUpload';
import KnownBodyTypeInput from './_components/KnownBodyTypeInput';
import AnalysisLoading from './_components/AnalysisLoading';
import AnalysisResult from './_components/AnalysisResult';
import { useShare } from '@/hooks/useShare';
import { ShareButton } from '@/components/share';
import { Confetti } from '@/components/animations';

// 새로운 흐름: guide → input → upload → loading → result
// 또는: guide → known-type → result
type AnalysisStep = 'guide' | 'input' | 'upload' | 'loading' | 'result' | 'known-type';

// 날짜 포맷 헬퍼
function formatDate(date: Date): string {
  const now = new Date();
  const diff = now.getTime() - date.getTime();
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));

  if (days === 0) return '오늘';
  if (days === 1) return '어제';
  if (days < 7) return `${days}일 전`;
  if (days < 30) return `${Math.floor(days / 7)}주 전`;
  return date.toLocaleDateString('ko-KR', { month: 'short', day: 'numeric' });
}

// 체형 라벨 헬퍼
function getBodyTypeLabel(bodyType: string): string {
  const labels: Record<string, string> = {
    X: 'X형 (모래시계)',
    A: 'A형 (삼각형)',
    V: 'V형 (역삼각형)',
    H: 'H형 (직사각형)',
    O: 'O형 (원형)',
    hourglass: '모래시계형',
    pear: '서양배형',
    apple: '사과형',
    rectangle: '직사각형',
    inverted_triangle: '역삼각형',
  };
  return labels[bodyType] || bodyType;
}

// 기존 분석 결과 타입
interface ExistingAnalysis {
  id: string;
  body_type: string;
  created_at: string;
}

export default function BodyAnalysisPage() {
  const { isSignedIn, isLoaded } = useAuth();
  const supabase = useClerkSupabaseClient();
  const [existingAnalysis, setExistingAnalysis] = useState<ExistingAnalysis | null>(null);
  const [checkingExisting, setCheckingExisting] = useState(true);
  const existingCheckedRef = useRef(false);
  const [step, setStep] = useState<AnalysisStep>('guide');
  const [userInput, setUserInput] = useState<UserBodyInput | null>(null);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [result, setResult] = useState<BodyAnalysisResult | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showConfetti, setShowConfetti] = useState(false);
  const analysisStartedRef = useRef(false);
  const { ref: shareRef, share, loading: shareLoading } = useShare('이룸-체형분석-결과');

  // 기존 분석 결과 확인
  useEffect(() => {
    async function checkExistingAnalysis() {
      if (!isLoaded || !isSignedIn || existingCheckedRef.current) return;

      existingCheckedRef.current = true;

      try {
        const { data } = await supabase
          .from('body_analyses')
          .select('id, body_type, created_at')
          .order('created_at', { ascending: false })
          .limit(1)
          .single();

        if (data) {
          setExistingAnalysis(data);
        }
      } catch {
        // 기존 결과 없음 - 무시
      } finally {
        setCheckingExisting(false);
      }
    }

    checkExistingAnalysis();
  }, [isLoaded, isSignedIn, supabase]);

  // 가이드 완료 → 입력 단계로
  const handleGuideComplete = useCallback(() => {
    setStep('input');
  }, []);

  // 기존 체형 타입 알고 있음 → known-type 단계로
  const handleSkipToKnownType = useCallback(() => {
    setStep('known-type');
  }, []);

  // 기존 체형 타입 입력에서 돌아가기
  const handleKnownTypeBack = useCallback(() => {
    setStep('guide');
  }, []);

  // 기존 체형 타입 선택 → Mock 결과 생성
  const handleKnownTypeSelect = useCallback((bodyType: BodyType3) => {
    const typeInfo = BODY_TYPES_3[bodyType];
    const mockResult = generateMockBodyAnalysis3(userInput || undefined);

    // 선택된 타입으로 결과 덮어쓰기 (BodyAnalysisResult 형식으로 변환)
    setResult({
      bodyType: bodyType as unknown as import('@/lib/mock/body-analysis').BodyType,
      bodyTypeLabel: typeInfo.label,
      bodyTypeDescription: typeInfo.description,
      measurements: mockResult.measurements,
      strengths: typeInfo.strengths,
      insight: typeInfo.insights[0],
      styleRecommendations: typeInfo.recommendations,
      analyzedAt: new Date(),
      userInput: userInput || undefined,
    });
    setStep('result');
    setShowConfetti(true);
  }, [userInput]);

  // 기본 정보 입력 완료 시 사진 업로드 단계로 전환
  const handleInputSubmit = useCallback((data: UserBodyInput) => {
    setUserInput(data);
    setStep('upload');
    setError(null);
  }, []);

  // 사진 선택 시 로딩 단계로 전환
  const handlePhotoSelect = useCallback((file: File) => {
    setImageFile(file);
    setStep('loading');
    setError(null);
    analysisStartedRef.current = false;
  }, []);

  // 이미지를 Base64로 변환
  const fileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = (error) => reject(error);
    });
  };

  // AI 분석 실행 (API 호출)
  const runAnalysis = useCallback(async () => {
    if (!imageFile || !isSignedIn || analysisStartedRef.current) {
      return;
    }

    analysisStartedRef.current = true;
    setIsAnalyzing(true);

    try {
      const imageBase64 = await fileToBase64(imageFile);

      const response = await fetch('/api/analyze/body', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ imageBase64, userInput }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Analysis failed');
      }

      const data = await response.json();
      console.log('[C-1] Analysis result:', data.usedMock ? 'Mock' : 'Real AI');

      // API 응답의 result + 퍼스널 컬러 추천 통합
      setResult({
        ...data.result,
        analyzedAt: new Date(data.result.analyzedAt),
        personalColorSeason: data.personalColorSeason,
        colorRecommendations: data.colorRecommendations,
        colorTips: data.colorTips,
      });
      setStep('result');
      // 분석 완료 시 축하 효과
      setShowConfetti(true);
    } catch (err) {
      console.error('Analysis error:', err);
      setError(err instanceof Error ? err.message : 'Analysis failed');
      setStep('upload');
    } finally {
      setIsAnalyzing(false);
    }
  }, [imageFile, userInput, isSignedIn]);

  // 로딩 애니메이션 완료 시 분석 시작
  const handleAnalysisComplete = useCallback(() => {
    runAnalysis();
  }, [runAnalysis]);

  // 다시 분석하기
  const handleRetry = useCallback(() => {
    setUserInput(null);
    setImageFile(null);
    setResult(null);
    setStep('guide');
    setError(null);
    setShowConfetti(false);
    analysisStartedRef.current = false;
  }, []);

  // 단계별 서브타이틀
  const getSubtitle = () => {
    if (error) return '분석 중 오류가 발생했어요';
    switch (step) {
      case 'guide':
        return '정확한 분석을 위한 촬영 가이드';
      case 'input':
        return '나에게 어울리는 스타일이 궁금하신가요?';
      case 'upload':
        return '전신 사진을 업로드해주세요';
      case 'known-type':
        return '기존 체형 타입을 선택해주세요';
      case 'loading':
        return isAnalyzing ? 'AI가 분석 중이에요...' : 'AI가 분석 중이에요';
      case 'result':
        return '분석이 완료되었어요';
    }
  };

  return (
    <>
      {/* 축하 Confetti 효과 */}
      <Confetti trigger={showConfetti} />

      <main className="min-h-[calc(100vh-80px)] bg-muted">
        <div className="max-w-lg mx-auto px-4 py-8">
          {/* 헤더 */}
          <header className="text-center mb-8">
            <h1 className="text-2xl font-bold text-foreground">체형 분석</h1>
            <p className="text-muted-foreground mt-2">{getSubtitle()}</p>
          </header>

          {/* 에러 메시지 */}
          {error && step === 'upload' && (
            <div
              className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg text-red-600 text-sm"
              role="alert"
              aria-live="polite"
            >
              {error}. 다시 시도해주세요.
            </div>
          )}

          {/* 기존 분석 결과 배너 */}
          {step === 'guide' && existingAnalysis && !checkingExisting && (
            <Link
              href={`/analysis/body/result/${existingAnalysis.id}`}
              className="block mb-6 p-4 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl border border-blue-200 hover:shadow-md transition-shadow"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center">
                    <User className="w-5 h-5 text-blue-600" />
                  </div>
                  <div>
                    <p className="font-medium text-foreground">기존 분석 결과 보기</p>
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <span className="font-medium text-blue-600">
                        {getBodyTypeLabel(existingAnalysis.body_type)}
                      </span>
                      <span>•</span>
                      <Clock className="w-3 h-3" />
                      {formatDate(new Date(existingAnalysis.created_at))}
                    </div>
                  </div>
                </div>
                <ArrowRight className="w-5 h-5 text-blue-500" />
              </div>
            </Link>
          )}

          {/* Step별 컴포넌트 렌더링 */}
          {step === 'guide' && (
            <BodyPhotographyGuide
              onContinue={handleGuideComplete}
              onSkip={handleSkipToKnownType}
            />
          )}

          {step === 'input' && <InputForm onSubmit={handleInputSubmit} />}

          {step === 'upload' && <PhotoUpload onPhotoSelect={handlePhotoSelect} />}

          {step === 'known-type' && (
            <KnownBodyTypeInput
              onSelect={handleKnownTypeSelect}
              onBack={handleKnownTypeBack}
            />
          )}

          {step === 'loading' && (
            <AnalysisLoading onComplete={handleAnalysisComplete} />
          )}

          {step === 'result' && result && (
            <AnalysisResult result={result} onRetry={handleRetry} shareRef={shareRef} />
          )}
        </div>
      </main>

      {/* 공유 버튼 - 결과 화면에서만 하단 고정 */}
      {step === 'result' && result && (
        <div className="fixed bottom-20 left-0 right-0 p-4 bg-card/80 backdrop-blur-sm border-t border-border/50 z-10">
          <div className="max-w-md mx-auto">
            <ShareButton
              onShare={share}
              loading={shareLoading}
              variant="outline"
            />
          </div>
        </div>
      )}
    </>
  );
}
