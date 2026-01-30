# ADR-029: 어필리에이트 통합 아키텍처

## 상태

`accepted`

## 날짜

2026-01-19

## 0. 궁극의 형태 (P1)

### 이상적 최종 상태

"사용자의 분석 결과에 완벽히 맞는 제품이 원클릭으로 구매까지 연결되는 상태"

- **완벽한 매칭**: 분석 결과 기반 100% 정확한 제품 추천
- **실시간 가격/재고**: 파트너사 데이터와 실시간 동기화
- **원클릭 구매**: 앱 내에서 결제까지 완료 (파트너 연동)
- **자동 수익 최적화**: AI가 전환율 높은 제품 자동 노출

### 물리적 한계

| 항목 | 한계 |
|------|------|
| 파트너 API 의존 | 각 파트너 API 정책/응답 시간에 종속 |
| 가격 정확도 | 파트너 데이터 지연으로 실시간 가격 불일치 가능 |
| 재고 확인 | 대부분 파트너 API에서 재고 정보 미제공 |
| 전환 추적 | 쿠키 차단, 앱 전환 시 추적 손실 |

### 100점 기준

| 지표 | 100점 기준 | 현재 | 비고 |
|------|-----------|------|------|
| 매칭 정확도 | 90%+ 사용자 만족 | 75% | 속성 기반 추천 |
| 데이터 신선도 | 실시간 | 24시간 | 배치 동기화 |
| 파트너 커버리지 | 20+ 파트너 | 3 파트너 | 쿠팡, iHerb, 무신사 |
| 전환 추적 정확도 | 95%+ | 80% | 앱 전환 손실 |

### 현재 목표: 75%

### 의도적 제외

| 제외 항목 | 이유 | 재검토 시점 |
|----------|------|------------|
| 앱 내 결제 | 파트너 정책 제약 (ALT_SUFFICIENT) | 파트너 협의 시 |
| 실시간 가격 동기화 | API 호출 비용 (FINANCIAL_HOLD) | MAU 증가 후 협상 |
| AI 수익 최적화 | 데이터 축적 필요 (NOT_READY) | 전환 데이터 6개월+ |
| 해외 파트너 확대 | 법적 검토 필요 (LEGAL_REVIEW) | 글로벌 확장 시 |

---

## 맥락 (Context)

이룸은 분석 결과 기반으로 제품을 추천하고, 어필리에이트 수익을 창출하는 기능이 필요합니다.

### 요구사항

1. **멀티 파트너**: 쿠팡, iHerb, 무신사 등 다양한 파트너
2. **제품 매칭**: 피부타입, 퍼스널컬러, 체형에 맞는 제품 추천
3. **클릭/전환 추적**: 어필리에이트 성과 측정
4. **딥링크 생성**: 파트너별 추적 링크 생성

## 결정 (Decision)

**통합 어필리에이트 시스템** 아키텍처 채택:

```
┌─────────────────────────────────────────────────────────────┐
│                  어필리에이트 아키텍처                        │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  파트너 통합                                                  │
│  ├── Coupang Partners API                                   │
│  ├── iHerb Affiliate API                                    │
│  └── Musinsa Partner API                                    │
│                                                              │
│  제품 데이터베이스                                            │
│  ├── affiliate_products: 제품 정보                          │
│  │   ├── 기본 정보 (이름, 가격, 이미지)                     │
│  │   ├── 매칭 속성 (피부타입, 퍼스널컬러, 체형)             │
│  │   └── 파트너 정보 (딥링크, 커미션율)                     │
│  └── affiliate_clicks: 클릭 추적                            │
│                                                              │
│  API 엔드포인트                                               │
│  ├── GET /api/affiliate/products     # 제품 조회            │
│  ├── POST /api/affiliate/deeplink    # 딥링크 생성          │
│  ├── POST /api/affiliate/click       # 클릭 기록            │
│  ├── POST /api/affiliate/conversion  # 전환 기록            │
│  ├── GET /api/affiliate/stats        # 통계 조회            │
│  └── POST /api/affiliate/*/sync      # 파트너별 동기화      │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

### 제품 매칭 로직

```typescript
interface AffiliateProductFilter {
  // 피부 분석 기반
  skinTypes?: ('dry' | 'oily' | 'combination' | 'normal' | 'sensitive')[];
  skinConcerns?: ('acne' | 'wrinkle' | 'pigmentation' | 'redness')[];

