import { describe, it, expect, vi, beforeEach } from 'vitest';
import { generateQRCode, getQRUrl } from '@/lib/qr/generator';

// Mock qrcode 라이브러리
vi.mock('qrcode', () => ({
  default: {
    toDataURL: vi.fn().mockResolvedValue('data:image/png;base64,mockQRCode'),
    toCanvas: vi.fn().mockResolvedValue(undefined),
  },
}));

describe('QR Generator', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('generateQRCode', () => {
    it('앱 다운로드 QR 코드를 생성한다', async () => {
      const result = await generateQRCode({
        type: 'app_download',
        data: { medium: 'poster' },
      });

      expect(result).toBe('data:image/png;base64,mockQRCode');
    });

    it('친구 초대 QR 코드를 생성한다', async () => {
      const result = await generateQRCode({
        type: 'referral',
        data: { referralCode: 'ABC123' },
      });

      expect(result).toBe('data:image/png;base64,mockQRCode');
    });

    it('결과 공유 QR 코드를 생성한다', async () => {
      const result = await generateQRCode({
        type: 'result_share',
        data: { resultType: 'skin', resultId: '123' },
      });

      expect(result).toBe('data:image/png;base64,mockQRCode');
    });

    it('커스텀 사이즈를 적용한다', async () => {
      const QRCode = await import('qrcode');

      await generateQRCode({
        type: 'app_download',
        data: { medium: 'card' },
        size: 512,
      });

      expect(QRCode.default.toDataURL).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({ width: 512 })
      );
    });
  });

  describe('getQRUrl', () => {
    it('앱 다운로드 URL을 생성한다', () => {
      const url = getQRUrl('app_download', { medium: 'poster' });
      expect(url).toContain('/download');
      expect(url).toContain('utm_source=qr');
      expect(url).toContain('utm_medium=poster');
    });

    it('친구 초대 URL을 생성한다', () => {
      const url = getQRUrl('referral', { referralCode: 'ABC123' });
      expect(url).toContain('/invite/ABC123');
    });

    it('결과 공유 URL을 생성한다', () => {
      const url = getQRUrl('result_share', { resultType: 'skin', resultId: '456' });
      expect(url).toContain('/share/skin/456');
    });
  });
});
