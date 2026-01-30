# AI-6: 다국어 지원 (Multilingual Support)

> AI/ML 심화 6/8 - 한국어 중심 다국어 AI 분석 전략

---

## 1. 연구 개요

### 1.1 목적

이룸 앱의 AI 분석을 한국어 중심으로 최적화하고,
향후 일본어/영어 확장을 위한 기반을 마련한다.

### 1.2 언어별 고려사항

| 언어 | 특성 | AI 처리 고려사항 |
|------|------|-----------------|
| **한국어** | 주 사용 언어, 뷰티 용어 풍부 | 도메인 용어 정확도 |
| **영어** | 글로벌 확장, 학술 용어 | 프롬프트 기반 언어 |
| **일본어** | 동북아 시장, K-뷰티 관심 | 존경어 처리, 문화 맥락 |

### 1.3 다국어 LLM 성능 (2025)

| 모델 | 한국어 | 일본어 | 영어 | 비고 |
|------|--------|--------|------|------|
| Qwen 3 | 우수 | 우수 | 우수 | 아시아 언어 특화 |
| Gemini | 좋음 | 좋음 | 우수 | 범용 |
| GPT-4o | 좋음 | 좋음 | 우수 | 범용 |
| Claude | 좋음 | 좋음 | 우수 | 범용 |
| Tower | 좋음 | - | 우수 | 번역 특화 |

---

## 2. 프롬프트 언어 전략

### 2.1 연구 결과

> 연구에 따르면 영어 프롬프트가 대부분의 언어와 작업에서
> 모국어 프롬프트와 유사한 성능을 달성한다.

### 2.2 하이브리드 접근법

```typescript
// lib/i18n/prompt-strategy.ts

export type Language = 'ko' | 'ja' | 'en';

export interface MultilingualPrompt {
  // 시스템 지시는 영어 (일관된 성능)
  systemInstructions: string;

  // 도메인 용어는 해당 언어
  domainTerms: Record<Language, DomainTerms>;

  // 출력 언어 지정
  outputLanguage: Language;
}

export interface DomainTerms {
  skinTypes: Record<string, string>;
  concerns: Record<string, string>;
  zones: Record<string, string>;
  recommendations: string[];
}

// 하이브리드 프롬프트 생성
export function buildMultilingualPrompt(
  prompt: MultilingualPrompt,
  targetLang: Language
): string {
  const terms = prompt.domainTerms[targetLang];

  return `
${prompt.systemInstructions}

## Domain Terms (${targetLang.toUpperCase()})
Skin Types: ${Object.values(terms.skinTypes).join(', ')}
Concerns: ${Object.values(terms.concerns).join(', ')}
Analysis Zones: ${Object.values(terms.zones).join(', ')}

## Output Language
Respond in ${getLanguageName(targetLang)}.
Use the domain terms defined above.
`.trim();
}

function getLanguageName(lang: Language): string {
  const names = { ko: 'Korean', ja: 'Japanese', en: 'English' };
  return names[lang];
}
```

### 2.3 도메인 용어 사전

