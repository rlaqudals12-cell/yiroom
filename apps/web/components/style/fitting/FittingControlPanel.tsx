'use client';

/**
 * 가상 피팅 컨트롤 패널 컴포넌트
 */

import { RotateCw, ZoomIn, ZoomOut, RefreshCw, Save } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { Card, CardContent } from '@/components/ui/card';
import type { FittingControlPanelProps } from '@/types/virtual-fitting';

export function FittingControlPanel({
  selectedLayer,
  onScaleChange,
  onRotationChange,
  onOpacityChange,
  onReset,
  onSave,
}: FittingControlPanelProps) {
  if (!selectedLayer) {
    return (
      <Card data-testid="fitting-control-panel" className="bg-background/95 backdrop-blur">
        <CardContent className="p-4">
          <p className="text-center text-sm text-muted-foreground">의류 아이템을 선택하세요</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card data-testid="fitting-control-panel" className="bg-background/95 backdrop-blur">
      <CardContent className="space-y-4 p-4">
        {/* 선택된 아이템 정보 */}
        <div className="border-b pb-2">
          <p className="text-sm font-medium">
            {selectedLayer.item.name || selectedLayer.item.type}
          </p>
          <p className="text-xs text-muted-foreground">{selectedLayer.item.color}</p>
        </div>

        {/* 크기 조절 */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">크기</span>
            <div className="flex gap-1">
              <Button
                size="icon"
                variant="outline"
                className="h-6 w-6"
                onClick={() =>
                  onScaleChange({
                    width: selectedLayer.scale.width * 0.9,
                    height: selectedLayer.scale.height * 0.9,
                  })
                }
              >
                <ZoomOut className="h-3 w-3" />
              </Button>
              <Button
                size="icon"
                variant="outline"
                className="h-6 w-6"
                onClick={() =>
                  onScaleChange({
                    width: selectedLayer.scale.width * 1.1,
                    height: selectedLayer.scale.height * 1.1,
                  })
                }
              >
                <ZoomIn className="h-3 w-3" />
              </Button>
            </div>
          </div>
          <Slider
            value={[selectedLayer.scale.width]}
            min={50}
            max={500}
            step={10}
            onValueChange={([value]) => {
              const aspectRatio = selectedLayer.scale.height / selectedLayer.scale.width;
              onScaleChange({
                width: value,
                height: value * aspectRatio,
              });
            }}
            className="w-full"
          />
        </div>

        {/* 회전 */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">회전</span>
            <Button
              size="icon"
              variant="outline"
              className="h-6 w-6"
              onClick={() => onRotationChange(0)}
            >
              <RotateCw className="h-3 w-3" />
            </Button>
          </div>
          <Slider
            value={[selectedLayer.rotation]}
            min={-180}
            max={180}
            step={5}
            onValueChange={([value]) => onRotationChange(value)}
            className="w-full"
          />
          <p className="text-xs text-center text-muted-foreground">
            {Math.round(selectedLayer.rotation)}°
          </p>
        </div>

        {/* 투명도 */}
        <div className="space-y-2">
          <span className="text-sm font-medium">투명도</span>
          <Slider
            value={[selectedLayer.opacity * 100]}
            min={0}
            max={100}
            step={5}
            onValueChange={([value]) => onOpacityChange(value / 100)}
            className="w-full"
          />
          <p className="text-xs text-center text-muted-foreground">
            {Math.round(selectedLayer.opacity * 100)}%
          </p>
        </div>

        {/* 액션 버튼 */}
        <div className="flex gap-2 pt-2">
          <Button size="sm" variant="outline" onClick={onReset} className="flex-1">
            <RefreshCw className="mr-1 h-3 w-3" />
            초기화
          </Button>
          <Button size="sm" onClick={onSave} className="flex-1">
            <Save className="mr-1 h-3 w-3" />
            저장
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
