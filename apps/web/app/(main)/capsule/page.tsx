'use client';

import { useState, useEffect, useCallback } from 'react';
import { useUser } from '@clerk/nextjs';
import { useRouter } from 'next/navigation';
import {
  Droplets,
  Shirt,
  Scissors,
  Palette,
  Sparkles,
  PersonStanding,
  CheckCircle2,
  AlertTriangle,
  ArrowRight,
  Loader2,
  Package,
} from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

// 시각 정체성 도메인 정의 (ADR-098: 영양/운동/구강 제외 — 5축+패션)
const DOMAINS = [
  { id: 'skin', name: '스킨케어', icon: Droplets, color: '#60A5FA' },
  { id: 'fashion', name: '패션', icon: Shirt, color: '#F472B6' },
  { id: 'hair', name: '헤어', icon: Scissors, color: '#D4A24E' },
  { id: 'makeup', name: '메이크업', icon: Palette, color: '#D45ABF' },
  { id: 'personal-color', name: '퍼스널 컬러', icon: Sparkles, color: '#F472B6' },
  { id: 'body', name: '체형', icon: PersonStanding, color: '#A78BFA' },
] as const;

interface GapData {
  gaps: Array<{
    domainId: string;
    domainName: string;
    currentCount: number;
    optimalCount: number;
    gap: number;
    hasCapsule: boolean;
  }>;
  totalGap: number;
  completedDomains: number;
  totalDomains: number;
}

/**
 * 캡슐 워드로브 대시보드
 *
 * 시각 정체성 도메인 그리드 + Daily Capsule 요약 + 갭 분석 CTA
 */
export default function CapsuleDashboardPage(): React.ReactElement {
  const { isSignedIn, isLoaded } = useUser();
  const router = useRouter();

  const [gapData, setGapData] = useState<GapData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // 오늘의 루틴 요약카드 제거(2026-08-01): 같은 데이터의 3번째 렌더링이었음 —
  // "오늘" 표면은 홈 위젯(요약·체크)+/capsule/daily(정본) 정확히 2개로 확정(ADR-111)
  const fetchData = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const gapRes = await fetch('/api/capsule/gap');

      if (gapRes.ok) {
        const gapJson = await gapRes.json();
        if (gapJson.success) {
          setGapData(gapJson.data);
        }
      }
    } catch {
      setError('플랜 데이터를 불러올 수 없어요. 잠시 후 다시 시도해주세요.');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (isLoaded && isSignedIn) {
      fetchData();
    }
  }, [isLoaded, isSignedIn, fetchData]);

  // 인증 로딩
  if (!isLoaded) {
    return (
      <div
        className="flex items-center justify-center min-h-[60vh]"
        data-testid="capsule-dashboard"
      >
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  // 미로그인
  if (!isSignedIn) {
    return (
      <div className="container mx-auto px-4 py-12 text-center" data-testid="capsule-dashboard">
        <Package className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
        <h2 className="text-xl font-bold mb-2">로그인이 필요해요</h2>
        <p className="text-muted-foreground mb-4">나만의 플랜을 보려면 먼저 로그인해주세요.</p>
        <Button onClick={() => router.push('/sign-in')}>로그인하기</Button>
      </div>
    );
  }

  // 데이터 로딩
  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-6" data-testid="capsule-dashboard">
        <div className="mb-6">
          <div className="h-8 w-48 bg-muted rounded animate-pulse" />
          <div className="h-4 w-64 bg-muted rounded mt-2 animate-pulse" />
        </div>
        {/* 도메인 그리드와 동일한 6칸 (5축 + 패션) */}
        <div className="grid grid-cols-3 gap-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="h-28 bg-muted rounded-2xl animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  // 에러
  if (error) {
    return (
      <div className="container mx-auto px-4 py-12 text-center" data-testid="capsule-dashboard">
        <AlertTriangle className="h-12 w-12 mx-auto mb-4 text-amber-500" />
        <h2 className="text-xl font-bold mb-2">문제가 발생했어요</h2>
        <p className="text-muted-foreground mb-4">{error}</p>
        <Button onClick={fetchData} variant="outline">
          다시 시도하기
        </Button>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-6 pb-24" data-testid="capsule-dashboard">
      {/* 헤더 — "캡슐" 용어는 사용자 표면에서 제거 (2026-07-08 피드백: 초보자가 모르는 내부 용어) */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold">나만의 플랜</h1>
        <p className="mt-1 text-muted-foreground">나에게 꼭 맞는 뷰티·스타일 플랜을 관리해요</p>
      </div>

      {/* 시각 정체성 도메인 그리드 */}
      <div className="grid grid-cols-3 gap-3 mb-6">
        {DOMAINS.map((domain) => {
          const Icon = domain.icon;
          // 갭 데이터에서 해당 도메인 찾기
          const gapItem = gapData?.gaps.find((g) => g.domainId === domain.id);
          const hasItems = gapItem ? gapItem.currentCount > 0 : false;

          return (
            <Card
              key={domain.id}
              className="p-4 cursor-pointer hover:shadow-lg dark:hover:shadow-none transition-all hover:scale-[1.02] text-center"
              onClick={() => router.push(`/capsule/${domain.id}`)}
            >
              <div
                className="mx-auto w-10 h-10 rounded-xl flex items-center justify-center mb-2"
                style={{ backgroundColor: `${domain.color}20` }}
              >
                <Icon className="h-5 w-5" style={{ color: domain.color }} />
              </div>
              <p className="text-xs font-medium truncate">{domain.name}</p>
              {gapItem && (
                <p className="text-[10px] text-muted-foreground mt-1">
                  {hasItems ? `${gapItem.currentCount}/${gapItem.optimalCount}` : '시작하기'}
                </p>
              )}
            </Card>
          );
        })}
      </div>

      {/* 갭 분석 CTA */}
      {gapData && gapData.totalGap > 0 && (
        <Card
          className="p-4 cursor-pointer hover:shadow-lg dark:hover:shadow-none transition-shadow bg-card"
          onClick={() => router.push('/capsule/gap')}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-xl bg-primary/10">
                <AlertTriangle className="h-5 w-5 text-primary" />
              </div>
              <div>
                <h3 className="font-semibold text-sm">부족한 영역이 있어요</h3>
                <p className="text-xs text-muted-foreground">
                  {gapData.completedDomains}/{gapData.totalDomains} 영역 완성 · {gapData.totalGap}개
                  아이템 추가 필요
                </p>
              </div>
            </div>
            <ArrowRight className="h-4 w-4 text-muted-foreground flex-shrink-0" />
          </div>
        </Card>
      )}

      {/* 전체 완성 시 */}
      {gapData && gapData.totalGap === 0 && (
        <Card className="p-4 bg-card">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-primary/10">
              {/* 완료 상태 기호 — 장식 Sparkles 대신 의미 있는 체크 */}
              <CheckCircle2 className="h-5 w-5 text-primary" />
            </div>
            <div>
              <h3 className="font-semibold text-sm">플랜이 완성되었어요!</h3>
              <p className="text-xs text-muted-foreground">모든 영역의 플랜이 잘 갖춰져 있어요.</p>
            </div>
          </div>
        </Card>
      )}
    </div>
  );
}
