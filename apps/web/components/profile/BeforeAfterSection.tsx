'use client';

/**
 * 프로필 컨디션 변화 비교 섹션
 * - 첫 분석과 최근 분석을 나란히 표시 (컨디션 축: 피부·헤어)
 * - 점수 변화 표시 (개선/악화/유지)
 * - 분석 2회 미만이면 안내 메시지
 *
 * 왜 컨디션 축만: 체형은 부위별 계측 점수의 평균이라 "점수 변화"로 표기하면
 * ADR-120 채점 금지 원칙 위반 — 컨디션(시간에 따라 실제로 변하는 상태)만 비교한다.
 */

import { useState, useEffect } from 'react';
import { useUser } from '@clerk/nextjs';
import { useClerkSupabaseClient } from '@/lib/supabase/clerk-client';
import { getFirstAndLatestAnalysis, calculatePeriod } from '@/lib/analysis/historyService';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { TrendingUp, TrendingDown, Minus, ArrowRight } from 'lucide-react';
import type { AnalysisType, AnalysisHistoryItem } from '@/types/analysis-history';

// 분석 타입 표시용 매핑 (컨디션 축만 — tryTypes와 동기)
const ANALYSIS_TYPE_LABELS: Partial<Record<AnalysisType, string>> = {
  skin: '피부',
  hair: '헤어',
};

function ScoreChange({ before, after }: { before: number; after: number }): React.JSX.Element {
  const diff = after - before;
  if (diff > 2) {
    return (
      <span className="flex items-center gap-1 text-sm font-medium text-green-600">
        <TrendingUp className="h-4 w-4" />+{diff}점 개선
      </span>
    );
  }
  if (diff < -2) {
    return (
      <span className="flex items-center gap-1 text-sm font-medium text-red-500">
        <TrendingDown className="h-4 w-4" />
        {diff}점 변화
      </span>
    );
  }
  return (
    <span className="flex items-center gap-1 text-sm font-medium text-muted-foreground">
      <Minus className="h-4 w-4" />
      유지 중
    </span>
  );
}

function CompareCard({
  label,
  item,
  sublabel,
}: {
  label: string;
  item: AnalysisHistoryItem;
  sublabel: string;
}): React.JSX.Element {
  const formattedDate = new Date(item.date).toLocaleDateString('ko-KR', {
    month: 'short',
    day: 'numeric',
  });

  return (
    <div className="flex-1 rounded-xl bg-muted/50 p-3 text-center">
      {item.imageUrl ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={item.imageUrl}
          alt={sublabel}
          className="mx-auto mb-2 h-16 w-16 rounded-lg object-cover"
        />
      ) : (
        <div className="mx-auto mb-2 flex h-16 w-16 items-center justify-center rounded-lg bg-muted">
          <span className="text-sm font-medium text-muted-foreground">{label}</span>
        </div>
      )}
      <p className="text-xs text-muted-foreground">{sublabel}</p>
      <p className="text-xs text-muted-foreground">{formattedDate}</p>
      <p className="mt-1 text-lg font-bold">{item.overallScore}점</p>
    </div>
  );
}

export function BeforeAfterSection(): React.JSX.Element | null {
  const { user, isLoaded } = useUser();
  const supabase = useClerkSupabaseClient();

  // 피부 분석이 가장 대표적이므로 기본 타입으로 사용
  const [data, setData] = useState<{
    first: AnalysisHistoryItem;
    latest: AnalysisHistoryItem;
    type: AnalysisType;
  } | null>(null);
  const [noData, setNoData] = useState(false);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    if (!isLoaded || !user?.id) return;

    // 피부 → 헤어 순으로 컨디션 비교 가능한 타입 찾기
    // 체형(body)은 부위별 계측 점수 평균 = 채점 표기 금지(ADR-120) 위반이라 제외
    const tryTypes: AnalysisType[] = ['skin', 'hair'];

    const findComparable = async (): Promise<void> => {
      for (const type of tryTypes) {
        try {
          const result = await getFirstAndLatestAnalysis(supabase, {
            type,
            userId: user.id,
          });
          if (result) {
            setData({ first: result.first, latest: result.latest, type });
            setLoaded(true);
            return;
          }
        } catch {
          // 다음 타입 시도
        }
      }
      setNoData(true);
      setLoaded(true);
    };

    findComparable();
  }, [isLoaded, user?.id, supabase]);

  if (!loaded) return null;

  if (noData || !data) {
    return (
      <Card data-testid="before-after-section">
        <CardHeader className="pb-2">
          <CardTitle className="text-base">컨디션 변화</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center gap-2 py-4">
            <p className="text-sm text-muted-foreground text-center">
              피부·헤어 분석을 2회 이상 하면 컨디션 변화를 비교할 수 있어요
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  const period = calculatePeriod(data.first.date, data.latest.date);
  // tryTypes가 컨디션 축(피부·헤어)만 시도하므로 라벨은 항상 존재 — 방어적 폴백만 유지
  const typeLabel = ANALYSIS_TYPE_LABELS[data.type] ?? '';

  return (
    <Card data-testid="before-after-section">
      <CardHeader className="pb-2">
        <CardTitle className="text-base flex items-center justify-between">
          {/* 컨디션 예외임을 제목이 직접 증명 — "피부 컨디션 변화" (ADR-120) */}
          <span>{typeLabel} 컨디션 변화</span>
          <span className="text-xs font-normal text-muted-foreground">{period} 변화</span>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex items-center gap-2">
          <CompareCard label="Before" item={data.first} sublabel="처음" />
          <ArrowRight className="h-5 w-5 shrink-0 text-muted-foreground" />
          <CompareCard label="After" item={data.latest} sublabel="최근" />
        </div>
        <div className="mt-3 flex justify-center">
          <ScoreChange before={data.first.overallScore} after={data.latest.overallScore} />
        </div>
      </CardContent>
    </Card>
  );
}
