# SDD: "나 프로필" 통합 카드 — Phase 1.5

> **상태**: 초안 (Phase 1.5 — 출시 후 4~8주 착수 예정)
> **작성일**: 2026-04-26
> **연관 ADR**: [ADR-098](../adr/ADR-098-identity-redefinition-5axis-model.md) §6 R1
> **리서치**: [profile-card-phase-1.5-research](../research/profile-card-phase-1.5-research.md)
> **선행 의존**: 통합 분석 플로우 (ADR-099~104) `implemented` 상태

---

## 0. 궁극의 형태 (P1)

### 이상적 최종 상태

```
홈 화면 최상단에서 사용자는 자신의 5축 정체성을 한 카드로 본다:
"봄 라이트의 미니멀 스타일러"라는 한 문장 + 5축 칩(PC/S/C/H/M) + 신뢰도.
탭하면 결과 페이지로, 공유 버튼으로 PNG/링크 생성, 신뢰도 낮은 축은
재측정 CTA가 자연스럽게 노출된다.

홈에 들어올 때마다 자기 정체성을 상기하므로 "이룸은 무슨 앱이야?"에
"내 시각 정체성을 이해해주는 앱"이라고 한 문장으로 답할 수 있게 된다.
```

### 100점 기준

- 5축 결과를 320pt 이내 한 카드로 압축 노출
- 한 줄 정체성 문장 자동 생성 (PC + 체형 + 무드)
- 축별 신뢰도 4단계 시각화 (점선/회색/재측정 CTA)
- PNG 공유 + 익명 모드 + Dynamic OG 링크
- 상태 분기: 통합 세션 있음 → 압축 카드 / 없음 → 진입 카드 (기존)

### 현재 목표 (Phase 1.5 첫 출시)

70% — PNG 공유와 익명 모드는 우선, OG 링크는 Phase 1.6으로 연기 가능.

---

## 1. 컴포넌트 인터페이스

### 1.1 새 파일

```
apps/web/
├── components/profile/
│   ├── ProfileCard.tsx                # 메인 카드
│   ├── AxisChip.tsx                   # 축 칩 (PC/S/C/H/M)
│   ├── IdentitySentence.tsx           # 한 줄 정체성 문장
│   ├── ProfileCardShareButton.tsx     # PNG 공유 + 익명 토글
│   └── index.ts
├── lib/profile/
│   ├── identity-sentence.ts           # 한 줄 문장 생성 알고리즘
│   ├── confidence-level.ts            # 신뢰도 점수 → 레벨 매핑
│   ├── mood-mapping.ts                # 체형/톤 → 무드 키워드
│   └── index.ts
└── app/(main)/home/_components/
    └── ProfileCardSection.tsx         # 홈 통합 진입점 (상태 분기)
```

### 1.2 ProfileCard 인터페이스

```typescript
import type { SeasonType, BodyType3, SkinType, FaceShape, HairType } from '@yiroom/shared';

export interface IntegratedProfileSummary {
  sessionId: string;
  pc: { season: SeasonType; tone: string; confidence: number };
  skin: { type: SkinType; confidence: number };
  body: { type: BodyType3; confidence: number };
  hair: { faceShape: FaceShape; type: HairType; confidence: number };
  makeup: { mood: string }; // PC+S 파생, 자체 신뢰도 없음
  analyzedAt: string;
}

export interface ProfileCardProps {
  summary: IntegratedProfileSummary;
  onAxisRetake?: (axis: 'pc' | 'skin' | 'body' | 'hair') => void;
  onShare?: () => void;
  onMore?: () => void;
  className?: string;
}
```

### 1.3 ProfileCardSection (홈 진입점) 분기

```typescript
// 통합 세션 존재 → 압축 카드
// 없음 → 기존 IntegratedSessionPromptCard
export default function ProfileCardSection() {
  const { data, isLoading } = useLatestIntegratedSession();
  const isFlagOn = FEATURE_FLAGS.PROFILE_CARD_PHASE_1_5;

  if (!isFlagOn) return <IntegratedSessionPromptCard />;
  if (isLoading) return <ProfileCardSkeleton />;
  if (!data?.completed) return <IntegratedSessionPromptCard />;
  return <ProfileCard summary={toSummary(data)} ... />;
}
```

---

## 2. 한 줄 정체성 문장 알고리즘

### 2.1 매핑 테이블

