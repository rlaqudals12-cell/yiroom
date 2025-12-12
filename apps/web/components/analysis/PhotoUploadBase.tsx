'use client';

import { useRef, ReactNode } from 'react';
import { Camera, ImageIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';

// 허용되는 파일 타입
const ALLOWED_FILE_TYPES = ['image/jpeg', 'image/png', 'image/webp'];
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

interface PhotoUploadBaseProps {
  onPhotoSelect: (file: File) => void;
  guideElement: ReactNode;
  tips: string[];
  captureMode?: 'user' | 'environment';
  guideText?: string;
  guideSubText?: string;
}

/**
 * 공통 사진 업로드 컴포넌트
 * S-1 피부 분석과 C-1 체형 분석에서 공통으로 사용
 */
export default function PhotoUploadBase({
  onPhotoSelect,
  guideElement,
  tips,
  captureMode = 'environment',
  guideText = '가이드에 맞춰',
  guideSubText = '촬영해주세요',
}: PhotoUploadBaseProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);

  // 갤러리에서 사진 선택
  const handleGalleryClick = () => {
    fileInputRef.current?.click();
  };

  // 카메라로 촬영
  const handleCameraClick = () => {
    cameraInputRef.current?.click();
  };

  // 파일 검증
  const validateFile = (file: File): { valid: boolean; error?: string } => {
    if (!ALLOWED_FILE_TYPES.includes(file.type)) {
      return { valid: false, error: 'JPG, PNG, WebP 파일만 업로드 가능해요' };
    }
    if (file.size > MAX_FILE_SIZE) {
      return { valid: false, error: '파일 크기는 10MB 이하여야 해요' };
    }
    return { valid: true };
  };

  // 파일 선택 처리
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const validation = validateFile(file);
    if (!validation.valid) {
      alert(validation.error);
      return;
    }

    onPhotoSelect(file);
  };

  return (
    <div className="space-y-6">
      {/* 가이드 영역 */}
      <div className="relative aspect-[3/4] bg-gray-100 rounded-2xl overflow-hidden border-2 border-dashed border-gray-300">
        {/* 커스텀 가이드 오버레이 */}
        <div className="absolute inset-0 flex items-center justify-center">
          {guideElement}
        </div>

        {/* 가이드 텍스트 */}
        <div className="absolute inset-0 flex flex-col items-center justify-end pb-8 text-gray-500">
          <p className="text-sm">{guideText}</p>
          <p className="text-sm">{guideSubText}</p>
        </div>
      </div>

      {/* 촬영 팁 */}
      <div className="bg-blue-50 rounded-lg p-4">
        <p className="text-sm text-blue-800 font-medium mb-2">촬영 팁</p>
        <ul className="text-sm text-blue-700 space-y-1">
          {tips.map((tip, index) => (
            <li key={index}>• {tip}</li>
          ))}
        </ul>
      </div>

      {/* 버튼 영역 */}
      <div className="flex gap-4">
        <Button
          onClick={handleCameraClick}
          className="flex-1 h-14 text-base gap-2"
          aria-label="카메라로 사진 촬영하기"
        >
          <Camera className="w-5 h-5" aria-hidden="true" />
          사진 촬영
        </Button>
        <Button
          onClick={handleGalleryClick}
          variant="outline"
          className="flex-1 h-14 text-base gap-2"
          aria-label="갤러리에서 사진 선택하기"
        >
          <ImageIcon className="w-5 h-5" aria-hidden="true" />
          갤러리
        </Button>
      </div>

      {/* 숨겨진 파일 입력 */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        onChange={handleFileChange}
        className="hidden"
        aria-label="갤러리에서 사진 선택"
      />
      <input
        ref={cameraInputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        capture={captureMode}
        onChange={handleFileChange}
        className="hidden"
        aria-label="카메라로 사진 촬영"
      />
    </div>
  );
}
