'use client';

import { useState, useMemo } from 'react';
import { Heart, Ban, Trash2, Search, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
  SheetFooter,
} from '@/components/ui/sheet';
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { cn } from '@/lib/utils';
import {
  type UserPreference,
  type PreferenceDomain,
  type AvoidLevel,
  isCriticalAvoid,
} from '@/types/preferences';
import { AvoidLevelBadge } from './AvoidLevelBadge';
import { QuickAddSheet } from './QuickAddSheet';
import { getAvoidReasonLabel, type SupportedLocale } from '@/lib/preferences/labels';
import { useUserPreferences } from '@/hooks/useUserPreferences';

interface PreferenceManagerProps {
  /** 도메인 (optional - 모든 도메인 표시) */
  domain?: PreferenceDomain;
  /** 지역 설정 */
  locale?: SupportedLocale;
  /** 추가 className */
  className?: string;
  /** 트리거 버튼 커스텀 */
  triggerLabel?: string;
}

/**
 * 통합 선호/기피 관리 UI
 * - 좋아하는 항목 / 기피 항목 탭
 * - 검색 + 자동완성
 * - CRUD 인터랙션
 * - 기피 수준 시각화
 */
export function PreferenceManager({
  domain,
  locale = 'ko',
  className,
  triggerLabel = '선호도 관리',
}: PreferenceManagerProps) {
  const { preferences, isLoading, removePreference, addPreference, updatePreference } =
    useUserPreferences({ domain });

  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState<'favorites' | 'avoids'>('favorites');
  const [deleteTarget, setDeleteTarget] = useState<UserPreference | null>(null);

  // 현재 탭에 맞는 항목 필터링
  const filteredPreferences = useMemo(() => {
    const isFavorite = activeTab === 'favorites';
    return preferences
      .filter((p) => p.isFavorite === isFavorite)
      .filter(
        (p) =>
          p.itemName.toLowerCase().includes(searchQuery.toLowerCase()) ||
          (p.itemNameEn?.toLowerCase().includes(searchQuery.toLowerCase()) ?? false)
      );
  }, [preferences, activeTab, searchQuery]);

  // 탭별 개수
  const favoritesCount = preferences.filter((p) => p.isFavorite).length;
  const avoidsCount = preferences.filter((p) => !p.isFavorite).length;

  // 기피 중 위험 항목
  const criticalAvoids = preferences.filter((p) => !p.isFavorite && isCriticalAvoid(p.avoidLevel));

  // 항목 추가
  const handleAdd = async (data: {
    domain: PreferenceDomain;
    itemType: string;
    itemName: string;
    isFavorite: boolean;
    avoidLevel?: AvoidLevel;
  }) => {
    const preferenceData = {
      ...data,
      itemId: undefined,
      itemNameEn: undefined,
      priority: 3,
      source: 'user' as const,
    };
    await addPreference(preferenceData as any);
    setSearchQuery('');
  };

  // 항목 삭제
  const handleDelete = async () => {
    if (!deleteTarget) return;
    const success = await removePreference(deleteTarget.id);
    if (success) {
      setDeleteTarget(null);
    }
  };

  // 기피 수준 변경
  const handleUpdateAvoidLevel = async (id: string, newLevel: AvoidLevel | undefined) => {
    if (newLevel === undefined) return;
    await updatePreference(id, { avoidLevel: newLevel });
  };

  return (
    <div className={cn('', className)} data-testid="preference-manager">
      {/* 위험 알림 배지 */}
      {criticalAvoids.length > 0 && (
        <Badge
          variant="destructive"
          className="mb-2 gap-1 inline-flex"
          data-testid="critical-avoids-badge"
        >
          <AlertCircle className="h-3 w-3" aria-hidden="true" />
          위험 {criticalAvoids.length}개
        </Badge>
      )}

      <Sheet open={isOpen} onOpenChange={setIsOpen}>
        <SheetTrigger asChild>
          <Button variant="outline" size="sm" className="gap-2">
            <Heart className="h-4 w-4 text-pink-500" aria-hidden="true" />
            {triggerLabel}
            {favoritesCount + avoidsCount > 0 && (
              <Badge variant="secondary" className="ml-1 h-5 px-1.5">
                {favoritesCount + avoidsCount}
              </Badge>
            )}
          </Button>
        </SheetTrigger>

        <SheetContent side="bottom" className="h-[75vh] rounded-t-lg">
          <SheetHeader className="pb-4">
            <SheetTitle>선호/기피 항목 관리</SheetTitle>
          </SheetHeader>

          {/* 탭 */}
          <div className="flex gap-2 mb-4">
            <Button
              variant={activeTab === 'favorites' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setActiveTab('favorites')}
              className="flex-1 gap-2"
              aria-label={`좋아하는 항목 탭 (${favoritesCount}개)`}
            >
              <Heart className="h-4 w-4" aria-hidden="true" />
              좋아요 ({favoritesCount})
            </Button>
            <Button
              variant={activeTab === 'avoids' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setActiveTab('avoids')}
              className="flex-1 gap-2"
              aria-label={`기피 항목 탭 (${avoidsCount}개)`}
            >
              <Ban className="h-4 w-4" aria-hidden="true" />
              기피 ({avoidsCount})
            </Button>
          </div>

          {/* 검색 */}
          <div className="relative mb-4">
            <Search
              className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground"
              aria-hidden="true"
            />
            <Input
              placeholder="항목 검색..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9"
              aria-label="항목 검색"
            />
          </div>

          {/* 항목 목록 */}
          <div className="space-y-2 overflow-y-auto flex-1 mb-4 max-h-80">
            {isLoading ? (
              <div className="text-center text-muted-foreground py-8">로딩 중...</div>
            ) : filteredPreferences.length === 0 ? (
              <div className="text-center text-muted-foreground py-8">
                {activeTab === 'favorites'
                  ? '좋아하는 항목을 추가해주세요'
                  : '기피 항목을 추가해주세요'}
              </div>
            ) : (
              <div
                className="space-y-2"
                role="list"
                aria-label={`${activeTab === 'favorites' ? '좋아하는' : '기피'} 항목 목록`}
              >
                {filteredPreferences.map((pref) => (
                  <div
                    key={pref.id}
                    className="p-3 rounded-lg border bg-card hover:bg-muted/50 transition-colors group"
                    role="listitem"
                    data-testid={`preference-item-${pref.id}`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-2">
                          <h4 className="font-medium truncate">{pref.itemName}</h4>
                          {pref.itemNameEn && (
                            <span className="text-xs text-muted-foreground truncate">
                              {pref.itemNameEn}
                            </span>
                          )}
                        </div>

                        {/* 기피 항목 상세 */}
                        {!pref.isFavorite && (
                          <div className="space-y-2">
                            <div className="flex items-center gap-2 flex-wrap">
                              {pref.avoidLevel && (
                                <AvoidLevelBadge
                                  level={pref.avoidLevel}
                                  locale={locale}
                                  size="sm"
                                  showIcon={false}
                                />
                              )}
                              {pref.avoidReason && (
                                <Badge variant="outline" className="text-xs">
                                  {getAvoidReasonLabel(pref.avoidReason, locale)}
                                </Badge>
                              )}
                            </div>

                            {pref.avoidNote && (
                              <p className="text-xs text-muted-foreground italic">
                                메모: {pref.avoidNote}
                              </p>
                            )}
                          </div>
                        )}
                      </div>

                      {/* 액션 버튼 */}
                      <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        {!pref.isFavorite && pref.avoidLevel && (
                          <Button
                            size="sm"
                            variant="ghost"
                            className="h-8 w-8 p-0"
                            onClick={() => {
                              const nextLevel =
                                pref.avoidLevel === 'danger'
                                  ? 'cannot'
                                  : pref.avoidLevel === 'cannot'
                                    ? 'avoid'
                                    : 'dislike';
                              handleUpdateAvoidLevel(pref.id, nextLevel);
                            }}
                            title={`기피 수준 변경: ${pref.avoidLevel}`}
                            aria-label={`기피 수준 변경`}
                          >
                            ⬆️
                          </Button>
                        )}
                        <Button
                          size="sm"
                          variant="ghost"
                          className="h-8 w-8 p-0 text-destructive hover:text-destructive"
                          onClick={() => setDeleteTarget(pref)}
                          aria-label={`${pref.itemName} 삭제`}
                        >
                          <Trash2 className="h-4 w-4" aria-hidden="true" />
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* 푸터 */}
          <SheetFooter className="gap-2">
            <QuickAddSheet
              defaultDomain={domain}
              isFavorite={activeTab === 'favorites'}
              onAdd={handleAdd}
              locale={locale}
              className="flex-1"
            />
            <Button variant="outline" onClick={() => setIsOpen(false)} className="flex-1">
              닫기
            </Button>
          </SheetFooter>
        </SheetContent>
      </Sheet>

      {/* 삭제 확인 다이얼로그 */}
      <AlertDialog open={!!deleteTarget} onOpenChange={(open) => !open && setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>항목 삭제</AlertDialogTitle>
            <AlertDialogDescription>
              &quot;{deleteTarget?.itemName}&quot;을(를) 삭제하시겠습니까?
              <br />이 작업은 되돌릴 수 없습니다.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="space-y-2">
            <Button onClick={() => setDeleteTarget(null)} variant="outline" className="w-full">
              취소
            </Button>
            <Button
              onClick={handleDelete}
              variant="destructive"
              className="w-full"
              aria-label={`${deleteTarget?.itemName} 삭제 확인`}
            >
              삭제
            </Button>
          </div>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

export default PreferenceManager;
