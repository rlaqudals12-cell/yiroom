'use client';

import { useState, useCallback, useRef, useMemo, useEffect } from 'react';
import { useAuth } from '@clerk/nextjs';
import { useClerkSupabaseClient } from '@/lib/supabase/clerk-client';
import Link from 'next/link';
import { Clock, ArrowRight } from 'lucide-react';
import {
  type SkinAnalysisResult,
  type SkinTypeId,
  type SkinConcernId,
  generateMockAnalysisResult,
  SKIN_CONCERNS,
} from '@/lib/mock/skin-analysis';
import LightingGuide from './_components/LightingGuide';
import PhotoUpload from './_components/PhotoUpload';
import KnownSkinTypeInput from './_components/KnownSkinTypeInput';
import AnalysisLoading from './_components/AnalysisLoading';
import AnalysisResult from './_components/AnalysisResult';
import { useShare } from '@/hooks/useShare';
import { ShareButton } from '@/components/share';
import { Confetti } from '@/components/animations';

// 새 플로우: 조명가이드 → 사진촬영 → AI분석 → 결과
// 또는: 기존 피부 타입 입력 → 결과
type AnalysisStep = 'guide' | 'upload' | 'loading' | 'result' | 'known-input';

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

// 기존 분석 결과 타입
interface ExistingAnalysis {
  id: string;
  overall_score: number;
  skin_type: string;
  created_at: string;
}

