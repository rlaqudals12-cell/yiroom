'use client';

/**
 * 갤러리 다각도 업로드 컴포넌트
 * @description 정면(필수) + 좌/우(선택) 갤러리 업로드 플로우
 */

import { useState, useRef, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { ImageIcon, X, Check, ChevronRight, User, Loader2, AlertCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
import type {
  MultiAngleImages,
  FaceAngle,
  ValidateFaceImageResponse,
} from '@/types/visual-analysis';

// 허용되는 파일 타입
const ALLOWED_FILE_TYPES = ['image/jpeg', 'image/png', 'image/webp'];
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

interface GalleryMultiAngleUploadProps {
  /** 업로드 완료 핸들러 */
  onComplete: (images: MultiAngleImages) => void;
  /** 이미지 검증 함수 (선택) */
  onValidate?: (imageBase64: string, angle: FaceAngle) => Promise<ValidateFaceImageResponse>;
  /** 취소 핸들러 */
  onCancel?: () => void;
}

// 각도별 라벨
const ANGLE_LABELS: Record<FaceAngle, string> = {
  front: '정면',
  left: '좌측',
  right: '우측',
};

// 각도별 설명
const ANGLE_DESCRIPTIONS: Record<FaceAngle, string> = {
  front: '정면을 바라본 사진',
  left: '왼쪽으로 45도 돌린 사진',
  right: '오른쪽으로 45도 돌린 사진',
};

export default function GalleryMultiAngleUpload({
  onComplete,
  onValidate,
  onCancel,
}: GalleryMultiAngleUploadProps) {
  // 선택된 이미지 (Base64)
  const [images, setImages] = useState<Partial<Record<FaceAngle, string>>>({});
  const [error, setError] = useState<string | null>(null);
  const [isValidating, setIsValidating] = useState(false);
  const [validationWarning, setValidationWarning] = useState<string | null>(null);

  // 파일 입력 ref
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [currentAngle, setCurrentAngle] = useState<FaceAngle>('front');

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

  // 파일을 Base64로 변환
  const fileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = (error) => reject(error);
    });
  };

  // 파일 선택 처리
  const handleFileChange = useCallback(
    async (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;

      const validation = validateFile(file);
      if (!validation.valid) {
        setError(validation.error || '파일을 확인해주세요');
        return;
      }

      try {
        const base64 = await fileToBase64(file);

        // 이미지 검증 (옵션)
        if (onValidate) {
          setIsValidating(true);
          setError(null);
          setValidationWarning(null);

          try {
            const result = await onValidate(base64, currentAngle);

            if (!result.suitable) {
              // 부적합한 이미지
              setError(
                result.reason || '이 사진은 분석에 적합하지 않아요. 다른 사진을 선택해주세요.'
              );
              setIsValidating(false);
              e.target.value = '';
              return;
            }

            // 메이크업 경고
            if (result.quality.makeupDetected) {
              setValidationWarning('메이크업이 감지되었어요. 맨 얼굴 사진이 더 정확해요.');
            }

            // 조명 경고
            if (result.quality.lighting === 'dark' || result.quality.lighting === 'uneven') {
              setValidationWarning(
                '조명이 어둡거나 고르지 않아요. 밝은 곳에서 찍은 사진이 더 좋아요.'
              );
            }
          } catch (validationError) {
            console.error('[GalleryUpload] Validation error:', validationError);
            // 검증 실패해도 이미지 업로드는 허용
          } finally {
            setIsValidating(false);
          }
        }

        setImages((prev) => ({ ...prev, [currentAngle]: base64 }));
        setError(null);
      } catch {
        setError('이미지를 불러오는 중 오류가 발생했어요');
      }

      // 입력 초기화 (같은 파일 재선택 가능하도록)
      e.target.value = '';
    },
    [currentAngle, onValidate]
  );

  // 특정 각도 사진 선택 트리거
  const handleSelectAngle = useCallback((angle: FaceAngle) => {
    setCurrentAngle(angle);
    setError(null);
    // 약간의 딜레이 후 파일 선택 다이얼로그 열기
    setTimeout(() => {
      fileInputRef.current?.click();
    }, 100);
  }, []);

  // 특정 각도 사진 삭제
  const handleRemoveImage = useCallback((angle: FaceAngle) => {
    setImages((prev) => {
      const newImages = { ...prev };
      delete newImages[angle];
      return newImages;
    });
  }, []);

  // 완료 처리
  const handleComplete = useCallback(() => {
    if (!images.front) {
      setError('정면 사진은 필수예요');
      return;
    }

    onComplete({
      frontImageBase64: images.front,
      leftImageBase64: images.left,
      rightImageBase64: images.right,
    });
  }, [images, onComplete]);

  const hasFrontImage = !!images.front;
  const additionalCount = (images.left ? 1 : 0) + (images.right ? 1 : 0);

  return (
    <div className="space-y-6" data-testid="gallery-multi-angle-upload">
      {/* 헤더 */}
      <div className="text-center space-y-2">
        <div className="inline-flex items-center justify-center px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-semibold">
          갤러리에서 선택
        </div>
        <h2 className="text-xl font-bold">사진을 선택해주세요</h2>
        <p className="text-sm text-muted-foreground">정면 사진은 필수, 좌/우 사진은 선택이에요</p>
      </div>

      {/* 정면 사진 (필수) */}
      <div className="space-y-3">
        <div className="flex items-center gap-2">
          <span className="text-sm font-semibold">정면 사진</span>
          <span className="text-xs text-red-500">필수</span>
        </div>

        {images.front ? (
          <div className="relative aspect-[3/4] max-w-[200px] mx-auto rounded-2xl overflow-hidden border-2 border-primary">
            <img src={images.front} alt="정면 사진" className="w-full h-full object-cover" />
            <button
              onClick={() => handleRemoveImage('front')}
              className="absolute top-2 right-2 w-8 h-8 bg-black/50 rounded-full flex items-center justify-center text-white hover:bg-black/70 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
            <div className="absolute bottom-2 left-2 px-2 py-1 bg-primary text-white text-xs font-medium rounded-full flex items-center gap-1">
              <Check className="w-3 h-3" />
              정면
            </div>
          </div>
        ) : (
          <button
            onClick={() => handleSelectAngle('front')}
            className="w-full aspect-[3/4] max-w-[200px] mx-auto rounded-2xl border-2 border-dashed border-primary/50 bg-primary/5 flex flex-col items-center justify-center gap-3 hover:bg-primary/10 transition-colors"
          >
            <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
              <User className="w-8 h-8 text-primary/50" />
            </div>
            <div className="text-center">
              <p className="text-sm font-medium text-primary">정면 사진 선택</p>
              <p className="text-xs text-muted-foreground mt-1">{ANGLE_DESCRIPTIONS.front}</p>
            </div>
          </button>
        )}
      </div>

      {/* 추가 각도 (선택) */}
      <div className="space-y-3">
        <div className="flex items-center gap-2">
          <span className="text-sm font-semibold">추가 각도</span>
          <span className="text-xs text-muted-foreground">선택</span>
        </div>
        <p className="text-xs text-muted-foreground">
          더 정확한 분석을 위해 좌/우 사진을 추가할 수 있어요
        </p>

        <div className="grid grid-cols-2 gap-3">
          {(['left', 'right'] as const).map((angle) => (
            <div key={angle}>
              {images[angle] ? (
                <div className="relative aspect-square rounded-xl overflow-hidden border border-border">
                  <img
                    src={images[angle]}
                    alt={`${ANGLE_LABELS[angle]} 사진`}
                    className="w-full h-full object-cover"
                  />
                  <button
                    onClick={() => handleRemoveImage(angle)}
                    className="absolute top-1.5 right-1.5 w-6 h-6 bg-black/50 rounded-full flex items-center justify-center text-white hover:bg-black/70 transition-colors"
                  >
                    <X className="w-3 h-3" />
                  </button>
                  <div className="absolute bottom-1.5 left-1.5 px-2 py-0.5 bg-green-500 text-white text-[10px] font-medium rounded-full flex items-center gap-0.5">
                    <Check className="w-2.5 h-2.5" />
                    {ANGLE_LABELS[angle]}
                  </div>
                </div>
              ) : (
                <button
                  onClick={() => handleSelectAngle(angle)}
                  className={cn(
                    'w-full aspect-square rounded-xl border border-dashed flex flex-col items-center justify-center gap-2 transition-colors',
                    'border-border bg-muted/30 hover:bg-muted/50'
                  )}
                >
                  <ImageIcon className="w-6 h-6 text-muted-foreground" />
                  <span className="text-xs text-muted-foreground">{ANGLE_LABELS[angle]}</span>
                </button>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* 검증 중 오버레이 */}
      {isValidating && (
        <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg text-blue-600 text-sm text-center flex items-center justify-center gap-2">
          <Loader2 className="w-4 h-4 animate-spin" />
          이미지 확인 중...
        </div>
      )}

      {/* 경고 메시지 */}
      {validationWarning && !error && (
        <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg text-amber-700 text-sm flex items-start gap-2">
          <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
          <span>{validationWarning}</span>
        </div>
      )}

      {/* 에러 메시지 */}
      {error && (
        <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-600 text-sm text-center">
          {error}
        </div>
      )}

      {/* 하단 버튼 */}
      <div className="pt-4 space-y-3">
        <Button
          onClick={handleComplete}
          disabled={!hasFrontImage}
          className="w-full h-14 text-lg bg-gradient-brand hover:opacity-90 shadow-lg shadow-primary/20 rounded-2xl transition-all font-bold gap-2"
        >
          {additionalCount > 0 ? `${1 + additionalCount}장으로 분석하기` : '정면 사진으로 분석하기'}
          <ChevronRight className="w-5 h-5" />
        </Button>

        {onCancel && (
          <Button variant="ghost" onClick={onCancel} className="w-full text-muted-foreground">
            취소
          </Button>
        )}
      </div>

      {/* 숨겨진 파일 입력 */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        onChange={handleFileChange}
        className="hidden"
        aria-label="사진 선택"
      />
    </div>
  );
}
