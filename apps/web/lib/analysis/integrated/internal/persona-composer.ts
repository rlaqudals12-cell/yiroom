/**
 * 나 프로필 합성기 (5축 결과 → "1명의 나" 내러티브)
 *
 * @module lib/analysis/integrated/internal/persona-composer
 * @description
 *   ADR-104 체크리스트 #1 — "1명의 나로 통합"의 구현체.
 *   5축 성공 결과를 입력으로 받아 Gemini로 한 단락 페르소나를 합성.
 *   AI 실패 시 축 라벨 조합 기반 Mock fallback.
 *
 * @see docs/adr/ADR-098-identity-redefinition-5axis-model.md §P1 ("나 프로필")
 * @see docs/adr/ADR-104-yiroom-launch-criteria.md §2.1
 * @see .claude/rules/prompt-engineering.md (이모지 + JSON 전용 응답)
 * @see .claude/rules/ai-integration.md (Mock Fallback 필수)
 *
 * @internal — 외부 import 금지 (오케스트레이터 전용)
 */

import {
  generateContent,
  isGeminiAvailable,
  parseJsonResponse,
  outputLanguageDirective,
  type OutputLocale,
} from '@/lib/gemini/client';
import { getBodyShapeLabel } from '@/lib/body';
import { skinTypeKo, faceShapeKo, bodyDescKo, seasonKo, toneKo, undertoneKo } from '../labels';
import type {
  AxisResult,
  PersonaProfile,
  PersonalColorAxisData,
  SkinAxisData,
  BodyAxisData,
  HairAxisData,
  MakeupAxisData,
} from '../types';

// ============================================
// 1. 입력 요약 유틸
// ============================================

interface AxisSummary {
  pc?: { season: string; tone: string; undertone: string };
  skin?: { type: string; score: number };
  body?: { type: string };
  hair?: { faceShape: string };
  makeup?: { base: string };
}

/** 성공한 축만 요약. 실패 축은 undefined. */
function summarizeAxes(axes: {
  personalColor: AxisResult<PersonalColorAxisData>;
  skin: AxisResult<SkinAxisData>;
  body: AxisResult<BodyAxisData>;
  hair: AxisResult<HairAxisData>;
  makeup: AxisResult<MakeupAxisData>;
}): AxisSummary {
  const s: AxisSummary = {};
  if (axes.personalColor.success) {
    s.pc = {
      season: axes.personalColor.data.season,
      tone: axes.personalColor.data.tone,
      undertone: axes.personalColor.data.undertone,
    };
  }
  if (axes.skin.success) {
    s.skin = {
      type: axes.skin.data.skinType,
      score: axes.skin.data.overallScore,
    };
  }
  if (axes.body.success) {
    s.body = { type: getBodyShapeLabel(axes.body.data.bodyType) };
  }
  if (axes.hair.success) {
    s.hair = { faceShape: axes.hair.data.faceShape };
  }
  if (axes.makeup.success) {
    s.makeup = { base: axes.makeup.data.baseRecommendation };
  }
  return s;
}

function successAxisCount(s: AxisSummary): number {
  return [s.pc, s.skin, s.body, s.hair, s.makeup].filter(Boolean).length;
}

// 소비자 눈높이 라벨(skinTypeKo/faceShapeKo/bodyDescKo)은 ../labels 공용 헬퍼로 일원화.

// ============================================
// 2. Gemini 프롬프트
// ============================================

/**
 * 언어별 글자수 재보정 스펙.
 *
 * 왜: 한/일/중은 글자당 정보밀도가 높고 영어는 같은 뜻에 ~2~2.5배 글자가 든다.
 * ko 20자 지시를 그대로 en에 적용하면 문장이 잘려 반쪽 번역이 된다 → 언어별로 상·하한을 조정한다.
 * `unit`은 프롬프트 지시문에 넣는 단위 표기(자/字/characters), `sliceCap`은 검증부 안전 캡.
 */
interface LocaleTextSpec {
  oneLineMax: number;
  narrativeMin: number;
  narrativeMax: number;
  unit: string;
  sliceCap: number;
}

