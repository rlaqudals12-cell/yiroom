'use client';

import { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import { Search, Droplets, BookOpen, User } from 'lucide-react';
import { CLEANSER_TYPES, type SkinType } from '@/lib/mock/cleanser-types';
import { CleanserTypeCard } from './CleanserTypeCard';
import { PhExplainer } from './PhExplainer';
import { SkinTypeRecommendation } from './SkinTypeRecommendation';

interface CleansingGuideProps {
  userSkinType?: SkinType;
  className?: string;
}

/**
 * 클렌징 가이드 메인 컴포넌트
 * 클렌저 비교, pH 설명, 피부 타입별 추천을 통합
 */
export function CleansingGuide({ userSkinType, className }: CleansingGuideProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [expandedId, setExpandedId] = useState<string | null>(null);

  // 검색 필터링
  const filteredCleansers = CLEANSER_TYPES.filter(
    (cleanser) =>
      cleanser.nameKo.includes(searchTerm) ||
      cleanser.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      cleanser.description.includes(searchTerm)
  );

  // 추천 클렌저 우선 정렬
  const sortedCleansers = [...filteredCleansers].sort((a, b) => {
    if (!userSkinType) return 0;

    const aRecommended =
      a.recommendedFor.includes(userSkinType) || a.recommendedFor.includes('all');
    const bRecommended =
      b.recommendedFor.includes(userSkinType) || b.recommendedFor.includes('all');
    const aNotRecommended = a.notRecommendedFor.includes(userSkinType);
    const bNotRecommended = b.notRecommendedFor.includes(userSkinType);

    // 추천 > 보통 > 비추천 순서
    if (aRecommended && !bRecommended) return -1;
    if (!aRecommended && bRecommended) return 1;
    if (aNotRecommended && !bNotRecommended) return 1;
    if (!aNotRecommended && bNotRecommended) return -1;
    return 0;
  });

  return (
    <div className={cn('space-y-6', className)} data-testid="cleansing-guide">
      <Tabs defaultValue="types" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="types" className="flex items-center gap-1.5">
            <Droplets className="h-4 w-4" />
            <span className="hidden sm:inline">클렌저 종류</span>
            <span className="sm:hidden">종류</span>
          </TabsTrigger>
          <TabsTrigger value="ph" className="flex items-center gap-1.5">
            <BookOpen className="h-4 w-4" />
            <span className="hidden sm:inline">pH 가이드</span>
            <span className="sm:hidden">pH</span>
          </TabsTrigger>
          <TabsTrigger value="routine" className="flex items-center gap-1.5">
            <User className="h-4 w-4" />
            <span className="hidden sm:inline">내 피부 루틴</span>
            <span className="sm:hidden">루틴</span>
          </TabsTrigger>
        </TabsList>

        {/* 클렌저 종류 탭 */}
        <TabsContent value="types" className="space-y-4 mt-4">
          {/* 검색 */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="클렌저 검색... (예: 오일, 폼, 젤)"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>

          {/* 사용자 피부 타입 안내 */}
          {userSkinType && userSkinType !== 'all' && (
            <div className="bg-primary/10 rounded-lg p-3 text-sm">
              <span className="font-medium">
                내 피부 타입:{' '}
                {userSkinType === 'dry'
                  ? '건성'
                  : userSkinType === 'oily'
                    ? '지성'
                    : userSkinType === 'combination'
                      ? '복합성'
                      : userSkinType === 'sensitive'
                        ? '민감성'
                        : '중성'}
              </span>
              <span className="text-muted-foreground ml-2">추천 클렌저가 상단에 표시됩니다</span>
            </div>
          )}

          {/* 클렌저 목록 */}
          <div className="space-y-3">
            {sortedCleansers.length > 0 ? (
              sortedCleansers.map((cleanser) => (
                <CleanserTypeCard
                  key={cleanser.id}
                  cleanser={cleanser}
                  userSkinType={userSkinType}
                  isExpanded={expandedId === cleanser.id}
                  onToggle={() => setExpandedId(expandedId === cleanser.id ? null : cleanser.id)}
                />
              ))
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                &apos;{searchTerm}&apos;에 해당하는 클렌저가 없습니다
              </div>
            )}
          </div>
        </TabsContent>

        {/* pH 가이드 탭 */}
        <TabsContent value="ph" className="mt-4">
          <PhExplainer />
        </TabsContent>

        {/* 내 피부 루틴 탭 */}
        <TabsContent value="routine" className="mt-4">
          {userSkinType && userSkinType !== 'all' ? (
            <SkinTypeRecommendation skinType={userSkinType} />
          ) : (
            <div className="text-center py-12">
              <User className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="font-medium mb-2">피부 타입 분석이 필요합니다</h3>
              <p className="text-sm text-muted-foreground">
                피부 분석을 완료하면 맞춤 클렌징 루틴을 추천해드립니다
              </p>
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}

export default CleansingGuide;
