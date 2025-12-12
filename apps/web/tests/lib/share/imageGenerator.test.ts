/**
 * imageGenerator Tests
 * html-to-image wrapper functions
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';

// html-to-image mock
vi.mock('html-to-image', () => ({
  toPng: vi.fn(),
}));

// fetch mock for blob conversion
const mockBlob = new Blob(['test'], { type: 'image/png' });
global.fetch = vi.fn().mockResolvedValue({
  blob: () => Promise.resolve(mockBlob),
});

describe('imageGenerator', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('captureElementAsImage', () => {
    it('should return blob for valid element', async () => {
      const { toPng } = await import('html-to-image');
      const mockToPng = vi.mocked(toPng);
      mockToPng.mockResolvedValue('data:image/png;base64,test');

      const { captureElementAsImage } = await import('@/lib/share/imageGenerator');

      const element = document.createElement('div');
      const result = await captureElementAsImage(element);

      expect(result).toBeInstanceOf(Blob);
      expect(mockToPng).toHaveBeenCalledWith(element, expect.objectContaining({
        quality: 0.95,
        pixelRatio: 2,
        cacheBust: true,
        backgroundColor: '#ffffff',
      }));
    });

    it('should use custom options when provided', async () => {
      const { toPng } = await import('html-to-image');
      const mockToPng = vi.mocked(toPng);
      mockToPng.mockResolvedValue('data:image/png;base64,test');

      const { captureElementAsImage } = await import('@/lib/share/imageGenerator');

      const element = document.createElement('div');
      await captureElementAsImage(element, {
        quality: 0.8,
        scale: 3,
        backgroundColor: '#000000',
      });

      expect(mockToPng).toHaveBeenCalledWith(element, expect.objectContaining({
        quality: 0.8,
        pixelRatio: 3,
        backgroundColor: '#000000',
      }));
    });

    it('should return null on error', async () => {
      const { toPng } = await import('html-to-image');
      const mockToPng = vi.mocked(toPng);
      mockToPng.mockRejectedValue(new Error('Capture failed'));

      const { captureElementAsImage } = await import('@/lib/share/imageGenerator');

      const element = document.createElement('div');
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      const result = await captureElementAsImage(element);

      expect(result).toBeNull();
      expect(consoleSpy).toHaveBeenCalled();

      consoleSpy.mockRestore();
    });
  });

  describe('captureElementAsDataUrl', () => {
    it('should return data URL for valid element', async () => {
      const { toPng } = await import('html-to-image');
      const mockToPng = vi.mocked(toPng);
      const expectedDataUrl = 'data:image/png;base64,testdata';
      mockToPng.mockResolvedValue(expectedDataUrl);

      const { captureElementAsDataUrl } = await import('@/lib/share/imageGenerator');

      const element = document.createElement('div');
      const result = await captureElementAsDataUrl(element);

      expect(result).toBe(expectedDataUrl);
      expect(mockToPng).toHaveBeenCalledWith(element, expect.objectContaining({
        quality: 0.95,
        pixelRatio: 2,
      }));
    });

    it('should return null on error', async () => {
      const { toPng } = await import('html-to-image');
      const mockToPng = vi.mocked(toPng);
      mockToPng.mockRejectedValue(new Error('Capture failed'));

      const { captureElementAsDataUrl } = await import('@/lib/share/imageGenerator');

      const element = document.createElement('div');
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      const result = await captureElementAsDataUrl(element);

      expect(result).toBeNull();
      expect(consoleSpy).toHaveBeenCalled();

      consoleSpy.mockRestore();
    });
  });
});
