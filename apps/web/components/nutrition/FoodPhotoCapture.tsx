'use client';

import { Utensils } from 'lucide-react';
import PhotoUploadBase from '@/components/analysis/PhotoUploadBase';

interface FoodPhotoCaptureProps {
  onPhotoSelect: (file: File) => void;
}

// N-1 음식 분석용 가이드 오버레이
function FoodGuideOverlay() {
  return (
    <div className="relative flex flex-col items-center justify-center">
      {/* 음식 촬영 가이드 (원형) */}
      <div className="w-56 h-56 border-2 border-green-400 rounded-full opacity-50" />
      {/* 가이드 아이콘 */}
      <Utensils className="absolute w-12 h-12 text-green-400 opacity-40" />
    </div>
  );
}

// N-1 음식 촬영 팁
const FOOD_TIPS = [
  '음식 전체가 보이게 촬영해주세요',
  '밝은 곳에서 촬영하면 더 정확해요',
  '여러 음식이 있으면 함께 찍어도 돼요',
];

/**
 * N-1 음식 사진 촬영 컴포넌트
 * PhotoUploadBase를 활용하여 음식 촬영에 최적화된 UI 제공
 */
export default function FoodPhotoCapture({ onPhotoSelect }: FoodPhotoCaptureProps) {
  return (
    <PhotoUploadBase
      onPhotoSelect={onPhotoSelect}
      guideElement={<FoodGuideOverlay />}
      tips={FOOD_TIPS}
      captureMode="environment"
      guideText="음식이 잘 보이게"
      guideSubText="촬영해주세요"
    />
  );
}
