/**
 * 옷 단건 등록 — 자동 분류 실패 고지·기본값 자동 통과 차단 회귀 테스트
 *
 * 배경(수리 전):
 *  - 분류 실패 배지가 업로더 내부에만 있어, 상세 폼으로 넘어가는 순간 언마운트됐다
 *    → "자동 분류 실패" 안내를 사용자가 볼 수 있는 시간이 사실상 0.
 *  - 카테고리 기본값이 '상의'로 미리 선택돼 있어, 실패해도 확인 없이 저장되면
 *    옷장에 잘못된 분류가 그대로 남았다(코디 조립에 그대로 쓰인다).
 *  - 업로드 화면이 "배경 제거"를 암시했으나 실제로는 원본이 저장된다.
 */
import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import type { UploadResult } from '@/components/inventory';

const pushMock = vi.fn();
vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: pushMock, back: vi.fn() }),
}));

// 업로더는 파일 디코딩(jsdom 미지원)에 의존하므로, 업로드 결과만 주입하는 스텁으로 대체.
// 이 테스트의 관심사는 "부모가 결과를 어떻게 다루는가"다.
const uploadResult: { current: UploadResult } = {
  current: {
    originalUrl: 'data:image/png;base64,orig',
    processedUrl: 'data:image/png;base64,proc',
    classifyFailed: true,
  },
};

vi.mock('@/components/inventory', () => ({
  ItemUploader: ({ onUploadComplete }: { onUploadComplete: (r: UploadResult) => void }) =>
    React.createElement(
      'button',
      { 'data-testid': 'stub-upload', onClick: () => onUploadComplete(uploadResult.current) },
      '업로드'
    ),
}));

import AddClothingPage from '@/app/(main)/closet/add/page';

describe('옷 등록 — 업로드 단계 고지', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    uploadResult.current = {
      originalUrl: 'data:image/png;base64,orig',
      processedUrl: 'data:image/png;base64,proc',
      classifyFailed: true,
    };
  });

  it('촬영 가이드와 저장 방식을 정직하게 안내한다 (배경 제거 암시 없음)', () => {
    render(<AddClothingPage />);

    expect(screen.getByTestId('shot-guide')).toHaveTextContent('옷 한 벌만 나오게 찍어주세요');
    expect(screen.getByTestId('save-mode-notice')).toHaveTextContent('원본 사진 그대로 저장돼요');
    expect(document.body.textContent).not.toContain('배경 제거');
  });
});

describe('옷 등록 — 자동 분류 실패 처리', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    uploadResult.current = {
      originalUrl: 'data:image/png;base64,orig',
      processedUrl: 'data:image/png;base64,proc',
      classifyFailed: true,
    };
  });

  it('분류 실패 안내가 상세 폼에서도 계속 보인다', async () => {
    render(<AddClothingPage />);

    fireEvent.click(screen.getByTestId('stub-upload'));

    await waitFor(() => {
      expect(screen.getByTestId('classify-failed-banner')).toBeInTheDocument();
    });
    expect(screen.getByTestId('classify-failed-banner')).toHaveTextContent('직접 확인해주세요');
  });

  it('카테고리를 미리 선택해두지 않는다 (무고지 기본값 저장 방지)', async () => {
    render(<AddClothingPage />);

    fireEvent.click(screen.getByTestId('stub-upload'));

    await waitFor(() => {
      expect(screen.getByTestId('category-select')).toBeInTheDocument();
    });
    // 사용자가 고르기 전에는 어떤 카테고리도 선택돼 있지 않다
    expect(screen.getByTestId('category-select')).toHaveTextContent('카테고리를 선택해주세요');
    expect(screen.getByTestId('category-select')).not.toHaveTextContent('상의');
  });

  it('카테고리 미선택 상태에서는 저장할 수 없다', async () => {
    render(<AddClothingPage />);

    fireEvent.click(screen.getByTestId('stub-upload'));

    const nameInput = await screen.findByLabelText('이름');
    fireEvent.change(nameInput, { target: { value: '흰 셔츠' } });

    const saveButton = screen.getByRole('button', { name: /저장하기/ });
    expect(saveButton).toBeDisabled();
  });

  it('분류가 성공하면 실패 배너를 띄우지 않는다', async () => {
    uploadResult.current = {
      originalUrl: 'data:image/png;base64,orig',
      processedUrl: 'data:image/png;base64,proc',
      classifyFailed: false,
      classification: {
        category: 'bottom',
        subCategory: '청바지',
        suggestedName: '연청 청바지',
        colors: ['블루'],
        confidence: 0.9,
      },
    };

    render(<AddClothingPage />);
    fireEvent.click(screen.getByTestId('stub-upload'));

    await waitFor(() => {
      expect(screen.getByTestId('category-select')).toBeInTheDocument();
    });
    expect(screen.queryByTestId('classify-failed-banner')).not.toBeInTheDocument();
    // AI가 실제로 판정한 분류는 그대로 채운다
    expect(screen.getByTestId('category-select')).toHaveTextContent('하의');
  });
});
