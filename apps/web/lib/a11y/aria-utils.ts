/**
 * ARIA 유틸리티 함수
 *
 * 분석 결과 컴포넌트용 접근성 유틸리티
 * - 라이브 리전 알림
 * - 고유 ID 생성
 * - ARIA 속성 헬퍼
 *
 * @see SDD-ACCESSIBILITY-GUIDELINES.md - A11Y-A2
 */

// 고유 ID 카운터 (SSR 호환)
let idCounter = 0;

/**
 * 고유한 ID 생성
 *
 * @param prefix - ID 접두사
 * @returns 고유 ID 문자열
 *
 * @example
 * generateId('result') // 'result-1'
 * generateId('result') // 'result-2'
 */
export function generateId(prefix: string): string {
  idCounter += 1;
  return `${prefix}-${idCounter}`;
}

/**
 * ID 카운터 리셋 (테스트용)
 */
export function resetIdCounter(): void {
  idCounter = 0;
}

/**
 * 라이브 리전에 메시지 알림
 * 스크린 리더가 즉시 읽어줄 메시지 전달
 *
 * @param message - 알림 메시지
 * @param priority - 'polite' (기본) 또는 'assertive' (긴급)
 *
 * @example
 * announce('분석이 완료되었습니다')
 * announce('오류가 발생했습니다', 'assertive')
 */
export function announce(
  message: string,
  priority: 'polite' | 'assertive' = 'polite'
): void {
  if (typeof document === 'undefined') return;

  // 기존 라이브 리전 찾기 또는 생성
  let liveRegion = document.getElementById(`a11y-live-${priority}`);

  if (!liveRegion) {
    liveRegion = document.createElement('div');
    liveRegion.id = `a11y-live-${priority}`;
    liveRegion.setAttribute('role', 'status');
    liveRegion.setAttribute('aria-live', priority);
    liveRegion.setAttribute('aria-atomic', 'true');
    // 시각적으로 숨기되 스크린 리더에는 노출
    liveRegion.className = 'sr-only';
    document.body.appendChild(liveRegion);
  }

  // 메시지 설정 (변경 감지를 위해 비우고 다시 설정)
  liveRegion.textContent = '';
  requestAnimationFrame(() => {
    liveRegion!.textContent = message;
  });
}

/**
 * 분석 완료 알림
 *
 * @param analysisType - 분석 타입
 * @param usedFallback - Mock 데이터 사용 여부
 */
export function announceAnalysisComplete(
  analysisType: string,
  usedFallback: boolean = false
): void {
  const typeLabels: Record<string, string> = {
    skin: '피부',
    'personal-color': '퍼스널컬러',
    body: '체형',
    hair: '헤어',
    makeup: '메이크업',
    nutrition: '영양',
    workout: '운동',
    'oral-health': '구강건강',
  };

  const typeLabel = typeLabels[analysisType] || analysisType;

  if (usedFallback) {
    announce(
      `${typeLabel} 분석 결과가 준비되었습니다. 현재 샘플 데이터를 표시하고 있습니다.`
    );
  } else {
    announce(`${typeLabel} 분석 결과가 준비되었습니다.`);
  }
}

/**
 * 분석 진행 상태 알림
 *
 * @param progress - 진행률 (0-100)
 * @param stage - 현재 단계 설명
 */
export function announceProgress(progress: number, stage?: string): void {
  if (stage) {
    announce(`분석 진행 중: ${stage} (${progress}% 완료)`);
  } else {
    announce(`분석 진행 중: ${progress}% 완료`);
  }
}

/**
 * 에러 알림 (긴급)
 *
 * @param message - 에러 메시지
 */
export function announceError(message: string): void {
  announce(message, 'assertive');
}

// ARIA 속성 타입
export interface AriaLabelledByProps {
  id: string;
  'aria-labelledby': string;
}