```typescript
// lib/i18n/beauty-terms.ts

export const BEAUTY_TERMS: Record<Language, DomainTerms> = {
  ko: {
    skinTypes: {
      dry: '건성',
      oily: '지성',
      combination: '복합성',
      sensitive: '민감성',
      normal: '정상',
    },
    concerns: {
      pores: '모공',
      wrinkles: '주름',
      redness: '홍조',
      acne: '트러블',
      pigmentation: '색소침착',
      dehydration: '수분부족',
      dullness: '칙칙함',
    },
    zones: {
      tZone: 'T존 (이마, 코)',
      uZone: 'U존 (볼, 턱)',
      eyeArea: '눈가',
      jawline: '턱선',
    },
    recommendations: [
      '가벼운 수분 크림 사용',
      '자외선 차단제 필수',
      '부드러운 클렌저 권장',
    ],
  },
  ja: {
    skinTypes: {
      dry: '乾燥肌',
      oily: '脂性肌',
      combination: '混合肌',
      sensitive: '敏感肌',
      normal: '普通肌',
    },
    concerns: {
      pores: '毛穴',
      wrinkles: 'シワ',
      redness: '赤み',
      acne: 'ニキビ',
      pigmentation: 'シミ',
      dehydration: '乾燥',
      dullness: 'くすみ',
    },
    zones: {
      tZone: 'Tゾーン（額・鼻）',
      uZone: 'Uゾーン（頬・顎）',
      eyeArea: '目元',
      jawline: 'フェイスライン',
    },
    recommendations: [
      '軽い保湿クリームをお使いください',
      '日焼け止めは必須です',
      'やさしいクレンザーをおすすめします',
    ],
  },
  en: {
    skinTypes: {
      dry: 'Dry',
      oily: 'Oily',
      combination: 'Combination',
      sensitive: 'Sensitive',
      normal: 'Normal',
    },
    concerns: {
      pores: 'Pores',
      wrinkles: 'Wrinkles',
      redness: 'Redness',
      acne: 'Acne',
      pigmentation: 'Pigmentation',
      dehydration: 'Dehydration',
      dullness: 'Dullness',
    },
    zones: {
      tZone: 'T-Zone (forehead, nose)',
      uZone: 'U-Zone (cheeks, chin)',
      eyeArea: 'Eye Area',
      jawline: 'Jawline',
    },
    recommendations: [
      'Use a light moisturizing cream',
      'Sunscreen is essential',
      'Recommend gentle cleanser',
    ],
  },
};
```

---

## 3. 번역 전략

### 3.1 프롬프트 번역 vs 응답 번역

| 방식 | 장점 | 단점 | 권장 상황 |
|------|------|------|----------|
| 프롬프트 번역 | AI가 해당 언어로 직접 응답 | 품질 불일치 가능 | 단순한 분석 |
| 응답 번역 | 영어로 분석 후 번역 | 추가 API 비용 | 복잡한 분석 |
| 하이브리드 | 지시는 영어, 출력은 타겟 언어 | 구현 복잡 | 이룸 권장 |

### 3.2 응답 후번역 구현

```typescript
// lib/i18n/response-translation.ts

import { GoogleGenerativeAI } from '@google/generative-ai';

export interface TranslationConfig {
  sourceLanguage: Language;
  targetLanguage: Language;
  preserveTerminology: boolean;
  termGlossary?: Record<string, string>;
}

export async function translateAnalysisResult(
  result: AnalysisResult,
  config: TranslationConfig
): Promise<AnalysisResult> {
  if (config.sourceLanguage === config.targetLanguage) {
    return result;
  }

  const genAI = new GoogleGenerativeAI(process.env.GOOGLE_GENERATIVE_AI_API_KEY!);
  const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' });

  // 번역이 필요한 텍스트 필드 추출
  const textsToTranslate = extractTexts(result);

  // 용어집 포함 번역 프롬프트
  const glossaryText = config.termGlossary
    ? `\n\nGlossary (preserve these terms):\n${
        Object.entries(config.termGlossary)
          .map(([src, tgt]) => `${src} → ${tgt}`)
          .join('\n')
      }`
    : '';

  const prompt = `
Translate the following text from ${config.sourceLanguage} to ${config.targetLanguage}.
Preserve the JSON structure and only translate the string values.
${glossaryText}

${JSON.stringify(textsToTranslate, null, 2)}
`;

  const response = await model.generateContent(prompt);
  const translatedTexts = JSON.parse(response.response.text());

  return mergeTranslations(result, translatedTexts);
}

function extractTexts(result: any): Record<string, string> {
  const texts: Record<string, string> = {};

  function extract(obj: any, prefix: string = '') {
    for (const [key, value] of Object.entries(obj)) {
      const path = prefix ? `${prefix}.${key}` : key;

      if (typeof value === 'string' && shouldTranslate(key)) {
        texts[path] = value;
      } else if (Array.isArray(value)) {
        value.forEach((item, i) => {
          if (typeof item === 'string') {
            texts[`${path}[${i}]`] = item;
          }
        });
      } else if (typeof value === 'object' && value !== null) {
        extract(value, path);
      }
    }
  }

  extract(result);
  return texts;
}

function shouldTranslate(key: string): boolean {
  // 번역 불필요한 필드 제외
  const skipFields = ['skinType', 'season', 'bodyType', 'id'];
  return !skipFields.includes(key);
}
```

