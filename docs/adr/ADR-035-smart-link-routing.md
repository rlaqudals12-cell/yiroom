# ADR-035: 스마트 링크 라우팅 시스템

## 상태

`accepted`

## 날짜

2026-01-20

## 0. 궁극의 형태 (P1)

### 이상적 최종 상태

"하나의 링크로 모든 플랫폼/상황에서 최적의 사용자 경험과 완벽한 어필리에이트 추적"

- **100% 전환 추적**: 모든 경로(웹→앱, 앱→앱)에서 추적 손실 0
- **즉시 딥링크**: 앱 설치 여부 관계없이 최적 경로로 즉시 이동
- **스마트 Fallback**: 딥링크 실패 시 자동으로 최적 대안 제공
- **통합 분석**: 클릭→설치→구매 전체 퍼널 분석

### 물리적 한계

| 항목 | 한계 |
|------|------|
| 앱 설치 감지 | iOS/Android 정책으로 앱 설치 여부 확실한 감지 불가 |
| Deferred Deep Link | 앱스토어 경유 시 일부 데이터 손실 가능 |
| 파트너 앱 지원 | 각 파트너 앱의 딥링크 스펙 의존 |
| 브라우저 제한 | 일부 브라우저에서 Universal Link 지원 제한 |

### 100점 기준

| 지표 | 100점 기준 | 현재 | 비고 |
|------|-----------|------|------|
| 딥링크 성공률 | 95%+ | 없음 | 단순 리다이렉트 |
| 전환 추적 정확도 | 98%+ | 80% | 앱 전환 손실 |
| 링크 응답 시간 | < 100ms | N/A | 직접 리다이렉트 |
| Deferred DL 성공률 | 90%+ | 없음 | 미지원 |

### 현재 목표: 80%

### 의도적 제외

| 제외 항목 | 이유 | 재검토 시점 |
|----------|------|------------|
| 자체 딥링크 시스템 | 복잡도 (HIGH_COMPLEXITY) - iOS/Android 설정 복잡 | Branch 비용 과다 시 |
| AppsFlyer | 비용 (FINANCIAL_HOLD) - $0.05/MAU | MAU 10만+ 시 재검토 |
| Firebase Dynamic Links | 서비스 종료 예정 (DEPRECATION) | 영구 제외 |
| 모든 파트너 앱 딥링크 | 파트너별 스펙 조사 필요 (NOT_READY) | 주요 파트너부터 순차 적용 |

---

## 맥락 (Context)

이룸의 어필리에이트 링크가 다양한 플랫폼(웹, iOS, Android)과 상황(설치 여부, 딥링크 지원)에서 **최적의 사용자 경험**을 제공해야 합니다.

### 요구사항

1. **유니버설 링크**: 하나의 링크로 모든 플랫폼 대응
2. **딥링크**: 앱 설치 시 앱 내 상품 페이지로 직접 이동
3. **Deferred Deep Link**: 앱 미설치 → 스토어 → 설치 후 상품 페이지
4. **어필리에이트 추적**: 모든 경로에서 어필리에이트 파라미터 유지
5. **Fallback**: 딥링크 실패 시 모바일 웹으로 이동

### 현재 상황

- **단순 리다이렉트**: 현재 어필리에이트 링크는 단순 웹 리다이렉트
- **앱 연동 없음**: 파트너 앱이 있어도 웹으로만 이동
- **추적 손실**: 웹 → 앱 전환 시 어필리에이트 추적 끊김

## 결정 (Decision)

**Branch.io**를 스마트 링크 솔루션으로 선택합니다.

### 아키텍처

