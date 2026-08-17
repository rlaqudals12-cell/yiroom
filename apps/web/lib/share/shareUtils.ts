import { shareLogger } from '@/lib/utils/logger';

/**
 * 카드가 돌아다닐 때 "돌아올 길" — 공유의 유일한 존재 이유.
 *
 * 왜 필요한가: 이미지만 공유하면 클릭 가능한 링크가 없어 **공유 100건 = 유입 0건**이 된다
 * (바이럴 루프 단절). 카드에 구운 워터마크는 텍스트라 클릭이 안 된다.
 *
 * 도메인은 코드베이스 정본 패턴(`NEXT_PUBLIC_SITE_URL || yiroom.app` — kakao/qr/metadata와 동일).
 * `?ref=card`로 카드발 유입을 귀속한다.
 */
export const SHARE_LANDING_URL = `${process.env.NEXT_PUBLIC_SITE_URL || 'https://yiroom.app'}/?ref=card`;

/** 공유가 실제로 어떤 경로로 끝났는지 — 호출부가 정확히 고지하기 위한 결과 */
export interface ShareOutcome {
  /** 사용자에게 결과물이 전달됐는가 (공유 시트 완료 또는 파일 저장) */
  ok: boolean;
  /**
   * - `web-share`: OS 공유 시트로 넘어감 (고지 불필요 — 시트가 곧 피드백)
   * - `download`: 파일 저장 폴백 (데스크톱 등) — **반드시 고지 필요**
   * - `cancelled`: 사용자가 공유 시트를 닫음
   * - `failed`: 공유 실패
   */
  method: 'web-share' | 'download' | 'cancelled' | 'failed';
  /** 폴백에서 링크를 클립보드에 복사했는가 (복사했으면 반드시 알려야 한다) */
  linkCopied: boolean;
  /** 폴백에서 사용자에게 보여줄 링크 (복사 실패 시 수동 복사용) */
  link?: string;
}

/**
 * 이미지를 Web Share API로 공유하거나, 미지원 시 저장 + 링크 복사로 폴백한다.
 *
 * 왜 폴백에도 링크가 필요한가: 데스크톱 브라우저는 대부분 파일 공유(canShare({files}))를
 * 지원하지 않아 저장만 됐다. 그러면 카드에 클릭 가능한 링크가 없어 **공유 100건 = 유입 0건**
 * (SHARE_LANDING_URL 도입 취지가 데스크톱에서만 통째로 빠져 있었다).
 * 단, 클립보드는 사용자의 것이다 — 조용히 덮지 않고 호출부가 고지하도록 결과로 알린다.
 *
 * @param blob 공유할 이미지 Blob
 * @param title 공유 제목
 * @param text 공유 텍스트 (선택)
 * @param url 돌아올 링크 (선택) — 공유 시트의 url + text 양쪽에 실린다
 * @returns 공유 경로와 클립보드 복사 여부
 */
export async function shareImage(
  blob: Blob,
  title: string,
  text?: string,
  url?: string
): Promise<ShareOutcome> {
  const file = new File([blob], `${title}.png`, { type: 'image/png' });

  // Web Share API 지원 확인 (파일 공유 가능 여부)
  if (
    typeof navigator !== 'undefined' &&
    navigator.share &&
    navigator.canShare?.({ files: [file] })
  ) {
    try {
      const baseText = text || `${title} - 이룸에서 확인하세요!`;
      await navigator.share({
        title,
        // 링크를 text에도 싣는다 — files가 동반되면 url을 버리는 공유 타깃이 실재한다(유입 0 방지).
        // 링크 중복 노출의 손해보다 링크가 아예 없는 손해가 크다.
        text: url ? `${baseText}\n${url}` : baseText,
        ...(url ? { url } : {}),
        files: [file],
      });
      return { ok: true, method: 'web-share', linkCopied: false };
    } catch (error) {
      // 사용자가 취소한 경우는 에러로 처리하지 않음
      const aborted = (error as Error).name === 'AbortError';
      if (!aborted) {
        shareLogger.error('공유 실패:', error);
      }
      return { ok: false, method: aborted ? 'cancelled' : 'failed', linkCopied: false };
    }
  }

  // 폴백(파일 공유 미지원 — 데스크톱 대부분): 이미지 저장 + 돌아올 링크 복사
  return saveWithLink(blob, title, url);
}

/**
 * 파일 공유가 불가능할 때의 폴백 — 이미지를 저장하고 돌아올 링크를 클립보드에 복사한다.
 * 복사 성공 여부를 그대로 돌려줘, 호출부가 "링크도 복사했어요"라고 고지하거나
 * (복사 실패 시) 링크를 화면에 보여줄 수 있게 한다 — 조용한 클립보드 덮어쓰기 금지.
 */
async function saveWithLink(blob: Blob, title: string, url?: string): Promise<ShareOutcome> {
  downloadImage(blob, title);
  const linkCopied = url ? await copyToClipboard(url) : false;
  return { ok: true, method: 'download', linkCopied, ...(url ? { link: url } : {}) };
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
