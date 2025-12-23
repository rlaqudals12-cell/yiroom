import { GridSkeleton, HeaderSkeleton, SearchSkeleton } from '@/components/ui/ContentSkeleton';

export default function Loading() {
  return (
    <div className="p-4 max-w-7xl mx-auto space-y-4">
      <HeaderSkeleton hasBackButton={false} />
      <SearchSkeleton hasFilter />
      <GridSkeleton count={8} cols={{ mobile: 2, desktop: 4 }} />
    </div>
  );
}
