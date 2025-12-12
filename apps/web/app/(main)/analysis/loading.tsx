import { CardSkeleton } from '@/components/ui/ContentSkeleton';

export default function Loading() {
  return (
    <div className="p-4 max-w-4xl mx-auto pt-16 space-y-4">
      <CardSkeleton hasImage imageAspect="wide" lines={2} />
      <CardSkeleton hasImage={false} lines={4} />
      <CardSkeleton hasImage={false} lines={3} />
    </div>
  );
}
