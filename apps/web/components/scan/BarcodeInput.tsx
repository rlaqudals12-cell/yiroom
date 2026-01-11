'use client';

/**
 * 바코드 수동 입력 컴포넌트
 * - 카메라 스캔이 안 될 때 직접 입력
 * - 바코드 형식 검증
 */

import { useState, useCallback } from 'react';
import { Search, Hash, Check } from 'lucide-react';
import { cn } from '@/lib/utils';
import { detectBarcodeFormat } from '@/lib/scan';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

interface BarcodeInputProps {
  /** 바코드 제출 시 콜백 */
  onSubmit: (barcode: string) => void;
  /** 로딩 상태 */
  loading?: boolean;
  className?: string;
}

export function BarcodeInput({ onSubmit, loading = false, className }: BarcodeInputProps) {
  const [value, setValue] = useState('');
  const [isValid, setIsValid] = useState<boolean | null>(null);

  const handleChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value.replace(/[^0-9]/g, '');
    setValue(newValue);

    if (newValue.length >= 8) {
      const format = detectBarcodeFormat(newValue);
      setIsValid(format !== null);
    } else {
      setIsValid(null);
    }
  }, []);

  const handleSubmit = useCallback(
    (e: React.FormEvent) => {
      e.preventDefault();
      if (value && isValid) {
        onSubmit(value);
      }
    },
    [value, isValid, onSubmit]
  );

  return (
    <form
      onSubmit={handleSubmit}
      className={cn('flex flex-col gap-3', className)}
      data-testid="barcode-input-form"
    >
      <div className="relative">
        <Hash className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
        <Input
          type="text"
          inputMode="numeric"
          pattern="[0-9]*"
          placeholder="바코드 번호 입력 (8-13자리)"
          value={value}
          onChange={handleChange}
          maxLength={13}
          className={cn(
            'pl-10 pr-10 text-lg',
            isValid === true && 'border-green-500 focus-visible:ring-green-500',
            isValid === false && 'border-red-500 focus-visible:ring-red-500'
          )}
          data-testid="barcode-input"
        />
        {isValid !== null && (
          <div className="absolute right-3 top-1/2 -translate-y-1/2">
            {isValid ? (
              <Check className="w-5 h-5 text-green-500" />
            ) : (
              <span className="text-xs text-red-500">유효하지 않음</span>
            )}
          </div>
        )}
      </div>

      <Button type="submit" disabled={!isValid || loading} className="gap-2">
        {loading ? (
          <>
            <span className="animate-spin">⏳</span>
            조회 중...
          </>
        ) : (
          <>
            <Search className="w-4 h-4" />
            제품 조회
          </>
        )}
      </Button>

      <p className="text-xs text-muted-foreground text-center">EAN-13, EAN-8, UPC-A 형식 지원</p>
    </form>
  );
}