---

## 4. 일본어 특화 처리

### 4.1 존경어 (敬語) 처리

```typescript
// lib/i18n/japanese-handler.ts

export interface JapaneseOutputConfig {
  formalityLevel: 'casual' | 'polite' | 'formal';
  honorificStyle: 'desu-masu' | 'keigo';
}

export const JAPANESE_FORMALITY_PROMPT: Record<string, string> = {
  casual: 'Use casual Japanese (タメ口). Direct and friendly tone.',
  polite: 'Use polite Japanese (です・ます調). Standard politeness.',
  formal: 'Use formal Japanese (敬語). Highly respectful tone suitable for professional contexts.',
};

export function buildJapanesePrompt(
  basePrompt: string,
  config: JapaneseOutputConfig
): string {
  return `
${basePrompt}

## Japanese Output Style
${JAPANESE_FORMALITY_PROMPT[config.formalityLevel]}

Example response style:
${getJapaneseExample(config.formalityLevel)}
`;
}

function getJapaneseExample(level: string): string {
  const examples = {
    casual: 'お肌の状態は良い感じだよ。水分が足りないから、保湿をしっかりね！',
    polite: 'お肌の状態は良好です。水分が不足気味ですので、保湿をおすすめします。',
    formal: 'お肌の状態は良好でございます。水分が不足しておりますので、保湿をお勧めいたします。',
  };
  return examples[level as keyof typeof examples] || examples.polite;
}
```

### 4.2 K-뷰티 용어 매핑

```typescript
// lib/i18n/k-beauty-terms.ts

// K-뷰티 트렌드 용어의 일본어 표현
export const K_BEAUTY_TERMS_JA: Record<string, string> = {
  // 스킨케어
  '물광피부': 'ムルグァン肌（水光肌）',
  '꿀광': 'ハニースキン',
  '7스킨법': '7スキン法',
  '더블클렌징': 'ダブルクレンジング',

  // 메이크업
  '무쌍메이크업': '一重メイク',
  '생얼메이크업': 'すっぴん風メイク',
  '광채': 'ツヤ',

  // 성분
  '시카': 'シカ（CICA）',
  '레티놀': 'レチノール',
  '비타민C': 'ビタミンC',
};

export function localizeKBeautyTerm(term: string, targetLang: Language): string {
  if (targetLang === 'ja' && K_BEAUTY_TERMS_JA[term]) {
    return K_BEAUTY_TERMS_JA[term];
  }
  return term;
}
```

---

## 5. 언어 감지 및 라우팅

### 5.1 사용자 언어 감지

```typescript
// lib/i18n/language-detection.ts

export async function detectUserLanguage(
  request: Request,
  userId?: string
): Promise<Language> {
  // 1. 사용자 설정 확인
  if (userId) {
    const userLang = await getUserLanguageSetting(userId);
    if (userLang) return userLang;
  }

  // 2. Accept-Language 헤더
  const acceptLanguage = request.headers.get('accept-language');
  if (acceptLanguage) {
    const detected = parseAcceptLanguage(acceptLanguage);
    if (detected) return detected;
  }

  // 3. 기본값
  return 'ko';
}

function parseAcceptLanguage(header: string): Language | null {
  const languages = header
    .split(',')
    .map(l => l.split(';')[0].trim().toLowerCase());

  for (const lang of languages) {
    if (lang.startsWith('ko')) return 'ko';
    if (lang.startsWith('ja')) return 'ja';
    if (lang.startsWith('en')) return 'en';
  }

  return null;
}

async function getUserLanguageSetting(userId: string): Promise<Language | null> {
  const { data } = await supabase
    .from('user_preferences')
    .select('language')
    .eq('clerk_user_id', userId)
    .single();

  return data?.language || null;
}
```

