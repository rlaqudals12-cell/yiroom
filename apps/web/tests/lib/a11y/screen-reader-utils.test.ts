/**
 * 스크린리더 유틸리티 테스트
 *
 * @see lib/a11y/screen-reader-utils.ts
 * @see docs/specs/SDD-ACCESSIBILITY-GUIDELINES.md - A11Y-A5
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import {
  getAccessibleName,
  getAccessibleDescription,
  getElementRole,
  validateAriaAttributes,
  validateContainer,
  validateLandmarks,
  formatValidationResults,
  SCREEN_READER_CHECKLIST,
} from '@/lib/a11y/screen-reader-utils';

describe('screen-reader-utils', () => {
  let container: HTMLDivElement;

  beforeEach(() => {
    container = document.createElement('div');
    document.body.appendChild(container);
  });

  afterEach(() => {
    document.body.removeChild(container);
  });

  describe('getAccessibleName', () => {
    it('should return aria-label value', () => {
      container.innerHTML = '<button aria-label="닫기">X</button>';
      const button = container.querySelector('button')!;
      expect(getAccessibleName(button)).toBe('닫기');
    });

    it('should return aria-labelledby referenced text', () => {
      container.innerHTML = `
        <span id="label">검색</span>
        <input aria-labelledby="label" type="text" />
      `;
      const input = container.querySelector('input')!;
      expect(getAccessibleName(input)).toBe('검색');
    });

    it('should return text content for buttons', () => {
      container.innerHTML = '<button>저장하기</button>';
      const button = container.querySelector('button')!;
      expect(getAccessibleName(button)).toBe('저장하기');
    });

    it('should return alt text for images', () => {
      container.innerHTML = '<img alt="프로필 이미지" src="test.jpg" />';
      const img = container.querySelector('img')!;
      expect(getAccessibleName(img)).toBe('프로필 이미지');
    });

    it('should return label text for form inputs', () => {
      container.innerHTML = `
        <label for="email">이메일</label>
        <input id="email" type="email" />
      `;
      const input = container.querySelector('input')!;
      expect(getAccessibleName(input)).toBe('이메일');
    });

    it('should return title attribute as fallback', () => {
      container.innerHTML = '<div title="도움말" tabindex="0"></div>';
      const div = container.querySelector('div')!;
      expect(getAccessibleName(div)).toBe('도움말');
    });

    it('should return empty string for elements without accessible name', () => {
      container.innerHTML = '<div tabindex="0"></div>';
      const div = container.querySelector('div')!;
      expect(getAccessibleName(div)).toBe('');
    });
  });

  describe('getAccessibleDescription', () => {
    it('should return aria-describedby referenced text', () => {
      container.innerHTML = `
        <span id="desc">비밀번호는 8자 이상이어야 합니다</span>
        <input aria-describedby="desc" type="password" />
      `;
      const input = container.querySelector('input')!;
      expect(getAccessibleDescription(input)).toBe('비밀번호는 8자 이상이어야 합니다');
    });

    it('should handle multiple describedby IDs', () => {
      container.innerHTML = `
        <span id="desc1">조건 1</span>
        <span id="desc2">조건 2</span>
        <input aria-describedby="desc1 desc2" type="text" />
      `;
      const input = container.querySelector('input')!;
      expect(getAccessibleDescription(input)).toBe('조건 1 조건 2');
    });

    it('should return empty string when no description', () => {
      container.innerHTML = '<input type="text" />';
      const input = container.querySelector('input')!;
      expect(getAccessibleDescription(input)).toBe('');
    });
  });

  describe('getElementRole', () => {
    it('should return explicit role', () => {
      container.innerHTML = '<div role="button">클릭</div>';
      const div = container.querySelector('div')!;
      expect(getElementRole(div)).toBe('button');
    });

    it('should return implicit role for button', () => {
      container.innerHTML = '<button>클릭</button>';
      const button = container.querySelector('button')!;
      expect(getElementRole(button)).toBe('button');
    });

    it('should return implicit role for link', () => {
      container.innerHTML = '<a href="#">링크</a>';
      const link = container.querySelector('a')!;
      expect(getElementRole(link)).toBe('link');
    });

    it('should return implicit role for checkbox input', () => {
      container.innerHTML = '<input type="checkbox" />';
      const input = container.querySelector('input')!;
      expect(getElementRole(input)).toBe('checkbox');
    });

    it('should return implicit role for heading', () => {
      container.innerHTML = '<h1>제목</h1>';
      const h1 = container.querySelector('h1')!;
      expect(getElementRole(h1)).toBe('heading');
    });

    it('should return implicit role for list', () => {
      container.innerHTML = '<ul><li>항목</li></ul>';
      const ul = container.querySelector('ul')!;
      expect(getElementRole(ul)).toBe('list');
    });
  });

  describe('validateAriaAttributes', () => {
    it('should pass for button with accessible name', () => {
      container.innerHTML = '<button>저장</button>';
      const button = container.querySelector('button')!;
      const result = validateAriaAttributes(button);
      expect(result.isValid).toBe(true);
      expect(result.issues.length).toBe(0);
    });

    it('should fail for button without accessible name', () => {
      container.innerHTML = '<button></button>';
      const button = container.querySelector('button')!;
      const result = validateAriaAttributes(button);
      expect(result.isValid).toBe(false);
      expect(result.issues.some(i => i.rule === 'empty-interactive')).toBe(true);
    });

    it('should fail for image without alt', () => {
      container.innerHTML = '<img src="test.jpg" />';
      const img = container.querySelector('img')!;
      const result = validateAriaAttributes(img);
      expect(result.isValid).toBe(false);
      expect(result.issues.some(i => i.rule === 'img-alt')).toBe(true);
    });

    it('should pass for decorative image with empty alt', () => {
      container.innerHTML = '<img src="test.jpg" alt="" />';
      const img = container.querySelector('img')!;
      const result = validateAriaAttributes(img);
      expect(result.isValid).toBe(true);
    });

    it('should pass for image with aria-hidden', () => {
      container.innerHTML = '<img src="test.jpg" aria-hidden="true" />';
      const img = container.querySelector('img')!;
      const result = validateAriaAttributes(img);
      expect(result.isValid).toBe(true);
    });

    it('should fail for input without label', () => {
      container.innerHTML = '<input type="text" />';
      const input = container.querySelector('input')!;
      const result = validateAriaAttributes(input);
      expect(result.isValid).toBe(false);
      expect(result.issues.some(i => i.rule === 'form-label')).toBe(true);
    });

    it('should pass for input with label', () => {
      container.innerHTML = `
        <label for="name">이름</label>
        <input id="name" type="text" />
      `;
      const input = container.querySelector('input')!;
      const result = validateAriaAttributes(input);
      expect(result.isValid).toBe(true);
    });
  });

  describe('validateContainer', () => {
    it('should return empty array for valid container', () => {
      container.innerHTML = `
        <button>저장</button>
        <a href="https://example.com">링크</a>
        <img src="test.jpg" alt="테스트 이미지" />
      `;
      const results = validateContainer(container);
      expect(results.length).toBe(0);
    });

    it('should find all issues in container', () => {
      container.innerHTML = `
        <button></button>
        <a href="#"></a>
        <img src="test.jpg" />
      `;
      const results = validateContainer(container);
      expect(results.length).toBe(3);
    });
  });

  describe('validateLandmarks', () => {
    it('should detect missing main landmark', () => {
      container.innerHTML = '<nav>네비게이션</nav>';
      const result = validateLandmarks(container);
      expect(result.hasMain).toBe(false);
      expect(result.hasNavigation).toBe(true);
      expect(result.issues.some(i => i.rule === 'landmark-main')).toBe(true);
    });

    it('should detect duplicate main landmarks', () => {
      container.innerHTML = `
        <main>콘텐츠 1</main>
        <main>콘텐츠 2</main>
      `;
      const result = validateLandmarks(container);
      expect(result.duplicateMain).toBe(true);
      expect(result.issues.some(i => i.rule === 'duplicate-main')).toBe(true);
    });

    it('should pass for valid landmark structure', () => {
      container.innerHTML = `
        <header>헤더</header>
        <nav>네비게이션</nav>
        <main>메인 콘텐츠</main>
        <footer>푸터</footer>
      `;
      const result = validateLandmarks(container);
      expect(result.hasMain).toBe(true);
      expect(result.hasNavigation).toBe(true);
      expect(result.hasBanner).toBe(true);
      expect(result.hasContentinfo).toBe(true);
      expect(result.duplicateMain).toBe(false);
    });

    it('should warn about multiple navigations without labels', () => {
      container.innerHTML = `
        <nav>메인 네비게이션</nav>
        <nav>보조 네비게이션</nav>
      `;
      const result = validateLandmarks(container);
      expect(result.issues.some(i => i.rule === 'nav-label')).toBe(true);
    });

    it('should accept labeled navigations', () => {
      container.innerHTML = `
        <nav aria-label="메인 메뉴">메인 네비게이션</nav>
        <nav aria-label="보조 메뉴">보조 네비게이션</nav>
      `;
      const result = validateLandmarks(container);
      expect(result.issues.filter(i => i.rule === 'nav-label').length).toBe(0);
    });
  });

  describe('formatValidationResults', () => {
    it('should return success message for empty results', () => {
      const output = formatValidationResults([]);
      expect(output).toContain('모든 요소가 접근성 검사를 통과');
    });

    it('should format issues correctly', () => {
      container.innerHTML = '<button id="test-btn"></button>';
      const button = container.querySelector('button')!;
      const result = validateAriaAttributes(button);
      const output = formatValidationResults([result]);

      expect(output).toContain('<button#test-btn>');
      expect(output).toContain('오류');
    });
  });

  describe('SCREEN_READER_CHECKLIST', () => {
    it('should have checklist items', () => {
      expect(SCREEN_READER_CHECKLIST.length).toBeGreaterThan(0);
    });

    it('should have required fields for each item', () => {
      for (const item of SCREEN_READER_CHECKLIST) {
        expect(item.id).toBeDefined();
        expect(item.category).toBeDefined();
        expect(item.description).toBeDefined();
        expect(item.steps.length).toBeGreaterThan(0);
        expect(item.expectedResult).toBeDefined();
      }
    });

    it('should cover different categories', () => {
      const categories = new Set(SCREEN_READER_CHECKLIST.map(item => item.category));
      expect(categories.size).toBeGreaterThan(3);
    });
  });
});
