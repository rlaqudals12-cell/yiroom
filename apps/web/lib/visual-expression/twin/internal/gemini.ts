/**
 * AI 트윈 이미지 생성 — 나노바나나(Gemini 이미지 모델) (ADR-115)
 *
 * ADR-113 역류 금지 원칙 상속: 분석용 `lib/gemini` 클라이언트를 import하지 않고
 * `@google/genai` SDK를 직접 인스턴스화한다(표현→진실 단방향).
 *
 * 프롬프트는 코드 상수로 고정 — 얼굴 충실 재현 + 체형 제약 주입 + 스튜디오 전신 +
 * **미화 금지("이목구비를 실제와 다르게 만들지 마세요")**. 이 문구가 사라지면
 * 프롬프트 고정 테스트가 실패한다.
 *
 * @module lib/visual-expression/twin/internal/gemini
 * @see ADR-115, SDD-AI-TWIN §2
 */

import { GoogleGenAI } from '@google/genai';
import type { TwinBodyConstraint, TwinGenerateInput } from '../types';

const API_KEY = process.env.GOOGLE_GENERATIVE_AI_API_KEY;

/** 나노바나나 이미지 모델 (identity 보존 편집/생성에 특화) */
export const TWIN_MODEL = process.env.GEMINI_IMAGE_MODEL || 'gemini-2.5-flash-image';

/** 프롬프트 버전 — source_meta에 기록(재현성 추적) */
export const TWIN_PROMPT_VERSION = 'twin-v1';

/**
 * 트윈 생성 프롬프트 (코드 상수 — 테스트로 고정)
 *
 * 반드시 미화 금지 문구를 포함한다.
 */
export const TWIN_PROMPT = [
  '이 인물 사진을 참조하여, 같은 사람의 전신 스튜디오 모델 사진 1장을 생성해 주세요.',
  '얼굴은 참조 사진의 이목구비·얼굴형·피부톤·머리 모양을 최대한 충실하게 재현해 주세요.',
  '배경은 깨끗한 스튜디오, 전신이 보이는 자연스럽고 편안한 정면 자세, 균일한 조명으로 표현해 주세요.',
  '절대 금지: 이목구비를 실제와 다르게 만들지 마세요. 눈을 키우거나 얼굴을 갸름하게 하거나 코·입을 바꾸는 등 미화·성형 효과를 넣지 마세요.',
  '원본 인물의 정체성과 고유한 특징을 그대로 유지하고, "나를 닮은 모델"처럼 보이게 해 주세요.',
].join('\n');

/**
 * 트윈 착장(결합) 프롬프트 (코드 상수 — 테스트로 고정)
 *
 * 매 호출 트윈 원본을 참조로 재주입하여 정체성 드리프트를 억제한다.
 */
export const TWIN_COMPOSE_PROMPT = [
  '첫 번째 이미지는 인물(트윈)이고 두 번째 이미지는 의류입니다.',
  '첫 번째 인물이 두 번째 의류를 자연스럽게 착용한 전신 사진 1장을 생성해 주세요.',
  '인물의 얼굴·체형·정체성은 첫 번째 이미지를 그대로 유지하고, 이목구비를 실제와 다르게 만들지 마세요.',
  '의류의 색·형태·디테일은 두 번째 이미지를 충실히 반영해 주세요.',
].join('\n');

/** 실측 체형 제약을 프롬프트 문장으로 변환(선택) */
export function buildTwinPrompt(bodyConstraint?: TwinBodyConstraint): string {
  if (!bodyConstraint?.bodyTypeLabel) {
    return TWIN_PROMPT;
  }
  const ratioText =
    bodyConstraint.ratios && Object.keys(bodyConstraint.ratios).length > 0
      ? ` (참고 비율: ${Object.entries(bodyConstraint.ratios)
          .map(([k, v]) => `${k}=${v}`)
          .join(', ')})`
      : '';
  return [
    TWIN_PROMPT,
    `체형은 "${bodyConstraint.bodyTypeLabel}" 유형에 맞게 표현해 주세요${ratioText}. 체형을 왜곡하거나 과장하지 마세요.`,
  ].join('\n');
}

/** FORCE_MOCK_AI(로컬 개발) 여부 — 매 호출 env 재평가(테스트 격리) */
export function isMockMode(): boolean {
  return process.env.FORCE_MOCK_AI === 'true';
}

