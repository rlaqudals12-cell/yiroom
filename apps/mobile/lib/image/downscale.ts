/**
 * 이미지 다운스케일 유틸 (전송 전 축소)
 *
 * 원본 해상도 사진을 그대로 base64로 만들면 수 MB짜리 JSON 바디가 되어 메모리 압박·413
 * (Payload Too Large) 위험이 있다. AI 분석/생성에 필요한 최대 폭(기본 1024px)으로 리사이즈 +
 * JPEG 압축해 base64를 생성한다. (mobile-patterns.md 이미지 최적화 관례)
 *
 * @module lib/image/downscale
 */
import { manipulateAsync, SaveFormat } from 'expo-image-manipulator';

const DEFAULT_MAX_WIDTH = 1024;
const DEFAULT_COMPRESS = 0.8;

/**
 * 이미지 URI를 최대 폭으로 축소하고 base64(순수 문자열, data URL 접두 없음)를 반환한다.
 *
 * @param uri - 원본 이미지 URI(카메라/갤러리 asset.uri)
 * @param maxWidth - 리사이즈 최대 폭 (기본 1024)
 * @returns base64 문자열
 */
export async function downscaleToBase64(
  uri: string,
  maxWidth: number = DEFAULT_MAX_WIDTH
): Promise<string> {
  const result = await manipulateAsync(uri, [{ resize: { width: maxWidth } }], {
    compress: DEFAULT_COMPRESS,
    base64: true,
    format: SaveFormat.JPEG,
  });
  return result.base64 ?? '';
}

/**
 * 이미지 URI를 축소해 data URL(`data:image/jpeg;base64,...`)로 반환한다.
 * 트윈 생성처럼 data URL 형식을 요구하는 API에 사용한다.
 */
export async function downscaleToDataUrl(
  uri: string,
  maxWidth: number = DEFAULT_MAX_WIDTH
): Promise<string> {
  const base64 = await downscaleToBase64(uri, maxWidth);
  return `data:image/jpeg;base64,${base64}`;
}
