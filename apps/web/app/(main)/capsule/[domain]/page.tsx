'use client';

import { useState, useEffect, useCallback } from 'react';
import { useUser } from '@clerk/nextjs';
import { useRouter, useParams, notFound } from 'next/navigation';
import {
  ArrowLeft,
  Loader2,
  AlertTriangle,
  Package,
  Sparkles,
  ShoppingBag,
  ExternalLink,
  Clock,
} from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

// ===== API 응답 계약 (GET /api/capsule/[domain] — capsule-repository Capsule<T>) =====
// items는 {id, item: <도메인 아이템>, profileFitScore, ...} 래퍼 구조.
// 기존엔 item.label 등을 직접 읽어 전부 빈 카드로 렌더되던 버그 (2026-07-08 감사 수리).

interface ApiSolutionProduct {
  id: string;
  name: string;
  brand: string;
  priceKrw?: number;
  imageUrl?: string;
  purchaseUrl?: string;
}

interface ApiCapsuleItem {
  id: string;
  item?: {
    name?: string;
    category?: string;
    solutionProduct?: ApiSolutionProduct;
  } | null;
  profileFitScore?: number;
  addedAt?: string;
}

interface ApiCapsule {
  id: string;
  domainId: string;
  items?: ApiCapsuleItem[];
  ccs?: number;
  createdAt?: string;
  updatedAt?: string;
}

// ===== 화면 표시용 뷰 모델 =====

interface CapsuleItem {
  id: string;
  label: string;
  reason?: string;
  category?: string;
  score?: number;
  productUrl?: string;
}

interface Capsule {
  id: string;
  domainId: string;
  items: CapsuleItem[];
  ccsScore?: number;
  updatedAt?: string;
}

// 카테고리 코드 → 사용자 노출 한국어 (영문 코드 노출 방지)
const CATEGORY_LABELS: Record<string, string> = {
  // skin
  cleanser: '클렌저',
  toner: '토너',
  serum: '세럼',
  moisturizer: '보습',
  sunscreen: '자외선 차단',
  mask: '마스크',
  'eye-cream': '아이크림',
  exfoliator: '각질 케어',
  // makeup (PC의 makeup 카테고리 포함)
  base: '베이스',
  eye: '아이',
  lip: '립',
  cheek: '치크',
  brow: '브로우',
  setting: '세팅',
  makeup: '메이크업',
  // hair
  shampoo: '샴푸',
  conditioner: '컨디셔너',
  treatment: '트리트먼트',
  'scalp-care': '두피 케어',
  styling: '스타일링',
  'hair-oil': '헤어 오일',
  // fashion
  top: '상의',
  bottom: '하의',
  outer: '아우터',
  dress: '원피스',
  shoes: '슈즈',
  bag: '가방',
  accessory: '액세서리',
  // personal-color
  clothing: '의류',
  'hair-color': '헤어 컬러',
  // body
  'posture-correction': '자세 교정',
  'stretching-routine': '스트레칭',
  'strength-plan': '근력',
  'body-alignment': '얼라인먼트',
  'lifestyle-habit': '생활 습관',
};

/** API 아이템 래퍼 → 뷰 모델 (실제품 부착 시 브랜드·가격을 보조 라인으로) */
function mapApiItem(raw: ApiCapsuleItem, idx: number): CapsuleItem {
  const inner = raw.item ?? {};
  const product = inner.solutionProduct;
  let reason: string | undefined;
  if (product) {
    const priceText =
      product.priceKrw != null ? ` · ${product.priceKrw.toLocaleString('ko-KR')}원` : '';
    reason = `${product.brand} ${product.name}${priceText}`;
  }

  return {
    id: raw.id ?? `item-${idx}`,
    label: inner.name ?? '아이템',
    reason,
    category: inner.category ? (CATEGORY_LABELS[inner.category] ?? inner.category) : undefined,
    // insertItems 기본값 0은 미산정 상태 — 0점으로 표시하지 않음
    score:
      typeof raw.profileFitScore === 'number' && raw.profileFitScore > 0
        ? raw.profileFitScore
        : undefined,
    productUrl: product?.purchaseUrl,
  };
}

function mapApiCapsule(raw: ApiCapsule): Capsule {
  return {
    id: raw.id,
    domainId: raw.domainId,
    items: (raw.items ?? []).map(mapApiItem),
    ccsScore: typeof raw.ccs === 'number' ? raw.ccs : undefined,
    updatedAt: raw.updatedAt,
  };
}

