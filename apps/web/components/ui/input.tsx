import * as React from 'react';

import { cn } from '@/lib/utils';

/**
 * Input 컴포넌트 인터페이스
 *
 * 접근성 속성:
 * - id: Label의 htmlFor와 연결
 * - aria-describedby: 도움말 텍스트 연결
 * - aria-invalid: 오류 상태 표시
 */
interface InputProps extends React.ComponentProps<'input'> {
  /** 입력 필드의 고유 ID (Label과 연결용) */
  id?: string;
  /** 도움말/오류 메시지 요소의 ID 목록 */
  'aria-describedby'?: string;
  /** 유효하지 않은 입력 상태 표시 */
  'aria-invalid'?: boolean | 'grammar' | 'spelling' | 'true' | 'false';
  /** 필수 입력 필드 여부 */
  required?: boolean;
}

/**
 * Input 컴포넌트
 *
 * 접근성 사용 예시:
 * <div>
 *   <Label htmlFor="email">이메일</Label>
 *   <Input id="email" aria-describedby="email-hint email-error" />
 *   <p id="email-hint">알림을 받을 이메일을 입력하세요</p>
 *   <p id="email-error" role="alert">유효한 이메일을 입력해주세요</p>
 * </div>
 */
function Input({
  className,
  type,
  id,
  'aria-describedby': ariaDescribedby,
  required,
  ...props
}: InputProps) {
  return (
    <input
      type={type}
      id={id}
      aria-describedby={ariaDescribedby}
      required={required}
      aria-required={required}
      data-slot="input"
      className={cn(
        'file:text-foreground placeholder:text-muted-foreground selection:bg-primary selection:text-primary-foreground dark:bg-input/30 border-input flex h-9 w-full min-w-0 rounded-md border bg-transparent px-3 py-1 text-base shadow-xs transition-[color,box-shadow] outline-none file:inline-flex file:h-7 file:border-0 file:bg-transparent file:text-sm file:font-medium disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50 md:text-sm',
        'focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px]',
        'aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive',
        className
      )}
      {...props}
    />
  );
}

export { Input };
