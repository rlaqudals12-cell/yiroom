# Next.js 16 SEO 최적화 2026

> **ID**: SEO-NEXTJS-2026
> **작성일**: 2026-01-19
> **상태**: 완료
> **적용 대상**: apps/web

---

## 1. 현재 구현 분석

### 현재 상태 (apps/web/app/layout.tsx)

```typescript
// 현재 구현된 기능
✅ 정적 Metadata 객체 (title, description, keywords)
✅ Open Graph 메타데이터
✅ Twitter Card 메타데이터
✅ PWA manifest 연결
✅ Favicon 및 Apple Touch Icon
✅ JSON-LD 구조화 데이터 (OrganizationJsonLd, WebApplicationJsonLd)
✅ Preconnect/DNS-prefetch 힌트

// 개선 필요 항목
❌ generateMetadata 동적 메타데이터 (페이지별)
❌ 동적 OG 이미지 생성 (next/og)
❌ sitemap.ts 자동 생성
❌ robots.ts 설정
❌ 다국어 SEO (hreflang)
❌ 페이지별 JSON-LD (Article, Product, FAQ 등)
```

---

## 2. Metadata API 2026 최신 패턴

### 2.1 정적 vs 동적 메타데이터

```typescript
// ❌ 피해야 할 패턴: 정적 페이지에 generateMetadata 사용
// generateMetadata는 서버에서 매번 실행되므로 오버헤드 발생

// ✅ 정적 페이지: metadata 객체 사용
export const metadata: Metadata = {
  title: '대시보드 | 이룸',
  description: '나만의 뷰티/웰니스 분석 결과를 한눈에',
};

// ✅ 동적 페이지: generateMetadata 함수 사용
export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  const analysis = await getAnalysis(id);

  return {
    title: `${analysis.type} 분석 결과 | 이룸`,
    description: analysis.summary,
    openGraph: {
      images: [`/api/og/analysis/${id}`],
    },
  };
}
```

### 2.2 metadataBase 설정 (필수)

```typescript
// app/layout.tsx
export const metadata: Metadata = {
  metadataBase: new URL(
    process.env.NEXT_PUBLIC_SITE_URL || 'https://yiroom.app'
  ),
  // 이후 상대 경로 사용 가능
  openGraph: {
    images: '/og-image.png', // 자동으로 절대 URL로 변환
  },
};
```

### 2.3 Template 패턴

```typescript
// app/layout.tsx - 루트 레이아웃
export const metadata: Metadata = {
  title: {
    default: '이룸 - 온전한 나는?',
    template: '%s | 이룸', // 하위 페이지 제목 포맷
  },
};

// app/analysis/skin/page.tsx
export const metadata: Metadata = {
  title: '피부 분석', // 결과: "피부 분석 | 이룸"
};
```

---

## 3. 동적 OG 이미지 생성 (next/og)

### 3.1 기본 구조

```typescript
// app/api/og/route.tsx
import { ImageResponse } from 'next/og';

export const runtime = 'edge';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const title = searchParams.get('title') || '이룸';
  const type = searchParams.get('type') || 'default';

  // 폰트 로드 (Noto Sans KR)
  const fontData = await fetch(
    new URL('../../assets/fonts/NotoSansKR-Bold.ttf', import.meta.url)
  ).then((res) => res.arrayBuffer());

  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
          fontFamily: 'Noto Sans KR',
        }}
      >
        <div style={{ fontSize: 60, fontWeight: 700, color: 'white' }}>
          {title}
        </div>
        <div style={{ fontSize: 30, color: 'rgba(255,255,255,0.8)', marginTop: 20 }}>
          이룸 - 온전한 나는?
        </div>
      </div>
    ),
    {
      width: 1200,
      height: 630,
      fonts: [
        {
          name: 'Noto Sans KR',
          data: fontData,
          style: 'normal',
          weight: 700,
        },
      ],
    }
  );
}
```

### 3.2 분석 결과용 OG 이미지

