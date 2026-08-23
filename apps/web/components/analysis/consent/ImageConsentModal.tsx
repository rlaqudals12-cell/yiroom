'use client';

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Camera, FileImage, Shield, ExternalLink, Loader2 } from 'lucide-react';
import { ANALYSIS_TYPE_LABELS, type ImageConsentModalProps } from './types';
import { LATEST_CONSENT_VERSION } from '@/lib/consent/version-check';

/**
 * 이미지 저장 동의 모달
 * GDPR/PIPA 컴플라이언스를 준수하는 사용자 동의 UI
 *
 * @example
 * ```tsx
 * <ImageConsentModal
 *   isOpen={showConsent}
 *   onConsent={() => handleConsent(true)}
 *   onSkip={() => handleConsent(false)}
 *   analysisType="skin"
 * />
 * ```
 */
export function ImageConsentModal({
  isOpen,
  onConsent,
  onSkip,
  analysisType,
  consentVersion = LATEST_CONSENT_VERSION,
  isLoading = false,
}: ImageConsentModalProps) {
  const typeLabel = ANALYSIS_TYPE_LABELS[analysisType];

  // 모든 축에서 실제로 제공하는 저장·결과 확인·철회 범위만 안내한다.
  const benefits = [
    {
      icon: Camera,
      text: `${typeLabel}에 사용한 사진을 분석 기록과 함께 저장해요`,
    },
    {
      icon: FileImage,
      text: '저장된 사진은 해당 분석 결과에서 다시 확인할 수 있어요',
    },
    {
      icon: Shield,
      text: '저장하지 않아도 이번 분석은 그대로 진행돼요',
    },
  ];

  // 저장 정보
  const storageInfo = [
    { label: '저장 기간', value: '동의일로부터 최대 1년 (만료 시 자동 파기)' },
    { label: '저장 위치', value: '암호화된 비공개 클라우드 저장소' },
    { label: '삭제', value: '동의 철회·삭제 요청 시 저장 사진 파기' },
  ];

  return (
    <Dialog
      open={isOpen}
      onOpenChange={(open) => {
        if (!open && !isLoading) onSkip();
      }}
    >
      <DialogContent className="max-w-md mx-auto" data-testid="image-consent-modal">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-lg">
            <Camera className="w-5 h-5 text-primary" />
            {typeLabel} 사진을 저장할까요?
          </DialogTitle>
          <DialogDescription className="sr-only">{typeLabel} 사진 저장 동의 요청</DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          {/* 혜택 섹션 */}
          <div className="space-y-2">
            <p className="text-sm text-muted-foreground">사진을 저장하면:</p>
            <ul className="space-y-2">
              {benefits.map((benefit, index) => (
                <li key={index} className="flex items-center gap-2 text-sm">
                  <benefit.icon className="w-4 h-4 text-primary shrink-0" />
                  <span>{benefit.text}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* 저장 정보 섹션 */}
          <div className="bg-muted/50 rounded-lg p-3 space-y-2">
            <div className="flex items-center gap-2 text-sm font-medium">
              <Shield className="w-4 h-4 text-muted-foreground" />
              저장 정보
            </div>
            <ul className="space-y-1 text-sm text-muted-foreground">
              {storageInfo.map((info, index) => (
                <li key={index}>
                  <span className="font-medium text-foreground">{info.label}:</span> {info.value}
                </li>
              ))}
            </ul>
          </div>

          {/* 개인정보처리방침 링크 */}
          <a
            href="/privacy-policy"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1 text-xs text-muted-foreground hover:text-primary transition-colors"
          >
            자세한 개인정보처리방침 보기
            <ExternalLink className="w-3 h-3" />
          </a>

          {/* 버전 표시 */}
          <p className="text-[10px] text-muted-foreground text-right">
            동의서 버전: {consentVersion}
          </p>
        </div>

        {/* 버튼 그룹 - 동등한 크기/스타일 */}
        <div className="flex gap-3 pt-2">
          <Button
            onClick={onConsent}
            disabled={isLoading}
            variant="outline"
            className="flex-1"
            data-testid="consent-agree-button"
          >
            {isLoading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
            저장하기
          </Button>
          <Button
            onClick={onSkip}
            disabled={isLoading}
            variant="outline"
            className="flex-1"
            data-testid="consent-skip-button"
          >
            건너뛰기
          </Button>
        </div>

        {/* 안심 메시지 */}
        <p className="text-xs text-center text-muted-foreground">
          건너뛰어도 이번 분석 결과는 볼 수 있어요
        </p>
      </DialogContent>
    </Dialog>
  );
}

export default ImageConsentModal;
