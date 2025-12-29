'use client';

import { useState, useCallback, useRef, useMemo, useEffect } from 'react';
import { useAuth } from '@clerk/nextjs';
import { useClerkSupabaseClient } from '@/lib/supabase/clerk-client';
import Link from 'next/link';
import { Clock, ArrowRight, Palette } from 'lucide-react';
import {
  type PersonalColorResult,
  type SeasonType,
  type PersonalColorSubtype,
  generateMockPersonalColorResult,
  PERSONAL_COLOR_SUBTYPES,
  SEASON_INFO,
} from '@/lib/mock/personal-color';
import LightingGuide from './_components/LightingGuide';
import PhotoUpload from './_components/PhotoUpload';
import WristPhotoUpload from './_components/WristPhotoUpload';
import KnownPersonalColorInput from './_components/KnownPersonalColorInput';
import AnalysisLoading from './_components/AnalysisLoading';
import AnalysisResult from './_components/AnalysisResult';

// 새 플로우: 조명가이드 → 얼굴사진 → 손목사진 → AI분석 → 결과
// 또는: 기존 퍼스널 컬러 입력 → 결과
type AnalysisStep = 'guide' | 'upload' | 'wrist' | 'loading' | 'result' | 'known-input';

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

// 시즌 라벨 헬퍼
function getSeasonLabel(season: string): string {
  const labels: Record<string, string> = {
    Spring: '봄 웜톤',
    Summer: '여름 쿨톤',
    Autumn: '가을 웜톤',
    Winter: '겨울 쿨톤',
    spring: '봄 웜톤',
    summer: '여름 쿨톤',
    autumn: '가을 웜톤',
    winter: '겨울 쿨톤',
  };
  return labels[season] || season;
}

// 기존 분석 결과 타입
interface ExistingAnalysis {
  id: string;
  season: string;
  created_at: string;
}

