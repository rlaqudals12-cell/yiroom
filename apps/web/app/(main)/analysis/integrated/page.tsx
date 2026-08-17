'use client';

/**
 * 통합 분석 입력 페이지 (5축 한 번에)
 *
 * @route GET /analysis/integrated
 * @see docs/adr/ADR-100-integrated-analysis-ui.md
 * @see docs/specs/SDD-INTEGRATED-RESULT-UI.md §2
 */

import { useState, useCallback, useEffect } from 'react';
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
import { PendingAnalysisBanner } from './_components/PendingAnalysisBanner';

/** 이탈 복구 마커 — 이번 요청의 상관 ID를 담는다 (탭 세션 한정) */
const PENDING_ANALYSIS_KEY = 'yiroom:integrated:pending';

/** 게이트웨이 타임아웃 계열 — 서버 상한(maxDuration=60s) 초과를 네트워크 오류로 오귀인하지 않는다 */
const TIMEOUT_STATUSES = [408, 502, 504, 524];
const TIMEOUT_MESSAGE = '분석 시간이 초과됐어요 — 다시 시도해주세요.';

/**
 * 서버가 요청을 확실히 거절한 상태 — 분석이 시작조차 되지 않았음이 확정된다.
 * 이 경우에만 복구 마커를 지운다. 그 외(타임아웃·5xx·파싱 실패·네트워크 예외)는
 * 서버에서 분석이 끝났을 수도 있으므로 마커를 남겨 복구 경로를 지킨다.
 */
const DEFINITIVE_REJECT_STATUSES = [400, 401, 403, 404, 409, 422, 429];

/** 상관 ID 생성 (구형 브라우저·테스트 환경 폴백 포함) */
function createRequestId(): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }
  // 서버 Zod가 uuid 형식을 요구한다 — 폴백도 v4 형태를 지킨다
  return '10000000-1000-4000-8000-100000000000'.replace(/[018]/g, (c) =>
    (Number(c) ^ (Math.floor(Math.random() * 256) & (15 >> (Number(c) / 4)))).toString(16)
  );
}

/**
 * 서버 에러 본문 → 사용자 문구
 * 429 레이트리밋은 표준 봉투가 아닌 `{ error: string }` 평면 형태 — 문자열이면 그대로 노출한다.
 */
function resolveErrorMessage(
  error: string | { userMessage?: string; message?: string } | undefined
): string {
  if (typeof error === 'string') return error;
  return (
    error?.userMessage ?? error?.message ?? '분석 요청에 실패했어요. 잠시 후 다시 시도해주세요.'
  );
}

/** 서버로 보내는 체형 실측 페이로드 (클라이언트 MediaPipe 측정 결과) */
interface MeasuredBodyPayload {
  shoulderWidth: number;
  waistWidth: number;
  hipWidth: number;
  shape: string;
  confidence: number;
  /** 비율 전체 — body_ratios JSONB로 축적, 3D 아바타 정밀화 입력 (ADR-110) */
  ratios: Record<string, number>;
}

/**
 * 전신 사진이 있으면 제출 직전 클라이언트 MediaPipe 측정 1회 (A1).
 * 서버가 측정값을 Gemini 추정보다 우선 사용. 측정 실패 시 undefined → 서버 Gemini 폴백.
 */
async function measureBodyForSubmit(
  bodyImage: string | null
): Promise<MeasuredBodyPayload | undefined> {
  if (!bodyImage) return undefined;
  const m = await measureBodyClient(bodyImage);
  if (!m) return undefined;
  return {
    shoulderWidth: m.ratios.shoulderWidth,
    waistWidth: m.ratios.waistWidth,
    hipWidth: m.ratios.hipWidth,
    shape: m.shape,
    confidence: m.confidence,
    ratios: { ...m.ratios },
  };
}

/**
 * 사진 외 제출 가드 — 막아야 할 이유가 있으면 사용자 문구, 없으면 null.
 *
 * 버튼 비활성화만으로는 부족하다: 이력이 확정되기 전(analysisCount=0)에 제출되면
 * mode 미전송 = 5축 전체 재분석이라 복귀 사용자의 프로필을 덮어쓴다.
 */
