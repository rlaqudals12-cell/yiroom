'use client';

import { useState, useEffect } from 'react';
import { Search, X } from 'lucide-react';

import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface ProductSearchProps {
  value: string;
  onValueChange: (value: string) => void;
  placeholder?: string;
  className?: string;
  debounceMs?: number;
}

/**
 * 제품 검색 입력창
 * - 디바운스 300ms
 * - 검색어 클리어 버튼
 */
export function ProductSearch({
  value,
  onValueChange,
  placeholder = '제품명, 브랜드 검색',
  className,
  debounceMs = 300,
}: ProductSearchProps) {
  const [localValue, setLocalValue] = useState(value);

  // 외부 value 변경 시 로컬 상태 동기화
  useEffect(() => {
    setLocalValue(value);
  }, [value]);

  // 디바운스 처리
  useEffect(() => {
    const timer = setTimeout(() => {
      if (localValue !== value) {
        onValueChange(localValue);
      }
    }, debounceMs);

    return () => clearTimeout(timer);
  }, [localValue, value, onValueChange, debounceMs]);

  const handleClear = () => {
    setLocalValue('');
    onValueChange('');
  };

  return (
    <div className={cn('relative', className)}>
      <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
      <Input
        type="text"
        value={localValue}
        onChange={(e) => setLocalValue(e.target.value)}
        placeholder={placeholder}
        className="pl-9 pr-9"
      />
      {localValue && (
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="absolute right-1 top-1/2 h-7 w-7 -translate-y-1/2"
          onClick={handleClear}
        >
          <X className="h-4 w-4" />
          <span className="sr-only">검색어 지우기</span>
        </Button>
      )}
    </div>
  );
}