const LOCALE_TEXT_SPEC: Record<OutputLocale, LocaleTextSpec> = {
  ko: { oneLineMax: 20, narrativeMin: 80, narrativeMax: 180, unit: '자', sliceCap: 40 },
  ja: { oneLineMax: 20, narrativeMin: 80, narrativeMax: 180, unit: '字', sliceCap: 40 },
  zh: { oneLineMax: 16, narrativeMin: 70, narrativeMax: 160, unit: '字', sliceCap: 40 },
  en: { oneLineMax: 45, narrativeMin: 180, narrativeMax: 420, unit: 'characters', sliceCap: 90 },
};

/** 출력 톤 지시문 (언어별) — 따뜻하지만 과장 없는 톤. outputLanguageDirective와 함께 주입. */
const TONE_DIRECTIVE: Record<OutputLocale, string> = {
  ko: '따뜻하지만 과장 없는 톤으로 작성해주세요.',
  en: 'Use a warm, natural tone without exaggeration.',
  ja: '温かく自然な、誇張のないトーンで記述してください。',
  zh: '用温暖自然、不夸张的语气书写。',
};

function specFor(locale: OutputLocale): LocaleTextSpec {
  return LOCALE_TEXT_SPEC[locale] ?? LOCALE_TEXT_SPEC.ko;
}

function buildPrompt(summary: AxisSummary, locale: OutputLocale): string {
  const spec = specFor(locale);
  const lines: string[] = [];
  // 프롬프트 본문·입력 컨텍스트는 한국어 유지(도메인 전문성) — 출력 언어만 지시문으로 분리(기존 v2 패턴).
  // 라벨도 ko 표기로 넣어 AI에게 안정적 컨텍스트를 주고, 출력은 outputLanguageDirective가 사용자 언어로 강제한다.
  if (summary.pc) {
    // 원시 영문값(spring/true-spring/warm)을 프롬프트에 넣지 않는다 — AI가 그대로 되받아 누수하는 걸 방지.
    lines.push(
      `- 퍼스널컬러: ${seasonKo(summary.pc.season)} / ${toneKo(summary.pc.tone)} / ${undertoneKo(summary.pc.undertone)}`
    );
  }
  if (summary.skin) {
    lines.push(
      `- 피부: ${skinTypeKo(summary.skin.type)} 타입, 피부 컨디션 점수 ${summary.skin.score}점`
    );
  }
  if (summary.body) {
    lines.push(`- 체형: ${bodyDescKo(summary.body.type)}`);
  }
  if (summary.hair) {
    lines.push(`- 얼굴형: ${faceShapeKo(summary.hair.faceShape)}`);
  }
  if (summary.makeup) {
    lines.push(`- 메이크업 베이스: ${summary.makeup.base}`);
  }

  // 영문 용어 회피 규칙은 ko 전용 — en/ja/zh에선 자국어 자연 표현이 정상이므로 이 규칙을 적용하지 않는다.
  const beginnerRule =
    locale === 'ko'
      ? `6. 사용자는 뷰티 초보자예요 — 영문 용어(normal, oval 등)를 그대로 쓰지 말고, 전문 용어는
   반드시 괄호로 짧은 풀이를 병기하세요. 풀이 없는 전문 용어 단독 사용은 금지예요.
   예: "내추럴 실루엣" ❌ → "골격감이 자연스러운(내추럴) 체형" ✅ /
   "듀이 마무리" ❌ → "듀이(촉촉한 광) 마무리" ✅ /
   "웨이브 체형" ❌ → "곡선이 부드러운(웨이브) 체형" ✅ /
   "쿨톤" 처럼 이미 널리 쓰는 말은 그대로 써도 돼요.`
      : `6. 성공한 축을 사용자에게 친근한 표현으로 풀어주세요 (전문 용어 남발 금지).`;

  return `당신은 이룸(Yiroom)의 "나 프로필" 내러티브 작가예요. 5축 분석 결과를 읽고,
사용자를 **1명의 온전한 사람**으로 한 단락에 담아주세요.

🌐 출력 언어: ${outputLanguageDirective(locale)} ${TONE_DIRECTIVE[locale] ?? TONE_DIRECTIVE.ko}
(JSON 필드명은 영문 그대로, 값(텍스트)만 위 언어로 작성)

⚠️ 작성 원칙:
1. 5축을 나열하지 말고 **하나의 인상**으로 엮어주세요.
2. "당신은 ~" 또는 은유 표현 1개 포함 (예: "봄볕에 피는 꽃 같은 사람").
3. 위 출력 언어로, 따뜻하지만 과장 없는 톤.
4. 의학/진단 표현 금지, "어울려요/좋아요/잘 맞아요" 같은 실용어 사용.
5. 성공한 축만 활용. 실패한 축은 언급 금지.
${beginnerRule}

📊 입력 (5축 성공 결과):
${lines.join('\n')}

📋 작성 순서:
1. 5축 결과에서 **공통된 색감/분위기/이미지**를 찾으세요.
2. 한 문장 페르소나(oneLine)를 은유로 압축.
3. 2-4문장 내러티브(narrative)로 사용자를 하나의 존재로 묘사.
4. 3개의 핵심 인사이트(keyInsights)를 축 조합 기반으로 짧게 정리.

다음 JSON 형식으로만 응답해주세요 (다른 텍스트 없이 JSON만):

{
  "oneLine": "은유 1개 한 문장 (최대 ${spec.oneLineMax}${spec.unit})",
  "narrative": "2-4문장, 마침표로 끝. 총 ${spec.narrativeMin}-${spec.narrativeMax}${spec.unit}.",
  "keyInsights": [
    "조합 인사이트 1 (예: 봄 웜톤 × 건성 → 코랄 듀이 베이스가 잘 맞아요)",
    "조합 인사이트 2",
    "조합 인사이트 3"
  ]
}

⚠️ 주의:
- 실패 축을 추측해서 채우지 마세요.
- oneLine이 ${spec.oneLineMax}${spec.unit}를 넘으면 압축하세요.
- narrative가 없으면 안 돼요. 최소 2문장.
- keyInsights는 정확히 3개.`;
}

