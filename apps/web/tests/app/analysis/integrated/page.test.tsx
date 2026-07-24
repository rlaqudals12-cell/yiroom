/**
 * 통합 분석 입력 페이지 — 재분석 0축 가드 테스트
 *
 * 복귀 사용자가 축을 전부 해제한 채 제출하면 mode 미전송 → 의도치 않은 'full'
 * 5축 전체 재분석(프로필 덮어쓰기 + Gemini 5콜)이 되던 버그의 회귀 방지.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
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
  }: {
    onFaceImageChange: (v: string | null) => void;
  }) => (
    <button
      type="button"
      data-testid="mock-set-face"
      onClick={() => onFaceImageChange('data:image/jpeg;base64,face')}
    >
      set-face
    </button>
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