```
┌─────────────────────────────────────────────────────────────┐
│                   스마트 링크 라우팅 아키텍처                  │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│   사용자 클릭                                                │
│       │                                                      │
│       ▼                                                      │
│   ┌───────────────────────────────┐                         │
│   │    yiroom.app/go/[shortId]    │  이룸 스마트 링크        │
│   └───────────────┬───────────────┘                         │
│                   │                                          │
│                   ▼                                          │
│   ┌───────────────────────────────┐                         │
│   │     Branch.io SDK/API         │                         │
│   │  - 기기/플랫폼 감지            │                         │
│   │  - 앱 설치 여부 확인            │                         │
│   │  - 딥링크 생성                 │                         │
│   └───────────────┬───────────────┘                         │
│                   │                                          │
│       ┌───────────┴───────────┐                             │
│       │                       │                              │
│       ▼                       ▼                              │
│   앱 설치됨               앱 미설치                           │
│       │                       │                              │
│       ▼                       ▼                              │
│   ┌─────────┐           ┌─────────────┐                     │
│   │ 딥링크   │           │ 스토어 이동  │                     │
│   │ 앱 오픈  │           │ 또는 웹 이동 │                     │
│   └────┬────┘           └──────┬──────┘                     │
│        │                       │                             │
│        ▼                       ▼                             │
│   파트너 앱              스토어에서 설치                       │
│   상품 페이지                  │                             │
│   (어필리에이트              ▼                             │
│    파라미터 포함)       Deferred Deep Link                   │
│                         앱 첫 실행 시                        │
│                         상품 페이지로 이동                    │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

### 선택 이유

1. **Deferred Deep Link**: 앱 미설치 → 설치 후 원래 목적지로 이동
2. **어필리에이트 추적 유지**: 모든 경로에서 추적 파라미터 보존
3. **무료 티어**: 월 10,000 MAU까지 무료
4. **React Native SDK**: 모바일 앱 통합 용이
5. **분석 대시보드**: 클릭, 설치, 전환 추적

### 링크 구조

```typescript
// 이룸 스마트 링크 형식
interface SmartLinkParams {
  // 필수 파라미터
  targetUrl: string;           // 최종 목적지 URL
  partnerId: string;           // 어필리에이트 파트너 ID
  productId?: string;          // 상품 ID (딥링크용)

  // 선택 파라미터
  campaignId?: string;         // 캠페인 ID
  source?: string;             // 트래픽 소스 (feed, search, recommendation)
  userId?: string;             // 사용자 ID (옵션)

  // 딥링크 정보
  deepLink?: {
    iosAppScheme?: string;     // iOS 앱 URL Scheme
    androidPackage?: string;   // Android 패키지명
    iosUniversalLink?: string; // iOS Universal Link
    androidAppLink?: string;   // Android App Link
  };
}

// 예시 링크 생성
const smartLink = generateSmartLink({
  targetUrl: 'https://www.coupang.com/vp/products/12345',
  partnerId: 'coupang_partners_123',
  productId: '12345',
  campaignId: 'winter_2026',
  source: 'recommendation',
  deepLink: {
    iosAppScheme: 'coupang://product/12345',
    androidPackage: 'com.coupang.mobile',
    iosUniversalLink: 'https://www.coupang.com/app/products/12345',
  },
});

// 결과: https://yiroom.app/go/abc123
```

### 구현 코드

```typescript
// lib/smart-link/generate.ts
import branch from 'branch-sdk';

interface GenerateSmartLinkOptions {
  product: ProductInfo;
  affiliateParams: AffiliateParams;
  campaign?: CampaignInfo;
}

async function generateSmartLink(
  options: GenerateSmartLinkOptions
): Promise<string> {
  const { product, affiliateParams, campaign } = options;

  // Branch 링크 파라미터
  const linkData = {
    // 기본 정보
    channel: 'yiroom',
    feature: 'product_recommendation',
    campaign: campaign?.id,

    // 딥링크 데이터 (앱에서 읽음)
    data: {
      product_id: product.id,
      product_name: product.name,
      product_url: product.url,
      affiliate_id: affiliateParams.partnerId,
      affiliate_link: affiliateParams.trackingUrl,
      source: 'yiroom_app',
    },

    // 플랫폼별 라우팅
    $desktop_url: affiliateParams.trackingUrl,
    $ios_url: affiliateParams.trackingUrl,
    $android_url: affiliateParams.trackingUrl,

    // 딥링크 (파트너 앱 지원 시)
    $deeplink_path: product.deepLinkPath,
    $ios_deeplink: product.iosScheme,
    $android_deeplink: product.androidScheme,

    // 앱 미설치 시 동작
    $fallback_url: affiliateParams.trackingUrl,

    // OG 태그 (공유 시)
    $og_title: product.name,
    $og_description: product.description,
    $og_image_url: product.imageUrl,
  };

  const link = await branch.link(linkData);
  return link;
}
```

### 파트너별 딥링크 설정

```typescript
// lib/smart-link/partner-config.ts

interface PartnerDeepLinkConfig {
  partnerId: string;
  partnerName: string;
  appInstalled: boolean;  // 런타임 체크
  ios: {
    appScheme?: string;
    universalLink?: string;
    appStoreId?: string;
  };
  android: {
    appScheme?: string;
    appLink?: string;
    packageName?: string;
  };
  generateDeepLink: (productId: string) => string;
}