```typescript
// lib/profile/mood-mapping.ts

export const MOOD_BY_BODY: Record<BodyType3, readonly string[]> = {
  S: ['미니멀', '모던', '클린'],
  W: ['페미닌', '클래식', '로맨틱'],
  N: ['캐주얼', '내추럴', '보헤미안'],
} as const;

export const MOOD_BY_TONE: Record<string, string> = {
  Light: '미니멀',
  Bright: '발랄',
  True: '클래식',
  Mute: '잔잔',
  Deep: '시크',
} as const;

export const SEASON_KO: Record<SeasonType, string> = {
  Spring: '봄',
  Summer: '여름',
  Autumn: '가을',
  Winter: '겨울',
};
```

### 2.2 생성 함수

```typescript
// lib/profile/identity-sentence.ts

export function generateIdentitySentence(s: IntegratedProfileSummary): string {
  // 1. 신뢰도 매우 낮음 fallback
  if (s.pc.confidence < 60 && s.body.confidence < 60) {
    return '이룸과 함께 시작하기';
  }
  if (s.pc.confidence < 60) {
    // 시즌 모름 → 체형 무드만
    const mood = MOOD_BY_BODY[s.body.type][0];
    return `${mood} 스타일러`;
  }

  const seasonLabel = `${SEASON_KO[s.pc.season]} ${s.pc.tone}`;

  // 2. 체형 신뢰도 낮음 → 시즌만
  if (s.body.confidence < 60) {
    return `${seasonLabel}의 스타일러`;
  }

  // 3. 정상: 톤 형용사가 체형 무드 풀에 있으면 우선, 아니면 풀의 첫 번째
  const moodPool = MOOD_BY_BODY[s.body.type];
  const toneAdj = MOOD_BY_TONE[s.pc.tone];
  const mood = moodPool.includes(toneAdj as never) ? toneAdj : moodPool[0];

  return `${seasonLabel}의 ${mood} 스타일러`;
}
```

### 2.3 i18n

문장은 `messages/ko.json` `profileCard.identitySentence` 네임스페이스에:

```json
{
  "profileCard": {
    "identitySentence": "{seasonLabel}의 {mood} 스타일러",
    "fallbackNoSeason": "{mood} 스타일러",
    "fallbackNoBody": "{seasonLabel}의 스타일러",
    "fallbackBoth": "이룸과 함께 시작하기"
  }
}
```

영/일/중도 동일 키로 번역 (출시 직후 i18n 정비 시 확장).

---

## 3. 신뢰도 시각화

### 3.1 레벨 매핑

```typescript
// lib/profile/confidence-level.ts

export type ConfidenceLevel = 'high' | 'medium' | 'low' | 'very_low';

export function toConfidenceLevel(score: number, usedFallback?: boolean): ConfidenceLevel {
  if (usedFallback) return 'very_low';
  if (score >= 85) return 'high';
  if (score >= 70) return 'medium';
  if (score >= 60) return 'low';
  return 'very_low';
}
```

### 3.2 시각화 매트릭스

| 레벨     | 점 표기 | 테두리 | 색상       | 재측정 CTA |
| -------- | ------- | ------ | ---------- | ---------- |
| high     | ●●●●●   | solid  | foreground | 없음       |
| medium   | ●●●●○   | solid  | foreground | 없음       |
| low      | ●●●○○   | solid  | muted      | 옵션 칩    |
| very_low | ●●○○○   | dashed | muted-fg   | "재측정"   |

### 3.3 카드 전체 평균 신뢰도

```typescript
const avg = (s.pc.confidence + s.skin.confidence + s.body.confidence + s.hair.confidence) / 4;
if (avg < 60) {
  // 카드 상단에 "재측정으로 정확도 향상하기" 배너
}
```

---

## 4. 공유 (PNG + Dynamic OG)

### 4.1 PNG 변환

```typescript
// 기존 useAnalysisShare 훅 패턴 재활용 (lib/share/useAnalysisShare.ts)
import { useAnalysisShare, createIntegratedProfileShareData } from '@/hooks/useAnalysisShare';

const shareData = createIntegratedProfileShareData(summary, {
  anonymous: isAnonymous, // 토글 상태
  format: '1:1', // 또는 '9:16' 스토리
});
const { share } = useAnalysisShare(shareData, '이룸-나-프로필');
```

### 4.2 PNG 사양

- 1:1 = 1080×1080 (인스타 피드)
- 9:16 = 1080×1920 (스토리)
- 폰트: Pretendard / Noto Sans KR
- 그라디언트: 시즌별 (봄=핑크, 여름=라벤더, 가을=캐멀, 겨울=쿨그레이)
- 익명 모드: 닉네임 → "이룸 사용자", 프로필 사진 숨김

### 4.3 Dynamic OG 링크 (Phase 1.6 스코프)

`/profile/share/[sessionId]` 라우트 신규. 메타 OG 카드 자동 생성.
**Phase 1.5 첫 출시에선 PNG만, OG는 1.6으로 연기 가능.**

---

