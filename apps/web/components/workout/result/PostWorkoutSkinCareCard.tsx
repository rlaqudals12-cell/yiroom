'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Droplets, ChevronDown, ChevronUp, Sparkles, AlertTriangle, ArrowRight } from 'lucide-react';
import type { SkinCareTip, SkinAnalysisSummary } from '@/lib/workout/skinTips';
import {
  getPostWorkoutSkinCareTips,
  getQuickPostWorkoutMessage,
} from '@/lib/workout/skinTips';

interface PostWorkoutSkinCareCardProps {
  workoutType: string;
  durationMinutes: number;
  skinAnalysis: SkinAnalysisSummary | null;
}

// 우선순위별 배지 스타일
const PRIORITY_STYLES = {
  high: 'bg-red-100 text-red-700 border-red-200',
  medium: 'bg-yellow-100 text-yellow-700 border-yellow-200',
  low: 'bg-green-100 text-green-700 border-green-200',
};

// 팁 카드 컴포넌트
function TipCard({ tip }: { tip: SkinCareTip }) {
  return (
    <div
      className="flex items-start gap-3 p-3 bg-card rounded-lg border border-border/50"
      data-testid="skin-tip-card"
    >
      <span className="text-xl flex-shrink-0">{tip.icon}</span>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1">
          <span className="font-medium text-foreground text-sm">{tip.title}</span>
          <span
            className={`text-xs px-1.5 py-0.5 rounded-full border ${PRIORITY_STYLES[tip.priority]}`}
          >
            {tip.priority === 'high' ? '중요' : tip.priority === 'medium' ? '권장' : '팁'}
          </span>
        </div>
        <p className="text-xs text-muted-foreground leading-relaxed">{tip.description}</p>
      </div>
    </div>
  );
}

/**
 * 운동 후 피부 관리 팁 카드
 * W-1 → S-1 연동: 운동 완료 후 피부 관리 팁 표시
 */
export default function PostWorkoutSkinCareCard({
  workoutType,
  durationMinutes,
  skinAnalysis,
}: PostWorkoutSkinCareCardProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  const quickMessage = getQuickPostWorkoutMessage(workoutType, durationMinutes);
  const tips = getPostWorkoutSkinCareTips(workoutType, durationMinutes, skinAnalysis);

  // 중요도 높은 팁이 있는지 확인
  const hasHighPriorityTips = [
    ...tips.immediateActions,
    ...tips.skinMetricTips,
  ].some((tip) => tip.priority === 'high');

  return (
    <div
      data-testid="post-workout-skin-care-card"
      className="bg-gradient-to-br from-cyan-50 via-blue-50 to-teal-50 rounded-2xl border border-cyan-100 overflow-hidden"
    >
      {/* 헤더 */}
      <div className="p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-cyan-400 to-blue-500 rounded-full flex items-center justify-center">
              <Droplets className="w-5 h-5 text-white" />
            </div>
            <div>
              <h3 className="font-bold text-foreground flex items-center gap-2">
                {quickMessage.icon} {quickMessage.title}
                {hasHighPriorityTips && (
                  <AlertTriangle className="w-4 h-4 text-amber-500" />
                )}
              </h3>
              <p className="text-sm text-cyan-600">{quickMessage.message}</p>
            </div>
          </div>
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="p-2 rounded-lg hover:bg-muted/50 transition-colors text-cyan-600"
            aria-label={isExpanded ? '접기' : '펼치기'}
          >
            {isExpanded ? (
              <ChevronUp className="w-5 h-5" />
            ) : (
              <ChevronDown className="w-5 h-5" />
            )}
          </button>
        </div>
      </div>

      {/* 확장 영역 */}
      {isExpanded && (
        <div className="px-4 pb-4 space-y-4">
          {/* 즉각 케어 팁 */}
          {tips.immediateActions.length > 0 && (
            <div data-testid="immediate-actions">
              <div className="flex items-center gap-2 mb-2">
                <Sparkles className="w-4 h-4 text-cyan-500" />
                <span className="text-sm font-medium text-foreground/80">지금 바로</span>
              </div>
              <div className="space-y-2">
                {tips.immediateActions.map((tip, index) => (
                  <TipCard key={`immediate-${index}`} tip={tip} />
                ))}
              </div>
            </div>
          )}

          {/* S-1 연동 피부 상태별 팁 */}
          {tips.skinMetricTips.length > 0 && (
            <div data-testid="skin-metric-tips">
              <div className="flex items-center gap-2 mb-2">
                <Droplets className="w-4 h-4 text-blue-500" />
                <span className="text-sm font-medium text-foreground/80">
                  내 피부 맞춤 케어
                </span>
              </div>
              <div className="space-y-2">
                {tips.skinMetricTips.map((tip, index) => (
                  <TipCard key={`skin-${index}`} tip={tip} />
                ))}
              </div>
            </div>
          )}

          {/* 일반 팁 */}
          {tips.generalTips.length > 0 && (
            <div data-testid="general-tips">
              <div className="flex items-center gap-2 mb-2">
                <span className="text-sm font-medium text-muted-foreground">추가 팁</span>
              </div>
              <div className="space-y-2">
                {tips.generalTips.map((tip, index) => (
                  <TipCard key={`general-${index}`} tip={tip} />
                ))}
              </div>
            </div>
          )}

          {/* S-1 분석 없을 때 안내 + 피부 분석 유도 */}
          {!skinAnalysis && (
            <div className="text-center py-4 bg-muted/50 rounded-lg" data-testid="skin-analysis-cta">
              <p className="text-xs text-muted-foreground mb-3">
                피부 분석을 완료하면 더 맞춤화된 팁을 받을 수 있어요!
              </p>
              <Link
                href="/analysis/skin"
                className="inline-flex items-center gap-2 px-4 py-2 bg-cyan-500 hover:bg-cyan-600 text-white text-sm font-medium rounded-lg transition-colors"
              >
                피부 분석 받기
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