const PARTNER_CONFIGS: Record<string, PartnerDeepLinkConfig> = {
  coupang: {
    partnerId: 'coupang',
    partnerName: '쿠팡',
    appInstalled: false,
    ios: {
      appScheme: 'coupang://',
      universalLink: 'https://www.coupang.com/app',
      appStoreId: '454770098',
    },
    android: {
      appScheme: 'coupang://',
      appLink: 'https://www.coupang.com/app',
      packageName: 'com.coupang.mobile',
    },
    generateDeepLink: (productId) => `coupang://product/${productId}`,
  },

  musinsa: {
    partnerId: 'musinsa',
    partnerName: '무신사',
    appInstalled: false,
    ios: {
      appScheme: 'musinsa://',
      universalLink: 'https://www.musinsa.com/app',
      appStoreId: '957113291',
    },
    android: {
      appScheme: 'musinsa://',
      packageName: 'com.musinsa.store',
    },
    generateDeepLink: (productId) => `musinsa://product/${productId}`,
  },

  iherb: {
    partnerId: 'iherb',
    partnerName: 'iHerb',
    appInstalled: false,
    ios: {
      appScheme: 'iherb://',
      appStoreId: '636609212',
    },
    android: {
      appScheme: 'iherb://',
      packageName: 'com.iherb',
    },
    generateDeepLink: (productId) => `iherb://product/${productId}`,
  },

  oliveyoung: {
    partnerId: 'oliveyoung',
    partnerName: '올리브영',
    appInstalled: false,
    ios: {
      appScheme: 'oliveyoung://',
      appStoreId: '543547267',
    },
    android: {
      appScheme: 'oliveyoung://',
      packageName: 'com.cjoly.oliveyoung',
    },
    generateDeepLink: (productId) => `oliveyoung://product?id=${productId}`,
  },
};
```

## 대안 (Alternatives Considered)

| 대안 | 장점 | 단점 | 제외 사유 |
|------|------|------|----------|
| **Firebase Dynamic Links** | 무료, Google 생태계 | 2025년 서비스 종료 예정 | `DEPRECATION` |
| **AppsFlyer OneLink** | 강력한 분석 | 비용 높음 ($0.05/MAU) | `FINANCIAL_HOLD` |
| **Adjust** | 정확한 어트리뷰션 | 비용 높음 | `FINANCIAL_HOLD` |
| **직접 구현** | 비용 없음, 완전 제어 | 개발 복잡도, 유지보수 | `COMPLEXITY` |
| **단순 리다이렉트** | 매우 간단 | 딥링크 없음, 추적 손실 | `LOW_CAPABILITY` |

### 상세 비교

| 기준 | Branch.io | AppsFlyer | 직접 구현 |
|------|-----------|-----------|----------|
| 비용 (10K MAU) | 무료 | $500+/월 | 개발비용 |
| Deferred Deep Link | ✅ | ✅ | ❌ 복잡 |
| React Native SDK | ✅ | ✅ | 직접 구현 |
| 어필리에이트 추적 | ✅ | ✅ | 직접 구현 |
| 분석 대시보드 | ✅ | ✅ (강력) | 직접 구현 |
| Universal Link | ✅ | ✅ | 직접 구현 |
| 설정 복잡도 | 중간 | 높음 | 매우 높음 |

## 결과 (Consequences)

### 긍정적 결과

- **사용자 경험 향상**: 앱이 있으면 앱으로, 없으면 웹으로 자연스럽게 이동
- **전환율 향상**: Deferred Deep Link로 앱 설치 후에도 상품 페이지 도달
- **어필리에이트 추적 유지**: 모든 경로에서 추적 파라미터 보존
- **분석 가능**: 클릭, 설치, 전환 데이터 확보

### 부정적 결과

- **외부 의존성**: Branch.io 서비스 의존
- **초기 설정 복잡**: iOS Universal Link, Android App Link 설정 필요
- **비용 (스케일업 시)**: 10K MAU 초과 시 유료

### 리스크

| 리스크 | 확률 | 영향 | 완화 방안 |
|--------|------|------|----------|
| Branch 서비스 장애 | 낮음 | 중간 | Fallback URL 설정 |
| 딥링크 미지원 앱 | 중간 | 낮음 | 웹 링크 Fallback |
| 비용 증가 (MAU 증가) | 중간 | 중간 | 사용량 모니터링, 대안 준비 |

## 구현 가이드

### 파일 구조

```
lib/smart-link/
├── index.ts                    # 공개 API
├── types.ts                    # 타입 정의
├── generate.ts                 # 링크 생성
├── partner-config.ts           # 파트너별 설정
├── branch-client.ts            # Branch SDK 래퍼
├── analytics.ts                # 클릭/전환 추적
└── fallback.ts                 # Fallback 처리
```

### 웹 통합 (Next.js)

```typescript
// app/go/[shortId]/route.ts
import { redirect } from 'next/navigation';
import { resolveSmartLink } from '@/lib/smart-link';

