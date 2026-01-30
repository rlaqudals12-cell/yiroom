# ADR-018: 국제화(i18n) 아키텍처

## 상태

`accepted`

## 날짜

2026-01-15

## 0. 궁극의 형태 (P1)

### 이상적 최종 상태

"모든 언어 사용자가 모국어로 완벽한 경험을 받는 상태"

- **완전한 다국어 지원**: 10개 이상 주요 언어 네이티브 품질 번역
- **문화적 적응**: 언어별 UX 패턴, 색상 의미, 문화적 뉘앙스 반영
- **실시간 번역 동기화**: 콘텐츠 변경 시 모든 언어 자동 업데이트
- **AI 프롬프트 최적화**: 언어별로 최적화된 AI 프롬프트

### 물리적 한계

| 항목 | 한계 |
|------|------|
| 번역 비용 | 고품질 전문 번역 비용 (언어당 ~$5K) |
| AI 프롬프트 | 언어별 프롬프트 최적화 복잡도 |
| 번들 크기 | 언어 파일 추가 시 용량 증가 |
| K-뷰티 용어 | 한국어 특화 용어 번역 한계 |

### 100점 기준

| 지표 | 100점 기준 | 현재 | 비고 |
|------|-----------|------|------|
| 지원 언어 수 | 10개 | 1개 (한국어) | 영어, 일본어 예정 |
| UI 텍스트 번역률 | 100% | 100% (ko) | 단일 언어 |
| AI 프롬프트 다국어화 | 100% | 0% | Phase 3 |
| 지역화(L10n) 완성도 | 100% | 80% | 날짜/숫자 포맷 |

### 현재 목표: 40% (Phase 1: 준비 단계)

### 의도적 제외

| 제외 항목 | 이유 | 재검토 시점 |
|----------|------|------------|
| 즉시 전체 i18n | 현재 불필요 (NOT_NEEDED) | MAU 5K+ |
| RTL 언어 지원 | 시장 우선순위 낮음 | 중동 진출 시 |
| 자동 번역 API | 품질 불안정 | AI 번역 품질 향상 시 |
| CMS 기반 번역 관리 | 복잡도 대비 ROI (HIGH_COMPLEXITY) | 번역팀 규모 확대 시 |

---

## 맥락 (Context)

이룸은 현재 **한국어 단일 언어**로 서비스 중입니다. 향후 글로벌 확장을 고려하여 국제화 전략을 미리 정의해야 합니다:

1. **언어 확장 가능성**: 영어, 일본어, 중국어 지원 예정
2. **콘텐츠 관리**: AI 프롬프트, UI 텍스트, 제품 데이터 다국어화
3. **지역화(L10n)**: 날짜/시간, 숫자, 통화 형식
4. **RTL 지원**: 아랍어 등 우→좌 언어 (장기)

## 결정 (Decision)

**점진적 i18n 도입 전략** 채택:

```
┌─────────────────────────────────────────────────────────────┐
│                   i18n Architecture                          │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  Phase 1: 준비 (현재)                                        │
│  ├── 하드코딩 텍스트 → 상수 분리                            │
│  ├── 날짜/숫자 포맷 함수 중앙화                             │
│  └── AI 프롬프트 템플릿화                                   │
│                                                              │
│  Phase 2: 인프라 (MAU 5K+)                                   │
│  ├── next-intl / i18next 도입                               │
│  ├── 언어 라우팅 (/ko, /en, /ja)                            │
│  └── 번역 파일 구조 정의                                    │
│                                                              │
│  Phase 3: 콘텐츠 (MAU 10K+)                                  │
│  ├── 영어 번역 완료                                         │
│  ├── AI 프롬프트 다국어화                                   │
│  └── 제품 데이터 다국어 지원                                │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

### 번역 파일 구조

```
locales/
├── ko/
│   ├── common.json       # 공통 UI 텍스트
│   ├── analysis.json     # 분석 모듈
│   ├── workout.json      # 운동 모듈
│   ├── nutrition.json    # 영양 모듈
│   └── products.json     # 제품 추천
├── en/
│   └── ...
└── ja/
    └── ...
```

### 번역 키 네이밍 규칙

```json
{
  "analysis.personalColor.result.title": "퍼스널 컬러 분석 결과",
  "analysis.personalColor.season.spring": "봄 웜톤",
  "workout.onboarding.goal.muscle": "근력 강화",
  "common.button.save": "저장",
  "common.error.network": "네트워크 오류가 발생했습니다"
}
```

## 대안 (Alternatives Considered)

| 대안 | 장점 | 단점 | 제외 사유 |
|------|------|------|----------|
| 즉시 전체 구현 | 완전한 i18n | 현재 불필요 | `NOT_NEEDED` |
| 자동 번역 API | 빠른 번역 | 품질 불안정 | `LOW_ROI` |
| CMS 기반 | 동적 관리 | 복잡도 증가 | `HIGH_COMPLEXITY` |

## 결과 (Consequences)

### 긍정적 결과

- **확장 준비**: 글로벌 확장 시 빠른 대응 가능
- **유지보수**: 텍스트 수정이 한 곳에서 가능
- **일관성**: 동일 용어 통일 사용

### 부정적 결과

- **초기 비용**: 텍스트 분리 작업 필요
- **번들 증가**: 언어 파일 추가로 용량 증가

## 구현 가이드 (Phase 1)

### 텍스트 상수 분리

```typescript
// constants/messages/ko.ts
export const ANALYSIS_MESSAGES = {
  personalColor: {
    result: {
      title: '퍼스널 컬러 분석 결과',
      confidence: '분석 신뢰도',
    },
  },
} as const;
```

### 날짜/숫자 포맷 중앙화

```typescript
// lib/i18n/formatters.ts
export function formatDate(date: Date, locale = 'ko-KR'): string {
  return new Intl.DateTimeFormat(locale, {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  }).format(date);
}

export function formatNumber(num: number, locale = 'ko-KR'): string {
  return new Intl.NumberFormat(locale).format(num);
}
```

### AI 프롬프트 템플릿

```typescript
// lib/i18n/prompts.ts
const PROMPTS = {
  ko: {
    skinAnalysis: `당신은 전문 피부과학 기반 AI 분석가입니다...`,
  },
  en: {
    skinAnalysis: `You are a professional dermatology-based AI analyst...`,
  },
};

export function getPrompt(key: string, locale = 'ko'): string {
  return PROMPTS[locale]?.[key] ?? PROMPTS.ko[key];
}
```

## 재검토 트리거

| 조건 | 액션 |
|------|------|
| MAU 5K+ 도달 | Phase 2 인프라 도입 검토 |
| 해외 사용자 요청 증가 | 영어 번역 우선 진행 |
| 일본/동남아 진출 | 일본어/영어 지원 |

## 관련 문서

### 원리 문서 (과학적 기초)
- [원리: AI 추론](../principles/ai-inference.md) - 다국어 프롬프트 전략

### 관련 ADR/스펙
- [Code Style](../../.claude/rules/code-style.md) - UI 텍스트 규칙
- [AI Integration](../../.claude/rules/ai-integration.md) - 프롬프트 언어 정책

---

**Author**: Claude Code
**Reviewed by**: -
