import { CardSkeleton } from '@/components/ui/ContentSkeleton';

export default function Loading() {
  return (
    <div className="min-h-[calc(100vh-80px)] bg-muted">
      <div className="max-w-lg mx-auto px-4 py-8 space-y-6">
        {/* 헤더 */}
        <div className="text-center space-y-2" aria-hidden="true">
          <div className="h-8 w-48 mx-auto rounded-md bg-muted-foreground/10 animate-pulse" />
          <div className="h-4 w-64 mx-auto rounded-md bg-muted-foreground/10 animate-pulse" />
        </div>
        {/* 가이드 카드 */}
        <CardSkeleton hasImage={false} lines={4} />
        {/* 버튼 영역 */}
        <div className="flex gap-3">
          <div className="flex-1 h-10 rounded-md bg-muted-foreground/10 animate-pulse" />
          <div className="h-10 w-28 rounded-md bg-muted-foreground/10 animate-pulse" />
        </div>
      </div>
    </div>
  );
}
