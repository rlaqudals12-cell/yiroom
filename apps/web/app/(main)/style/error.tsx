'use client';

import { Button } from '@/components/ui/button';

export default function ErrorPage({ reset }: { error: Error; reset: () => void }) {
  return (
    <div
      className="flex flex-col items-center justify-center min-h-[50vh] gap-4"
      data-testid="style-error"
    >
      <h2 className="text-xl font-bold">문제가 발생했어요</h2>
      <p className="text-muted-foreground">잠시 후 다시 시도해주세요.</p>
      <Button onClick={reset}>다시 시도</Button>
    </div>
  );
}
