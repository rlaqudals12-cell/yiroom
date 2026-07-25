import { CardSkeleton } from '@/components/ui/ContentSkeleton';

export default function Loading() {
  return (
    <div className="min-h-[calc(100vh-80px)] bg-muted" data-testid="body-result-loading">
      <div className="max-w-lg mx-auto px-4 py-8 space-y-6">
        {/* 헤더 */}
        <div className="flex items-center justify-between">
          <div className="h-8 w-16 rounded-md bg-muted-foreground/10 animate-pulse" />
          <div className="h-6 w-36 rounded-md bg-muted-foreground/10 animate-pulse" />
          <div className="w-16" />
        </div>
        {/* 진단지 히어로 스켈레톤 — 아이브로우 + 세리프 제목 + 속성표 자리 (원형 점수 게이지 연출 제거) */}
        <div className="bg-card rounded-2xl border border-border p-6 space-y-4">
          <div className="h-3 w-24 rounded-md bg-muted-foreground/10 animate-pulse" />
          <div className="h-8 w-40 rounded-md bg-muted-foreground/10 animate-pulse" />
          <div className="h-4 w-56 rounded-md bg-muted-foreground/10 animate-pulse" />
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