/**
 * aria-labelledby 관계 생성
 *
 * @param titleId - 제목 요소 ID
 * @returns ARIA 속성 객체
 *
 * @example
 * const { id, 'aria-labelledby': labelledBy } = createLabelledBy('result-title');
 * <h2 id={id}>제목</h2>
 * <div aria-labelledby={labelledBy}>내용</div>
 */
export function createLabelledBy(titleId: string): AriaLabelledByProps {
  return {
    id: titleId,
    'aria-labelledby': titleId,
  };
}

export interface AriaDescribedByProps {
  id: string;
  'aria-describedby': string;
}

/**
 * aria-describedby 관계 생성
 *
 * @param descriptionId - 설명 요소 ID
 * @returns ARIA 속성 객체
 */
export function createDescribedBy(descriptionId: string): AriaDescribedByProps {
  return {
    id: descriptionId,
    'aria-describedby': descriptionId,
  };
}

// 분석 결과 카드 ARIA 속성
export interface AnalysisCardAriaProps {
  role: 'article' | 'region';
  'aria-labelledby'?: string;
  'aria-label'?: string;
  'aria-busy'?: boolean;
  'data-testid': string;
}

/**
 * 분석 결과 카드 ARIA 속성 생성
 *
 * @param options - 옵션
 * @returns ARIA 속성 객체
 *
 * @example
 * const ariaProps = getAnalysisCardAriaProps({
 *   analysisType: 'skin',
 *   titleId: 'skin-result-title',
 *   isLoading: false,
 * });
 */
export function getAnalysisCardAriaProps(options: {
  analysisType: string;
  titleId?: string;
  hasTitle?: boolean;
  isLoading?: boolean;
}): AnalysisCardAriaProps {
  const { analysisType, titleId, hasTitle = false, isLoading = false } = options;

  const typeLabels: Record<string, string> = {
    skin: 'AI 피부 분석 결과',
    'personal-color': 'AI 퍼스널컬러 분석 결과',
    body: 'AI 체형 분석 결과',
    hair: 'AI 헤어 분석 결과',
    makeup: 'AI 메이크업 분석 결과',
    nutrition: 'AI 영양 분석 결과',
    workout: 'AI 운동 분석 결과',
    'oral-health': 'AI 구강건강 분석 결과',
  };

  const props: AnalysisCardAriaProps = {
    role: 'article',
    'data-testid': 'analysis-result-card',
  };

  if (hasTitle && titleId) {
    props['aria-labelledby'] = titleId;
  } else {
    props['aria-label'] = typeLabels[analysisType] || 'AI 분석 결과';
  }

  if (isLoading) {
    props['aria-busy'] = true;
  }

  return props;
}

// 신뢰도 레벨 정보
export interface ConfidenceLevelInfo {
  level: 'high' | 'medium' | 'low';
  label: string;
  description: string;
}

/**
 * 신뢰도 레벨 정보 가져오기
 *
 * @param confidence - 신뢰도 (0-100)
 * @returns 레벨 정보
 */
export function getConfidenceLevel(confidence: number): ConfidenceLevelInfo {
  if (confidence >= 80) {
    return {
      level: 'high',
      label: '높음',
      description: `분석 신뢰도가 높습니다 (${confidence}%)`,
    };
  }
  if (confidence >= 60) {
    return {
      level: 'medium',
      label: '중간',
      description: `분석 신뢰도가 중간입니다 (${confidence}%)`,
    };
  }
  return {
    level: 'low',
    label: '낮음',
    description: `분석 신뢰도가 낮습니다 (${confidence}%). 참고용으로 활용해주세요`,
  };
}

// 스크린 리더 전용 텍스트 클래스
export const SR_ONLY_CLASS = 'sr-only';

/**
 * 스크린 리더 전용 텍스트 컴포넌트용 props
 */
export function getSrOnlyProps(): { className: string } {
  return { className: SR_ONLY_CLASS };
}
