'use client';

import { useState, useCallback, useEffect, useRef } from 'react';

interface SpeechRecognitionEvent extends Event {
  results: SpeechRecognitionResultList;
  resultIndex: number;
}

interface SpeechRecognitionErrorEvent extends Event {
  error: string;
  message?: string;
}

interface SpeechRecognition extends EventTarget {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  start(): void;
  stop(): void;
  abort(): void;
  onresult: ((event: SpeechRecognitionEvent) => void) | null;
  onerror: ((event: SpeechRecognitionErrorEvent) => void) | null;
  onend: (() => void) | null;
  onstart: (() => void) | null;
}

interface SpeechRecognitionConstructor {
  new (): SpeechRecognition;
}

declare global {
  interface Window {
    SpeechRecognition?: SpeechRecognitionConstructor;
    webkitSpeechRecognition?: SpeechRecognitionConstructor;
  }
}

export interface UseVoiceRecognitionOptions {
  lang?: string;
  continuous?: boolean;
  interimResults?: boolean;
  maxDuration?: number;
  onResult?: (transcript: string) => void;
  onError?: (error: string) => void;
}

export interface UseVoiceRecognitionReturn {
  transcript: string;
  finalTranscript: string;
  isListening: boolean;
  isSupported: boolean;
  error: string | null;
  startListening: () => void;
  stopListening: () => void;
  resetTranscript: () => void;
}

export function useVoiceRecognition(
  options: UseVoiceRecognitionOptions = {}
): UseVoiceRecognitionReturn {
  const {
    lang = "ko-KR",
    continuous = false,
    interimResults = true,
    maxDuration = 30000,
    onResult,
    onError,
  } = options;

  const [transcript, setTranscript] = useState("");
  const [finalTranscript, setFinalTranscript] = useState("");
  const [isListening, setIsListening] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isSupported, setIsSupported] = useState(false);

  const recognitionRef = useRef<SpeechRecognition | null>(null);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    const SpeechRecognitionAPI =
      typeof window !== "undefined"
        ? window.SpeechRecognition || window.webkitSpeechRecognition
        : null;

    setIsSupported(!!SpeechRecognitionAPI);

    if (SpeechRecognitionAPI) {
      const recognition = new SpeechRecognitionAPI();
      recognition.lang = lang;
      recognition.continuous = continuous;
      recognition.interimResults = interimResults;

      recognition.onresult = (event: SpeechRecognitionEvent) => {
        let interimText = "";
        let finalText = "";

        for (let i = event.resultIndex; i < event.results.length; i++) {
          const result = event.results[i];
          if (result.isFinal) {
            finalText += result[0].transcript;
          } else {
            interimText += result[0].transcript;
          }
        }

        if (finalText) {
          setFinalTranscript((prev) => prev + finalText);
          setTranscript((prev) => prev + finalText);
          onResult?.(finalText);
        } else {
          setTranscript(finalTranscript + interimText);
        }
      };

      recognition.onerror = (event: SpeechRecognitionErrorEvent) => {
        const errorMessage = getErrorMessage(event.error);
        setError(errorMessage);
        setIsListening(false);
        onError?.(errorMessage);
      };

      recognition.onend = () => {
        setIsListening(false);
        if (timeoutRef.current) {
          clearTimeout(timeoutRef.current);
          timeoutRef.current = null;
        }
      };

      recognition.onstart = () => {
        setIsListening(true);
        setError(null);
      };

      recognitionRef.current = recognition;
    }

    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.abort();
      }
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [lang, continuous, interimResults, finalTranscript, onResult, onError]);

  const startListening = useCallback(() => {
    if (!recognitionRef.current) {
      setError("음성 인식이 지원되지 않는 브라우저입니다");
      return;
    }

    setError(null);
    setTranscript("");
    setFinalTranscript("");

    try {
      recognitionRef.current.start();

      timeoutRef.current = setTimeout(() => {
        if (recognitionRef.current && isListening) {
          recognitionRef.current.stop();
        }
      }, maxDuration);
    } catch (err) {
      console.warn("[VoiceRecognition] Start error:", err);
    }
  }, [maxDuration, isListening]);

  const stopListening = useCallback(() => {
    if (recognitionRef.current) {
      recognitionRef.current.stop();
    }
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
  }, []);

  const resetTranscript = useCallback(() => {
    setTranscript("");
    setFinalTranscript("");
    setError(null);
  }, []);

  return {
    transcript,
    finalTranscript,
    isListening,
    isSupported,
    error,
    startListening,
    stopListening,
    resetTranscript,
  };
}

function getErrorMessage(errorCode: string): string {
  switch (errorCode) {
    case "no-speech":
      return "음성이 감지되지 않았습니다. 다시 시도해주세요.";
    case "audio-capture":
      return "마이크를 찾을 수 없습니다. 마이크 연결을 확인해주세요.";
    case "not-allowed":
      return "마이크 권한이 거부되었습니다. 설정에서 권한을 허용해주세요.";
    case "network":
      return "네트워크 오류가 발생했습니다. 인터넷 연결을 확인해주세요.";
    case "aborted":
      return "음성 인식이 취소되었습니다.";
    case "service-not-allowed":
      return "음성 인식 서비스를 사용할 수 없습니다.";
    default:
      return "음성 인식 오류: " + errorCode;
  }
}

export default useVoiceRecognition;
