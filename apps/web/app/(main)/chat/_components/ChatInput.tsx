'use client';

/**
 * 채팅 입력창 컴포넌트
 * - 텍스트 입력 + 음성 인식 지원
 */

import { useState, useRef, useEffect, KeyboardEvent } from 'react';
import { Send, Mic, MicOff } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { useVoiceRecognition } from '@/hooks/useVoiceRecognition';
import { cn } from '@/lib/utils';

interface ChatInputProps {
  onSend: (message: string) => void;
  disabled?: boolean;
  placeholder?: string;
}

export function ChatInput({
  onSend,
  disabled,
  placeholder = '메시지를 입력하세요...',
}: ChatInputProps) {
  const [message, setMessage] = useState('');
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const {
    transcript,
    finalTranscript,
    isListening,
    isSupported: voiceSupported,
    error: voiceError,
    startListening,
    stopListening,
    resetTranscript,
  } = useVoiceRecognition({
    lang: 'ko-KR',
    continuous: false,
    maxDuration: 30000,
  });

  // 음성 인식 결과를 textarea에 반영
  useEffect(() => {
    if (transcript) {
      setMessage(transcript);
    }
  }, [transcript]);

  // 음성 인식 완료 시 자동 전송
  useEffect(() => {
    if (finalTranscript && !isListening) {
      const trimmed = finalTranscript.trim();
      if (trimmed) {
        onSend(trimmed);
        setMessage('');
        resetTranscript();
      }
    }
  }, [finalTranscript, isListening, onSend, resetTranscript]);

  const handleSend = (): void => {
    const trimmed = message.trim();
    if (trimmed && !disabled) {
      onSend(trimmed);
      setMessage('');
      resetTranscript();
      // 높이 리셋
      if (textareaRef.current) {
        textareaRef.current.style.height = 'auto';
      }
    }
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>): void => {
    // Enter로 전송 (Shift+Enter는 줄바꿈)
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  // 자동 높이 조절
  const handleInput = (): void => {
    const textarea = textareaRef.current;
    if (textarea) {
      textarea.style.height = 'auto';
      textarea.style.height = `${Math.min(textarea.scrollHeight, 150)}px`;
    }
  };

  const handleVoiceToggle = (): void => {
    if (isListening) {
      stopListening();
    } else {
      resetTranscript();
      setMessage('');
      startListening();
    }
  };

  return (
    <div data-testid="chat-input" className="border-t p-4 bg-background">
      {/* 음성 인식 에러 */}
      {voiceError && <p className="text-xs text-destructive mb-2 text-center">{voiceError}</p>}

      <div className="flex items-end gap-2">
        {/* 음성 인식 버튼 (지원 브라우저만) */}
        {voiceSupported && (
          <Button
            onClick={handleVoiceToggle}
            disabled={disabled}
            size="icon"
            variant={isListening ? 'destructive' : 'outline'}
            className={cn('flex-shrink-0', isListening && 'animate-pulse')}
            aria-label={isListening ? '음성 인식 중지' : '음성으로 입력'}
          >
            {isListening ? <MicOff className="h-4 w-4" /> : <Mic className="h-4 w-4" />}
          </Button>
        )}

        <Textarea
          ref={textareaRef}
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          onKeyDown={handleKeyDown}
          onInput={handleInput}
          placeholder={isListening ? '듣고 있어요...' : placeholder}
          disabled={disabled || isListening}
          className="min-h-[44px] max-h-[150px] resize-none"
          rows={1}
        />
        <Button
          onClick={handleSend}
          disabled={disabled || !message.trim() || isListening}
          size="icon"
          className="flex-shrink-0"
        >
          <Send className="h-4 w-4" />
        </Button>
      </div>
      <p className="text-xs text-muted-foreground mt-2 text-center">
        AI 상담은 참고용이며, 의료 진단을 대체하지 않습니다
      </p>
    </div>
  );
}