function submitBlockReason(params: {
  isReturning: boolean;
  selectedAxisCount: number;
  isAnalysisStatusResolved: boolean;
  hasAnalysisStatusError: boolean;
}): string | null {
  if (params.isReturning && params.selectedAxisCount === 0) {
    return '다시 분석할 축을 한 개 이상 선택해주세요';
  }
  if (!params.isAnalysisStatusResolved) {
    return params.hasAnalysisStatusError
      ? '분석 이력을 불러오지 못했어요. 다시 시도한 뒤 분석해주세요.'
      : '분석 이력을 확인하는 중이에요. 잠시만 기다려주세요.';
  }
  return null;
}

interface SubmitResponseBody {
  success?: boolean;
  error?: string | { userMessage?: string; message?: string };
  result?: { sessionId?: string };
}

/**
 * 응답 본문 판독.
 * 게이트웨이 타임아웃(504 등)은 본문이 JSON이 아닌 HTML/빈 응답 — 파싱 실패를 그대로
 * catch로 흘리면 "네트워크 오류"로 오귀인된다. 여기서 분리해 판정한다.
 */
async function readSubmitResponse(
  res: Response
): Promise<{ isTimeout: boolean; json: SubmitResponseBody | null }> {
  let json: SubmitResponseBody | null = null;
  let parseFailed = false;
  try {
    json = (await res.json()) as SubmitResponseBody;
  } catch {
    parseFailed = true;
  }
  return { isTimeout: TIMEOUT_STATUSES.includes(res.status) || parseFailed, json };
}

/** UUID 형태 검사 — 구버전(숫자 시각) 마커나 손상된 값을 걸러낸다 */
const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function readPendingMarker(): string | null {
  try {
    const raw = sessionStorage.getItem(PENDING_ANALYSIS_KEY);
    if (raw === null) return null;
    if (UUID_RE.test(raw)) return raw;
    // 구버전(제출 시각) 또는 손상된 마커 — 상관 ID가 없으면 무엇도 단언할 수 없으므로 폐기
    sessionStorage.removeItem(PENDING_ANALYSIS_KEY);
    return null;
  } catch {
    // 스토리지 접근 차단(프라이빗 모드 등) — 복구 배너만 포기, 분석 흐름엔 영향 없음
    return null;
  }
}

function writePendingMarker(requestId: string): void {
  try {
    sessionStorage.setItem(PENDING_ANALYSIS_KEY, requestId);
  } catch {
    /* 스토리지 사용 불가 — 무시 */
  }
}

