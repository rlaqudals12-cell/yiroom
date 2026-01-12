'use client';

/**
 * Phase J P3-D: 코디 공유 모달
 * 이미지 미리보기 + 공유/다운로드/복사 옵션
 */

import { useEffect, useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { Download, Copy, Share2, Loader2, Check } from 'lucide-react';
import { VisuallyHidden } from '@radix-ui/react-visually-hidden';
import OutfitShareCard from './OutfitShareCard';
import { useOutfitShare } from '@/hooks/useOutfitShare';
import type { FullOutfit } from '@/types/styling';
import type { SeasonType } from '@/lib/mock/personal-color';

interface OutfitShareModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  outfit: FullOutfit | null;
  seasonType: SeasonType;
}

export default function OutfitShareModal({
  open,
  onOpenChange,
  outfit,
  seasonType,
}: OutfitShareModalProps) {
  const { cardRef, isGenerating, shareOutfit, downloadImage, copyToClipboard, canShare } =
    useOutfitShare(outfit, seasonType);

  const [copied, setCopied] = useState(false);

  // 복사 상태 리셋
  useEffect(() => {
    if (!open) {
      setCopied(false);
    }
  }, [open]);

  if (!outfit) return null;

  // 공유 핸들러
  const handleShare = async () => {
    const success = await shareOutfit();
    if (success) {
      toast.success('공유되었습니다');
      onOpenChange(false);
    }
  };

  // 다운로드 핸들러
  const handleDownload = async () => {
    const success = await downloadImage();
    if (success) {
      toast.success('이미지가 다운로드되었습니다');
    }
  };

  // 복사 핸들러
  const handleCopy = async () => {
    const success = await copyToClipboard();
    if (success) {
      setCopied(true);
      toast.success('클립보드에 복사되었습니다');
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md p-0 overflow-hidden" data-testid="outfit-share-modal">
        <DialogHeader className="p-4 pb-0">
          <DialogTitle className="flex items-center gap-2">
            <Share2 className="w-5 h-5" />
            코디 공유
          </DialogTitle>
          <VisuallyHidden asChild>
            <DialogDescription>코디를 이미지로 저장하거나 공유하세요</DialogDescription>
          </VisuallyHidden>
        </DialogHeader>

        {/* 미리보기 영역 */}
        <div className="px-4 py-2">
          <div className="bg-muted/30 rounded-lg p-4 flex justify-center overflow-auto max-h-[400px]">
            <div className="transform scale-[0.85] origin-top">
              <OutfitShareCard ref={cardRef} outfit={outfit} seasonType={seasonType} />
            </div>
          </div>
        </div>

        {/* 액션 버튼 */}
        <div className="p-4 pt-2 space-y-2">
          {/* 공유 버튼 (지원되는 경우만) */}
          {canShare && (
            <Button className="w-full" onClick={handleShare} disabled={isGenerating}>
              {isGenerating ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <Share2 className="w-4 h-4 mr-2" />
              )}
              공유하기
            </Button>
          )}

          <div className="flex gap-2">
            {/* 다운로드 */}
            <Button
              variant="outline"
              className="flex-1"
              onClick={handleDownload}
              disabled={isGenerating}
            >
              {isGenerating ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <Download className="w-4 h-4 mr-2" />
              )}
              저장
            </Button>

            {/* 복사 */}
            <Button
              variant="outline"
              className="flex-1"
              onClick={handleCopy}
              disabled={isGenerating}
            >
              {copied ? (
                <>
                  <Check className="w-4 h-4 mr-2 text-green-500" />
                  복사됨
                </>
              ) : isGenerating ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <>
                  <Copy className="w-4 h-4 mr-2" />
                  복사
                </>
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
