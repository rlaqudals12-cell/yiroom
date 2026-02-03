/**
 * 분석 결과 화면 공통 스타일
 *
 * body/result.tsx, personal-color/result.tsx, skin/result.tsx에서
 * 공통으로 사용하는 스타일 정의
 */
import { StyleSheet } from 'react-native';

/**
 * 공통 색상 상수
 */
export const ANALYSIS_COLORS = {
  primary: '#2e5afa',
  background: '#f8f9fc',
  backgroundDark: '#0a0a0a',
  cardBackground: '#fff',
  cardBackgroundDark: '#1a1a1a',
  textPrimary: '#111',
  textSecondary: '#666',
  textMuted: '#999',
  textLight: '#ffffff',
  border: '#ddd',
  // 신뢰도 배지 색상
  confidenceBackground: '#e8f5e9',
  confidenceText: '#2e7d32',
  fallbackBackground: '#fff3e0',
  fallbackText: '#ef6c00',
} as const;

/**
 * 공통 스타일
 */
export const commonAnalysisStyles = StyleSheet.create({
  // 컨테이너
  container: {
    flex: 1,
    backgroundColor: ANALYSIS_COLORS.background,
  },
  containerDark: {
    backgroundColor: ANALYSIS_COLORS.backgroundDark,
  },
  content: {
    padding: 20,
  },

  // 카드
  card: {
    backgroundColor: ANALYSIS_COLORS.cardBackground,
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
  },
  cardDark: {
    backgroundColor: ANALYSIS_COLORS.cardBackgroundDark,
  },

  // 섹션
  section: {
    backgroundColor: ANALYSIS_COLORS.cardBackground,
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: ANALYSIS_COLORS.textPrimary,
    marginBottom: 16,
  },

  // 텍스트 스타일
  textLight: {
    color: ANALYSIS_COLORS.textLight,
  },
  textMuted: {
    color: ANALYSIS_COLORS.textMuted,
  },
  description: {
    fontSize: 15,
    color: ANALYSIS_COLORS.textSecondary,
    lineHeight: 24,
    textAlign: 'center',
  },

  // 이미지 컨테이너
  imageContainer: {
    alignItems: 'center',
    marginBottom: 20,
  },
});

/**
 * 공통 버튼 스타일 (AnalysisResultButtons와 동일)
 */
export const buttonStyles = StyleSheet.create({
  buttons: {
    marginTop: 8,
    gap: 12,
  },
  primaryButton: {
    backgroundColor: ANALYSIS_COLORS.primary,
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
  },
  primaryButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  secondaryButton: {
    borderWidth: 1,
    borderColor: ANALYSIS_COLORS.border,
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
  },
  secondaryButtonText: {
    color: ANALYSIS_COLORS.textSecondary,
    fontSize: 16,
  },
  retryLink: {
    alignItems: 'center',
    paddingVertical: 8,
  },
  retryLinkText: {
    color: ANALYSIS_COLORS.textMuted,
    fontSize: 14,
    textDecorationLine: 'underline',
  },
});

/**
 * 신뢰도 배지 스타일
 */
export const badgeStyles = StyleSheet.create({
  confidenceBadge: {
    backgroundColor: ANALYSIS_COLORS.confidenceBackground,
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
    marginBottom: 12,
    alignSelf: 'center',
  },
  confidenceBadgeText: {
    color: ANALYSIS_COLORS.confidenceText,
    fontSize: 12,
    fontWeight: '500',
  },
  fallbackBadge: {
    backgroundColor: ANALYSIS_COLORS.fallbackBackground,
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
    marginBottom: 12,
    alignSelf: 'center',
  },
  fallbackBadgeText: {
    color: ANALYSIS_COLORS.fallbackText,
    fontSize: 12,
    fontWeight: '500',
  },
});
