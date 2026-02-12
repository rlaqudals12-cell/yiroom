import { CardSkeleton } from '@/components/ui/ContentSkeleton';

export default function Loading() {
  return (
    <div className="min-h-[calc(100vh-80px)] bg-muted">
      <div className="max-w-lg mx-auto px-4 py-8 space-y-6">
        {/* 헤더 */}
        <div className="flex items-center justify-between">
          <div className="h-8 w-16 rounded-md bg-muted-foreground/10 animate-pulse" />
          <div className="h-6 w-36 rounded-md bg-muted-foreground/10 animate-pulse" />
          <div className="w-16" />
        </div>
        {/* 점수 카드 */}
        <div className="bg-gradient-to-br from-cyan-50 to-blue-50 rounded-xl p-6 text-center space-y-4">
          <div className="w-20 h-20 mx-auto rounded-full bg-white/60 animate-pulse" />
          <div className="h-6 w-40 mx-auto rounded-md bg-white/40 animate-pulse" />
          <div className="h-4 w-32 mx-auto rounded-md bg-white/30 animate-pulse" />
        </div>
        {/* 탭 */}
        <div className="h-10 rounded-md bg-muted-foreground/10 animate-pulse" />
        {/* 콘텐츠 */}
        <CardSkeleton hasImage={false} lines={4} />
        <CardSkeleton hasImage={false} lines={3} />
      </div>
    </div>
  );
}
