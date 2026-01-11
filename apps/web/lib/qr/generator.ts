/**
 * QR 코드 생성 유틸리티
 * - 앱 다운로드, 친구 초대, 결과 공유용 QR 코드 생성
 */

import QRCode from 'qrcode';

export type QRCodeType = 'app_download' | 'referral' | 'result_share';

interface QROptions {
  type: QRCodeType;
  data: Record<string, string>;
  size?: number;
}

const BASE_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://yiroom.app';

/**
 * QR 코드 Data URL 생성
 * @param options QR 코드 옵션
 * @returns base64 Data URL
 */
export async function generateQRCode(options: QROptions): Promise<string> {
  const { type, data, size = 256 } = options;

  const url = buildQRUrl(type, data);

  return QRCode.toDataURL(url, {
    width: size,
    margin: 2,
    color: {
      dark: '#000000',
      light: '#FFFFFF',
    },
    errorCorrectionLevel: 'M',
  });
}

/**
 * QR 코드 타입별 URL 생성
 */
function buildQRUrl(type: QRCodeType, data: Record<string, string>): string {
  switch (type) {
    case 'app_download':
      return `${BASE_URL}/download?utm_source=qr&utm_medium=${data.medium || 'offline'}`;

    case 'referral':
      return `${BASE_URL}/invite/${data.referralCode}`;

    case 'result_share':
      return `${BASE_URL}/share/${data.resultType}/${data.resultId}`;

    default:
      return BASE_URL;
  }
}

/**
 * QR 코드를 Canvas에 렌더링
 * @param canvas Canvas 엘리먼트
 * @param options QR 코드 옵션
 */
export async function renderQRToCanvas(
  canvas: HTMLCanvasElement,
  options: QROptions
): Promise<void> {
  const { type, data, size = 256 } = options;
  const url = buildQRUrl(type, data);

  await QRCode.toCanvas(canvas, url, {
    width: size,
    margin: 2,
    color: {
      dark: '#000000',
      light: '#FFFFFF',
    },
  });
}

/**
 * QR 코드 URL만 반환 (외부에서 직접 생성 시)
 */
export function getQRUrl(type: QRCodeType, data: Record<string, string>): string {
  return buildQRUrl(type, data);
}
