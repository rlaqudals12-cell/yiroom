'use client';

import { useState, useCallback } from 'react';
import { MessageCircle, Send, Loader2, AlertTriangle, Sparkles, ChevronDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import type { AnyProduct, ProductType } from '@/types/product';
import { askProductQuestion, FAQ_TEMPLATES, type ProductQAResponse } from '@/lib/rag/product-qa';

interface ProductQAProps {
  product: AnyProduct;
  productType: ProductType;
  userContext?: {
    skinType?: string;
    skinConcerns?: string[];
    allergies?: string[];
  };
}

interface QAMessage {
  id: string;
  type: 'question' | 'answer';
  content: string;
  confidence?: 'high' | 'medium' | 'low';
  warning?: string;
  relatedTopics?: string[];
  timestamp: Date;
}

export function ProductQA({ product, productType, userContext }: ProductQAProps) {
  const [messages, setMessages] = useState<QAMessage[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [showFAQ, setShowFAQ] = useState(true);

  const faqQuestions = FAQ_TEMPLATES[productType] || [];

  const handleAsk = useCallback(
    async (question: string) => {
      if (!question.trim() || loading) return;

      const questionId = Date.now().toString();

      // 질문 추가
      setMessages((prev) => [
        ...prev,
        {
          id: questionId,
          type: 'question',
          content: question,
          timestamp: new Date(),
        },
      ]);
      setInput('');
      setLoading(true);
      setShowFAQ(false);

      try {
        const response: ProductQAResponse = await askProductQuestion({
          question,
          product,
          productType,
          userContext,
        });

        // 답변 추가
        setMessages((prev) => [
          ...prev,
          {
            id: `${questionId}-answer`,
            type: 'answer',
            content: response.answer,
            confidence: response.confidence,
            warning: response.warning,
            relatedTopics: response.relatedTopics,
            timestamp: new Date(),
          },
        ]);
      } catch (error) {
        console.error('Q&A 오류:', error);
        setMessages((prev) => [
          ...prev,
          {
            id: `${questionId}-error`,
            type: 'answer',
            content: '죄송합니다. 답변을 가져오는 중 오류가 발생했습니다.',
            confidence: 'low',
            timestamp: new Date(),
          },
        ]);
      } finally {
        setLoading(false);
      }
    },
    [product, productType, userContext, loading]
  );

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    handleAsk(input);
  };

  const confidenceColors = {
    high: 'bg-green-100 text-green-700',
    medium: 'bg-yellow-100 text-yellow-700',
    low: 'bg-muted text-muted-foreground',
  };

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-base font-medium">
          <MessageCircle className="h-5 w-5 text-pink-500" />
          제품 Q&A
          <Badge variant="secondary" className="ml-auto text-xs">
            AI 답변
          </Badge>
        </CardTitle>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* FAQ 섹션 */}
        {showFAQ && messages.length === 0 && (
          <div className="space-y-2">
            <p className="text-sm text-muted-foreground">자주 묻는 질문</p>
            <div className="flex flex-wrap gap-2">
              {faqQuestions.map((q, idx) => (
                <button
                  key={idx}
                  onClick={() => handleAsk(q)}
                  disabled={loading}
                  className="px-3 py-1.5 text-xs bg-muted/50 hover:bg-pink-50 hover:text-pink-600 rounded-full border border-border hover:border-pink-200 transition-colors disabled:opacity-50"
                >
                  {q}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* 대화 내역 */}
        {messages.length > 0 && (
          <div className="space-y-3 max-h-[400px] overflow-y-auto">
            {messages.map((msg) => (
              <div
                key={msg.id}
                className={cn(
                  'rounded-lg p-3',
                  msg.type === 'question'
                    ? 'bg-pink-50 ml-8'
                    : 'bg-muted/50 mr-8'
                )}
              >
                {msg.type === 'answer' && (
                  <div className="flex items-center gap-2 mb-2">
                    <Sparkles className="h-4 w-4 text-pink-500" />
                    <span className="text-xs text-muted-foreground">AI 답변</span>
                    {msg.confidence && (
                      <Badge
                        variant="secondary"
                        className={cn('text-xs', confidenceColors[msg.confidence])}
                      >
                        {msg.confidence === 'high' && '신뢰도 높음'}
                        {msg.confidence === 'medium' && '참고용'}
                        {msg.confidence === 'low' && '확인 필요'}
                      </Badge>
                    )}
                  </div>
                )}

                <p className="text-sm text-foreground">{msg.content}</p>

                {/* 경고 */}
                {msg.warning && (
                  <div className="mt-2 flex items-start gap-2 p-2 bg-yellow-50 rounded text-xs text-yellow-700">
                    <AlertTriangle className="h-4 w-4 flex-shrink-0 mt-0.5" />
                    {msg.warning}
                  </div>
                )}

                {/* 관련 주제 */}
                {msg.relatedTopics && msg.relatedTopics.length > 0 && (
                  <div className="mt-2 flex flex-wrap gap-1">
                    {msg.relatedTopics.map((topic, idx) => (
                      <button
                        key={idx}
                        onClick={() => handleAsk(topic)}
                        className="text-xs text-pink-500 hover:text-pink-600 underline"
                      >
                        {topic}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            ))}

            {loading && (
              <div className="flex items-center gap-2 p-3 bg-muted/50 rounded-lg mr-8">
                <Loader2 className="h-4 w-4 animate-spin text-pink-500" />
                <span className="text-sm text-muted-foreground">답변 생성 중...</span>
              </div>
            )}
          </div>
        )}

        {/* FAQ 토글 */}
        {messages.length > 0 && (
          <button
            onClick={() => setShowFAQ(!showFAQ)}
            className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground"
          >
            <ChevronDown
              className={cn('h-4 w-4 transition-transform', showFAQ && 'rotate-180')}
            />
            자주 묻는 질문 {showFAQ ? '숨기기' : '보기'}
          </button>
        )}

        {/* FAQ (대화 중) */}
        {showFAQ && messages.length > 0 && (
          <div className="flex flex-wrap gap-2 pt-2 border-t">
            {faqQuestions.map((q, idx) => (
              <button
                key={idx}
                onClick={() => handleAsk(q)}
                disabled={loading}
                className="px-3 py-1.5 text-xs bg-muted/50 hover:bg-pink-50 hover:text-pink-600 rounded-full border border-border hover:border-pink-200 transition-colors disabled:opacity-50"
              >
                {q}
              </button>
            ))}
          </div>
        )}

        {/* 입력 폼 */}
        <form onSubmit={handleSubmit} className="flex gap-2">
          <Input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="제품에 대해 궁금한 점을 물어보세요..."
            disabled={loading}
            className="flex-1"
          />
          <Button type="submit" disabled={loading || !input.trim()} size="icon">
            {loading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Send className="h-4 w-4" />
            )}
          </Button>
        </form>

        <p className="text-xs text-muted-foreground text-center">
          AI 답변은 참고용입니다. 정확한 정보는 제조사나 전문가에게 문의하세요.
        </p>
      </CardContent>
    </Card>
  );
}
