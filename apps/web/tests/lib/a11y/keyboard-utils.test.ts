/**
 * 키보드 유틸리티 테스트
 *
 * @see lib/a11y/keyboard-utils.ts
 * @see docs/specs/SDD-ACCESSIBILITY-GUIDELINES.md - A11Y-A4
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import {
  KEYS,
  isKey,
  isOneOfKeys,
  isActivationKey,
  isArrowKey,
  FOCUSABLE_SELECTOR,
  getFocusableElements,
  focusFirst,
  focusLast,
  focusNext,
  focusPrevious,
  handleListKeyDown,
  handleTabListKeyDown,
  setRovingTabIndex,
} from '@/lib/a11y/keyboard-utils';

describe('keyboard-utils', () => {
  describe('KEYS', () => {
    it('should have correct key values', () => {
      expect(KEYS.TAB).toBe('Tab');
      expect(KEYS.ENTER).toBe('Enter');
      expect(KEYS.SPACE).toBe(' ');
      expect(KEYS.ESCAPE).toBe('Escape');
      expect(KEYS.ARROW_UP).toBe('ArrowUp');
      expect(KEYS.ARROW_DOWN).toBe('ArrowDown');
      expect(KEYS.ARROW_LEFT).toBe('ArrowLeft');
      expect(KEYS.ARROW_RIGHT).toBe('ArrowRight');
      expect(KEYS.HOME).toBe('Home');
      expect(KEYS.END).toBe('End');
    });
  });

  describe('isKey', () => {
    it('should return true for matching key', () => {
      const event = new KeyboardEvent('keydown', { key: 'Enter' });
      expect(isKey(event, KEYS.ENTER)).toBe(true);
    });

    it('should return false for non-matching key', () => {
      const event = new KeyboardEvent('keydown', { key: 'Escape' });
      expect(isKey(event, KEYS.ENTER)).toBe(false);
    });
  });

  describe('isOneOfKeys', () => {
    it('should return true if key is in array', () => {
      const event = new KeyboardEvent('keydown', { key: 'Enter' });
      expect(isOneOfKeys(event, [KEYS.ENTER, KEYS.SPACE])).toBe(true);
    });

    it('should return false if key is not in array', () => {
      const event = new KeyboardEvent('keydown', { key: 'Tab' });
      expect(isOneOfKeys(event, [KEYS.ENTER, KEYS.SPACE])).toBe(false);
    });
  });

  describe('isActivationKey', () => {
    it('should return true for Enter', () => {
      const event = new KeyboardEvent('keydown', { key: 'Enter' });
      expect(isActivationKey(event)).toBe(true);
    });

    it('should return true for Space', () => {
      const event = new KeyboardEvent('keydown', { key: ' ' });
      expect(isActivationKey(event)).toBe(true);
    });

    it('should return false for other keys', () => {
      const event = new KeyboardEvent('keydown', { key: 'Tab' });
      expect(isActivationKey(event)).toBe(false);
    });
  });

  describe('isArrowKey', () => {
    it('should return true for arrow keys', () => {
      expect(isArrowKey(new KeyboardEvent('keydown', { key: 'ArrowUp' }))).toBe(true);
      expect(isArrowKey(new KeyboardEvent('keydown', { key: 'ArrowDown' }))).toBe(true);
      expect(isArrowKey(new KeyboardEvent('keydown', { key: 'ArrowLeft' }))).toBe(true);
      expect(isArrowKey(new KeyboardEvent('keydown', { key: 'ArrowRight' }))).toBe(true);
    });

    it('should return false for non-arrow keys', () => {
      expect(isArrowKey(new KeyboardEvent('keydown', { key: 'Enter' }))).toBe(false);
    });
  });

  describe('FOCUSABLE_SELECTOR', () => {
    it('should be a non-empty string', () => {
      expect(typeof FOCUSABLE_SELECTOR).toBe('string');
      expect(FOCUSABLE_SELECTOR.length).toBeGreaterThan(0);
    });

    it('should include common focusable elements', () => {
      expect(FOCUSABLE_SELECTOR).toContain('a[href]');
      expect(FOCUSABLE_SELECTOR).toContain('button');
      expect(FOCUSABLE_SELECTOR).toContain('input');
      expect(FOCUSABLE_SELECTOR).toContain('[tabindex]');
    });
  });

  describe('DOM utilities', () => {
    let container: HTMLDivElement;

    beforeEach(() => {
      container = document.createElement('div');
      container.innerHTML = `
        <button id="btn1">Button 1</button>
        <input id="input1" type="text" />
        <button id="btn2">Button 2</button>
        <button id="btn3" disabled>Disabled</button>
        <a id="link1" href="#">Link</a>
      `;
      document.body.appendChild(container);
    });

    afterEach(() => {
      document.body.removeChild(container);
    });

    describe('getFocusableElements', () => {
      it('should return focusable elements', () => {
        const focusable = getFocusableElements(container);
        expect(focusable.length).toBe(4); // btn1, input1, btn2, link1 (disabled excluded)
      });

      it('should exclude disabled buttons', () => {
        const focusable = getFocusableElements(container);
        const ids = focusable.map((el) => el.id);
        expect(ids).not.toContain('btn3');
      });
    });

    describe('focusFirst', () => {
      it('should focus the first focusable element', () => {
        const focused = focusFirst(container);
        expect(focused?.id).toBe('btn1');
        expect(document.activeElement?.id).toBe('btn1');
      });

      it('should return null for empty container', () => {
        const emptyContainer = document.createElement('div');
        const focused = focusFirst(emptyContainer);
        expect(focused).toBeNull();
      });
    });

    describe('focusLast', () => {
      it('should focus the last focusable element', () => {
        const focused = focusLast(container);
        expect(focused?.id).toBe('link1');
        expect(document.activeElement?.id).toBe('link1');
      });
    });

    describe('focusNext', () => {
      it('should focus the next element', () => {
        const btn1 = container.querySelector('#btn1') as HTMLElement;
        btn1.focus();
        const next = focusNext(container, btn1);
        expect(next?.id).toBe('input1');
      });

      it('should wrap to first when at end', () => {
        const link1 = container.querySelector('#link1') as HTMLElement;
        link1.focus();
        const next = focusNext(container, link1, true);
        expect(next?.id).toBe('btn1');
      });

      it('should return null when at end without wrap', () => {
        const link1 = container.querySelector('#link1') as HTMLElement;
        link1.focus();
        const next = focusNext(container, link1, false);
        expect(next).toBeNull();
      });
    });

    describe('focusPrevious', () => {
      it('should focus the previous element', () => {
        const input1 = container.querySelector('#input1') as HTMLElement;
        input1.focus();
        const prev = focusPrevious(container, input1);
        expect(prev?.id).toBe('btn1');
      });

      it('should wrap to last when at start', () => {
        const btn1 = container.querySelector('#btn1') as HTMLElement;
        btn1.focus();
        const prev = focusPrevious(container, btn1, true);
        expect(prev?.id).toBe('link1');
      });
    });

    describe('setRovingTabIndex', () => {
      it('should set tabindex=0 on active element', () => {
        setRovingTabIndex(container, 1);
        const focusable = getFocusableElements(container);
        expect(focusable[0].getAttribute('tabindex')).toBe('-1');
        expect(focusable[1].getAttribute('tabindex')).toBe('0');
        expect(focusable[2].getAttribute('tabindex')).toBe('-1');
      });
    });
  });

  describe('handleListKeyDown', () => {
    let container: HTMLDivElement;
    let onFocusChange: ReturnType<typeof vi.fn>;

    beforeEach(() => {
      container = document.createElement('div');
      container.innerHTML = `
        <button id="item1">Item 1</button>
        <button id="item2">Item 2</button>
        <button id="item3">Item 3</button>
      `;
      document.body.appendChild(container);
      onFocusChange = vi.fn();
    });

    afterEach(() => {
      document.body.removeChild(container);
    });

    it('should handle ArrowDown in vertical mode', () => {
      const item1 = container.querySelector('#item1') as HTMLElement;
      item1.focus();

      const event = new KeyboardEvent('keydown', { key: 'ArrowDown' });
      handleListKeyDown(event, container, {
        direction: 'vertical',
        onFocusChange,
      });

      expect(document.activeElement?.id).toBe('item2');
      expect(onFocusChange).toHaveBeenCalledWith(1, expect.any(HTMLElement));
    });

    it('should handle ArrowRight in horizontal mode', () => {
      const item1 = container.querySelector('#item1') as HTMLElement;
      item1.focus();

      const event = new KeyboardEvent('keydown', { key: 'ArrowRight' });
      handleListKeyDown(event, container, {
        direction: 'horizontal',
        onFocusChange,
      });

      expect(document.activeElement?.id).toBe('item2');
    });

    it('should handle Home key', () => {
      const item3 = container.querySelector('#item3') as HTMLElement;
      item3.focus();

      const event = new KeyboardEvent('keydown', { key: 'Home' });
      handleListKeyDown(event, container, { homeEnd: true });

      expect(document.activeElement?.id).toBe('item1');
    });

    it('should handle End key', () => {
      const item1 = container.querySelector('#item1') as HTMLElement;
      item1.focus();

      const event = new KeyboardEvent('keydown', { key: 'End' });
      handleListKeyDown(event, container, { homeEnd: true });

      expect(document.activeElement?.id).toBe('item3');
    });
  });

  describe('handleTabListKeyDown', () => {
    let tabList: HTMLDivElement;
    let onTabChange: ReturnType<typeof vi.fn>;

    beforeEach(() => {
      tabList = document.createElement('div');
      tabList.setAttribute('role', 'tablist');
      tabList.innerHTML = `
        <button role="tab" id="tab1">Tab 1</button>
        <button role="tab" id="tab2">Tab 2</button>
        <button role="tab" id="tab3">Tab 3</button>
      `;
      document.body.appendChild(tabList);
      onTabChange = vi.fn();
    });

    afterEach(() => {
      document.body.removeChild(tabList);
    });

    it('should handle ArrowRight', () => {
      const tab1 = tabList.querySelector('#tab1') as HTMLElement;
      tab1.focus();

      const event = new KeyboardEvent('keydown', { key: 'ArrowRight' });
      handleTabListKeyDown(event, tabList, onTabChange);

      expect(document.activeElement?.id).toBe('tab2');
      expect(onTabChange).toHaveBeenCalledWith(1);
    });

    it('should handle ArrowLeft', () => {
      const tab2 = tabList.querySelector('#tab2') as HTMLElement;
      tab2.focus();

      const event = new KeyboardEvent('keydown', { key: 'ArrowLeft' });
      handleTabListKeyDown(event, tabList, onTabChange);

      expect(document.activeElement?.id).toBe('tab1');
      expect(onTabChange).toHaveBeenCalledWith(0);
    });

    it('should wrap from last to first', () => {
      const tab3 = tabList.querySelector('#tab3') as HTMLElement;
      tab3.focus();

      const event = new KeyboardEvent('keydown', { key: 'ArrowRight' });
      handleTabListKeyDown(event, tabList, onTabChange);

      expect(document.activeElement?.id).toBe('tab1');
      expect(onTabChange).toHaveBeenCalledWith(0);
    });

    it('should wrap from first to last', () => {
      const tab1 = tabList.querySelector('#tab1') as HTMLElement;
      tab1.focus();

      const event = new KeyboardEvent('keydown', { key: 'ArrowLeft' });
      handleTabListKeyDown(event, tabList, onTabChange);

      expect(document.activeElement?.id).toBe('tab3');
      expect(onTabChange).toHaveBeenCalledWith(2);
    });
  });
});
