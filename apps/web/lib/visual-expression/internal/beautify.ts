/**
 * 자연 보정 (Beautify) — Gemini 이미지 편집 (ADR-113)
 *
 * 공유 흐름 전용. 분석 파이프라인과 물리적으로 분리하기 위해 이 모듈은
 * 분석용 `lib/gemini` 클라이언트를 import하지 않고 `@google/genai` SDK를
 * 직접 인스턴스화한다(역류 금지 원칙에 부합 — 표현→진실 단방향).
 *
 * 프롬프트는 코드 상수로 고정되어 피부 결·잡티·조명만 정돈하고
 * 이목구비·얼굴형·체형 변형을 명시적으로 금지한다.
 *
 * @module lib/visual-expression/internal/beautify
 * @see ADR-113, SDD-VISUAL-EXPRESSION §2
 */

import { GoogleGenAI } from '@google/genai';
import type { BeautifyInput, BeautifyOutput } from '../types';

// 분석 경로와 동일한 API 키를 재사용하되, 클라이언트 인스턴스는 분리
const API_KEY = process.env.GOOGLE_GENERATIVE_AI_API_KEY;

// Gemini 2.5 Flash Image (Nano Banana) — identity 보존 편집에 특화
export const BEAUTIFY_MODEL = process.env.GEMINI_IMAGE_MODEL || 'gemini-2.5-flash-image';

/**
 * 보정 프롬프트 (코드 상수 — 테스트로 고정)
 *
 * 반드시 이목구비·얼굴형·체형 변형 금지 문구를 포함한다.
 * 이 문구가 사라지면 프롬프트 고정 테스트가 실패한다.
 */
export const BEAUTIFY_PROMPT = [
  '이 인물 사진을 공유용으로 자연스럽게 정돈해 주세요.',
  '허용: 피부 결을 매끄럽게, 잡티와 자극을 부드럽게, 조명과 색감을 은은하게 정돈하는 정도.',
  '절대 금지: 이목구비·얼굴형·체형은 절대 변형하지 마세요. 눈을 키우거나 얼굴을 갸름하게 하거나 코를 바꾸는 등 성형 효과를 넣지 마세요.',
  '원본 인물의 정체성과 고유한 특징은 그대로 유지하고, 과하지 않게 "자연스럽게 정돈된 나"처럼 보이게 해 주세요.',
].join('\n');

let _client: GoogleGenAI | null = null;

function getClient(): GoogleGenAI | null {
  if (!API_KEY) return null;
  if (!_client) {
    _client = new GoogleGenAI({ apiKey: API_KEY });
  }
  return _client;
}

/** data URL(`data:image/...;base64,...`)을 mimeType + raw base64로 분해 */
function parseDataUrl(dataUrl: string): { mimeType: string; data: string } | null {
  const match = dataUrl.match(/^data:([^;]+);base64,(.+)$/);
  if (!match) return null;
  return { mimeType: match[1], data: match[2] };
}

/**
 * 공유용 자연 보정
 *
 * 실패(키 미설정·SDK 오류·이미지 미반환) 시 **원본을 그대로 반환하며
 * `aiEdited`를 붙이지 않는다** — 보정 실패를 가짜로 숨기지 않기 위함(ADR-007 정직성).
 *
 * @returns 보정 성공 시 BeautifyOutput, 실패 시 원본 이미지({ imageBase64 })
 */
export async function beautifyForShare(
  input: BeautifyInput
): Promise<BeautifyOutput | { imageBase64: string }> {
  const parsed = parseDataUrl(input.imageBase64);
  if (!parsed) {
    // 형식 오류 — 원본 그대로(보정 없음)
    return { imageBase64: input.imageBase64 };
  }

  const client = getClient();
  if (!client) {
    return { imageBase64: input.imageBase64 };
  }

  try {
    const response = await client.models.generateContent({
      model: BEAUTIFY_MODEL,
      contents: [
        { text: BEAUTIFY_PROMPT },
        { inlineData: { mimeType: parsed.mimeType, data: parsed.data } },
      ],
    });

    // 응답 파트에서 편집된 이미지(inlineData) 추출
    const parts = response.candidates?.[0]?.content?.parts ?? [];
    for (const part of parts) {
      const inline = part.inlineData;
      if (inline?.data) {
        const mimeType = inline.mimeType || 'image/png';
        return {
          imageBase64: `data:${mimeType};base64,${inline.data}`,
          aiEdited: true,
          model: BEAUTIFY_MODEL,
        };
      }
    }

    // 이미지가 반환되지 않음 — 원본 그대로(보정 실패 은폐 금지)
    console.warn('[visual-expression/beautify] no image returned, falling back to original');
    return { imageBase64: input.imageBase64 };
  } catch (error) {
    console.error('[visual-expression/beautify] edit failed:', error);
    return { imageBase64: input.imageBase64 };
  }
}
