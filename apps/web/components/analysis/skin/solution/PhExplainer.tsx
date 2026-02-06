'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { Info, AlertTriangle, CheckCircle2, Shield } from 'lucide-react';
import { PH_EXPLANATIONS } from '@/lib/mock/cleanser-types';

interface PhExplainerProps {
  className?: string;
}

/**
 * pH 스케일 시각화
 */
function PhScale() {
  const segments = [
    { label: '산성', range: '0-4', color: 'bg-red-400', width: '15%' },
    { label: '약산성', range: '4.5-5.5', color: 'bg-green-400', width: '10%', highlight: true },
    { label: '중성', range: '6-7', color: 'bg-blue-400', width: '10%' },
    { label: '약알칼리', range: '8-10', color: 'bg-purple-400', width: '20%' },
    { label: '알칼리', range: '11-14', color: 'bg-violet-500', width: '30%' },
  ];

  return (
    <div className="space-y-2">
      {/* pH 바 */}
      <div className="relative h-8 rounded-full overflow-hidden flex">
        {segments.map((seg, idx) => (
          <div
            key={idx}
            className={cn(
              'h-full flex items-center justify-center text-xs font-medium text-white transition-all',
              seg.color,
              seg.highlight && 'ring-2 ring-offset-2 ring-green-500'
            )}
            style={{ width: seg.width }}
          >
            {seg.range}
          </div>
        ))}
      </div>

      {/* 피부 pH 표시 */}
      <div className="relative h-6">
        <div
          className="absolute flex flex-col items-center"
          style={{ left: '20%', transform: 'translateX(-50%)' }}
        >
          <div className="w-0.5 h-3 bg-foreground" />
          <span className="text-xs font-medium">피부 pH</span>
          <span className="text-xs text-muted-foreground">4.5-5.5</span>
        </div>
      </div>
    </div>
  );
}

/**
 * pH와 피부 장벽 설명 컴포넌트
 */
export function PhExplainer({ className }: PhExplainerProps) {
  return (
    <Card className={cn('', className)} data-testid="ph-explainer">
      <CardHeader>
        <CardTitle className="text-lg flex items-center gap-2">
          <Shield className="h-5 w-5 text-blue-500" />
          pH와 피부 장벽
        </CardTitle>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* pH 스케일 */}
        <div>
          <h4 className="text-sm font-medium mb-3">pH 스케일</h4>
          <PhScale />
        </div>

        {/* 건강한 피부 pH */}
        <div className="bg-green-50 dark:bg-green-950/30 rounded-lg p-4">
          <div className="flex items-start gap-3">
            <CheckCircle2 className="h-5 w-5 text-green-500 mt-0.5" />
            <div>
              <h4 className="font-medium text-green-700 dark:text-green-400">
                건강한 피부 pH: 4.5-5.5
              </h4>
              <p className="text-sm text-muted-foreground mt-1">
                피부는 약산성 상태에서 가장 건강해요. 이 pH 범위에서 피부 장벽이 최적의 상태를
                유지하고, 유해균의 성장을 억제해요.
              </p>
            </div>
          </div>
        </div>

        {/* pH 범위별 설명 */}
        <div className="space-y-4">
          {/* 약산성 */}
          <div className="border rounded-lg p-4">
            <div className="flex items-center justify-between mb-2">
              <h4 className="font-medium flex items-center gap-2">
                <span className="w-3 h-3 rounded bg-green-400" />
                {PH_EXPLANATIONS.acidic.label}
              </h4>
              <Badge variant="outline" className="text-xs">
                pH {PH_EXPLANATIONS.acidic.range}
              </Badge>
            </div>
            <p className="text-sm text-muted-foreground mb-2">
              {PH_EXPLANATIONS.acidic.description}
            </p>
            <div className="flex flex-wrap gap-1">
              {PH_EXPLANATIONS.acidic.benefits.map((benefit, idx) => (
                <Badge key={idx} variant="secondary" className="text-xs">
                  {benefit}
                </Badge>
              ))}
            </div>
          </div>

          {/* 중성 */}
          <div className="border rounded-lg p-4">
            <div className="flex items-center justify-between mb-2">
              <h4 className="font-medium flex items-center gap-2">
                <span className="w-3 h-3 rounded bg-blue-400" />
                {PH_EXPLANATIONS.neutral.label}
              </h4>
              <Badge variant="outline" className="text-xs">
                pH {PH_EXPLANATIONS.neutral.range}
              </Badge>
            </div>
            <p className="text-sm text-muted-foreground mb-2">
              {PH_EXPLANATIONS.neutral.description}
            </p>
            <div className="flex flex-wrap gap-1">
              {PH_EXPLANATIONS.neutral.benefits.map((benefit, idx) => (
                <Badge key={idx} variant="secondary" className="text-xs">
                  {benefit}
                </Badge>
              ))}
            </div>
          </div>

          {/* 약알칼리성 */}
          <div className="border border-orange-200 dark:border-orange-800 rounded-lg p-4">
            <div className="flex items-center justify-between mb-2">
              <h4 className="font-medium flex items-center gap-2">
                <span className="w-3 h-3 rounded bg-purple-400" />
                {PH_EXPLANATIONS.alkaline.label}
              </h4>
              <Badge variant="outline" className="text-xs border-orange-500 text-orange-600">
                pH {PH_EXPLANATIONS.alkaline.range}
              </Badge>
            </div>
            <p className="text-sm text-muted-foreground mb-2">
              {PH_EXPLANATIONS.alkaline.description}
            </p>
            <div className="flex flex-wrap gap-1 mb-2">
              {PH_EXPLANATIONS.alkaline.benefits.map((benefit, idx) => (
                <Badge key={idx} variant="secondary" className="text-xs">
                  {benefit}
                </Badge>
              ))}
            </div>
            {PH_EXPLANATIONS.alkaline.risks && (
              <div className="flex items-start gap-2 mt-3 text-orange-600 dark:text-orange-400">
                <AlertTriangle className="h-4 w-4 mt-0.5" />
                <span className="text-xs">주의: {PH_EXPLANATIONS.alkaline.risks.join(', ')}</span>
              </div>
            )}
          </div>
        </div>

        {/* 팁 */}
        <div className="bg-muted/50 rounded-lg p-4">
          <div className="flex items-start gap-2">
            <Info className="h-5 w-5 text-blue-500 mt-0.5" />
            <div>
              <h4 className="font-medium text-sm">클렌저 pH 확인 팁</h4>
              <ul className="text-sm text-muted-foreground mt-1 space-y-1">
                <li>• 제품 설명에 &ldquo;약산성&rdquo; 표기 확인</li>
                <li>• pH 테스트 스트립으로 직접 측정 가능</li>
                <li>• 사용 후 피부가 당기면 pH가 높을 수 있음</li>
              </ul>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export default PhExplainer;
