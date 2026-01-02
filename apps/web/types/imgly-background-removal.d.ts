/**
 * @imgly/background-removal 타입 선언
 * - 패키지 미설치 시에도 TypeScript 에러 방지
 * - 실제 사용 시에는 패키지 설치 필요
 */
declare module '@imgly/background-removal' {
  interface RemoveBackgroundOptions {
    model?: 'small' | 'medium' | 'large';
    output?: {
      format?: string;
      quality?: number;
    };
  }

  export function removeBackground(
    imageBlob: Blob,
    options?: RemoveBackgroundOptions
  ): Promise<Blob>;
}
