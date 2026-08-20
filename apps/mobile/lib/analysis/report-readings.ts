/**
 * 진단 지표 원값을 방향성 등급 없이 평문으로 표시한다.
 * 변화량은 좋음/나쁨으로 해석하지 않고 이전 측정과의 산술 차이만 남긴다.
 */
export function formatReportReading(
  value: number | string,
  delta?: number | null,
  unit = ''
): string {
  const reading = `${value}${unit}`;
  if (delta === undefined || delta === null || delta === 0) return reading;

  return `${reading} · 이전보다 ${delta > 0 ? '+' : ''}${delta}`;
}
