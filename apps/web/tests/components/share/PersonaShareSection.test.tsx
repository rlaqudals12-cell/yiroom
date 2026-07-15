import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
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

  it('포맷 토글로 스토리(9:16)를 선택하면 카드 비율이 바뀐다', () => {
    render(<PersonaShareSection oneLine="한 줄" badges={BADGES} season="spring" />);
    expect(screen.getByTestId('persona-share-card').dataset.format).toBe('square');
    // next-intl 목이 t(key)=>key 반환 → 토글 라벨은 키로 클릭
    fireEvent.click(screen.getByText('shareCard.formatStory'));
    expect(screen.getByTestId('persona-share-card').dataset.format).toBe('story');
  });

  it('퍼스널컬러 팔레트를 카드에 전달해 스와치로 노출한다', () => {
    render(
      <PersonaShareSection
        oneLine="한 줄"
        badges={BADGES}
        season="spring"
        palette={['#FFB6C1', '#E6E6FA']}
      />
    );
    expect(screen.getByTestId('persona-share-swatches').children).toHaveLength(2);
  });
});

describe('PersonaShareSection — 유입 경로(바이럴 루프)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    URL.createObjectURL = vi.fn(() => 'blob:mock');
    URL.revokeObjectURL = vi.fn();
  });

  afterEach(() => {
    // navigator.share 정의가 "미지원 데스크톱" 가정 테스트로 새지 않게 정리
    Reflect.deleteProperty(navigator, 'share');
    Reflect.deleteProperty(navigator, 'canShare');
  });

  it('공유 페이로드에 돌아올 URL을 싣는다 (없으면 공유 100건 = 유입 0건)', async () => {
    mockCapture.mockResolvedValue(new Blob(['png'], { type: 'image/png' }));
    const shareSpy = vi.fn().mockResolvedValue(undefined);
    Object.defineProperty(navigator, 'share', { value: shareSpy, configurable: true });
    Object.defineProperty(navigator, 'canShare', { value: () => true, configurable: true });

    render(<PersonaShareSection oneLine="한 줄" badges={BADGES} season={null} />);
    fireEvent.click(screen.getByTestId('persona-share-native'));

    await waitFor(() => expect(shareSpy).toHaveBeenCalledTimes(1));
    const payload = shareSpy.mock.calls[0][0] as { url: string; text: string };

    // 카드발 유입 귀속
    expect(payload.url).toContain('?ref=card');
    // files 동반 시 url을 버리는 공유 타깃 대비 — text에도 링크가 남아야 한다
    expect(payload.text).toContain(payload.url);
  });
});
