import type { AbstractIntlMessages } from 'next-intl';

/** 클라이언트 훅(useTranslations)이 실제로 소비하는 최상위 카탈로그만 직렬화한다. */
export const CLIENT_MESSAGE_NAMESPACES = [
  'analysis',
  'analysisEntry',
  'analysisType',
  'beauty',
  'coach',
  'common',
  'completeProfile',
  'gamificationUI',
  'home',
  'landing',
  'nav',
  'nutritionOnboarding',
  'nutritionUI',
  'productsUI',
  'reportsUI',
  'settingsUI',
  'share',
  'skinAnalysisUI',
  'skinUI',
  'smartMatchingUI',
  'stylingUI',
  'visualAnalysisUI',
  'workoutOnboarding',
  'workoutUI',
] as const;

export function pickClientMessages(messages: AbstractIntlMessages): AbstractIntlMessages {
  const picked: AbstractIntlMessages = {};

  for (const namespace of CLIENT_MESSAGE_NAMESPACES) {
    const catalog = messages[namespace];
    if (catalog !== undefined) picked[namespace] = catalog;
  }

  return picked;
}
