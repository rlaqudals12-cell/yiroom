/**
 * 통합 분석 입력 페이지 테스트
 *
 * - 재분석 0축 가드: 축을 전부 해제한 채 제출하면 mode 미전송 → 의도치 않은 'full'
 *   5축 전체 재분석(프로필 덮어쓰기 + Gemini 5콜)이 되던 버그의 회귀 방지.
 * - 제출 실패 분기: 504/502·JSON 파싱 실패를 "네트워크 오류"로 오귀인하던 결함.
 * - 이탈 복구 마커, 체형 축 사전 고지, 소요 시간 문구 단일화.
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import IntegratedAnalysisInputPage from '@/app/(main)/analysis/integrated/page';

const pushMock = vi.fn();
let analysisCountValue = 0;

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: pushMock }),
}));
vi.mock('@vercel/analytics', () => ({ track: vi.fn() }));
vi.mock('@/lib/analysis/body-v2', () => ({ measureBodyClient: vi.fn() }));
vi.mock('@/hooks/useFaceLandmarker', () => ({
  useFaceLandmarker: () => ({ detect: null }),
}));
vi.mock('@/app/(main)/analysis/personal-color/_components/measure-contrast', () => ({
  measureContrastLevel: vi.fn().mockResolvedValue(null),
}));
vi.mock('@/hooks/useAnalysisStatus', () => ({
  useAnalysisStatus: () => ({ analysisCount: analysisCountValue }),
  invalidateAnalysisCache: vi.fn(),
}));
vi.mock('@/components/providers/gender-provider', () => ({
  useGender: () => 'neutral',
}));
// 하위 폼 컴포넌트는 페이지 가드 로직과 무관 — 얼굴 이미지 세팅 트리거만 남긴다
vi.mock('@/app/(main)/analysis/integrated/_components/ImageUploadSection', () => ({
  ImageUploadSection: ({
    onFaceImageChange,
    onBodyImageChange,
  }: {
    onFaceImageChange: (v: string | null) => void;
    onBodyImageChange: (v: string | null) => void;
  }) => (
    <>
      <button
        type="button"
        data-testid="mock-set-face"
        onClick={() => onFaceImageChange('data:image/jpeg;base64,face')}
      >
        set-face
      </button>
      <button
        type="button"
        data-testid="mock-set-body"
        onClick={() => onBodyImageChange('data:image/jpeg;base64,body')}
      >
        set-body
      </button>
    </>
  ),
}));
vi.mock('@/app/(main)/analysis/integrated/_components/PendingAnalysisBanner', () => ({
  PendingAnalysisBanner: ({ startedAt }: { startedAt: number }) => (
    <div data-testid="mock-pending-banner">{startedAt}</div>
  ),
}));
vi.mock('@/app/(main)/analysis/integrated/_components/QuestionnaireForm', () => ({
  QuestionnaireForm: () => <div data-testid="mock-questionnaire" />,
}));
vi.mock('@/app/(main)/analysis/integrated/_components/IntegratedLoadingUI', () => ({
  IntegratedLoadingUI: () => <div data-testid="mock-loading" />,
}));
vi.mock('@/app/(main)/analysis/integrated/_components/OnboardingHeader', () => ({
  OnboardingHeader: () => null,
}));

const AXIS_LABELS = ['퍼스널컬러', '피부', '체형', '헤어', '메이크업'];

function deselectAllAxes(): void {
  for (const label of AXIS_LABELS) {
    fireEvent.click(screen.getByRole('button', { name: label }));
  }
}

const PENDING_KEY = 'yiroom:integrated:pending';

/** fetch 응답 스텁 — json() 파싱 실패까지 재현 가능 */
function stubFetch(options: {
  status: number;
  json?: unknown;
  jsonThrows?: boolean;
}): ReturnType<typeof vi.fn> {
  const fetchMock = vi.fn().mockResolvedValue({
    ok: options.status >= 200 && options.status < 300,
    status: options.status,
    json: options.jsonThrows
      ? vi.fn().mockRejectedValue(new SyntaxError('Unexpected token < in JSON'))
      : vi.fn().mockResolvedValue(options.json ?? {}),
  });
  vi.stubGlobal('fetch', fetchMock);
  return fetchMock;
}

