/**
 * WCAG 2.1 AA 체크리스트 유틸리티
 *
 * 분석 모듈 접근성 준수 검증을 위한 체크리스트 및 유틸리티
 *
 * @see SDD-ACCESSIBILITY-GUIDELINES.md
 * @see https://www.w3.org/WAI/WCAG21/quickref/?levels=aaa
 */

// 체크리스트 항목 상태
export type CheckStatus = 'pass' | 'fail' | 'warning' | 'not-applicable';

// 체크리스트 항목
export interface WCAGCheckItem {
  id: string;
  criterion: string;
  level: 'A' | 'AA' | 'AAA';
  category: 'perceivable' | 'operable' | 'understandable' | 'robust';
  description: string;
  howToTest: string;
  status?: CheckStatus;
  notes?: string;
}

// 체크리스트 결과
export interface WCAGCheckResult {
  totalItems: number;
  passed: number;
  failed: number;
  warnings: number;
  notApplicable: number;
  score: number;
  items: WCAGCheckItem[];
}

/**
 * WCAG 2.1 AA 필수 체크리스트
 *
 * 분석 모듈에 적용되는 핵심 요구사항
 */
export const WCAG_CHECKLIST: WCAGCheckItem[] = [
  // 1. 인식의 용이성 (Perceivable)
  {
    id: '1.1.1',
    criterion: '텍스트 대체',
    level: 'A',
    category: 'perceivable',
    description: '모든 비텍스트 콘텐츠에 대체 텍스트 제공',
    howToTest: '이미지에 alt 속성, 아이콘 버튼에 aria-label 확인',
  },
  {
    id: '1.3.1',
    criterion: '정보와 관계',
    level: 'A',
    category: 'perceivable',
    description: '시각적으로 전달되는 정보/구조를 프로그래밍 방식으로 결정 가능',
    howToTest: '제목에 heading 태그, 목록에 ul/ol, 테이블에 th 사용 확인',
  },
  {
    id: '1.3.2',
    criterion: '의미 있는 순서',
    level: 'A',
    category: 'perceivable',
    description: 'DOM 순서가 시각적 순서와 일치',
    howToTest: 'Tab 키로 탐색 시 순서가 자연스러운지 확인',
  },
  {
    id: '1.4.1',
    criterion: '색상 사용',
    level: 'A',
    category: 'perceivable',
    description: '색상만으로 정보 전달하지 않음',
    howToTest: '상태 표시에 아이콘/텍스트가 함께 있는지 확인',
  },
  {
    id: '1.4.3',
    criterion: '명암 대비 (최소)',
    level: 'AA',
    category: 'perceivable',
    description: '텍스트 대비율 4.5:1 이상',
    howToTest: 'WebAIM Contrast Checker 또는 axe-core 사용',
  },
  {
    id: '1.4.4',
    criterion: '텍스트 크기 조절',
    level: 'AA',
    category: 'perceivable',
    description: '200% 확대 시에도 콘텐츠 기능 유지',
    howToTest: '브라우저 확대 200%에서 레이아웃 확인',
  },
  {
    id: '1.4.10',
    criterion: '리플로우',
    level: 'AA',
    category: 'perceivable',
    description: '320px 너비에서 수평 스크롤 없이 사용 가능',
    howToTest: '모바일 뷰포트(320px)에서 수평 스크롤 확인',
  },
  {
    id: '1.4.11',
    criterion: '비텍스트 대비',
    level: 'AA',
    category: 'perceivable',
    description: 'UI 컴포넌트 대비율 3:1 이상',
    howToTest: '버튼, 입력 필드 테두리 대비율 확인',
  },

  // 2. 운용의 용이성 (Operable)
  {
    id: '2.1.1',
    criterion: '키보드',
    level: 'A',
    category: 'operable',
    description: '모든 기능을 키보드로 사용 가능',
    howToTest: '마우스 없이 Tab, Enter, Space, 화살표 키로 탐색',
  },
  {
    id: '2.1.2',
    criterion: '키보드 트랩 없음',
    level: 'A',
    category: 'operable',
    description: '키보드 포커스가 특정 요소에 갇히지 않음',
    howToTest: '모달에서 Tab 키로 순환 후 Escape로 탈출 가능 확인',
  },
  {
    id: '2.4.1',
    criterion: '블록 건너뛰기',
    level: 'A',
    category: 'operable',
    description: '반복 콘텐츠를 건너뛸 수 있는 방법 제공',
    howToTest: '페이지 상단에 "본문으로 건너뛰기" 링크 확인',
  },
  {
    id: '2.4.2',
    criterion: '페이지 제목',
    level: 'A',
    category: 'operable',
    description: '페이지 목적을 설명하는 제목 제공',
    howToTest: '<title> 태그가 페이지 내용을 반영하는지 확인',
  },
  {
    id: '2.4.3',
    criterion: '포커스 순서',
    level: 'A',
    category: 'operable',
    description: '포커스 순서가 의미와 조작에 적합',
    howToTest: 'Tab 키로 탐색 시 논리적 순서 확인',
  },
  {
    id: '2.4.4',
    criterion: '링크 목적 (문맥)',
    level: 'A',
    category: 'operable',
    description: '링크 텍스트 또는 문맥에서 목적 파악 가능',
    howToTest: '"자세히 보기" 대신 구체적 링크 텍스트 사용 확인',
  },
  {
    id: '2.4.6',
    criterion: '제목과 레이블',
    level: 'AA',
    category: 'operable',
    description: '제목과 레이블이 주제나 목적을 설명',
    howToTest: '폼 레이블이 입력 목적을 명확히 설명하는지 확인',
  },
  {
    id: '2.4.7',
    criterion: '포커스 표시',
    level: 'AA',
    category: 'operable',
    description: '키보드 포커스 표시기가 보임',
    howToTest: 'Tab 키로 탐색 시 포커스 링이 보이는지 확인',
  },

  // 3. 이해의 용이성 (Understandable)
  {
    id: '3.1.1',
    criterion: '페이지 언어',
    level: 'A',
    category: 'understandable',
    description: '페이지 기본 언어가 프로그래밍 방식으로 결정 가능',
    howToTest: '<html lang="ko"> 확인',
  },
  {
    id: '3.2.1',
    criterion: '포커스 시',
    level: 'A',
    category: 'understandable',
    description: '포커스만으로 컨텍스트 변경 없음',
    howToTest: '입력 필드 포커스 시 자동 제출 없는지 확인',
  },
  {
    id: '3.2.2',
    criterion: '입력 시',
    level: 'A',
    category: 'understandable',
    description: '입력만으로 예기치 않은 컨텍스트 변경 없음',
    howToTest: '셀렉트 변경 시 자동 이동 없는지 확인',
  },
  {
    id: '3.3.1',
    criterion: '오류 식별',
    level: 'A',
    category: 'understandable',
    description: '입력 오류 자동 감지 시 사용자에게 알림',
    howToTest: '유효하지 않은 입력 시 오류 메시지 표시 확인',
  },
  {
    id: '3.3.2',
    criterion: '레이블 또는 지침',
    level: 'A',
    category: 'understandable',
    description: '입력 필드에 레이블이나 지침 제공',
    howToTest: '모든 입력 필드에 연결된 label 확인',
  },
  {
    id: '3.3.3',
    criterion: '오류 제안',
    level: 'AA',
    category: 'understandable',
    description: '오류 수정 방법 제안',
    howToTest: '오류 메시지에 해결 방법 포함 확인',
  },

  // 4. 견고성 (Robust)
  {
    id: '4.1.1',
    criterion: '파싱',
    level: 'A',
    category: 'robust',
    description: 'HTML 유효성 (중복 ID 없음)',
    howToTest: 'W3C Validator 또는 axe-core로 검증',
  },
  {
    id: '4.1.2',
    criterion: '이름, 역할, 값',
    level: 'A',
    category: 'robust',
    description: 'UI 컴포넌트의 이름과 역할이 프로그래밍 방식으로 결정 가능',
    howToTest: '커스텀 컴포넌트에 ARIA 속성 확인',
  },
  {
    id: '4.1.3',
    criterion: '상태 메시지',
    level: 'AA',
    category: 'robust',
    description: '상태 메시지를 보조 기술이 인식 가능',
    howToTest: '로딩/성공/에러 메시지에 aria-live 확인',
  },
];

