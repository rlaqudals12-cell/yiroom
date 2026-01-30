# 광고 표기 가이드

> **Version**: 1.0 | **Updated**: 2026-01-21
> **Status**: `active`
> **⚠️ 주의**: 최종 검토는 반드시 법률 전문가에게 받으세요.

---

## 1. 개요

### 1.1 적용 법률

| 법률 | 관할 | 핵심 요건 |
|------|------|----------|
| **표시·광고의 공정화에 관한 법률** | 한국 | 광고 명확히 표시 |
| **전자상거래법** | 한국 | 통신판매중개자 책임 |
| **공정거래위원회 심사지침** | 한국 | 추천·보증 광고 기준 |
| **景品表示法 (경품표시법)** | 일본 | 광고 표시 의무 |
| **FTC Act Section 5** | 미국 | 기만적 광고 금지 |

### 1.2 이룸 광고 유형

```
┌─────────────────────────────────────────────────────────────────┐
│                   이룸 내 광고 유형                              │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│   1. 어필리에이트 추천                                           │
│   ───────────────────                                            │
│   • 분석 결과 기반 제품 추천                                     │
│   • 클릭 시 파트너 쇼핑몰 이동                                   │
│   • 구매 시 커미션 수취                                          │
│   → 광고 표시 필수                                               │
│                                                                  │
│   2. 네이티브 광고                                               │
│   ──────────────                                                 │
│   • 추천 목록 상위 노출                                          │
│   • 브랜드 협찬 콘텐츠                                           │
│   → "Sponsored" 라벨 필수                                        │
│                                                                  │
│   3. 브랜드 콘텐츠                                               │
│   ────────────────                                               │
│   • 브랜드 스토리 기사형 광고                                    │
│   • 인플루언서 협업 콘텐츠                                       │
│   → 광고/협찬 명시 필수                                          │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

---

## 2. 국가별 표기 요건

### 2.1 한국

```typescript
// 한국 광고 표기 요건
const koreaDisclosure = {
  // 어필리에이트 링크
  affiliate: {
    text: '이 링크를 통해 구매 시 일정 수수료를 받을 수 있습니다',
    placement: 'above_link',        // 링크 상단
    minFontSize: 10,                // 최소 10pt
    visibility: 'clearly_visible',  // 명확히 보이게
  },

  // 네이티브 광고
  native: {
    label: '광고',
    alternativeLabels: ['AD', 'Sponsored', '협찬'],
    placement: 'top_left',          // 좌상단
    style: 'contrasting_background', // 대비되는 배경
  },

  // 브랜드 콘텐츠
  brandedContent: {
    text: '○○ 브랜드로부터 제품/원고료를 제공받았습니다',
    placement: 'top_of_content',    // 콘텐츠 상단
    visibility: 'prominent',        // 눈에 띄게
  },
};
```

### 2.2 일본

```typescript
// 일본 광고 표기 요건 (景品表示法)
const japanDisclosure = {
  // 어필리에이트 링크
  affiliate: {
    text: '※このリンクはアフィリエイトリンクです',
    placement: 'near_link',
    required: true,
  },

  // 네이티브 광고
  native: {
    label: '広告',
    alternativeLabels: ['PR', 'AD', 'Sponsored'],
    placement: 'clearly_visible',
  },

  // 브랜드 콘텐츠
  brandedContent: {
    text: '※○○様より商品提供を受けています',
    placement: 'top',
  },
};
```

### 2.3 미국 (FTC)

```typescript
// 미국 FTC 광고 표기 요건
const usaDisclosure = {
  // 어필리에이트 링크
  affiliate: {
    text: 'We may earn a commission if you make a purchase through our links',
    placement: 'before_content',
    hashtags: ['#ad', '#affiliate', '#sponsored'],
  },

  // 인플루언서 협업
  influencer: {
    required: ['#ad', '#sponsored', '#partner'],
    placement: 'beginning_of_post', // 게시물 시작 부분
    visibility: 'above_the_fold',   // 스크롤 없이 보이게
  },

  // Material Connection
  materialConnection: {
    disclosure: 'Disclosure: [Brand] provided this product for free',
    required: true,
  },
};
```

---

## 3. UI 구현 가이드

### 3.1 어필리에이트 추천 카드

```tsx
// components/ProductRecommendationCard.tsx
interface ProductCardProps {
  product: Product;
  isAffiliate: boolean;
  isSponsored: boolean;
}

