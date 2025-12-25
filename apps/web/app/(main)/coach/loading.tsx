import { Loader2 } from 'lucide-react';

export default function CoachLoading() {
  return (
    <div className="flex items-center justify-center h-[calc(100vh-4rem)]">
      <div className="flex flex-col items-center gap-3">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <p className="text-sm text-muted-foreground">코치를 불러오는 중...</p>
      </div>
    </div>
  );
}