/**
 * 분석 모듈별 추가 체크리스트
 */
export const ANALYSIS_MODULE_CHECKLIST: Record<string, WCAGCheckItem[]> = {
  'personal-color': [
    {
      id: 'PC-A1',
      criterion: '색상 팔레트 접근성',
      level: 'AA',
      category: 'perceivable',
      description: '색상 칩에 색상명과 코드 제공',
      howToTest: '색상 칩에 sr-only 텍스트 또는 aria-label 확인',
    },
    {
      id: 'PC-A2',
      criterion: '시즌 결과 읽기',
      level: 'A',
      category: 'perceivable',
      description: '시즌 결과가 스크린 리더로 읽힘',
      howToTest: 'VoiceOver/NVDA로 결과 읽기 테스트',
    },
  ],
  skin: [
    {
      id: 'SK-A1',
      criterion: '점수 게이지 접근성',
      level: 'AA',
      category: 'perceivable',
      description: '점수 게이지에 role="meter" 적용',
      howToTest: 'aria-valuenow, aria-valuemin, aria-valuemax 확인',
    },
    {
      id: 'SK-A2',
      criterion: '트렌드 차트 대체 텍스트',
      level: 'A',
      category: 'perceivable',
      description: '차트에 요약 텍스트 제공',
      howToTest: '차트 근처에 텍스트 요약 확인',
    },
  ],
  body: [
    {
      id: 'BD-A1',
      criterion: '체형 다이어그램 설명',
      level: 'A',
      category: 'perceivable',
      description: '체형 시각화에 상세 설명 제공',
      howToTest: 'longdesc 또는 별도 설명 텍스트 확인',
    },
  ],
};

