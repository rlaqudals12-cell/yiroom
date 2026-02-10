# ADR-067: 어필리에이트 파트너 API 전략 및 모듈 확장

## 상태

`accepted`

## 날짜

2026-02-10

## 0. 궁극의 형태 (P1)

### 이상적 최종 상태

"모든 분석 모듈(PC-1, S-1, C-1, H-1, M-1)의 결과가 실시간 파트너 API와 연동되어, 사용자에게 가격/이미지/재고가 포함된 개인화 제품을 즉시 추천하고, 원클릭 구매로 연결되는 상태"

### 물리적 한계

| 항목               | 한계                                                       |
| ------------------ | ---------------------------------------------------------- |
| 파트너 API 가용성  | 올리브영/무신사 직접 API 미제공, 중개 네트워크 필요        |
| Amazon PA-API 폐기 | 2026-04-30 PA-API 5.0 폐기, Creators API 마이그레이션 필수 |
| iHerb API 부재     | 공식 API 없음, Skimlinks/Partnerize 등 중개사 경유 필요    |
| 이미지 저작권      | 파트너 API 없이 제품 이미지 직접 호스팅 불가               |
| 커미션 변동        | 파트너 정책에 따라 커미션율 변동 가능                      |

### 100점 기준

| 지표            | 100점 기준 | 현재                 | 목표 (Phase 1)     |
| --------------- | ---------- | -------------------- | ------------------ |
| 모듈 커버리지   | 5/5 모듈   | 3/5 (PC-1, S-1, C-1) | 5/5                |
| 제품 이미지     | 100% 보유  | 0% (null)            | 80%+               |
| 파트너 수       | 10+        | 0 (시드 데이터만)    | 2-3                |
| 실시간 가격     | 100%       | 0%                   | 파트너 API 제공 시 |
| 글로벌 커버리지 | 5개국+     | KR only              | KR + Global 1개    |

### 현재 목표: 50%

### 의도적 제외

| 제외 항목           | 사유                 | 재검토 시점        |
| ------------------- | -------------------- | ------------------ |
| 실시간 재고 연동    | 대부분 파트너 미제공 | 파트너 협의 시     |
| ML 기반 전환 최적화 | 데이터 축적 필요     | 전환 데이터 6개월+ |
| 앱 내 결제          | 파트너 정책 제약     | MAU 50K+           |
| 일본/동남아 파트너  | 한국+글로벌 우선     | 글로벌 Phase 2     |

---

## 맥락 (Context)

### 현재 상태

1. **제품 DB**: 500개 시드 제품 존재하나 `image_url`, `purchase_url` 모두 null
2. **매칭 알고리즘**: `lib/products/matching.ts`에 완성된 2축 스코어링 (도메인 0-50 + 대중성 0-50)
3. **추천 UI**: `RecommendedProducts` 컴포넌트가 PC-1, S-1, C-1만 지원. H-1, M-1 미지원
4. **타입 시스템**: `CosmeticCategory`에 헤어케어 카테고리 없음 (H-1 제품 추천 불가)
5. **어필리에이트 추적**: `lib/products/affiliate.ts`에 클릭/전환 추적 구현 완료

### 해결해야 할 문제

1. **이미지/구매 URL 부재**: 시드 데이터에 이미지 없어 UI에서 placeholder 표시
2. **H-1 헤어케어 미지원**: 타입/DB에 헤어케어 카테고리 자체가 없음
3. **M-1 메이크업 세분화 미지원**: 부위별(립/아이/파운데이션) 세밀 추천 없음
4. **파트너 API 미연동**: 모든 데이터가 정적 시드 데이터
5. **Amazon PA-API 폐기 대응**: 2026-04-30까지 Creators API 마이그레이션 필요

---

## 결정 (Decision)

### 1. 파트너 우선순위 및 API 전략

리서치 결과 기반 파트너 선정 ([AFFILIATE-API-COMPARISON-RESEARCH.md](../research/claude-ai-research/AFFILIATE-API-COMPARISON-RESEARCH.md) 참조):

