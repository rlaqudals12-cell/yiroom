/**
 * 스크린리더 호환성 유틸리티
 *
 * 스크린리더(VoiceOver, NVDA, JAWS)와의 호환성을 위한 유틸리티 함수
 *
 * WCAG 2.1 AA 준수:
 * - 1.3.1: 정보와 관계 (ARIA 역할/속성)
 * - 4.1.2: 이름, 역할, 값
 *
 * @see docs/specs/SDD-ACCESSIBILITY-GUIDELINES.md - A11Y-A5
 */

/**
 * ARIA 역할 검증 결과
 */
export interface AriaValidationResult {
  isValid: boolean;
  element: HTMLElement;
  issues: AriaIssue[];
}

/**
 * ARIA 이슈 정보
 */
export interface AriaIssue {
  type: 'error' | 'warning';
  rule: string;
  message: string;
  suggestion?: string;
}

/**
 * 필수 ARIA 속성 규칙
 * 참고: img 역할은 별도 처리 (alt 텍스트로 대체 가능)
 */
const REQUIRED_ARIA_BY_ROLE: Record<string, string[]> = {
  checkbox: ['aria-checked'],
  combobox: ['aria-expanded'],
  heading: ['aria-level'],
  // img는 별도 처리 (validateAriaAttributes에서 alt/aria-label 체크)
  link: [],
  listbox: [],
  menu: [],
  menuitem: [],
  option: ['aria-selected'],
  progressbar: ['aria-valuenow', 'aria-valuemin', 'aria-valuemax'],
  radio: ['aria-checked'],
  slider: ['aria-valuenow', 'aria-valuemin', 'aria-valuemax'],
  spinbutton: ['aria-valuenow', 'aria-valuemin', 'aria-valuemax'],
  switch: ['aria-checked'],
  tab: ['aria-selected'],
  tabpanel: ['aria-labelledby'],
  textbox: [],
  tree: [],
  treeitem: ['aria-selected'],
};

/**
 * 허용된 ARIA 속성 (역할별)
 */
const ALLOWED_ARIA_BY_ROLE: Record<string, string[]> = {
  button: ['aria-pressed', 'aria-expanded', 'aria-haspopup', 'aria-disabled', 'aria-label', 'aria-describedby'],
  checkbox: ['aria-checked', 'aria-disabled', 'aria-label', 'aria-describedby'],
  dialog: ['aria-labelledby', 'aria-describedby', 'aria-modal'],
  img: ['aria-label', 'aria-describedby', 'aria-hidden'],
  link: ['aria-disabled', 'aria-label', 'aria-describedby'],
  list: ['aria-label', 'aria-describedby'],
  listbox: ['aria-label', 'aria-labelledby', 'aria-describedby', 'aria-multiselectable', 'aria-required'],
  listitem: ['aria-selected', 'aria-checked'],
  menu: ['aria-label', 'aria-labelledby', 'aria-orientation'],
  menuitem: ['aria-disabled', 'aria-haspopup'],
  option: ['aria-selected', 'aria-disabled'],
  progressbar: ['aria-valuenow', 'aria-valuemin', 'aria-valuemax', 'aria-valuetext', 'aria-label'],
  tab: ['aria-selected', 'aria-controls', 'aria-disabled'],
  tablist: ['aria-label', 'aria-labelledby', 'aria-orientation'],
  tabpanel: ['aria-labelledby', 'aria-label'],
  textbox: ['aria-required', 'aria-invalid', 'aria-readonly', 'aria-disabled', 'aria-label', 'aria-describedby'],
};

/**
 * 요소의 접근 가능한 이름 계산
 * (simplified version of accessible name computation)
 */
export function getAccessibleName(element: HTMLElement): string {
  // 1. aria-labelledby
  const labelledBy = element.getAttribute('aria-labelledby');
  if (labelledBy) {
    const labelElements = labelledBy.split(' ').map((id) => document.getElementById(id));
    const names = labelElements.map((el) => el?.textContent?.trim() || '').filter(Boolean);
    if (names.length > 0) return names.join(' ');
  }

  // 2. aria-label
  const ariaLabel = element.getAttribute('aria-label');
  if (ariaLabel) return ariaLabel;

  // 3. Native label (for form elements)
  if (element instanceof HTMLInputElement || element instanceof HTMLTextAreaElement || element instanceof HTMLSelectElement) {
    const id = element.id;
    if (id) {
      const label = document.querySelector(`label[for="${id}"]`);
      if (label?.textContent) return label.textContent.trim();
    }
  }

  // 4. title attribute
  const title = element.getAttribute('title');
  if (title) return title;

  // 5. Text content (for buttons, links)
  const textContent = element.textContent?.trim();
  if (textContent && (element.tagName === 'BUTTON' || element.tagName === 'A')) {
    return textContent;
  }

  // 6. alt text for images
  if (element instanceof HTMLImageElement) {
    return element.alt || '';
  }

  return '';
}

