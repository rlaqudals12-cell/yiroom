import { CardSkeleton } from '@/components/ui/ContentSkeleton';

export default function Loading() {
  return (
    <div className="min-h-[calc(100vh-80px)] bg-muted">
      <div className="max-w-lg mx-auto px-4 py-8 space-y-6">
        {/* 헤더 */}
        <div className="flex items-center justify-between">
          <div className="h-8 w-24 rounded-md bg-muted-foreground/10 animate-pulse" />
          <div className="h-6 w-20 rounded-md bg-muted-foreground/10 animate-pulse" />
        </div>
        {/* 가이드 카드 */}
        <div className="bg-card rounded-xl p-6 space-y-4">
          <div className="w-16 h-16 mx-auto rounded-full bg-muted-foreground/10 animate-pulse" />
          <div className="h-5 w-48 mx-auto rounded-md bg-muted-foreground/10 animate-pulse" />
          <div className="h-4 w-64 mx-auto rounded-md bg-muted-foreground/10 animate-pulse" />
        </div>
        {/* 업로드 영역 */}
        <CardSkeleton hasImage={false} lines={3} />
        {/* 이전 결과 */}
        <CardSkeleton hasImage={false} lines={2} />
      </div>
    </div>
  );
}
