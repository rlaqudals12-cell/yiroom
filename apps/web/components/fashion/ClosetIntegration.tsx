'use client';

/**
 * ClosetIntegration 컴포넌트
 *
 * 사용자 옷장과 패션 추천 연동 UI
 * - 옷장 아이템과 코디 매칭 점수 표시
 * - 카테고리별 매칭 점수 상세 (색상, 체형, 시즌, 스타일)
 * - 추천 이유 및 스타일링 팁 제공
 *
 * @module components/fashion/ClosetIntegration
 * @see docs/adr/ADR-050-fashion-closet-crossmodule.md
 * @see docs/specs/SDD-PHASE-K-COMPREHENSIVE-UPGRADE.md K-2
 */

import { useState, useCallback } from 'react';
import {
  Shirt,
  Sparkles,
  TrendingUp,
  ChevronRight,
  Check,
  AlertCircle,
  Palette,
  User,
  Calendar,
  Star,
  Info,
} from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import { cn } from '@/lib/utils';

import type { OutfitRecommendation, StyleCategory } from '@/lib/fashion';
import { STYLE_CATEGORY_LABELS } from '@/lib/fashion';
import type {
  MatchScore,
  ClosetRecommendation,
} from '@/lib/inventory/closetMatcher';
import type { InventoryItem } from '@/types/inventory';

// 옷장 아이템 타입 (InventoryItem 기반)
type ClosetItem = InventoryItem;

// 아이템에서 색상 추출 헬퍼
function getItemColor(item: InventoryItem): string {
  const metadata = item.metadata as Record<string, unknown>;
  if (metadata?.color) {
    if (Array.isArray(metadata.color)) {
      return metadata.color[0] as string || '#e5e5e5';
    }
    return metadata.color as string || '#e5e5e5';
  }
  return '#e5e5e5';
}

// 점수별 등급 계산
function getScoreGrade(score: number): { label: string; color: string } {
  if (score >= 90) return { label: '완벽', color: 'text-green-600' };
  if (score >= 80) return { label: '아주 좋음', color: 'text-green-500' };
  if (score >= 70) return { label: '좋음', color: 'text-blue-500' };
  if (score >= 60) return { label: '보통', color: 'text-yellow-500' };
  return { label: '개선 필요', color: 'text-orange-500' };
}

// 점수 카테고리 정보
const SCORE_CATEGORIES = [
  {
    key: 'colorScore' as const,
    label: '색상 조화',
    icon: Palette,
    weight: 40,
    description: '퍼스널 컬러와의 조화도',
  },
  {
    key: 'bodyTypeScore' as const,
    label: '체형 적합도',
    icon: User,
    weight: 35,
    description: '체형에 맞는 핏과 라인',
  },
  {
    key: 'seasonScore' as const,
    label: '계절 적합도',
    icon: Calendar,
    weight: 15,
    description: '현재 계절에 맞는 스타일',
  },
  {
    key: 'styleScore' as const,
    label: '스타일 매칭',
    icon: Star,
    weight: 10,
    description: '개인 스타일과의 일치도',
  },
];

interface ClosetIntegrationProps {
  /** 사용자 옷장 아이템 목록 */
  closetItems: ClosetItem[];
  /** 추천 코디 */
  recommendation?: OutfitRecommendation;
  /** 스타일 카테고리 */
  styleCategory?: StyleCategory;
  /** 옷장 추천 결과 목록 */
  closetRecommendations?: ClosetRecommendation[];
  /** 매칭 점수 */
  matchScore?: MatchScore;
  /** 아이템 선택 시 콜백 */
  onItemSelect?: (item: ClosetItem) => void;
  /** 코디 완성 콜백 */
  onCompleteOutfit?: (items: ClosetItem[]) => void;
  /** 추가 클래스명 */
  className?: string;
}

/**
 * 옷장 연동 UI 컴포넌트
 */
