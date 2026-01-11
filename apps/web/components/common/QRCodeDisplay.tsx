'use client';

/**
 * QR 코드 표시 컴포넌트
 * - 앱 다운로드, 친구 초대, 결과 공유용
 */

import { useState, useEffect } from 'react';
import { generateQRCode, type QRCodeType } from '@/lib/qr/generator';
import { Download } from 'lucide-react';
import { cn } from '@/lib/utils';

interface QRCodeDisplayProps {
  type: QRCodeType;
  data: Record<string, string>;
  title?: string;
  description?: string;
  size?: number;
  className?: string;
}

export function QRCodeDisplay({
  type,
  data,
  title,
  description,
  size = 200,
  className,
}: QRCodeDisplayProps) {
  const [qrDataUrl, setQrDataUrl] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    setIsLoading(true);
    generateQRCode({ type, data, size })
      .then((url) => {
        setQrDataUrl(url);
        setIsLoading(false);
      })
      .catch((error) => {
        console.error('[QR] Generation failed:', error);
        setIsLoading(false);
      });
  }, [type, data, size]);

  const handleDownload = () => {
    if (!qrDataUrl) return;

    const link = document.createElement('a');
    link.download = `yiroom-qr-${type}.png`;
    link.href = qrDataUrl;
    link.click();
  };

  return (
    <div
      data-testid="qr-code-display"
      className={cn('flex flex-col items-center gap-4', className)}
    >
      {title && <h3 className="text-lg font-semibold text-foreground">{title}</h3>}

      <div className="relative">
        {isLoading ? (
          <div
            className="bg-muted animate-pulse rounded-lg"
            style={{ width: size, height: size }}
          />
        ) : qrDataUrl ? (
          <img
            src={qrDataUrl}
            alt="QR Code"
            width={size}
            height={size}
            className="rounded-lg shadow-sm"
          />
        ) : (
          <div
            className="bg-muted flex items-center justify-center rounded-lg"
            style={{ width: size, height: size }}
          >
            <span className="text-muted-foreground text-sm">QR 생성 실패</span>
          </div>
        )}
      </div>

      {description && (
        <p className="text-sm text-muted-foreground text-center max-w-xs">{description}</p>
      )}

      <button
        onClick={handleDownload}
        disabled={!qrDataUrl}
        className={cn(
          'inline-flex items-center gap-2 px-4 py-2 rounded-lg',
          'bg-secondary text-secondary-foreground',
          'hover:bg-secondary/80 transition-colors',
          'disabled:opacity-50 disabled:cursor-not-allowed'
        )}
      >
        <Download className="w-4 h-4" />
        QR 코드 저장
      </button>
    </div>
  );
}
