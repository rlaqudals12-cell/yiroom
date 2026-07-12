/**
 * JSON-LD 구조화 데이터 컴포넌트
 * SEO 최적화를 위한 구조화 데이터 (Schema.org)
 */

// 실서빙 도메인 기준 절대 URL — layout.tsx metadataBase와 동일 규칙 (하드코딩 금지, 2026-07 브랜드 감사)
const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://yiroom.app';

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
  url = SITE_URL,
  logo = `${SITE_URL}/logo.png`,
  description = '셀카 한 장으로 퍼스널컬러·피부·체형·헤어·메이크업 다섯 가지를 AI가 분석하고, 오늘 입을 옷까지 추천해주는 뷰티 플랫폼',
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
  url = SITE_URL,
  description = 'AI가 해석하는 다섯 가지 시각 정체성 — 퍼스널 컬러·피부·체형·헤어·메이크업',
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
    // aggregateRating 제거: 실제 평점 데이터가 없는 상태의 자체 평점은 기만 광고 소지 (2026-07 법률 감사)
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
