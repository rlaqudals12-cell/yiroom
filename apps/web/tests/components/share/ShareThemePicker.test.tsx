/**
 * ShareThemePicker — 사진 옵트인 계약 테스트
 *
 * 프라이버시 계약: 공유 카드에 프로필 사진은 **기본 미포함**이며,
 * 사용자가 체크박스를 켤 때만 담긴다(통합 리포트 PersonaShareSection과 동일).
 *
 * setup.ts가 배럴(@/components/share)을 전역 모킹하므로 실제 구현 파일에서 직접 import한다.
 */

import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { ShareThemePicker } from '@/components/share/ShareThemePicker';

describe('ShareThemePicker', () => {
  describe('사진 옵트인 (프라이버시 기본값)', () => {
    it('onPhotoOptInChange가 없으면 체크박스를 노출하지 않는다', () => {
      render(<ShareThemePicker value="default" onChange={vi.fn()} />);

      expect(screen.queryByTestId('share-photo-optin')).not.toBeInTheDocument();
    });

    it('체크박스는 기본 OFF 상태로 렌더된다', () => {
      render(<ShareThemePicker value="default" onChange={vi.fn()} onPhotoOptInChange={vi.fn()} />);

      expect(screen.getByTestId('share-photo-optin')).not.toBeChecked();
    });

    it('photoOptIn=true를 주면 체크된 상태로 렌더된다', () => {
      render(
        <ShareThemePicker
          value="default"
          onChange={vi.fn()}
          photoOptIn
          onPhotoOptInChange={vi.fn()}
        />
      );

      expect(screen.getByTestId('share-photo-optin')).toBeChecked();
    });

    it('체크 시 onPhotoOptInChange(true)를 호출한다', () => {
      const onPhotoOptInChange = vi.fn();
      render(
        <ShareThemePicker
          value="default"
          onChange={vi.fn()}
          onPhotoOptInChange={onPhotoOptInChange}
        />
      );

      fireEvent.click(screen.getByTestId('share-photo-optin'));
      expect(onPhotoOptInChange).toHaveBeenCalledWith(true);
    });

    it('해제 시 onPhotoOptInChange(false)를 호출한다', () => {
      const onPhotoOptInChange = vi.fn();
      render(
        <ShareThemePicker
          value="default"
          onChange={vi.fn()}
          photoOptIn
          onPhotoOptInChange={onPhotoOptInChange}
        />
      );

      fireEvent.click(screen.getByTestId('share-photo-optin'));
      expect(onPhotoOptInChange).toHaveBeenCalledWith(false);
    });

    it('사진 고지 문구를 함께 노출한다 (i18n 키: share.photoOptInNotice)', () => {
      render(<ShareThemePicker value="default" onChange={vi.fn()} onPhotoOptInChange={vi.fn()} />);

      // next-intl mock은 키를 그대로 반환한다
      expect(screen.getByText('photoOptIn')).toBeInTheDocument();
      expect(screen.getByText('photoOptInNotice')).toBeInTheDocument();
    });
  });

  describe('기존 테마/포맷 계약 (회귀)', () => {
    it('테마 선택 라디오가 렌더된다', () => {
      render(<ShareThemePicker value="default" onChange={vi.fn()} />);

      expect(screen.getByTestId('share-theme-picker')).toBeInTheDocument();
      expect(screen.getByRole('radiogroup', { name: '공유 카드 테마 선택' })).toBeInTheDocument();
    });

    it('테마 클릭 시 onChange를 호출한다', () => {
      const onChange = vi.fn();
      render(<ShareThemePicker value="default" onChange={onChange} />);

      fireEvent.click(screen.getByRole('radio', { name: '미니멀' }));
      expect(onChange).toHaveBeenCalledWith('minimal');
    });

    it('onFormatChange가 있으면 포맷 토글이 노출된다', () => {
      const onFormatChange = vi.fn();
      render(
        <ShareThemePicker value="default" onChange={vi.fn()} onFormatChange={onFormatChange} />
      );

      // 접근성 이름 = 아이콘 mock 텍스트 + 라벨이라 부분 일치로 찾는다
      fireEvent.click(screen.getByRole('radio', { name: /스토리/ }));
      expect(onFormatChange).toHaveBeenCalledWith('9:16');
    });
  });
});
