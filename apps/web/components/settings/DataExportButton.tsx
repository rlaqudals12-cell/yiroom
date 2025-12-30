'use client';

import { useState } from 'react';
import { Download, Loader2, Check } from 'lucide-react';
import { cn } from '@/lib/utils';

interface DataExportButtonProps {
  className?: string;
}

type ExportState = 'idle' | 'exporting' | 'success' | 'error';

export function DataExportButton({ className }: DataExportButtonProps) {
  const [state, setState] = useState<ExportState>('idle');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleExport = async () => {
    if (state === 'exporting') return;

    setState('exporting');
    setErrorMessage(null);

    try {
      const response = await fetch('/api/user/export', {
        method: 'POST',
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
      setErrorMessage(err instanceof Error ? err.message : '알 수 없는 오류가 발생했습니다.');
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
            {state === 'exporting' ? (
              <Loader2 className="w-5 h-5 text-muted-foreground animate-spin" />
            ) : state === 'success' ? (
              <Check className="w-5 h-5 text-green-500" />
            ) : (
              <Download className="w-5 h-5 text-muted-foreground" />
            )}
          </div>
          <div className="text-left">
            <p className="font-medium text-foreground">
              {state === 'success' ? '다운로드 완료' : '데이터 내보내기'}
            </p>
            <p className="text-sm text-muted-foreground">
              {state === 'exporting'
                ? '데이터를 수집하고 있습니다...'
                : state === 'success'
                ? 'JSON 파일이 다운로드되었습니다'
                : '모든 데이터를 JSON 파일로 다운로드'}
            </p>
          </div>
        </div>
      </button>

      {/* 에러 메시지 */}
      {errorMessage && (
        <p className="mt-2 text-sm text-destructive px-4">{errorMessage}</p>
      )}
    </div>
  );
}
