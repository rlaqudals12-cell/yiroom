import { render, screen, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { AnalysisCompareImageNotice } from '@/components/analysis/consent/AnalysisCompareImageNotice';

describe('AnalysisCompareImageNotice', () => {
  const fetchMock = vi.fn();

  beforeEach(() => {
    fetchMock.mockReset();
    vi.stubGlobal('fetch', fetchMock);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('두 사진이 모두 있으면 안내와 동의 조회를 생략한다', () => {
    render(
      <AnalysisCompareImageNotice
        afterImageUrl="https://example.com/after.jpg"
        analysisType="skin"
        beforeImageUrl="https://example.com/before.jpg"
      />
    );

    expect(screen.queryByRole('note')).not.toBeInTheDocument();
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it.each(['skin', 'personal-color', 'hair', 'makeup'] as const)(
    '%s 비교에서 사진 부재와 미동의를 실제 동의 조회로 구분한다',
    async (analysisType) => {
      fetchMock.mockResolvedValue(new Response(JSON.stringify({ consent: null }), { status: 200 }));

      render(<AnalysisCompareImageNotice analysisType={analysisType} />);

      await waitFor(() =>
        expect(fetchMock).toHaveBeenCalledWith(`/api/consent?analysisType=${analysisType}`, {
          signal: expect.any(AbortSignal),
        })
      );
      expect(
        await screen.findByText('사진 저장에 동의한 분석 기록이 쌓이면 사진 비교를 볼 수 있어요.')
      ).toBeInTheDocument();
      expect(
        screen.getByRole('link', { name: '사진 저장에 동의하고 새 분석 기록 만들기' })
      ).toHaveAttribute('href', `/analysis/${analysisType}`);
    }
  );

  it('체형 비교도 동의 상태를 조회하고 미동의면 미지원 고지만 남긴다', async () => {
    fetchMock.mockResolvedValue(new Response(JSON.stringify({ consent: null }), { status: 200 }));

    render(<AnalysisCompareImageNotice analysisType="body" />);

    await waitFor(() =>
      expect(fetchMock).toHaveBeenCalledWith('/api/consent?analysisType=body', {
        signal: expect.any(AbortSignal),
      })
    );
    expect(
      await screen.findByText(/체형 분석의 새 사진 저장 선택은 현재 지원하지 않아요/)
    ).toBeInTheDocument();
    expect(
      screen.queryByRole('link', { name: '사진 저장에 동의하고 새 분석 기록 만들기' })
    ).not.toBeInTheDocument();
  });

  it('체형 비교의 기존 파기 대기 행은 미지원으로 덮지 않고 설정 재시도를 연다', async () => {
    fetchMock.mockResolvedValue(
      new Response(
        JSON.stringify({
          consent: {
            consent_given: false,
            consent_version: 'v1.0',
            retention_until: '2999-01-01T00:00:00.000Z',
            withdrawal_at: '2026-08-23T00:00:00.000Z',
          },
        }),
        { status: 200 }
      )
    );

    render(<AnalysisCompareImageNotice analysisType="body" />);

    expect(await screen.findByText(/일부 사진 삭제를 마치지 못했어요/)).toBeInTheDocument();
    expect(
      screen.getByRole('link', { name: '개인정보 설정에서 사진 삭제 다시 시도' })
    ).toHaveAttribute('href', '/settings/privacy');
    expect(screen.queryByText(/새 사진 저장 선택은 현재 지원하지 않아요/)).not.toBeInTheDocument();
  });
});