```typescript
// app/api/og/analysis/[id]/route.tsx
import { ImageResponse } from 'next/og';
import { getAnalysisSummary } from '@/lib/api/analysis';

export const runtime = 'edge';

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  const analysis = await getAnalysisSummary(params.id);

  // 분석 타입별 배경색/아이콘 매핑
  const typeStyles = {
    'personal-color': { bg: '#FFE4E1', icon: '🎨' },
    skin: { bg: '#E0F7FA', icon: '✨' },
    body: { bg: '#F3E5F5', icon: '💪' },
  };

  const style = typeStyles[analysis.type] || typeStyles.skin;

  return new ImageResponse(
    (
      <div style={{ /* ... 분석 결과 요약 렌더링 */ }}>
        <span>{style.icon}</span>
        <h1>{analysis.title}</h1>
        <p>{analysis.summary}</p>
      </div>
    ),
    { width: 1200, height: 630 }
  );
}
```

---

## 4. JSON-LD 구조화 데이터

### 4.1 페이지 타입별 JSON-LD

```typescript
// components/seo/JsonLd.tsx
'use client';

interface JsonLdProps {
  data: Record<string, unknown>;
}

export function JsonLd({ data }: JsonLdProps) {
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }}
    />
  );
}

// 사용 예시: 분석 결과 페이지
export function AnalysisResultJsonLd({ analysis }: { analysis: Analysis }) {
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: `${analysis.type} 분석 결과`,
    description: analysis.summary,
    author: {
      '@type': 'Organization',
      name: '이룸',
    },
    datePublished: analysis.createdAt,
    publisher: {
      '@type': 'Organization',
      name: '이룸',
      logo: {
        '@type': 'ImageObject',
        url: 'https://yiroom.app/logo.png',
      },
    },
  };

  return <JsonLd data={jsonLd} />;
}
```

### 4.2 FAQ JSON-LD (GEO 최적화)

```typescript
// components/seo/FaqJsonLd.tsx
export function FaqJsonLd({ faqs }: { faqs: FAQ[] }) {
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: faqs.map((faq) => ({
      '@type': 'Question',
      name: faq.question,
      acceptedAnswer: {
        '@type': 'Answer',
        text: faq.answer,
      },
    })),
  };

  return <JsonLd data={jsonLd} />;
}
```

### 4.3 Product JSON-LD (제품 추천용)

```typescript
// components/seo/ProductJsonLd.tsx
export function ProductJsonLd({ product }: { product: Product }) {
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: product.name,
    image: product.imageUrl,
    description: product.description,
    brand: {
      '@type': 'Brand',
      name: product.brand,
    },
    offers: {
      '@type': 'Offer',
      price: product.price,
      priceCurrency: 'KRW',
      availability: 'https://schema.org/InStock',
      url: product.affiliateUrl,
    },
    aggregateRating: product.rating ? {
      '@type': 'AggregateRating',
      ratingValue: product.rating,
      reviewCount: product.reviewCount,
    } : undefined,
  };

  return <JsonLd data={jsonLd} />;
}
```

---

## 5. Sitemap 및 Robots 설정

### 5.1 sitemap.ts

```typescript
// app/sitemap.ts
import { MetadataRoute } from 'next';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://yiroom.app';

  // 정적 페이지
  const staticPages = [
    '',
    '/analysis/personal-color',
    '/analysis/skin',
    '/analysis/body',
    '/dashboard',
    '/products',
    '/nutrition',
    '/workout',
  ].map((route) => ({
    url: `${baseUrl}${route}`,
    lastModified: new Date(),
    changeFrequency: 'weekly' as const,
    priority: route === '' ? 1 : 0.8,
  }));

  // 동적 페이지 (선택적 - 공개 콘텐츠만)
  // const articles = await getPublicArticles();
  // const articlePages = articles.map((article) => ({
  //   url: `${baseUrl}/blog/${article.slug}`,
  //   lastModified: article.updatedAt,
  //   changeFrequency: 'monthly' as const,
  //   priority: 0.6,
  // }));

  return [...staticPages];
}
```

### 5.2 robots.ts

```typescript
// app/robots.ts
import { MetadataRoute } from 'next';

export default function robots(): MetadataRoute.Robots {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://yiroom.app';

  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: [
          '/api/',
          '/admin/',
          '/dashboard/', // 개인화 페이지 제외
          '/profile/',
          '/analysis/*/result/', // 분석 결과 개인정보
        ],
      },
    ],
    sitemap: `${baseUrl}/sitemap.xml`,
  };
}
```

---

## 6. 국제화 SEO (i18n)

### 6.1 hreflang 설정

```typescript
// app/layout.tsx - 언어별 대체 URL
export const metadata: Metadata = {
  alternates: {
    canonical: '/',
    languages: {
      'ko-KR': '/ko',
      'en-US': '/en',
      'ja-JP': '/ja',
    },
  },
};
```

