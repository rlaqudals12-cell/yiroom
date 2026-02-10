'use client';

import { useState, useCallback, useRef, useMemo, useEffect } from 'react';
import { useAuth } from '@clerk/nextjs';
import { useClerkSupabaseClient } from '@/lib/supabase/clerk-client';
import Link from 'next/link';
import { Clock, ArrowRight, Upload, Loader2, Palette, Sparkles } from 'lucide-react';
import {
  type MakeupAnalysisResult,
  type UndertoneId,
  type MakeupConcernId,
  type MakeupStyleId,
  generateMockMakeupAnalysisResult,
  UNDERTONES,
  MAKEUP_CONCERNS,
} from '@/lib/mock/makeup-analysis';
import { Button } from '@/components/ui/button';

type AnalysisStep = 'guide' | 'upload' | 'known-input' | 'loading' | 'result';

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
  undertone: string;
  created_at: string;
}

export default function MakeupAnalysisPage() {
  const { isSignedIn, isLoaded } = useAuth();
  const supabase = useClerkSupabaseClient();
  const [step, setStep] = useState<AnalysisStep>('guide');
  const [existingAnalysis, setExistingAnalysis] = useState<ExistingAnalysis | null>(null);
  const [checkingExisting, setCheckingExisting] = useState(true);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [result, setResult] = useState<MakeupAnalysisResult | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const existingCheckedRef = useRef(false);

  // 기존 분석 결과 확인
  useEffect(() => {
    async function checkExistingAnalysis() {
      if (!isLoaded || !isSignedIn || existingCheckedRef.current) return;

      existingCheckedRef.current = true;

      try {
        const { data } = await supabase
          .from('makeup_analyses')
          .select('id, overall_score, undertone, created_at')
          .order('created_at', { ascending: false })
          .limit(1)
          .single();

        if (data) {
          setExistingAnalysis(data);
        }
      } catch {
        // 기존 결과 없음
      } finally {
        setCheckingExisting(false);
      }
    }

    checkExistingAnalysis();
  }, [isLoaded, isSignedIn, supabase]);

  // 파일 선택 핸들러
  const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setImageFile(file);
    setImagePreview(URL.createObjectURL(file));
    setError(null);
  }, []);

  // 이미지 업로드 버튼 클릭
  const handleUploadClick = useCallback(() => {
    fileInputRef.current?.click();
  }, []);

  // 분석 시작
  const handleStartAnalysis = useCallback(async () => {
    if (!imageFile || !isSignedIn) return;

    setIsAnalyzing(true);
    setStep('loading');
    setError(null);

    try {
      // 파일을 Base64로 변환
      const reader = new FileReader();
      const base64Promise = new Promise<string>((resolve, reject) => {
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = reject;
      });
      reader.readAsDataURL(imageFile);
      const imageBase64 = await base64Promise;

      // API 호출
      const response = await fetch('/api/analyze/makeup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ imageBase64 }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || '분석에 실패했어요');
      }

      const data = await response.json();

      setResult({
        ...data.result,
        analyzedAt: new Date(data.result.analyzedAt),
      });

      // sessionStorage 캐시 (결과 페이지 DB 조회 실패 시 복원용)
      try {
        sessionStorage.setItem(
          `makeup-result-${data.data.id}`,
          JSON.stringify({ dbData: data.data, cachedAt: new Date().toISOString() })
        );
      } catch {
        /* sessionStorage 실패 무시 */
      }

      setStep('result');
    } catch (err) {
      console.error('[M-1] Analysis error:', err);
      setError('분석 중 문제가 발생했어요');
      setStep('upload');
    } finally {
      setIsAnalyzing(false);
    }
  }, [imageFile, isSignedIn]);

  // 알고 있는 타입으로 건너뛰기
  const handleSkipToKnownInput = useCallback(() => {
    setStep('known-input');
  }, []);

  // 다시 분석하기
  const handleRetry = useCallback(() => {
    setImageFile(null);
    setImagePreview(null);
    setResult(null);
    setStep('guide');
    setError(null);
  }, []);

  // 단계별 서브타이틀
  const subtitle = useMemo(() => {
    if (error) return '분석 중 오류가 발생했어요';
    switch (step) {
      case 'guide':
        return '정확한 분석을 위한 촬영 가이드';
      case 'upload':
        return '얼굴 사진을 선택해주세요';
      case 'known-input':
        return '피부 타입을 선택해주세요';
      case 'loading':
        return 'AI가 분석 중이에요...';
      case 'result':
        return '분석이 완료되었어요';
    }
  }, [step, error]);

  // 언더톤 라벨
  const undertoneLabels: Record<string, string> = {
    warm: '웜톤',
    cool: '쿨톤',
    neutral: '뉴트럴',
  };

  return (
    <div className="min-h-[calc(100vh-80px)] bg-muted" data-testid="makeup-analysis-page">
      <div className="max-w-lg mx-auto px-4 py-8">
        {/* 헤더 */}
        <header className="text-center mb-8">
          <h1 className="text-2xl font-bold text-foreground">💄 메이크업 분석</h1>
          <p className="text-muted-foreground mt-2">{subtitle}</p>
        </header>

        {/* 에러 메시지 */}
        {error && (
          <div
            className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg text-red-600 text-sm"
            role="alert"
          >
            {error}. 다시 시도해주세요.
          </div>
        )}

        {/* 기존 분석 결과 배너 */}
        {step === 'guide' && existingAnalysis && !checkingExisting && (
          <Link
            href={`/analysis/makeup/result/${existingAnalysis.id}`}
            className="block mb-6 p-4 bg-gradient-to-r from-pink-50 to-rose-50 rounded-xl border border-pink-200 hover:shadow-md transition-shadow"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-pink-100 flex items-center justify-center">
                  <span className="text-lg font-bold text-pink-600">
                    {existingAnalysis.overall_score}
                  </span>
                </div>
                <div>
                  <p className="font-medium text-foreground">기존 분석 결과 보기</p>
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <Clock className="w-3 h-3" />
                    {formatDate(new Date(existingAnalysis.created_at))} ·{' '}
                    {undertoneLabels[existingAnalysis.undertone] || existingAnalysis.undertone}
                  </div>
                </div>
              </div>
              <ArrowRight className="w-5 h-5 text-pink-500" />
            </div>
          </Link>
        )}

        {/* 촬영 가이드 */}
        {step === 'guide' && (
          <div className="space-y-6">
            <div className="bg-card rounded-xl p-6 shadow-sm">
              <h2 className="font-semibold text-lg mb-4">📸 촬영 가이드</h2>
              <ul className="space-y-3 text-sm text-muted-foreground">
                <li className="flex items-start gap-2">
                  <span className="text-pink-500">✓</span>
                  밝은 자연광 아래에서 촬영해주세요
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-pink-500">✓</span>
                  정면에서 얼굴 전체가 보이도록 촬영해주세요
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-pink-500">✓</span>
                  민낯 상태에서 촬영하면 더 정확해요
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-red-400">✗</span>
                  필터나 보정된 사진은 피해주세요
                </li>
              </ul>
            </div>

            <div className="flex gap-3">
              <Button
                onClick={() => setStep('upload')}
                className="flex-1 bg-pink-500 hover:bg-pink-600"
              >
                사진 선택하기
              </Button>
              <Button variant="outline" onClick={handleSkipToKnownInput}>
                알고 있어요
              </Button>
            </div>
          </div>
        )}

        {/* 사진 업로드 */}
        {step === 'upload' && (
          <div className="space-y-6">
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleFileSelect}
              className="hidden"
            />

            {imagePreview ? (
              <div className="space-y-4">
                <div className="aspect-square rounded-xl overflow-hidden bg-muted">
                  <img
                    src={imagePreview}
                    alt="선택된 이미지"
                    className="w-full h-full object-cover"
                  />
                </div>
                <div className="flex gap-3">
                  <Button variant="outline" onClick={handleUploadClick} className="flex-1">
                    다른 사진 선택
                  </Button>
                  <Button
                    onClick={handleStartAnalysis}
                    disabled={isAnalyzing}
                    className="flex-1 bg-pink-500 hover:bg-pink-600"
                  >
                    {isAnalyzing ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        분석 중...
                      </>
                    ) : (
                      '분석 시작'
                    )}
                  </Button>
                </div>
              </div>
            ) : (
              <button
                onClick={handleUploadClick}
                className="w-full aspect-square rounded-xl border-2 border-dashed border-muted-foreground/30 hover:border-pink-500/50 transition-colors flex flex-col items-center justify-center gap-4 bg-card"
              >
                <div className="w-16 h-16 rounded-full bg-pink-100 flex items-center justify-center">
                  <Upload className="w-8 h-8 text-pink-600" />
                </div>
                <div className="text-center">
                  <p className="font-medium text-foreground">사진을 선택해주세요</p>
                  <p className="text-sm text-muted-foreground mt-1">탭하여 갤러리에서 선택</p>
                </div>
              </button>
            )}

            <Button variant="ghost" onClick={() => setStep('guide')} className="w-full">
              ← 가이드로 돌아가기
            </Button>
          </div>
        )}

        {/* 알고있는 타입 입력 */}
        {step === 'known-input' && (
          <KnownTypeInput
            onSubmit={(undertone, concerns) => {
              const mockResult = generateMockMakeupAnalysisResult();
              setResult({
                ...mockResult,
                undertone,
                undertoneLabel: UNDERTONES.find((t) => t.id === undertone)?.label || '',
                concerns,
                analyzedAt: new Date(),
              });
              setStep('result');
            }}
            onBack={() => setStep('guide')}
          />
        )}

        {/* 로딩 */}
        {step === 'loading' && (
          <div className="flex flex-col items-center justify-center py-16">
            <div className="w-20 h-20 rounded-full bg-pink-100 flex items-center justify-center mb-6 animate-pulse">
              <span className="text-4xl">💄</span>
            </div>
            <p className="text-lg font-medium text-foreground">AI가 얼굴을 분석하고 있어요</p>
            <p className="text-sm text-muted-foreground mt-2">잠시만 기다려주세요...</p>
            <Loader2 className="w-8 h-8 mt-6 animate-spin text-pink-500" />
          </div>
        )}

        {/* 결과 */}
        {step === 'result' && result && (
          <AnalysisResultView result={result} onRetry={handleRetry} />
        )}
      </div>
    </div>
  );
}

