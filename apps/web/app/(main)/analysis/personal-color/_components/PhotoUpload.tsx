'use client';

import { User } from 'lucide-react';
import PhotoUploadBase from '@/components/analysis/PhotoUploadBase';

interface PhotoUploadProps {
  onPhotoSelect: (file: File) => void;
}

// PC-1 퍼스널 컬러 진단용 얼굴 가이드 오버레이
function FaceGuideOverlay() {
  return (
    <div className="w-40 h-48 border-2 border-gray-400 rounded-full opacity-50 flex items-center justify-center">
      <User className="w-16 h-16 text-gray-400 opacity-60" />
    </div>
  );
}

// PC-1 퍼스널 컬러 진단용 촬영 팁
const PHOTO_TIPS = [
  '자연광 아래에서 촬영하면 더 정확해요',
  '메이크업 없는 맨 얼굴이 좋아요',
  '정면을 바라보고 얼굴 전체가 보이게 해주세요',
];

export default function PhotoUpload({ onPhotoSelect }: PhotoUploadProps) {
  return (
    <PhotoUploadBase
      onPhotoSelect={onPhotoSelect}
      guideElement={<FaceGuideOverlay />}
      tips={PHOTO_TIPS}
      captureMode="user"
      guideText="얼굴이 가이드 안에 오도록"
      guideSubText="맞춰주세요"
    />
  );
}
