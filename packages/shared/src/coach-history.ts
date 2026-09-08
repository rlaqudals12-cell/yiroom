/** 구배열 기록을 유지하면서 AI 폴백 출처를 JSONB에 함께 보존한다. */
export interface CoachResponseMetadata {
  usedFallback?: boolean;
  confidence?: 'normal' | 'low';
  fallbackReason?: 'model_unavailable' | 'timeout' | 'error';
}
export function encodeCoachHistory(
  questions?: string[],
  metadata?: CoachResponseMetadata
): unknown {
  if (!metadata) return questions ?? null;
  return {
    version: 1,
    questions: questions ?? [],
    usedFallback: metadata.usedFallback,
    confidence: metadata.confidence,
    fallbackReason: metadata.fallbackReason,
  };
}
export function decodeCoachHistory(
  value: unknown
): CoachResponseMetadata & { suggestedQuestions: string[] } {
  const record =
    value && typeof value === 'object' && !Array.isArray(value)
      ? (value as Record<string, unknown>)
      : {};
  const questions = Array.isArray(value) ? value : record.questions;
  return {
    suggestedQuestions: Array.isArray(questions)
      ? questions.filter((q): q is string => typeof q === 'string')
      : [],
    ...(typeof record.usedFallback === 'boolean' ? { usedFallback: record.usedFallback } : {}),
    ...(record.confidence === 'normal' || record.confidence === 'low'
      ? { confidence: record.confidence }
      : {}),
    ...(record.fallbackReason === 'model_unavailable' ||
    record.fallbackReason === 'timeout' ||
    record.fallbackReason === 'error'
      ? { fallbackReason: record.fallbackReason }
      : {}),
  };
}