/**
 * 요소의 접근 가능한 설명 계산
 */
export function getAccessibleDescription(element: HTMLElement): string {
  // aria-describedby
  const describedBy = element.getAttribute('aria-describedby');
  if (describedBy) {
    const descElements = describedBy.split(' ').map((id) => document.getElementById(id));
    const descs = descElements.map((el) => el?.textContent?.trim() || '').filter(Boolean);
    if (descs.length > 0) return descs.join(' ');
  }

  return '';
}

/**
 * 요소의 역할(role) 확인
 */
export function getElementRole(element: HTMLElement): string {
  // 명시적 role
  const explicitRole = element.getAttribute('role');
  if (explicitRole) return explicitRole;

  // 암시적 role (네이티브 HTML 요소)
  const tagName = element.tagName.toLowerCase();
  const type = element.getAttribute('type')?.toLowerCase();

  const implicitRoles: Record<string, string> = {
    a: 'link',
    article: 'article',
    aside: 'complementary',
    button: 'button',
    dialog: 'dialog',
    footer: 'contentinfo',
    form: 'form',
    h1: 'heading',
    h2: 'heading',
    h3: 'heading',
    h4: 'heading',
    h5: 'heading',
    h6: 'heading',
    header: 'banner',
    img: 'img',
    input: type === 'checkbox' ? 'checkbox' : type === 'radio' ? 'radio' : 'textbox',
    li: 'listitem',
    main: 'main',
    nav: 'navigation',
    ol: 'list',
    option: 'option',
    progress: 'progressbar',
    section: 'region',
    select: 'listbox',
    table: 'table',
    textarea: 'textbox',
    ul: 'list',
  };

  return implicitRoles[tagName] || '';
}

/**
 * ARIA 속성 검증
 */
export function validateAriaAttributes(element: HTMLElement): AriaValidationResult {
  const issues: AriaIssue[] = [];
  const role = getElementRole(element);

  // 1. 접근 가능한 이름 확인
  const accessibleName = getAccessibleName(element);
  const interactiveRoles = ['button', 'link', 'checkbox', 'radio', 'textbox', 'combobox', 'listbox', 'slider'];

  if (interactiveRoles.includes(role) && !accessibleName) {
    issues.push({
      type: 'error',
      rule: 'accessible-name',
      message: `인터랙티브 요소(role="${role}")에 접근 가능한 이름이 없습니다.`,
      suggestion: 'aria-label, aria-labelledby, 또는 텍스트 콘텐츠를 추가하세요.',
    });
  }

  // 2. 필수 ARIA 속성 확인
  const requiredAttrs = REQUIRED_ARIA_BY_ROLE[role] || [];
  for (const attr of requiredAttrs) {
    if (!element.hasAttribute(attr)) {
      issues.push({
        type: 'error',
        rule: 'required-aria',
        message: `role="${role}"에 필수 속성 ${attr}이(가) 없습니다.`,
        suggestion: `${attr} 속성을 추가하세요.`,
      });
    }
  }

  // 3. 이미지에 alt 또는 aria-label 확인
  if (element instanceof HTMLImageElement) {
    const hasAlt = element.hasAttribute('alt');
    const altValue = element.alt;
    const hasAriaLabel = !!element.getAttribute('aria-label');
    const isDecorative = element.getAttribute('aria-hidden') === 'true' || (hasAlt && altValue === '');

    if (!isDecorative && !altValue && !hasAriaLabel) {
      issues.push({
        type: 'error',
        rule: 'img-alt',
        message: '이미지에 대체 텍스트가 없습니다.',
        suggestion: 'alt 속성 또는 aria-label을 추가하세요. 장식용 이미지라면 alt=""를 사용하세요.',
      });
    }
  }

  // 4. 빈 버튼/링크 확인
  if ((role === 'button' || role === 'link') && !accessibleName) {
    issues.push({
      type: 'error',
      rule: 'empty-interactive',
      message: `${role === 'button' ? '버튼' : '링크'}에 접근 가능한 텍스트가 없습니다.`,
      suggestion: '텍스트 콘텐츠, aria-label, 또는 aria-labelledby를 추가하세요.',
    });
  }

  // 5. 폼 컨트롤에 레이블 확인
  const formRoles = ['textbox', 'checkbox', 'radio', 'combobox', 'listbox', 'spinbutton'];
  if (formRoles.includes(role) && !accessibleName) {
    issues.push({
      type: 'error',
      rule: 'form-label',
      message: '폼 컨트롤에 레이블이 없습니다.',
      suggestion: '<label> 요소를 연결하거나 aria-label을 추가하세요.',
    });
  }

  return {
    isValid: issues.filter((i) => i.type === 'error').length === 0,
    element,
    issues,
  };
}

