/**
 * 이미지 품질 검증 모듈 테스트
 */

import {
  validateImageQuality,
  runCIEPipeline,
  getCaptureGuide,
  IMAGE_CONSTRAINTS,
  CAPTURE_GUIDES,
} from '../../lib/image-engine';

describe('image-engine', () => {
  describe('validateImageQuality', () => {
    it('정상 이미지 허용', () => {
      const result = validateImageQuality({
        width: 1024,
        height: 1024,
        fileSize: 500 * 1024,
        mimeType: 'image/jpeg',
        uri: 'file:///test.jpg',
      });

      expect(result.isAcceptable).toBe(true);
      expect(result.overallScore).toBeGreaterThanOrEqual(50);
    });

    it('해상도 너무 낮으면 거부', () => {
      const result = validateImageQuality({
        width: 100,
        height: 100,
        fileSize: 500 * 1024,
        mimeType: 'image/jpeg',
        uri: 'file:///small.jpg',
      });

      expect(result.resolution.isAcceptable).toBe(false);
      expect(result.tips.length).toBeGreaterThan(0);
    });

    it('파일 너무 크면 점수 감소', () => {
      const result = validateImageQuality({
        width: 1024,
        height: 1024,
        fileSize: 15 * 1024 * 1024,
        mimeType: 'image/jpeg',
        uri: 'file:///huge.jpg',
      });

      expect(result.fileSize.isAcceptable).toBe(false);
    });

    it('파일 너무 작으면 점수 감소', () => {
      const result = validateImageQuality({
        width: 1024,
        height: 1024,
        fileSize: 10 * 1024,
        mimeType: 'image/jpeg',
        uri: 'file:///tiny.jpg',
      });

      expect(result.fileSize.isAcceptable).toBe(false);
    });

    it('지원하지 않는 형식 거부', () => {
      const result = validateImageQuality({
        width: 1024,
        height: 1024,
        fileSize: 500 * 1024,
        mimeType: 'image/gif',
        uri: 'file:///test.gif',
      });

      expect(result.format.isAcceptable).toBe(false);
      expect(result.isAcceptable).toBe(false);
    });

    it('정상 이미지에도 팁 제공', () => {
      const result = validateImageQuality({
        width: 1024,
        height: 1024,
        fileSize: 500 * 1024,
        mimeType: 'image/jpeg',
        uri: 'file:///good.jpg',
      });

      expect(result.tips.length).toBeGreaterThan(0);
    });
  });

  describe('runCIEPipeline', () => {
    it('클라이언트만 CIE-1 스테이지 실행', () => {
      const result = runCIEPipeline({
        width: 1024,
        height: 1024,
        fileSize: 500 * 1024,
        mimeType: 'image/jpeg',
        uri: 'file:///test.jpg',
      });

      expect(result.stages.length).toBe(1);
      expect(result.stages[0].stage).toBe('cie1');
    });

    it('서버 결과 포함 시 CIE-2~4 추가', () => {
      const result = runCIEPipeline(
        {
          width: 1024,
          height: 1024,
          fileSize: 500 * 1024,
          mimeType: 'image/jpeg',
          uri: 'file:///test.jpg',
        },
        {
          faceDetected: true,
          faceScore: 90,
          lightingScore: 75,
          colorTempScore: 80,
        }
      );

      expect(result.stages.length).toBe(4);
      expect(result.stages[1].stage).toBe('cie2');
      expect(result.stages[2].stage).toBe('cie3');
      expect(result.stages[3].stage).toBe('cie4');
    });

    it('모든 스테이지 통과 시 success', () => {
      const result = runCIEPipeline(
        {
          width: 1024,
          height: 1024,
          fileSize: 500 * 1024,
          mimeType: 'image/jpeg',
          uri: 'file:///test.jpg',
        },
        {
          faceDetected: true,
          faceScore: 90,
          lightingScore: 75,
          colorTempScore: 80,
        }
      );

      expect(result.success).toBe(true);
      expect(result.overallScore).toBeGreaterThan(0);
    });

    it('얼굴 미감지 시 실패', () => {
      const result = runCIEPipeline(
        {
          width: 1024,
          height: 1024,
          fileSize: 500 * 1024,
          mimeType: 'image/jpeg',
          uri: 'file:///test.jpg',
        },
        {
          faceDetected: false,
          lightingScore: 75,
        }
      );

      expect(result.success).toBe(false);
    });
  });

  describe('getCaptureGuide', () => {
    it('퍼스널컬러 가이드 반환', () => {
      const guide = getCaptureGuide('personal-color');
      expect(guide.analysisType).toBe('퍼스널컬러');
      expect(guide.instructions.length).toBeGreaterThan(0);
      expect(guide.idealConditions.length).toBeGreaterThan(0);
    });

    it('피부 분석 가이드 반환', () => {
      const guide = getCaptureGuide('skin');
      expect(guide.analysisType).toBe('피부 분석');
    });

    it('알 수 없는 타입은 기본 가이드', () => {
      const guide = getCaptureGuide('unknown-type');
      expect(guide.instructions.length).toBeGreaterThan(0);
    });
  });

  describe('IMAGE_CONSTRAINTS 상수', () => {
    it('최소/최대 해상도 정의', () => {
      expect(IMAGE_CONSTRAINTS.minWidth).toBe(640);
      expect(IMAGE_CONSTRAINTS.maxWidth).toBe(4096);
    });

    it('파일 크기 제한 정의', () => {
      expect(IMAGE_CONSTRAINTS.maxFileSize).toBe(10 * 1024 * 1024);
    });

    it('허용 형식 3개', () => {
      expect(IMAGE_CONSTRAINTS.acceptedFormats.length).toBe(3);
    });
  });

  describe('CAPTURE_GUIDES 상수', () => {
    it('3개 분석 타입 가이드', () => {
      expect(Object.keys(CAPTURE_GUIDES).length).toBe(3);
    });
  });
});