async function submitWithFace(): Promise<void> {
  fireEvent.click(screen.getByTestId('mock-set-face'));
  fireEvent.click(screen.getByRole('button', { name: '내 정체성 알아보기' }));
}

describe('IntegratedAnalysisInputPage — 재분석 0축 가드', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('복귀 사용자가 축을 전부 해제하면 제출이 비활성화되고 인라인 에러가 보인다', () => {
    analysisCountValue = 3;
    render(<IntegratedAnalysisInputPage />);

    fireEvent.click(screen.getByTestId('mock-set-face'));
    deselectAllAxes();

    expect(screen.getByRole('button', { name: '내 정체성 알아보기' })).toBeDisabled();
    expect(screen.getByTestId('axis-select-error')).toHaveTextContent(
      '다시 분석할 축을 한 개 이상 선택해주세요'
    );
  });

  it('축을 하나라도 다시 선택하면 제출이 가능해지고 에러가 사라진다', () => {
    analysisCountValue = 3;
    render(<IntegratedAnalysisInputPage />);

    fireEvent.click(screen.getByTestId('mock-set-face'));
    deselectAllAxes();
    fireEvent.click(screen.getByRole('button', { name: '피부' }));

    expect(screen.getByRole('button', { name: '내 정체성 알아보기' })).not.toBeDisabled();
    expect(screen.queryByTestId('axis-select-error')).not.toBeInTheDocument();
  });

  it('신규 사용자는 축 선택 섹션 없이 기존대로 제출 가능하다', () => {
    analysisCountValue = 0;
    render(<IntegratedAnalysisInputPage />);

    fireEvent.click(screen.getByTestId('mock-set-face'));

    expect(screen.queryByTestId('axis-select-section')).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: '내 정체성 알아보기' })).not.toBeDisabled();
  });
});

describe('IntegratedAnalysisInputPage — 제출 실패 분기', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    analysisCountValue = 0;
    sessionStorage.clear();
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('504 게이트웨이 타임아웃은 시간 초과로 안내한다 (네트워크 오류 오귀인 제거)', async () => {
    stubFetch({ status: 504, jsonThrows: true });
    render(<IntegratedAnalysisInputPage />);

    await submitWithFace();

    await waitFor(() => {
      expect(screen.getByTestId('integrated-submit-error')).toHaveTextContent(
        '분석 시간이 초과됐어요 — 다시 시도해주세요.'
      );
    });
  });

  it('502 응답도 시간 초과 문구로 안내한다', async () => {
    stubFetch({ status: 502, json: { success: false } });
    render(<IntegratedAnalysisInputPage />);

    await submitWithFace();

    await waitFor(() => {
      expect(screen.getByTestId('integrated-submit-error')).toHaveTextContent(
        '분석 시간이 초과됐어요'
      );
    });
  });

  it('200이지만 JSON 파싱이 깨지면 시간 초과로 처리한다', async () => {
    stubFetch({ status: 200, jsonThrows: true });
    render(<IntegratedAnalysisInputPage />);

    await submitWithFace();

    await waitFor(() => {
      expect(screen.getByTestId('integrated-submit-error')).toHaveTextContent(
        '분석 시간이 초과됐어요'
      );
    });
  });

  it('429 레이트리밋 등 서버 문구는 그대로 노출한다', async () => {
    stubFetch({ status: 429, json: { error: '오늘 분석 횟수를 모두 사용했어요.' } });
    render(<IntegratedAnalysisInputPage />);

    await submitWithFace();

    await waitFor(() => {
      expect(screen.getByTestId('integrated-submit-error')).toHaveTextContent(
        '오늘 분석 횟수를 모두 사용했어요.'
      );
    });
  });

  it('네트워크 예외는 연결 안내로 남긴다', async () => {
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new TypeError('Failed to fetch')));
    render(<IntegratedAnalysisInputPage />);

    await submitWithFace();

    await waitFor(() => {
      expect(screen.getByTestId('integrated-submit-error')).toHaveTextContent(/연결이 끊겼어요/);
    });
  });
});