// ============================================
// 3. Mock Fallback
// ============================================

/**
 * AI 호출 실패 또는 불가 시 fallback.
 * 축 라벨 조합으로 최소 일관성 있는 persona 생성.
 */
function generateMockPersona(summary: AxisSummary): PersonaProfile {
  const parts: string[] = [];
  const insights: string[] = [];

  if (summary.pc) {
    parts.push(
      `${summary.pc.season === 'spring' || summary.pc.season === 'autumn' ? '따뜻한' : '시원한'} 빛이 어울리는 톤`
    );
    // 원시 12톤값(true-spring 등) 노출 금지 — PC 결과 페이지와 동일한 한국어 정본 라벨("트루 스프링")로
    insights.push(`${toneKo(summary.pc.tone)} 팔레트가 당신의 혈색을 살려요.`);
  }
  if (summary.skin) {
    // 초보자 눈높이: 원시 영문 타입·"바이탈리티" 전문용어 노출 금지
    parts.push(`${skinTypeKo(summary.skin.type)} 피부 (피부 컨디션 점수 ${summary.skin.score}점)`);
    insights.push(
      `피부 타입에 맞는 ${summary.skin.type === 'oily' ? '매트(보송한)' : '듀이(촉촉한 광)'} 마무리가 좋아요.`
    );
  }
  if (summary.body) {
    parts.push(`${bodyDescKo(summary.body.type)} 체형`);
  }
  if (summary.hair) {
    insights.push(`${faceShapeKo(summary.hair.faceShape)} 얼굴에는 얼굴선을 살린 컷이 어울려요.`);
  }
  if (summary.makeup) {
    insights.push(summary.makeup.base);
  }

  const oneLine = summary.pc
    ? summary.pc.undertone === 'warm'
      ? '따뜻한 빛을 품은 사람'
      : '차분한 빛을 품은 사람'
    : '당신만의 색을 가진 사람';

  const narrative =
    parts.length > 0
      ? `당신은 ${parts.join(', ')}을(를) 가진 사람이에요. 분석 결과가 말하는 당신은 하나의 인상으로 엮일 수 있어요.`
      : '분석 결과가 준비되면 당신만의 프로필을 그려드릴게요.';

  return {
    oneLine,
    narrative,
    keyInsights: insights.slice(0, 3),
    usedFallback: true,
  };
}

