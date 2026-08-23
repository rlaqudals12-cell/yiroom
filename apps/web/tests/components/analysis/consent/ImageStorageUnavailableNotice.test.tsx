import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import {
  getDrapingUnavailableMessage,
  getImageStorageUnavailableMessage,
  ImageStorageUnavailableNotice,
} from '@/components/analysis/consent/ImageStorageUnavailableNotice';

describe('ImageStorageUnavailableNotice', () => {
  it('확인된 미동의에만 재분석·개인정보 설정 동선을 제공한다', () => {
    render(
      <ImageStorageUnavailableNotice
        analysisHref="/analysis/personal-color"
        featureLabel="드레이핑 비교"
        reason="no_consent"
      />
    );

    expect(screen.getByRole('note')).toHaveTextContent(
      '사진 저장에 동의한 뒤 다시 분석하면 드레이핑 비교를 볼 수 있어요.'
    );
    expect(screen.getByRole('link', { name: '사진 저장 동의하고 다시 분석' })).toHaveAttribute(
      'href',
      '/analysis/personal-color'
    );
    expect(screen.getByRole('link', { name: '개인정보 설정' })).toHaveAttribute(
      'href',
      '/settings/privacy'
    );
  });

  it('파기 대기 상태에는 재동의를 막고 설정의 삭제 재시도 동선만 제공한다', () => {
    render(
      <ImageStorageUnavailableNotice
        analysisHref="/analysis/skin"
        featureLabel="사진 비교"
        reason="purge_pending"
      />
    );

    expect(screen.getByRole('note')).toHaveTextContent(
      '사진 저장 동의는 철회됐지만 일부 사진 삭제를 마치지 못했어요. 개인정보 설정에서 삭제를 다시 시도해 주세요.'
    );
    expect(
      screen.queryByRole('link', { name: '사진 저장 동의하고 다시 분석' })
    ).not.toBeInTheDocument();
    expect(
      screen.getByRole('link', { name: '개인정보 설정에서 사진 삭제 다시 시도' })
    ).toHaveAttribute('href', '/settings/privacy');
  });

  it.each(['no_consent', 'expired', 'purged', 'renewal_required'] as const)(
    '%s 비교 잠금에는 분석 기록이 쌓여야 한다는 전용 복구 문구를 적용한다',
    (reason) => {
      render(
        <ImageStorageUnavailableNotice
          analysisHref="/analysis/skin"
          analysisLinkLabel="사진 저장에 동의하고 새 분석 기록 만들기"
          consentRequiredMessage="사진 저장에 동의한 분석 기록이 쌓이면 사진 비교를 볼 수 있어요."
          featureLabel="사진 비교"
          reason={reason}
        />
      );

      expect(screen.getByRole('note')).toHaveTextContent(
        '사진 저장에 동의한 분석 기록이 쌓이면 사진 비교를 볼 수 있어요.'
      );
      expect(
        screen.getByRole('link', { name: '사진 저장에 동의하고 새 분석 기록 만들기' })
      ).toHaveAttribute('href', '/analysis/skin');
    }
  );

  it.each([
    ['loading', '사진 저장 상태를 확인하고 있어요.'],
    ['missing', '저장 사진이 없어 사진 비교를 표시하지 않았어요.'],
    ['unknown', '사진을 확인할 수 없어 사진 비교를 표시하지 않았어요.'],
    [
      'unsupported',
      '체형 분석의 새 사진 저장 선택은 현재 지원하지 않아요. 저장 사진을 확인할 수 없어 사진 비교는 표시하지 않았어요.',
    ],
  ] as const)('%s 원인은 중립 안내만 표시하고 동의 CTA를 숨긴다', (reason, message) => {
    render(
      <ImageStorageUnavailableNotice
        analysisHref="/analysis/body"
        featureLabel="사진 비교"
        reason={reason}
      />
    );

    expect(screen.getByRole('note')).toHaveTextContent(message);
    expect(
      screen.queryByRole('link', { name: '사진 저장 동의하고 다시 분석' })
    ).not.toBeInTheDocument();
    expect(screen.queryByRole('link', { name: '개인정보 설정' })).not.toBeInTheDocument();
  });

  it('미동의·사진 부재·보관 만료를 서로 다른 문구로 구분한다', () => {
    expect(getDrapingUnavailableMessage({ consentGiven: false })).toContain('동의한 뒤');
    expect(getDrapingUnavailableMessage({ consentGiven: true })).toBe(
      '저장 사진이 없어 드레이핑 비교를 표시하지 않았어요.'
    );
    expect(getDrapingUnavailableMessage({ consentGiven: true, wasPurged: true })).toContain(
      '파기되어'
    );
    expect(
      getImageStorageUnavailableMessage({ featureLabel: '사진 비교', reason: 'expired' })
    ).toContain('보관 기한이 지나');
  });
});
