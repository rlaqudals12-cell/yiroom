/**
 * 직전 제출 이미지 인메모리 캐시 테스트
 *
 * @see lib/integrated/last-submission.ts
 */

import {
  rememberSubmission,
  getLastSubmission,
  clearLastSubmission,
} from '@/lib/integrated/last-submission';

describe('last-submission (인메모리 캐시)', () => {
  afterEach(() => {
    clearLastSubmission();
  });

  it('기억한 얼굴·전신 이미지를 그대로 반환', () => {
    rememberSubmission('data:image/jpeg;base64,FACE', 'data:image/jpeg;base64,BODY');
    expect(getLastSubmission()).toEqual({
      faceImageBase64: 'data:image/jpeg;base64,FACE',
      bodyImageBase64: 'data:image/jpeg;base64,BODY',
    });
  });

  it('전신 이미지 없이 얼굴만 기억(null 유지)', () => {
    rememberSubmission('data:image/jpeg;base64,FACE', null);
    expect(getLastSubmission()).toEqual({
      faceImageBase64: 'data:image/jpeg;base64,FACE',
      bodyImageBase64: null,
    });
  });

  it('초기 상태·clear 후에는 null', () => {
    clearLastSubmission();
    expect(getLastSubmission()).toBeNull();

    rememberSubmission('data:image/jpeg;base64,FACE', null);
    clearLastSubmission();
    expect(getLastSubmission()).toBeNull();
  });

  it('가장 최근 제출로 덮어쓴다', () => {
    rememberSubmission('data:image/jpeg;base64,OLD', null);
    rememberSubmission('data:image/jpeg;base64,NEW', null);
    expect(getLastSubmission()?.faceImageBase64).toBe('data:image/jpeg;base64,NEW');
  });
});