/**
 * 개발용 고정 플레이스홀더 이미지 (1x1 PNG) — FORCE_MOCK_AI 전용.
 * status pending 흐름은 실 생성과 동일하게 흐른다.
 */
export const PLACEHOLDER_PNG_BASE64 =
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==';

/** 플레이스홀더 data URL (compose 결과용) */
export const PLACEHOLDER_DATA_URL = `data:image/png;base64,${PLACEHOLDER_PNG_BASE64}`;

let _client: GoogleGenAI | null = null;

function getClient(): GoogleGenAI | null {
  if (!API_KEY) return null;
  if (!_client) {
    _client = new GoogleGenAI({ apiKey: API_KEY });
  }
  return _client;
}

/** data URL(`data:image/...;base64,...`)을 mimeType + raw base64로 분해 */
export function parseDataUrl(dataUrl: string): { mimeType: string; data: string } | null {
  const match = dataUrl.match(/^data:([^;]+);base64,(.+)$/);
  if (!match) return null;
  return { mimeType: match[1], data: match[2] };
}

interface RawImage {
  data: string; // raw base64 (data URL 접두사 없음)
  mimeType: string;
}

/** 응답 파트에서 첫 이미지(inlineData) 추출 */
function extractImage(response: unknown): RawImage | null {
  const parts =
    (
      response as {
        candidates?: Array<{
          content?: { parts?: Array<{ inlineData?: { data?: string; mimeType?: string } }> };
        }>;
      }
    )?.candidates?.[0]?.content?.parts ?? [];
  for (const part of parts) {
    const inline = part.inlineData;
    if (inline?.data) {
      return { data: inline.data, mimeType: inline.mimeType || 'image/png' };
    }
  }
  return null;
}

/**
 * 트윈 전신 이미지 생성.
 *
 * @returns 생성 이미지(raw base64+mime), 실패 시 null (키 없음·형식 오류·무응답).
 *   FORCE_MOCK_AI=true면 고정 플레이스홀더를 반환한다.
 */
export async function generateTwinImage(input: TwinGenerateInput): Promise<RawImage | null> {
  if (isMockMode()) {
    return { data: PLACEHOLDER_PNG_BASE64, mimeType: 'image/png' };
  }

  const client = getClient();
  if (!client) return null;

  const face = parseDataUrl(input.faceImageBase64);
  if (!face) return null;

  const contents: Array<{ text: string } | { inlineData: { mimeType: string; data: string } }> = [
    { text: buildTwinPrompt(input.bodyConstraint) },
    { inlineData: { mimeType: face.mimeType, data: face.data } },
  ];

  if (input.bodyImageBase64) {
    const body = parseDataUrl(input.bodyImageBase64);
    if (body) {
      contents.push({ inlineData: { mimeType: body.mimeType, data: body.data } });
    }
  }

  try {
    const response = await client.models.generateContent({ model: TWIN_MODEL, contents });
    return extractImage(response);
  } catch (error) {
    console.error('[visual-expression/twin] generateTwinImage failed:', error);
    return null;
  }
}

/**
 * 트윈에 의류를 착장한 이미지 생성(결합).
 *
 * 트윈 원본과 의류를 함께 재주입하여 드리프트를 억제한다.
 *
 * @returns 착장 이미지 data URL, 실패 시 null.
 *   FORCE_MOCK_AI=true면 고정 플레이스홀더 data URL을 반환한다.
 */
export async function composeTwinImage(twin: RawImage, garment: RawImage): Promise<string | null> {
  if (isMockMode()) {
    return PLACEHOLDER_DATA_URL;
  }

  const client = getClient();
  if (!client) return null;

  try {
    const response = await client.models.generateContent({
      model: TWIN_MODEL,
      contents: [
        { text: TWIN_COMPOSE_PROMPT },
        { inlineData: { mimeType: twin.mimeType, data: twin.data } },
        { inlineData: { mimeType: garment.mimeType, data: garment.data } },
      ],
    });
    const image = extractImage(response);
    if (!image) return null;
    return `data:${image.mimeType};base64,${image.data}`;
  } catch (error) {
    console.error('[visual-expression/twin] composeTwinImage failed:', error);
    return null;
  }
}
