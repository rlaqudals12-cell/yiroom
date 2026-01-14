'use client';

import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { Droplets, ListOrdered, FlaskConical, Sparkles, Construction } from 'lucide-react';
import { CleansingGuide } from './CleansingGuide';
import type { SkinType } from '@/lib/mock/cleanser-types';

interface SolutionTabsProps {
  userSkinType?: SkinType;
  className?: string;
}

/**
 * 준비 중 플레이스홀더 컴포넌트
 */
function ComingSoon({ title, description }: { title: string; description: string }) {
  return (
    <Card className="border-dashed">
      <CardContent className="flex flex-col items-center justify-center py-12">
        <Construction className="h-12 w-12 text-muted-foreground mb-4" />
        <h3 className="font-semibold text-lg mb-2">{title}</h3>
        <p className="text-sm text-muted-foreground text-center max-w-md">{description}</p>
      </CardContent>
    </Card>
  );
}

/**
 * 피부 상세 솔루션 메인 탭 컴포넌트
 * 클렌징 가이드, 스킨케어 순서, 성분 사전, 나만의 루틴 포함
 */
export function SolutionTabs({ userSkinType, className }: SolutionTabsProps) {
  return (
    <div className={cn('', className)} data-testid="solution-tabs">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-primary" />
            피부 상세 솔루션
          </CardTitle>
        </CardHeader>

        <CardContent>
          <Tabs defaultValue="cleansing" className="w-full">
            <TabsList className="grid w-full grid-cols-4 h-auto">
              <TabsTrigger value="cleansing" className="flex flex-col items-center gap-1 py-2">
                <Droplets className="h-4 w-4" />
                <span className="text-xs">클렌징</span>
              </TabsTrigger>
              <TabsTrigger value="order" className="flex flex-col items-center gap-1 py-2">
                <ListOrdered className="h-4 w-4" />
                <span className="text-xs">순서</span>
              </TabsTrigger>
              <TabsTrigger value="ingredients" className="flex flex-col items-center gap-1 py-2">
                <FlaskConical className="h-4 w-4" />
                <span className="text-xs">성분</span>
              </TabsTrigger>
              <TabsTrigger value="routine" className="flex flex-col items-center gap-1 py-2">
                <Sparkles className="h-4 w-4" />
                <span className="text-xs">루틴</span>
              </TabsTrigger>
            </TabsList>

            {/* 클렌징 가이드 탭 */}
            <TabsContent value="cleansing" className="mt-4">
              <CleansingGuide userSkinType={userSkinType} />
            </TabsContent>

            {/* 스킨케어 순서 탭 (Phase 2) */}
            <TabsContent value="order" className="mt-4">
              <ComingSoon
                title="스킨케어 순서 가이드"
                description="세안 → 토너 → 에센스 → 세럼 → 크림 → 선크림까지, 올바른 스킨케어 순서와 각 단계별 역할을 알려드립니다."
              />
            </TabsContent>

            {/* 성분 사전 탭 (Phase 2) */}
            <TabsContent value="ingredients" className="mt-4">
              <ComingSoon
                title="스킨케어 성분 사전"
                description="화장품에 자주 등장하는 성분들의 효능과 주의사항을 쉽게 설명해드립니다. 성분을 검색하고 내 피부에 맞는지 확인해보세요."
              />
            </TabsContent>

            {/* 나만의 루틴 탭 (Phase 3) */}
            <TabsContent value="routine" className="mt-4">
              <ComingSoon
                title="나만의 루틴 저장"
                description="내가 사용하는 제품들로 맞춤 루틴을 만들고 관리할 수 있습니다. 제품 사용 순서와 빈도를 기록해보세요."
              />
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}

export default SolutionTabs;
