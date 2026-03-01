/**
 * QR 코드 유틸 모듈 테스트
 */

import {
  generateAnalysisQRData,
  generateProductQRData,
  generateProfileQRData,
  generateInviteQRData,
  parseQRResult,
  getRouteFromQR,
  isYiroomDeepLink,
  deepLinkToRoute,
} from '../../lib/qr';

describe('qr', () => {
  describe('QR 데이터 생성', () => {
    it('분석 결과 QR', () => {
      const data = generateAnalysisQRData('skin', 'abc123');
      expect(data).toContain('share/analysis/skin/abc123');
    });

    it('제품 QR', () => {
      const data = generateProductQRData('prod-1');
      expect(data).toContain('products/prod-1');
    });

    it('프로필 QR', () => {
      const data = generateProfileQRData('user-1');
      expect(data).toContain('profile/user-1');
    });

    it('초대 QR', () => {
      const data = generateInviteQRData('user-1', 'INV123');
      expect(data).toContain('invite');
      expect(data).toContain('INV123');
    });
  });

  describe('parseQRResult', () => {
    it('분석 결과 URL 파싱', () => {
      const result = parseQRResult('https://yiroom.app/share/analysis/skin/abc123');
      expect(result.contentType).toBe('analysis_result');
      expect(result.data.type).toBe('skin');
      expect(result.data.id).toBe('abc123');
      expect(result.isValid).toBe(true);
    });

    it('제품 URL 파싱', () => {
      const result = parseQRResult('https://yiroom.app/products/prod-1');
      expect(result.contentType).toBe('product');
      expect(result.data.id).toBe('prod-1');
    });

    it('프로필 URL 파싱', () => {
      const result = parseQRResult('https://yiroom.app/profile/user-1');
      expect(result.contentType).toBe('profile');
      expect(result.data.userId).toBe('user-1');
    });

    it('딥링크 파싱', () => {
      const result = parseQRResult('yiroom://share/analysis/body/xyz');
      expect(result.contentType).toBe('analysis_result');
      expect(result.data.type).toBe('body');
    });

    it('외부 URL은 unknown', () => {
      const result = parseQRResult('https://google.com');
      expect(result.contentType).toBe('unknown');
      expect(result.isValid).toBe(true);
    });

    it('일반 텍스트는 invalid', () => {
      const result = parseQRResult('just some text');
      expect(result.contentType).toBe('unknown');
      expect(result.isValid).toBe(false);
    });
  });

  describe('getRouteFromQR', () => {
    it('분석 결과 라우트', () => {
      const result = parseQRResult('https://yiroom.app/share/analysis/skin/abc');
      const route = getRouteFromQR(result);
      expect(route).toContain('/(analysis)/skin/result/abc');
    });

    it('제품 라우트', () => {
      const result = parseQRResult('https://yiroom.app/products/prod-1');
      const route = getRouteFromQR(result);
      expect(route).toContain('/products/prod-1');
    });

    it('unknown은 null', () => {
      const result = parseQRResult('https://google.com');
      expect(getRouteFromQR(result)).toBeNull();
    });
  });

  describe('isYiroomDeepLink', () => {
    it('yiroom:// 스킴 인식', () => {
      expect(isYiroomDeepLink('yiroom://analysis/skin')).toBe(true);
    });

    it('웹 URL 인식', () => {
      expect(isYiroomDeepLink('https://yiroom.app/products')).toBe(true);
    });

    it('외부 URL 미인식', () => {
      expect(isYiroomDeepLink('https://google.com')).toBe(false);
    });
  });

  describe('deepLinkToRoute', () => {
    it('딥링크 → 앱 라우트', () => {
      const route = deepLinkToRoute('https://yiroom.app/products/prod-1');
      expect(route).toContain('/products/prod-1');
    });

    it('잘못된 URL은 null', () => {
      expect(deepLinkToRoute('invalid')).toBeNull();
    });
  });
});
