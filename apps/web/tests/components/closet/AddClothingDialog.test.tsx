/**
 * 옷 추가 다이얼로그 — AI 자동 분류 폴백 정직 처리 테스트
 *
 * 배경: classify API가 폴백 자리표시자를 표식 없이 200으로 돌려주면, 다이얼로그는
 * 그것을 진짜 판정처럼 폼에 자동으로 채우고 'AI' 배지까지 붙였다(지어낸 분류를
 * 사용자가 확인 없이 저장하게 되는 경로). 이제 usedFallback 표식을 보고
 * 자동 채우기를 멈추고 직접 입력을 요청한다.
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { AddClothingDialog } from '@/components/closet/AddClothingDialog';

/** 서버 폴백 자리표시자 (classify route의 generateMockClassification과 동일 형상) */
const FALLBACK_RESPONSE = {
  category: 'top',
  subCategory: '티셔츠',
  suggestedName: '캐주얼 티셔츠',
  colors: ['화이트'],
  pattern: 'solid',
  seasons: [],
  occasions: [],
  confidence: 0.5,
  usedFallback: true,
};

const REAL_RESPONSE = {
  category: 'outer',
  subCategory: '트렌치코트',
  suggestedName: '베이지 트렌치코트',
  colors: ['베이지'],
  pattern: 'solid',
  seasons: ['spring'],
  occasions: ['casual'],
  confidence: 0.93,
  usedFallback: false,
};

function mockClassify(response: Record<string, unknown>, ok = true) {
  const fetchMock = vi.fn(async () => ({ ok, json: async () => response }) as Response);
  global.fetch = fetchMock as unknown as typeof fetch;
  return fetchMock;
}

function selectFile() {
  const input = document.querySelector('input[type="file"]') as HTMLInputElement;
  expect(input).toBeTruthy();
  fireEvent.change(input, {
    target: { files: [new File(['x'], 'a.png', { type: 'image/png' })] },
  });
}

function renderDialog() {
  render(<AddClothingDialog open onOpenChange={() => {}} onSave={vi.fn()} />);
}

describe('AddClothingDialog — 분류 폴백 정직 처리', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('폴백 응답이면 자동 채우기 대신 직접 입력을 요청한다', async () => {
    mockClassify(FALLBACK_RESPONSE);
    renderDialog();
    selectFile();

    await waitFor(() => {
      expect(screen.getByTestId('classify-fallback-notice')).toBeInTheDocument();
    });
    expect(screen.getByTestId('classify-fallback-notice')).toHaveTextContent(
      '자동 분류에 실패했어요'
    );

    // 지어낸 값이 폼에 들어가지 않는다
    expect(screen.getByLabelText('이름')).toHaveValue('');
    // 'AI' 배지는 실제 판정일 때만
    expect(screen.queryByText('AI')).not.toBeInTheDocument();
  });

  it('classify 응답이 실패(non-ok)여도 같은 안내로 합류한다', async () => {
    mockClassify({}, false);
    renderDialog();
    selectFile();

    await waitFor(() => {
      expect(screen.getByTestId('classify-fallback-notice')).toBeInTheDocument();
    });
    expect(screen.getByLabelText('이름')).toHaveValue('');
  });

  it('실제 AI 판정이면 폼을 채우고 AI 배지를 붙인다', async () => {
    mockClassify(REAL_RESPONSE);
    renderDialog();
    selectFile();

    await waitFor(() => {
      expect(screen.getByLabelText('이름')).toHaveValue('베이지 트렌치코트');
    });
    expect(screen.queryByTestId('classify-fallback-notice')).not.toBeInTheDocument();
    expect(screen.getByText('AI')).toBeInTheDocument();
  });
});
