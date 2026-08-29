import { readFileSync } from 'node:fs';
import { join } from 'node:path';

const CAMERA_TO_RESULT = [
  ['app/(analysis)/personal-color/camera.tsx', 'app/(analysis)/personal-color/result.tsx'],
  ['app/(analysis)/skin/camera.tsx', 'app/(analysis)/skin/result.tsx'],
  ['app/(analysis)/hair/camera.tsx', 'app/(analysis)/hair/result.tsx'],
  ['app/(analysis)/makeup/camera.tsx', 'app/(analysis)/makeup/result.tsx'],
] as const;

function source(file: string): string {
  return readFileSync(join(process.cwd(), file), 'utf8');
}

describe('분석 이미지 라우팅 경계', () => {
  it.each(CAMERA_TO_RESULT)('%s는 URI만 넘기고 %s가 1024px로 축소한다', (camera, result) => {
    const cameraSource = source(camera);
    const resultSource = source(result);

    expect(cameraSource).not.toContain('base64: true');
    expect(cameraSource).not.toContain('imageBase64');
    expect(resultSource).toContain('downscaleToBase64(imageUri, 1024)');
    expect(resultSource).not.toMatch(/useLocalSearchParams<\{[^}]*imageBase64/s);
  });

  it('체형 입력도 원본 base64 없이 URI만 결과 화면으로 넘긴다', () => {
    const inputSource = source('app/(analysis)/body/index.tsx');
    const resultSource = source('app/(analysis)/body/result.tsx');

    expect(inputSource).not.toContain('base64: true');
    expect(inputSource).not.toContain('imageBase64');
    expect(resultSource).toContain('downscaleToBase64(imageUri, 1024)');
    expect(resultSource).not.toMatch(/useLocalSearchParams<\{[^}]*imageBase64/s);
  });

  it('숨김 자세 분석도 게이트는 유지한 채 같은 URI 경계를 지킨다', () => {
    const cameraSource = source('app/(analysis)/posture/camera.tsx');
    const resultSource = source('app/(analysis)/posture/result.tsx');

    expect(cameraSource).toContain('FEATURE_FLAGS.WELLNESS_PHASE2');
    expect(cameraSource).not.toContain('imageBase64');
    expect(resultSource).toContain('downscaleToBase64(imageUri, 1024)');
  });
});