export default function SkinAnalysisPage() {
  const { isSignedIn, isLoaded } = useAuth();
  const supabase = useClerkSupabaseClient();
  const [step, setStep] = useState<AnalysisStep>('guide');
  const [existingAnalysis, setExistingAnalysis] = useState<ExistingAnalysis | null>(null);
  const [checkingExisting, setCheckingExisting] = useState(true);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [result, setResult] = useState<SkinAnalysisResult | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showConfetti, setShowConfetti] = useState(false);
  const analysisStartedRef = useRef(false);
  const existingCheckedRef = useRef(false);
  const { ref: shareRef, share, loading: shareLoading } = useShare('이룸-피부분석-결과');

  // 기존 분석 결과 확인
  useEffect(() => {
    async function checkExistingAnalysis() {
      if (!isLoaded || !isSignedIn || existingCheckedRef.current) return;

      existingCheckedRef.current = true;

      try {
        const { data } = await supabase
          .from('skin_analyses')
          .select('id, overall_score, skin_type, created_at')
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

  // 조명 가이드 완료 → 사진 촬영으로
  const handleGuideComplete = useCallback(() => {
    setStep('upload');
  }, []);

  // 기존 피부 타입 알고 있음 → 입력 화면으로
  const handleSkipToKnownInput = useCallback(() => {
    setStep('known-input');
  }, []);

  // 기존 피부 타입 입력 → 결과 생성
  const handleKnownTypeSelect = useCallback((skinType: SkinTypeId, concerns: SkinConcernId[]) => {
    // Mock 결과 생성
    const mockResult = generateMockAnalysisResult();

    // 고민 정보 찾기
    const concernLabels = concerns
      .map((id) => SKIN_CONCERNS.find((c) => c.id === id)?.label)
      .filter(Boolean)
      .join(', ');

    // 피부 타입에 따른 인사이트 생성
    const typeInsights: Record<SkinTypeId, string> = {
      dry: '건성 피부는 수분 보충이 중요해요! 히알루론산과 세라마이드 성분을 추천드려요.',
      oily: '지성 피부는 유분 조절이 핵심이에요. 가벼운 수분크림과 BHA 성분을 활용해보세요.',
      combination: '복합성 피부는 부위별 케어가 필요해요. T존과 U존을 다르게 관리해주세요.',
      normal: '중성 피부는 현재 상태를 유지하는 것이 중요해요. 기본 루틴을 꾸준히 지켜주세요.',
      sensitive: '민감성 피부는 순한 성분이 필수예요. 세라마이드와 알로에베라를 추천드려요.',
    };

    setResult({
      ...mockResult,
      insight:
        typeInsights[skinType] +
        (concernLabels ? ` 특히 ${concernLabels} 관리에 신경써주세요.` : ''),
      analyzedAt: new Date(),
    });
    setStep('result');
    setShowConfetti(true);
  }, []);

  // 기존 피부 타입 입력에서 돌아가기
  const handleKnownInputBack = useCallback(() => {
    setStep('guide');
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

      const response = await fetch('/api/analyze/skin', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ imageBase64 }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Analysis failed');
      }

      const data = await response.json();

      // API 응답의 result + 성분 분석 + 제품 추천 통합
      setResult({
        ...data.result,
        analyzedAt: new Date(data.result.analyzedAt),
        personalColorSeason: data.personalColorSeason,
        foundationRecommendation: data.foundationRecommendation,
        ingredientWarnings: data.ingredientWarnings,
        productRecommendations: data.productRecommendations,
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
  }, [imageFile, isSignedIn]);

  // 로딩 애니메이션 완료 시 분석 시작
  const handleAnalysisComplete = useCallback(() => {
    runAnalysis();
  }, [runAnalysis]);

  // 다시 분석하기
  const handleRetry = useCallback(() => {
    setImageFile(null);
    setResult(null);
    setStep('guide');
    setError(null);
    setShowConfetti(false);
    analysisStartedRef.current = false;
  }, []);

  // 단계별 서브타이틀
  const subtitle = useMemo(() => {
    if (error) return '분석 중 오류가 발생했어요';
    switch (step) {
      case 'guide':
        return '정확한 분석을 위한 촬영 가이드';
      case 'upload':
        return '피부 사진을 촬영해주세요';
      case 'known-input':
        return '피부 타입을 선택해주세요';
      case 'loading':
        return isAnalyzing ? 'AI가 분석 중이에요...' : 'AI가 분석 중이에요';
      case 'result':
        return '분석이 완료되었어요';
    }
  }, [step, error, isAnalyzing]);

  return (
    <>
      {/* 축하 Confetti 효과 */}
      <Confetti trigger={showConfetti} />

      <main className="min-h-[calc(100vh-80px)] bg-muted">
        <div className="max-w-lg mx-auto px-4 py-8">
          {/* 헤더 */}
          <header className="text-center mb-8">
            <h1 className="text-2xl font-bold text-foreground">피부 분석</h1>
            <p className="text-muted-foreground mt-2">{subtitle}</p>
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
              href={`/analysis/skin/result/${existingAnalysis.id}`}
              className="block mb-6 p-4 bg-gradient-to-r from-emerald-50 to-teal-50 rounded-xl border border-emerald-200 hover:shadow-md transition-shadow"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-emerald-100 flex items-center justify-center">
                    <span className="text-lg font-bold text-emerald-600">
                      {existingAnalysis.overall_score}
                    </span>
                  </div>
                  <div>
                    <p className="font-medium text-foreground">기존 분석 결과 보기</p>
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <Clock className="w-3 h-3" />
                      {formatDate(new Date(existingAnalysis.created_at))}
                    </div>
                  </div>
                </div>
                <ArrowRight className="w-5 h-5 text-emerald-500" />
              </div>
            </Link>
          )}

          {/* Step별 컴포넌트 렌더링 */}
          {step === 'guide' && (
            <LightingGuide onContinue={handleGuideComplete} onSkip={handleSkipToKnownInput} />
          )}

          {step === 'upload' && <PhotoUpload onPhotoSelect={handlePhotoSelect} />}

          {step === 'known-input' && (
            <KnownSkinTypeInput onSelect={handleKnownTypeSelect} onBack={handleKnownInputBack} />
          )}

          {step === 'loading' && <AnalysisLoading onComplete={handleAnalysisComplete} />}

          {step === 'result' && result && (
            <AnalysisResult result={result} onRetry={handleRetry} shareRef={shareRef} />
          )}
        </div>
      </main>

      {/* 공유 버튼 - 결과 화면에서만 하단 고정 */}
      {step === 'result' && result && (
        <div className="fixed bottom-20 left-0 right-0 p-4 bg-card/80 backdrop-blur-sm border-t border-border/50 z-10">
          <div className="max-w-md mx-auto">
            <ShareButton onShare={share} loading={shareLoading} variant="outline" />
          </div>
        </div>
      )}
    </>
  );
}
