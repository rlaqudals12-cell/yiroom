# Phase D: AI 피부 상담 스펙

> **Status**: Draft
> **Created**: 2026-01-11
> **Author**: Claude Code
> **Phase**: D (AI 피부 상담)
> **Depends on**: S-1 (피부 분석), Product DB, RAG 시스템

---

## 1. 개요

### 1.1 목적

S-1 피부 분석 결과를 기반으로 사용자 맞춤형 피부 상담을 제공하는 AI 챗봇 기능을 구현한다. 피부 고민 Q&A, 제품 추천, 스킨케어 루틴 제안 등을 대화형으로 지원한다.

### 1.2 배경

- S-1 피부 분석 완료 후 "다음 단계"가 부족
- 사용자가 분석 결과를 어떻게 활용해야 하는지 가이드 필요
- 제품 추천과 분석 결과 연결 강화

### 1.3 범위

| 기능               | 적용 모듈 | 우선순위 |
| ------------------ | --------- | -------- |
| 피부 상담 챗 UI    | S-1 통합  | D-1      |
| 고민 기반 Q&A      | S-1       | D-1      |
| 제품 추천 연동     | Product   | D-2      |
| 스킨케어 루틴 제안 | S-1       | D-2      |

---

## 2. 요구사항

### 2.1 기능 요구사항

| ID   | 요구사항                       | 우선순위 |
| ---- | ------------------------------ | -------- |
| F-01 | 피부 상담 채팅 인터페이스      | Must     |
| F-02 | S-1 분석 결과 기반 맞춤 응답   | Must     |
| F-03 | 피부 고민 카테고리별 빠른 질문 | Must     |
| F-04 | 제품 추천 카드 인라인 표시     | Should   |
| F-05 | 대화 히스토리 저장             | Could    |

### 2.2 비기능 요구사항

| ID    | 요구사항      | 기준            |
| ----- | ------------- | --------------- |
| NF-01 | 응답 시간     | 3초 이내 (Mock) |
| NF-02 | 모바일 최적화 | 터치 친화적 UI  |

---

## 3. 아키텍처

### 3.1 컴포넌트 구조

```
components/skin-consultation/
├── SkinConsultationChat.tsx     # 메인 채팅 컴포넌트
├── ChatMessage.tsx              # 메시지 버블
├── QuickQuestions.tsx           # 빠른 질문 버튼
├── ProductCard.tsx              # 인라인 제품 카드
└── index.ts                     # 통합 export
```

### 3.2 데이터 흐름

```
사용자 질문 입력
    ↓
S-1 분석 결과 로드 (Context)
    ↓
Mock 응답 생성 (피부타입 + 고민 기반)
    ↓
응답 렌더링 (텍스트 + 제품 추천)
```

### 3.3 Mock 데이터 전략

Phase D-1은 Mock 기반 응답:

```typescript
// lib/mock/skin-consultation.ts
export const SKIN_CONSULTATION_RESPONSES: Record<SkinConcern, ConsultationResponse[]>;

// 고민 카테고리
type SkinConcern = 'dryness' | 'oiliness' | 'acne' | 'wrinkles' | 'pigmentation' | 'sensitivity';
```

---

## 4. UI 설계

### 4.1 메인 레이아웃

```
┌─────────────────────────────────┐
│ ← 피부 상담                      │ Header
├─────────────────────────────────┤
│ 분석 결과 요약 카드              │
│ ┌───────────────────────────┐  │
│ │ 건성 피부 / 수분 부족       │  │
│ │ 주요 고민: 건조함, 잔주름   │  │
│ └───────────────────────────┘  │
├─────────────────────────────────┤
│                                 │
│  🤖 안녕하세요! 피부 상담을     │
│     도와드릴게요.               │
│                                 │
│  💬 건조함이 심해요            │ User
│                                 │
│  🤖 건성 피부이시네요.          │
│     보습 강화가 필요합니다.     │
│     ┌──────────────────┐       │
│     │ 추천: 히알루론산   │       │ Product Card
│     │ 세럼              │       │
│     └──────────────────┘       │
│                                 │
├─────────────────────────────────┤
│ [건조함] [모공] [잔주름] [트러블]│ Quick Q
├─────────────────────────────────┤
│ 메시지 입력...            [전송]│ Input
└─────────────────────────────────┘
```

### 4.2 빠른 질문 카테고리

| 고민        | 질문 예시                    |
| ----------- | ---------------------------- |
| 건조함      | "보습력 높은 제품 추천해줘"  |
| 모공        | "모공 관리 어떻게 해야 해?"  |
| 잔주름      | "안티에이징 루틴 알려줘"     |
| 트러블      | "여드름에 좋은 성분이 뭐야?" |
| 민감성      | "자극 없는 제품 뭐가 있어?"  |
| 잡티/칙칙함 | "피부 톤 밝아지는 방법"      |

---

## 5. 타입 정의

```typescript
// types/skin-consultation.ts

/** 피부 고민 카테고리 */
export type SkinConcern =
  | 'dryness'
  | 'oiliness'
  | 'acne'
  | 'wrinkles'
  | 'pigmentation'
  | 'sensitivity'
  | 'pores'
  | 'general';

/** 채팅 메시지 */
export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  productRecommendations?: ProductRecommendation[];
}

/** 제품 추천 */
export interface ProductRecommendation {
  id: string;
  name: string;
  brand: string;
  category: string;
  imageUrl?: string;
  reason: string; // 추천 이유
}

/** 빠른 질문 */
export interface QuickQuestion {
  concern: SkinConcern;
  label: string;
  question: string;
}

/** 상담 응답 템플릿 */
export interface ConsultationResponse {
  concern: SkinConcern;
  skinType?: string; // 특정 피부 타입용
  messages: string[];
  tips: string[];
  ingredients: string[]; // 추천 성분
}
```

---

## 6. 구현 계획

### D-1: 기본 상담 UI (Must)

1. 타입 정의 추가
2. Mock 응답 데이터 작성
3. SkinConsultationChat 컴포넌트
4. ChatMessage 컴포넌트
5. QuickQuestions 컴포넌트
6. /skin-consultation 페이지
7. S-1 결과 연동
8. 테스트

### D-2: 제품 추천 연동 (Should)

1. ProductCard 인라인 컴포넌트
2. 제품 DB 연동
3. 피부타입 기반 필터링

---

## 7. 테스트 계획

| 테스트 케이스         | 검증 내용                   |
| --------------------- | --------------------------- |
| 채팅 UI 렌더링        | 메시지 버블, 입력창 표시    |
| 빠른 질문 클릭        | 질문 전송 및 응답 표시      |
| S-1 결과 없음 처리    | 분석 유도 메시지 표시       |
| 제품 추천 카드 렌더링 | 카드 클릭 시 제품 상세 이동 |

---

**Version**: 1.0 | **Updated**: 2026-01-11
