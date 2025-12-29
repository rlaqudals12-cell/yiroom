'use client';

/**
 * 가격 알림 설정 모달
 * @description 목표 가격, 할인율, 플랫폼 선택
 */

import { useState } from 'react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';

interface PriceAlertConfig {
  targetPrice?: number;
  percentDrop?: number;
  platforms: string[];
  expiresAt?: Date;
}

interface PriceAlertModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  productName?: string;
  currentPrice?: number;
  onSave?: (config: PriceAlertConfig) => void;
  onDelete?: () => void;
  existingConfig?: Partial<PriceAlertConfig>;
  className?: string;
}

const PLATFORMS = [
  { id: 'coupang', name: '쿠팡' },
  { id: 'naver', name: '네이버쇼핑' },
  { id: 'musinsa', name: '무신사' },
  { id: 'oliveyoung', name: '올리브영' },
  { id: 'iherb', name: 'iHerb' },
];

export function PriceAlertModal({
  open,
  onOpenChange,
  productName,
  currentPrice,
  onSave,
  onDelete,
  existingConfig,
  className,
}: PriceAlertModalProps) {
  const [targetPrice, setTargetPrice] = useState<string>(
    existingConfig?.targetPrice?.toString() ?? ''
  );
  const [percentDrop, setPercentDrop] = useState<string>(
    existingConfig?.percentDrop?.toString() ?? '10'
  );
  const [selectedPlatforms, setSelectedPlatforms] = useState<string[]>(
    existingConfig?.platforms ?? PLATFORMS.map((p) => p.id)
  );
  const [alertType, setAlertType] = useState<'price' | 'percent'>(
    existingConfig?.targetPrice ? 'price' : 'percent'
  );

  const togglePlatform = (platformId: string) => {
    setSelectedPlatforms((prev) =>
      prev.includes(platformId)
        ? prev.filter((id) => id !== platformId)
        : [...prev, platformId]
    );
  };

  const handleSave = () => {
    const config: PriceAlertConfig = {
      platforms: selectedPlatforms,
    };

    if (alertType === 'price' && targetPrice) {
      config.targetPrice = parseInt(targetPrice, 10);
    } else if (alertType === 'percent' && percentDrop) {
      config.percentDrop = parseInt(percentDrop, 10);
    }

    onSave?.(config);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className={cn('sm:max-w-md', className)}
        data-testid="price-alert-modal"
      >
        <DialogHeader>
          <DialogTitle>가격 알림 설정</DialogTitle>
          <DialogDescription>
            {productName
              ? `${productName}의 가격이 조건을 충족하면 알려드려요.`
              : '가격이 조건을 충족하면 알려드려요.'}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* 현재가 표시 */}
          {currentPrice && (
            <div className="text-sm text-muted-foreground">
              현재 최저가: <span className="font-bold">{currentPrice.toLocaleString()}원</span>
            </div>
          )}

          {/* 알림 타입 선택 */}
          <div className="space-y-2">
            <Label>알림 조건</Label>
            <div className="flex gap-2">
              <Button
                type="button"
                variant={alertType === 'price' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setAlertType('price')}
              >
                목표 가격
              </Button>
              <Button
                type="button"
                variant={alertType === 'percent' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setAlertType('percent')}
              >
                할인율
              </Button>
            </div>
          </div>

          {/* 목표 가격 입력 */}
          {alertType === 'price' && (
            <div className="space-y-2">
              <Label htmlFor="target-price">목표 가격</Label>
              <div className="flex items-center gap-2">
                <Input
                  id="target-price"
                  type="number"
                  value={targetPrice}
                  onChange={(e) => setTargetPrice(e.target.value)}
                  placeholder={currentPrice ? Math.floor(currentPrice * 0.9).toString() : ''}
                />
                <span className="text-sm text-muted-foreground">원</span>
              </div>
              <p className="text-xs text-muted-foreground">
                이 가격 이하로 떨어지면 알림을 보내드려요
              </p>
            </div>
          )}

          {/* 할인율 입력 */}
          {alertType === 'percent' && (
            <div className="space-y-2">
              <Label htmlFor="percent-drop">할인율</Label>
              <div className="flex items-center gap-2">
                <Input
                  id="percent-drop"
                  type="number"
                  min="5"
                  max="50"
                  value={percentDrop}
                  onChange={(e) => setPercentDrop(e.target.value)}
                />
                <span className="text-sm text-muted-foreground">% 이상</span>
              </div>
              <p className="text-xs text-muted-foreground">
                원래 가격 대비 할인율이 충족되면 알림을 보내드려요
              </p>
            </div>
          )}

          {/* 플랫폼 선택 */}
          <div className="space-y-2">
            <Label>모니터링 플랫폼</Label>
            <div className="flex flex-wrap gap-2">
              {PLATFORMS.map((platform) => (
                <Button
                  key={platform.id}
                  type="button"
                  variant={selectedPlatforms.includes(platform.id) ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => togglePlatform(platform.id)}
                >
                  {platform.name}
                </Button>
              ))}
            </div>
          </div>
        </div>

        <DialogFooter className="flex gap-2">
          {existingConfig && onDelete && (
            <Button
              type="button"
              variant="destructive"
              onClick={() => {
                onDelete();
                onOpenChange(false);
              }}
            >
              알림 해제
            </Button>
          )}
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
            취소
          </Button>
          <Button
            type="button"
            onClick={handleSave}
            disabled={
              selectedPlatforms.length === 0 ||
              (alertType === 'price' && !targetPrice) ||
              (alertType === 'percent' && !percentDrop)
            }
          >
            저장
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
