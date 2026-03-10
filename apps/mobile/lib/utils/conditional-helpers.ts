/**
 * 중첩 조건문 제거를 위한 유틸리티 함수
 *
 * @description 366건의 sonarjs/no-nested-conditional 경고를 근본적으로 해결하기 위한
 * 공통 패턴 추상화. 7가지 반복 패턴을 함수로 추출하여 코드 가독성과 유지보수성 향상.
 *
 * @see docs/plans/sharded-baking-music.md Phase 1-6
 */

// ============================================
// 1. 범위 기반 분류 (Range Classification)
// ============================================

/**
 * 숫자 값을 범위에 따라 분류
 *
 * @example
 * classifyByRange(75, [
 *   { max: 30, result: 'low' },
 *   { max: 60, result: 'medium' },
 *   { result: 'high' },  // default (no max)
 * ])
 * // → 'high'
 */
export function classifyByRange<T>(
  value: number,
  ranges: ReadonlyArray<{ readonly min?: number; readonly max?: number; readonly result: T }>,
  defaultResult?: T
): T | undefined {
  for (const range of ranges) {
    const aboveMin = range.min === undefined || value >= range.min;
    const belowMax = range.max === undefined || value < range.max;
    if (aboveMin && belowMax) return range.result;
  }
  return defaultResult;
}

// ============================================
// 2. 열거형 매핑 (Enum Mapping)
// ============================================

/**
 * 키 값에 따라 매핑된 결과를 반환
 *
 * @example
 * selectByKey('improving', {
 *   improving: TrendingUp,
 *   declining: TrendingDown,
 *   stable: Minus,
 * })
 * // → TrendingUp
 */
export function selectByKey<K extends string | number, V>(
  key: K | null | undefined,
  map: Partial<Record<K, V>>,
  defaultValue?: V
): V | undefined {
  if (key == null) return defaultValue;
  return map[key] ?? defaultValue;
}

// ============================================
// 3. 트렌드 표시 (Trend Display)
// ============================================

export type TrendDirection = 'up' | 'down' | 'neutral';

/**
 * 숫자 변화값에서 트렌드 방향 결정
 */
export function getTrendDirection(change: number, threshold: number = 0): TrendDirection {
  if (change > threshold) return 'up';
  if (change < -threshold) return 'down';
  return 'neutral';
}

/**
 * 트렌드 방향에 따른 텍스트 색상 클래스
 */
export function getTrendColorClass(
  direction: TrendDirection,
  options?: { inverted?: boolean }
): string {
  const positiveColor = 'text-green-600';
  const negativeColor = 'text-red-600';
  const neutralColor = 'text-muted-foreground';

  if (direction === 'neutral') return neutralColor;

  if (options?.inverted) {
    return direction === 'up' ? negativeColor : positiveColor;
  }
  return direction === 'up' ? positiveColor : negativeColor;
}

// ============================================
// 4. 상태 기반 스타일 (Status Styling)
// ============================================

/**
 * 상태 키에 따른 CSS 클래스 매핑
 *
 * @example
 * mapToClass('A', {
 *   A: 'bg-green-100 text-green-700',
 *   B: 'bg-blue-100 text-blue-700',
 *   C: 'bg-yellow-100 text-yellow-700',
 * }, 'bg-gray-100 text-gray-700')
 */
export function mapToClass<K extends string | number>(
  key: K | null | undefined,
  classMap: Partial<Record<K, string>>,
  defaultClass: string = ''
): string {
  if (key == null) return defaultClass;
  return classMap[key] ?? defaultClass;
}

// ============================================
// 5. 임팩트 평가 (Impact Assessment)
// ============================================

export type ImpactLevel = 'positive' | 'negative' | 'neutral';

/**
 * 점수를 임팩트 레벨로 변환
 *
 * @example
 * assessImpact(75, { positiveMin: 60, negativeMax: 30 })
 * // → 'positive'
 */
export function assessImpact(
  value: number,
  thresholds: { positiveMin: number; negativeMax: number }
): ImpactLevel {
  if (value >= thresholds.positiveMin) return 'positive';
  if (value <= thresholds.negativeMax) return 'negative';
  return 'neutral';
}

// ============================================
// 6. 타입별 데이터 매핑 (Type-to-Data Mapping)
// ============================================

/**
 * 타입 키에 따라 데이터 매핑 + 기본값 병합
 *
 * @example
 * mapTypeToData('S', {
 *   S: { shoulderLine: 'angular', silhouette: 'I' },
 *   W: { shoulderLine: 'rounded', silhouette: 'S' },
 *   N: { shoulderLine: 'wide', silhouette: 'H' },
 * }, { boneStructure: 'medium' })
 */
export function mapTypeToData<T extends Record<string, unknown>, K extends string>(
  type: K,
  mapping: Partial<Record<K, Partial<T>>>,
  defaults?: Partial<T>
): Partial<T> {
  const typeData = mapping[type] ?? {};
  return { ...defaults, ...typeData } as Partial<T>;
}

// ============================================
// 7. 조건부 텍스트 선택 (Conditional Text)
// ============================================

/**
 * 언어 코드에 따른 텍스트 선택
 *
 * @example
 * selectText('ko', { ko: '분석 완료', en: 'Analysis Complete' })
 * // → '분석 완료'
 */
export function selectText<L extends string>(lang: L, texts: Record<L, string>): string {
  return texts[lang] ?? (Object.values(texts)[0] as string);
}

/**
 * boolean 조건에 따른 값 선택 (3-way)
 * null/undefined 시 neutral 반환
 *
 * @example
 * selectByCondition(true, '개선 중', '변화 감지', '유지 중')
 * // → '개선 중'
 */
export function selectByCondition<T>(
  condition: boolean | null | undefined,
  trueValue: T,
  falseValue: T,
  neutralValue?: T
): T {
  if (condition === null || condition === undefined) return neutralValue ?? falseValue;
  return condition ? trueValue : falseValue;
}
