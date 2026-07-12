/**
 * AI 생성/보정 가시 라벨 번인 (AI기본법 §31 · Google Play AI 생성 콘텐츠 정책)
 *
 * 화면 위 배지는 DOM 오버레이일 뿐이라 다운로드/공유된 "파일"에는 남지 않는다
 * (SynthID는 사람 눈에 안 보임). 이 유틸은 sharp로 사람이 읽을 수 있는 라벨을
 * 이미지 픽셀에 직접 합성해, 파일이 손을 떠나도 "AI로 만든/보정한 이미지"임이
 * 항상 남도록 한다. 표현 레이어(트윈 착장·자연 보정)의 모든 다운로드/공유 산출물에
 * 반환 직전 적용한다.
 *
 * 라벨은 라틴 문자로 고정한다 — 서버리스(리눅스) 환경엔 한글(CJK) 폰트가 없을 수
 * 있어 한글은 두부(□)로 깨질 위험이 있는 반면, 라틴 폰트(DejaVu 등)는 사실상 항상
 * 존재해 확실히 렌더링되고, 국외 공유 시에도 곧바로 인식된다(화면 내 배지는 한글 유지).
 *
 * 번인 실패(형식 오류·폰트 없음·너무 작은 이미지)는 던지지 않고 원본을 그대로
 * 돌려준다 — 공유 기능 자체를 막지 않기 위함(화면 배지·고지 문구가 백스톱).
 *
 * @module lib/visual-expression/internal/watermark
 * @see ADR-113 표현 레이어 분리, ADR-115 AI 트윈
 */

import sharp from 'sharp';

/** 트윈 착장 등 "생성" 산출물 라벨 */
export const AI_GENERATED_LABEL = 'AI GENERATED';
/** 자연 보정 등 "보정" 산출물 라벨 */
export const AI_EDITED_LABEL = 'AI EDITED';

/** SVG 텍스트 인젝션 방어 — 라벨은 상수지만 안전하게 이스케이프 */
function escapeXml(unsafe: string): string {
  return unsafe.replace(/[<>&'"]/g, (c) => {
    switch (c) {
      case '<':
        return '&lt;';
      case '>':
        return '&gt;';
      case '&':
        return '&amp;';
      case "'":
        return '&apos;';
      case '"':
        return '&quot;';
      default:
        return c;
    }
  });
}

/** data URL(`data:image/...;base64,...`)을 mimeType + 디코딩 버퍼로 분해 */
function parseDataUrl(dataUrl: string): { mimeType: string; buffer: Buffer } | null {
  const match = dataUrl.match(/^data:([^;]+);base64,(.+)$/);
  if (!match) return null;
  return { mimeType: match[1], buffer: Buffer.from(match[2], 'base64') };
}

/**
 * 이미지 버퍼에 하단 좌측 pill 형태의 AI 라벨을 합성한다.
 *
 * @returns 번인된 버퍼. 실패(형식 오류·폰트 없음)나 라벨을 담기엔 너무 작은
 *   이미지(예: mock 플레이스홀더)면 `null` — 호출부는 원본을 유지한다.
 */
export async function burnInAiLabel(image: Buffer, label: string): Promise<Buffer | null> {
  try {
    const meta = await sharp(image).metadata();
    const width = meta.width ?? 0;
    const height = meta.height ?? 0;
    // 라벨을 읽을 수 있게 담기엔 너무 작으면 번인하지 않는다(1x1 플레이스홀더 등)
    if (width < 64 || height < 40) return null;

    // 크기에 비례한 라벨(가독성 확보) — 하단 좌측 반투명 배지
    const fontSize = Math.max(16, Math.round(width * 0.045));
    const padX = Math.round(fontSize * 0.7);
    const padY = Math.round(fontSize * 0.45);
    // 라틴 볼드 글자 평균 폭 근사(약간 넉넉히 잡아 텍스트가 배지를 넘지 않게)
    const approxCharWidth = fontSize * 0.64;
    const textWidth = Math.round(label.length * approxCharWidth);
    const boxWidth = Math.min(width, textWidth + padX * 2);
    const boxHeight = fontSize + padY * 2;
    const margin = Math.round(fontSize * 0.6);
    const boxX = margin;
    const boxY = Math.max(0, height - boxHeight - margin);
    const radius = Math.round(boxHeight / 2);
    // baseline: 배지 상단 + 패딩 + 글자 높이의 약 0.78(대략적 ascent)
    const textY = boxY + padY + Math.round(fontSize * 0.78);

    const svg = `<svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">
  <rect x="${boxX}" y="${boxY}" width="${boxWidth}" height="${boxHeight}" rx="${radius}" ry="${radius}" fill="rgba(0,0,0,0.62)"/>
  <text x="${boxX + padX}" y="${textY}" font-family="Arial, Helvetica, 'DejaVu Sans', 'Liberation Sans', sans-serif" font-size="${fontSize}" font-weight="700" letter-spacing="0.5" fill="#ffffff">${escapeXml(label)}</text>
</svg>`;

    // composite는 포맷을 변경하지 않으므로 출력 mimeType은 입력을 따른다
    return await sharp(image)
      .composite([{ input: Buffer.from(svg), top: 0, left: 0 }])
      .toBuffer();
  } catch (e) {
    console.warn('[visual-expression/watermark] burn-in failed, keeping original:', e);
    return null;
  }
}

/**
 * data URL을 받아 AI 라벨을 번인한 data URL을 돌려준다.
 * 파싱 불가·번인 실패 시 입력 data URL을 그대로 반환한다(무손실 폴백).
 *
 * @param dataUrl 원본 이미지 data URL
 * @param label   번인할 라벨(AI_GENERATED_LABEL 또는 AI_EDITED_LABEL)
 */
export async function burnInAiLabelDataUrl(dataUrl: string, label: string): Promise<string> {
  const parsed = parseDataUrl(dataUrl);
  if (!parsed) return dataUrl;
  const out = await burnInAiLabel(parsed.buffer, label);
  if (!out) return dataUrl;
  return `data:${parsed.mimeType};base64,${out.toString('base64')}`;
}