// 알고있는 타입 입력 컴포넌트
function KnownTypeInput({
  onSubmit,
  onBack,
}: {
  onSubmit: (undertone: UndertoneId, concerns: MakeupConcernId[]) => void;
  onBack: () => void;
}) {
  const [selectedUndertone, setSelectedUndertone] = useState<UndertoneId | null>(null);
  const [selectedConcerns, setSelectedConcerns] = useState<MakeupConcernId[]>([]);

  const toggleConcern = (id: MakeupConcernId) => {
    setSelectedConcerns((prev) =>
      prev.includes(id) ? prev.filter((c) => c !== id) : [...prev, id]
    );
  };

  return (
    <div className="space-y-6">
      {/* 언더톤 선택 */}
      <div className="bg-card rounded-xl p-6 shadow-sm">
        <h3 className="font-semibold mb-4">피부 톤을 선택해주세요</h3>
        <div className="grid grid-cols-3 gap-3">
          {UNDERTONES.map((tone) => (
            <button
              key={tone.id}
              onClick={() => setSelectedUndertone(tone.id)}
              className={`p-4 rounded-lg border-2 transition-all ${
                selectedUndertone === tone.id
                  ? 'border-pink-500 bg-pink-50'
                  : 'border-muted hover:border-pink-200'
              }`}
            >
              <span className="text-2xl mb-2 block">{tone.emoji}</span>
              <span className="font-medium text-sm">{tone.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* 고민 선택 */}
      <div className="bg-card rounded-xl p-6 shadow-sm">
        <h3 className="font-semibold mb-4">피부 고민을 선택해주세요 (복수 선택)</h3>
        <div className="flex flex-wrap gap-2">
          {MAKEUP_CONCERNS.map((concern) => (
            <button
              key={concern.id}
              onClick={() => toggleConcern(concern.id)}
              className={`px-3 py-2 rounded-full text-sm transition-all ${
                selectedConcerns.includes(concern.id)
                  ? 'bg-pink-500 text-white'
                  : 'bg-muted hover:bg-muted/80'
              }`}
            >
              {concern.emoji} {concern.label}
            </button>
          ))}
        </div>
      </div>

      <div className="flex gap-3">
        <Button variant="outline" onClick={onBack}>
          ← 뒤로
        </Button>
        <Button
          onClick={() => selectedUndertone && onSubmit(selectedUndertone, selectedConcerns)}
          disabled={!selectedUndertone}
          className="flex-1 bg-pink-500 hover:bg-pink-600"
        >
          결과 보기
        </Button>
      </div>
    </div>
  );
}

// 결과 보기 컴포넌트
function AnalysisResultView({
  result,
  onRetry,
}: {
  result: MakeupAnalysisResult;
  onRetry: () => void;
}) {
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'good':
        return 'text-green-600 bg-green-100';
      case 'warning':
        return 'text-red-600 bg-red-100';
      default:
        return 'text-pink-600 bg-pink-100';
    }
  };

  const styleLabels: Record<MakeupStyleId, string> = {
    natural: '내추럴',
    glam: '글램',
    cute: '큐트',
    chic: '시크',
    vintage: '빈티지',
    edgy: '엣지',
  };

  return (
    <div className="space-y-6" data-testid="makeup-analysis-result">
      {/* 종합 점수 */}
      <div className="bg-gradient-to-br from-pink-50 to-rose-50 rounded-xl p-6 text-center">
        <div className="w-24 h-24 mx-auto rounded-full bg-white shadow-lg flex items-center justify-center mb-4">
          <span className="text-4xl font-bold text-pink-600">{result.overallScore}</span>
        </div>
        <h2 className="text-xl font-bold text-foreground">
          {result.undertoneLabel} · {result.faceShapeLabel}
        </h2>
        <p className="text-sm text-muted-foreground mt-1">
          {result.eyeShapeLabel} · {result.lipShapeLabel}
        </p>
      </div>

      {/* 인사이트 */}
      <div className="bg-card rounded-xl p-6 shadow-sm">
        <h3 className="font-semibold mb-3 flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-pink-500" />
          분석 요약
        </h3>
        <p className="text-sm text-muted-foreground leading-relaxed">{result.insight}</p>
      </div>

      {/* 지표 */}
      <div className="bg-card rounded-xl p-6 shadow-sm">
        <h3 className="font-semibold mb-4">📊 피부 상태</h3>
        <div className="space-y-4">
          {result.metrics.map((metric) => (
            <div key={metric.id}>
              <div className="flex items-center justify-between mb-1">
                <span className="text-sm font-medium">{metric.label}</span>
                <span
                  className={`text-xs px-2 py-0.5 rounded-full ${getStatusColor(metric.status)}`}
                >
                  {metric.value}점
                </span>
              </div>
              <div className="h-2 bg-muted rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all ${
                    metric.status === 'good'
                      ? 'bg-green-500'
                      : metric.status === 'warning'
                        ? 'bg-red-500'
                        : 'bg-pink-500'
                  }`}
                  style={{ width: `${metric.value}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 추천 스타일 */}
      <div className="bg-card rounded-xl p-6 shadow-sm">
        <h3 className="font-semibold mb-3 flex items-center gap-2">
          <Palette className="w-4 h-4 text-pink-500" />
          추천 메이크업 스타일
        </h3>
        <div className="flex flex-wrap gap-2">
          {result.recommendedStyles.map((style, i) => (
            <span key={i} className="px-3 py-1 bg-pink-100 text-pink-700 rounded-full text-sm">
              {styleLabels[style as MakeupStyleId] || style}
            </span>
          ))}
        </div>
      </div>

      {/* 색상 추천 */}
      {result.colorRecommendations.map((cr) => (
        <div key={cr.category} className="bg-card rounded-xl p-6 shadow-sm">
          <h3 className="font-semibold mb-3">💄 {cr.categoryLabel} 추천 색상</h3>
          <div className="flex flex-wrap gap-3">
            {cr.colors.map((color, i) => (
              <div key={i} className="flex items-center gap-2">
                <div
                  className="w-8 h-8 rounded-full border-2 border-white shadow-md"
                  style={{ backgroundColor: color.hex }}
                />
                <div>
                  <p className="text-sm font-medium">{color.name}</p>
                  <p className="text-xs text-muted-foreground">{color.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      ))}

      {/* 메이크업 팁 */}
      <div className="bg-card rounded-xl p-6 shadow-sm">
        <h3 className="font-semibold mb-3">✨ 메이크업 팁</h3>
        <div className="space-y-4">
          {result.makeupTips.map((tipGroup, i) => (
            <div key={i}>
              <p className="text-sm font-medium text-pink-600 mb-2">{tipGroup.category}</p>
              <ul className="space-y-1">
                {tipGroup.tips.map((tip, j) => (
                  <li key={j} className="flex items-start gap-2 text-sm text-muted-foreground">
                    <span className="text-pink-500">•</span>
                    {tip}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>

      {/* 퍼스널 컬러 연동 */}
      {result.personalColorConnection && (
        <div className="bg-gradient-to-r from-purple-50 to-pink-50 rounded-xl p-6 border border-purple-100">
          <h3 className="font-semibold mb-2 flex items-center gap-2">🎨 퍼스널 컬러 연동</h3>
          <p className="text-sm text-muted-foreground mb-2">
            예상 시즌:{' '}
            <span className="font-medium text-foreground">
              {result.personalColorConnection.season}
            </span>
          </p>
          <p className="text-xs text-muted-foreground">{result.personalColorConnection.note}</p>
          <Link
            href="/analysis/personal-color"
            className="inline-block mt-3 text-sm text-purple-600 hover:underline"
          >
            퍼스널 컬러 진단받기 →
          </Link>
        </div>
      )}

      {/* 버튼 */}
      <Button onClick={onRetry} variant="outline" className="w-full">
        다시 분석하기
      </Button>
    </div>
  );
}
