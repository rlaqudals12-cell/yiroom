/**
 * R-1 인사이트 카드 컴포넌트
 * 하이라이트, 개선사항, 팁 표시
 */

'use client';

import { Lightbulb, CheckCircle2, AlertCircle, Sparkles } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import type { ReportInsights } from '@/types/report';

interface InsightCardProps {
  insights: ReportInsights;
}

export function InsightCard({ insights }: InsightCardProps) {
  const hasAnyInsight =
    insights.highlights.length > 0 ||
    insights.improvements.length > 0 ||
    insights.tips.length > 0;

  if (!hasAnyInsight) {
    return (
      <Card data-testid="insight-card">
        <CardHeader className="pb-2">
          <CardTitle className="text-base flex items-center gap-2">
            <Lightbulb className="h-4 w-4" />
            이번 주 인사이트
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-4">
            <Sparkles className="h-8 w-8 mx-auto text-muted-foreground/50 mb-2" />
            <p className="text-sm text-muted-foreground">
              더 많은 기록이 쌓이면 인사이트가 나타나요
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card data-testid="insight-card">
      <CardHeader className="pb-2">
        <CardTitle className="text-base flex items-center gap-2">
          <Lightbulb className="h-4 w-4" />
          이번 주 인사이트
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* 하이라이트 (긍정적) */}
        {insights.highlights.length > 0 && (
          <InsightSection
            icon={<CheckCircle2 className="h-4 w-4 text-green-500" />}
            title="잘한 점"
            items={insights.highlights}
            bgColor="bg-green-50 dark:bg-green-950/20"
            textColor="text-green-700 dark:text-green-300"
          />
        )}

        {/* 개선 사항 */}
        {insights.improvements.length > 0 && (
          <InsightSection
            icon={<AlertCircle className="h-4 w-4 text-amber-500" />}
            title="개선 포인트"
            items={insights.improvements}
            bgColor="bg-amber-50 dark:bg-amber-950/20"
            textColor="text-amber-700 dark:text-amber-300"
          />
        )}

        {/* 다음 주 팁 */}
        {insights.tips.length > 0 && (
          <InsightSection
            icon={<Sparkles className="h-4 w-4 text-blue-500" />}
            title="다음 주 추천"
            items={insights.tips}
            bgColor="bg-blue-50 dark:bg-blue-950/20"
            textColor="text-blue-700 dark:text-blue-300"
          />
        )}
      </CardContent>
    </Card>
  );
}

function InsightSection({
  icon,
  title,
  items,
  bgColor,
  textColor,
}: {
  icon: React.ReactNode;
  title: string;
  items: string[];
  bgColor: string;
  textColor: string;
}) {
  return (
    <div className={`p-3 rounded-lg ${bgColor}`}>
      <div className={`flex items-center gap-2 font-medium text-sm mb-2 ${textColor}`}>
        {icon}
        {title}
      </div>
      <ul className="space-y-1.5">
        {items.map((item, index) => (
          <li key={index} className="text-sm flex items-start gap-2">
            <span className="text-muted-foreground mt-0.5">•</span>
            <span>{item}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
