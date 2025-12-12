import { CardSkeleton } from '@/components/ui/ContentSkeleton';

export default function Loading() {
  return (
    <div className="p-4 max-w-4xl mx-auto pt-16 space-y-4">
      <CardSkeleton hasImage={false} lines={2} />
      <CardSkeleton hasImage imageAspect="video" lines={3} />
      <CardSkeleton hasImage imageAspect="video" lines={3} />
    </div>
  );
}
