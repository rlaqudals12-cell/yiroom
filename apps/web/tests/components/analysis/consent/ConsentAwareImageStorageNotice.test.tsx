import { render, screen, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import {
  applyStorageChoiceSupport,
  ConsentAwareImageStorageNotice,
  resolveImageStorageUnavailableReason,
  useImageStorageUnavailableReason,
} from '@/components/analysis/consent/ConsentAwareImageStorageNotice';

const FUTURE = '2999-01-01T00:00:00.000Z';

describe('ConsentAwareImageStorageNotice', () => {
  const fetchMock = vi.fn();

  beforeEach(() => {
    fetchMock.mockReset();
    vi.stubGlobal('fetch', fetchMock);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('동의 레코드가 없을 때만 동의 복구 링크를 연다', async () => {
    fetchMock.mockResolvedValue(new Response(JSON.stringify({ consent: null }), { status: 200 }));

    render(
      <ConsentAwareImageStorageNotice
        analysisHref="/analysis/skin"
        analysisType="skin"
        featureLabel="사진 비교"
      />
    );

    expect(await screen.findByText(/사진 저장에 동의한 뒤/)).toBeInTheDocument();
    expect(screen.getByRole('link', { name: '개인정보 설정' })).toBeInTheDocument();
  });

  it('철회 후 파기 대기 상태에는 재동의 대신 설정의 삭제 재시도만 안내한다', async () => {
    fetchMock.mockResolvedValue(
      new Response(
        JSON.stringify({
          consent: {
            consent_given: false,
            consent_version: 'v1.0',
            retention_until: FUTURE,
            withdrawal_at: '2026-08-23T00:00:00.000Z',
          },
        }),
        { status: 200 }
      )
    );

    render(
      <ConsentAwareImageStorageNotice
        analysisHref="/analysis/skin"
        analysisType="skin"
        featureLabel="사진 비교"
      />
    );

    expect(
      await screen.findByText(
        '사진 저장 동의는 철회됐지만 일부 사진 삭제를 마치지 못했어요. 개인정보 설정에서 삭제를 다시 시도해 주세요.'
      )
    ).toBeInTheDocument();
    expect(
      screen.queryByRole('link', { name: '사진 저장 동의하고 다시 분석' })
    ).not.toBeInTheDocument();
    expect(
      screen.getByRole('link', { name: '개인정보 설정에서 사진 삭제 다시 시도' })
    ).toHaveAttribute('href', '/settings/privacy');
  });

  it('DELETE 완료 뒤 재조정 전에는 실패로 오표현하지 않고 설정 상태 확인만 안내한다', async () => {
    fetchMock.mockResolvedValue(
      new Response(
        JSON.stringify({
          consent: {
            consent_given: false,
            consent_version: 'v1.0',
            retention_until: null,
            withdrawal_at: '2026-08-23T00:00:00.000Z',
            cleanup_reconciled_at: null,
          },
        }),
        { status: 200 }
      )
    );

    render(
      <ConsentAwareImageStorageNotice
        analysisHref="/analysis/skin"
        analysisType="skin"
        featureLabel="사진 비교"
      />
    );

    expect(await screen.findByText(/사진 삭제 확인을 마무리하고 있어요/)).toBeInTheDocument();
    expect(
      screen.queryByRole('link', { name: '사진 저장에 동의하고 다시 분석' })
    ).not.toBeInTheDocument();
    expect(screen.getByRole('link', { name: '개인정보 설정에서 상태 확인' })).toHaveAttribute(
      'href',
      '/settings/privacy'
    );
  });

  it('유효한 동의인데 사진이 없으면 원인 중립 안내만 남긴다', async () => {
    fetchMock.mockResolvedValue(
      new Response(
        JSON.stringify({
          consent: {
            consent_given: true,
            consent_version: 'v1.0',
            retention_until: FUTURE,
          },
        }),
        { status: 200 }
      )
    );

    render(
      <ConsentAwareImageStorageNotice
        analysisHref="/analysis/hair"
        analysisType="hair"
        featureLabel="사진 비교"
      />
    );

    expect(
      await screen.findByText('저장 사진이 없어 사진 비교를 표시하지 않았어요.')
    ).toBeInTheDocument();
    expect(screen.queryByRole('link', { name: '개인정보 설정' })).not.toBeInTheDocument();
  });

  it('동의 조회 실패를 미동의로 바꾸지 않는다', async () => {
    fetchMock.mockResolvedValue(new Response(null, { status: 500 }));

    render(
      <ConsentAwareImageStorageNotice
        analysisHref="/analysis/makeup"
        analysisType="makeup"
        featureLabel="사진 비교"
      />
    );

    await waitFor(() => expect(fetchMock).toHaveBeenCalled());
    expect(
      screen.getByText('사진을 확인할 수 없어 사진 비교를 표시하지 않았어요.')
    ).toBeInTheDocument();
    expect(screen.queryByRole('link', { name: '개인정보 설정' })).not.toBeInTheDocument();
  });

  it('체형도 기존 행을 조회하되 미동의면 새 저장 선택 미지원으로 안내한다', async () => {
    fetchMock.mockResolvedValue(new Response(JSON.stringify({ consent: null }), { status: 200 }));

    render(
      <ConsentAwareImageStorageNotice
        analysisHref="/analysis/body"
        analysisType="body"
        featureLabel="사진 비교"
        storageChoiceSupported={false}
      />
    );

    await waitFor(() =>
      expect(fetchMock).toHaveBeenCalledWith('/api/consent?analysisType=body', {
        signal: expect.any(AbortSignal),
      })
    );
    expect(
      await screen.findByText(/체형 분석의 새 사진 저장 선택은 현재 지원하지 않아요/)
    ).toBeInTheDocument();
    expect(
      screen.queryByRole('link', { name: '사진 저장 동의하고 다시 분석' })
    ).not.toBeInTheDocument();
  });

  it('체형의 기존 활성 동의도 새 저장 선택 미지원 안내로 낮춘다', async () => {
    fetchMock.mockResolvedValue(
      new Response(
        JSON.stringify({
          consent: {
            consent_given: true,
            consent_version: 'v1.0',
            retention_until: FUTURE,
          },
        }),
        { status: 200 }
      )
    );

    render(
      <ConsentAwareImageStorageNotice
        analysisHref="/analysis/body"
        analysisType="body"
        featureLabel="사진 비교"
        storageChoiceSupported={false}
      />
    );

    expect(
      await screen.findByText(/체형 분석의 새 사진 저장 선택은 현재 지원하지 않아요/)
    ).toBeInTheDocument();
    expect(
      screen.queryByRole('link', { name: '사진 저장 동의하고 다시 분석' })
    ).not.toBeInTheDocument();
  });

  it.each([
    {
      consent: {
        consent_given: true,
        consent_version: 'v1.0',
        retention_until: '2026-08-22T00:00:00.000Z',
      },
      stateLabel: '만료',
    },
    {
      consent: {
        consent_given: true,
        consent_version: 'v0.9',
        retention_until: FUTURE,
      },
      stateLabel: '구버전',
    },
  ])(
    '체형의 $stateLabel 동의도 존재하지 않는 재동의 CTA 없이 미지원으로 낮춘다',
    async ({ consent }) => {
      fetchMock.mockResolvedValue(
        new Response(JSON.stringify({ consent }), {
          status: 200,
        })
      );

      render(
        <ConsentAwareImageStorageNotice
          analysisHref="/analysis/body"
          analysisType="body"
          featureLabel="사진 비교"
          storageChoiceSupported={false}
        />
      );

      expect(
        await screen.findByText(/체형 분석의 새 사진 저장 선택은 현재 지원하지 않아요/)
      ).toBeInTheDocument();
      expect(screen.queryByRole('link')).not.toBeInTheDocument();
    }
  );

  it('체형의 기존 purge pending 행은 미지원으로 덮지 않고 삭제 재시도를 연다', async () => {
    fetchMock.mockResolvedValue(
      new Response(
        JSON.stringify({
          consent: {
            consent_given: false,
            consent_version: 'v1.0',
            retention_until: FUTURE,
            withdrawal_at: '2026-08-23T00:00:00.000Z',
          },
        }),
        { status: 200 }
      )
    );

    render(
      <ConsentAwareImageStorageNotice
        analysisHref="/analysis/body"
        analysisType="body"
        featureLabel="사진 비교"
        storageChoiceSupported={false}
      />
    );

    expect(await screen.findByText(/일부 사진 삭제를 마치지 못했어요/)).toBeInTheDocument();
    expect(
      screen.getByRole('link', { name: '개인정보 설정에서 사진 삭제 다시 시도' })
    ).toHaveAttribute('href', '/settings/privacy');
    expect(screen.queryByText(/새 사진 저장 선택은 현재 지원하지 않아요/)).not.toBeInTheDocument();
  });

  it('체형의 기존 reconciliation pending 행은 설정 상태 확인 동선을 유지한다', async () => {
    fetchMock.mockResolvedValue(
      new Response(
        JSON.stringify({
          consent: {
            consent_given: false,
            consent_version: 'v1.0',
            retention_until: null,
            withdrawal_at: '2026-08-23T00:00:00.000Z',
            cleanup_reconciled_at: null,
          },
        }),
        { status: 200 }
      )
    );

    render(
      <ConsentAwareImageStorageNotice
        analysisHref="/analysis/body"
        analysisType="body"
        featureLabel="사진 비교"
        storageChoiceSupported={false}
      />
    );

    expect(await screen.findByText(/사진 삭제 확인을 마무리하고 있어요/)).toBeInTheDocument();
    expect(screen.getByRole('link', { name: '개인정보 설정에서 상태 확인' })).toHaveAttribute(
      'href',
      '/settings/privacy'
    );
    expect(screen.queryByText(/새 사진 저장 선택은 현재 지원하지 않아요/)).not.toBeInTheDocument();
  });

  it('새 저장 미지원은 조회·파기 중간 상태만 보존하고 나머지는 모두 미지원으로 낮춘다', () => {
    expect(applyStorageChoiceSupport('missing', false)).toBe('unsupported');
    expect(applyStorageChoiceSupport('no_consent', false)).toBe('unsupported');
    expect(applyStorageChoiceSupport('expired', false)).toBe('unsupported');
    expect(applyStorageChoiceSupport('renewal_required', false)).toBe('unsupported');
    expect(applyStorageChoiceSupport('purged', false)).toBe('unsupported');
    expect(applyStorageChoiceSupport('purge_pending', false)).toBe('purge_pending');
    expect(applyStorageChoiceSupport('reconciliation_pending', false)).toBe(
      'reconciliation_pending'
    );
    expect(applyStorageChoiceSupport('loading', false)).toBe('loading');
    expect(applyStorageChoiceSupport('unknown', false)).toBe('unknown');
    expect(applyStorageChoiceSupport('missing', true)).toBe('missing');
  });

  it('만료·구버전·유효 동의를 각각 판정한다', () => {
    const now = new Date('2026-08-23T00:00:00.000Z');
    expect(
      resolveImageStorageUnavailableReason(
        { consent_given: true, consent_version: 'v1.0', retention_until: '2026-08-22T00:00:00Z' },
        now
      )
    ).toBe('expired');
    expect(
      resolveImageStorageUnavailableReason(
        { consent_given: true, consent_version: 'v0.9', retention_until: FUTURE },
        now
      )
    ).toBe('renewal_required');
    expect(
      resolveImageStorageUnavailableReason(
        { consent_given: true, consent_version: 'v1.0', retention_until: FUTURE },
        now
      )
    ).toBe('missing');
    expect(
      resolveImageStorageUnavailableReason(
        { consent_given: false, consent_version: 'v1.0', retention_until: '2026-08-22T00:00:00Z' },
        now
      )
    ).toBe('no_consent');
    expect(
      resolveImageStorageUnavailableReason(
        {
          consent_given: false,
          consent_version: 'v1.0',
          retention_until: FUTURE,
          withdrawal_at: '2026-08-23T00:00:00.000Z',
        },
        now
      )
    ).toBe('purge_pending');
    expect(
      resolveImageStorageUnavailableReason(
        {
          consent_given: false,
          consent_version: 'v1.0',
          retention_until: null,
          withdrawal_at: '2026-08-23T00:00:00.000Z',
          cleanup_reconciled_at: null,
        },
        now
      )
    ).toBe('reconciliation_pending');
  });

  it('체형에서 다른 축으로 바뀌는 첫 렌더에 체형 미지원 사유가 남지 않는다', () => {
    const observed: string[] = [];

    function Probe({
      analysisType,
      storageChoiceSupported,
    }: {
      analysisType: 'body' | 'skin';
      storageChoiceSupported: boolean;
    }) {
      const reason = useImageStorageUnavailableReason({
        analysisType,
        storageChoiceSupported,
      });
      observed.push(`${analysisType}:${reason}`);
      return <output>{reason}</output>;
    }

    fetchMock.mockReturnValue(new Promise(() => {}));
    const { rerender } = render(<Probe analysisType="body" storageChoiceSupported={false} />);
    observed.length = 0;

    rerender(<Probe analysisType="skin" storageChoiceSupported />);

    expect(observed[0]).toBe('skin:loading');
    expect(screen.getByText('loading')).toBeInTheDocument();
  });
});