### 5.2 언어별 분석 라우팅

```typescript
// lib/ai/multilingual-router.ts

export async function analyzeWithLanguage(
  input: AnalysisInput,
  language: Language
): Promise<AnalysisResult> {
  // 프롬프트 언어 결정
  const promptConfig = getPromptConfig(input.type, language);

  // 분석 실행
  const result = await callGeminiAPI({
    ...input,
    prompt: buildMultilingualPrompt(promptConfig, language),
  });

  // 응답 용어 현지화
  const localizedResult = localizeResult(result, language);

  return localizedResult;
}

function localizeResult(result: AnalysisResult, language: Language): AnalysisResult {
  const terms = BEAUTY_TERMS[language];

  return {
    ...result,
    skinType: terms.skinTypes[result.skinType as keyof typeof terms.skinTypes] || result.skinType,
    concerns: result.concerns?.map(c =>
      terms.concerns[c as keyof typeof terms.concerns] || c
    ),
  };
}
```

---

## 6. UI 다국어 지원

### 6.1 next-intl 설정

```typescript
// i18n/config.ts

export const locales = ['ko', 'ja', 'en'] as const;
export const defaultLocale = 'ko' as const;

export type Locale = (typeof locales)[number];
```

```typescript
// i18n/request.ts

import { getRequestConfig } from 'next-intl/server';
import { cookies, headers } from 'next/headers';

export default getRequestConfig(async () => {
  const headersList = await headers();
  const cookieStore = await cookies();

  // 쿠키 → Accept-Language → 기본값 순으로 결정
  let locale =
    cookieStore.get('NEXT_LOCALE')?.value ||
    headersList.get('accept-language')?.split(',')[0]?.split('-')[0] ||
    'ko';

  // 지원 언어 확인
  if (!locales.includes(locale as Locale)) {
    locale = 'ko';
  }

  return {
    locale,
    messages: (await import(`../messages/${locale}.json`)).default,
  };
});
```

### 6.2 메시지 파일

```json
// messages/ko.json
{
  "analysis": {
    "skin": {
      "title": "피부 분석",
      "types": {
        "dry": "건성",
        "oily": "지성",
        "combination": "복합성",
        "sensitive": "민감성",
        "normal": "정상"
      },
      "scores": {
        "hydration": "수분도",
        "oiliness": "유분도",
        "sensitivity": "민감도"
      }
    }
  }
}
```

```json
// messages/ja.json
{
  "analysis": {
    "skin": {
      "title": "肌分析",
      "types": {
        "dry": "乾燥肌",
        "oily": "脂性肌",
        "combination": "混合肌",
        "sensitive": "敏感肌",
        "normal": "普通肌"
      },
      "scores": {
        "hydration": "水分量",
        "oiliness": "油分量",
        "sensitivity": "敏感度"
      }
    }
  }
}
```

---

## 7. 구현 체크리스트

### P0 (Critical)

- [ ] 한국어 도메인 용어 사전
- [ ] 하이브리드 프롬프트 구조
- [ ] 기본 언어 감지

### P1 (High)

- [ ] 일본어 지원 추가
- [ ] 존경어 레벨 설정
- [ ] next-intl 통합

### P2 (Medium)

- [ ] 영어 지원
- [ ] K-뷰티 용어 현지화
- [ ] 번역 캐싱

---

## 8. 참고 자료

- [Best LLM for Translation 2025](https://nutstudio.imyfone.com/llm-tips/best-llm-for-translation/)
- [Qwen Multilingual Performance](https://azumo.com/artificial-intelligence/ai-insights/multilingual-llms)
- [Tower Translation Model](https://unbabel.com/announcing-tower-an-open-multilingual-llm-for-translation-related-tasks/)
- [LLM Prompting for Localization](https://openreview.net/forum?id=27pOlHjUge)

---

**Version**: 1.0
**Created**: 2026-01-19
**Category**: AI/ML 심화 (6/8)
