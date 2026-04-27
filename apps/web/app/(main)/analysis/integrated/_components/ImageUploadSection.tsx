'use client';

/**
 * 통합 분석 이미지 업로드 섹션
 *
 * @see docs/specs/SDD-INTEGRATED-RESULT-UI.md §2.3
 */

import { useCallback, useState } from 'react';
import Image from 'next/image';
import { Camera, X, Upload } from 'lucide-react';
import { compressFileToBase64 } from '@/lib/utils/image-compression';

export interface ImageUploadSectionProps {
  onFaceImageChange: (base64: string | null) => void;
  onBodyImageChange: (base64: string | null) => void;
}

export function ImageUploadSection({
  onFaceImageChange,
  onBodyImageChange,
}: ImageUploadSectionProps): React.JSX.Element {
  const [facePreview, setFacePreview] = useState<string | null>(null);
  const [bodyPreview, setBodyPreview] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState<'face' | 'body' | null>(null);

  const handleImageChange = useCallback(
    async (
      file: File | null,
      setPreview: (v: string | null) => void,
      onChange: (b: string | null) => void,
      kind: 'face' | 'body'
    ) => {
      if (!file) {
        setPreview(null);
        onChange(null);
        return;
      }
      setIsProcessing(kind);
      try {
        // 왜: 5MB 제한 내 압축 + Base64 변환 (Vercel 4.5MB body limit 대응)
        const base64 = await compressFileToBase64(file);
        setPreview(base64);
        onChange(base64);
      } catch (err) {
        console.error('[ImageUpload] compression failed:', err);
        alert('이미지 처리에 실패했어요. 다른 사진을 선택해주세요.');
      } finally {
        setIsProcessing(null);
      }
    },
    []
  );

  const clearFace = () => {
    setFacePreview(null);
    onFaceImageChange(null);
  };
  const clearBody = () => {
    setBodyPreview(null);
    onBodyImageChange(null);
  };

  return (
    <div className="grid gap-4 md:grid-cols-2" data-testid="integrated-image-upload">
      {/* 얼굴 셀카 (필수) */}
      <div className="rounded-2xl border border-zinc-800 bg-neutral-900 p-4">
        <div className="mb-2 flex items-center gap-2">
          <Camera className="h-4 w-4 text-pink-400" />
          <p className="text-sm font-semibold text-white">
            얼굴 셀카 <span className="text-pink-400">*</span>
          </p>
        </div>
        <p className="mb-3 text-xs text-zinc-400">자연광에서 정면으로 찍은 사진이 좋아요</p>
        {facePreview ? (
          <div className="relative">
            <Image
              src={facePreview}
              alt="얼굴 미리보기"
              width={400}
              height={400}
              className="w-full rounded-xl object-cover"
              unoptimized
            />
            <button
              type="button"
              onClick={clearFace}
              aria-label="얼굴 사진 제거"
              className="absolute right-2 top-2 rounded-full bg-black/60 p-1.5 text-white hover:bg-black/80"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        ) : (
          <label className="flex min-h-[160px] cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed border-zinc-700 bg-neutral-950 text-zinc-400 hover:border-pink-500/50 hover:text-pink-300">
            <Upload className="mb-2 h-6 w-6" />
            <span className="text-sm">{isProcessing === 'face' ? '처리 중...' : '사진 선택'}</span>
            <input
              type="file"
              accept="image/*"
              className="hidden"
              disabled={isProcessing !== null}
              onChange={(e) =>
                handleImageChange(
                  e.target.files?.[0] ?? null,
                  setFacePreview,
                  onFaceImageChange,
                  'face'
                )
              }
            />
          </label>
        )}
      </div>

      {/* 전신 사진 (선택) */}
      <div className="rounded-2xl border border-zinc-800 bg-neutral-900 p-4">
        <div className="mb-2 flex items-center gap-2">
          <Camera className="h-4 w-4 text-blue-400" />
          <p className="text-sm font-semibold text-white">
            전신 사진 <span className="text-zinc-500">(선택)</span>
          </p>
        </div>
        <p className="mb-3 text-xs text-zinc-400">없으면 자가입력으로 체형을 추정해드려요</p>
        {bodyPreview ? (
          <div className="relative">
            <Image
              src={bodyPreview}
              alt="전신 미리보기"
              width={400}
              height={400}
              className="w-full rounded-xl object-cover"
              unoptimized
            />
            <button
              type="button"
              onClick={clearBody}
              aria-label="전신 사진 제거"
              className="absolute right-2 top-2 rounded-full bg-black/60 p-1.5 text-white hover:bg-black/80"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        ) : (
          <label className="flex min-h-[160px] cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed border-zinc-700 bg-neutral-950 text-zinc-400 hover:border-blue-500/50 hover:text-blue-300">
            <Upload className="mb-2 h-6 w-6" />
            <span className="text-sm">{isProcessing === 'body' ? '처리 중...' : '사진 선택'}</span>
            <input
              type="file"
              accept="image/*"
              className="hidden"
              disabled={isProcessing !== null}
              onChange={(e) =>
                handleImageChange(
                  e.target.files?.[0] ?? null,
                  setBodyPreview,
                  onBodyImageChange,
                  'body'
                )
              }
            />
          </label>
        )}
      </div>
    </div>
  );
}
