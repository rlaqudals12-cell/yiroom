import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';

// Mock lucide-react icons
vi.mock('lucide-react', async (importOriginal) => {
  const actual = await importOriginal<typeof import('lucide-react')>();
  const MockIcon = ({ className }: { className?: string }) => (
    <span className={className} data-testid="mock-icon" />
  );
  return {
    ...actual,
    Mic: MockIcon,
    MicOff: MockIcon,
    X: MockIcon,
    Check: MockIcon,
    Loader2: MockIcon,
  };
});

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
