import { HomeBriefingSkeleton } from './_components/HomeBriefingSkeleton';
import { HomeHeader } from './_components/HomeHeader';

/** 실제 브리핑과 같은 주인공 1개 구조를 유지하는 홈 로딩 표면입니다. */
export default function HomeLoading(): React.JSX.Element {
  return (
    <div className="min-h-screen bg-surface-ground" data-testid="home-loading">
      <HomeHeader />
      <div className="mx-auto w-full max-w-3xl px-4 py-5">
        <HomeBriefingSkeleton />
      </div>
    </div>
  );
}