export default function PersonalColorPage() {
  const { isSignedIn, isLoaded } = useAuth();
  const supabase = useClerkSupabaseClient();
  const [existingAnalysis, setExistingAnalysis] = useState<ExistingAnalysis | null>(null);
  const [checkingExisting, setCheckingExisting] = useState(true);
  const existingCheckedRef = useRef(false);
  const [step, setStep] = useState<AnalysisStep>('guide');
  const [faceImageFile, setFaceImageFile] = useState<File | null>(null);
  const [wristImageFile, setWristImageFile] = useState<File | null>(null);
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [result, setResult] = useState<PersonalColorResult | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const analysisStartedRef = useRef(false);

  // 기존 분석 결과 확인
  useEffect(() => {
    async function checkExistingAnalysis() {
      if (!isLoaded || !isSignedIn || existingCheckedRef.current) return;

      existingCheckedRef.current = true;

      try {
        const { data } = await supabase
          .from('personal_color_assessments')
          .select('id, season, created_at')
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

  // 기존 퍼스널 컬러 알고 있음 → 입력 화면으로
  const handleSkipToKnownInput = useCallback(() => {
    setStep('known-input');
  }, []);

  // 기존 퍼스널 컬러 입력 → 결과 생성
  const handleKnownColorSelect = useCallback((seasonType: SeasonType, subtype?: PersonalColorSubtype) => {
    // Mock 결과 생성 (해당 시즌 타입으로)
    const mockResult = generateMockPersonalColorResult();

    // 서브타입 정보 찾기
    const subtypeInfo = subtype
      ? PERSONAL_COLOR_SUBTYPES.find(s => s.id === subtype)
      : null;

    // 시즌 라벨 결정 (서브타입이 있으면 서브타입 라벨 사용)
    const seasonLabel = subtypeInfo
      ? subtypeInfo.label
      : SEASON_INFO[seasonType].label;

    // 톤과 깊이 결정
    const tone = subtypeInfo ? subtypeInfo.tone : (seasonType === 'spring' || seasonType === 'autumn' ? 'warm' : 'cool');
    const depth = subtypeInfo ? subtypeInfo.depth : (seasonType === 'spring' || seasonType === 'summer' ? 'light' : 'deep');

    setResult({
      ...mockResult,
      seasonType,
      seasonLabel,
      tone,
      depth,
      confidence: 100, // 사용자가 직접 입력했으므로 100%
      analyzedAt: new Date(),
    });
    setStep('result');
  }, []);

  // 기존 퍼스널 컬러 입력에서 돌아가기
  const handleKnownInputBack = useCallback(() => {
    setStep('guide');
  }, []);

  // 얼굴 사진 선택 → 손목 사진으로
  const handleFacePhotoSelect = useCallback((file: File) => {
    setFaceImageFile(file);
    // 미리보기 URL 생성
    const url = URL.createObjectURL(file);
    setImageUrl(url);
    setStep('wrist');
    setError(null);
  }, []);

  // 손목 사진 선택 → AI 분석으로
  const handleWristPhotoSelect = useCallback((file: File) => {
    setWristImageFile(file);
    setStep('loading');
    analysisStartedRef.current = false;
  }, []);

  // 손목 사진 건너뛰기 → 얼굴 사진만으로 분석
  const handleWristSkip = useCallback(() => {
    setStep('loading');
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
    if (!faceImageFile || !isSignedIn || analysisStartedRef.current) {
      return;
    }

    analysisStartedRef.current = true;
    setIsAnalyzing(true);

    try {
      // 얼굴 이미지를 Base64로 변환
      const faceImageBase64 = await fileToBase64(faceImageFile);

      // 손목 이미지가 있으면 Base64로 변환
      let wristImageBase64: string | undefined;
      if (wristImageFile) {
        wristImageBase64 = await fileToBase64(wristImageFile);
      }

      const response = await fetch('/api/analyze/personal-color', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          imageBase64: faceImageBase64,
          wristImageBase64,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Analysis failed');
      }

      const data = await response.json();
      console.log('[PC-1] Analysis result:', data.usedMock ? 'Mock' : 'Real AI');

      // API 응답의 result를 사용
      setResult({
        ...data.result,
        analyzedAt: new Date(data.result.analyzedAt),
      });
      setStep('result');
    } catch (err) {
      console.error('Analysis error:', err);
      setError(err instanceof Error ? err.message : 'Analysis failed');
      setStep('upload');
    } finally {
      setIsAnalyzing(false);
    }
  }, [faceImageFile, wristImageFile, isSignedIn]);

  // 로딩 애니메이션 완료 시 분석 시작
  const handleAnalysisComplete = useCallback(() => {
    runAnalysis();
  }, [runAnalysis]);

  // 다시 분석하기
  const handleRetry = useCallback(() => {
    // 이전 이미지 URL 정리
    if (imageUrl) {
      URL.revokeObjectURL(imageUrl);
    }
    setFaceImageFile(null);
    setWristImageFile(null);
    setImageUrl(null);
    setResult(null);
    setStep('guide');
    setError(null);
    analysisStartedRef.current = false;
  }, [imageUrl]);

  // 단계별 서브타이틀
  const subtitle = useMemo(() => {
    if (error) return '분석 중 오류가 발생했어요';
    switch (step) {
      case 'guide':
        return '정확한 진단을 위한 촬영 가이드';
      case 'upload':
        return '얼굴 사진을 촬영해주세요';
      case 'wrist':
        return '손목 사진을 촬영해주세요';
      case 'known-input':
        return '기존 퍼스널 컬러를 선택해주세요';
      case 'loading':
        return isAnalyzing ? 'AI가 분석 중이에요...' : 'AI가 분석 중이에요';
      case 'result':
        return '분석이 완료되었어요';
    }
  }, [step, error, isAnalyzing]);

  return (
    <main className="min-h-[calc(100vh-80px)] bg-muted">
      <div className="max-w-lg mx-auto px-4 py-8">
        {/* 헤더 */}
        <header className="text-center mb-8">
          <h1 className="text-2xl font-bold text-foreground">퍼스널 컬러 진단</h1>
          <p className="text-muted-foreground mt-2">{subtitle}</p>
        </header>

        {/* 에러 메시지 */}
        {error && step === 'upload' && (
          <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg text-red-600 text-sm">
            {error}. 다시 시도해주세요.
          </div>
        )}

        {/* 기존 분석 결과 배너 */}
        {step === 'guide' && existingAnalysis && !checkingExisting && (
          <Link
            href={`/analysis/personal-color/result/${existingAnalysis.id}`}
            className="block mb-6 p-4 bg-gradient-to-r from-pink-50 to-rose-50 rounded-xl border border-pink-200 hover:shadow-md transition-shadow"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-pink-100 flex items-center justify-center">
                  <Palette className="w-5 h-5 text-pink-600" />
                </div>
                <div>
                  <p className="font-medium text-foreground">기존 진단 결과 보기</p>
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <span className="font-medium text-pink-600">
                      {getSeasonLabel(existingAnalysis.season)}
                    </span>
                    <span>•</span>
                    <Clock className="w-3 h-3" />
                    {formatDate(new Date(existingAnalysis.created_at))}
                  </div>
                </div>
              </div>
              <ArrowRight className="w-5 h-5 text-pink-500" />
            </div>
          </Link>
        )}

        {/* Step별 컴포넌트 렌더링 */}
        {step === 'guide' && (
          <LightingGuide
            onContinue={handleGuideComplete}
            onSkip={handleSkipToKnownInput}
          />
        )}

        {step === 'upload' && (
          <PhotoUpload onPhotoSelect={handleFacePhotoSelect} />
        )}

        {step === 'wrist' && (
          <WristPhotoUpload
            onPhotoSelect={handleWristPhotoSelect}
            onSkip={handleWristSkip}
          />
        )}

        {step === 'known-input' && (
          <KnownPersonalColorInput
            onSelect={handleKnownColorSelect}
            onBack={handleKnownInputBack}
          />
        )}

        {step === 'loading' && (
          <AnalysisLoading onComplete={handleAnalysisComplete} />
        )}

        {step === 'result' && result && (
          <AnalysisResult result={result} onRetry={handleRetry} />
        )}
      </div>
    </main>
  );
}