| 우선순위 | 파트너                      | API 방식         | 커미션 | 커버 모듈        |
| -------- | --------------------------- | ---------------- | ------ | ---------------- |
| **P1**   | 쿠팡 파트너스               | Open API (REST)  | 3-10%  | S-1, C-1, H-1    |
| **P2**   | CJ Affiliate (Sephora 포함) | REST API         | 5-10%  | PC-1, M-1, S-1   |
| **P3**   | Amazon Creators             | OAuth 2.0 + REST | 1-10%  | 전 모듈 (글로벌) |

#### 왜 이 3개인가

- **쿠팡**: 한국 최대 이커머스. 완전한 Open API (상품 검색, 이미지, 가격, 딥링크). 스킨케어/헤어케어/운동기구 커버리지 최상
- **CJ Affiliate**: Sephora 2026 Fall 한국 진출 확정. 뷰티 특화 파트너. PC-1/M-1 메이크업 커버리지 최적
- **Amazon Creators**: PA-API 후속. 글로벌 확장 기반. iHerb 직접 API 부재로 보충제/건강식품은 Amazon이 대안

#### 제외한 파트너와 이유

| 파트너   | 제외 사유                                                           |
| -------- | ------------------------------------------------------------------- |
| 올리브영 | 직접 API 없음. Involve Asia 경유 시 13% 커미션이지만 API 제약 큼    |
| iHerb    | 공식 API 없음. 크롤링 의존은 법적 리스크                            |
| 무신사   | 패션 특화. 뷰티/헬스 커버리지 낮음. Phase 2에서 패션 확장 시 재검토 |

### 2. Adapter Pattern 아키텍처

OCP 원칙에 따라 Partner Adapter 패턴 적용 ([ocp-patterns.md](../../.claude/rules/ocp-patterns.md) 참조):

```
lib/affiliate/
├── index.ts                    # 공개 API
├── types.ts                    # PartnerAdapter 인터페이스
├── adapters/
│   ├── coupang.ts              # 쿠팡 파트너스 API
│   ├── cj-affiliate.ts         # CJ Affiliate (Sephora)
│   └── amazon-creators.ts      # Amazon Creators API
├── product-sync.ts             # 배치 동기화 로직
└── internal/
    ├── deeplink-generator.ts   # 딥링크 생성
    └── commission-tracker.ts   # 커미션 추적
```

#### PartnerAdapter 인터페이스

```typescript
interface PartnerAdapter {
  partnerId: string;

  // 제품 검색 (이미지/가격 포함)
  searchProducts(query: ProductSearchQuery): Promise<PartnerProduct[]>;

  // 딥링크 생성
  generateDeeplink(productId: string, trackingParams: TrackingParams): string;

  // 웹훅 파싱 (전환 추적)
  parseConversionWebhook(payload: unknown): ConversionEvent | null;

  // 제품 상세 (단일)
  getProductDetail(productId: string): Promise<PartnerProduct | null>;
}
```

### 3. 모듈별 제품 카테고리 확장

#### H-1 헤어케어 카테고리 추가

현재 `CosmeticCategory`에 헤어케어 없음. 기존 타입 확장:

```typescript
// types/product.ts 확장
export type CosmeticCategory =
  | 'cleanser'
  | 'toner'
  | 'serum'
  | 'moisturizer'
  | 'sunscreen'
  | 'mask'
  | 'makeup'
  // 헤어케어 추가
  | 'shampoo' // 샴푸
  | 'conditioner' // 컨디셔너
  | 'hair-treatment' // 헤어 트리트먼트
  | 'scalp-care'; // 두피 케어
```

**DB 변경**: `cosmetic_products` 테이블의 `category` CHECK 제약에 새 값 추가

**매칭 필드 추가**: `hair_types TEXT[]`, `scalp_types TEXT[]`