/**
 * 컨테이너 내 모든 요소 검증
 */
export function validateContainer(container: HTMLElement): AriaValidationResult[] {
  const results: AriaValidationResult[] = [];

  // 인터랙티브 요소 선택
  const interactiveElements = container.querySelectorAll<HTMLElement>(
    'button, a[href], input, select, textarea, [role="button"], [role="link"], [role="checkbox"], [role="radio"], [role="textbox"], [tabindex]'
  );

  for (const element of interactiveElements) {
    const result = validateAriaAttributes(element);
    if (result.issues.length > 0) {
      results.push(result);
    }
  }

  // 이미지 요소 검증
  const images = container.querySelectorAll<HTMLImageElement>('img');
  for (const img of images) {
    const result = validateAriaAttributes(img);
    if (result.issues.length > 0) {
      results.push(result);
    }
  }

  return results;
}

/**
 * 랜드마크 검증
 */
export interface LandmarkValidation {
  hasMain: boolean;
  hasNavigation: boolean;
  hasBanner: boolean;
  hasContentinfo: boolean;
  duplicateMain: boolean;
  issues: AriaIssue[];
}

export function validateLandmarks(container: HTMLElement = document.body): LandmarkValidation {
  const issues: AriaIssue[] = [];

  const mainElements = container.querySelectorAll('main, [role="main"]');
  const navElements = container.querySelectorAll('nav, [role="navigation"]');
  const bannerElements = container.querySelectorAll('header, [role="banner"]');
  const contentinfoElements = container.querySelectorAll('footer, [role="contentinfo"]');

  const hasMain = mainElements.length > 0;
  const hasNavigation = navElements.length > 0;
  const hasBanner = bannerElements.length > 0;
  const hasContentinfo = contentinfoElements.length > 0;
  const duplicateMain = mainElements.length > 1;

  if (!hasMain) {
    issues.push({
      type: 'warning',
      rule: 'landmark-main',
      message: '페이지에 main 랜드마크가 없습니다.',
      suggestion: '<main> 요소를 추가하세요.',
    });
  }

  if (duplicateMain) {
    issues.push({
      type: 'error',
      rule: 'duplicate-main',
      message: '페이지에 main 랜드마크가 여러 개 있습니다.',
      suggestion: 'main 랜드마크는 페이지당 하나만 있어야 합니다.',
    });
  }

  // 다중 네비게이션에 레이블 확인
  if (navElements.length > 1) {
    navElements.forEach((nav, index) => {
      if (!nav.getAttribute('aria-label') && !nav.getAttribute('aria-labelledby')) {
        issues.push({
          type: 'warning',
          rule: 'nav-label',
          message: `네비게이션 #${index + 1}에 구분 레이블이 없습니다.`,
          suggestion: '여러 개의 nav가 있을 때는 aria-label로 구분하세요.',
        });
      }
    });
  }

  return {
    hasMain,
    hasNavigation,
    hasBanner,
    hasContentinfo,
    duplicateMain,
    issues,
  };
}

/**
 * 스크린리더 테스트 체크리스트 생성
 */
export interface ScreenReaderTestItem {
  id: string;
  category: string;
  description: string;
  steps: string[];
  expectedResult: string;
}