describe('IntegratedAnalysisInputPage — 이탈 복구 마커', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    analysisCountValue = 0;
    sessionStorage.clear();
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('제출 시 진행 마커를 기록하고 분석 중 이탈 경고를 등록한다', async () => {
    const addListenerSpy = vi.spyOn(window, 'addEventListener');
    // 응답이 오지 않는 상태 = 분석 진행 중
    vi.stubGlobal('fetch', vi.fn().mockReturnValue(new Promise(() => {})));
    render(<IntegratedAnalysisInputPage />);

    await submitWithFace();

    await waitFor(() => {
      expect(screen.getByTestId('integrated-submitting')).toBeInTheDocument();
    });
    expect(Number(sessionStorage.getItem(PENDING_KEY))).toBeGreaterThan(0);
    expect(addListenerSpy).toHaveBeenCalledWith('beforeunload', expect.any(Function));
    addListenerSpy.mockRestore();
  });

  it('성공하면 마커를 지우고 결과로 이동한다', async () => {
    stubFetch({ status: 200, json: { success: true, result: { sessionId: 'sess-1' } } });
    render(<IntegratedAnalysisInputPage />);

    await submitWithFace();

    await waitFor(() => {
      expect(pushMock).toHaveBeenCalledWith('/analysis/integrated/result/sess-1');
    });
    expect(sessionStorage.getItem(PENDING_KEY)).toBeNull();
  });

  it('실패하면 마커를 남기지 않는다 (에러는 이미 화면에 보임)', async () => {
    stubFetch({ status: 504, jsonThrows: true });
    render(<IntegratedAnalysisInputPage />);

    await submitWithFace();

    await waitFor(() => expect(screen.getByTestId('integrated-submit-error')).toBeInTheDocument());
    expect(sessionStorage.getItem(PENDING_KEY)).toBeNull();
  });

  it('마커가 남은 채 재진입하면 복구 배너를 띄운다', () => {
    sessionStorage.setItem(PENDING_KEY, String(Date.now()));
    render(<IntegratedAnalysisInputPage />);

    expect(screen.getByTestId('mock-pending-banner')).toBeInTheDocument();
  });

  it('마커가 없으면 복구 배너를 띄우지 않는다', () => {
    render(<IntegratedAnalysisInputPage />);
    expect(screen.queryByTestId('mock-pending-banner')).not.toBeInTheDocument();
  });

  it('깨진 마커 값은 무시한다', () => {
    sessionStorage.setItem(PENDING_KEY, 'not-a-number');
    render(<IntegratedAnalysisInputPage />);
    expect(screen.queryByTestId('mock-pending-banner')).not.toBeInTheDocument();
  });
});

describe('IntegratedAnalysisInputPage — 사전 고지 문구', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    analysisCountValue = 0;
    sessionStorage.clear();
  });

  it('전신 사진·신체 정보가 모두 없으면 체형 스킵을 미리 알린다', () => {
    render(<IntegratedAnalysisInputPage />);

    expect(screen.getByTestId('body-skip-notice')).toHaveTextContent(
      '체형 분석은 이번에 건너뛰어요 (전신 사진 필요)'
    );
  });

  it('전신 사진을 올리면 체형 스킵 고지가 사라진다', () => {
    render(<IntegratedAnalysisInputPage />);

    fireEvent.click(screen.getByTestId('mock-set-body'));

    expect(screen.queryByTestId('body-skip-notice')).not.toBeInTheDocument();
  });

  it('복귀 사용자가 체형 축을 해제하면 스킵 고지를 띄우지 않는다', () => {
    analysisCountValue = 3;
    render(<IntegratedAnalysisInputPage />);

    fireEvent.click(screen.getByRole('button', { name: '체형' }));

    expect(screen.queryByTestId('body-skip-notice')).not.toBeInTheDocument();
  });

  it('소요 시간 안내는 서버 상한(60초) 기준으로 통일돼 있다', () => {
    render(<IntegratedAnalysisInputPage />);

    expect(screen.getByText(/분석은 1분이면 끝나요/)).toBeInTheDocument();
    expect(screen.queryByText(/약 2분/)).not.toBeInTheDocument();
  });
});
