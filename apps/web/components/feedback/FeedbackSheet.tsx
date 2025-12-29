'use client';

import { useState } from 'react';
import { MessageSquare, Loader2, Check, AlertCircle } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
  SheetTrigger,
  SheetFooter,
} from '@/components/ui/sheet';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import type { FeedbackType, SubmitFeedbackRequest } from '@/types/feedback';
import { FEEDBACK_TYPE_NAMES, FEEDBACK_TYPE_ICONS, validateFeedback } from '@/lib/feedback';

interface FeedbackSheetProps {
  /** 시트 트리거 */
  trigger?: React.ReactNode;
  /** 제출 핸들러 */
  onSubmit?: (data: SubmitFeedbackRequest) => Promise<boolean>;
  /** 제출 완료 콜백 */
  onSubmitSuccess?: () => void;
  'data-testid'?: string;
}

/**
 * 피드백 시트 컴포넌트
 * - 버그 신고, 기능 제안, 문의 등
 * - 제목, 내용, 연락처 입력
 */
export function FeedbackSheet({
  trigger,
  onSubmit,
  onSubmitSuccess,
  'data-testid': testId,
}: FeedbackSheetProps) {
  const [open, setOpen] = useState(false);
  const [type, setType] = useState<FeedbackType | ''>('');
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [contactEmail, setContactEmail] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(false);
  const [errors, setErrors] = useState<string[]>([]);

  // 폼 초기화
  const resetForm = () => {
    setType('');
    setTitle('');
    setContent('');
    setContactEmail('');
    setErrors([]);
    setSubmitSuccess(false);
  };

  // 시트 닫기
  const handleOpenChange = (newOpen: boolean) => {
    setOpen(newOpen);
    if (!newOpen) {
      resetForm();
    }
  };

  // 제출
  const handleSubmit = async () => {
    // 유효성 검사
    const validation = validateFeedback({
      type: type as FeedbackType,
      title,
      content,
    });

    if (!validation.valid) {
      setErrors(validation.errors);
      return;
    }

    setErrors([]);
    setIsSubmitting(true);

    try {
      const success = await onSubmit?.({
        type: type as FeedbackType,
        title,
        content,
        contactEmail: contactEmail || undefined,
      });

      if (success) {
        setSubmitSuccess(true);
        onSubmitSuccess?.();
        // 2초 후 시트 닫기
        setTimeout(() => {
          handleOpenChange(false);
        }, 2000);
      } else {
        setErrors(['피드백 전송에 실패했습니다. 다시 시도해주세요.']);
      }
    } catch {
      setErrors(['피드백 전송 중 오류가 발생했습니다.']);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Sheet open={open} onOpenChange={handleOpenChange}>
      <SheetTrigger asChild>
        {trigger ?? (
          <Button variant="outline" size="sm">
            <MessageSquare className="h-4 w-4 mr-2" />
            피드백
          </Button>
        )}
      </SheetTrigger>
      <SheetContent
        side="bottom"
        className="h-[85vh] overflow-y-auto"
        data-testid={testId || 'feedback-sheet'}
      >
        <SheetHeader>
          <SheetTitle className="flex items-center gap-2">
            <MessageSquare className="h-5 w-5" />
            피드백 보내기
          </SheetTitle>
          <SheetDescription>
            버그 신고, 기능 제안, 또는 문의사항을 보내주세요.
          </SheetDescription>
        </SheetHeader>

        {submitSuccess ? (
          <div className="flex flex-col items-center justify-center py-12 space-y-4">
            <div className="h-16 w-16 rounded-full bg-green-100 flex items-center justify-center">
              <Check className="h-8 w-8 text-green-600" />
            </div>
            <h3 className="font-semibold text-lg">피드백을 보내주셔서 감사합니다!</h3>
            <p className="text-muted-foreground text-center">
              소중한 의견을 검토 후 반영하겠습니다.
            </p>
          </div>
        ) : (
          <div className="mt-6 space-y-6">
            {/* 에러 메시지 */}
            {errors.length > 0 && (
              <div
                className="flex items-start gap-3 p-4 rounded-lg border border-red-200 bg-red-50 text-red-700"
                data-testid="feedback-errors"
              >
                <AlertCircle className="h-5 w-5 flex-shrink-0 mt-0.5" />
                <ul className="list-disc list-inside text-sm">
                  {errors.map((error, i) => (
                    <li key={i}>{error}</li>
                  ))}
                </ul>
              </div>
            )}

            {/* 피드백 유형 */}
            <div className="space-y-2">
              <Label htmlFor="type">피드백 유형 *</Label>
              <Select
                value={type}
                onValueChange={(v) => setType(v as FeedbackType)}
              >
                <SelectTrigger id="type" data-testid="feedback-type-select">
                  <SelectValue placeholder="유형을 선택하세요" />
                </SelectTrigger>
                <SelectContent>
                  {(Object.keys(FEEDBACK_TYPE_NAMES) as FeedbackType[]).map(
                    (t) => (
                      <SelectItem key={t} value={t}>
                        {FEEDBACK_TYPE_ICONS[t]} {FEEDBACK_TYPE_NAMES[t]}
                      </SelectItem>
                    )
                  )}
                </SelectContent>
              </Select>
            </div>

            {/* 제목 */}
            <div className="space-y-2">
              <Label htmlFor="title">제목 *</Label>
              <Input
                id="title"
                placeholder="간략한 제목을 입력하세요"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                data-testid="feedback-title-input"
              />
            </div>

            {/* 내용 */}
            <div className="space-y-2">
              <Label htmlFor="content">내용 *</Label>
              <Textarea
                id="content"
                placeholder="자세한 내용을 입력하세요"
                rows={5}
                value={content}
                onChange={(e) => setContent(e.target.value)}
                data-testid="feedback-content-input"
              />
            </div>

            {/* 연락처 이메일 (선택) */}
            <div className="space-y-2">
              <Label htmlFor="email">연락처 이메일 (선택)</Label>
              <Input
                id="email"
                type="email"
                placeholder="답변을 받을 이메일"
                value={contactEmail}
                onChange={(e) => setContactEmail(e.target.value)}
                data-testid="feedback-email-input"
              />
              <p className="text-xs text-muted-foreground">
                답변이 필요하시면 이메일을 입력해주세요.
              </p>
            </div>
          </div>
        )}

        {!submitSuccess && (
          <SheetFooter className="mt-6">
            <Button
              onClick={handleSubmit}
              disabled={isSubmitting}
              className="w-full"
              data-testid="feedback-submit-button"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  전송 중...
                </>
              ) : (
                '피드백 보내기'
              )}
            </Button>
          </SheetFooter>
        )}
      </SheetContent>
    </Sheet>
  );
}

export default FeedbackSheet;
