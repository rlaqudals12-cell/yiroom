import { ListSkeleton } from '@/components/ui/ContentSkeleton';

export default function Loading() {
  return (
    <div className="p-4 max-w-4xl mx-auto pt-16">
      <ListSkeleton count={6} hasIcon />
    </div>
  );
}
