'use client';

/**
 * 내 트윈 섹션 — [나] 탭 진입점 (ADR-115, SDD §4)
 *
 * 승인(approved)된 트윈이 있으면 썸네일("AI 생성" 라벨)+삭제 버튼, 없으면
 * "내 트윈 만들기" CTA를 노출한다. pending/rejected 트윈은 여기에 절대 표시하지
 * 않는다(useApprovedTwin이 approved만 반환).
 */

import { useState } from 'react';
import { Sparkles, Plus, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { useApprovedTwin } from './useTwin';
import { TwinStudio } from './TwinStudio';

export function MyTwinCard() {
  const { approvedTwin, loading, refetch } = useApprovedTwin();
  const [studioOpen, setStudioOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const handleDelete = async () => {
    if (!approvedTwin) return;
    setDeleting(true);
    try {
      const res = await fetch(`/api/visual/twin/${approvedTwin.id}`, { method: 'DELETE' });
      if (!res.ok) {
        toast.error('삭제에 실패했어요. 잠시 후 다시 시도해 주세요.');
        return;
      }
      toast.success('트윈을 삭제했어요.');
      await refetch();
    } catch {
      toast.error('네트워크 오류가 발생했어요.');
    } finally {
      setDeleting(false);
    }
  };

  const renderBody = () => {
    if (loading) {
      return <div className="h-40 animate-pulse rounded-xl bg-muted" data-testid="twin-loading" />;
    }
    if (approvedTwin) {
      return (
        <div className="space-y-3" data-testid="twin-approved">
          <div className="relative mx-auto w-full max-w-[220px] overflow-hidden rounded-xl bg-muted">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={approvedTwin.imageUrl}
              alt="내 트윈"
              className="max-h-[280px] w-full object-contain"
            />
            <span
              data-testid="ai-generated-label"
              className="absolute left-2 top-2 rounded-full bg-black/70 px-2.5 py-1 text-[11px] font-medium text-white"
            >
              AI 생성
            </span>
          </div>
          <p className="text-center text-xs text-muted-foreground">
            옷장 아이템에서 &lsquo;내 트윈에게 입혀보기&rsquo;로 스타일을 입혀볼 수 있어요.
          </p>
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button
                variant="outline"
                size="sm"
                className="w-full text-destructive"
                data-testid="twin-delete-button"
              >
                <Trash2 className="mr-2 h-4 w-4" aria-hidden="true" />
                트윈 삭제
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>트윈을 삭제할까요?</AlertDialogTitle>
                <AlertDialogDescription>
                  트윈 이미지가 완전히 지워져요. 이 작업은 되돌릴 수 없어요.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>취소</AlertDialogCancel>
                <AlertDialogAction
                  onClick={handleDelete}
                  disabled={deleting}
                  className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                >
                  {deleting ? '삭제 중...' : '삭제'}
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      );
    }
    return (
      <div className="space-y-3" data-testid="twin-empty">
        <p className="text-sm text-muted-foreground">
          나를 닮은 모습으로 만들어, 옷과 스타일을 입혀볼 수 있어요.
        </p>
        <Button
          className="w-full"
          onClick={() => setStudioOpen(true)}
          data-testid="create-twin-cta"
        >
          <Plus className="mr-2 h-4 w-4" aria-hidden="true" />내 트윈 만들기
        </Button>
      </div>
    );
  };

  return (
    <section data-testid="my-twin-card" className="bg-card rounded-2xl border p-4">
      <div className="mb-3 flex items-center gap-2">
        <Sparkles className="h-5 w-5 text-purple-500" aria-hidden="true" />
        <h3 className="font-semibold">내 트윈</h3>
      </div>
      {renderBody()}
      <TwinStudio open={studioOpen} onOpenChange={setStudioOpen} onApproved={refetch} />
    </section>
  );
}

export default MyTwinCard;
