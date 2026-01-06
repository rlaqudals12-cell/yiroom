'use client';

import { User } from 'lucide-react';
import PhotoUploadBase from '@/components/analysis/PhotoUploadBase';

interface PhotoUploadProps {
  onPhotoSelect: (file: File) => void;
  angle: 'front' | 'side';
}

// A-1 자세 분석용 전신 가이드 오버레이
function PostureGuideOverlay({ angle }: { angle: 'front' | 'side' }) {
  return (
    <div className="w-32 h-72 border-2 border-muted-foreground rounded-lg opacity-50 flex flex-col items-center justify-center">
      <User className="w-20 h-20 text-muted-foreground opacity-60" />
      <span className="text-xs text-muted-foreground mt-2">
        {angle === 'front' ? '정면' : '측면'}
      </span>
    </div>
  );
}

// A-1 자세 분석용 촬영 팁
const POSTURE_TIPS = {
  front: [
    '밝은 곳에서 전신이 보이게 촬영해주세요',
    '몸에 붙는 옷을 입으면 더 정확해요',
    '정면을 바라보고 자연스럽게 서주세요',
    '팔은 자연스럽게 내려주세요',
  ],
  side: [
    '측면에서 전신이 보이게 촬영해주세요',
    '귀-어깨-골반-무릎-발목 라인이 보이도록',
    '고개를 정면을 향하고 자연스럽게 서주세요',
    '팔은 자연스럽게 내려주세요',
  ],
};

export default function PhotoUpload({ onPhotoSelect, angle }: PhotoUploadProps) {
  return (
    <PhotoUploadBase
      onPhotoSelect={onPhotoSelect}
      guideElement={<PostureGuideOverlay angle={angle} />}
      tips={POSTURE_TIPS[angle]}
      captureMode="environment"
      guideText={`${angle === 'front' ? '정면' : '측면'} 전신이 가이드 안에 오도록`}
      guideSubText="맞춰주세요"
    />
  );
}