export function ProductRecommendationCard({
  product,
  isAffiliate,
  isSponsored,
}: ProductCardProps) {
  return (
    <div className="product-card">
      {/* 광고/협찬 라벨 (좌상단) */}
      {isSponsored && (
        <span className="sponsored-label">
          광고
        </span>
      )}

      {/* 제품 정보 */}
      <img src={product.imageUrl} alt={product.name} />
      <h3>{product.name}</h3>
      <p>{product.price}</p>

      {/* 어필리에이트 고지 (링크 상단) */}
      {isAffiliate && (
        <p className="affiliate-disclosure">
          이 링크를 통해 구매 시 일정 수수료를 받을 수 있습니다
        </p>
      )}

      <a href={product.affiliateUrl}>구매하기</a>
    </div>
  );
}
```

### 3.2 라벨 스타일 가이드

```css
/* 광고 라벨 스타일 */
.sponsored-label {
  position: absolute;
  top: 8px;
  left: 8px;
  background-color: #f0f0f0;
  color: #666;
  font-size: 11px;
  font-weight: 600;
  padding: 2px 6px;
  border-radius: 4px;
  /* 명확히 보이도록 */
  z-index: 10;
}

/* 어필리에이트 고지 */
.affiliate-disclosure {
  font-size: 10px;
  color: #888;
  margin-top: 4px;
  /* 링크와 가까이 */
}

/* 다크 모드 */
.dark .sponsored-label {
  background-color: #333;
  color: #aaa;
}
```

### 3.3 다국어 지원

```typescript
// i18n/advertising.ts
export const advertisingDisclosures = {
  ko: {
    sponsored: '광고',
    affiliate: '이 링크를 통해 구매 시 일정 수수료를 받을 수 있습니다',
    brandedContent: '브랜드 협찬',
  },
  ja: {
    sponsored: '広告',
    affiliate: 'このリンクはアフィリエイトリンクです',
    brandedContent: 'PR',
  },
  en: {
    sponsored: 'Sponsored',
    affiliate: 'We may earn a commission from purchases made through this link',
    brandedContent: 'Paid partnership',
  },
};
```

---

## 4. 화장품 광고 특별 규정

### 4.1 효능 표현 제한

```
┌─────────────────────────────────────────────────────────────────┐
│               화장품 광고 표현 제한                              │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│   ✅ 허용되는 표현                                               │
│   ──────────────────                                             │
│   • "피부 보습에 도움"                                           │
│   • "피부결 정돈"                                                │
│   • "피부 탄력 관리"                                             │
│   • "자외선 차단"                                                │
│                                                                  │
│   ❌ 금지되는 표현                                               │
│   ──────────────────                                             │
│   • "주름 제거" → "주름 개선에 도움"                             │
│   • "미백 효과" → "피부톤 케어" (미백 기능성 제외)               │
│   • "여드름 치료" → "트러블 케어"                                │
│   • "피부 재생" → "피부 컨디셔닝"                                │
│   • "의사 추천" (검증 불가 시)                                   │
│                                                                  │
│   ⚠️ 조건부 허용 (기능성 화장품만)                               │
│   ──────────────────────────────────                             │
│   • 미백 기능성: "멜라닌 생성 억제로 피부 미백에 도움"           │
│   • 주름 기능성: "피부 주름 개선에 도움"                         │
│   • 자외선 차단: SPF/PA 표시 필수                                │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

### 4.2 AI 추천 문구 검증

