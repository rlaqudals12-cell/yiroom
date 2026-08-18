/** 실제 홈의 한 주인공 구조와 같은 부피를 유지하는 로딩 표면입니다. */
export function HomeBriefingSkeleton(): React.JSX.Element {
  return (
    <div
      className="space-y-3 animate-pulse"
      data-testid="home-briefing-skeleton"
      role="status"
      aria-label="오늘의 브리핑을 불러오는 중"
    >
      <section
        className="rounded-2xl border border-[var(--border-warm-sheet)] bg-card p-6 shadow-[var(--shadow-raised)] dark:border-border dark:shadow-none"
        data-testid="home-briefing-skeleton-hero"
        aria-hidden="true"
      >
        <div className="h-3 w-20 rounded bg-muted" />
        <div className="mt-3 h-4 w-40 rounded bg-muted" />
        <div className="mt-2 h-8 w-3/4 rounded bg-muted" />
        <div className="mt-5 space-y-3 border-y border-border py-3">
          <div className="h-4 w-full rounded bg-muted" />
          <div className="h-4 w-5/6 rounded bg-muted" />
        </div>
        <div className="mt-3 h-3 w-28 rounded bg-muted" />
      </section>

      <div
        className="rounded-2xl border border-border bg-card p-4"
        data-testid="home-briefing-skeleton-support"
        aria-hidden="true"
      >
        <div className="h-3 w-24 rounded bg-muted" />
        <div className="mt-3 h-10 w-full rounded bg-muted" />
      </div>
    </div>
  );
}
