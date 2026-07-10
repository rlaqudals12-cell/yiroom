/**
 * 이미지 다운스케일 유틸 검증 (적대적 리뷰 4)
 *
 * 전송 전 1024px 리사이즈 + JPEG 압축으로 base64/data URL을 만드는지 단언.
 * (원본 해상도 base64 → 수 MB JSON 바디 → 메모리/413 위험 해소)
 */

const mockManipulate = jest.fn();
jest.mock('expo-image-manipulator', () => ({
  manipulateAsync: (...args: unknown[]) => mockManipulate(...args),
  SaveFormat: { JPEG: 'jpeg', PNG: 'png' },
}));

import { downscaleToBase64, downscaleToDataUrl } from '@/lib/image/downscale';

describe('downscaleToBase64', () => {
  beforeEach(() => {
    mockManipulate.mockReset();
    mockManipulate.mockResolvedValue({ uri: 'file://out.jpg', base64: 'BASE64DATA' });
  });

  it('1024px 리사이즈 + 0.8 압축 + JPEG base64로 manipulateAsync를 호출한다', async () => {
    const result = await downscaleToBase64('file://in.jpg');
    expect(mockManipulate).toHaveBeenCalledWith(
      'file://in.jpg',
      [{ resize: { width: 1024 } }],
      expect.objectContaining({ compress: 0.8, base64: true, format: 'jpeg' })
    );
    expect(result).toBe('BASE64DATA');
  });

  it('maxWidth 오버라이드를 리사이즈 폭으로 전달한다', async () => {
    await downscaleToBase64('file://in.jpg', 512);
    expect(mockManipulate).toHaveBeenCalledWith(
      'file://in.jpg',
      [{ resize: { width: 512 } }],
      expect.any(Object)
    );
  });

  it('base64가 없으면 빈 문자열을 반환한다', async () => {
    mockManipulate.mockResolvedValue({ uri: 'file://out.jpg' });
    expect(await downscaleToBase64('file://in.jpg')).toBe('');
  });
});

describe('downscaleToDataUrl', () => {
  beforeEach(() => {
    mockManipulate.mockReset();
    mockManipulate.mockResolvedValue({ uri: 'file://out.jpg', base64: 'BASE64DATA' });
  });

  it('data:image/jpeg;base64, 접두를 붙인 data URL을 반환한다', async () => {
    expect(await downscaleToDataUrl('file://in.jpg')).toBe('data:image/jpeg;base64,BASE64DATA');
  });
});
