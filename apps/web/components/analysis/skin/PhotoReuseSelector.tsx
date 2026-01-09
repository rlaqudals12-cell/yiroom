'use client';

import { Camera, Sparkles } from 'lucide-react';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import type { PhotoReuseEligibility } from '@/lib/analysis/photo-reuse';

interface PhotoReuseSelectorProps {
  eligibility: PhotoReuseEligibility;
  onSelectReuse: () => void;
  onSelectNewCapture: () => void;
  className?: string;
}

/**
 * 사진 재사용 선택 컴포넌트
 * - 퍼스널 컬러 분석 사진을 피부 분석에 재사용할 수 있는 경우 선택지 제공
 * - 재사용 불가 시 새 촬영 버튼만 표시
 */
export function PhotoReuseSelector({
  eligibility,
  onSelectReuse,
  onSelectNewCapture,
  className,
}: PhotoReuseSelectorProps) {
  // 재사용 불가 시 새 촬영만 표시
  if (!eligibility.eligible || !eligibility.sourceImage) {
    return (
      <div className={cn('space-y-4', className)} data-testid="photo-reuse-selector-new-only">
        <Button onClick={onSelectNewCapture} className="w-full" size="lg">
          <Camera className="w-4 h-4 mr-2" />
          사진 촬영하기
        </Button>

        {/* 재사용 불가 사유 안내 */}
        {eligibility.reason && (
          <p className="text-xs text-muted-foreground text-center">
            {getReason(eligibility.reason)}
          </p>
        )}
      </div>
    );
  }

  const { sourceImage } = eligibility;
  const daysSinceCapture = Math.floor(
    (Date.now() - sourceImage.analyzedAt.getTime()) / (1000 * 60 * 60 * 24)
  );

  return (
    <div className={cn('space-y-4', className)} data-testid="photo-reuse-selector">
      {/* 안내 메시지 */}
      <div className="text-sm text-muted-foreground flex items-center gap-2">
        <Sparkles className="w-4 h-4 text-primary" />
        최근 퍼스널 컬러 분석 사진이 있어요!
      </div>

      {/* 선택지 */}
      <div className="grid grid-cols-2 gap-3">
        {/* 재사용 옵션 */}
        <button
          type="button"
          onClick={onSelectReuse}
          className="relative p-4 rounded-xl border-2 border-primary bg-primary/5 hover:bg-primary/10 transition-colors text-left"
          data-testid="reuse-option"
        >
          <div className="aspect-square relative mb-3 rounded-lg overflow-hidden bg-muted">
            <Image
              src={sourceImage.thumbnailUrl || sourceImage.imageUrl}
              alt="퍼스널 컬러 분석 사진"
              fill
              className="object-cover"
              sizes="(max-width: 768px) 50vw, 200px"
            />
            <Badge className="absolute top-2 right-2 bg-primary text-primary-foreground">
              추천
            </Badge>
          </div>
          <div className="text-sm font-medium">이 사진 사용하기</div>
          <div className="text-xs text-muted-foreground">
            {daysSinceCapture === 0 ? '오늘' : `${daysSinceCapture}일 전`} 촬영
          </div>
        </button>

        {/* 새 촬영 옵션 */}
        <button
          type="button"
          onClick={onSelectNewCapture}
          className="p-4 rounded-xl border-2 border-border hover:border-primary/50 transition-colors text-left"
          data-testid="new-capture-option"
        >
          <div className="aspect-square flex items-center justify-center mb-3 rounded-lg bg-muted">
            <Camera className="w-8 h-8 text-muted-foreground" />
          </div>
          <div className="text-sm font-medium">새로 촬영하기</div>
          <div className="text-xs text-muted-foreground">더 정확한 분석</div>
        </button>
      </div>

      {/* 안내 */}
      <p className="text-xs text-muted-foreground text-center">
        피부 상태가 바뀌었다면 새로 촬영을 추천해요
      </p>
    </div>
  );
}

// 재사용 불가 사유 메시지
function getReason(reason: NonNullable<PhotoReuseEligibility['reason']>): string {
  switch (reason) {
    case 'no_consent':
      return '이전 분석에서 사진 저장에 동의하지 않았어요';
    case 'expired':
      return '저장된 사진의 보존 기한이 지났어요';
    case 'no_image':
      return '최근 7일 내 분석한 사진이 없어요';
    case 'low_quality':
      return '이전 사진의 품질이 분석에 적합하지 않아요';
    case 'wrong_angle':
      return '정면 사진만 재사용할 수 있어요';
    default:
      return '';
  }
}

export default PhotoReuseSelector;
