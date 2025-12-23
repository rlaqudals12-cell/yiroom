'use client';

import { useState } from 'react';
import Link from 'next/link';
import { MessageCircle, ChevronRight, Sparkles, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { VisuallyHidden } from '@radix-ui/react-visually-hidden';
import { askProductQuestion, FAQ_TEMPLATES, type ProductQAResponse } from '@/lib/rag/product-qa';
import type { AnyProduct, ProductType } from '@/types/product';

interface ProductQASectionProps {
  product: AnyProduct;
  productType: ProductType;
}

interface QAItem {
  question: string;
  answer: string;
  confidence: 'high' | 'medium' | 'low';
}

/**
 * 제품 상세 페이지 Q&A 섹션
 * FAQ 버튼 + 인라인 Q&A 모달
 */
export function ProductQASection({ product, productType }: ProductQASectionProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [currentQuestion, setCurrentQuestion] = useState('');
  const [qaHistory, setQaHistory] = useState<QAItem[]>([]);

  const faqQuestions = FAQ_TEMPLATES[productType] || FAQ_TEMPLATES.cosmetic;

  // 질문 처리
  const handleAskQuestion = async (question: string) => {
    if (isLoading) return;

    setCurrentQuestion(question);
    setIsLoading(true);

    try {
      const response: ProductQAResponse = await askProductQuestion({
        question,
        product,
        productType,
      });

      setQaHistory((prev) => [
        ...prev,
        {
          question,
          answer: response.answer,
          confidence: response.confidence,
        },
      ]);
    } catch (error) {
      console.error('Q&A Error:', error);
      setQaHistory((prev) => [
        ...prev,
        {
          question,
          answer: '죄송합니다. 답변을 생성하는 중 오류가 발생했습니다.',
          confidence: 'low',
        },
      ]);
    } finally {
      setIsLoading(false);
      setCurrentQuestion('');
    }
  };

  return (
    <>
      <Card data-testid="product-qa-section">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base">
            <Sparkles className="w-4 h-4 text-violet-500" />
            이 제품에 대해 물어보세요
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {/* FAQ 버튼들 */}
          <div className="grid grid-cols-2 gap-2">
            {faqQuestions.slice(0, 4).map((question, index) => (
              <button
                key={index}
                onClick={() => {
                  setIsOpen(true);
                  handleAskQuestion(question);
                }}
                className="text-left px-3 py-2 text-xs bg-muted rounded-lg hover:bg-violet-50 hover:text-violet-700 transition-colors line-clamp-2"
              >
                {question}
              </button>
            ))}
          </div>

          {/* 더보기 링크 */}
          <Link
            href={`/products/qa?productId=${product.id}&type=${productType}`}
            className="flex items-center justify-center gap-1 text-sm text-violet-600 hover:text-violet-700 font-medium py-2"
          >
            더 많은 질문하기
            <ChevronRight className="w-4 h-4" />
          </Link>
        </CardContent>
      </Card>

      {/* Q&A 모달 */}
      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="max-w-md max-h-[80vh] overflow-hidden flex flex-col">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <MessageCircle className="w-5 h-5 text-violet-500" />
              {product.name}
            </DialogTitle>
            <VisuallyHidden asChild>
              <DialogDescription>
                {product.name}에 대해 AI에게 질문하세요
              </DialogDescription>
            </VisuallyHidden>
          </DialogHeader>

          <div className="flex-1 overflow-y-auto space-y-4 py-4">
            {/* Q&A 히스토리 */}
            {qaHistory.map((item, index) => (
              <div key={index} className="space-y-2">
                {/* 질문 */}
                <div className="flex justify-end">
                  <div className="bg-primary text-primary-foreground px-4 py-2 rounded-2xl rounded-br-md max-w-[80%]">
                    <p className="text-sm">{item.question}</p>
                  </div>
                </div>

                {/* 답변 */}
                <div className="flex justify-start">
                  <div className="bg-muted px-4 py-2 rounded-2xl rounded-bl-md max-w-[80%]">
                    <p className="text-sm">{item.answer}</p>
                    <div className="flex items-center gap-1 mt-2">
                      <span
                        className={`w-2 h-2 rounded-full ${
                          item.confidence === 'high'
                            ? 'bg-green-500'
                            : item.confidence === 'medium'
                            ? 'bg-yellow-500'
                            : 'bg-red-500'
                        }`}
                      />
                      <span className="text-xs text-muted-foreground">
                        {item.confidence === 'high'
                          ? '높은 신뢰도'
                          : item.confidence === 'medium'
                          ? '보통 신뢰도'
                          : '낮은 신뢰도'}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            ))}

            {/* 로딩 */}
            {isLoading && (
              <div className="space-y-2">
                <div className="flex justify-end">
                  <div className="bg-primary text-primary-foreground px-4 py-2 rounded-2xl rounded-br-md">
                    <p className="text-sm">{currentQuestion}</p>
                  </div>
                </div>
                <div className="flex justify-start">
                  <div className="bg-muted px-4 py-2 rounded-2xl rounded-bl-md">
                    <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />
                  </div>
                </div>
              </div>
            )}

            {/* 빈 상태 - FAQ 버튼 */}
            {qaHistory.length === 0 && !isLoading && (
              <div className="space-y-3">
                <p className="text-sm text-muted-foreground text-center">
                  자주 묻는 질문을 선택하거나 직접 질문해보세요
                </p>
                <div className="space-y-2">
                  {faqQuestions.map((question, index) => (
                    <button
                      key={index}
                      onClick={() => handleAskQuestion(question)}
                      className="w-full text-left px-4 py-3 bg-card border border-border rounded-xl hover:border-violet-300 hover:bg-violet-50 transition-colors text-sm"
                    >
                      {question}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* 입력 영역 */}
          <div className="border-t pt-4">
            <div className="flex gap-2">
              <input
                type="text"
                placeholder="질문을 입력하세요..."
                className="flex-1 px-3 py-2 border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-violet-500"
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && e.currentTarget.value.trim()) {
                    handleAskQuestion(e.currentTarget.value.trim());
                    e.currentTarget.value = '';
                  }
                }}
                disabled={isLoading}
              />
              <Button
                size="sm"
                className="bg-violet-600 hover:bg-violet-700"
                disabled={isLoading}
                onClick={(e) => {
                  const input = e.currentTarget.previousElementSibling as HTMLInputElement;
                  if (input.value.trim()) {
                    handleAskQuestion(input.value.trim());
                    input.value = '';
                  }
                }}
              >
                전송
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
