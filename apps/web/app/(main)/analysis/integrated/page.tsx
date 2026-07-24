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
import { track } from '@vercel/analytics';
import { measureBodyClient } from '@/lib/analysis/body-v2';
import { useFaceLandmarker } from '@/hooks/useFaceLandmarker';
import { measureContrastLevel } from '../personal-color/_components/measure-contrast';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { useAnalysisStatus, invalidateAnalysisCache } from '@/hooks/useAnalysisStatus';
import { useGender } from '@/components/providers/gender-provider';
import type { AxisCode } from '@/lib/analysis/integrated';
import { ImageUploadSection } from './_components/ImageUploadSection';
import { QuestionnaireForm, type QuestionnaireData } from './_components/QuestionnaireForm';
import { IntegratedLoadingUI } from './_components/IntegratedLoadingUI';
import { OnboardingHeader } from './_components/OnboardingHeader';

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
  // 퍼스널 대비 실측용 MediaPipe 랜드마커 (ADR-116) — 미가용 시 detect가 null → 대비 생략
  const { detect: detectFaceLandmarks } = useFaceLandmarker();
  // 온보딩에서 저장된 성별을 추천 맞춤 기본값으로 재사용 (neutral은 미선택으로 취급)
  const savedGender = useGender();

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

  // 복귀 사용자가 축을 전부 해제하면 mode 미전송 → 의도치 않은 'full' 5축 재분석(프로필 덮어쓰기)이
  // 되므로 0축 제출을 차단한다.
  const canSubmit =
    faceImage !== null && (!isReturning || selectedAxes.length > 0) && !isSubmitting;

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
    // 재분석 0축 가드 — 버튼 비활성화를 우회한 제출도 차단
    if (isReturning && selectedAxes.length === 0) {
      setError('다시 분석할 축을 한 개 이상 선택해주세요');
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
            // 비율 전체 — body_ratios JSONB로 축적, 3D 아바타 정밀화 입력 (ADR-110)
            ratios: { ...m.ratios },
          };
        }
      }

      // 퍼스널 대비 실측 (ADR-116, PC 축) — 얼굴 셀카에서 피부·모발 L* 격차를 측정.
      // measuredBody와 동일 패턴: MediaPipe 미가용/얼굴 미감지면 null → 필드 생략(서버는 미저장).
      const measuredContrastLevel =
        (await measureContrastLevel(detectFaceLandmarks, faceImage)) ?? undefined;

      const res = await fetch('/api/analyze/integrated', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          faceImageBase64: faceImage,
          bodyImageBase64: bodyImage ?? undefined,
          measuredBody,
          measuredContrastLevel,
          questionnaire: questionnaire ?? {},
          options: { locale: 'ko' },
          // 선택 재분석: 일부 축만 고르면 그 축만 재실행, 나머지는 프로필 최신값 유지 (ADR-109)
          ...(isPartialUpdate ? { mode: 'update' as const, axes: selectedAxes } : {}),
        }),
      });

      const json = await res.json();

      if (!res.ok || !json.success) {
        // 429 레이트리밋은 표준 봉투가 아닌 { error: string } 평면 형태 — 문자열이면 그대로 노출
        const message =
          typeof json?.error === 'string'
            ? json.error
            : (json?.error?.userMessage ??
              json?.error?.message ??
              '분석 요청에 실패했어요. 잠시 후 다시 시도해주세요.');
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

      // 실사용 계측 (Vercel Analytics 커스텀 이벤트 — flagship 통합 분석 완료)
      track('integrated_analysis_complete', {
        mode: isPartialUpdate ? 'update' : 'full',
        axisCount: isPartialUpdate ? selectedAxes.length : 5,
      });

      // 분석 완료 → 홈/[나] 탭 5분 캐시 즉시 무효화 (신규 사용자가 "분석 0개"로 남지 않도록)
      invalidateAnalysisCache();
      router.push(`/analysis/integrated/result/${sessionId}`);
    } catch (err) {
      console.error('[IntegratedInput] submit error:', err);
      setError('네트워크 오류가 발생했어요.');
      setIsSubmitting(false);
    }
  }, [
    faceImage,
    bodyImage,
    questionnaire,
    selectedAxes,
    isReturning,
    isPartialUpdate,
    router,
    detectFaceLandmarks,
  ]);

  if (isSubmitting) {
    return (
      <div
        className="min-h-[calc(100vh-80px)] bg-background px-4 py-16"
        data-testid="integrated-submitting"
      >
        <IntegratedLoadingUI />
      </div>
    );
  }

  return (
    <div
      className="min-h-[calc(100vh-80px)] bg-background px-4 py-8"
      data-testid="integrated-input-page"
    >
      <div className="mx-auto max-w-3xl space-y-6">
        {/* 온보딩 모드(가입=첫 미팅) 진입 시에만 렌더 — ADR-114 */}
        <OnboardingHeader />

        {/* 헤더 */}
        <header className="space-y-2 text-center">
          <p className="text-xs uppercase tracking-widest text-muted-foreground">
            셀카 한 장 · 통합 분석
          </p>
          <h1 className="text-2xl font-bold text-foreground md:text-3xl">
            셀카 한 장으로
            <br />
            색·피부·체형·헤어 한 번에
          </h1>
          <p className="text-sm text-muted-foreground">
            약 2분이면 완료돼요. 자연광에서 찍은 정면 사진이 가장 정확해요.
          </p>
        </header>

        {/* 선택 재분석 — 복귀 사용자만 (ADR-109 cadence locking) */}
        {isReturning && (
          <section className="space-y-2" data-testid="axis-select-section">
            <h2 className="text-lg font-semibold text-foreground">다시 분석할 축</h2>
            <p className="text-xs text-muted-foreground">
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
                        ? 'border-primary bg-primary/10 text-primary'
                        : 'border-border text-muted-foreground hover:border-primary/50'
                    )}
                  >
                    {label}
                  </button>
                );
              })}
            </div>
            {selectedAxes.length === 0 && (
              <p role="alert" className="text-xs text-destructive" data-testid="axis-select-error">
                다시 분석할 축을 한 개 이상 선택해주세요
              </p>
            )}
          </section>
        )}

        {/* 1. 이미지 업로드 */}
        <section className="space-y-3">
          <h2 className="text-lg font-semibold text-foreground">1. 사진 업로드</h2>
          <ImageUploadSection onFaceImageChange={setFaceImage} onBodyImageChange={setBodyImage} />
        </section>

        {/* 2. 자가입력 */}
        <section className="space-y-3">
          <div className="space-y-0.5">
            <h2 className="text-lg font-semibold text-foreground">2. 나에 대한 정보</h2>
            <p className="text-xs text-muted-foreground">선택 — 건너뛰어도 분석돼요</p>
          </div>
          <QuestionnaireForm
            onChange={setQuestionnaire}
            showBodyFields={bodyImage === null}
            defaultGender={savedGender === 'neutral' ? undefined : savedGender}
          />
        </section>

        {/* 에러 메시지 */}
        {error && (
          <div
            role="alert"
            className="rounded-xl border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive"
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
            className="h-12 min-w-[240px] rounded-full bg-primary text-sm font-bold text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
          >
            내 정체성 알아보기
          </Button>
        </div>

        {/* 안내 */}
        <p className="text-center text-xs text-muted-foreground">
          분석 결과는 AI가 생성한 참고 정보이며, 의학적 진단을 대체하지 않아요.
        </p>
      </div>
    </div>
  );
}
