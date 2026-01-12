'use client';

/**
 * Phase D: 피부 상담 채팅 메인 컴포넌트
 */

import { useState, useRef, useEffect, useCallback } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Send, Loader2, Droplets, Sun, Sparkles, AlertCircle } from 'lucide-react';
import ChatMessage from './ChatMessage';
import QuickQuestions from './QuickQuestions';
import { GREETING_MESSAGE, NO_ANALYSIS_MESSAGE } from '@/lib/mock/skin-consultation';
import type {
  ChatMessage as ChatMessageType,
  SkinConcern,
  SkinAnalysisSummary,
  ProductRecommendation,
} from '@/types/skin-consultation';

interface SkinConsultationChatProps {
  skinAnalysis?: SkinAnalysisSummary | null;
  onProductClick?: (productId: string) => void;
}

interface CoachApiResponse {
  success: boolean;
  message: string;
  suggestedQuestions?: string[];
  products?: Array<{
    id: string;
    name: string;
    brand: string;
    category: string;
    matchScore: number;
    matchReasons: string[];
  }>;
  error?: string;
}

/** 분석 결과 요약 카드 */
function AnalysisSummaryCard({ analysis }: { analysis: SkinAnalysisSummary }) {
  return (
    <Card className="bg-gradient-to-r from-pink-50 to-purple-50 border-pink-200/50">
      <CardContent className="p-4">
        <div className="flex items-center justify-between mb-3">
          <span className="font-medium text-sm">내 피부 분석 결과</span>
          <Badge variant="secondary" className="text-[10px]">
            {analysis.analyzedAt.toLocaleDateString('ko-KR')} 분석
          </Badge>
        </div>
        <div className="grid grid-cols-3 gap-3 text-center">
          <div className="bg-white/60 rounded-lg p-2">
            <Droplets className="w-4 h-4 mx-auto text-blue-500 mb-1" />
            <div className="text-lg font-bold">{analysis.hydration}</div>
            <div className="text-[10px] text-muted-foreground">수분</div>
          </div>
          <div className="bg-white/60 rounded-lg p-2">
            <Sparkles className="w-4 h-4 mx-auto text-yellow-500 mb-1" />
            <div className="text-lg font-bold">{analysis.oiliness}</div>
            <div className="text-[10px] text-muted-foreground">유분</div>
          </div>
          <div className="bg-white/60 rounded-lg p-2">
            <Sun className="w-4 h-4 mx-auto text-red-400 mb-1" />
            <div className="text-lg font-bold">{analysis.sensitivity}</div>
            <div className="text-[10px] text-muted-foreground">민감도</div>
          </div>
        </div>
        <p className="text-xs text-muted-foreground mt-3 text-center">
          {analysis.skinType} 피부 타입
        </p>
      </CardContent>
    </Card>
  );
}

export default function SkinConsultationChat({
  skinAnalysis,
  onProductClick,
}: SkinConsultationChatProps) {
  const [messages, setMessages] = useState<ChatMessageType[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // API 호출 함수
  const callCoachApi = useCallback(
    async (message: string, chatHistory: ChatMessageType[]): Promise<CoachApiResponse> => {
      const response = await fetch('/api/coach/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message,
          chatHistory: chatHistory.slice(-5).map((m) => ({
            id: m.id,
            role: m.role,
            content: m.content,
            timestamp: m.timestamp,
          })),
        }),
      });

      if (!response.ok) {
        throw new Error('API 호출 실패');
      }

      return response.json();
    },
    []
  );

  // API 응답의 제품 데이터를 ProductRecommendation 형식으로 변환
  const transformProducts = (
    products?: CoachApiResponse['products']
  ): ProductRecommendation[] | undefined => {
    if (!products || products.length === 0) return undefined;
    return products.map((p) => ({
      id: p.id,
      name: p.name,
      brand: p.brand,
      category: p.category,
      reason: p.matchReasons.join(', '),
      matchRate: p.matchScore,
    }));
  };

  // 초기 인사 메시지
  useEffect(() => {
    const greetingMessage: ChatMessageType = {
      id: 'greeting',
      role: 'assistant',
      content: skinAnalysis ? GREETING_MESSAGE : NO_ANALYSIS_MESSAGE,
      timestamp: new Date(),
    };
    setMessages([greetingMessage]);
  }, [skinAnalysis]);

  // 스크롤 자동 이동
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // 질문 처리
  const handleSendMessage = async (text: string, _concern?: SkinConcern) => {
    if (!text.trim() || isLoading) return;

    // 에러 초기화
    setError(null);

    // 사용자 메시지 추가
    const userMessage: ChatMessageType = {
      id: `user-${Date.now()}`,
      role: 'user',
      content: text,
      timestamp: new Date(),
    };
    setMessages((prev) => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    try {
      // API 호출
      const response = await callCoachApi(text, [...messages, userMessage]);

      // AI 응답 메시지
      const aiMessage: ChatMessageType = {
        id: `ai-${Date.now()}`,
        role: 'assistant',
        content: response.message,
        timestamp: new Date(),
        productRecommendations: transformProducts(response.products),
      };

      setMessages((prev) => [...prev, aiMessage]);
    } catch (err) {
      console.error('[SkinConsultationChat] API 호출 실패:', err);
      setError('답변을 가져오는 데 실패했어요. 잠시 후 다시 시도해주세요.');
    } finally {
      setIsLoading(false);
    }
  };

  // 빠른 질문 클릭
  const handleQuickQuestion = (question: string, concern: SkinConcern) => {
    handleSendMessage(question, concern);
  };

  return (
    <div className="flex flex-col h-full" data-testid="skin-consultation-chat">
      {/* 분석 요약 (있을 때만) */}
      {skinAnalysis && (
        <div className="px-4 py-3 border-b">
          <AnalysisSummaryCard analysis={skinAnalysis} />
        </div>
      )}

      {/* 에러 알림 */}
      {error && (
        <div className="mx-4 mt-2 p-3 bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800 rounded-lg flex items-center gap-2 text-sm text-red-600 dark:text-red-400">
          <AlertCircle className="w-4 h-4 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* 메시지 영역 */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((message) => (
          <ChatMessage key={message.id} message={message} onProductClick={onProductClick} />
        ))}

        {/* 로딩 인디케이터 */}
        {isLoading && (
          <div className="flex items-center gap-2 text-muted-foreground">
            <Loader2 className="w-4 h-4 animate-spin" />
            <span className="text-sm">AI가 답변을 생성하고 있어요...</span>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* 빠른 질문 */}
      {skinAnalysis && (
        <div className="px-4 py-2 border-t bg-muted/30">
          <QuickQuestions onQuestionClick={handleQuickQuestion} disabled={isLoading} />
        </div>
      )}

      {/* 입력 영역 */}
      <div className="p-4 border-t">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSendMessage(input);
          }}
          className="flex gap-2"
        >
          <Input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder={skinAnalysis ? '피부 고민을 물어보세요...' : '먼저 피부 분석을 받아주세요'}
            disabled={isLoading || !skinAnalysis}
            className="flex-1"
          />
          <Button type="submit" size="icon" disabled={!input.trim() || isLoading || !skinAnalysis}>
            <Send className="w-4 h-4" />
          </Button>
        </form>
      </div>
    </div>
  );
}
