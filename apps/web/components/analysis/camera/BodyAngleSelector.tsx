'use client';

/**
 * 체형 분석 각도 선택 컴포넌트 (갤러리 카드 스타일)
 * @description PC-1 GalleryMultiAngleUpload 패턴 적용 — 이미지 프리뷰 + 삭제 + CTA
 */

import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Camera, X, Check, ChevronRight } from 'lucide-react';
import type { BodyAngle } from './BodyGuideOverlay';
import type { MultiAngleBodyImages } from './MultiAngleBodyCapture';

// 각도별 라벨
const ANGLE_LABELS: Record<BodyAngle, string> = {
  front: '정면',
  left_side: '좌측면',
  right_side: '우측면',
  back: '후면',
};

// 각도 → 이미지 키 매핑
const ANGLE_IMAGE_KEY: Record<BodyAngle, keyof MultiAngleBodyImages> = {
  front: 'frontImageBase64',
  left_side: 'leftSideImageBase64',
  right_side: 'rightSideImageBase64',
  back: 'backImageBase64',
};

// 추가 각도 목록 (정면 제외)
const ADDITIONAL_ANGLES: BodyAngle[] = ['left_side', 'right_side', 'back'];

interface BodyAngleSelectorProps {
  /** 이미 촬영된 각도 목록 */
  capturedAngles: BodyAngle[];
  /** 촬영된 이미지 데이터 */
  images: Partial<MultiAngleBodyImages>;
  /** 각도 선택 핸들러 */
  onSelectAngle: (angle: BodyAngle) => void;
  /** 이미지 삭제 핸들러 */
  onRemoveImage: (angle: BodyAngle) => void;
  /** 분석 시작 핸들러 */
  onSkip: () => void;
  /** 비활성화 여부 */
  disabled?: boolean;
  /** 추가 클래스 */
  className?: string;
}

export function BodyAngleSelector({
  capturedAngles,
  images,
  onSelectAngle,
  onRemoveImage,
  onSkip,
  disabled = false,
  className,
}: BodyAngleSelectorProps) {
  const hasFront = capturedAngles.includes('front');
  const frontImage = images.frontImageBase64;
  const additionalCount = capturedAngles.filter((a) => a !== 'front').length;
  const totalCount = capturedAngles.length;

  // CTA 텍스트
  const ctaText = totalCount <= 1 ? '정면 사진으로 분석하기' : `${totalCount}장으로 분석하기`;

  return (
    <div className={cn('space-y-5', className)} data-testid="body-angle-selector">
      {/* 안내 문구 */}
      <div className="text-center space-y-1">
        <p className="text-sm text-muted-foreground">
          정확도를 높이려면 다른 각도 사진도 추가해주세요
        </p>
      </div>

      {/* 정면 사진 미리보기 (필수) */}
      {hasFront && frontImage && (
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <span className="text-sm font-semibold">정면 사진</span>
            <span className="text-xs bg-red-100 text-red-600 px-1.5 py-0.5 rounded font-medium">
              필수
            </span>
          </div>
          <div className="relative aspect-[3/4] w-full max-w-[200px] mx-auto rounded-2xl overflow-hidden border-2 border-primary shadow-lg">
            <img src={frontImage} alt="정면 사진" className="w-full h-full object-cover" />
            <button
              onClick={() => onRemoveImage('front')}
              disabled={disabled}
              className="absolute top-2 right-2 w-8 h-8 bg-black/50 rounded-full flex items-center justify-center text-white hover:bg-black/70 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
            <div className="absolute bottom-2 left-2 px-3 py-1.5 bg-primary text-white text-xs font-medium rounded-full flex items-center gap-1.5 shadow">
              <Check className="w-3.5 h-3.5" />
              정면
            </div>
          </div>
        </div>
      )}

      {/* 추가 각도 (선택) — 3열 그리드 */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium text-muted-foreground">추가 각도</span>
            <span className="text-xs text-muted-foreground/70 bg-muted px-1.5 py-0.5 rounded">
              선택
            </span>
          </div>
          {additionalCount > 0 && (
            <p className="text-xs text-green-600 font-medium">{additionalCount}장 추가됨</p>
          )}
        </div>

        <div className="grid grid-cols-3 gap-3">
          {ADDITIONAL_ANGLES.map((angle) => {
            const imageKey = ANGLE_IMAGE_KEY[angle];
            const imageData = images[imageKey];
            const captured = capturedAngles.includes(angle);

            return (
              <div key={angle}>
                {captured && imageData ? (
                  // 촬영된 카드: 이미지 프리뷰 + X 삭제
                  <div className="relative aspect-[3/4] rounded-2xl overflow-hidden border-2 border-green-400 shadow-md">
                    <img
                      src={imageData}
                      alt={`${ANGLE_LABELS[angle]} 사진`}
                      className="w-full h-full object-cover"
                    />
                    <button
                      onClick={() => onRemoveImage(angle)}
                      disabled={disabled}
                      className="absolute top-1.5 right-1.5 w-7 h-7 bg-black/50 rounded-full flex items-center justify-center text-white hover:bg-black/70 transition-colors"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                    <div className="absolute bottom-1.5 left-1.5 px-2 py-1 bg-green-500 text-white text-[10px] font-medium rounded-full flex items-center gap-1 shadow">
                      <Check className="w-3 h-3" />
                      {ANGLE_LABELS[angle]}
                    </div>
                  </div>
                ) : (
                  // 빈 카드: 클릭하여 촬영/선택
                  <button
                    onClick={() => onSelectAngle(angle)}
                    disabled={disabled}
                    className={cn(
                      'w-full aspect-[3/4] rounded-2xl border-2 border-dashed flex flex-col items-center justify-center gap-2 transition-all',
                      'border-primary/30 bg-primary/5 hover:bg-primary/10 hover:border-primary/50',
                      disabled && 'opacity-50 cursor-not-allowed'
                    )}
                  >
                    <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                      <Camera className="w-5 h-5 text-primary/50" />
                    </div>
                    <span className="text-xs font-medium text-foreground">
                      {ANGLE_LABELS[angle]}
                    </span>
                  </button>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* 정확도 안내 */}
      <p className="text-center text-xs text-muted-foreground">
        {totalCount === 1 && '정면만: 기본 분석'}
        {totalCount === 2 && '2장: 상세 분석'}
        {totalCount === 3 && '3장: 정밀 분석'}
        {totalCount >= 4 && '4장: 최고 정밀도'}
      </p>

      {/* CTA 버튼 */}
      <div className="pt-2">
        <Button
          onClick={onSkip}
          disabled={disabled || !hasFront}
          className="w-full h-14 text-lg bg-gradient-brand hover:opacity-90 shadow-lg shadow-primary/20 rounded-2xl transition-all font-bold gap-2"
        >
          {ctaText}
          <ChevronRight className="w-5 h-5" />
        </Button>
      </div>
    </div>
  );
}

export default BodyAngleSelector;
