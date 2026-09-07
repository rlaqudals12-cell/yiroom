import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
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

describe('배포 URL 환경변수 우선순위', () => {
  afterEach(() => {
    vi.unstubAllEnvs();
    vi.resetModules();
  });

  it.each([
    ['https://site.example', 'https://legacy.example', 'https://site.example'],
    ['', 'https://legacy.example', 'https://legacy.example'],
    ['', '', 'https://yiroom.vercel.app'],
  ])('SITE_URL=%s / APP_URL=%s이면 %s를 출력한다', async (site, app, expected) => {
    vi.stubEnv('NEXT_PUBLIC_SITE_URL', site);
    vi.stubEnv('NEXT_PUBLIC_APP_URL', app);
    vi.resetModules();
    const { getQRUrl, generateQRCode, renderQRToCanvas } = await import('@/lib/qr/generator');
    const { default: QRCode } = await import('qrcode');
    expect(getQRUrl('referral', { referralCode: 'ABC' })).toBe(`${expected}/invite/ABC`);
    await generateQRCode({ type: 'result_share', data: { resultType: 'skin', resultId: '123' } });
    expect(QRCode.toDataURL).toHaveBeenCalledWith(`${expected}/share/skin/123`, expect.any(Object));
    const canvas = document.createElement('canvas');
    await renderQRToCanvas(canvas, { type: 'app_download', data: {} });
    expect(QRCode.toCanvas).toHaveBeenCalledWith(
      canvas,
      `${expected}/download?utm_source=qr&utm_medium=offline`,
      expect.any(Object)
    );
  });
});
