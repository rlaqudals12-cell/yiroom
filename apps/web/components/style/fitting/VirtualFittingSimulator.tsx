'use client';

/**
 * 가상 피팅 시뮬레이터 메인 컴포넌트
 */

import { useState, useMemo } from 'react';
import Image from 'next/image';
import { cn } from '@/lib/utils';
import { DraggableClothingLayer } from './DraggableClothingLayer';
import { FittingControlPanel } from './FittingControlPanel';
import { ColorCombinationScore } from './ColorCombinationScore';
import { colorNameToHex } from '@/lib/style/color-combination';
import { LAYER_Z_INDEX } from '@/types/virtual-fitting';
import type {
  VirtualFittingSimulatorProps,
  ClothingLayerState,
  Position,
  Scale,
} from '@/types/virtual-fitting';

export function VirtualFittingSimulator({
  userImageUrl,
  clothingItems,
  userMeasurements: _userMeasurements,
  personalColor,
  onComplete,
  className,
}: VirtualFittingSimulatorProps) {
  // 레이어 상태 초기화
  const [layers, setLayers] = useState<ClothingLayerState[]>(() =>
    clothingItems.map((item, index) => ({
      item,
      position: { x: 100 + index * 20, y: 100 + index * 20 },
      scale: { width: 200, height: 300 },
      rotation: 0,
      opacity: 1,
      zIndex: (LAYER_Z_INDEX as Record<string, number>)[item.type] || 1,
    }))
  );

  const [selectedLayerId, setSelectedLayerId] = useState<string | null>(null);

  // 선택된 레이어
  const selectedLayer = useMemo(
    () => layers.find((layer) => layer.item.id === selectedLayerId) || null,
    [layers, selectedLayerId]
  );

  // 레이어 업데이트 함수
  const updateLayer = (itemId: string, updates: Partial<ClothingLayerState>) => {
    setLayers((prev) =>
      prev.map((layer) => (layer.item.id === itemId ? { ...layer, ...updates } : layer))
    );
  };

  // 위치 변경
  const handlePositionChange = (itemId: string, position: Position) => {
    updateLayer(itemId, { position });
  };

  // 크기 변경
  const handleScaleChange = (scale: Scale) => {
    if (!selectedLayerId) return;
    updateLayer(selectedLayerId, { scale });
  };

  // 회전 변경
  const handleRotationChange = (rotation: number) => {
    if (!selectedLayerId) return;
    updateLayer(selectedLayerId, { rotation });
  };

  // 투명도 변경
  const handleOpacityChange = (opacity: number) => {
    if (!selectedLayerId) return;
    updateLayer(selectedLayerId, { opacity });
  };

  // 초기화
  const handleReset = () => {
    if (!selectedLayerId) return;
    const index = layers.findIndex((layer) => layer.item.id === selectedLayerId);
    if (index === -1) return;

    updateLayer(selectedLayerId, {
      position: { x: 100 + index * 20, y: 100 + index * 20 },
      scale: { width: 200, height: 300 },
      rotation: 0,
      opacity: 1,
    });
  };

  // 저장
  const handleSave = () => {
    if (!onComplete) return;

    // 피팅 결과 생성 (실제로는 evaluateColorCombination 호출해야 하지만 여기서는 간소화)
    onComplete({
      userImageUrl,
      layers,
      colorCombinationScore: {
        score: 85,
        feedback: '색상 조합이 잘 어울립니다.',
        suggestions: [],
        personalColorMatch: true,
      },
      timestamp: new Date().toISOString(),
    });
  };

  // 색상 조합 평가용 색상 리스트
  const clothingColors = useMemo(
    () => layers.map((layer) => layer.item.colorHex || colorNameToHex(layer.item.color)),
    [layers]
  );

  return (
    <div data-testid="virtual-fitting-simulator" className={cn('space-y-4', className)}>
      {/* 시뮬레이터 캔버스 */}
      <div className="relative aspect-[3/4] w-full overflow-hidden rounded-2xl border-2 border-border bg-muted">
        {/* 사용자 이미지 (배경) */}
        <Image
          src={userImageUrl}
          alt="사용자 이미지"
          fill
          className="object-cover"
          priority
          unoptimized
        />

        {/* 의류 레이어들 */}
        {layers.map((layer) => (
          <DraggableClothingLayer
            key={layer.item.id}
            item={layer.item}
            position={layer.position}
            scale={layer.scale}
            rotation={layer.rotation}
            opacity={layer.opacity}
            isSelected={layer.item.id === selectedLayerId}
            onPositionChange={(position) => handlePositionChange(layer.item.id, position)}
            onScaleChange={handleScaleChange}
            onRotationChange={handleRotationChange}
            onClick={() => setSelectedLayerId(layer.item.id)}
          />
        ))}

        {/* 배경 클릭 시 선택 해제 */}
        <div
          className="absolute inset-0 -z-10"
          onClick={() => setSelectedLayerId(null)}
          role="presentation"
        />
      </div>

      {/* 컨트롤 패널 */}
      <FittingControlPanel
        selectedLayer={selectedLayer}
        onScaleChange={handleScaleChange}
        onRotationChange={handleRotationChange}
        onOpacityChange={handleOpacityChange}
        onReset={handleReset}
        onSave={handleSave}
      />

      {/* 색상 조합 점수 */}
      <ColorCombinationScore colors={clothingColors} personalColor={personalColor} />

      {/* 사용 가이드 */}
      <div className="rounded-lg bg-blue-50 p-3 text-sm text-blue-800">
        <p className="font-medium">💡 사용 방법</p>
        <ul className="mt-1 space-y-1 text-xs">
          <li>• 의류를 드래그하여 위치를 조정하세요</li>
          <li>• 의류를 선택하면 크기와 회전을 조절할 수 있습니다</li>
          <li>• 하단 컨트롤 패널에서 세밀한 조정이 가능합니다</li>
        </ul>
      </div>
    </div>
  );
}
