import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import VoiceRecordButton from '@/components/nutrition/VoiceRecordButton';

vi.mock('@/hooks/useVoiceRecognition', () => ({
  useVoiceRecognition: () => ({
    transcript: '',
    isListening: false,
    isSupported: true,
    startListening: vi.fn(),
    stopListening: vi.fn(),
    resetTranscript: vi.fn(),
  }),
}));

describe('VoiceRecordButton', () => {
  it('renders the button', () => {
    render(<VoiceRecordButton />);
    expect(screen.getByTestId('voice-record-button')).toBeInTheDocument();
  });
});