// 도메인 메타데이터
const DOMAIN_META: Record<string, { name: string; color: string; description: string }> = {
  skin: {
    name: '스킨케어',
    color: '#60A5FA',
    description: '피부 타입에 맞는 필수 스킨케어 아이템',
  },
  fashion: {
    name: '패션',
    color: '#F472B6',
    description: '체형과 퍼스널 컬러에 어울리는 핵심 아이템',
  },
  hair: {
    name: '헤어',
    color: '#D4A24E',
    description: '헤어 타입과 얼굴형에 맞는 관리 아이템',
  },
  makeup: {
    name: '메이크업',
    color: '#D45ABF',
    description: '퍼스널 컬러 기반 메이크업 에센셜',
  },
  'personal-color': {
    name: '퍼스널 컬러',
    color: '#F472B6',
    description: '나만의 컬러 팔레트 핵심 아이템',
  },
  body: {
    name: '체형',
    color: '#A78BFA',
    description: '체형 관리에 도움이 되는 핵심 아이템',
  },
};

/**
 * 도메인별 캡슐 상세 페이지
 *
 * useParams()로 domain 추출, 캡슐 아이템 목록 + 큐레이션 버튼
 */
export default function DomainCapsulePage(): React.ReactElement {
  const { isSignedIn, isLoaded } = useUser();
  const router = useRouter();
  const params = useParams<{ domain: string }>();
  const domain = params.domain;

  const meta = DOMAIN_META[domain] ?? {
    name: domain,
    color: '#6366F1',
    description: '캡슐 아이템',
  };

  const [capsule, setCapsule] = useState<Capsule | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isCurating, setIsCurating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchCapsule = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const res = await fetch(`/api/capsule/${domain}`);
      if (res.status === 404) {
        // 유효하지 않은 도메인
        setError('존재하지 않는 도메인이에요.');
        return;
      }
      if (!res.ok) throw new Error('Failed to fetch');

      const json = await res.json();
      if (json.success) {
        // 캡슐이 아직 없으면 data가 null — 빈 상태로 렌더
        setCapsule(json.data ? mapApiCapsule(json.data as ApiCapsule) : null);
      }
    } catch {
      setError('캡슐 데이터를 불러올 수 없어요. 잠시 후 다시 시도해주세요.');
    } finally {
      setIsLoading(false);
    }
  }, [domain]);

  // 큐레이션 실행
  const handleCurate = useCallback(async () => {
    setIsCurating(true);
    setError(null);

    try {
      const res = await fetch(`/api/capsule/${domain}/curate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({}),
      });

      if (!res.ok) {
        const json = await res.json().catch(() => null);
        const userMsg =
          json?.error?.userMessage ?? '큐레이션에 실패했어요. 먼저 분석을 완료해주세요.';
        setError(userMsg);
        return;
      }

      const json = await res.json();
      // curate 응답은 {capsule, ccs} 래퍼 — data 직접 세팅 시 무반응이던 버그 (2026-07-08)
      if (json.success && json.data?.capsule) {
        const mapped = mapApiCapsule(json.data.capsule as ApiCapsule);
        // 캡슐 행에 ccs가 없으면 CCS 계산 결과에서 보충
        if (mapped.ccsScore == null && typeof json.data.ccs?.score === 'number') {
          mapped.ccsScore = json.data.ccs.score;
        }
        setCapsule(mapped);
      }
    } catch {
      setError('큐레이션에 실패했어요. 잠시 후 다시 시도해주세요.');
    } finally {
      setIsCurating(false);
    }
  }, [domain]);

  useEffect(() => {
    if (isLoaded && isSignedIn) {
      fetchCapsule();
    }
  }, [isLoaded, isSignedIn, fetchCapsule]);

  // ADR-098: 허용 도메인(5축 + 패션)만. 영양/운동/구강 등 제외 도메인은 존재하지 않음.
  if (!DOMAIN_META[domain]) {
    notFound();
  }

  // 인증 로딩
  if (!isLoaded) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]" data-testid="capsule-domain">
        <Loader2 className="h-8 w-8 animate-spin text-indigo-500" />
      </div>
    );
  }

  // 미로그인
  if (!isSignedIn) {
    return (
      <div className="container mx-auto px-4 py-12 text-center" data-testid="capsule-domain">
        <Package className="h-12 w-12 mx-auto mb-4 text-slate-400" />
        <h2 className="text-xl font-bold mb-2">로그인이 필요해요</h2>
        <p className="text-muted-foreground mb-4">캡슐을 확인하려면 먼저 로그인해주세요.</p>
        <Button onClick={() => router.push('/sign-in')}>로그인하기</Button>
      </div>
    );
  }

  const items = capsule?.items ?? [];

  return (
    <div className="container mx-auto px-4 py-6 pb-24" data-testid="capsule-domain">
      {/* 뒤로 가기 + 헤더 */}
      <div className="mb-6">
        <button
          onClick={() => router.push('/capsule')}
          className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground mb-3 transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          캡슐 워드로브
        </button>
        <div className="flex items-center gap-3 mb-1">
          <div
            className="w-10 h-10 rounded-xl flex items-center justify-center"
            style={{ backgroundColor: `${meta.color}20` }}
          >
            <Sparkles className="h-5 w-5" style={{ color: meta.color }} />
          </div>
          <div>
            <h1 className="text-2xl font-bold">{meta.name} 캡슐</h1>
            <p className="text-sm text-muted-foreground">{meta.description}</p>
          </div>
        </div>
      </div>

      {/* 로딩 */}
      {isLoading && (
        <div className="space-y-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-20 bg-slate-200 dark:bg-slate-700 rounded-xl animate-pulse" />
          ))}
        </div>
      )}

      {/* 에러 */}
      {error && (
        <div className="text-center py-12">
          <AlertTriangle className="h-10 w-10 mx-auto mb-3 text-amber-500" />
          <p className="text-muted-foreground mb-4">{error}</p>
          <Button onClick={fetchCapsule} variant="outline" size="sm">
            다시 시도하기
          </Button>
        </div>
      )}

      {/* CCS 점수 (있으면) */}
      {!isLoading && !error && capsule?.ccsScore != null && (
        <Card className="p-4 mb-4">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">캡슐 큐레이션 점수 (CCS)</span>
            <span className="text-lg font-bold" style={{ color: meta.color }}>
              {capsule.ccsScore}점
            </span>
          </div>
        </Card>
      )}

      {/* 빈 상태: 캡슐 없음 */}
      {!isLoading && !error && items.length === 0 && (
        <div className="text-center py-12">
          <Package className="h-12 w-12 mx-auto mb-4 text-slate-400" />
          <h3 className="font-semibold mb-2">아직 캡슐이 없어요</h3>
          <p className="text-sm text-muted-foreground mb-4">
            큐레이션을 시작해서 나에게 맞는 아이템을 추천받아보세요.
          </p>
          <Button onClick={handleCurate} disabled={isCurating}>
            {isCurating ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
                큐레이션 중...
              </>
            ) : (
              <>
                <ShoppingBag className="h-4 w-4 mr-2" />
                큐레이션 시작하기
              </>
            )}
          </Button>
        </div>
      )}

      {/* 아이템 리스트 */}
      {!isLoading && !error && items.length > 0 && (
        <>
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-semibold text-muted-foreground">아이템 {items.length}개</h3>
            <Button variant="outline" size="sm" onClick={handleCurate} disabled={isCurating}>
              {isCurating ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin mr-1" />
              ) : (
                <ShoppingBag className="h-3.5 w-3.5 mr-1" />
              )}
              다시 큐레이션
            </Button>
          </div>

          <div className="space-y-2">
            {items.map((item, idx) => (
              <Card key={item.id ?? idx} className="p-4">
                <div className="flex items-start justify-between">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span
                        className="text-xs font-medium px-2 py-0.5 rounded-full"
                        style={{
                          backgroundColor: `${meta.color}20`,
                          color: meta.color,
                        }}
                      >
                        #{idx + 1}
                      </span>
                      {item.category && (
                        <span className="text-xs text-muted-foreground">{item.category}</span>
                      )}
                    </div>
                    <p className="text-sm font-medium">{item.label}</p>
                    {item.reason && (
                      <p className="text-xs text-muted-foreground mt-1">{item.reason}</p>
                    )}
                    {item.score != null && (
                      <div className="flex items-center gap-1 mt-1.5">
                        <div className="w-16 h-1.5 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
                          <div
                            className="h-full rounded-full"
                            style={{
                              width: `${Math.min(100, item.score)}%`,
                              backgroundColor: meta.color,
                            }}
                          />
                        </div>
                        <span className="text-[10px] text-muted-foreground">{item.score}점</span>
                      </div>
                    )}
                  </div>

                  {/* 제품 링크 (있으면) */}
                  {item.productUrl && (
                    <a
                      href={item.productUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex-shrink-0 ml-3 p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                    >
                      <ExternalLink className="h-4 w-4 text-muted-foreground" />
                    </a>
                  )}
                </div>
              </Card>
            ))}
          </div>

          {/* 마지막 업데이트 시각 */}
          {capsule?.updatedAt && (
            <div className="flex items-center gap-1 mt-4 text-xs text-muted-foreground justify-center">
              <Clock className="h-3 w-3" />
              <span>
                마지막 업데이트:{' '}
                {new Date(capsule.updatedAt).toLocaleDateString('ko-KR', {
                  month: 'long',
                  day: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit',
                })}
              </span>
            </div>
          )}
        </>
      )}
    </div>
  );
}
