'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Send, Loader2, Bot, User, Sparkles, Package } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { askProductQuestion, FAQ_TEMPLATES, type ProductQAResponse } from '@/lib/rag/product-qa';
import { getProductById } from '@/lib/products';
import type { AnyProduct, ProductType } from '@/types/product';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  confidence?: 'high' | 'medium' | 'low';
  relatedTopics?: string[];
  warning?: string;
  timestamp: Date;
}

// 채팅 메시지 컴포넌트
function ChatMessage({ message }: { message: Message }) {
  const isUser = message.role === 'user';

  return (
    <div className={`flex gap-3 ${isUser ? 'flex-row-reverse' : ''}`} data-testid="chat-message">
      {/* 아바타 */}
      <div
        className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
          isUser
            ? 'bg-primary text-primary-foreground'
            : 'bg-gradient-to-br from-violet-500 to-purple-600 text-white'
        }`}
      >
        {isUser ? <User className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
      </div>

      {/* 메시지 내용 */}
      <div className={`flex-1 max-w-[80%] ${isUser ? 'text-right' : ''}`}>
        <div
          className={`inline-block px-4 py-3 rounded-2xl ${
            isUser ? 'bg-primary text-primary-foreground rounded-br-md' : 'bg-muted rounded-bl-md'
          }`}
        >
          <p className="text-sm whitespace-pre-wrap">{message.content}</p>
        </div>

        {/* AI 응답 추가 정보 */}
        {!isUser && message.confidence && (
          <div className="mt-2 space-y-2">
            {/* 신뢰도 */}
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <span
                className={`w-2 h-2 rounded-full ${
                  message.confidence === 'high'
                    ? 'bg-green-500'
                    : message.confidence === 'medium'
                      ? 'bg-yellow-500'
                      : 'bg-red-500'
                }`}
              />
              <span>
                {message.confidence === 'high'
                  ? '높은 신뢰도'
                  : message.confidence === 'medium'
                    ? '보통 신뢰도'
                    : '낮은 신뢰도'}
              </span>
            </div>

            {/* 경고 */}
            {message.warning && (
              <p className="text-xs text-amber-600 bg-amber-50 px-3 py-2 rounded-lg">
                ⚠️ {message.warning}
              </p>
            )}

            {/* 관련 주제 */}
            {message.relatedTopics && message.relatedTopics.length > 0 && (
              <div className="flex flex-wrap gap-1">
                {message.relatedTopics.map((topic, index) => (
                  <span
                    key={index}
                    className="text-xs px-2 py-1 bg-violet-50 text-violet-600 rounded-full"
                  >
                    {topic}
                  </span>
                ))}
              </div>
            )}
          </div>
        )}

        {/* 시간 */}
        <p className="text-xs text-muted-foreground mt-1">
          {message.timestamp.toLocaleTimeString('ko-KR', {
            hour: '2-digit',
            minute: '2-digit',
          })}
        </p>
      </div>
    </div>
  );
}

// FAQ 버튼 컴포넌트
function FAQButton({ question, onClick }: { question: string; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="text-left px-4 py-3 bg-card border border-border rounded-xl hover:border-violet-300 hover:bg-violet-50 transition-colors text-sm"
    >
      {question}
    </button>
  );
}

/**
 * 제품 Q&A 페이지
 * RAG 기반 제품 질문 답변 채팅 UI
 */
export default function ProductQAPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<AnyProduct | null>(null);
  const [productType, setProductType] = useState<ProductType>('cosmetic');

  // 제품 정보 로드
  const loadProduct = useCallback(async (productId: string, type: ProductType) => {
    try {
      const product = await getProductById(type, productId);
      if (product) {
        setSelectedProduct(product);
      }
    } catch (err) {
      console.error('[ProductQA] Failed to load product:', err);
    }
  }, []);

  // URL에서 제품 정보 가져오기 (옵션)
  useEffect(() => {
    const productId = searchParams.get('productId');
    const type = (searchParams.get('type') as ProductType) || 'cosmetic';

    if (type) {
      setProductType(type);
    }

    // 제품 ID가 있으면 제품 정보 로드
    if (productId) {
      loadProduct(productId, type);
    }
  }, [searchParams, loadProduct]);

  // 메시지 스크롤
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // 메시지 전송
  const handleSend = async (question?: string) => {
    const text = question || inputValue.trim();
    if (!text || isLoading) return;

    const userMessage: Message = {
      id: `user-${Date.now()}`,
      role: 'user',
      content: text,
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInputValue('');
    setIsLoading(true);

    try {
      // 제품이 선택되지 않은 경우 기본 응답
      if (!selectedProduct) {
        const assistantMessage: Message = {
          id: `assistant-${Date.now()}`,
          role: 'assistant',
          content:
            '특정 제품을 선택하면 더 정확한 답변을 드릴 수 있어요. 제품 상세 페이지에서 "질문하기" 버튼을 눌러보세요!',
          confidence: 'low',
          timestamp: new Date(),
        };
        setMessages((prev) => [...prev, assistantMessage]);
        setIsLoading(false);
        return;
      }

      const response: ProductQAResponse = await askProductQuestion({
        question: text,
        product: selectedProduct,
        productType,
      });

      const assistantMessage: Message = {
        id: `assistant-${Date.now()}`,
        role: 'assistant',
        content: response.answer,
        confidence: response.confidence,
        relatedTopics: response.relatedTopics,
        warning: response.warning,
        timestamp: new Date(),
      };

      setMessages((prev) => [...prev, assistantMessage]);
    } catch (error) {
      console.error('Q&A Error:', error);
      const errorMessage: Message = {
        id: `assistant-${Date.now()}`,
        role: 'assistant',
        content: '죄송합니다. 답변을 생성하는 중 오류가 발생했습니다. 잠시 후 다시 시도해 주세요.',
        confidence: 'low',
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  // Enter 키 처리
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const faqQuestions = FAQ_TEMPLATES[productType] || FAQ_TEMPLATES.cosmetic;

  return (
    <div className="flex flex-col h-[calc(100vh-80px)]" data-testid="product-qa-page">
      {/* 헤더 */}
      <div className="sticky top-0 z-10 bg-background/95 backdrop-blur border-b px-4 py-3">
        <div className="max-w-2xl mx-auto flex items-center gap-3">
          <button
            onClick={() => router.back()}
            className="p-2 -ml-2 hover:bg-muted rounded-lg transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div className="flex-1">
            <h1 className="font-bold text-foreground flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-violet-500" />
              제품 Q&A
            </h1>
            <p className="text-xs text-muted-foreground">AI가 제품에 대한 궁금증을 해결해 드려요</p>
          </div>
        </div>
      </div>

      {/* 채팅 영역 */}
      <div className="flex-1 overflow-y-auto px-4 py-6">
        <div className="max-w-2xl mx-auto space-y-6">
          {/* 초기 상태 */}
          {messages.length === 0 && (
            <div className="text-center py-8 space-y-6">
              <div className="w-16 h-16 mx-auto bg-gradient-to-br from-violet-500 to-purple-600 rounded-full flex items-center justify-center">
                <Bot className="w-8 h-8 text-white" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-foreground mb-2">무엇이든 물어보세요!</h2>
                <p className="text-muted-foreground text-sm">
                  제품에 대한 궁금한 점을 AI에게 질문해보세요
                </p>
              </div>

              {/* 제품 미선택 안내 */}
              {!selectedProduct && (
                <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
                  <div className="flex items-center gap-2 text-amber-700 mb-2">
                    <Package className="w-4 h-4" />
                    <span className="font-medium text-sm">제품을 선택해주세요</span>
                  </div>
                  <p className="text-xs text-amber-600 mb-3">
                    특정 제품을 선택하면 더 정확한 답변을 받을 수 있어요
                  </p>
                  <Link
                    href="/products"
                    className="inline-flex items-center gap-2 text-sm text-amber-700 hover:text-amber-800 font-medium"
                  >
                    제품 둘러보기 →
                  </Link>
                </div>
              )}

              {/* FAQ */}
              <div className="space-y-3">
                <p className="text-sm font-medium text-foreground/80">자주 묻는 질문</p>
                <div className="grid gap-2">
                  {faqQuestions.map((q, index) => (
                    <FAQButton key={index} question={q} onClick={() => handleSend(q)} />
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* 메시지 목록 */}
          {messages.map((message) => (
            <ChatMessage key={message.id} message={message} />
          ))}

          {/* 로딩 */}
          {isLoading && (
            <div className="flex gap-3">
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center flex-shrink-0">
                <Bot className="w-4 h-4 text-white" />
              </div>
              <div className="bg-muted px-4 py-3 rounded-2xl rounded-bl-md">
                <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* 입력 영역 */}
      <div className="border-t bg-background px-4 py-4">
        <div className="max-w-2xl mx-auto">
          <div className="flex gap-2">
            <input
              type="text"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="궁금한 점을 입력하세요..."
              className="flex-1 px-4 py-3 border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent"
              disabled={isLoading}
            />
            <Button
              onClick={() => handleSend()}
              disabled={!inputValue.trim() || isLoading}
              className="px-4 bg-violet-600 hover:bg-violet-700"
            >
              <Send className="w-4 h-4" />
            </Button>
          </div>
          <p className="text-xs text-muted-foreground text-center mt-2">
            AI 답변은 참고용이며, 정확한 정보는 제조사에 문의해주세요
          </p>
        </div>
      </div>
    </div>
  );
}