export async function GET(
  request: Request,
  { params }: { params: { shortId: string } }
) {
  const { shortId } = params;

  // Branch에서 원본 링크 정보 조회
  const linkData = await resolveSmartLink(shortId);

  if (!linkData) {
    redirect('/404');
  }

  // 어필리에이트 클릭 로깅
  await logAffiliateClick({
    linkId: shortId,
    partnerId: linkData.partnerId,
    productId: linkData.productId,
    userAgent: request.headers.get('user-agent'),
  });

  // Branch 링크로 리다이렉트 (Branch가 라우팅 처리)
  redirect(linkData.branchUrl);
}
```

### 모바일 앱 통합 (React Native)

```typescript
// apps/mobile/lib/smart-link.ts
import branch from 'react-native-branch';

// 앱 시작 시 딥링크 처리
export function initDeepLinkHandler() {
  branch.subscribe(({ error, params }) => {
    if (error) {
      console.error('[Branch] Error:', error);
      return;
    }

    if (params['+clicked_branch_link']) {
      // 딥링크로 앱 열림
      const productId = params.product_id;
      const affiliateId = params.affiliate_id;
      const affiliateLink = params.affiliate_link;

      if (productId) {
        // 상품 상세 페이지로 이동
        navigateToProduct(productId, {
          affiliateId,
          affiliateLink,
        });
      }
    }
  });
}

// 앱 내에서 스마트 링크 생성
export async function createShareLink(product: Product): Promise<string> {
  const buo = await branch.createBranchUniversalObject(
    `product/${product.id}`,
    {
      title: product.name,
      contentDescription: product.description,
      contentImageUrl: product.imageUrl,
      contentMetadata: {
        customMetadata: {
          product_id: product.id,
          price: product.price.toString(),
        },
      },
    }
  );

  const linkProperties = {
    feature: 'share',
    channel: 'app',
  };

  const controlParams = {
    $desktop_url: product.webUrl,
  };

  const { url } = await buo.generateShortUrl(linkProperties, controlParams);
  return url;
}
```

## 테스트 계획

### 시나리오 테스트

| 시나리오 | 기대 동작 | 테스트 방법 |
|----------|----------|------------|
| iOS 앱 설치됨 | 앱으로 딥링크 | 실기기 테스트 |
| iOS 앱 미설치 | 앱스토어 또는 웹 | 시뮬레이터 |
| Android 앱 설치됨 | 앱으로 딥링크 | 실기기 테스트 |
| Android 앱 미설치 | Play Store 또는 웹 | 에뮬레이터 |
| 데스크톱 | 웹 이동 | 브라우저 |
| Deferred Deep Link | 설치 후 상품 페이지 | 앱 삭제 후 테스트 |

## 리서치 티켓

```
[ADR-035-R1] 파트너 앱 딥링크 스펙 조사
──────────────────────────────────────
리서치 질문:
1. 쿠팡, 무신사, 올리브영, iHerb 앱의 딥링크 스펙
2. Universal Link / App Link 지원 여부
3. 어필리에이트 파라미터 전달 방식

예상 출력:
- 파트너별 딥링크 문서 링크
- 테스트 결과
- PARTNER_CONFIGS 업데이트
```

## 관련 문서

### 원리 문서 (과학적 기초)
- [원리: 법적 준수](../principles/legal-compliance.md) - 어필리에이트 광고 표시 의무, 딥링크 사용자 동의
- [원리: 보안 패턴](../principles/security-patterns.md) - 외부 리다이렉트 보안, URL 검증

### 관련 ADR
- [ADR-029: 어필리에이트 통합](./ADR-029-affiliate-integration.md) - 어필리에이트 시스템 개요
- [ADR-034: 상품 색상 분류](./ADR-034-product-color-classification.md) - 상품 매칭

### 구현 스펙
- [SDD-GLOBAL-PARTNERS-EXPANSION](../specs/SDD-GLOBAL-PARTNERS-EXPANSION.md) - 글로벌 파트너 확장

### 외부 문서
- [Branch.io 문서](https://help.branch.io/)
- [React Native Branch SDK](https://help.branch.io/developers-hub/docs/react-native)

---

**Author**: Claude Code
**Reviewed by**: -