#### M-1 메이크업 세분화

기존 `MakeupSubcategory` 활용. 매칭 알고리즘에 얼굴형/피부톤 연동 추가:

```typescript
// 기존 MakeupSubcategory: 'foundation' | 'lip' | 'eye' | 'blush' | 'brow'
// 추가 매칭 필드:
interface MakeupMatchingFields {
  face_shapes?: string[]; // 적합 얼굴형
  undertones?: string[]; // 적합 언더톤
  personal_color_seasons?: string[]; // 이미 존재
}
```

#### 모듈→파트너 매핑

| 모듈 | 제품 카테고리                      | Primary 파트너 | Fallback 파트너 |
| ---- | ---------------------------------- | -------------- | --------------- |
| PC-1 | 메이크업 (립, 아이, 블러셔)        | CJ/Sephora     | 쿠팡            |
| S-1  | 스킨케어 (세럼, 모이스처라이저)    | 쿠팡           | CJ/Sephora      |
| C-1  | 운동기구, 운동복                   | 쿠팡           | Amazon          |
| H-1  | 헤어케어 (샴푸, 트리트먼트)        | 쿠팡           | Amazon          |
| M-1  | 메이크업 상세 (파운데이션, 컨투어) | CJ/Sephora     | 쿠팡            |

### 4. 이미지/URL 소싱 전략

#### Phase 1: 파트너 API 이미지

```
파트너 API 검색 → image_url, purchase_url 획득 → DB 저장 (캐싱)
```

- 쿠팡 API: 상품 검색 시 `productImage`, `productUrl` 제공
- CJ: 상품 피드에 이미지 URL 포함
- Amazon: 상품 이미지 4종 (Small/Medium/Large/Hi-Res)

#### Phase 2: 하이브리드 (캐시 + 실시간)

```
1. DB 캐시 확인 (24h TTL)
2. 캐시 miss → 파트너 API 실시간 조회
3. 결과 캐시 저장
```

### 5. 추천 독립성 원칙 (핵심)

> 원리 참조: [product-matching.md](../principles/product-matching.md) 4.1절

**어필리에이트 커미션이 매칭 점수에 영향을 주지 않는다.**

```
금지: 커미션 높은 제품 점수 부풀리기
허용: 동점일 때 커미션 높은 제품 우선 (tiebreaker)
```

UI에서 추천 사유와 AD 표시를 명확히 분리:

```
"건성 피부에 적합해요" (매칭 사유)
[AD] 파트너 링크 (광고 표시)
```

---

## 대안 (Alternatives Considered)

### 1. 올리브영 Involve Asia 경유

| 항목      | 내용                                                           |
| --------- | -------------------------------------------------------------- |
| 장점      | K-뷰티 특화, 13% 높은 커미션                                   |
| 단점      | API 제약 심각 (상품 검색 API 없음, 딥링크만 제공)              |
| 제외 사유 | 이미지/가격 프로그래매틱 접근 불가 → 시드 데이터에 의존해야 함 |

### 2. 자체 크롤링 + 데이터 수집

| 항목      | 내용                                                     |
| --------- | -------------------------------------------------------- |
| 장점      | 파트너 API 의존도 낮음                                   |
| 단점      | 법적 리스크 (TOS 위반), 유지보수 비용, 이미지 저작권     |
| 제외 사유 | `LEGAL_RISK` — 크롤링 기반 비즈니스는 법적 리스크가 높음 |

### 3. 단일 파트너 (쿠팡만)

| 항목      | 내용                                                 |
| --------- | ---------------------------------------------------- |
| 장점      | 구현 단순, 한국 커버리지 최대                        |
| 단점      | 뷰티 전문성 부족, 글로벌 확장 불가, 단일 의존 리스크 |
| 제외 사유 | `LOW_DIVERSITY` — 파트너 1곳 의존은 비즈니스 리스크  |

### 4. 헤어케어 별도 테이블 (`haircare_products`)

