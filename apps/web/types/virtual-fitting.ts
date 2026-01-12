/**
 * Phase L-3-3: 가상 피팅 시뮬레이터 타입 정의
 */

import type { SeasonType } from '@/lib/mock/personal-color';

/** 의류 아이템 타입 */
export type ClothingType = 'top' | 'bottom' | 'outer' | 'shoes';

/** 의류 아이템 */
export interface ClothingItem {
  id: string;
  type: ClothingType;
  imageUrl: string;
  color: string;
  colorHex?: string;
  size: string;
  name?: string;
  brand?: string;
}

/** 레이어 위치 */
export interface Position {
  x: number;
  y: number;
}

/** 레이어 스케일 */
export interface Scale {
  width: number;
  height: number;
}

/** 의류 레이어 상태 */
export interface ClothingLayerState {
  item: ClothingItem;
  position: Position;
  scale: Scale;
  rotation: number;
  opacity: number;
  zIndex: number;
}

/** 피팅 결과 */
export interface FittingResult {
  userImageUrl: string;
  layers: ClothingLayerState[];
  colorCombinationScore: ColorCombinationScore;
  timestamp: string;
}

/** 색상 조합 점수 */
export interface ColorCombinationScore {
  score: number; // 0-100
  feedback: string;
  suggestions: string[];
  personalColorMatch: boolean;
}

/** 사용자 치수 */
export interface UserMeasurements {
  height: number; // cm
  shoulder: number; // cm
  chest?: number; // cm
  waist?: number; // cm
  hip?: number; // cm
}

/** VirtualFittingSimulator Props */
export interface VirtualFittingSimulatorProps {
  userImageUrl: string;
  clothingItems: ClothingItem[];
  userMeasurements?: UserMeasurements;
  personalColor?: SeasonType;
  onComplete?: (result: FittingResult) => void;
  className?: string;
}

/** DraggableClothingLayer Props */
export interface DraggableClothingLayerProps {
  item: ClothingItem;
  position: Position;
  scale: Scale;
  rotation: number;
  opacity: number;
  isSelected: boolean;
  onPositionChange: (position: Position) => void;
  onScaleChange: (scale: Scale) => void;
  onRotationChange: (rotation: number) => void;
  onClick: () => void;
}

/** FittingControlPanel Props */
export interface FittingControlPanelProps {
  selectedLayer: ClothingLayerState | null;
  onScaleChange: (scale: Scale) => void;
  onRotationChange: (rotation: number) => void;
  onOpacityChange: (opacity: number) => void;
  onReset: () => void;
  onSave: () => void;
}

/** ColorCombinationScore Props */
export interface ColorCombinationScoreProps {
  colors: string[];
  personalColor?: SeasonType;
  className?: string;
}

/** 의류 타입 한글 라벨 */
export const CLOTHING_TYPE_LABELS: Record<ClothingType, string> = {
  top: '상의',
  bottom: '하의',
  outer: '아우터',
  shoes: '신발',
};

/** Z-Index 레이어 순서 (위에서부터) */
export const LAYER_Z_INDEX: Record<ClothingType, number> = {
  shoes: 1,
  bottom: 2,
  top: 3,
  outer: 4,
};
