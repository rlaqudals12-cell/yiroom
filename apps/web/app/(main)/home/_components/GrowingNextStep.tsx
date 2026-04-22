'use client';

/**
 * Growing State: 인과 연결 다음 분석 추천
 *
 * P-UX5: 발견의 기쁨 — "체형 분석 해보기" 대신 인과 연결 메시지
 * 완료된 분석 → 다음 추천 분석 + 연결 이유 표시
 *
 * ConnectionAwareness 연동:
 * - 인과 추천 메시지 표시 시 → expose (source→target 연결 추적)
 * - 사용자 클릭 시 → confirm
 */

import { useEffect, useCallback } from 'react';
import { useUser } from '@clerk/nextjs';
import { useClerkSupabaseClient } from '@/lib/supabase/clerk-client';
import Link from 'next/link';
import { ArrowRight, Dumbbell, Sparkles, Scissors, Wand2 } from 'lucide-react';
import type { AnalysisSummary, AnalysisType } from '@/hooks/useAnalysisStatus';
import { exposeConnection, confirmConnection } from '@/lib/connection-awareness';
import type { ConnectionModule } from '@/lib/connection-awareness';

// 인과 연결 매핑 (SDD-HOME-3STATE 섹션 3.2)
interface NextStepMapping {
  nextType: AnalysisType;
  message: (result?: string) => string;
  href: string;
  icon: typeof Dumbbell;
  sourceModule: ConnectionModule;
  targetModule: ConnectionModule;
}

const CAUSAL_MAP: Record<string, NextStepMapping> = {
  'personal-color': {
    nextType: 'body',
    message: (season) => `${season || '퍼스널 컬러'}에 맞는 코디를 추천하려면 체형 정보가 필요해요`,
    href: '/analysis/body',
    icon: Dumbbell,
    sourceModule: 'personal-color',
    targetModule: 'body',
  },
  skin: {
    nextType: 'makeup',
    message: () => '피부 타입에 맞는 메이크업 스타일을 찾아볼까요?',
    href: '/analysis/makeup',
    icon: Wand2,
    sourceModule: 'skin',
    targetModule: 'makeup',
  },
  body: {
    nextType: 'hair',
    message: () => '체형에 어울리는 헤어 스타일도 궁금하지 않으세요?',
    href: '/analysis/hair',
    icon: Scissors,
    sourceModule: 'body',
    targetModule: 'hair',
  },
  hair: {
    nextType: 'makeup',
    message: () => '헤어와 조화로운 메이크업 톤을 알아볼까요?',
    href: '/analysis/makeup',
    icon: Wand2,
    sourceModule: 'hair',
    targetModule: 'makeup',
  },
};

// 미완료 분석 목록 순서 (ADR-098: OH 제외)
const ANALYSIS_ORDER: AnalysisType[] = ['personal-color', 'skin', 'body', 'hair', 'makeup'];

// 분석 타입 → URL 경로 매핑
function getAnalysisPath(type: AnalysisType): string {
  const pathMap: Record<AnalysisType, string> = {
    'personal-color': '/analysis/personal-color',
    skin: '/analysis/skin',
    body: '/analysis/body',
    hair: '/analysis/hair',
    makeup: '/analysis/makeup',
    'oral-health': '/analysis/oral-health',
  };
  return pathMap[type];
}

// NextStep 결과에 connectionId 포함
interface NextStepResult {
  message: string;
  href: string;
  icon: typeof Dumbbell;
  connectionId?: string;
  sourceModule?: ConnectionModule;
  targetModule?: ConnectionModule;
  connectionRule?: string;
}

// 다음 추천 분석 계산 (export for testing)
export function getNextStep(analyses: AnalysisSummary[]): NextStepResult | null {
  if (analyses.length === 0) return null;

  const completedTypes = new Set(analyses.map((a) => a.type));

  // 가장 최근 완료 분석 기준
  const sorted = [...analyses].sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );

  for (const analysis of sorted) {
    const mapping = CAUSAL_MAP[analysis.type];
    if (mapping && !completedTypes.has(mapping.nextType)) {
      const message = mapping.message(analysis.summary);
      return {
        message,
        href: mapping.href,
        icon: mapping.icon,
        connectionId: `causal::${mapping.sourceModule}→${mapping.targetModule}`,
        sourceModule: mapping.sourceModule,
        targetModule: mapping.targetModule,
        connectionRule: message,
      };
    }
  }

  // Fallback: 미완료 중 첫 번째
  const nextUndone = ANALYSIS_ORDER.find((t) => !completedTypes.has(t));
  if (nextUndone) {
    return {
      message: '다음 분석을 시작해볼까요?',
      href: getAnalysisPath(nextUndone),
      icon: Sparkles,
    };
  }

  return null;
}

interface GrowingNextStepProps {
  analyses: AnalysisSummary[];
}

export default function GrowingNextStep({ analyses }: GrowingNextStepProps) {
  const { user } = useUser();
  const userId = user?.id;
  const supabase = useClerkSupabaseClient();
  const nextStep = getNextStep(analyses);

  // 인과 추천 메시지 노출 시 expose
  useEffect(() => {
    if (!userId || !nextStep?.connectionId || !nextStep.sourceModule) return;

    exposeConnection(supabase, userId, {
      connectionId: nextStep.connectionId,
      sourceModule: nextStep.sourceModule,
      targetDomain: nextStep.targetModule ?? 'analysis',
      connectionRule: nextStep.connectionRule ?? nextStep.message,
    }).catch(() => {
      // 노출 추적 실패 시 무시
    });
  }, [
    userId,
    nextStep?.connectionId,
    nextStep?.sourceModule,
    nextStep?.targetModule,
    nextStep?.connectionRule,
    nextStep?.message,
    supabase,
  ]);

  // 클릭 시 confirm
  const handleClick = useCallback(() => {
    if (!userId || !nextStep?.connectionId) return;

    confirmConnection(supabase, userId, nextStep.connectionId).catch(() => {
      // 확인 추적 실패 시 무시
    });
  }, [userId, nextStep?.connectionId, supabase]);

  if (!nextStep) return null;

  const Icon = nextStep.icon;

  return (
    <div data-testid="home-growing-next-step">
      <Link
        href={nextStep.href}
        onClick={handleClick}
        className="flex items-center gap-4 p-4 bg-gradient-to-r from-violet-50 to-indigo-50 dark:from-violet-950/20 dark:to-indigo-950/20 rounded-2xl border border-violet-200/50 dark:border-violet-800/30 hover:from-violet-100 hover:to-indigo-100 dark:hover:from-violet-950/30 dark:hover:to-indigo-950/30 transition-colors"
      >
        <div className="flex-shrink-0 w-10 h-10 flex items-center justify-center bg-violet-100 dark:bg-violet-900/30 rounded-xl">
          <Icon className="w-5 h-5 text-violet-600 dark:text-violet-400" />
        </div>
        <p className="flex-1 text-sm text-foreground">{nextStep.message}</p>
        <ArrowRight className="w-4 h-4 text-muted-foreground flex-shrink-0" />
      </Link>
    </div>
  );
}
