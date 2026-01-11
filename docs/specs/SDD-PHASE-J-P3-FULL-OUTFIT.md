# Phase J P3: 전체 코디 생성 스펙

> **Status**: ✅ Completed
> **Created**: 2026-01-11
> **Completed**: 2026-01-11
> **Author**: Claude Code
> **Phase**: J-P3 (전체 코디)
> **Depends on**: Phase J P1 (색상 조합), P2 (악세서리/메이크업)
> **Tests**: FullOutfit 14개, OutfitShare 11개

---

## 1. 개요

### 1.1 목적

PC-1 분석 결과를 기반으로 의상 + 악세서리 + 메이크업이 통합된 전체 코디를 생성하고, 다양한 상황(데일리/출근/데이트)에 맞는 완성형 스타일링을 제공한다.

### 1.2 배경

- P1: 색상 조합 추천 (상의+하의) 완료
- P2: 악세서리/메이크업 추천 완료
- P3: 위 요소들을 하나의 완성된 코디로 통합

### 1.3 범위

| 기능               | 적용 모듈 | 우선순위 |
| ------------------ | --------- | -------- |
| 전체 코디 조합     | PC-1 통합 | P3-A     |
| 상황별 코디 프리셋 | PC-1      | P3-A     |
| 코디 저장/공유     | PC-1      | P3-B     |
| 코디 히스토리      | PC-1      | P3-C     |

---

## 2. 요구사항

### 2.1 기능 요구사항

| ID   | 요구사항                                     | 우선순위 |
| ---- | -------------------------------------------- | -------- |
| F-01 | 전체 코디 조합 생성 (의상+악세서리+메이크업) | Must     |
| F-02 | 상황별 프리셋 (데일리/출근/데이트/파티)      | Must     |
| F-03 | 코디 저장 기능                               | Should   |
| F-04 | 코디 공유 (이미지 생성)                      | Could    |
| F-05 | 코디 히스토리 조회                           | Could    |

### 2.2 비기능 요구사항

| ID    | 요구사항              | 기준               |
| ----- | --------------------- | ------------------ |
| NF-01 | 추천 응답 시간        | 즉시 (Mock 데이터) |
| NF-02 | 접근성                | data-testid 필수   |
| NF-03 | 반응형                | 모바일 우선        |
| NF-04 | P1/P2 컴포넌트 재사용 | 80% 이상           |

---

## 3. 아키텍처

### 3.1 컴포넌트 구조

```
components/styling/
├── ColorCombination.tsx      # P1 - 기존
├── WorkoutStyling.tsx        # P1 - 기존
├── AccessoryStyling.tsx      # P2 - 기존
├── MakeupStyling.tsx         # P2 - 기존
├── FullOutfit.tsx            # P3-A 신규
│   ├── OutfitBuilder         # 코디 조합 빌더
│   ├── OutfitPresetCard      # 상황별 프리셋 카드
│   └── FullOutfitPreview     # 전체 코디 미리보기
├── OutfitSaver.tsx           # P3-B 신규 (저장/공유)
└── index.ts                  # 통합 export
```

### 3.2 페이지 구조

```
/outfit 페이지 (신규)
├── [시즌 선택] 헤더
├── [상황 선택] 탭
│   ├── 데일리
│   ├── 출근
│   ├── 데이트
│   └── 파티
├── [전체 코디 미리보기]
│   ├── 의상 (상의+하의)
│   ├── 악세서리 (금속+보석)
│   └── 메이크업 (립+아이+블러셔)
└── [액션 버튼]
    ├── 새 코디 생성
    ├── 저장
    └── 공유
```

---

## 4. UI 설계

### 4.1 전체 코디 페이지

```
┌─────────────────────────────────────────┐
│  👗 전체 코디 추천                       │
├─────────────────────────────────────────┤
│  [봄 웜톤] 시즌 배지                      │
├─────────────────────────────────────────┤
│                                         │
│  상황 선택:                              │
│  [데일리] [출근] [데이트] [파티]          │
│                                         │
├─────────────────────────────────────────┤
│                                         │
│  ┌─────────────────────────────────┐    │
│  │        전체 코디 미리보기         │    │
│  ├─────────────────────────────────┤    │
│  │                                 │    │
│  │   👕 의상                        │    │
│  │   ┌─────┐  ┌─────┐              │    │
│  │   │상의 │  │하의 │              │    │
│  │   │코랄 │  │베이지│              │    │
│  │   └─────┘  └─────┘              │    │
│  │                                 │    │
│  │   💎 악세서리                    │    │
│  │   골드 귀걸이 + 코랄 펜던트       │    │
│  │                                 │    │
│  │   💄 메이크업                    │    │
│  │   립: 코랄 핑크 / 아이: 피치      │    │
│  │   블러셔: 살몬                   │    │
│  │                                 │    │
│  └─────────────────────────────────┘    │
│                                         │
│  💡 따뜻한 톤으로 화사한 봄 느낌 완성!   │
│                                         │
│  [🔄 새 코디]  [💾 저장]  [📤 공유]      │
│                                         │
└─────────────────────────────────────────┘
```

