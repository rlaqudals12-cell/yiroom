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
let analysisStatusLoading = false;
let analysisStatusError = false;
const refetchMock = vi.fn();

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
  useAnalysisStatus: () => ({
    analysisCount: analysisCountValue,
    isLoading: analysisStatusLoading,
    hasError: analysisStatusError,
    refetch: refetchMock,
  }),
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
  PendingAnalysisBanner: ({
    requestId,
    onAbandon,
  }: {
    requestId: string;
    onAbandon: () => void;
  }) => (
    <div data-testid="mock-pending-banner">
      {requestId}
      <button type="button" onClick={onAbandon}>
        mock-abandon
      </button>
    </div>
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
const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

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
    analysisStatusLoading = false;
    analysisStatusError = false;
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
    analysisStatusLoading = false;
    analysisStatusError = false;
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
    analysisStatusLoading = false;
    analysisStatusError = false;
    sessionStorage.clear();
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('제출 시 상관 ID 마커를 기록하고 분석 중 이탈 경고를 등록한다', async () => {
    const addListenerSpy = vi.spyOn(window, 'addEventListener');
    // 응답이 오지 않는 상태 = 분석 진행 중
    const fetchMock = vi.fn().mockReturnValue(new Promise(() => {}));
    vi.stubGlobal('fetch', fetchMock);
    render(<IntegratedAnalysisInputPage />);

    await submitWithFace();

    await waitFor(() => {
      expect(screen.getByTestId('integrated-submitting')).toBeInTheDocument();
    });
    const marker = sessionStorage.getItem(PENDING_KEY);
    expect(marker).toMatch(UUID_RE);
    // 같은 ID를 서버에도 보내야 복구 조회가 성립한다
    const body = JSON.parse(fetchMock.mock.calls[0][1].body);
    expect(body.clientRequestId).toBe(marker);
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

  it.each(['pending', 'failed'] as const)(
    '재사용된 %s 세션은 완료로 오인하지 않고 복구 마커를 유지한다',
    async (status) => {
      stubFetch({
        status: 200,
        json: {
          success: true,
          result: { sessionId: 'sess-existing', status, reused: true },
        },
      });
      render(<IntegratedAnalysisInputPage />);

      await submitWithFace();

      await waitFor(() => {
        expect(screen.getByTestId('mock-pending-banner')).toBeInTheDocument();
      });
      expect(pushMock).not.toHaveBeenCalled();
      expect(sessionStorage.getItem(PENDING_KEY)).toMatch(UUID_RE);
    }
  );

  // 회귀 방지(외부 리뷰 #3): 타임아웃·5xx·네트워크 예외는 서버에서 분석이 끝났을 수 있다.
  // 마커를 지우면 이미 저장된 결과로 돌아갈 길이 사라져 사용자가 5축을 다시 태운다.
  it('게이트웨이 타임아웃(504)에는 마커를 남긴다 — 서버에서 끝났을 수 있다', async () => {
    stubFetch({ status: 504, jsonThrows: true });
    render(<IntegratedAnalysisInputPage />);

    await submitWithFace();

    await waitFor(() => expect(screen.getByTestId('integrated-submit-error')).toBeInTheDocument());
    expect(sessionStorage.getItem(PENDING_KEY)).toMatch(UUID_RE);
  });

  it('500 서버 오류에도 마커를 남긴다', async () => {
    stubFetch({ status: 500, json: { success: false, error: { userMessage: '서버 오류' } } });
    render(<IntegratedAnalysisInputPage />);

    await submitWithFace();

    await waitFor(() => expect(screen.getByTestId('integrated-submit-error')).toBeInTheDocument());
    expect(sessionStorage.getItem(PENDING_KEY)).toMatch(UUID_RE);
  });

  it('네트워크 예외에도 마커를 남긴다', async () => {
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new TypeError('Failed to fetch')));
    render(<IntegratedAnalysisInputPage />);

    await submitWithFace();

    await waitFor(() => expect(screen.getByTestId('integrated-submit-error')).toBeInTheDocument());
    expect(sessionStorage.getItem(PENDING_KEY)).toMatch(UUID_RE);
  });

  it('서버가 확실히 거절한 429는 마커를 지운다 (분석이 시작조차 안 됨)', async () => {
    stubFetch({ status: 429, json: { error: '오늘 분석 횟수를 모두 사용했어요.' } });
    render(<IntegratedAnalysisInputPage />);

    await submitWithFace();

    await waitFor(() => expect(screen.getByTestId('integrated-submit-error')).toBeInTheDocument());
    expect(sessionStorage.getItem(PENDING_KEY)).toBeNull();
  });

  it('400 검증 실패도 마커를 지운다', async () => {
    stubFetch({ status: 400, json: { success: false, error: { userMessage: '입력 오류' } } });
    render(<IntegratedAnalysisInputPage />);

    await submitWithFace();

    await waitFor(() => expect(screen.getByTestId('integrated-submit-error')).toBeInTheDocument());
    expect(sessionStorage.getItem(PENDING_KEY)).toBeNull();
  });

  it('마커가 남은 채 재진입하면 복구 배너를 띄운다', () => {
    sessionStorage.setItem(PENDING_KEY, '11111111-2222-4333-8444-555555555555');
    render(<IntegratedAnalysisInputPage />);

    expect(screen.getByTestId('mock-pending-banner')).toHaveTextContent(
      '11111111-2222-4333-8444-555555555555'
    );
  });

  it('기존 요청 판정 전에는 재제출을 막고 명시적으로 포기한 뒤에만 새 ID를 만든다', async () => {
    const oldRequestId = '11111111-2222-4333-8444-555555555555';
    sessionStorage.setItem(PENDING_KEY, oldRequestId);
    const fetchMock = stubFetch({
      status: 200,
      json: { success: true, result: { sessionId: 'sess-new' } },
    });
    render(<IntegratedAnalysisInputPage />);
    fireEvent.click(screen.getByTestId('mock-set-face'));

    expect(screen.getByRole('button', { name: '내 정체성 알아보기' })).toBeDisabled();
    fireEvent.click(screen.getByRole('button', { name: 'mock-abandon' }));
    fireEvent.click(screen.getByRole('button', { name: '내 정체성 알아보기' }));

    await waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(1));
    const body = JSON.parse(fetchMock.mock.calls[0][1].body);
    expect(body.clientRequestId).not.toBe(oldRequestId);
  });

  it('타임아웃 뒤 같은 화면에서도 pending 요청을 유지해 즉시 재제출하지 못한다', async () => {
    stubFetch({ status: 504, jsonThrows: true });
    render(<IntegratedAnalysisInputPage />);

    await submitWithFace();

    await waitFor(() => expect(screen.getByTestId('mock-pending-banner')).toBeInTheDocument());
    expect(screen.getByRole('button', { name: '내 정체성 알아보기' })).toBeDisabled();
  });

  it('마커가 없으면 복구 배너를 띄우지 않는다', () => {
    render(<IntegratedAnalysisInputPage />);
    expect(screen.queryByTestId('mock-pending-banner')).not.toBeInTheDocument();
  });

  it('구버전(시각) 마커는 상관 ID가 없으므로 폐기한다', () => {
    sessionStorage.setItem(PENDING_KEY, String(Date.now()));
    render(<IntegratedAnalysisInputPage />);
    expect(screen.queryByTestId('mock-pending-banner')).not.toBeInTheDocument();
    expect(sessionStorage.getItem(PENDING_KEY)).toBeNull();
  });

  it('깨진 마커 값은 무시한다', () => {
    sessionStorage.setItem(PENDING_KEY, 'not-a-uuid');
    render(<IntegratedAnalysisInputPage />);
    expect(screen.queryByTestId('mock-pending-banner')).not.toBeInTheDocument();
  });
});

