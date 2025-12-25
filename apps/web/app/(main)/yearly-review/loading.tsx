import { Skeleton } from '@/components/ui/skeleton';

export default function YearlyReviewLoading() {
  return (
    <div className="container max-w-lg mx-auto px-4 py-6">
      <div className="flex items-center gap-2 mb-6">
        <Skeleton className="h-10 w-10 rounded-md" />
        <Skeleton className="h-7 w-40" />
      </div>
      <div className="space-y-4">
        <Skeleton className="h-96 w-full rounded-2xl" />
        <Skeleton className="h-12 w-full rounded-md" />
        <Skeleton className="h-64 w-full rounded-xl" />
        <Skeleton className="h-48 w-full rounded-xl" />
      </div>
    </div>
  );
}