export const SCREEN_READER_CHECKLIST: ScreenReaderTestItem[] = [
  {
    id: 'sr-1',
    category: '페이지 구조',
    description: '페이지 랜드마크 탐색',
    steps: [
      'VoiceOver: VO + U (로터) → 랜드마크',
      'NVDA: D 키로 랜드마크 이동',
    ],
    expectedResult: 'main, navigation, banner 등 랜드마크가 올바르게 인식됨',
  },
  {
    id: 'sr-2',
    category: '페이지 구조',
    description: '제목 계층 탐색',
    steps: [
      'VoiceOver: VO + U (로터) → 제목',
      'NVDA: H 키로 제목 이동',
    ],
    expectedResult: 'h1~h6 순서대로 인식되며, 논리적 계층 구조',
  },
  {
    id: 'sr-3',
    category: '폼',
    description: '폼 컨트롤 레이블',
    steps: [
      '폼 입력 필드로 포커스 이동',
      '스크린리더가 읽는 내용 확인',
    ],
    expectedResult: '입력 필드의 목적이 명확하게 읽힘',
  },
  {
    id: 'sr-4',
    category: '폼',
    description: '폼 오류 메시지',
    steps: [
      '잘못된 입력 후 제출',
      '오류 메시지 확인',
    ],
    expectedResult: '오류 메시지가 자동으로 읽히거나 쉽게 접근 가능',
  },
  {
    id: 'sr-5',
    category: '인터랙션',
    description: '버튼 접근성',
    steps: [
      'Tab 키로 버튼으로 이동',
      '스크린리더가 읽는 내용 확인',
    ],
    expectedResult: '버튼 이름과 역할이 명확하게 읽힘',
  },
  {
    id: 'sr-6',
    category: '인터랙션',
    description: '링크 접근성',
    steps: [
      'VoiceOver: VO + U (로터) → 링크',
      'NVDA: K 키로 링크 이동',
    ],
    expectedResult: '링크 텍스트가 목적지를 명확히 설명',
  },
  {
    id: 'sr-7',
    category: '동적 콘텐츠',
    description: '라이브 리전 알림',
    steps: [
      '동적 콘텐츠 업데이트 트리거',
      '스크린리더 알림 확인',
    ],
    expectedResult: '중요한 업데이트가 자동으로 읽힘',
  },
  {
    id: 'sr-8',
    category: '동적 콘텐츠',
    description: '분석 결과 알림',
    steps: [
      '분석 시작 버튼 클릭',
      '분석 완료 시 알림 확인',
    ],
    expectedResult: '"분석 결과가 준비되었습니다" 등 완료 알림이 읽힘',
  },
  {
    id: 'sr-9',
    category: '모달',
    description: '모달 포커스 트랩',
    steps: [
      '모달 열기',
      'Tab 키로 포커스 이동',
    ],
    expectedResult: '포커스가 모달 내에서만 순환',
  },
  {
    id: 'sr-10',
    category: '모달',
    description: '모달 닫기',
    steps: [
      '모달이 열린 상태에서 Escape 키',
      '포커스 위치 확인',
    ],
    expectedResult: '모달이 닫히고 포커스가 트리거 요소로 복귀',
  },
  {
    id: 'sr-11',
    category: '이미지',
    description: '이미지 대체 텍스트',
    steps: [
      '이미지로 포커스/탐색 이동',
      '스크린리더가 읽는 내용 확인',
    ],
    expectedResult: '의미 있는 이미지는 설명이 읽히고, 장식용은 무시됨',
  },
  {
    id: 'sr-12',
    category: '분석 결과',
    description: 'AI 분석 결과 카드',
    steps: [
      '분석 결과 카드로 이동',
      '전체 내용 탐색',
    ],
    expectedResult: '분석 유형, 신뢰도, 결과 내용이 논리적 순서로 읽힘',
  },
];

/**
 * 테스트 결과 포맷
 */
export function formatValidationResults(results: AriaValidationResult[]): string {
  if (results.length === 0) {
    return '✅ 모든 요소가 접근성 검사를 통과했습니다.';
  }

  const lines: string[] = ['접근성 검사 결과:', ''];

  for (const result of results) {
    const tagName = result.element.tagName.toLowerCase();
    const id = result.element.id ? `#${result.element.id}` : '';
    const className = result.element.className ? `.${result.element.className.split(' ')[0]}` : '';

    lines.push(`📍 <${tagName}${id}${className}>`);

    for (const issue of result.issues) {
      const icon = issue.type === 'error' ? '❌' : '⚠️';
      lines.push(`  ${icon} [${issue.rule}] ${issue.message}`);
      if (issue.suggestion) {
        lines.push(`     💡 ${issue.suggestion}`);
      }
    }
    lines.push('');
  }

  const errorCount = results.reduce(
    (sum, r) => sum + r.issues.filter((i) => i.type === 'error').length,
    0
  );
  const warningCount = results.reduce(
    (sum, r) => sum + r.issues.filter((i) => i.type === 'warning').length,
    0
  );

  lines.push(`총계: ${errorCount}개 오류, ${warningCount}개 경고`);

  return lines.join('\n');
}