### 6.2 언어별 메타데이터

```typescript
// app/[locale]/layout.tsx
export async function generateMetadata({
  params,
}: {
  params: { locale: string };
}): Promise<Metadata> {
  const { locale } = await params;

  const titles = {
    ko: '이룸 - 온전한 나는?',
    en: 'Yiroom - Know Yourself, Wholly',
    ja: 'イルム - 完全な私とは？',
  };

  const descriptions = {
    ko: 'AI 퍼스널 컬러, 피부, 체형 분석으로 나만의 맞춤 뷰티 솔루션',
    en: 'Personalized beauty solutions with AI personal color, skin, and body analysis',
    ja: 'AIパーソナルカラー、肌、体型分析による自分だけのビューティーソリューション',
  };

  return {
    title: titles[locale] || titles.ko,
    description: descriptions[locale] || descriptions.ko,
    openGraph: {
      locale: locale === 'ko' ? 'ko_KR' : locale === 'ja' ? 'ja_JP' : 'en_US',
    },
  };
}
```

---

## 7. Core Web Vitals 최적화

### 7.1 LCP 최적화

```typescript
// 1. 중요 이미지 priority 설정
<Image src="/hero.png" priority alt="Hero" />

// 2. 폰트 최적화 (이미 적용됨)
const notoSansKR = Noto_Sans_KR({
  display: 'swap',
  preload: true,
});

// 3. Critical CSS 인라인화 (Next.js 자동)
```

### 7.2 CLS 방지

```typescript
// 이미지 크기 명시
<Image
  src={imageUrl}
  width={400}
  height={300}
  alt="Product"
  placeholder="blur"
  blurDataURL={blurHash}
/>

// 스켈레톤 UI 사용
{isLoading ? <Skeleton className="h-[300px]" /> : <Content />}
```

### 7.3 INP 대응 (React 19)

```typescript
// useTransition으로 무거운 업데이트 분리
const [isPending, startTransition] = useTransition();

function handleFilter(value: string) {
  startTransition(() => {
    setFilter(value); // 비긴급 업데이트
  });
}
```

---

## 8. GEO (Generative Engine Optimization)

### 8.1 AI 검색엔진 최적화

```markdown
## GEO 체크리스트

✅ FAQ + JSON-LD: AI 엔진(Gemini, ChatGPT Search, Perplexity) 인용 확률 증가
✅ 명확한 질문-답변 구조
✅ 구조화된 데이터 (Schema.org)
✅ 신뢰할 수 있는 출처 인용
✅ 간결하고 직접적인 답변 형식
```

### 8.2 FAQ 섹션 추가 권장

```typescript
// 분석 페이지에 FAQ 추가
const analysisPageFaqs = [
  {
    question: '퍼스널컬러 분석은 어떻게 진행되나요?',
    answer: 'AI가 얼굴 이미지를 분석하여 피부 톤, 언더톤을 파악하고 4계절 유형 중 가장 적합한 컬러를 추천합니다.',
  },
  // ...
];
```

---

## 9. 구현 체크리스트

### 즉시 적용 (P0)

- [ ] `app/sitemap.ts` 생성
- [ ] `app/robots.ts` 생성
- [ ] 분석 결과 페이지 `generateMetadata` 추가
- [ ] FAQ JSON-LD 추가 (주요 페이지)

### 단기 적용 (P1)

- [ ] 동적 OG 이미지 API 구현 (`/api/og/`)
- [ ] 페이지별 JSON-LD 분리 (Product, Article)
- [ ] Core Web Vitals 모니터링 설정

### 장기 적용 (P2)

- [ ] 다국어 SEO (hreflang)
- [ ] 구조화 데이터 테스트 자동화
- [ ] 검색 콘솔 연동 자동화

---

## 10. 참고 자료

- [Next.js generateMetadata 공식 문서](https://nextjs.org/docs/app/api-reference/functions/generate-metadata)
- [How to Configure SEO in Next.js 16](https://jsdevspace.substack.com/p/how-to-configure-seo-in-nextjs-16)
- [Next.js SEO Best Practices 2025](https://www.averagedevs.com/blog/nextjs-seo-best-practices)
- [The Complete Next.js SEO Guide](https://strapi.io/blog/nextjs-seo)
- [Google Rich Results Test](https://search.google.com/test/rich-results)

---

**Version**: 1.0 | **Priority**: P0 Critical
