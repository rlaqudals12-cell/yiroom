'use client';

/**
 * 아이템 이미지 업로더 컴포넌트
 * - 드래그 앤 드롭 / 클릭 업로드
 * - 이미지 미리보기
 * - 배경 제거 처리
 * - AI 분류 자동 실행
 */

import { useState, useRef, useCallback } from 'react';
import Image from 'next/image';
import { Camera, X, Loader2, Wand2, RotateCcw } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import {
  validateImageFile,
  resizeImage,
  removeBackgroundClient,
  blobToDataUrl,
} from '@/lib/inventory';
import type { ClothingClassificationResult } from '@/lib/inventory';

type ProcessingStep =
  | 'idle'
  | 'uploading'
  | 'resizing'
  | 'removing_bg'
  | 'classifying'
  | 'done'
  | 'error';

interface ItemUploaderProps {
  onUploadComplete: (result: UploadResult) => void;
  onCancel?: () => void;
  autoRemoveBackground?: boolean;
  autoClassify?: boolean;
  className?: string;
}

export interface UploadResult {
  originalUrl: string;
  processedUrl: string;
  classification?: ClothingClassificationResult;
  colors?: string[];
}

const STEP_LABELS: Record<ProcessingStep, string> = {
  idle: '이미지를 업로드하세요',
  uploading: '업로드 중...',
  resizing: '이미지 최적화 중...',
  removing_bg: '배경 제거 중...',
  classifying: 'AI 분석 중...',
  done: '완료!',
  error: '오류가 발생했습니다',
};

const STEP_PROGRESS: Record<ProcessingStep, number> = {
  idle: 0,
  uploading: 15,
  resizing: 30,
  removing_bg: 60,
  classifying: 85,
  done: 100,
  error: 0,
};

