/**
 * AI 트윈 오케스트레이션 — 생성/결합 (ADR-115)
 *
 * gemini(이미지 생성) + store(Storage/DB)를 결합한다.
 * 생성 실패 시 정직하게 던진다(가짜 트윈 금지, ADR-007 정직성).
 *
 * @module lib/visual-expression/twin/internal/service
 * @see ADR-115, SDD-AI-TWIN §2
 */

import { burnInAiLabelDataUrl, AI_GENERATED_LABEL } from '@/lib/visual-expression';
import type { TwinComposeOutput, TwinGenerateInput, TwinLayer, TwinRecord } from '../types';
import { TwinGenerationError, TwinNotApprovedError, TwinNotFoundError } from './errors';
import {
  composeTwinImage,
  generateTwinImage,
  isMockMode,
  parseDataUrl,
  PLACEHOLDER_DATA_URL,
  TWIN_PROMPT_VERSION,
} from './gemini';
import { downloadTwinImage, getTwinRowById, insertTwin } from './store';

/**
 * 트윈 생성 → Storage 업로드 + 행 삽입(status pending).
 *
 * @throws {TwinGenerationError} 이미지 생성 실패(키 없음·모델 무응답)
 */
export async function generateTwin(userId: string, input: TwinGenerateInput): Promise<TwinRecord> {
  const image = await generateTwinImage(input);
  if (!image) {
    throw new TwinGenerationError();
  }

  return insertTwin({
    userId,
    imageBase64: image.data,
    mimeType: image.mimeType,
    sourceMeta: {
      bodyType: input.bodyConstraint?.bodyTypeLabel ?? null,
      promptVersion: TWIN_PROMPT_VERSION,
    },
  });
}

/** 의류 URL을 raw base64로 가져오기(compose용) */
async function fetchGarment(url: string): Promise<{ data: string; mimeType: string }> {
  const res = await fetch(url);
  if (!res.ok) {
    throw new TwinGenerationError('의류 이미지를 불러올 수 없어요');
  }
  const arrayBuffer = await res.arrayBuffer();
  const mimeType = res.headers.get('content-type') || 'image/jpeg';
  return { data: Buffer.from(arrayBuffer).toString('base64'), mimeType };
}

/**
 * 승인된 트윈에 의류를 착장 (v1: outfit 1종). 결과는 저장하지 않는다(다운로드/공유용).
 *
 * @throws {TwinNotFoundError} 트윈 없음/소유자 불일치
 * @throws {TwinNotApprovedError} 승인되지 않은 트윈
 * @throws {TwinGenerationError} 결합 이미지 생성 실패
 */
export async function composeOnTwin(
  userId: string,
  twinId: string,
  layer: TwinLayer
): Promise<TwinComposeOutput> {
  const row = await getTwinRowById(userId, twinId);
  if (!row) throw new TwinNotFoundError();
  if (row.status !== 'approved') throw new TwinNotApprovedError();

  // Mock 모드: 원본/의류 다운로드 없이 고정 플레이스홀더 반환(개발용)
  if (isMockMode()) {
    return { imageUrl: PLACEHOLDER_DATA_URL, aiGenerated: true };
  }

  const twin = await downloadTwinImage(row.image_path);
  const garment = await fetchGarment(layer.garmentImageUrl);

  const imageUrl = await composeTwinImage(twin, garment);
  if (!imageUrl) {
    throw new TwinGenerationError('지금은 착장 이미지를 만들 수 없어요');
  }

  // parseDataUrl로 산출물 형식 최소 검증(방어)
  if (!parseDataUrl(imageUrl)) {
    throw new TwinGenerationError('지금은 착장 이미지를 만들 수 없어요');
  }

  // 다운로드/공유 파일에 "AI 생성" 가시 라벨을 픽셀로 번인(화면 배지는 DOM뿐)
  const labeledUrl = await burnInAiLabelDataUrl(imageUrl, AI_GENERATED_LABEL);

  return { imageUrl: labeledUrl, aiGenerated: true };
}
