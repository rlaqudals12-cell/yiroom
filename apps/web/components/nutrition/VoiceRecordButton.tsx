'use client';

import { useState, useCallback } from 'react';
import { Mic, MicOff, Loader2 } from 'lucide-react';
import { useVoiceRecognition } from '@/hooks/useVoiceRecognition';
import type { MealType } from '@/lib/nutrition/voice-parser';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

export interface VoiceRecordButtonProps {
  mealType?: MealType;
  disabled?: boolean;
}

export default function VoiceRecordButton({
  mealType = 'lunch',
  disabled = false,
}: VoiceRecordButtonProps) {
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const {
    transcript,
    isListening,
    isSupported,
    startListening,
    stopListening,
    resetTranscript,
  } = useVoiceRecognition({
    lang: 'ko-KR',
    maxDuration: 10000,
  });

  const handleToggle = useCallback(async () => {
    if (isListening) {
      stopListening();

      if (transcript.length >= 2) {
        setIsProcessing(true);
        try {
          const res = await fetch('/api/nutrition/voice-record', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ transcript, mealType }),
          });
          const d = await res.json();
          if (!res.ok) {
            setError(d.message || 'error');
          }
        } catch {
          setError('network error');
        } finally {
          setIsProcessing(false);
        }
      }
      resetTranscript();
    } else {
      setError(null);
      resetTranscript();
      startListening();
    }
  }, [isListening, transcript, mealType, startListening, stopListening, resetTranscript]);

  // 음성 인식 미지원 시
  if (typeof window === 'object' && isSupported === false) {
    return (
      <Button
        variant="outline"
        size="icon"
        disabled
        className="w-12 h-12 rounded-full opacity-50"
        data-testid="voice-record-button-unsupported"
      >
        <MicOff className="w-5 h-5" />
      </Button>
    );
  }

  return (
    <>
      <Button
        variant={isListening ? 'destructive' : 'default'}
        size="icon"
        onClick={handleToggle}
        disabled={disabled || isProcessing}
        className={cn(
          'w-12 h-12 rounded-full',
          isListening && 'animate-pulse ring-2 ring-red-400'
        )}
        data-testid="voice-record-button"
      >
        {isProcessing ? (
          <Loader2 className="w-5 h-5 animate-spin" />
        ) : isListening ? (
          <MicOff className="w-5 h-5" />
        ) : (
          <Mic className="w-5 h-5" />
        )}
      </Button>

      {/* 녹음 중 실시간 텍스트 표시 */}
      {isListening && transcript && (
        <div className="fixed bottom-24 left-4 right-4 mx-auto max-w-sm bg-card border rounded-lg p-3 shadow-lg z-50">
          <p className="text-sm">{transcript}</p>
        </div>
      )}

      {/* 에러 메시지 */}
      {error && (
        <div className="fixed bottom-24 left-4 right-4 mx-auto max-w-sm bg-destructive/10 text-destructive p-3 rounded-lg z-50">
          <p className="text-sm">{error}</p>
        </div>
      )}
    </>
  );
}
