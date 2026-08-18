'use client';

import { useEffect, useId, useRef } from 'react';
import Link from 'next/link';
import { ArrowLeft, CircleAlert, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

export interface ErrorStateProps {
  title?: string;
  description?: string;
  onRetry: () => void;
  retryLabel?: string;
  backHref?: string;
  backLabel?: string;
  testId: string;
  className?: string;
}

/**
 * 라우트 오류 경계의 공용 복구 화면.
 *
 * 오류 경계로 화면이 교체되면 스크린리더 사용자가 변화를 놓치지 않도록 alert로 알리고,
 * 제목으로 포커스를 옮겨 오류 설명과 복구 버튼을 바로 탐색할 수 있게 한다.
 */
export function ErrorState({
  title = '문제가 발생했어요',
  description = '잠시 후 다시 시도해 주세요.',
  onRetry,
  retryLabel = '다시 시도',
  backHref,
  backLabel = '홈으로',
  testId,
  className,
}: ErrorStateProps) {
  const titleId = useId();
  const descriptionId = useId();
  const titleRef = useRef<HTMLHeadingElement>(null);

  useEffect(() => {
    titleRef.current?.focus();
  }, []);

  return (
    <section
      role="alert"
      aria-labelledby={titleId}
      aria-describedby={descriptionId}
      data-testid={testId}
      className={cn(
        'flex min-h-[calc(100vh-80px)] items-center justify-center bg-background px-4',
        className
      )}
    >
      <div className="w-full max-w-md py-16 text-center">
        <CircleAlert
          className="mx-auto mb-6 h-12 w-12 text-destructive"
          strokeWidth={1.5}
          aria-hidden="true"
        />
        <h2
          ref={titleRef}
          id={titleId}
          tabIndex={-1}
          className="mb-2 text-xl font-bold text-foreground outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
        >
          {title}
        </h2>
        <p id={descriptionId} className="mb-6 text-muted-foreground">
          {description}
        </p>
        <div className="flex justify-center gap-3">
          {backHref && (
            <Button variant="outline" asChild>
              <Link href={backHref}>
                <ArrowLeft className="mr-2 h-4 w-4" aria-hidden="true" />
                {backLabel}
              </Link>
            </Button>
          )}
          <Button type="button" onClick={onRetry}>
            <RefreshCw className="mr-2 h-4 w-4" aria-hidden="true" />
            {retryLabel}
          </Button>
        </div>
      </div>
    </section>
  );
}

export default ErrorState;
