import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { IntegratedImageStorageNotice } from '@/app/(main)/analysis/integrated/result/[sessionId]/_components/IntegratedImageStorageNotice';

describe('IntegratedImageStorageNotice', () => {
  it('저장 미동의면 드레이핑 복구 동선을 표시한다', () => {
    render(<IntegratedImageStorageNotice consentGiven={false} wasPurged={false} />);

    expect(screen.getByText(/사진 저장에 동의한 뒤/)).toBeInTheDocument();
    expect(screen.getByRole('link', { name: '사진 저장 동의하고 다시 분석' })).toHaveAttribute(
      'href',
      '/analysis/integrated'
    );
  });

  it('보관 사진이 파기됐으면 만료 원인을 우선 표시한다', () => {
    render(<IntegratedImageStorageNotice consentGiven wasPurged />);

    expect(
      screen.getByText('저장 사진이 파기되어 드레이핑 비교를 표시하지 않았어요.')
    ).toBeInTheDocument();
  });

  it('동의는 유효하지만 사진이 없으면 동의 CTA를 노출하지 않는다', () => {
    render(<IntegratedImageStorageNotice consentGiven wasPurged={false} />);

    expect(
      screen.getByText('저장 사진이 없어 드레이핑 비교를 표시하지 않았어요.')
    ).toBeInTheDocument();
    expect(screen.queryByRole('link', { name: '개인정보 설정' })).not.toBeInTheDocument();
  });

  it('레거시 회차처럼 동의 상태를 알 수 없으면 미동의로 단정하지 않는다', () => {
    render(<IntegratedImageStorageNotice consentGiven={null} wasPurged={false} />);

    expect(
      screen.getByText('사진을 확인할 수 없어 드레이핑 비교를 표시하지 않았어요.')
    ).toBeInTheDocument();
    expect(screen.queryByRole('link', { name: '개인정보 설정' })).not.toBeInTheDocument();
  });

  it('선택 저장 실패는 분석 성공과 사진 기능 비활성 상태를 함께 고지한다', () => {
    render(
      <IntegratedImageStorageNotice consentGiven wasPurged={false} storageFailure="upload_failed" />
    );

    expect(
      screen.getByText(
        '사진 저장에 실패했지만 분석은 완료됐어요. 이번 결과에서는 드레이핑 비교를 표시하지 않았어요.'
      )
    ).toBeInTheDocument();
  });

  it('회차 미동의는 생체정보 철회로 오표시하지 않고 저장 동의 동선을 유지한다', () => {
    render(
      <IntegratedImageStorageNotice
        consentGiven={false}
        wasPurged={false}
        accessState="no_session_consent"
      />
    );

    expect(screen.getByRole('note')).toHaveTextContent(
      '사진 저장에 동의한 뒤 다시 분석하면 드레이핑 비교를 볼 수 있어요.'
    );
    expect(screen.queryByText(/생체정보 동의가 철회/)).not.toBeInTheDocument();
  });

  it('전역 생체정보 철회는 파기 대기와 분리해 고지한다', () => {
    render(
      <IntegratedImageStorageNotice
        consentGiven
        wasPurged={false}
        accessState="biometric_revoked"
      />
    );

    expect(screen.getByRole('note')).toHaveTextContent(
      '생체정보 동의가 철회되어 저장 사진을 표시하지 않았어요.'
    );
  });

  it('파기 대기에는 재동의 CTA 없이 설정의 삭제 재시도만 제공한다', () => {
    render(
      <IntegratedImageStorageNotice consentGiven wasPurged={false} accessState="purge_pending" />
    );

    expect(screen.getByRole('note')).toHaveTextContent(
      '사진 저장 동의는 철회됐지만 일부 사진 삭제를 마치지 못했어요.'
    );
    expect(
      screen.queryByRole('link', { name: '사진 저장 동의하고 다시 분석' })
    ).not.toBeInTheDocument();
    expect(
      screen.getByRole('link', { name: '개인정보 설정에서 사진 삭제 다시 시도' })
    ).toHaveAttribute('href', '/settings/privacy');
  });
});