export function ItemUploader({
  onUploadComplete,
  onCancel,
  autoRemoveBackground = true,
  autoClassify = true,
  className,
}: ItemUploaderProps) {
  const [step, setStep] = useState<ProcessingStep>('idle');
  const [error, setError] = useState<string | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [processedUrl, setProcessedUrl] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  // 파일 처리
  const processFile = useCallback(
    async (file: File) => {
      setError(null);

      // 유효성 검사
      const validation = validateImageFile(file);
      if (!validation.valid) {
        setError(validation.error || '유효하지 않은 파일입니다');
        setStep('error');
        return;
      }

      try {
        // 1. 업로드 시작
        setStep('uploading');
        const originalBlob = new Blob([await file.arrayBuffer()], {
          type: file.type,
        });
        const originalUrl = await blobToDataUrl(originalBlob);
        setPreviewUrl(originalUrl);

        // 2. 리사이즈
        setStep('resizing');
        const resizedBlob = await resizeImage(originalBlob, 800, 800, 0.9);

        let processedBlob = resizedBlob;

        // 3. 배경 제거 (옵션)
        if (autoRemoveBackground) {
          setStep('removing_bg');
          try {
            processedBlob = await removeBackgroundClient(resizedBlob);
          } catch (bgError) {
            console.warn('[ItemUploader] Background removal failed:', bgError);
            // 배경 제거 실패해도 계속 진행
          }
        }

        const processedDataUrl = await blobToDataUrl(processedBlob);
        setProcessedUrl(processedDataUrl);

        // 4. AI 분류 (옵션)
        let classification: ClothingClassificationResult | undefined;
        if (autoClassify) {
          setStep('classifying');
          try {
            const response = await fetch('/api/inventory/classify', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ imageBase64: processedDataUrl }),
            });
            if (response.ok) {
              classification = await response.json();
            }
          } catch (classifyError) {
            console.warn('[ItemUploader] Classification failed:', classifyError);
            // 분류 실패해도 계속 진행
          }
        }

        // 5. 완료
        setStep('done');
        onUploadComplete({
          originalUrl,
          processedUrl: processedDataUrl,
          classification,
          colors: classification?.colors,
        });
      } catch (err) {
        console.error('[ItemUploader] Processing error:', err);
        setError('이미지 처리 중 오류가 발생했습니다');
        setStep('error');
      }
    },
    [autoRemoveBackground, autoClassify, onUploadComplete]
  );

  // 파일 선택 핸들러
  const handleFileSelect = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) {
        processFile(file);
      }
    },
    [processFile]
  );

  // 드래그 앤 드롭 핸들러
  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragging(false);

      const file = e.dataTransfer.files[0];
      if (file && file.type.startsWith('image/')) {
        processFile(file);
      } else {
        setError('이미지 파일만 업로드할 수 있습니다');
      }
    },
    [processFile]
  );

  // 초기화
  const handleReset = () => {
    setStep('idle');
    setError(null);
    setPreviewUrl(null);
    setProcessedUrl(null);
    if (inputRef.current) {
      inputRef.current.value = '';
    }
  };

  const isProcessing = ['uploading', 'resizing', 'removing_bg', 'classifying'].includes(step);

  return (
    <div data-testid="item-uploader" className={cn('space-y-4', className)}>
      {/* 업로드 영역 */}
      <div
        onClick={() => !isProcessing && inputRef.current?.click()}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        className={cn(
          'relative flex flex-col items-center justify-center',
          'min-h-[200px] rounded-xl border-2 border-dashed transition-colors',
          'cursor-pointer hover:bg-muted/50',
          isDragging && 'border-primary bg-primary/5',
          isProcessing && 'pointer-events-none',
          error && 'border-destructive',
          !previewUrl && 'p-8'
        )}
      >
        <input
          ref={inputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp,image/heic"
          onChange={handleFileSelect}
          className="hidden"
        />

        {/* 미리보기 이미지 */}
        {previewUrl && (
          <div className="relative w-full aspect-square">
            <Image
              src={processedUrl || previewUrl}
              alt="Preview"
              fill
              className="object-contain rounded-lg"
            />

            {/* 처리 중 오버레이 */}
            {isProcessing && (
              <div className="absolute inset-0 flex items-center justify-center bg-black/50 rounded-lg">
                <div className="text-center text-white">
                  <Loader2 className="w-8 h-8 mx-auto mb-2 animate-spin" />
                  <p className="text-sm">{STEP_LABELS[step]}</p>
                </div>
              </div>
            )}

            {/* 완료 후 배지 */}
            {step === 'done' && (
              <div className="absolute top-2 right-2 flex items-center gap-1 px-2 py-1 bg-green-500 text-white text-xs rounded-full">
                <Wand2 className="w-3 h-3" />
                <span>AI 분석 완료</span>
              </div>
            )}
          </div>
        )}

        {/* 빈 상태 */}
        {!previewUrl && (
          <>
            <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mb-4">
              <Camera className="w-8 h-8 text-muted-foreground" />
            </div>
            <p className="text-sm text-muted-foreground text-center mb-2">
              이미지를 드래그하거나 클릭하여 업로드
            </p>
            <p className="text-xs text-muted-foreground">
              JPG, PNG, WebP, HEIC (최대 10MB)
            </p>
          </>
        )}
      </div>

      {/* 진행 표시줄 */}
      {isProcessing && (
        <div className="space-y-2">
          <Progress value={STEP_PROGRESS[step]} className="h-2" />
          <p className="text-xs text-muted-foreground text-center">
            {STEP_LABELS[step]}
          </p>
        </div>
      )}

      {/* 에러 메시지 */}
      {error && (
        <div className="flex items-center gap-2 p-3 bg-destructive/10 text-destructive rounded-lg text-sm">
          <X className="w-4 h-4 flex-shrink-0" />
          <p>{error}</p>
        </div>
      )}

      {/* 액션 버튼 */}
      <div className="flex gap-2">
        {(previewUrl || error) && (
          <Button
            variant="outline"
            onClick={handleReset}
            disabled={isProcessing}
            className="flex-1"
          >
            <RotateCcw className="w-4 h-4 mr-2" />
            다시 선택
          </Button>
        )}

        {onCancel && (
          <Button
            variant="ghost"
            onClick={onCancel}
            disabled={isProcessing}
          >
            취소
          </Button>
        )}
      </div>
    </div>
  );
}
