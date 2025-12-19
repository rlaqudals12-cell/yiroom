'use client';

import { Camera } from 'lucide-react';
import PhotoUploadBase from '@/components/analysis/PhotoUploadBase';

interface PhotoUploadProps {
  onPhotoSelect: (file: File) => void;
}

// S-1 피부 분석용 얼굴 가이드 오버레이
function FaceGuideOverlay() {
  return (
    <div className="relative flex flex-col items-center justify-center">
      {/* 타원형 가이드 */}
      <div className="w-48 h-64 border-2 border-muted-foreground rounded-[50%] opacity-50" />
      {/* 가이드 아이콘 */}
      <Camera className="absolute w-12 h-12 text-muted-foreground opacity-40" />
    </div>
  );
}

// S-1 피부 분석용 촬영 팁
const SKIN_TIPS = [
  '자연광에서 촬영하면 더 정확해요',
  '정면을 바라봐 주세요',
  '화장을 지운 상태가 좋아요',
];

export default function PhotoUpload({ onPhotoSelect }: PhotoUploadProps) {
  return (
    <PhotoUploadBase
      onPhotoSelect={onPhotoSelect}
      guideElement={<FaceGuideOverlay />}
      tips={SKIN_TIPS}
      captureMode="user"
      guideText="얼굴이 타원 안에 오도록"
      guideSubText="맞춰주세요"
    />
  );
}
