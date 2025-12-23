import { GridSkeleton, HeaderSkeleton } from '@/components/ui/ContentSkeleton';

export default function Loading() {
  return (
    <div className="p-4 max-w-7xl mx-auto space-y-4">
      <HeaderSkeleton hasBackButton />
      <GridSkeleton count={6} cols={{ mobile: 2, desktop: 3 }} />
    </div>
  );
}
