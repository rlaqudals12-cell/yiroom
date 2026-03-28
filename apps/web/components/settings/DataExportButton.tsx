'use client';

import { useState } from 'react';
import { Download, Loader2, Check } from 'lucide-react';
import { cn } from '@/lib/utils';
import { selectByKey } from '@/lib/utils/conditional-helpers';
import { useTranslations } from 'next-intl';

interface DataExportButtonProps {
  className?: string;
}

type ExportState = 'idle' | 'exporting' | 'success' | 'error';

export function DataExportButton({ className }: DataExportButtonProps) {
  const t = useTranslations('settingsUI');
  const [state, setState] = useState<ExportState>('idle');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleExport = async () => {
    if (state === 'exporting') return;

    setState('exporting');
    setErrorMessage(null);

    try {
      const response = await fetch('/api/export', {
        method: 'GET',
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.message || '데이터 내보내기에 실패했습니다.');
      }

      // Blob으로 변환하여 다운로드
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `yiroom-export-${Date.now()}.json`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);

      setState('success');

      // 3초 후 idle 상태로 복귀
      setTimeout(() => setState('idle'), 3000);
    } catch (err) {
      setErrorMessage(err instanceof Error ? err.message : t('dataExportButton0'));
      setState('error');

      // 5초 후 idle 상태로 복귀
      setTimeout(() => {
        setState('idle');
        setErrorMessage(null);
      }, 5000);
    }
  };

  return (
    <div className={className}>
      <button
        onClick={handleExport}
        disabled={state === 'exporting'}
        className={cn(
          'w-full flex items-center justify-between p-4 bg-card rounded-xl border transition-colors',
          state === 'exporting' ? 'opacity-70 cursor-not-allowed' : 'hover:bg-muted/50'
        )}
        data-testid="data-export-button"
      >
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center">
            {state === 'exporting' && (
              <Loader2 className="w-5 h-5 text-muted-foreground animate-spin" />
            )}
            {state === 'success' && <Check className="w-5 h-5 text-green-500" />}
            {state !== 'exporting' && state !== 'success' && (
              <Download className="w-5 h-5 text-muted-foreground" />
            )}
          </div>
          <div className="text-left">
            <p className="font-medium text-foreground">
              {state === 'success' ? t('dataExportButton1') : t('dataExportButton2')}
            </p>
            <p className="text-sm text-muted-foreground">
              {selectByKey(
                state,
                {
                  exporting: t('dataExportButton3'),
                  success: t('dataExportButton4'),
                },
                t('dataExportButton5')
              )}
            </p>
          </div>
        </div>
      </button>

      {/* 에러 메시지 */}
      {errorMessage && <p className="mt-2 text-sm text-destructive px-4">{errorMessage}</p>}
    </div>
  );
}
