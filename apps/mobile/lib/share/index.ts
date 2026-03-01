/**
 * 공유 유틸리티 모듈
 *
 * React Native Share API 기반 텍스트/URL 공유
 *
 * @module lib/share
 */

import { Share, Platform } from 'react-native';

// ─── 타입 ────────────────────────────────────────────

export interface ShareContent {
  title?: string;
  message: string;
  url?: string;
}

export interface ShareResult {
  success: boolean;
  action: 'shared' | 'dismissed' | 'error';
  error?: string;
}

export type AnalysisType =
  | 'personal-color'
  | 'skin'
  | 'body'
  | 'hair'
  | 'makeup'
  | 'oral-health'
  | 'posture'
  | 'nail';

// ─── 기본 공유 ──────────────────────────────────────

/**
 * 텍스트/URL 공유
 */
export async function shareText(content: ShareContent): Promise<ShareResult> {
  try {
    const result = await Share.share(
      {
        title: content.title,
        message: content.url
          ? `${content.message}\n\n${content.url}`
          : content.message,
        ...(Platform.OS === 'ios' && content.url ? { url: content.url } : {}),
      },
      {
        dialogTitle: content.title ?? '공유하기',
      }
    );

    if (result.action === Share.sharedAction) {
      return { success: true, action: 'shared' };
    }
    return { success: false, action: 'dismissed' };
  } catch (error) {
    return {
      success: false,
      action: 'error',
      error: error instanceof Error ? error.message : '공유 실패',
    };
  }
}

// ─── 분석 결과 공유 ─────────────────────────────────

/**
 * 분석 결과 공유 메시지 생성
 */
export function createAnalysisShareMessage(
  analysisType: AnalysisType,
  result: Record<string, unknown>
): string {
  const typeLabels: Record<AnalysisType, string> = {
    'personal-color': '퍼스널컬러',
    skin: '피부',
    body: '체형',
    hair: '헤어',
    makeup: '메이크업',
    'oral-health': '구강건강',
    posture: '자세',
    nail: '네일',
  };

  const label = typeLabels[analysisType] ?? analysisType;
  const season = result.season as string | undefined;
  const skinType = result.skinType as string | undefined;
  const score = result.overallScore as number | undefined;

  let detail = '';
  if (season) detail = `결과: ${season}`;
  else if (skinType) detail = `결과: ${skinType}`;
  else if (score != null) detail = `점수: ${score}점`;

  return [
    `🪞 이룸에서 ${label} 분석을 받았어요!`,
    detail,
    '',
    '#이룸 #Yiroom #뷰티분석 #셀프케어',
  ]
    .filter(Boolean)
    .join('\n');
}

/**
 * 분석 결과 공유
 */
export async function shareAnalysisResult(
  analysisType: AnalysisType,
  result: Record<string, unknown>,
  appUrl?: string
): Promise<ShareResult> {
  const message = createAnalysisShareMessage(analysisType, result);

  return shareText({
    title: '이룸 분석 결과',
    message,
    url: appUrl,
  });
}

// ─── 해시태그 ───────────────────────────────────────

export const DEFAULT_HASHTAGS = ['이룸', 'Yiroom', '뷰티분석', '셀프케어'];

/**
 * 분석 타입별 해시태그
 */
export function getHashtagsForResult(analysisType: AnalysisType): string[] {
  const typeHashtags: Record<AnalysisType, string[]> = {
    'personal-color': ['퍼스널컬러', '컬러진단', '웜톤쿨톤'],
    skin: ['피부분석', '스킨케어', '피부고민'],
    body: ['체형분석', '바디라인', '체형관리'],
    hair: ['헤어분석', '헤어케어', '두피관리'],
    makeup: ['메이크업', '뷰티', '화장법'],
    'oral-health': ['구강건강', '치아관리', '건강검진'],
    posture: ['자세교정', '체형교정', '건강관리'],
    nail: ['네일케어', '네일아트', '손톱관리'],
  };

  return [...DEFAULT_HASHTAGS, ...(typeHashtags[analysisType] ?? [])];
}

// ─── 클립보드 ───────────────────────────────────────

/**
 * 클립보드에 텍스트 복사
 *
 * Expo Clipboard 또는 React Native Clipboard 사용 시
 * 이 함수를 래핑하여 사용
 */
export function formatForClipboard(content: ShareContent): string {
  const parts: string[] = [];
  if (content.title) parts.push(content.title);
  parts.push(content.message);
  if (content.url) parts.push(content.url);
  return parts.join('\n\n');
}
