import { shareLogger } from '@/lib/utils/logger';

/**
 * 이미지를 Web Share API로 공유하거나 다운로드
 * @param blob 공유할 이미지 Blob
 * @param title 공유 제목
 * @param text 공유 텍스트 (선택)
 * @returns 공유 성공 여부
 */
export async function shareImage(blob: Blob, title: string, text?: string): Promise<boolean> {
  const file = new File([blob], `${title}.png`, { type: 'image/png' });

  // Web Share API 지원 확인 (파일 공유 가능 여부)
  if (
    typeof navigator !== 'undefined' &&
    navigator.share &&
    navigator.canShare?.({ files: [file] })
  ) {
    try {
      await navigator.share({
        title,
        text: text || `${title} - 이룸에서 확인하세요!`,
        files: [file],
      });
      return true;
    } catch (error) {
      // 사용자가 취소한 경우는 에러로 처리하지 않음
      if ((error as Error).name !== 'AbortError') {
        shareLogger.error('공유 실패:', error);
      }
      return false;
    }
  }

  // 폴백: 이미지 다운로드
  downloadImage(blob, title);
  return true;
}

/**
 * 이미지를 다운로드
 * @param blob 다운로드할 이미지 Blob
 * @param filename 파일명 (확장자 제외)
 */
export function downloadImage(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `${filename}.png`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/**
 * Web Share API 지원 여부 확인
 * @returns 파일 공유 지원 여부
 */
export function canShareFiles(): boolean {
  if (typeof navigator === 'undefined') return false;
  if (!navigator.share) return false;

  // 테스트용 더미 파일로 canShare 확인
  try {
    const testFile = new File([''], 'test.png', { type: 'image/png' });
    return navigator.canShare?.({ files: [testFile] }) ?? false;
  } catch {
    return false;
  }
}

/**
 * 텍스트만 공유 (파일 없이)
 * @param title 제목
 * @param text 텍스트
 * @param url URL
 * @returns 공유 성공 여부
 */
export async function shareText(title: string, text: string, url?: string): Promise<boolean> {
  if (typeof navigator === 'undefined' || !navigator.share) {
    // 폴백: 클립보드에 복사
    await copyToClipboard(url || text);
    return true;
  }

  try {
    await navigator.share({
      title,
      text,
      url,
    });
    return true;
  } catch (error) {
    if ((error as Error).name !== 'AbortError') {
      shareLogger.error('텍스트 공유 실패:', error);
    }
    return false;
  }
}

/**
 * 클립보드에 텍스트 복사
 * @param text 복사할 텍스트
 */
export async function copyToClipboard(text: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    // 폴백: execCommand 사용
    const textarea = document.createElement('textarea');
    textarea.value = text;
    textarea.style.position = 'fixed';
    textarea.style.left = '-9999px';
    document.body.appendChild(textarea);
    textarea.select();
    const success = document.execCommand('copy');
    document.body.removeChild(textarea);
    return success;
  }
}
