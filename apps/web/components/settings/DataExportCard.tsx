'use client';

import { useState } from 'react';
import { Download, Loader2, CheckCircle } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

/**
 * 데이터 내보내기 카드
 * 사용자 데이터를 JSON 형식으로 다운로드
 */
export function DataExportCard() {
  const [isExporting, setIsExporting] = useState(false);
  const [exportSuccess, setExportSuccess] = useState(false);

  const handleExport = async () => {
    setIsExporting(true);
    setExportSuccess(false);

    try {
      const response = await fetch('/api/export');

      if (!response.ok) {
        throw new Error('Export failed');
      }

      // 파일 다운로드 처리
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;

      // Content-Disposition에서 파일명 추출
      const contentDisposition = response.headers.get('Content-Disposition');
      const filenameMatch = contentDisposition?.match(/filename="(.+)"/);
      const filename = filenameMatch ? filenameMatch[1] : 'yiroom-data.json';

      a.download = filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);

      setExportSuccess(true);
      // 3초 후 성공 상태 초기화
      setTimeout(() => setExportSuccess(false), 3000);
    } catch (error) {
      console.error('[DataExport] Failed to export:', error);
      alert('데이터 내보내기에 실패했습니다. 다시 시도해주세요.');
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <Card data-testid="data-export-card">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Download className="w-5 h-5" aria-hidden="true" />
          데이터 내보내기
        </CardTitle>
        <CardDescription>
          내 분석 결과, 운동 기록, 영양 정보 등을 JSON 파일로 다운로드합니다
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Button
          onClick={handleExport}
          disabled={isExporting}
          variant={exportSuccess ? 'outline' : 'default'}
          className="w-full sm:w-auto"
          data-testid="export-button"
        >
          {isExporting ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" aria-hidden="true" />
              내보내는 중...
            </>
          ) : exportSuccess ? (
            <>
              <CheckCircle className="w-4 h-4 mr-2 text-green-500" aria-hidden="true" />
              다운로드 완료
            </>
          ) : (
            <>
              <Download className="w-4 h-4 mr-2" aria-hidden="true" />내 데이터 다운로드
            </>
          )}
        </Button>
        <p className="mt-3 text-xs text-muted-foreground">
          내보낸 데이터는 개인정보가 포함되어 있으니 안전하게 보관해주세요.
        </p>
      </CardContent>
    </Card>
  );
}