function clearPendingMarker(): void {
  try {
    sessionStorage.removeItem(PENDING_ANALYSIS_KEY);
  } catch {
    /* 스토리지 사용 불가 — 무시 */
  }
}

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
  // isLoading·hasError를 함께 읽는 이유: 이력이 확정되기 전엔 analysisCount가 0이라
  // 복귀 사용자도 "신규"로 보인다 → 축 선택 UI 없이 제출되면 mode 미전송 = 5축 전체
  // 재분석(프로필 덮어쓰기). 확정 전에는 제출을 막고, 조회 실패는 재시도로 안내한다.
  const {
    analysisCount,
    isLoading: isAnalysisStatusLoading,
    hasError: hasAnalysisStatusError,
    refetch: refetchAnalysisStatus,
  } = useAnalysisStatus();
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
  // 분석 도중 이탈했다가 돌아온 경우 (마커가 남아 있음) — 값은 그 요청의 상관 ID
  const [pendingRequestId, setPendingRequestId] = useState<string | null>(null);

  // 재진입 시 1회 확인 — 마커가 있으면 복구 배너를 띄운다
  useEffect(() => {
    setPendingRequestId(readPendingMarker());
  }, []);

  // 분석 중 새로고침·탭 닫기 경고 — 응답을 못 받으면 결과 링크를 잃는다
  useEffect(() => {
    if (!isSubmitting) return;
    const handler = (e: BeforeUnloadEvent): void => {
      e.preventDefault();
      // 레거시 브라우저 호환 (문구는 브라우저가 자체 문구로 대체)
      e.returnValue = '';
    };
    window.addEventListener('beforeunload', handler);
    return () => window.removeEventListener('beforeunload', handler);
  }, [isSubmitting]);

  const dismissPending = useCallback(() => {
    clearPendingMarker();
    setPendingRequestId(null);
  }, []);

  // 분석 이력이 확정되기 전/조회에 실패한 동안은 "복귀 사용자 여부"를 알 수 없다.
  // 모르는 상태로 제출하면 복귀 사용자의 프로필을 통째로 덮어쓸 수 있으므로 제출을 막는다.
  const isAnalysisStatusResolved = !isAnalysisStatusLoading && !hasAnalysisStatusError;
  // 이미 분석 이력이 있는 복귀 사용자에게만 "축 선택" 노출 (신규는 전체 분석)
  const isReturning = analysisCount > 0;
  // 일부만 선택 → update 모드(선택 축만 재분석, 나머지 프로필 유지)
  const isPartialUpdate =
    isReturning && selectedAxes.length > 0 && selectedAxes.length < ALL_AXES.length;

  // 복귀 사용자가 축을 전부 해제하면 mode 미전송 → 의도치 않은 'full' 5축 재분석(프로필 덮어쓰기)이
  // 되므로 0축 제출을 차단한다.
  const canSubmit =
    faceImage !== null &&
    isAnalysisStatusResolved &&
    (!isReturning || selectedAxes.length > 0) &&
    !isSubmitting;

  // 체형 축은 전신 사진이 있을 때만 실제로 판정된다 (자가입력은 판정에 쓰이지 않음 —
  // axis-adapters bodyFallback). 이번 분석에 체형이 포함되는데 신호가 하나도 없으면 미리 알린다.
  const bodyAxisIncluded = !isReturning || selectedAxes.includes('body');
  const hasSelfReportedBody = Object.values(questionnaire?.body ?? {}).some(
    (v) => typeof v === 'number'
  );
  const willSkipBody = bodyAxisIncluded && bodyImage === null && !hasSelfReportedBody;

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
    // 재분석 0축·이력 미확정 가드 — 버튼 비활성화를 우회한 제출도 차단
    const blockReason = submitBlockReason({
      isReturning,
      selectedAxisCount: selectedAxes.length,
      isAnalysisStatusResolved,
      hasAnalysisStatusError,
    });
    if (blockReason) {
      setError(blockReason);
      return;
    }
    setError(null);
    setIsSubmitting(true);
    // 이탈 복구 마커 — 응답 전에 화면을 벗어나도 돌아왔을 때 이 ID로 결과를 되찾는다
    const requestId = createRequestId();
    writePendingMarker(requestId);
    setPendingRequestId(null);

    try {
      const measuredBody = await measureBodyForSubmit(bodyImage);

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
          // 이탈 복구 상관 ID — 서버가 세션에 함께 저장해 "이 요청의 세션"을 정확히 찾게 한다
          clientRequestId: requestId,
          // 선택 재분석: 일부 축만 고르면 그 축만 재실행, 나머지는 프로필 최신값 유지 (ADR-109)
          ...(isPartialUpdate ? { mode: 'update' as const, axes: selectedAxes } : {}),
        }),
      });

      const { isTimeout, json } = await readSubmitResponse(res);

      if (isTimeout || !res.ok || json?.success !== true) {
        setError(isTimeout ? TIMEOUT_MESSAGE : resolveErrorMessage(json?.error));
        setIsSubmitting(false);
        // 마커는 "서버가 확실히 거절한" 경우에만 지운다.
        // 타임아웃·5xx·파싱 실패는 서버에서 분석이 끝났을 수 있다 — 마커를 지우면
        // 이미 저장된 결과로 돌아갈 길이 사라진다(= 사용자가 5축을 다시 태운다).
        if (DEFINITIVE_REJECT_STATUSES.includes(res.status)) {
          clearPendingMarker();
        }
        return;
      }

      const sessionId: string | undefined = json.result?.sessionId;
      if (!sessionId) {
        setError('세션 생성에 실패했어요.');
        setIsSubmitting(false);
        // 200 + success:true인데 sessionId가 없는 응답 — 세션이 있는지 알 수 없으므로 마커 유지
        return;
      }

      // 실사용 계측 (Vercel Analytics 커스텀 이벤트 — flagship 통합 분석 완료)
      track('integrated_analysis_complete', {
        mode: isPartialUpdate ? 'update' : 'full',
        axisCount: isPartialUpdate ? selectedAxes.length : 5,
      });

      // 분석 완료 → 홈/[나] 탭 5분 캐시 즉시 무효화 (신규 사용자가 "분석 0개"로 남지 않도록)
      invalidateAnalysisCache();
      // 결과 화면으로 이동 = 복구 대상 아님
      clearPendingMarker();
      router.push(`/analysis/integrated/result/${sessionId}`);
    } catch (err) {
      console.error('[IntegratedInput] submit error:', err);
      setError('연결이 끊겼어요. 네트워크를 확인하고 다시 시도해주세요.');
      setIsSubmitting(false);
      // 네트워크 예외 = 요청이 서버에 닿았는지 알 수 없음 → 마커 유지(복구 배너가 판정)
    }
  }, [
    faceImage,
    bodyImage,
    questionnaire,
    selectedAxes,
    isReturning,
    isPartialUpdate,
    isAnalysisStatusResolved,
    hasAnalysisStatusError,
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

        {/* 분석 도중 이탈 → 재진입 복구 (마커가 있을 때만 조회) */}
        {pendingRequestId !== null && (
          <PendingAnalysisBanner requestId={pendingRequestId} onDismiss={dismissPending} />
        )}

        {/* 분석 이력 조회 실패 — 복귀 사용자를 신규로 오인해 프로필을 덮어쓰지 않도록 제출을 막고 재시도를 준다 */}
        {hasAnalysisStatusError && (
          <div
            role="alert"
            data-testid="analysis-status-error"
            className="flex items-center gap-3 rounded-2xl border border-destructive/30 bg-destructive/10 px-4 py-3"
          >
            <p className="min-w-0 flex-1 text-sm text-destructive">
              분석 이력을 불러오지 못했어요. 이전 결과를 덮어쓰지 않도록 잠시 분석을 멈췄어요.
            </p>
            <button
              type="button"
              onClick={refetchAnalysisStatus}
              data-testid="analysis-status-retry"
              className="shrink-0 rounded-full bg-destructive px-3 py-1.5 text-xs font-semibold text-destructive-foreground hover:bg-destructive/90"
            >
              다시 시도
            </button>
          </div>
        )}

        {/* 헤더 */}
        <header className="space-y-2 text-center">
          <p className="text-xs text-muted-foreground">셀카 한 장 · 통합 분석</p>
          <h1 className="text-2xl font-bold text-foreground md:text-3xl">
            셀카 한 장으로
            <br />
            색·피부·헤어·메이크업 한 번에
          </h1>
          {/* 소요 시간은 서버 상한(maxDuration=60s) 하나만 근거로 삼는다 (로딩 UI·온보딩 헤더와 동일 문구) */}
          <p className="text-sm text-muted-foreground">
            분석은 1분이면 끝나요. 자연광에서 찍은 정면 사진이 가장 정확해요.
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
            data-testid="integrated-submit-error"
            className="rounded-xl border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive"
          >
            {error}
          </div>
        )}

        {/* 체형 축 사전 고지 — 제출 후 결과에서 처음 알게 되지 않도록 (전신 사진이 유일한 신호) */}
        {willSkipBody && (
          <p className="text-center text-xs text-muted-foreground" data-testid="body-skip-notice">
            체형 분석은 이번에 건너뛰어요 (전신 사진 필요) — 결과엔 예시 값이 들어가요
          </p>
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
