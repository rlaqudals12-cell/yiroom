'use client';

/**
 * PC-1 퍼스널 컬러 분석용 다각도 촬영 컴포넌트
 * @description 정면(필수) + 좌/우(선택) 다각도 촬영 플로우
 */

import { useCallback, useState } from 'react';
import { MultiAngleCapture } from '@/components/analysis/camera';
import type {
  MultiAngleImages,
  ValidateFaceImageResponse,
  FaceAngle,
} from '@/types/visual-analysis';
import { Loader2 } from 'lucide-react';

interface MultiAnglePersonalColorCaptureProps {
  /** 촬영 완료 핸들러 */
  onComplete: (images: MultiAngleImages) => void;
  /** 취소 핸들러 */
  onCancel?: () => void;
}

export default function MultiAnglePersonalColorCapture({
  onComplete,
  onCancel,
}: MultiAnglePersonalColorCaptureProps) {
  const [isValidating, setIsValidating] = useState(false);

  // 이미지 검증 API 호출
  const handleValidate = useCallback(
    async (imageBase64: string, expectedAngle: FaceAngle): Promise<ValidateFaceImageResponse> => {
      setIsValidating(true);

      try {
        const response = await fetch('/api/validate/face-image', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ imageBase64, expectedAngle }),
        });

        if (!response.ok) {
          throw new Error('Validation failed');
        }

        const data = await response.json();
        return data;
      } catch (error) {
        console.error('[MultiAnglePersonalColorCapture] Validation error:', error);
        // 검증 실패 시에도 촬영 허용 (AI 분석에서 처리)
        return {
          suitable: true,
          detectedAngle: expectedAngle,
          quality: {
            lighting: 'good',
            makeupDetected: false,
            faceDetected: true,
            blur: false,
          },
        };
      } finally {
        setIsValidating(false);
      }
    },
    []
  );

  return (
    <div className="relative min-h-[500px]" data-testid="multi-angle-personal-color-capture">
      <MultiAngleCapture
        onComplete={onComplete}
        onValidate={handleValidate}
        onCancel={onCancel}
        className="h-full"
      />

      {/* 검증 중 오버레이 */}
      {isValidating && (
        <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
          <div className="bg-white rounded-lg p-4 flex items-center gap-3">
            <Loader2 className="w-5 h-5 animate-spin" />
            <span>이미지 확인 중...</span>
          </div>
        </div>
      )}
    </div>
  );
}
