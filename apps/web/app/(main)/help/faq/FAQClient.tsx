'use client';

import { useState, useCallback } from 'react';
import { ArrowLeft, HelpCircle } from 'lucide-react';
import Link from 'next/link';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import { FAQAccordion } from '@/components/help';
import type { FAQ } from '@/types/announcements';

interface FAQClientProps {
  faqs: FAQ[];
}

export function FAQClient({ faqs }: FAQClientProps) {
  const [feedbackGiven, setFeedbackGiven] = useState<Record<string, boolean>>({});

  // FAQ 피드백 저장 API 호출
  const handleFeedback = useCallback(
    async (faqId: string, helpful: boolean) => {
      // 이미 피드백을 준 경우 무시
      if (feedbackGiven[faqId]) {
        toast.info('이미 의견을 주셨습니다');
        return;
      }

      try {
        const response = await fetch('/api/faq/feedback', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ faqId, helpful }),
        });

        if (response.ok) {
          setFeedbackGiven((prev) => ({ ...prev, [faqId]: true }));
          toast.success(helpful ? '감사합니다!' : '의견 감사합니다. 개선하겠습니다.');
        }
      } catch (error) {
        console.error('[FAQ] Feedback error:', error);
        // 에러 발생해도 UI는 정상 처리 (UX)
        setFeedbackGiven((prev) => ({ ...prev, [faqId]: true }));
        toast.success('의견 감사합니다');
      }
    },
    [feedbackGiven]
  );

  return (
    <div className="container max-w-2xl py-6 space-y-6">
      {/* 헤더 */}
      <div className="flex items-center gap-4">
        <Link href="/dashboard">
          <Button variant="ghost" size="icon">
            <ArrowLeft className="h-5 w-5" />
          </Button>
        </Link>
        <div className="flex items-center gap-2">
          <HelpCircle className="h-6 w-6" />
          <h1 className="text-2xl font-bold">자주 묻는 질문</h1>
        </div>
      </div>

      {/* 설명 */}
      <p className="text-muted-foreground">
        이룸 사용 중 궁금한 점이 있으신가요? 아래에서 답변을 찾아보세요.
      </p>

      {/* FAQ 아코디언 */}
      {faqs.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground">등록된 FAQ가 없습니다.</div>
      ) : (
        <FAQAccordion faqs={faqs} showSearch={true} onFeedback={handleFeedback} />
      )}

      {/* 추가 문의 */}
      <div className="text-center text-sm text-muted-foreground pt-4 border-t">
        원하는 답변을 찾지 못하셨나요?{' '}
        <Link href="/help/feedback" className="text-primary hover:underline">
          문의하기
        </Link>
      </div>
    </div>
  );
}