  // 퍼스널컬러 기반
  personalColors?: ('spring' | 'summer' | 'autumn' | 'winter')[];

  // 체형 기반
  bodyTypes?: ('hourglass' | 'apple' | 'pear' | 'rectangle')[];

  // 일반 필터
  category?: string;
  minPrice?: number;
  maxPrice?: number;
  minRating?: number;
}
```

### 딥링크 생성

```typescript
// 파트너별 딥링크 형식
const DEEPLINK_TEMPLATES = {
  coupang: 'https://link.coupang.com/re/AFFILIATE?itemId={productId}&subId={trackingId}',
  iherb: 'https://iherb.com/{productPath}?rcode={affiliateCode}&utm={trackingId}',
  musinsa: 'https://www.musinsa.com/app/goods/{productId}?utm_source=yiroom&utm_medium={trackingId}',
};
```

## 대안 (Alternatives Considered)

| 대안 | 장점 | 단점 | 제외 사유 |
|------|------|------|----------|
| 각 파트너 직접 연동만 | 단순 구현 | 제품 검색/필터 어려움 | `LOW_ROI` - UX 저하 |
| 외부 어필리에이트 플랫폼 | 관리 위임 | 커미션 공유, 종속 | `FINANCIAL_HOLD` - 수익 감소 |
| 자체 커머스 | 직접 판매 | 재고/배송 관리 | `HIGH_COMPLEXITY` - 범위 초과 |

## 결과 (Consequences)

### 긍정적 결과

- **개인화 추천**: 분석 결과 기반 정확한 매칭
- **수익 창출**: 어필리에이트 커미션
- **사용자 경험**: 원클릭 구매 연결

### 부정적 결과

- **파트너 의존성**: API 변경 시 대응 필요
- **데이터 동기화**: 가격/재고 불일치 가능

### 리스크

- 파트너 API 중단 → **캐싱 + 대체 파트너 자동 전환**

## 구현 가이드

### 파일 구조

```
app/api/affiliate/
├── products/route.ts        # 제품 조회
├── deeplink/route.ts        # 딥링크 생성
├── click/route.ts           # 클릭 기록
├── conversion/route.ts      # 전환 기록
├── stats/route.ts           # 통계
├── coupang/
│   ├── search/route.ts      # 쿠팡 검색
│   └── sync/route.ts        # 쿠팡 동기화
├── iherb/
│   ├── search/route.ts
│   └── sync/route.ts
└── musinsa/
    ├── search/route.ts
    └── sync/route.ts

lib/affiliate/
├── index.ts                 # 통합 export
├── products.ts              # 제품 CRUD
├── deeplink.ts              # 딥링크 생성
├── tracking.ts              # 클릭/전환 추적
└── partners/
    ├── coupang.ts           # 쿠팡 API
    ├── iherb.ts             # iHerb API
    └── musinsa.ts           # 무신사 API
```

### 광고 표시 의무 (법적 준수)

```typescript
// 모든 어필리에이트 제품에 광고 표시 필수
const AD_DISCLAIMER = '이 제품은 제휴 마케팅을 통해 수수료를 받을 수 있습니다.';

// UI에 "AD" 라벨 표시
<Badge variant="outline" className="text-xs">AD</Badge>
```

## 관련 문서

### 원리 문서 (과학적 기초)
- [원리: 법적 준수](../principles/legal-compliance.md) - 전자상거래법, 광고 표시 의무
- [원리: RAG 검색](../principles/rag-retrieval.md) - 제품 검색 최적화

### 관련 ADR
- [ADR-011: Cross-Module Data Flow](./ADR-011-cross-module-data-flow.md) - 분석 결과 → 제품 매칭
- [ADR-014: Caching Strategy](./ADR-014-caching-strategy.md) - 제품 데이터 캐싱

### 구현 스펙
- [SDD-MARKETING-TOGGLE-UI](../specs/SDD-MARKETING-TOGGLE-UI.md) - 마케팅 토글 UI
- [SDD-AFFILIATE-INTEGRATION](../specs/SDD-AFFILIATE-INTEGRATION.md) - 어필리에이트 통합

---

**Author**: Claude Code
**Reviewed by**: -