export function ClosetIntegration({
  closetItems,
  recommendation,
  styleCategory = 'casual',
  closetRecommendations = [],
  matchScore,
  onItemSelect,
  onCompleteOutfit,
  className,
}: ClosetIntegrationProps) {
  // 선택된 아이템들
  const [selectedItems, setSelectedItems] = useState<ClosetItem[]>([]);

  // 아이템 선택/해제 토글
  const toggleItemSelection = useCallback(
    (item: ClosetItem) => {
      setSelectedItems((prev) => {
        const isSelected = prev.some((i) => i.id === item.id);
        if (isSelected) {
          return prev.filter((i) => i.id !== item.id);
        }
        return [...prev, item];
      });
      onItemSelect?.(item);
    },
    [onItemSelect]
  );

  // 코디 완성 처리
  const handleCompleteOutfit = useCallback(() => {
    if (selectedItems.length > 0) {
      onCompleteOutfit?.(selectedItems);
    }
  }, [selectedItems, onCompleteOutfit]);

  // 총 매칭 점수 계산
  const totalScore = matchScore?.total ?? 0;
  const scoreGrade = getScoreGrade(totalScore);

  // 트렌드 보너스 여부
  const hasTrendBonus = matchScore?.trendBonus && matchScore.trendBonus > 0;

  return (
    <div className={cn('space-y-4', className)} data-testid="closet-integration">
      {/* 매칭 점수 요약 카드 */}
      {matchScore && (
        <Card data-testid="match-score-summary">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg flex items-center gap-2">
                <Sparkles className="h-5 w-5 text-primary" />
                매칭 분석
              </CardTitle>
              {hasTrendBonus && (
                <Badge variant="secondary" className="gap-1">
                  <TrendingUp className="h-3 w-3" />
                  트렌드 보너스 +{matchScore.trendBonus}
                </Badge>
              )}
            </div>
            {styleCategory && (
              <CardDescription>
                {STYLE_CATEGORY_LABELS[styleCategory]} 스타일 기준
              </CardDescription>
            )}
          </CardHeader>
          <CardContent className="space-y-4">
            {/* 총점 표시 */}
            <div className="flex items-center gap-4">
              <div className="flex-1">
                <div className="flex items-baseline justify-between mb-1">
                  <span className="text-sm font-medium">종합 매칭도</span>
                  <span className={cn('text-2xl font-bold', scoreGrade.color)}>
                    {totalScore}점
                  </span>
                </div>
                <Progress value={totalScore} className="h-3" />
              </div>
              <Badge
                variant={totalScore >= 70 ? 'default' : 'secondary'}
                className="shrink-0"
              >
                {scoreGrade.label}
              </Badge>
            </div>

            <div className="border-t my-2" />

            {/* 상세 점수 */}
            <div className="grid grid-cols-2 gap-3" data-testid="score-details">
              {SCORE_CATEGORIES.map((category) => {
                const score = matchScore[category.key] ?? 0;
                const Icon = category.icon;

                return (
                  <TooltipProvider key={category.key}>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <div className="flex items-center gap-2 p-2 rounded-lg bg-muted/50 cursor-help">
                          <Icon className="h-4 w-4 text-muted-foreground shrink-0" />
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between">
                              <span className="text-xs text-muted-foreground truncate">
                                {category.label}
                              </span>
                              <span className="text-sm font-medium ml-1">
                                {score}
                              </span>
                            </div>
                            <Progress
                              value={score}
                              className="h-1.5 mt-1"
                            />
                          </div>
                        </div>
                      </TooltipTrigger>
                      <TooltipContent side="top" className="max-w-[200px]">
                        <p className="text-xs">
                          {category.description}
                          <br />
                          <span className="text-muted-foreground">
                            (가중치: {category.weight}%)
                          </span>
                        </p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {/* 옷장 추천 아이템 목록 */}
      {closetRecommendations.length > 0 && (
        <Card data-testid="closet-recommendations">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center gap-2">
              <Shirt className="h-5 w-5" />내 옷장에서 추천
            </CardTitle>
            <CardDescription>
              보유한 아이템 중 이 코디와 잘 어울리는 아이템
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Accordion type="single" collapsible className="w-full">
              {closetRecommendations.map((rec, index) => {
                const isSelected = selectedItems.some(
                  (i) => i.id === rec.item.id
                );
                const itemScore = rec.score.total;
                const itemGrade = getScoreGrade(itemScore);

                return (
                  <AccordionItem
                    key={rec.item.id}
                    value={rec.item.id}
                    data-testid={`closet-item-${index}`}
                  >
                    <AccordionTrigger className="hover:no-underline">
                      <div className="flex items-center gap-3 w-full pr-4">
                        {/* 아이템 색상 미리보기 */}
                        <div
                          className="h-10 w-10 rounded-lg border shadow-sm shrink-0"
                          style={{
                            backgroundColor: getItemColor(rec.item)
                          }}
                        />

                        {/* 아이템 정보 */}
                        <div className="flex-1 text-left">
                          <p className="font-medium text-sm">{rec.item.name}</p>
                          <p className="text-xs text-muted-foreground">
                            {rec.item.category}
                          </p>
                        </div>

                        {/* 점수 */}
                        <Badge
                          variant={itemScore >= 70 ? 'default' : 'secondary'}
                          className={cn('shrink-0', itemGrade.color)}
                        >
                          {itemScore}점
                        </Badge>

                        {/* 선택 표시 */}
                        {isSelected && (
                          <Check className="h-4 w-4 text-green-500 shrink-0" />
                        )}
                      </div>
                    </AccordionTrigger>
                    <AccordionContent>
                      <div className="space-y-3 pt-2">
                        {/* 추천 이유 */}
                        {rec.reasons && rec.reasons.length > 0 && (
                          <div className="space-y-1">
                            <p className="text-xs font-medium text-muted-foreground flex items-center gap-1">
                              <Info className="h-3 w-3" />
                              추천 이유
                            </p>
                            <ul className="space-y-1">
                              {rec.reasons.map((reason, i) => (
                                <li
                                  key={i}
                                  className="text-sm flex items-start gap-2"
                                >
                                  <Check className="h-3 w-3 text-green-500 mt-1 shrink-0" />
                                  {reason}
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}

                        {/* 상세 점수 */}
                        <div className="grid grid-cols-4 gap-2 text-center">
                          <div className="p-2 rounded bg-muted/50">
                            <p className="text-xs text-muted-foreground">색상</p>
                            <p className="text-sm font-medium">
                              {rec.score.colorScore}
                            </p>
                          </div>
                          <div className="p-2 rounded bg-muted/50">
                            <p className="text-xs text-muted-foreground">체형</p>
                            <p className="text-sm font-medium">
                              {rec.score.bodyTypeScore}
                            </p>
                          </div>
                          <div className="p-2 rounded bg-muted/50">
                            <p className="text-xs text-muted-foreground">계절</p>
                            <p className="text-sm font-medium">
                              {rec.score.seasonScore}
                            </p>
                          </div>
                          <div className="p-2 rounded bg-muted/50">
                            <p className="text-xs text-muted-foreground">스타일</p>
                            <p className="text-sm font-medium">
                              {rec.score.styleScore}
                            </p>
                          </div>
                        </div>

                        {/* 선택 버튼 */}
                        <Button
                          variant={isSelected ? 'secondary' : 'default'}
                          size="sm"
                          className="w-full"
                          onClick={() => toggleItemSelection(rec.item)}
                        >
                          {isSelected ? (
                            <>
                              <Check className="h-4 w-4 mr-1" />
                              선택됨
                            </>
                          ) : (
                            '코디에 추가'
                          )}
                        </Button>
                      </div>
                    </AccordionContent>
                  </AccordionItem>
                );
              })}
            </Accordion>
          </CardContent>
        </Card>
      )}

      {/* 선택된 아이템 요약 및 코디 완성 */}
      {selectedItems.length > 0 && (
        <Card data-testid="selected-items-summary">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="flex -space-x-2">
                  {selectedItems.slice(0, 4).map((item, idx) => (
                    <div
                      key={item.id}
                      className="h-8 w-8 rounded-full border-2 border-background shadow-sm"
                      style={{ backgroundColor: getItemColor(item) }}
                    />
                  ))}
                  {selectedItems.length > 4 && (
                    <div className="h-8 w-8 rounded-full border-2 border-background bg-muted flex items-center justify-center text-xs font-medium">
                      +{selectedItems.length - 4}
                    </div>
                  )}
                </div>
                <span className="text-sm text-muted-foreground">
                  {selectedItems.length}개 아이템 선택됨
                </span>
              </div>
              <Button size="sm" onClick={handleCompleteOutfit}>
                코디 완성
                <ChevronRight className="h-4 w-4 ml-1" />
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* 빈 상태 */}
      {closetItems.length === 0 && closetRecommendations.length === 0 && (
        <Card data-testid="empty-closet">
          <CardContent className="p-8 text-center">
            <AlertCircle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="font-medium mb-2">옷장이 비어 있어요</h3>
            <p className="text-sm text-muted-foreground mb-4">
              옷장에 아이템을 추가하면 코디 매칭 점수를 확인할 수 있어요.
            </p>
            <Button variant="outline">옷장에 아이템 추가하기</Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

/**
 * 매칭 점수 상세 카드 컴포넌트
 */
interface MatchScoreCardProps {
  score: MatchScore;
  title?: string;
  className?: string;
}

export function MatchScoreCard({
  score,
  title = '매칭 점수',
  className,
}: MatchScoreCardProps) {
  const totalScore = score.total;
  const grade = getScoreGrade(totalScore);

  return (
    <Card className={className} data-testid="match-score-card">
      <CardHeader className="pb-2">
        <CardTitle className="text-base">{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex items-center gap-4 mb-4">
          <div
            className={cn(
              'text-4xl font-bold',
              grade.color
            )}
          >
            {totalScore}
          </div>
          <div className="flex-1">
            <Progress value={totalScore} className="h-2" />
            <p className="text-xs text-muted-foreground mt-1">{grade.label}</p>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-2">
          {SCORE_CATEGORIES.map((category) => {
            const Icon = category.icon;
            const categoryScore = score[category.key] ?? 0;

            return (
              <div
                key={category.key}
                className="flex items-center gap-2 text-sm"
              >
                <Icon className="h-4 w-4 text-muted-foreground" />
                <span className="text-muted-foreground">{category.label}</span>
                <span className="font-medium ml-auto">{categoryScore}</span>
              </div>
            );
          })}
        </div>

        {score.trendBonus && score.trendBonus > 0 && (
          <div className="flex items-center gap-2 text-sm mt-3 pt-3 border-t">
            <TrendingUp className="h-4 w-4 text-primary" />
            <span className="text-muted-foreground">트렌드 보너스</span>
            <span className="font-medium text-primary ml-auto">
              +{score.trendBonus}
            </span>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export default ClosetIntegration;
