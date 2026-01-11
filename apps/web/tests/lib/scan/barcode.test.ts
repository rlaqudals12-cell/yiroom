/**
 * 바코드 유틸리티 테스트
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  validateEAN13,
  validateEAN8,
  validateUPCA,
  detectBarcodeFormat,
  isBarcodeDetectorSupported,
  checkCameraPermission,
} from '@/lib/scan/barcode';

describe('validateEAN13', () => {
  it('유효한 EAN-13 바코드 검증', () => {
    // 실제 EAN-13 바코드들 (체크섬 포함)
    // 8809669912127: 체크섬 계산 = 133, (10-3)%10 = 7
    expect(validateEAN13('8809669912127')).toBe(true);
    // 4006381333931: 일반적인 유효한 EAN-13
    expect(validateEAN13('4006381333931')).toBe(true);
  });

  it('13자리가 아니면 false', () => {
    expect(validateEAN13('123456789012')).toBe(false); // 12자리
    expect(validateEAN13('12345678901234')).toBe(false); // 14자리
    expect(validateEAN13('')).toBe(false);
  });

  it('숫자가 아닌 문자 포함 시 false', () => {
    expect(validateEAN13('880966991212a')).toBe(false);
    expect(validateEAN13('8809669-12127')).toBe(false);
  });

  it('체크섬이 틀리면 false', () => {
    expect(validateEAN13('8809669912128')).toBe(false); // 마지막 숫자 틀림 (올바른 것은 7)
    expect(validateEAN13('8809669912120')).toBe(false);
  });
});

describe('validateEAN8', () => {
  it('유효한 EAN-8 바코드 검증', () => {
    expect(validateEAN8('12345670')).toBe(true);
  });

  it('8자리가 아니면 false', () => {
    expect(validateEAN8('1234567')).toBe(false);
    expect(validateEAN8('123456789')).toBe(false);
    expect(validateEAN8('')).toBe(false);
  });

  it('체크섬이 틀리면 false', () => {
    expect(validateEAN8('12345671')).toBe(false);
    expect(validateEAN8('12345672')).toBe(false);
  });
});

describe('validateUPCA', () => {
  it('유효한 UPC-A 바코드 검증', () => {
    expect(validateUPCA('012345678905')).toBe(true);
  });

  it('12자리가 아니면 false', () => {
    expect(validateUPCA('01234567890')).toBe(false);
    expect(validateUPCA('0123456789012')).toBe(false);
    expect(validateUPCA('')).toBe(false);
  });

  it('체크섬이 틀리면 false', () => {
    expect(validateUPCA('012345678901')).toBe(false);
    expect(validateUPCA('012345678902')).toBe(false);
  });
});

describe('detectBarcodeFormat', () => {
  it('EAN-13 형식 감지', () => {
    expect(detectBarcodeFormat('8809669912127')).toBe('EAN-13');
  });

  it('EAN-8 형식 감지', () => {
    expect(detectBarcodeFormat('12345670')).toBe('EAN-8');
  });

  it('UPC-A 형식 감지', () => {
    expect(detectBarcodeFormat('012345678905')).toBe('UPC-A');
  });

  it('유효하지 않은 바코드 처리', () => {
    // 4자리 이상 영숫자는 CODE-128로 인식 (fallback)
    expect(detectBarcodeFormat('12345')).toBe('CODE-128');
    expect(detectBarcodeFormat('abcdefghijklm')).toBe('CODE-128');
    // 빈 문자열이나 3자리 이하는 null
    expect(detectBarcodeFormat('')).toBe(null);
    expect(detectBarcodeFormat('123')).toBe(null);
  });

  it('체크섬이 틀린 EAN-13은 CODE-128로 인식', () => {
    // 13자리지만 체크섬 틀림 → EAN-13 아님 → CODE-128로 fallback
    expect(detectBarcodeFormat('8809669912128')).toBe('CODE-128');
  });
});

describe('isBarcodeDetectorSupported', () => {
  const originalWindow = global.window;

  afterEach(() => {
    global.window = originalWindow;
  });

  it('BarcodeDetector가 있으면 true', () => {
    // @ts-expect-error - BarcodeDetector mock
    global.window = { BarcodeDetector: class {} };
    expect(isBarcodeDetectorSupported()).toBe(true);
  });

  it('BarcodeDetector가 없으면 false', () => {
    // @ts-expect-error - window mock
    global.window = {};
    expect(isBarcodeDetectorSupported()).toBe(false);
  });
});

describe('checkCameraPermission', () => {
  const originalNavigator = global.navigator;

  beforeEach(() => {
    vi.resetAllMocks();
  });

  afterEach(() => {
    global.navigator = originalNavigator;
  });

  it('permissions API가 없으면 prompt 반환', async () => {
    // @ts-expect-error - navigator mock
    global.navigator = {};
    const result = await checkCameraPermission();
    expect(result).toBe('prompt');
  });

  it('granted 상태면 granted 반환', async () => {
    const mockQuery = vi.fn().mockResolvedValue({ state: 'granted' });
    // @ts-expect-error - navigator mock
    global.navigator = { permissions: { query: mockQuery } };

    const result = await checkCameraPermission();
    expect(result).toBe('granted');
    expect(mockQuery).toHaveBeenCalledWith({ name: 'camera' });
  });

  it('denied 상태면 denied 반환', async () => {
    const mockQuery = vi.fn().mockResolvedValue({ state: 'denied' });
    // @ts-expect-error - navigator mock
    global.navigator = { permissions: { query: mockQuery } };

    const result = await checkCameraPermission();
    expect(result).toBe('denied');
  });

  it('권한 조회 실패 시 prompt 반환', async () => {
    const mockQuery = vi.fn().mockRejectedValue(new Error('Not supported'));
    // @ts-expect-error - navigator mock
    global.navigator = { permissions: { query: mockQuery } };

    const result = await checkCameraPermission();
    expect(result).toBe('prompt');
  });
});
