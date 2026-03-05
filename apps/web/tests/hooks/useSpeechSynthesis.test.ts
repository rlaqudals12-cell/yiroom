/**
 * useSpeechSynthesis 훅 테스트
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useSpeechSynthesis } from '@/hooks/useSpeechSynthesis';

// speechSynthesis mock
const mockSpeak = vi.fn();
const mockCancel = vi.fn();
const mockGetVoices = vi.fn().mockReturnValue([]);

let utteranceHandlers: Record<string, (() => void) | null> = {};

class MockSpeechSynthesisUtterance {
  text: string;
  lang = '';
  rate = 1;
  pitch = 1;
  voice: SpeechSynthesisVoice | null = null;
  onstart: (() => void) | null = null;
  onend: (() => void) | null = null;
  onerror: (() => void) | null = null;

  constructor(text: string) {
    this.text = text;
    // 핸들러 참조 저장 (테스트에서 호출용)
    utteranceHandlers = {
      get onstart() {
        return this.onstart;
      },
      get onend() {
        return this.onend;
      },
      get onerror() {
        return this.onerror;
      },
    };
  }
}

// speak 호출 시 utterance 핸들러 캡처
mockSpeak.mockImplementation((utterance: MockSpeechSynthesisUtterance) => {
  utteranceHandlers = {
    onstart: utterance.onstart,
    onend: utterance.onend,
    onerror: utterance.onerror,
  };
});

describe('useSpeechSynthesis', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    utteranceHandlers = {};

    // window.speechSynthesis mock
    Object.defineProperty(window, 'speechSynthesis', {
      value: {
        speak: mockSpeak,
        cancel: mockCancel,
        getVoices: mockGetVoices,
      },
      writable: true,
      configurable: true,
    });

    // SpeechSynthesisUtterance mock
    Object.defineProperty(window, 'SpeechSynthesisUtterance', {
      value: MockSpeechSynthesisUtterance,
      writable: true,
      configurable: true,
    });
  });

  afterEach(() => {
    // clearAllMocks만 사용 (restoreAllMocks는 모듈 레벨 mock의 returnValue를 지움)
    vi.clearAllMocks();
  });

  it('브라우저 지원 시 isSupported=true', () => {
    const { result } = renderHook(() => useSpeechSynthesis());
    expect(result.current.isSupported).toBe(true);
  });

  it('초기 상태가 올바르다', () => {
    const { result } = renderHook(() => useSpeechSynthesis());
    expect(result.current.isSpeaking).toBe(false);
    expect(result.current.isSupported).toBe(true);
  });

  it('speak 호출 시 speechSynthesis.speak이 호출된다', () => {
    const { result } = renderHook(() => useSpeechSynthesis());

    act(() => {
      result.current.speak('안녕하세요');
    });

    expect(mockCancel).toHaveBeenCalled(); // 이전 재생 중지
    expect(mockSpeak).toHaveBeenCalledTimes(1);
  });

  it('빈 문자열은 speak하지 않는다', () => {
    const { result } = renderHook(() => useSpeechSynthesis());

    act(() => {
      result.current.speak('   ');
    });

    expect(mockSpeak).not.toHaveBeenCalled();
  });

  it('stop 호출 시 speechSynthesis.cancel이 호출된다', () => {
    const { result } = renderHook(() => useSpeechSynthesis());

    act(() => {
      result.current.stop();
    });

    expect(mockCancel).toHaveBeenCalled();
  });

  it('onstart 콜백 시 isSpeaking=true', () => {
    const { result } = renderHook(() => useSpeechSynthesis());

    act(() => {
      result.current.speak('테스트');
    });

    // onstart 트리거
    act(() => {
      utteranceHandlers.onstart?.();
    });

    expect(result.current.isSpeaking).toBe(true);
  });

  it('onend 콜백 시 isSpeaking=false', () => {
    const { result } = renderHook(() => useSpeechSynthesis());

    act(() => {
      result.current.speak('테스트');
    });

    act(() => {
      utteranceHandlers.onstart?.();
    });

    expect(result.current.isSpeaking).toBe(true);

    act(() => {
      utteranceHandlers.onend?.();
    });

    expect(result.current.isSpeaking).toBe(false);
  });

  it('onerror 콜백 시 isSpeaking=false', () => {
    const { result } = renderHook(() => useSpeechSynthesis());

    act(() => {
      result.current.speak('테스트');
    });

    act(() => {
      utteranceHandlers.onstart?.();
    });

    act(() => {
      utteranceHandlers.onerror?.();
    });

    expect(result.current.isSpeaking).toBe(false);
  });

  it('한국어 음성이 있으면 우선 선택한다', () => {
    const koreanVoice = { lang: 'ko-KR', name: 'Korean' } as SpeechSynthesisVoice;
    mockGetVoices.mockReturnValue([
      { lang: 'en-US', name: 'English' } as SpeechSynthesisVoice,
      koreanVoice,
    ]);

    const { result } = renderHook(() => useSpeechSynthesis());

    act(() => {
      result.current.speak('안녕하세요');
    });

    // utterance에 한국어 음성이 설정되었는지 확인
    const utterance = mockSpeak.mock.calls[0][0] as MockSpeechSynthesisUtterance;
    expect(utterance.voice).toBe(koreanVoice);
  });

  it('언마운트 시 speechSynthesis.cancel이 호출된다', () => {
    const { unmount } = renderHook(() => useSpeechSynthesis());

    unmount();

    expect(mockCancel).toHaveBeenCalled();
  });

  it('커스텀 옵션이 적용된다', () => {
    const { result } = renderHook(() =>
      useSpeechSynthesis({ lang: 'en-US', rate: 1.5, pitch: 0.8 })
    );

    act(() => {
      result.current.speak('Hello');
    });

    const utterance = mockSpeak.mock.calls[0][0] as MockSpeechSynthesisUtterance;
    expect(utterance.lang).toBe('en-US');
    expect(utterance.rate).toBe(1.5);
    expect(utterance.pitch).toBe(0.8);
  });
});

describe('useSpeechSynthesis - 미지원 브라우저', () => {
  it('speechSynthesis 없으면 isSupported=false', () => {
    // speechSynthesis를 falsy로 설정
    const original = window.speechSynthesis;
    Object.defineProperty(window, 'speechSynthesis', {
      value: null,
      writable: true,
      configurable: true,
    });

    const { result } = renderHook(() => useSpeechSynthesis());
    expect(result.current.isSupported).toBe(false);

    // 복원
    Object.defineProperty(window, 'speechSynthesis', {
      value: original,
      writable: true,
      configurable: true,
    });
  });
});
