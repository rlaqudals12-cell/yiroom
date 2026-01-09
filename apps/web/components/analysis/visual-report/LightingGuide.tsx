'use client';

import { Camera, Sun, Moon, CloudSun, Check, AlertTriangle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

// LightingGuide Props
export interface LightingGuideProps {
  brightness?: 'low' | 'ok' | 'high';
  uniformity?: 'uneven' | 'ok';
  hasShadow?: boolean;
  recommendation?: string;
  onQualityCheck?: (result: QualityCheckResult) => void;
  className?: string;
}

// 품질 체크 결과
export interface QualityCheckResult {
  brightness: 'low' | 'ok' | 'high';
  uniformity: 'uneven' | 'ok';
  recommendation?: string;
}

// 체크 아이템 타입
interface CheckItem {
  id: string;
  label: string;
  passed: boolean;
  icon: typeof Sun;
}

/**
 * 조명 품질 가이드 컴포넌트
 * 촬영 전 환경 체크 + 개선 권장사항 표시
 *
 * @example
 * ```tsx
 * <LightingGuide
 *   brightness="ok"
 *   uniformity="ok"
 *   hasShadow={false}
 * />
 * ```
 */
export function LightingGuide({
  brightness = 'ok',
  uniformity = 'ok',
  hasShadow = false,
  recommendation,
  className,
}: LightingGuideProps) {
  // 체크 항목 생성
  const checkItems: CheckItem[] = [
    {
      id: 'brightness',
      label: brightness === 'ok' ? '밝기 충분' : brightness === 'low' ? '밝기 부족' : '밝기 과다',
      passed: brightness === 'ok',
      icon: brightness === 'low' ? Moon : Sun,
    },
    {
      id: 'uniformity',
      label: uniformity === 'ok' ? '균일한 조명' : '조명 불균일',
      passed: uniformity === 'ok',
      icon: CloudSun,
    },
    {
      id: 'shadow',
      label: hasShadow ? '그림자가 있어요' : '그림자 없음',
      passed: !hasShadow,
      icon: CloudSun,
    },
  ];

  // 모든 항목 통과 여부
  const allPassed = checkItems.every((item) => item.passed);

  // 기본 권장 사항
  const defaultRecommendation = !allPassed ? '창가로 이동하면 더 정확해요' : '촬영 환경이 좋아요!';

  return (
    <Card
      className={cn(
        'border',
        allPassed
          ? 'bg-emerald-50 border-emerald-200 dark:bg-emerald-950/30 dark:border-emerald-800'
          : 'bg-amber-50 border-amber-200 dark:bg-amber-950/30 dark:border-amber-800',
        className
      )}
      data-testid="lighting-guide"
    >
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center gap-2 text-base">
          <Camera className="w-5 h-5" />
          촬영 환경 체크
        </CardTitle>
      </CardHeader>

      <CardContent className="space-y-3">
        {/* 체크 항목들 */}
        <ul className="space-y-2">
          {checkItems.map((item) => (
            <li key={item.id} className="flex items-center gap-2 text-sm">
              {item.passed ? (
                <Check className="w-4 h-4 text-emerald-500 shrink-0" />
              ) : (
                <AlertTriangle className="w-4 h-4 text-amber-500 shrink-0" />
              )}
              <span
                className={cn(
                  item.passed
                    ? 'text-emerald-700 dark:text-emerald-300'
                    : 'text-amber-700 dark:text-amber-300'
                )}
              >
                {item.label}
              </span>
            </li>
          ))}
        </ul>

        {/* 권장 사항 */}
        <div className="flex items-center gap-2 text-sm text-muted-foreground pt-1">
          <span className="text-amber-500">💡</span>
          <span>{recommendation || defaultRecommendation}</span>
        </div>
      </CardContent>
    </Card>
  );
}

export default LightingGuide;