## 5. 데이터 소스

### 5.1 기존 hook 재활용

```typescript
// 이미 구현됨: hooks/useLatestIntegratedSession
// 통합 세션 + 5축 결과를 한 번에 가져옴
const { data, isLoading } = useLatestIntegratedSession();
// data: { sessionId, status, axes: { pc, skin, body, hair, makeup }, ... }
```

### 5.2 변환 어댑터

```typescript
// lib/profile/index.ts
export function toIntegratedProfileSummary(session: IntegratedSession): IntegratedProfileSummary {
  return {
    sessionId: session.id,
    pc: {
      season: session.axes.pc.season,
      tone: session.axes.pc.tone,
      confidence: session.axes.pc.confidence,
    },
    skin: { type: session.axes.skin.type, confidence: session.axes.skin.confidence },
    body: { type: session.axes.body.type, confidence: session.axes.body.confidence },
    hair: {
      faceShape: session.axes.hair.faceShape,
      type: session.axes.hair.type,
      confidence: session.axes.hair.confidence,
    },
    makeup: { mood: session.persona?.makeupMood ?? '데일리' },
    analyzedAt: session.completedAt,
  };
}
```

---

## 6. FEATURE_FLAGS

```typescript
// packages/shared/src/feature-flags/index.ts

export const FEATURE_FLAGS = {
  WELLNESS_PHASE2: false,
  CLOSET_INTEGRATION: false,
  PROFILE_CARD_PHASE_1_5: false, // ← 신규. 출시 후 4~8주 내 true 전환
} as const;
```

`false` 상태에선 기존 `IntegratedSessionPromptCard`만 노출 — 출시 영향 0.

---

## 7. 테스트 계획

| 테스트                      | 대상                            | 케이스 수 |
| --------------------------- | ------------------------------- | --------- |
| identity-sentence.test.ts   | 알고리즘 (정상/fallback 4가지)  | ~12       |
| confidence-level.test.ts    | 점수 → 레벨 매핑                | ~5        |
| ProfileCard.test.tsx        | 렌더링 + axis 클릭/공유 콜백    | ~8        |
| AxisChip.test.tsx           | 신뢰도 레벨별 시각화            | ~4        |
| ProfileCardSection.test.tsx | 상태 분기 (세션 유/무 + 플래그) | ~4        |

총 ~33 테스트.

---

## 8. 출시 영향

### 8.1 코드 변경 (Phase 1.5 착수 시)

- 신규 컴포넌트 5개 + lib 3개 + 홈 통합 1개
- `FEATURE_FLAGS.PROFILE_CARD_PHASE_1_5 = true` 전환
- i18n 4언어 (`profileCard.*`) 추가

### 8.2 출시 직전 영향 (지금)

**0** — Phase 1.5 코드는 아직 작성되지 않음. 본 SDD는 설계 초안.

### 8.3 의존성

- 통합 분석 플로우 implemented ✅ (이미 완료)
- `useLatestIntegratedSession` hook 존재 ✅
- 공유 인프라 (`useAnalysisShare`) 존재 ✅

→ 신규 인프라 없음, 출시 후 안정화 4주 뒤 즉시 착수 가능.

---

## 9. 미해결 항목

| 항목                                   | 결정 시점 | 비고                                        |
| -------------------------------------- | --------- | ------------------------------------------- |
| 카드 위치 (홈 최상단 vs Active만)      | Phase 1.5 | 통합 세션 완료한 사용자만 노출이 자연스러움 |
| 위젯 정렬 가능 여부 (`useWidgetOrder`) | Phase 1.5 | 다른 위젯과 함께 정렬 가능하게 추가할지     |
| 다중 세션 (재분석 시 어느 카드)        | Phase 1.5 | 최신 세션만 노출 (현재 hook 기본값)         |
| 모바일 포팅                            | Phase 1.6 | ADR-102 패턴 따라 별도 SDD 작성 후 진행     |

---

## 10. 관련 문서

- [ADR-098](../adr/ADR-098-identity-redefinition-5axis-model.md) §6 R1 — 본 SDD의 발생 근거
- [SDD-INTEGRATED-ANALYSIS](SDD-INTEGRATED-ANALYSIS.md) — 데이터 소스
- [SDD-INTEGRATED-RESULT-UI](SDD-INTEGRATED-RESULT-UI.md) — 결과 페이지와 카드 분리 정책
- [profile-card-phase-1.5-research](../research/profile-card-phase-1.5-research.md) — 정보 밀도/신뢰도/공유 리서치

---

**Version**: 0.1 (초안) | **다음 단계**: Phase 1.5 착수 시 v1.0으로 격상 + 와이어프레임 디테일 + 모바일 포팅 SDD 작성
