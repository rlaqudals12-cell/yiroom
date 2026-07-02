'use client';

/**
 * 통합 분석 입력 페이지 (5축 한 번에)
 *
 * @route GET /analysis/integrated
 * @see docs/adr/ADR-100-integrated-analysis-ui.md
 * @see docs/specs/SDD-INTEGRATED-RESULT-UI.md §2
 */

import { useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { Sparkles } from 'lucide-react';
import { measureBodyClient } from '@/lib/analysis/body-v2';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { useAnalysisStatus } from '@/hooks/useAnalysisStatus';
import type { AxisCode } from '@/lib/analysis/integrated';
import { ImageUploadSection } from './_components/ImageUploadSection';
import { QuestionnaireForm, type QuestionnaireData } from './_components/QuestionnaireForm';
import { IntegratedLoadingUI } from './_components/IntegratedLoadingUI';

// 선택 재분석용 축 옵션 (ADR-109 cadence locking)
const AXIS_OPTIONS: { code: AxisCode; label: string }[] = [
  { code: 'personal_color', label: '퍼스널컬러' },
  { code: 'skin', label: '피부' },
  { code: 'body', label: '체형' },
  { code: 'hair', label: '헤어' },
  { code: 'makeup', label: '메이크업' },
];
const ALL_AXES = AXIS_OPTIONS.map((a) => a.code);

export default function IntegratedAnalysisInputPage(): React.JSX.Element {
  const router = useRouter();
  const { analysisCount } = useAnalysisStatus();

  const [faceImage, setFaceImage] = useState<string | null>(null);
  const [bodyImage, setBodyImage] = useState<string | null>(null);
  const [questionnaire, setQuestionnaire] = useState<QuestionnaireData | null>(null);
  const [selectedAxes, setSelectedAxes] = useState<AxisCode[]>(ALL_AXES);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // 이미 분석 이력이 있는 복귀 사용자에게만 "축 선택" 노출 (신규는 전체 분석)
  const isReturning = analysisCount > 0;
  // 일부만 선택 → update 모드(선택 축만 재분석, 나머지 프로필 유지)
  const isPartialUpdate =
    isReturning && selectedAxes.length > 0 && selectedAxes.length < ALL_AXES.length;

  const canSubmit = faceImage !== null && !isSubmitting;

  const toggleAxis = useCallback((code: AxisCode) => {
    setSelectedAxes((prev) =>
      prev.includes(code) ? prev.filter((c) => c !== code) : [...prev, code]
    );
  }, []);

  const handleSubmit = useCallback(async () => {
    if (!faceImage) {
      setError('얼굴 사진이 필요해요.');
      return;
    }
    setError(null);
    setIsSubmitting(true);

    try {
      // 전신 사진이 있으면 제출 직전 클라이언트 MediaPipe 측정 1회 (A1) →
      // 서버가 측정값을 Gemini 추정보다 우선 사용. 측정 실패 시 null → 서버 Gemini 폴백.
      let measuredBody;
      if (bodyImage) {
        const m = await measureBodyClient(bodyImage);
        if (m) {
          measuredBody = {
            shoulderWidth: m.ratios.shoulderWidth,
            waistWidth: m.ratios.waistWidth,
            hipWidth: m.ratios.hipWidth,
            shape: m.shape,
            confidence: m.confidence,
          };
        }
      }

      const res = await fetch('/api/analyze/integrated', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          faceImageBase64: faceImage,
          bodyImageBase64: bodyImage ?? undefined,
          measuredBody,
          questionnaire: questionnaire ?? {},
          options: { locale: 'ko' },
          // 선택 재분석: 일부 축만 고르면 그 축만 재실행, 나머지는 프로필 최신값 유지 (ADR-109)
          ...(isPartialUpdate ? { mode: 'update' as const, axes: selectedAxes } : {}),
        }),
      });

      const json = await res.json();

      if (!res.ok || !json.success) {
        const message =
          json?.error?.userMessage ??
          json?.error?.message ??
          '분석 요청에 실패했어요. 잠시 후 다시 시도해주세요.';
        setError(message);
        setIsSubmitting(false);
        return;
      }

      const sessionId: string | undefined = json.result?.sessionId;
      if (!sessionId) {
        setError('세션 생성에 실패했어요.');
        setIsSubmitting(false);
        return;
      }

      router.push(`/analysis/integrated/result/${sessionId}`);
    } catch (err) {
      console.error('[IntegratedInput] submit error:', err);
      setError('네트워크 오류가 발생했어요.');
      setIsSubmitting(false);
    }
  }, [faceImage, bodyImage, questionnaire, selectedAxes, isPartialUpdate, router]);

  if (isSubmitting) {
    return (
      <div
        className="min-h-[calc(100vh-80px)] bg-neutral-950 px-4 py-16"
        data-testid="integrated-submitting"
      >
        <IntegratedLoadingUI />
      </div>
    );
  }

  return (
    <div
      className="min-h-[calc(100vh-80px)] bg-neutral-950 px-4 py-8"
      data-testid="integrated-input-page"
    >
      <div className="mx-auto max-w-3xl space-y-6">
        {/* 헤더 */}
        <header className="space-y-2 text-center">
          <div className="inline-flex items-center gap-2 rounded-full border border-pink-500/30 bg-pink-500/10 px-4 py-1.5 text-xs text-pink-300">
            <Sparkles className="h-3.5 w-3.5" />
            5축 통합 분석
          </div>
          <h1 className="text-2xl font-bold text-white md:text-3xl">
            셀카 한 장으로
            <br />
            색·피부·체형·헤어 한 번에
          </h1>
          <p className="text-sm text-zinc-400">
            약 2분이면 완료돼요. 자연광에서 찍은 정면 사진이 가장 정확해요.
          </p>
        </header>

        {/* 선택 재분석 — 복귀 사용자만 (ADR-109 cadence locking) */}
        {isReturning && (
          <section className="space-y-2" data-testid="axis-select-section">
            <h2 className="text-lg font-semibold text-white">다시 분석할 축</h2>
            <p className="text-xs text-zinc-400">
              체크한 축만 새로 분석해요. 나머지는 지금 프로필 값을 그대로 유지해서, 피부처럼 자주
              변하는 것만 갱신할 수 있어요.
            </p>
            <div className="flex flex-wrap gap-2">
              {AXIS_OPTIONS.map(({ code, label }) => {
                const on = selectedAxes.includes(code);
                return (
                  <button
                    key={code}
                    type="button"
                    aria-pressed={on}
                    onClick={() => toggleAxis(code)}
                    className={cn(
                      'rounded-full border px-3 py-1.5 text-sm transition-colors',
                      on
                        ? 'border-pink-500 bg-pink-500/15 text-pink-200'
                        : 'border-zinc-700 text-zinc-500 hover:border-zinc-500'
                    )}
                  >
                    {label}
                  </button>
                );
              })}
            </div>
          </section>
        )}

        {/* 1. 이미지 업로드 */}
        <section className="space-y-3">
          <h2 className="text-lg font-semibold text-white">1. 사진 업로드</h2>
          <ImageUploadSection onFaceImageChange={setFaceImage} onBodyImageChange={setBodyImage} />
        </section>

        {/* 2. 자가입력 */}
        <section className="space-y-3">
          <h2 className="text-lg font-semibold text-white">2. 나에 대한 정보</h2>
          <QuestionnaireForm onChange={setQuestionnaire} showBodyFields={bodyImage === null} />
        </section>

        {/* 에러 메시지 */}
        {error && (
          <div
            role="alert"
            className="rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-300"
          >
            {error}
          </div>
        )}

        {/* 제출 버튼 */}
        <div className="sticky bottom-4 flex justify-center">
          <Button
            type="button"
            onClick={handleSubmit}
            disabled={!canSubmit}
            className="h-12 min-w-[240px] rounded-xl bg-gradient-to-r from-pink-500 to-purple-500 text-sm font-bold text-white shadow-lg shadow-pink-500/25 hover:from-pink-400 hover:to-purple-400 disabled:opacity-50"
          >
            <Sparkles className="mr-2 h-4 w-4" />내 정체성 알아보기
          </Button>
        </div>

        {/* 안내 */}
        <p className="text-center text-xs text-zinc-500">
          분석 결과는 AI가 생성한 참고 정보이며, 의학적 진단을 대체하지 않아요.
        </p>
      </div>
    </div>
  );
}
