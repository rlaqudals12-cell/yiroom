'use client';

import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Search, X, Loader2 } from 'lucide-react';
import { useRef } from 'react';

interface FriendSearchInputProps {
  value: string;
  onChange: (value: string) => void;
  onClear?: () => void;
  placeholder?: string;
  isLoading?: boolean;
  autoFocus?: boolean;
}

export function FriendSearchInput({
  value,
  onChange,
  onClear,
  placeholder = '이름으로 검색...',
  isLoading = false,
  autoFocus = false,
}: FriendSearchInputProps) {
  const inputRef = useRef<HTMLInputElement>(null);

  const handleClear = () => {
    onChange('');
    onClear?.();
    inputRef.current?.focus();
  };

  return (
    <div className="relative" data-testid="friend-search-input">
      {/* 검색 아이콘 또는 로딩 */}
      <div className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
        {isLoading ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          <Search className="h-4 w-4" />
        )}
      </div>

      {/* 입력 필드 */}
      <Input
        ref={inputRef}
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="pl-10 pr-10"
        autoFocus={autoFocus}
        data-testid="friend-search-input-field"
      />

      {/* 클리어 버튼 */}
      {value && (
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7"
          onClick={handleClear}
          aria-label="검색어 지우기"
          data-testid="friend-search-clear-button"
        >
          <X className="h-4 w-4" />
        </Button>
      )}
    </div>
  );
}
