'use client';

import { Hand } from 'lucide-react';
import PhotoUploadBase from '@/components/analysis/PhotoUploadBase';

interface WristPhotoUploadProps {
  onPhotoSelect: (file: File) => void;
  onSkip?: () => void;
}

// PC-1 퍼스널 컬러 진단용 손목 가이드 오버레이
function WristGuideOverlay() {
  return (
    <div className="w-48 h-32 border-2 border-dashed border-muted-foreground rounded-xl opacity-50 flex items-center justify-center">
      <Hand className="w-16 h-16 text-muted-foreground opacity-60" />
    </div>
  );
}

// PC-1 퍼스널 컬러 진단용 손목 촬영 팁
const WRIST_TIPS = [
  '손목 안쪽의 혈관이 잘 보이는 밝은 곳에서',
  '손목 안쪽이 카메라를 향하도록 촬영해주세요',
  '혈관 색이 파란색/보라색인지 녹색인지 확인할 수 있어요',
];

export default function WristPhotoUpload({ onPhotoSelect, onSkip }: WristPhotoUploadProps) {
  return (
    <div data-testid="wrist-photo-upload" className="space-y-6">
      <PhotoUploadBase
        onPhotoSelect={onPhotoSelect}
        guideElement={<WristGuideOverlay />}
        tips={WRIST_TIPS}
        captureMode="environment"
        guideText="손목 안쪽 혈관이 보이도록"
        guideSubText="촬영해주세요"
      />

      {/* 건너뛰기 옵션 */}
      {onSkip && (
        <button
          onClick={onSkip}
          className="w-full text-sm text-muted-foreground hover:text-foreground transition-colors py-2"
        >
          건너뛰기 (얼굴 사진만으로 분석)
        </button>
      )}

      {/* 안내 문구 */}
      <div className="text-center text-xs text-muted-foreground">
        <p>손목 혈관 색으로 웜톤/쿨톤을 더 정확하게 판단해요</p>
        <p className="mt-1">파란색/보라색 혈관 = 쿨톤 | 녹색 혈관 = 웜톤</p>
      </div>
    </div>
  );
}