// ============================================
// 4. Gemini 응답 스키마 + 검증
// ============================================

interface GeminiPersonaResponse {
  oneLine: string;
  narrative: string;
  keyInsights: string[];
}

function validateResponse(raw: unknown, locale: OutputLocale): GeminiPersonaResponse | null {
  if (typeof raw !== 'object' || raw === null) return null;
  const obj = raw as Record<string, unknown>;
  if (typeof obj.oneLine !== 'string' || !obj.oneLine.trim()) return null;
  if (typeof obj.narrative !== 'string' || !obj.narrative.trim()) return null;
  if (!Array.isArray(obj.keyInsights)) return null;
  const insights = obj.keyInsights.filter(
    (v): v is string => typeof v === 'string' && v.trim().length > 0
  );
  if (insights.length === 0) return null;
  return {
    // oneLine 안전 캡 — 권장 상한(oneLineMax)보다 여유를 둔 언어별 sliceCap (en은 글자수 밀도가 낮아 90)
    oneLine: obj.oneLine.trim().slice(0, specFor(locale).sliceCap),
    narrative: obj.narrative.trim(),
    keyInsights: insights.slice(0, 3),
  };
}

// ============================================
// 5. 공개 함수
// ============================================

export interface ComposePersonaInput {
  personalColor: AxisResult<PersonalColorAxisData>;
  skin: AxisResult<SkinAxisData>;
  body: AxisResult<BodyAxisData>;
  hair: AxisResult<HairAxisData>;
  makeup: AxisResult<MakeupAxisData>;
}

/**
 * 5축 결과로부터 "나 프로필" 생성.
 *
 * 반환 규칙:
 * - 성공 축 0개: null (페르소나 작성 불가)
 * - 성공 축 1개: Mock fallback (Gemini도 가능하나 비용 절약)
 * - 성공 축 2개 이상: Gemini 시도 → 실패 시 Mock
 *
 * 타임아웃/에러 시 절대 throw 안 함 (orchestrator 보호).
 *
 * @param locale 출력 언어 (기본 'ko') — AI 내러티브를 사용자 언어로 생성. 기본값이라 회귀 0.
 *   Mock fallback은 ko 고정(내러티브 템플릿) — AI 경로만 로케일화(범위 밖).
 */
export async function composePersona(
  axes: ComposePersonaInput,
  locale: OutputLocale = 'ko'
): Promise<PersonaProfile | null> {
  const summary = summarizeAxes(axes);
  const count = successAxisCount(summary);

  if (count === 0) return null;

  // 1축만 성공이면 Gemini 호출 없이 Mock — 내러티브 가치 낮음
  if (count < 2) {
    return generateMockPersona(summary);
  }

  // FORCE_MOCK 또는 Gemini 미가용 시 Mock
  if (process.env.FORCE_MOCK_AI === 'true' || !isGeminiAvailable()) {
    return generateMockPersona(summary);
  }

  // Gemini 호출
  try {
    const prompt = buildPrompt(summary, locale);
    const response = await generateContent({
      contents: prompt,
      config: {
        temperature: 0.8, // 창의적 표현 허용 (분석이 아닌 내러티브이므로)
        maxOutputTokens: 600,
      },
    });

    const parsed = parseJsonResponse<unknown>(response.text);
    const validated = validateResponse(parsed, locale);

    if (!validated) {
      console.warn('[PersonaComposer] Gemini response validation failed, using mock');
      return generateMockPersona(summary);
    }

    return {
      oneLine: validated.oneLine,
      narrative: validated.narrative,
      keyInsights: validated.keyInsights,
      usedFallback: false,
    };
  } catch (error) {
    console.error('[PersonaComposer] Gemini error, using mock fallback:', error);
    return generateMockPersona(summary);
  }
}
