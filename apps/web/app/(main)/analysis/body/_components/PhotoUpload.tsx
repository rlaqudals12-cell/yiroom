'use client';

import { User } from 'lucide-react';
import PhotoUploadBase from '@/components/analysis/PhotoUploadBase';

interface PhotoUploadProps {
  onPhotoSelect: (file: File) => void;
}

// C-1 체형 분석용 전신 가이드 오버레이
function BodyGuideOverlay() {
  return (
    <div className="w-32 h-72 border-2 border-gray-400 rounded-lg opacity-50 flex items-center justify-center">
      <User className="w-20 h-20 text-gray-400 opacity-60" />
    </div>
  );
}

// C-1 체형 분석용 촬영 팁
const BODY_TIPS = [
  '밝은 곳에서 전신이 보이게 촬영해주세요',
  '몸에 붙는 옷을 입으면 더 정확해요',
  '정면을 바라보고 자연스럽게 서주세요',
];

export default function PhotoUpload({ onPhotoSelect }: PhotoUploadProps) {
  return (
    <PhotoUploadBase
      onPhotoSelect={onPhotoSelect}
      guideElement={<BodyGuideOverlay />}
      tips={BODY_TIPS}
      captureMode="environment"
      guideText="전신이 가이드 안에 오도록"
      guideSubText="맞춰주세요"
    />
  );
}
