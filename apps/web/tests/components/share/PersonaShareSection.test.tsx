import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { PersonaShareSection } from '@/app/(main)/analysis/integrated/result/[sessionId]/_components/PersonaShareSection';

// 이미지 캡처 mock — jsdom에는 html-to-image 렌더 파이프라인이 없다
const mockCapture = vi.fn();
vi.mock('@/lib/share/imageGenerator', () => ({
  captureElementAsImage: (...args: unknown[]) => mockCapture(...args),
}));

const mockTrack = vi.fn();
vi.mock('@vercel/analytics', () => ({
  track: (...args: unknown[]) => mockTrack(...args),
}));

const BADGES = [{ label: '피부', value: '복합성' }];

describe('PersonaShareSection — 저장/공유 동작', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // jsdom에 없는 API 보강
    URL.createObjectURL = vi.fn(() => 'blob:mock');
    URL.revokeObjectURL = vi.fn();
  });

  it('카드 미리보기가 인라인으로 바로 노출된다 (발견성)', () => {
    render(<PersonaShareSection oneLine="차분한 빛을 품은 사람" badges={BADGES} season="spring" />);
    expect(screen.getByTestId('persona-share-card')).toBeInTheDocument();
    expect(screen.getByTestId('persona-share-download')).toBeInTheDocument();
  });

  it('이미지 저장 클릭 시 캡처→다운로드→계측이 일어난다', async () => {
    mockCapture.mockResolvedValue(new Blob(['png'], { type: 'image/png' }));
    render(<PersonaShareSection oneLine="한 줄" badges={BADGES} season={null} />);

    fireEvent.click(screen.getByTestId('persona-share-download'));

    await waitFor(() => {
      expect(mockCapture).toHaveBeenCalledTimes(1);
      expect(mockTrack).toHaveBeenCalledWith('persona_card_share', { method: 'download' });
    });
    // i18n 배선 후 next-intl 목이 t(key)=>key 반환 → 성공 메시지는 키로 검증
    expect(screen.getByTestId('persona-share-message')).toHaveTextContent('shareCard.saved');
  });

  it('캡처 실패 시 정직한 실패 안내를 보여준다 (조용한 무반응 금지)', async () => {
    mockCapture.mockResolvedValue(null);
    render(<PersonaShareSection oneLine="한 줄" badges={BADGES} season={null} />);

    fireEvent.click(screen.getByTestId('persona-share-download'));

    await waitFor(() => {
      expect(screen.getByTestId('persona-share-message')).toHaveTextContent('shareCard.imageError');
    });
    expect(mockTrack).not.toHaveBeenCalled();
  });

  it('navigator.share 미지원 데스크톱에서는 공유 버튼을 숨긴다 (거짓 버튼 금지)', () => {
    render(<PersonaShareSection oneLine="한 줄" badges={BADGES} season={null} />);
    expect(screen.queryByTestId('persona-share-native')).toBeNull();
  });
});
