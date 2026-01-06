'use client';

import { useState } from 'react';
import { Heart, Send, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { cn } from '@/lib/utils';

// 프리셋 응원 메시지
const PRESET_MESSAGES = [
  '오늘도 화이팅!',
  '잘하고 있어요!',
  '멋져요!',
  '응원할게요!',
  '함께 해요!',
];

interface SendEncouragementProps {
  toUserId: string;
  toUserName: string;
  activityType?: string;
  activityId?: string;
  className?: string;
  onSuccess?: () => void;
}

/**
 * 응원 보내기 버튼 + 다이얼로그
 */
export function SendEncouragement({
  toUserId,
  toUserName,
  activityType,
  activityId,
  className,
  onSuccess,
}: SendEncouragementProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [message, setMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSent, setIsSent] = useState(false);

  const handleSend = async (customMessage?: string) => {
    const finalMessage = customMessage || message;
    if (!finalMessage.trim()) return;

    try {
      setIsLoading(true);
      const res = await fetch('/api/encouragements', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          toUserId,
          message: finalMessage,
          messageType: customMessage ? 'preset' : 'custom',
          activityType,
          activityId,
        }),
      });

      if (res.ok) {
        setIsSent(true);
        setMessage('');
        onSuccess?.();

        // 2초 후 성공 상태 리셋
        setTimeout(() => {
          setIsSent(false);
          setIsOpen(false);
        }, 1500);
      }
    } catch (error) {
      console.error('[SendEncouragement] Error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          className={cn('gap-1.5', className)}
          data-testid="send-encouragement-button"
        >
          <Heart className="h-4 w-4" />
          <span>응원</span>
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[400px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-yellow-500" />
            {toUserName}님에게 응원 보내기
          </DialogTitle>
          <DialogDescription>따뜻한 응원 메시지를 보내보세요</DialogDescription>
        </DialogHeader>

        {isSent ? (
          // 성공 상태
          <div className="flex flex-col items-center justify-center py-8">
            <div className="h-16 w-16 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center mb-4">
              <Heart className="h-8 w-8 text-green-600 animate-pulse" />
            </div>
            <p className="text-lg font-medium">응원을 보냈어요!</p>
          </div>
        ) : (
          <div className="space-y-4 pt-2">
            {/* 프리셋 메시지 */}
            <div className="flex flex-wrap gap-2">
              {PRESET_MESSAGES.map((preset) => (
                <Button
                  key={preset}
                  variant="outline"
                  size="sm"
                  className="text-sm"
                  onClick={() => handleSend(preset)}
                  disabled={isLoading}
                >
                  {preset}
                </Button>
              ))}
            </div>

            {/* 구분선 */}
            <div className="flex items-center gap-2">
              <div className="flex-1 border-t" />
              <span className="text-xs text-muted-foreground">또는</span>
              <div className="flex-1 border-t" />
            </div>

            {/* 커스텀 메시지 */}
            <Textarea
              placeholder="직접 응원 메시지를 작성해보세요"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              className="resize-none"
              rows={3}
              maxLength={200}
            />

            {/* 전송 버튼 */}
            <Button
              className="w-full"
              onClick={() => handleSend()}
              disabled={isLoading || !message.trim()}
            >
              {isLoading ? (
                <div className="animate-spin rounded-full h-4 w-4 border-2 border-background border-t-transparent" />
              ) : (
                <>
                  <Send className="h-4 w-4 mr-2" />
                  응원 보내기
                </>
              )}
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
