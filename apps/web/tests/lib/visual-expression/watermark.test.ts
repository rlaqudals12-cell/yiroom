/**
 * 표현 레이어 — AI 라벨 번인 (watermark) 테스트 (ADR-113 / ADR-115)
 *
 * 다운로드/공유 파일에 사람이 읽을 수 있는 AI 라벨이 픽셀로 남는지 검증한다.
 * (화면 배지는 DOM뿐이라 파일에 안 남는 문제를 서버 번인으로 해결)
 */

import { describe, it, expect } from 'vitest';
import sharp from 'sharp';
import {
  burnInAiLabel,
  burnInAiLabelDataUrl,
  AI_GENERATED_LABEL,
  AI_EDITED_LABEL,
} from '@/lib/visual-expression/internal/watermark';

/** 테스트용 단색 PNG 버퍼 생성 */
async function makePng(width: number, height: number): Promise<Buffer> {
  return sharp({
    create: {
      width,
      height,
      channels: 3,
      background: { r: 200, g: 180, b: 160 },
    },
  })
    .png()
    .toBuffer();
}

describe('burnInAiLabel', () => {
  it('충분히 큰 이미지에 라벨을 합성하고, 원본과 다른 유효 이미지를 반환한다', async () => {
    const input = await makePng(512, 640);
    const out = await burnInAiLabel(input, AI_GENERATED_LABEL);

    expect(out).not.toBeNull();
    // 번인 결과는 원본과 픽셀이 달라야 한다(라벨 합성됨)
    expect(Buffer.compare(out as Buffer, input)).not.toBe(0);

    // 여전히 유효한 이미지이며 크기(캔버스)는 보존된다
    const meta = await sharp(out as Buffer).metadata();
    expect(meta.width).toBe(512);
    expect(meta.height).toBe(640);
  });

  it('라벨을 담기엔 너무 작은 이미지(플레이스홀더 등)는 null을 반환한다', async () => {
    const tiny = await makePng(1, 1);
    const out = await burnInAiLabel(tiny, AI_EDITED_LABEL);
    expect(out).toBeNull();
  });

  it('이미지가 아닌 버퍼는 던지지 않고 null을 반환한다(무손실 폴백)', async () => {
    const garbage = Buffer.from('not-an-image', 'utf-8');
    const out = await burnInAiLabel(garbage, AI_GENERATED_LABEL);
    expect(out).toBeNull();
  });
});

describe('burnInAiLabelDataUrl', () => {
  it('data URL 형식이 아니면 입력을 그대로 반환한다', async () => {
    const result = await burnInAiLabelDataUrl('not-a-data-url', AI_EDITED_LABEL);
    expect(result).toBe('not-a-data-url');
  });

  it('디코딩 불가한 이미지 data URL은 입력을 그대로 반환한다(공유 기능을 막지 않음)', async () => {
    const bad = 'data:image/png;base64,ZZZZ';
    const result = await burnInAiLabelDataUrl(bad, AI_GENERATED_LABEL);
    expect(result).toBe(bad);
  });

  it('유효한 이미지 data URL은 mimeType을 보존한 채 라벨이 번인된 새 data URL을 반환한다', async () => {
    const png = await makePng(384, 384);
    const dataUrl = `data:image/png;base64,${png.toString('base64')}`;

    const result = await burnInAiLabelDataUrl(dataUrl, AI_GENERATED_LABEL);

    expect(result).not.toBe(dataUrl); // 라벨이 합성되어 바뀜
    expect(result.startsWith('data:image/png;base64,')).toBe(true);

    // 반환값이 유효한 이미지이고 크기가 보존됐는지 확인
    const outBuffer = Buffer.from(result.split(',')[1], 'base64');
    const meta = await sharp(outBuffer).metadata();
    expect(meta.width).toBe(384);
    expect(meta.height).toBe(384);
  });
});
