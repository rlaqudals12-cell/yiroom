/**
 * 바코드 스캔 유틸리티
 * - zxing-js 기반 크로스 브라우저 바코드 인식
 * - BarcodeDetector API fallback 지원
 */

import type { BarcodeType } from '@/types/scan';

// ============================================
// 타입 정의
// ============================================

export interface BarcodeResult {
  text: string;
  format: BarcodeType | string;
  confidence: number;
}

export interface ScanOptions {
  /** 스캔 타임아웃 (ms) */
  timeout?: number;
  /** 연속 스캔 모드 */
  continuous?: boolean;
  /** 지원 바코드 형식 */
  formats?: BarcodeType[];
}

const DEFAULT_OPTIONS: ScanOptions = {
  timeout: 10000,
  continuous: false,
  formats: ['EAN-13', 'EAN-8', 'UPC-A', 'CODE-128'],
};

// ============================================
// BarcodeDetector API 지원 여부 확인
// ============================================

/**
 * BarcodeDetector API 지원 여부
 * Chrome/Edge에서만 지원, Safari 미지원
 */
export function isBarcodeDetectorSupported(): boolean {
  return typeof window !== 'undefined' && 'BarcodeDetector' in window;
}

// ============================================
// 바코드 유효성 검증
// ============================================

/**
 * EAN-13 체크섬 검증
 */
export function validateEAN13(barcode: string): boolean {
  if (!/^\d{13}$/.test(barcode)) return false;

  const digits = barcode.split('').map(Number);
  const sum = digits.slice(0, 12).reduce((acc, digit, i) => {
    return acc + digit * (i % 2 === 0 ? 1 : 3);
  }, 0);

  const checkDigit = (10 - (sum % 10)) % 10;
  return checkDigit === digits[12];
}

/**
 * EAN-8 체크섬 검증
 */
export function validateEAN8(barcode: string): boolean {
  if (!/^\d{8}$/.test(barcode)) return false;

  const digits = barcode.split('').map(Number);
  const sum = digits.slice(0, 7).reduce((acc, digit, i) => {
    return acc + digit * (i % 2 === 0 ? 3 : 1);
  }, 0);

  const checkDigit = (10 - (sum % 10)) % 10;
  return checkDigit === digits[7];
}

/**
 * UPC-A 체크섬 검증
 */
export function validateUPCA(barcode: string): boolean {
  if (!/^\d{12}$/.test(barcode)) return false;

  const digits = barcode.split('').map(Number);
  const sum = digits.slice(0, 11).reduce((acc, digit, i) => {
    return acc + digit * (i % 2 === 0 ? 3 : 1);
  }, 0);

  const checkDigit = (10 - (sum % 10)) % 10;
  return checkDigit === digits[11];
}

/**
 * 바코드 형식 자동 감지 및 검증
 */
export function detectBarcodeFormat(barcode: string): BarcodeType | null {
  if (/^\d{13}$/.test(barcode) && validateEAN13(barcode)) {
    return 'EAN-13';
  }
  if (/^\d{8}$/.test(barcode) && validateEAN8(barcode)) {
    return 'EAN-8';
  }
  if (/^\d{12}$/.test(barcode) && validateUPCA(barcode)) {
    return 'UPC-A';
  }
  if (/^[A-Za-z0-9]+$/.test(barcode) && barcode.length >= 4) {
    return 'CODE-128';
  }
  return null;
}

// ============================================
// zxing-js 기반 스캔
// ============================================

let readerInstance: any = null;

/**
 * zxing-js 리더 초기화 (lazy loading)
 */
async function getReader() {
  if (readerInstance) return readerInstance;

  try {
    const { BrowserMultiFormatReader } = await import('@zxing/library');
    readerInstance = new BrowserMultiFormatReader();
    return readerInstance;
  } catch (error) {
    console.error('[Scan] zxing-js 로드 실패:', error);
    throw new Error('바코드 스캔 라이브러리를 불러올 수 없습니다');
  }
}

/**
 * 비디오 요소에서 바코드 스캔
 */
export async function scanBarcodeFromVideo(
  videoElement: HTMLVideoElement,
  options: ScanOptions = {}
): Promise<BarcodeResult | null> {
  const opts = { ...DEFAULT_OPTIONS, ...options };

  try {
    const reader = await getReader();

    const result = await Promise.race([
      reader.decodeOnceFromVideoDevice(undefined, videoElement),
      new Promise<null>((_, reject) =>
        setTimeout(() => reject(new Error('스캔 타임아웃')), opts.timeout)
      ),
    ]);

    if (!result) return null;

    const text = result.getText();
    const format = detectBarcodeFormat(text) || result.getBarcodeFormat().toString();

    return {
      text,
      format,
      confidence: 1.0,
    };
  } catch (error) {
    console.error('[Scan] 바코드 인식 실패:', error);
    return null;
  }
}

/**
 * 이미지에서 바코드 스캔
 */
export async function scanBarcodeFromImage(
  imageSource: HTMLImageElement | string
): Promise<BarcodeResult | null> {
  try {
    const reader = await getReader();

    let result;
    if (typeof imageSource === 'string') {
      result = await reader.decodeFromImageUrl(imageSource);
    } else {
      result = await reader.decodeFromImageElement(imageSource);
    }

    if (!result) return null;

    const text = result.getText();
    const format = detectBarcodeFormat(text) || result.getBarcodeFormat().toString();

    return {
      text,
      format,
      confidence: 1.0,
    };
  } catch (error) {
    console.error('[Scan] 이미지 바코드 인식 실패:', error);
    return null;
  }
}

/**
 * 스캔 중지
 */
export function stopScan(): void {
  if (readerInstance) {
    readerInstance.reset();
  }
}

// ============================================
// 카메라 권한
// ============================================

/**
 * 카메라 권한 상태 확인
 */
export async function checkCameraPermission(): Promise<'granted' | 'denied' | 'prompt'> {
  try {
    const permission = await navigator.permissions.query({ name: 'camera' as PermissionName });
    return permission.state;
  } catch {
    // permissions API 미지원 브라우저
    return 'prompt';
  }
}

/**
 * 카메라 접근 요청
 */
export async function requestCameraAccess(): Promise<MediaStream | null> {
  try {
    const stream = await navigator.mediaDevices.getUserMedia({
      video: {
        facingMode: 'environment', // 후면 카메라 우선
        width: { ideal: 1280 },
        height: { ideal: 720 },
      },
    });
    return stream;
  } catch (error) {
    console.error('[Scan] 카메라 접근 실패:', error);
    return null;
  }
}

/**
 * 카메라 스트림 중지
 */
export function stopCameraStream(stream: MediaStream): void {
  stream.getTracks().forEach((track) => track.stop());
}
