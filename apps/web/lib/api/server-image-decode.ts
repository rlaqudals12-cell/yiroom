/**
 * 서버 전용 이미지 디코더 (sharp 기반)
 *
 * @module lib/api/server-image-decode
 * @description
 *   Base64 → RGBImageData. image-engine의 fromBase64는 브라우저 전용
 *   (window/canvas)이라 서버 라우트에서 무조건 throw — V2 라우트 4곳의 품질
 *   게이트가 prod에서 한 번도 작동하지 못하던 원인 (2026-07-07 발견).
 *
 *   sharp는 네이티브 모듈이라 이 파일은 서버(라우트/lib)에서만 import할 것 —
 *   image-engine 배럴에 넣으면 클라이언트 번들이 깨진다.
 */

import sharp from 'sharp';
import type { RGBImageData } from '@/lib/image-engine';

export async function fromBase64Server(base64: string): Promise<RGBImageData> {
  const match = base64.match(/^data:image\/[^;]+;base64,(.+)$/);
  const raw = Buffer.from(match ? match[1] : base64, 'base64');
  const { data, info } = await sharp(raw)
    .rotate() // EXIF 회전 정규화 (모바일 세로 촬영)
    .raw()
    .toBuffer({ resolveWithObject: true });
  return {
    data: new Uint8Array(data),
    width: info.width,
    height: info.height,
    channels: info.channels === 4 ? 4 : 3,
  };
}