// 회귀 방지(외부 리뷰 #6): 이력이 확정되기 전 analysisCount는 0 — 복귀 사용자도 "신규"로
// 보여, 축 선택 없이 제출되면 mode 미전송 = 5축 전체 재분석(프로필 덮어쓰기)이 된다.
describe('IntegratedAnalysisInputPage — 분석 이력 확정 전 제출 차단', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    analysisCountValue = 0;
    analysisStatusLoading = false;
    analysisStatusError = false;
    sessionStorage.clear();
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('이력 조회 중에는 제출 버튼이 비활성화된다', () => {
    analysisStatusLoading = true;
    render(<IntegratedAnalysisInputPage />);

    fireEvent.click(screen.getByTestId('mock-set-face'));

    expect(screen.getByRole('button', { name: '내 정체성 알아보기' })).toBeDisabled();
  });

  it('이력 조회 중에는 제출해도 분석 요청이 나가지 않는다', async () => {
    analysisStatusLoading = true;
    const fetchMock = stubFetch({ status: 200, json: { success: true } });
    render(<IntegratedAnalysisInputPage />);

    await submitWithFace();

    // 확정 전이면 5축 전체 재분석(프로필 덮어쓰기)이 될 수 있으므로 요청 자체를 막는다
    await waitFor(() => {
      expect(screen.queryByTestId('integrated-submitting')).not.toBeInTheDocument();
    });
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('이력 조회 실패 시 재시도 UI를 띄우고 제출을 막는다', async () => {
    analysisStatusError = true;
    const fetchMock = stubFetch({ status: 200, json: { success: true } });
    render(<IntegratedAnalysisInputPage />);

    fireEvent.click(screen.getByTestId('mock-set-face'));
    expect(screen.getByTestId('analysis-status-error')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: '내 정체성 알아보기' })).toBeDisabled();

    fireEvent.click(screen.getByTestId('analysis-status-retry'));
    expect(refetchMock).toHaveBeenCalledTimes(1);
    expect(fetchMock).not.toHaveBeenCalled();
  });
});

describe('IntegratedAnalysisInputPage — 사전 고지 문구', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    analysisCountValue = 0;
    analysisStatusLoading = false;
    analysisStatusError = false;
    sessionStorage.clear();
  });

  it('전신 사진·신체 정보가 모두 없으면 체형 스킵을 미리 알린다', () => {
    render(<IntegratedAnalysisInputPage />);

    expect(screen.getByTestId('body-skip-notice')).toHaveTextContent(
      '체형 분석은 이번에 건너뛰어요. 전신 사진 또는 신체 정보가 필요해요.'
    );
    expect(screen.getByTestId('body-skip-notice')).not.toHaveTextContent('예시');
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