```typescript
// 화장품 추천 문구 검증
const cosmeticClaimValidator = {
  // 금지 표현
  forbidden: [
    '치료', '제거', '완치', '효과 보장',
    '의사 추천', '임상 검증' // 검증 없이
  ],

  // 기능성 화장품만 허용
  functionalOnly: [
    '미백', '주름 개선', '자외선 차단',
  ],

  // 대체 표현
  replacements: {
    '주름 제거': '주름 개선에 도움',
    '미백 효과': '피부톤 케어',
    '여드름 치료': '트러블 진정 케어',
  },
};

function validateCosmeticClaim(
  claim: string,
  isFunctional: boolean
): { valid: boolean; suggestion?: string } {
  // 금지 표현 체크
  for (const term of cosmeticClaimValidator.forbidden) {
    if (claim.includes(term)) {
      return {
        valid: false,
        suggestion: `"${term}" 표현은 사용할 수 없습니다.`,
      };
    }
  }

  // 기능성 전용 표현 체크
  for (const term of cosmeticClaimValidator.functionalOnly) {
    if (claim.includes(term) && !isFunctional) {
      return {
        valid: false,
        suggestion: `"${term}" 표현은 기능성 화장품만 사용 가능합니다.`,
      };
    }
  }

  return { valid: true };
}
```

---

## 5. 어필리에이트 파트너별 요건

### 5.1 파트너 요구사항

| 파트너 | 광고 표기 요건 | 링크 형식 |
|--------|---------------|----------|
| **쿠팡 파트너스** | "쿠팡 파트너스 활동의 일환" 명시 | `coupa.ng/xxxx` |
| **무신사** | 광고 라벨 권장 | `musinsa.com/?ref=xxx` |
| **iHerb** | Disclosure 필수 | `iherb.com/?rcode=xxx` |
| **Amazon** | FTC 준수 필수 | `amzn.to/xxx` |
| **Rakuten** | 광고 표시 필수 | `a.r10.to/xxx` |

### 5.2 쿠팡 파트너스 특별 요건

```typescript
// 쿠팡 파트너스 필수 문구
const coupangDisclosure = {
  // 필수 고지 문구 (공식 가이드)
  required: `
    이 포스팅은 쿠팡 파트너스 활동의 일환으로,
    이에 따른 일정액의 수수료를 제공받습니다.
  `,

  // 간략 버전 (카드형)
  short: '쿠팡 파트너스 활동으로 수수료를 받을 수 있습니다',

  // 위치
  placement: 'visible_near_link',
};
```

---

## 6. 체크리스트

### 6.1 런칭 전 체크리스트

```markdown
## 광고 표기 체크리스트

### 어필리에이트 링크
□ 모든 어필리에이트 링크에 고지 문구 표시
□ 고지 문구가 링크와 가까이 위치
□ 폰트 크기 최소 10pt 이상

### 네이티브 광고
□ "광고" 또는 "Sponsored" 라벨 표시
□ 라벨이 좌상단에 명확히 표시
□ 대비되는 색상/배경 사용

### 화장품 추천
□ 금지 표현 자동 필터 구현
□ 기능성 화장품 구분 로직
□ 효능 표현 검수 완료

### 다국어 지원
□ 한국어 광고 표기
□ 일본어 광고 표기
□ 영어 광고 표기 (FTC 준수)

### 파트너별 요건
□ 쿠팡 파트너스 필수 문구
□ 각 파트너 가이드라인 확인
```

---

## 7. 관련 문서

### 법무 문서
- [docs/legal/PRIVACY-COMPLIANCE.md](PRIVACY-COMPLIANCE.md) - 개인정보보호
- [docs/legal/MEDICAL-BOUNDARY.md](MEDICAL-BOUNDARY.md) - 의료기기 경계

### 기술 문서
- [docs/specs/SDD-AFFILIATE-INTEGRATION.md](../specs/SDD-AFFILIATE-INTEGRATION.md) - 어필리에이트 통합
- [docs/specs/SDD-AI-TRANSPARENCY.md](../specs/SDD-AI-TRANSPARENCY.md) - AI 투명성

---

**Author**: Claude Code
**Legal Review**: ⚠️ 필요 (법률 전문가 검토 권장)
