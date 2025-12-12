/**
 * ShareButton Component Tests
 */

import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ShareButton } from '@/components/share/ShareButton';

// navigator.share mock
const mockShare = vi.fn();

describe('ShareButton', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Default: Web Share API not supported
    Object.defineProperty(navigator, 'share', {
      value: undefined,
      writable: true,
      configurable: true,
    });
    Object.defineProperty(navigator, 'canShare', {
      value: undefined,
      writable: true,
      configurable: true,
    });
  });

  describe('rendering', () => {
    it('renders button with test id', () => {
      const onShare = vi.fn();
      render(<ShareButton onShare={onShare} />);

      expect(screen.getByTestId('share-button')).toBeInTheDocument();
    });

    it('shows download text when Web Share API not supported', () => {
      const onShare = vi.fn();
      render(<ShareButton onShare={onShare} />);

      expect(screen.getByText(/이미지 저장/)).toBeInTheDocument();
    });

    it('shows share text when Web Share API supported', () => {
      Object.defineProperty(navigator, 'share', {
        value: mockShare,
        writable: true,
        configurable: true,
      });
      Object.defineProperty(navigator, 'canShare', {
        value: () => true,
        writable: true,
        configurable: true,
      });

      const onShare = vi.fn();
      render(<ShareButton onShare={onShare} />);

      expect(screen.getByText(/공유하기/)).toBeInTheDocument();
    });

    it('shows loading text when loading is true', () => {
      const onShare = vi.fn();
      render(<ShareButton onShare={onShare} loading={true} />);

      expect(screen.getByText(/준비 중/)).toBeInTheDocument();
    });
  });

  describe('interaction', () => {
    it('calls onShare when clicked', async () => {
      const onShare = vi.fn().mockResolvedValue(undefined);
      render(<ShareButton onShare={onShare} />);

      fireEvent.click(screen.getByTestId('share-button'));

      await waitFor(() => {
        expect(onShare).toHaveBeenCalledTimes(1);
      });
    });

    it('disables button when loading', () => {
      const onShare = vi.fn();
      render(<ShareButton onShare={onShare} loading={true} />);

      expect(screen.getByTestId('share-button')).toBeDisabled();
    });

    it('does not call onShare when disabled', () => {
      const onShare = vi.fn();
      render(<ShareButton onShare={onShare} loading={true} />);

      fireEvent.click(screen.getByTestId('share-button'));

      expect(onShare).not.toHaveBeenCalled();
    });
  });

  describe('variants', () => {
    it('renders with default variant', () => {
      const onShare = vi.fn();
      render(<ShareButton onShare={onShare} variant="default" />);

      expect(screen.getByTestId('share-button')).toBeInTheDocument();
    });

    it('renders with outline variant', () => {
      const onShare = vi.fn();
      render(<ShareButton onShare={onShare} variant="outline" />);

      expect(screen.getByTestId('share-button')).toBeInTheDocument();
    });

    it('renders with ghost variant', () => {
      const onShare = vi.fn();
      render(<ShareButton onShare={onShare} variant="ghost" />);

      expect(screen.getByTestId('share-button')).toBeInTheDocument();
    });
  });

  describe('sizes', () => {
    it('renders with default size', () => {
      const onShare = vi.fn();
      render(<ShareButton onShare={onShare} size="default" />);

      expect(screen.getByTestId('share-button')).toBeInTheDocument();
    });

    it('renders with sm size', () => {
      const onShare = vi.fn();
      render(<ShareButton onShare={onShare} size="sm" />);

      expect(screen.getByTestId('share-button')).toBeInTheDocument();
    });

    it('renders with lg size', () => {
      const onShare = vi.fn();
      render(<ShareButton onShare={onShare} size="lg" />);

      expect(screen.getByTestId('share-button')).toBeInTheDocument();
    });
  });

  describe('accessibility', () => {
    it('has aria-label for screen readers', () => {
      const onShare = vi.fn();
      render(<ShareButton onShare={onShare} />);

      expect(screen.getByLabelText(/결과 공유하기/)).toBeInTheDocument();
    });
  });

  describe('fullWidth option', () => {
    it('applies w-full class when fullWidth is true', () => {
      const onShare = vi.fn();
      render(<ShareButton onShare={onShare} fullWidth={true} />);

      const button = screen.getByTestId('share-button');
      expect(button.className).toContain('w-full');
    });

    it('does not apply w-full class when fullWidth is false', () => {
      const onShare = vi.fn();
      render(<ShareButton onShare={onShare} fullWidth={false} />);

      const button = screen.getByTestId('share-button');
      expect(button.className).not.toContain('w-full');
    });
  });
});
