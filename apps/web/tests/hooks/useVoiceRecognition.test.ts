import { describe, it, expect } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useVoiceRecognition } from '@/hooks/useVoiceRecognition';

describe('useVoiceRecognition', () => {
  // jsdom에는 SpeechRecognition API가 없으므로 미지원 상태 테스트

  it('초기 상태가 올바르다', () => {
    const { result } = renderHook(() => useVoiceRecognition());
    expect(result.current.transcript).toBe('');
    expect(result.current.finalTranscript).toBe('');
    expect(result.current.isListening).toBe(false);
    expect(result.current.error).toBeNull();
  });

  it('jsdom에서는 isSupported가 false이다', () => {
    const { result } = renderHook(() => useVoiceRecognition());
    expect(result.current.isSupported).toBe(false);
  });

  it('미지원 환경에서 startListening 시 에러를 설정한다', () => {
    const { result } = renderHook(() => useVoiceRecognition());

    act(() => {
      result.current.startListening();
    });

    expect(result.current.error).toBe('음성 인식이 지원되지 않는 브라우저입니다');
  });

  it('stopListening이 에러 없이 동작한다', () => {
    const { result } = renderHook(() => useVoiceRecognition());

    act(() => {
      result.current.stopListening();
    });

    expect(result.current.isListening).toBe(false);
  });

  it('resetTranscript가 상태를 초기화한다', () => {
    const { result } = renderHook(() => useVoiceRecognition());

    // startListening으로 에러 설정 후 리셋
    act(() => {
      result.current.startListening();
    });
    expect(result.current.error).not.toBeNull();

    act(() => {
      result.current.resetTranscript();
    });

    expect(result.current.transcript).toBe('');
    expect(result.current.finalTranscript).toBe('');
    expect(result.current.error).toBeNull();
  });

  it('옵션 기본값이 적용된다', () => {
    const { result } = renderHook(() => useVoiceRecognition({ lang: 'en-US', continuous: true }));
    // 옵션이 에러 없이 전달됨
    expect(result.current.isSupported).toBe(false);
  });
});
