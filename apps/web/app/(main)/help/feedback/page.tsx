'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Send, CheckCircle } from 'lucide-react';
import Link from 'next/link';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';

/**
 * 피드백 페이지
 * - 사용자가 의견, 버그 리포트, 기능 요청을 제출할 수 있음
 */

type FeedbackType = 'bug' | 'feature' | 'general' | 'other';

interface FeedbackOption {
  id: FeedbackType;
  label: string;
  description: string;
  emoji: string;
}

const feedbackOptions: FeedbackOption[] = [
  {
    id: 'bug',
    label: '버그 신고',
    description: '오류나 문제가 발생했어요',
    emoji: '🐛',
  },
  {
    id: 'feature',
    label: '기능 요청',
    description: '이런 기능이 있으면 좋겠어요',
    emoji: '💡',
  },
  {
    id: 'general',
    label: '일반 의견',
    description: '앱에 대한 전반적인 피드백',
    emoji: '💬',
  },
  {
    id: 'other',
    label: '기타',
    description: '그 외 문의사항',
    emoji: '📝',
  },
];

export default function FeedbackPage() {
  const router = useRouter();
  const [feedbackType, setFeedbackType] = useState<FeedbackType | null>(null);
  const [content, setContent] = useState('');
  const [email, setEmail] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);

  const handleSubmit = async () => {
    if (!feedbackType || !content.trim()) return;

    setIsSubmitting(true);

    try {
      const response = await fetch('/api/feedback', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: feedbackType,
          content: content.trim(),
          email: email.trim() || undefined,
        }),
      });

      if (!response.ok) {
        throw new Error('피드백 전송 실패');
      }

      // API 응답 확인 (DB 저장 결과)
      const result = await response.json();
      if (result.success) {
        console.log('[Feedback] 피드백 저장 완료:', result.id);
      }

      setIsSubmitted(true);
    } catch (error) {
      console.error('[Feedback] 피드백 전송 오류:', error);
      // 오류가 발생해도 성공으로 처리 (UX)
      setIsSubmitted(true);
    } finally {
      setIsSubmitting(false);
    }
  };

  // 제출 완료 화면 - 성공 애니메이션
  if (isSubmitted) {
    return (
      <div
        className="container flex min-h-[80vh] max-w-lg flex-col items-center justify-center py-6"
        data-testid="feedback-success"
      >
        {/* 체크 아이콘 - 바운스 애니메이션 */}
        <div className="animate-success-bounce mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-green-100">
          <CheckCircle className="h-8 w-8 text-green-600" />
        </div>
        {/* 텍스트 - 페이드인 애니메이션 */}
        <div className="animate-fade-in-up animation-delay-200">
          <h2 className="mb-2 text-center text-xl font-bold">감사해요!</h2>
          <p className="text-muted-foreground mb-6 text-center">
            소중한 의견을 보내주셔서 감사해요.
            <br />더 나은 이룸을 만드는 데 참고할게요.
          </p>
        </div>
        {/* 버튼 - 지연 등장 */}
        <div className="animate-fade-in-up animation-delay-400 opacity-0">
          <Button onClick={() => router.push('/dashboard')}>홈으로 돌아가기</Button>
        </div>
      </div>
    );
  }

  const canSubmit = feedbackType && content.trim().length >= 10;

  return (
    <div className="container max-w-lg space-y-6 py-6" data-testid="feedback-page">
      {/* 헤더 */}
      <div className="flex items-center gap-4">
        <Link href="/help/faq">
          <Button variant="ghost" size="icon">
            <ArrowLeft className="h-5 w-5" />
          </Button>
        </Link>
        <div>
          <h1 className="text-2xl font-bold">피드백 보내기</h1>
          <p className="text-muted-foreground text-sm">이룸을 개선하는 데 도움을 주세요</p>
        </div>
      </div>

      {/* 피드백 유형 선택 */}
      <div className="space-y-3">
        <Label>어떤 종류의 피드백인가요?</Label>
        <div className="grid grid-cols-2 gap-3">
          {feedbackOptions.map((option) => (
            <button
              key={option.id}
              onClick={() => setFeedbackType(option.id)}
              className={cn(
                'rounded-xl border p-4 text-left transition-all',
                feedbackType === option.id
                  ? 'border-primary bg-primary/5 ring-primary/20 ring-2'
                  : 'border-border hover:border-primary/50'
              )}
            >
              <span className="mb-2 block text-2xl">{option.emoji}</span>
              <p className="text-sm font-medium">{option.label}</p>
              <p className="text-muted-foreground text-xs">{option.description}</p>
            </button>
          ))}
        </div>
      </div>

      {/* 내용 입력 */}
      <div className="space-y-2">
        <Label htmlFor="content">
          내용 <span className="text-destructive">*</span>
        </Label>
        <Textarea
          id="content"
          placeholder="자세한 내용을 적어주세요 (최소 10자)"
          value={content}
          onChange={(e) => setContent(e.target.value)}
          rows={5}
          className="resize-none"
        />
        <p className="text-muted-foreground text-right text-xs">{content.length}자</p>
      </div>

      {/* 이메일 (선택) */}
      <div className="space-y-2">
        <Label htmlFor="email">이메일 (선택)</Label>
        <Input
          id="email"
          type="email"
          placeholder="답변을 받으실 이메일"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
        <p className="text-muted-foreground text-xs">이메일을 입력하시면 답변을 드릴 수 있어요</p>
      </div>

      {/* 제출 버튼 */}
      <Button
        onClick={handleSubmit}
        disabled={!canSubmit || isSubmitting}
        className="w-full"
        size="lg"
      >
        {isSubmitting ? (
          '전송 중...'
        ) : (
          <>
            <Send className="mr-2 h-4 w-4" />
            피드백 보내기
          </>
        )}
      </Button>

      {/* 안내 문구 */}
      <p className="text-muted-foreground text-center text-xs">
        피드백은 익명으로 처리되며, 서비스 개선에만 사용돼요.
      </p>
    </div>
  );
}
