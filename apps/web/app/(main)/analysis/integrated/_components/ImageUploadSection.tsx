'use client';

/**
 * 통합 분석 이미지 업로드 섹션
 *
 * @see docs/specs/SDD-INTEGRATED-RESULT-UI.md §2.3
 */

import { useCallback, useState } from 'react';
import Image from 'next/image';
import { Camera, X, Upload, Loader2 } from 'lucide-react';
import { compressFileToBase64, ImageProcessingError } from '@/lib/utils/image-compression';

export interface ImageUploadSectionProps {
  onFaceImageChange: (base64: string | null) => void;
  onBodyImageChange: (base64: string | null) => void;
}

// label htmlFor ↔ input id 연결용 — 접근 가능한 이름과 클릭 타깃을 동시에 보장한다
const FACE_INPUT_ID = 'integrated-face-upload';
const BODY_INPUT_ID = 'integrated-body-upload';

/**
 * 드롭존(라벨) 스타일 — 파일 input이 sr-only라 포커스 링을 그릴 수 없으므로
 * peer-focus-visible로 라벨이 대신 그린다 (키보드 사용자가 지금 어디에 있는지 보이게).
 */
const DROPZONE_CLASS =
  'flex min-h-[160px] cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed border-border bg-background text-muted-foreground hover:border-primary/50 hover:text-primary peer-focus-visible:border-primary peer-focus-visible:text-primary peer-focus-visible:ring-2 peer-focus-visible:ring-primary/40';

export function ImageUploadSection({
  onFaceImageChange,
  onBodyImageChange,
}: ImageUploadSectionProps): React.JSX.Element {
  const [facePreview, setFacePreview] = useState<string | null>(null);
  const [bodyPreview, setBodyPreview] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState<'face' | 'body' | null>(null);
  // 왜: 브라우저 alert() 대신 인라인 에러 — 흐름 끊김·접근성 문제 해소
  const [uploadError, setUploadError] = useState<{ kind: 'face' | 'body'; message: string } | null>(
    null
  );

  const handleImageChange = useCallback(
    async (
      file: File | null,
      setPreview: (v: string | null) => void,
      onChange: (b: string | null) => void,
      kind: 'face' | 'body'
    ) => {
      // 새 시도 시 해당 슬롯의 이전 에러 초기화
      setUploadError((prev) => (prev?.kind === kind ? null : prev));
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
        // 원인별 안내(용량 초과·비이미지·디코드 실패)를 그대로 노출 — 뭉뚱그린 문구는 재시도 방향을 못 준다
        const message =
          err instanceof ImageProcessingError
            ? err.userMessage
            : '이미지 처리에 실패했어요. 다른 사진을 선택해주세요.';
        setUploadError({ kind, message });
        // 실패한 슬롯은 이전 선택도 비워 "성공한 것처럼" 남지 않게 한다
        setPreview(null);
        onChange(null);
      } finally {
        setIsProcessing(null);
      }
    },
    []
  );

  // 사진을 지우면 그 슬롯의 에러도 함께 사라져야 한다 (해소된 에러가 남는 문제)
  const clearFace = () => {
    setFacePreview(null);
    onFaceImageChange(null);
    setUploadError((prev) => (prev?.kind === 'face' ? null : prev));
  };
  const clearBody = () => {
    setBodyPreview(null);
    onBodyImageChange(null);
    setUploadError((prev) => (prev?.kind === 'body' ? null : prev));
  };

  return (
    <div className="grid gap-4 md:grid-cols-2" data-testid="integrated-image-upload">
      {/* 얼굴 셀카 (필수) */}
      <div className="rounded-2xl border border-border bg-card p-4">
        <div className="mb-2 flex items-center gap-2">
          <Camera className="h-4 w-4 text-primary" />
          <p className="text-sm font-semibold text-foreground">
            얼굴 셀카 <span className="text-primary">*</span>
          </p>
        </div>
        <p className="mb-3 text-xs text-muted-foreground">자연광에서 정면으로 찍은 사진이 좋아요</p>
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
          // 접근성: display:none(hidden) input은 포커스를 받지 못해 키보드만 쓰는 사용자가
          // "필수" 항목인 얼굴 사진에 아예 도달할 수 없었다. sr-only로 화면에서만 감춰
          // 탭 순서를 유지하고, 드롭존(label)이 peer-focus-visible로 포커스 링을 대신 그린다.
          <>
            <input
              id={FACE_INPUT_ID}
              data-testid="face-upload-input"
              type="file"
              accept="image/*"
              aria-label="얼굴 셀카 사진 선택"
              className="peer sr-only"
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
            <label
              htmlFor={FACE_INPUT_ID}
              aria-busy={isProcessing === 'face'}
              className={DROPZONE_CLASS}
            >
              {isProcessing === 'face' ? (
                <Loader2
                  className="mb-2 h-6 w-6 animate-spin text-primary"
                  data-testid="face-upload-spinner"
                />
              ) : (
                <Upload className="mb-2 h-6 w-6" />
              )}
              <span className="text-sm">
                {isProcessing === 'face' ? '처리 중...' : '사진 선택'}
              </span>
            </label>
          </>
        )}
        {uploadError?.kind === 'face' && (
          <p role="alert" className="mt-2 text-xs text-destructive" data-testid="face-upload-error">
            {uploadError.message}
          </p>
        )}
      </div>

      {/* 전신 사진 (선택) */}
      <div className="rounded-2xl border border-border bg-card p-4">
        <div className="mb-2 flex items-center gap-2">
          <Camera className="h-4 w-4 text-muted-foreground" />
          <p className="text-sm font-semibold text-foreground">
            전신 사진 <span className="text-muted-foreground">(선택)</span>
          </p>
        </div>
        {/*
          정직성: 전신 사진이 없으면 체형 축은 자가입력(키·몸무게)을 쓰지 않고
          시드 기반 예시 결과로 채워진다 (lib/analysis/integrated/internal/axis-adapters.ts,
          bodyFallback). 자가입력을 실제 추정에 쓰는 구현(b안)은 제품 결정 D-d 대기 중이므로,
          그 전까지 문구가 구현을 앞서가지 않도록 한다.
        */}
        <p className="mb-3 text-xs text-muted-foreground">
          전신 사진이 없으면 체형은 예시 결과로 대체돼요
        </p>
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
          // 얼굴 슬롯과 동일 — sr-only input으로 키보드 진입 보장 (위 주석 참조)
          <>
            <input
              id={BODY_INPUT_ID}
              data-testid="body-upload-input"
              type="file"
              accept="image/*"
              aria-label="전신 사진 선택"
              className="peer sr-only"
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
            <label
              htmlFor={BODY_INPUT_ID}
              aria-busy={isProcessing === 'body'}
              className={DROPZONE_CLASS}
            >
              {isProcessing === 'body' ? (
                <Loader2
                  className="mb-2 h-6 w-6 animate-spin text-primary"
                  data-testid="body-upload-spinner"
                />
              ) : (
                <Upload className="mb-2 h-6 w-6" />
              )}
              <span className="text-sm">
                {isProcessing === 'body' ? '처리 중...' : '사진 선택'}
              </span>
            </label>
          </>
        )}
        {uploadError?.kind === 'body' && (
          <p role="alert" className="mt-2 text-xs text-destructive" data-testid="body-upload-error">
            {uploadError.message}
          </p>
        )}
      </div>
    </div>
  );
}
