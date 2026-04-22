/**
 * JSON-LD 구조화 데이터 컴포넌트
 * SEO 최적화를 위한 구조화 데이터 (Schema.org)
 */

interface OrganizationJsonLdProps {
  name?: string;
  url?: string;
  logo?: string;
  description?: string;
}

/**
 * Organization JSON-LD
 * 앱/회사 정보를 구조화 데이터로 제공
 */
export function OrganizationJsonLd({
  name = '이룸',
  url = 'https://yiroom.app',
  logo = 'https://yiroom.app/logo.png',
  description = 'AI가 해석하는 시각 정체성 5축(퍼스널 컬러·피부·체형·헤어·메이크업) — 거울과 옷장까지 연결해주는 뷰티 플랫폼',
}: OrganizationJsonLdProps) {
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name,
    url,
    logo,
    description,
    sameAs: [],
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
    />
  );
}

interface WebApplicationJsonLdProps {
  name?: string;
  url?: string;
  description?: string;
  operatingSystem?: string;
  applicationCategory?: string;
}

/**
 * WebApplication JSON-LD
 * PWA 앱 정보를 구조화 데이터로 제공
 */
export function WebApplicationJsonLd({
  name = '이룸',
  url = 'https://yiroom.app',
  description = 'AI가 해석하는 시각 정체성 5축 — 퍼스널 컬러·피부·체형·헤어·메이크업',
  operatingSystem = 'All',
  applicationCategory = 'HealthApplication',
}: WebApplicationJsonLdProps) {
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'WebApplication',
    name,
    url,
    description,
    operatingSystem,
    applicationCategory,
    offers: {
      '@type': 'Offer',
      price: '0',
      priceCurrency: 'KRW',
    },
    aggregateRating: {
      '@type': 'AggregateRating',
      ratingValue: '4.8',
      ratingCount: '100',
    },
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
    />
  );
}

interface BreadcrumbJsonLdProps {
  items: Array<{
    name: string;
    url: string;
  }>;
}

/**
 * Breadcrumb JSON-LD
 * 페이지 네비게이션 경로를 구조화 데이터로 제공
 */
export function BreadcrumbJsonLd({ items }: BreadcrumbJsonLdProps) {
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((item, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: item.name,
      item: item.url,
    })),
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
    />
  );
}

interface FAQJsonLdProps {
  questions: Array<{
    question: string;
    answer: string;
  }>;
}

/**
 * FAQ JSON-LD
 * FAQ 페이지용 구조화 데이터
 */
export function FAQJsonLd({ questions }: FAQJsonLdProps) {
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: questions.map((q) => ({
      '@type': 'Question',
      name: q.question,
      acceptedAnswer: {
        '@type': 'Answer',
        text: q.answer,
      },
    })),
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
    />
  );
}
