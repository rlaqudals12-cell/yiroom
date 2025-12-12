import { GridSkeleton } from '@/components/ui/ContentSkeleton';

export default function Loading() {
  return (
    <div className="p-4 max-w-7xl mx-auto pt-16">
      <GridSkeleton count={8} cols={{ mobile: 2, desktop: 4 }} />
    </div>
  );
}