| 항목      | 내용                                                                                  |
| --------- | ------------------------------------------------------------------------------------- |
| 장점      | 타입 시스템 명확 분리, hair_types/scalp_types 전용 필드                               |
| 단점      | 테이블 추가, 매칭 코드 분기 증가, `RecommendedProducts` 컴포넌트 수정 범위 확대       |
| 제외 사유 | `LOW_ROI` — `cosmetic_products` 카테고리 확장이 더 단순. 기존 매칭 인프라 재사용 가능 |

---

## 결과 (Consequences)

### 긍정적

1. **5모듈 완전 커버**: H-1, M-1까지 제품 추천 지원
2. **실제 이미지/가격**: 파트너 API로 null 이미지 문제 해결
3. **글로벌 기반**: Amazon Creators로 해외 확장 가능
4. **OCP 준수**: 새 파트너 추가 시 기존 코드 수정 없음

### 부정적

1. **파트너 API 키 관리**: 3개 파트너 각각 인증 관리 필요
2. **API 장애 대응**: 파트너 API 다운 시 캐시 폴백 필요
3. **커미션 정산 복잡**: 멀티 파트너 정산 관리

### 리스크 및 완화

| 리스크                          | 완화 전략                                  |
| ------------------------------- | ------------------------------------------ |
| Amazon PA-API 폐기 (2026-04-30) | Creators API로 직접 시작, PA-API 스킵      |
| CJ/Sephora KR 진출 지연         | 쿠팡으로 뷰티 커버, Sephora는 글로벌 우선  |
| 파트너 API 장애                 | 24h 캐시 + 시드 데이터 폴백                |
| 커미션율 변경                   | 멀티 파트너 분산, 자체 DB가 가격 비교 기능 |

---

## 실행 단계

### Phase 1: 쿠팡 연동 + H-1 확장 (우선)

1. 쿠팡 파트너스 API 키 발급
2. `CoupangAdapter` 구현
3. `CosmeticCategory` 헤어케어 확장
4. `cosmetic_products` DB 마이그레이션 (헤어케어 카테고리 + 매칭 필드)
5. 기존 500개 시드 데이터에 쿠팡 이미지/URL 매핑
6. `RecommendedProducts`에 H-1 지원 추가

### Phase 2: CJ Affiliate + M-1 세분화

1. CJ Affiliate 가입 + API 키 발급
2. `CJAffiliateAdapter` 구현
3. M-1 매칭 알고리즘 확장 (얼굴형, 언더톤)
4. `RecommendedProducts`에 M-1 지원 추가

### Phase 3: Amazon Creators + 글로벌

1. Amazon Creators 프로그램 가입
2. `AmazonCreatorsAdapter` 구현
3. 글로벌 제품 데이터 소싱
4. 사용자 locale 기반 파트너 라우팅

---

## 관련 문서

### 원리 문서

- [product-matching.md](../principles/product-matching.md) — 제품 매칭 원리 (2축 스코어링, 추천 독립성)

### 리서치

- [AFFILIATE-API-COMPARISON-RESEARCH.md](../research/claude-ai-research/AFFILIATE-API-COMPARISON-RESEARCH.md) — 어필리에이트 API 비교 리서치

### 관련 ADR

- [ADR-029: 어필리에이트 통합 아키텍처](./ADR-029-affiliate-integration.md) — 기본 아키텍처 (이 ADR이 보완)
- [ADR-032: 스마트 매칭](./ADR-032-smart-matching.md) — 매칭 알고리즘
- [ADR-054: 어필리에이트 우선 수익화](./ADR-054-affiliate-first-monetization.md) — 비즈니스 전략

### 구현 스펙

- [SDD-AFFILIATE-INTEGRATION](../specs/SDD-AFFILIATE-INTEGRATION.md) — 어필리에이트 통합 스펙 (업데이트 필요)

---

**Version**: 1.0 | **Created**: 2026-02-10 | **Author**: Claude Code
