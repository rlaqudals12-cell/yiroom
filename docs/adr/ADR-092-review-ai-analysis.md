# ADR-092: 리뷰 AI 분석 시스템

## 상태

`accepted`

## 날짜

2026-03-15

## 0. 궁극의 형태 (P1)

### 이상적 최종 상태

"모든 제품의 리뷰가 자동으로 분석되어 긍정/부정 키워드, 감정 분포, 핵심 요약이 실시간으로 제공되고, 사용자가 리뷰를 읽지 않아도 제품의 장단점을 즉시 파악할 수 있는 상태"

### 물리적 한계

| 항목         | 한계                                          |
| ------------ | --------------------------------------------- |
| AI 호출 비용 | Gemini 3 Flash 호출 비용 (리뷰 50개당 ~$0.01) |
| 분석 지연    | 실시간 분석 시 1-3초 대기                     |
| 리뷰 수 부족 | 초기 제품은 리뷰 < 5개로 분석 정확도 낮음     |

### 100점 기준

| 지표          | 100점     | 현재        | 목표                     |
| ------------- | --------- | ----------- | ------------------------ |
| 키워드 정확도 | 95%+      | 0% (미구현) | 80%+                     |
| 응답 시간     | < 500ms   | N/A         | < 2s (캐시 히트 < 100ms) |
| 커버리지      | 100% 제품 | 0%          | 리뷰 5개+ 제품           |

### 현재 목표: 85%

### 의도적 제외

- 다국어 리뷰 분석 (한국어만 지원)
- 가짜 리뷰 탐지 (향후 확장)
- 리뷰 자동 응답 생성

## 1. 컨텍스트

제품 리뷰 CRUD와 UI(ReviewSection, ReviewAIKeywords, ReviewSentimentFilter)가 이미 완성되어 있으나, AI 기반 리뷰 분석 백엔드가 없어 Mock 데이터를 사용 중. 사용자가 리뷰를 일일이 읽어야 제품 평가 파악 가능.

## 2. 결정

**리뷰 트리거 + 24시간 캐싱** 방식 채택.

### 분석 트리거

- 사용자가 제품 상세 페이지에서 "AI 분석" 섹션 조회 시
- 캐시 미스(24시간 만료) 시에만 Gemini 호출
- 리뷰 5개 미만이면 분석 불가 처리

### 캐싱 전략

- DB 테이블: `product_review_ai_cache`
- TTL: 24시간 (리뷰 변동 반영)
- 키: (product_id, product_type) UNIQUE

### AI 프롬프트 출력 구조

```typescript
interface ReviewAISummary {
  positiveKeywords: { text: string; count: number }[]; // TOP 5
  negativeKeywords: { text: string; count: number }[]; // TOP 5
  summary: string; // 1-2문장 핵심 요약
  pros: string[]; // 추천 포인트 3개
  cons: string[]; // 주의 포인트 2개
  overallSentiment: 'positive' | 'mixed' | 'negative';
  analyzedCount: number; // 분석한 리뷰 수
}
```

## 3. 대안 검토

| 대안                      | 장점                          | 단점                                          | 결정     |
| ------------------------- | ----------------------------- | --------------------------------------------- | -------- |
| **A. 배치(Cron)**         | 서버 부하 예측 가능           | 실시간성 없음, 비용 낭비 (미조회 제품도 분석) | 탈락     |
| **B. 실시간**             | 최신 리뷰 반영                | AI 호출 비용 폭발, 응답 지연                  | 탈락     |
| **C. 리뷰 트리거 + 캐싱** | 조회 시에만 비용, 24시간 캐싱 | 첫 조회 시 지연                               | **채택** |

## 4. 관련 문서

- [ReviewAIKeywords.tsx](../../apps/web/components/products/reviews/ReviewAIKeywords.tsx) - UI 타입 계약
- [reviews.ts](../../apps/web/lib/products/services/reviews.ts) - 리뷰 CRUD
- [ADR-007](./ADR-007-mock-fallback-strategy.md) - Mock Fallback 전략

---

**Version**: 1.0 | **Author**: Claude Code