/**
 * 체크리스트 결과 계산
 */
export function calculateCheckResult(items: WCAGCheckItem[]): WCAGCheckResult {
  const passed = items.filter((i) => i.status === 'pass').length;
  const failed = items.filter((i) => i.status === 'fail').length;
  const warnings = items.filter((i) => i.status === 'warning').length;
  const notApplicable = items.filter((i) => i.status === 'not-applicable').length;
  const applicable = items.length - notApplicable;

  return {
    totalItems: items.length,
    passed,
    failed,
    warnings,
    notApplicable,
    score: applicable > 0 ? Math.round((passed / applicable) * 100) : 100,
    items,
  };
}

/**
 * 카테고리별 체크리스트 필터
 */
export function filterByCategory(
  category: WCAGCheckItem['category']
): WCAGCheckItem[] {
  return WCAG_CHECKLIST.filter((item) => item.category === category);
}

/**
 * 레벨별 체크리스트 필터
 */
export function filterByLevel(level: 'A' | 'AA' | 'AAA'): WCAGCheckItem[] {
  const levels: Record<string, ('A' | 'AA' | 'AAA')[]> = {
    A: ['A'],
    AA: ['A', 'AA'],
    AAA: ['A', 'AA', 'AAA'],
  };
  return WCAG_CHECKLIST.filter((item) => levels[level].includes(item.level));
}

/**
 * 분석 모듈용 통합 체크리스트 생성
 */
export function getModuleChecklist(
  moduleId: keyof typeof ANALYSIS_MODULE_CHECKLIST
): WCAGCheckItem[] {
  const baseChecklist = filterByLevel('AA');
  const moduleSpecific = ANALYSIS_MODULE_CHECKLIST[moduleId] || [];
  return [...baseChecklist, ...moduleSpecific];
}

/**
 * 체크리스트 항목 ID로 검색
 */
export function getCheckItemById(id: string): WCAGCheckItem | undefined {
  return WCAG_CHECKLIST.find((item) => item.id === id);
}

/**
 * 카테고리 한국어 라벨
 */
export const CATEGORY_LABELS: Record<WCAGCheckItem['category'], string> = {
  perceivable: '인식의 용이성',
  operable: '운용의 용이성',
  understandable: '이해의 용이성',
  robust: '견고성',
};

/**
 * 레벨 설명
 */
export const LEVEL_DESCRIPTIONS: Record<'A' | 'AA' | 'AAA', string> = {
  A: '필수 (기본 접근성)',
  AA: '권장 (법적 요구사항)',
  AAA: '향상 (최고 수준)',
};
