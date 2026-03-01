/**
 * QR 코드 유틸 모듈
 *
 * QR 코드 생성 URL, 스캔 결과 파싱, 딥링크 처리
 *
 * @module lib/qr
 */

// ─── 타입 ────────────────────────────────────────────

export type QRContentType =
  | 'analysis_result'
  | 'product'
  | 'profile'
  | 'invite'
  | 'unknown';

export interface QRScanResult {
  raw: string;
  contentType: QRContentType;
  data: Record<string, string>;
  isValid: boolean;
}

export interface QRGenerateOptions {
  size?: number;
  backgroundColor?: string;
  foregroundColor?: string;
  errorCorrectionLevel?: 'L' | 'M' | 'Q' | 'H';
}

// ─── 상수 ─────────────────────────────────────────────

const APP_SCHEME = 'yiroom://';
const WEB_BASE_URL = 'https://yiroom.app';

export const QR_DEFAULT_OPTIONS: QRGenerateOptions = {
  size: 256,
  backgroundColor: '#ffffff',
  foregroundColor: '#000000',
  errorCorrectionLevel: 'M',
};

// ─── QR 데이터 생성 ──────────────────────────────────

/**
 * 분석 결과 공유용 QR 데이터
 */
export function generateAnalysisQRData(
  analysisType: string,
  analysisId: string
): string {
  return `${WEB_BASE_URL}/share/analysis/${analysisType}/${analysisId}`;
}

/**
 * 제품 공유용 QR 데이터
 */
export function generateProductQRData(productId: string): string {
  return `${WEB_BASE_URL}/products/${productId}`;
}

/**
 * 프로필 공유용 QR 데이터
 */
export function generateProfileQRData(userId: string): string {
  return `${WEB_BASE_URL}/profile/${userId}`;
}

/**
 * 친구 초대용 QR 데이터
 */
export function generateInviteQRData(
  userId: string,
  inviteCode: string
): string {
  return `${WEB_BASE_URL}/invite?code=${inviteCode}&from=${userId}`;
}

// ─── QR 스캔 결과 파싱 ──────────────────────────────

/**
 * QR 스캔 결과 파싱
 */
export function parseQRResult(rawData: string): QRScanResult {
  // yiroom:// 딥링크
  if (rawData.startsWith(APP_SCHEME)) {
    return parseDeepLink(rawData);
  }

  // 웹 URL
  if (rawData.startsWith(WEB_BASE_URL)) {
    return parseWebUrl(rawData);
  }

  // 일반 URL
  if (rawData.startsWith('http://') || rawData.startsWith('https://')) {
    return {
      raw: rawData,
      contentType: 'unknown',
      data: { url: rawData },
      isValid: true,
    };
  }

  return {
    raw: rawData,
    contentType: 'unknown',
    data: {},
    isValid: false,
  };
}

/**
 * QR 결과에서 앱 내 라우트 추출
 */
export function getRouteFromQR(result: QRScanResult): string | null {
  switch (result.contentType) {
    case 'analysis_result':
      return `/(analysis)/${result.data.type}/result/${result.data.id}`;
    case 'product':
      return `/products/${result.data.id}`;
    case 'profile':
      return `/profile/${result.data.userId}`;
    case 'invite':
      return `/(auth)/invite?code=${result.data.code}`;
    default:
      return null;
  }
}

// ─── 딥링크 ──────────────────────────────────────────

/**
 * 딥링크인지 확인
 */
export function isYiroomDeepLink(url: string): boolean {
  return url.startsWith(APP_SCHEME) || url.startsWith(WEB_BASE_URL);
}

/**
 * 딥링크 → 앱 라우트 변환
 */
export function deepLinkToRoute(url: string): string | null {
  const result = parseQRResult(url);
  return getRouteFromQR(result);
}

// ─── 내부 함수 ───────────────────────────────────────

function parseDeepLink(url: string): QRScanResult {
  const path = url.replace(APP_SCHEME, '');
  return parsePathSegments(url, path);
}

function parseWebUrl(url: string): QRScanResult {
  const path = url.replace(WEB_BASE_URL, '');
  return parsePathSegments(url, path);
}

function parsePathSegments(raw: string, path: string): QRScanResult {
  const segments = path.split('/').filter(Boolean);

  // /share/analysis/{type}/{id}
  if (segments[0] === 'share' && segments[1] === 'analysis' && segments[2] && segments[3]) {
    return {
      raw,
      contentType: 'analysis_result',
      data: { type: segments[2], id: segments[3] },
      isValid: true,
    };
  }

  // /products/{id}
  if (segments[0] === 'products' && segments[1]) {
    return {
      raw,
      contentType: 'product',
      data: { id: segments[1] },
      isValid: true,
    };
  }

  // /profile/{userId}
  if (segments[0] === 'profile' && segments[1]) {
    return {
      raw,
      contentType: 'profile',
      data: { userId: segments[1] },
      isValid: true,
    };
  }

  // /invite?code=xxx
  if (segments[0] === 'invite') {
    const params = new URLSearchParams(raw.split('?')[1] ?? '');
    return {
      raw,
      contentType: 'invite',
      data: {
        code: params.get('code') ?? '',
        from: params.get('from') ?? '',
      },
      isValid: !!params.get('code'),
    };
  }

  return {
    raw,
    contentType: 'unknown',
    data: {},
    isValid: false,
  };
}
