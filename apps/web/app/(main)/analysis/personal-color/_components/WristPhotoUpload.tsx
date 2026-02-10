'use client';

import { useRef, useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { Hand, Camera, ImageIcon, X } from 'lucide-react';
import { Button } from '@/components/ui/button';

// 허용되는 파일 타입
const ALLOWED_FILE_TYPES = ['image/jpeg', 'image/png', 'image/webp'];
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

interface WristPhotoUploadProps {
  onPhotoSelect: (file: File) => void;
  onSkip?: () => void;
}

export default function WristPhotoUpload({ onPhotoSelect, onSkip }: WristPhotoUploadProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const [showActionSheet, setShowActionSheet] = useState(false);
  const [mounted, setMounted] = useState(false);

  // Portal을 위한 클라이언트 마운트 확인
  useEffect(() => {
    setMounted(true);
  }, []);

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

    setShowActionSheet(false);
    onPhotoSelect(file);
  };

  // 가이드 영역 클릭 → ActionSheet 표시
  const handleGuideClick = () => {
    setShowActionSheet(true);
  };

  // 카메라 촬영
  const handleCameraClick = () => {
    setShowActionSheet(false);
    cameraInputRef.current?.click();
  };

  // 갤러리 선택
  const handleGalleryClick = () => {
    setShowActionSheet(false);
    fileInputRef.current?.click();
  };

  return (
    <div data-testid="wrist-photo-upload" className="space-y-4">
      {/* 컴팩트한 가이드 영역 - 클릭 가능 */}
      <button
        type="button"
        onClick={handleGuideClick}
        className="w-full aspect-[16/10] bg-card rounded-2xl overflow-hidden border-2 border-dashed border-border hover:border-primary/50 hover:bg-accent/30 transition-all cursor-pointer group"
        aria-label="손목 사진 촬영 또는 갤러리에서 선택"
      >
        <div className="h-full flex flex-col items-center justify-center gap-3">
          {/* 손목 아이콘 */}
          <div className="w-20 h-14 border-2 border-dashed border-muted-foreground/50 rounded-xl flex items-center justify-center group-hover:border-primary/50 transition-colors">
            <Hand className="w-10 h-10 text-muted-foreground/60 group-hover:text-primary/60 transition-colors" />
          </div>
          {/* 안내 텍스트 */}
          <div className="text-center">
            <p className="text-sm text-muted-foreground group-hover:text-foreground transition-colors">
              탭하여 손목 사진 촬영
            </p>
            <p className="text-xs text-muted-foreground/70 mt-0.5">손목 안쪽 혈관이 보이도록</p>
          </div>
        </div>
      </button>

      {/* 촬영 팁 - 컴팩트 버전 */}
      <div className="bg-blue-50 dark:bg-blue-950/30 rounded-lg p-3">
        <p className="text-xs text-blue-800 dark:text-blue-300 font-medium mb-1.5">촬영 팁</p>
        <ul className="text-xs text-blue-700 dark:text-blue-400 space-y-0.5">
          <li>• 손목 안쪽의 혈관이 잘 보이는 밝은 곳에서</li>
          <li>• 손목 안쪽이 카메라를 향하도록 촬영해주세요</li>
          <li>• 혈관 색이 파란색/보라색인지 녹색인지 확인할 수 있어요</li>
        </ul>
      </div>

      {/* 버튼 영역 */}
      <div className="flex gap-3">
        <Button
          onClick={handleCameraClick}
          className="flex-1 h-12 text-sm gap-2"
          aria-label="카메라로 사진 촬영하기"
        >
          <Camera className="w-4 h-4" aria-hidden="true" />
          사진 촬영
        </Button>
        <Button
          onClick={handleGalleryClick}
          variant="outline"
          className="flex-1 h-12 text-sm gap-2"
          aria-label="갤러리에서 사진 선택하기"
        >
          <ImageIcon className="w-4 h-4" aria-hidden="true" />
          갤러리
        </Button>
      </div>

      {/* 건너뛰기 옵션 */}
      {onSkip && (
        <button
          onClick={onSkip}
          className="w-full text-xs text-muted-foreground hover:text-foreground transition-colors py-1.5"
        >
          건너뛰기 (얼굴 사진만으로 분석)
        </button>
      )}

      {/* 안내 문구 */}
      <div className="text-center text-xs text-muted-foreground pt-1 border-t border-border">
        <p className="mt-2">손목 혈관 색으로 웜톤/쿨톤을 더 정확하게 판단해요</p>
        <p className="mt-0.5 font-medium">
          <span className="text-blue-500">파란색/보라색</span> = 쿨톤 |{' '}
          <span className="text-green-500">녹색</span> = 웜톤
        </p>
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
        capture="environment"
        onChange={handleFileChange}
        className="hidden"
        aria-label="카메라로 사진 촬영"
      />

      {/* ActionSheet (Portal로 body에 직접 렌더링) */}
      {mounted &&
        showActionSheet &&
        createPortal(
          <div
            style={{
              position: 'fixed',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              zIndex: 99999,
              backgroundColor: 'rgba(0, 0, 0, 0.5)',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'flex-end',
              alignItems: 'center',
            }}
            onClick={() => setShowActionSheet(false)}
          >
            <div
              style={{
                width: '100%',
                maxWidth: '32rem',
                backgroundColor: 'var(--card, #ffffff)',
                borderTopLeftRadius: '1rem',
                borderTopRightRadius: '1rem',
                padding: '1rem',
                paddingBottom: '2rem',
                display: 'flex',
                flexDirection: 'column',
                gap: '0.5rem',
              }}
              onClick={(e) => e.stopPropagation()}
            >
              {/* 핸들 바 */}
              <div
                style={{
                  width: '3rem',
                  height: '0.25rem',
                  backgroundColor: '#9ca3af',
                  borderRadius: '9999px',
                  margin: '0 auto 1rem',
                }}
              />

              {/* 타이틀 */}
              <p
                style={{
                  textAlign: 'center',
                  fontSize: '0.875rem',
                  fontWeight: 500,
                  marginBottom: '0.75rem',
                }}
              >
                손목 사진 선택
              </p>

              {/* 카메라 버튼 */}
              <button
                onClick={handleCameraClick}
                style={{
                  width: '100%',
                  display: 'flex',
                  flexDirection: 'row',
                  alignItems: 'center',
                  gap: '0.75rem',
                  padding: '1rem',
                  borderRadius: '0.75rem',
                  backgroundColor: 'var(--accent, #f4f4f5)',
                  border: 'none',
                  cursor: 'pointer',
                }}
              >
                <Camera
                  style={{ width: '1.25rem', height: '1.25rem', color: 'var(--primary, #6366f1)' }}
                />
                <span style={{ color: 'var(--foreground, #09090b)' }}>카메라로 촬영하기</span>
              </button>

              {/* 갤러리 버튼 */}
              <button
                onClick={handleGalleryClick}
                style={{
                  width: '100%',
                  display: 'flex',
                  flexDirection: 'row',
                  alignItems: 'center',
                  gap: '0.75rem',
                  padding: '1rem',
                  borderRadius: '0.75rem',
                  backgroundColor: 'var(--accent, #f4f4f5)',
                  border: 'none',
                  cursor: 'pointer',
                }}
              >
                <ImageIcon
                  style={{ width: '1.25rem', height: '1.25rem', color: 'var(--primary, #6366f1)' }}
                />
                <span style={{ color: 'var(--foreground, #09090b)' }}>갤러리에서 선택하기</span>
              </button>

              {/* 취소 버튼 */}
              <button
                onClick={() => setShowActionSheet(false)}
                style={{
                  width: '100%',
                  display: 'flex',
                  flexDirection: 'row',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '0.5rem',
                  padding: '1rem',
                  borderRadius: '0.75rem',
                  backgroundColor: 'transparent',
                  border: '1px solid var(--border, #e4e4e7)',
                  cursor: 'pointer',
                  marginTop: '0.5rem',
                }}
              >
                <X style={{ width: '1rem', height: '1rem' }} />
                <span style={{ color: 'var(--muted-foreground, #71717a)' }}>취소</span>
              </button>
            </div>
          </div>,
          document.body
        )}
    </div>
  );
}