---

## 5. 데이터 모델

### 5.1 전체 코디 타입

```typescript
// types/styling.ts 확장

export type OutfitOccasion = 'daily' | 'work' | 'date' | 'party';

export interface FullOutfit {
  id: string;
  seasonType: SeasonType;
  occasion: OutfitOccasion;
  clothing: ColorCombination;
  accessory: {
    metalTone: MetalTone;
    items: AccessoryItem[];
  };
  makeup: {
    lipstick: MakeupColor;
    eyeshadow: MakeupColor[];
    blusher: MakeupColor;
  };
  tip: string;
  createdAt?: Date;
}

export interface OutfitPreset {
  occasion: OutfitOccasion;
  name: string;
  description: string;
  outfits: FullOutfit[];
}
```

---

## 6. Mock 데이터 구조

### 6.1 전체 코디 프리셋

```typescript
// lib/mock/styling.ts 확장

export const OUTFIT_PRESETS: Record<SeasonType, OutfitPreset[]> = {
  spring: [
    {
      occasion: 'daily',
      name: '화사한 봄 데일리',
      description: '따뜻하고 밝은 일상 스타일',
      outfits: [
        {
          id: 'spring-daily-full-1',
          seasonType: 'spring',
          occasion: 'daily',
          clothing: COLOR_COMBINATIONS.spring[0], // 코랄+베이지
          accessory: {
            metalTone: 'gold',
            items: ACCESSORY_STYLING.spring.items.slice(0, 2),
          },
          makeup: {
            lipstick: MAKEUP_STYLING.spring.lipstick.colors[0],
            eyeshadow: MAKEUP_STYLING.spring.eyeshadow.colors.slice(0, 2),
            blusher: MAKEUP_STYLING.spring.blusher.colors[0],
          },
          tip: '코랄 톤으로 통일감 있게 연출하세요',
        },
      ],
    },
    // work, date, party...
  ],
  // summer, autumn, winter...
};
```

---

## 7. 구현 계획

### 7.1 파일 변경 목록

| 파일                                           | 유형 | 설명               |
| ---------------------------------------------- | ---- | ------------------ |
| `components/styling/FullOutfit.tsx`            | 신규 | 전체 코디 컴포넌트 |
| `app/(main)/outfit/page.tsx`                   | 신규 | 전체 코디 페이지   |
| `lib/mock/styling.ts`                          | 수정 | 프리셋 데이터 추가 |
| `types/styling.ts`                             | 수정 | 타입 정의 확장     |
| `components/styling/index.ts`                  | 수정 | export 추가        |
| `tests/components/styling/FullOutfit.test.tsx` | 신규 | 테스트             |

### 7.2 구현 순서

```
Step 1: 타입 정의 확장 (FullOutfit, OutfitPreset)
Step 2: Mock 데이터 확장 (OUTFIT_PRESETS)
Step 3: FullOutfit 컴포넌트 구현
Step 4: 전체 코디 페이지 생성
Step 5: 테스트 작성
Step 6: 커밋
```

### 7.3 예상 작업량

| 항목                | 예상 코드량 |
| ------------------- | ----------- |
| 타입 정의 확장      | ~30줄       |
| Mock 데이터 확장    | ~150줄      |
| FullOutfit 컴포넌트 | ~200줄      |
| 전체 코디 페이지    | ~150줄      |
| 테스트              | ~100줄      |
| **총합**            | ~630줄      |

---

## 8. 테스트 계획

### 8.1 단위 테스트

```typescript
describe('FullOutfit', () => {
  it('renders full outfit preview', () => {});
  it('shows clothing section', () => {});
  it('shows accessory section', () => {});
  it('shows makeup section', () => {});
});

describe('OutfitPresetCard', () => {
  it('renders preset name and description', () => {});
  it('shows occasion badge', () => {});
});
```

---

## 9. 변경 이력

| 버전 | 날짜       | 변경 내용 |
| ---- | ---------- | --------- |
| 0.1  | 2026-01-11 | 초안 작성 |

---

**Status**: Ready for Implementation
