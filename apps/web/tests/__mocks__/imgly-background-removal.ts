/**
 * @imgly/background-removal 모듈 mock
 *
 * 이 패키지는 선택적 의존성으로, 테스트 환경에서는 모킹됨
 */

export async function removeBackground(_blob: Blob): Promise<Blob> {
  // 간단한 빈 Blob 반환
  return new Blob(['mock'], { type: 'image/png' });
}

const imglyBackgroundRemovalMock = {
  removeBackground,
};

export default imglyBackgroundRemovalMock;
