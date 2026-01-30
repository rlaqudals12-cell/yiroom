/**
 * 포커스 트랩 테스트
 *
 * @see lib/a11y/focus-trap.ts
 * @see docs/specs/SDD-ACCESSIBILITY-GUIDELINES.md - A11Y-A4
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { createFocusTrap, trapFocus } from '@/lib/a11y/focus-trap';

describe('focus-trap', () => {
  let container: HTMLDivElement;
  let outsideButton: HTMLButtonElement;

  beforeEach(() => {
    // 외부 버튼 (트랩 외부)
    outsideButton = document.createElement('button');
    outsideButton.id = 'outside';
    outsideButton.textContent = 'Outside';
    document.body.appendChild(outsideButton);

    // 트랩 컨테이너
    container = document.createElement('div');
    container.id = 'trap-container';
    container.innerHTML = `
      <button id="btn1">Button 1</button>
      <input id="input1" type="text" placeholder="Input" />
      <button id="btn2">Button 2</button>
    `;
    document.body.appendChild(container);
  });

  afterEach(() => {
    document.body.innerHTML = '';
  });

  describe('createFocusTrap', () => {
    it('should create a focus trap instance', () => {
      const trap = createFocusTrap(container);

      expect(trap).toBeDefined();
      expect(typeof trap.activate).toBe('function');
      expect(typeof trap.deactivate).toBe('function');
      expect(typeof trap.isActive).toBe('function');
      expect(typeof trap.pause).toBe('function');
      expect(typeof trap.unpause).toBe('function');
    });

    it('should not be active initially', () => {
      const trap = createFocusTrap(container);
      expect(trap.isActive()).toBe(false);
    });

    it('should become active when activated', () => {
      const trap = createFocusTrap(container);
      trap.activate();
      expect(trap.isActive()).toBe(true);
    });

    it('should become inactive when deactivated', () => {
      const trap = createFocusTrap(container);
      trap.activate();
      trap.deactivate();
      expect(trap.isActive()).toBe(false);
    });

    it('should focus first element on activate', async () => {
      const trap = createFocusTrap(container);
      trap.activate();

      // requestAnimationFrame 대기
      await new Promise((resolve) => requestAnimationFrame(resolve));

      expect(document.activeElement?.id).toBe('btn1');
      trap.deactivate();
    });

    it('should focus initial focus element if specified', async () => {
      const trap = createFocusTrap(container, {
        initialFocus: '#input1',
      });
      trap.activate();

      await new Promise((resolve) => requestAnimationFrame(resolve));

      expect(document.activeElement?.id).toBe('input1');
      trap.deactivate();
    });

    it('should return focus to previous element on deactivate', async () => {
      outsideButton.focus();
      expect(document.activeElement?.id).toBe('outside');

      const trap = createFocusTrap(container);
      trap.activate();

      await new Promise((resolve) => requestAnimationFrame(resolve));
      expect(document.activeElement?.id).toBe('btn1');

      trap.deactivate();

      await new Promise((resolve) => requestAnimationFrame(resolve));
      expect(document.activeElement?.id).toBe('outside');
    });

    it('should call onDeactivate callback', () => {
      const onDeactivate = vi.fn();
      const trap = createFocusTrap(container, { onDeactivate });

      trap.activate();
      trap.deactivate();

      expect(onDeactivate).toHaveBeenCalled();
    });

    it('should trap Tab key at end of container', async () => {
      const trap = createFocusTrap(container);
      trap.activate();

      await new Promise((resolve) => requestAnimationFrame(resolve));

      // 마지막 요소로 포커스 이동
      const btn2 = container.querySelector('#btn2') as HTMLElement;
      btn2.focus();

      // Tab 키 시뮬레이션
      const tabEvent = new KeyboardEvent('keydown', {
        key: 'Tab',
        bubbles: true,
      });
      const preventDefaultSpy = vi.spyOn(tabEvent, 'preventDefault');
      document.dispatchEvent(tabEvent);

      // 첫 번째 요소로 이동해야 함
      expect(document.activeElement?.id).toBe('btn1');
      expect(preventDefaultSpy).toHaveBeenCalled();

      trap.deactivate();
    });

    it('should trap Shift+Tab key at start of container', async () => {
      const trap = createFocusTrap(container);
      trap.activate();

      await new Promise((resolve) => requestAnimationFrame(resolve));

      // 첫 번째 요소에서 Shift+Tab
      const btn1 = container.querySelector('#btn1') as HTMLElement;
      btn1.focus();

      const shiftTabEvent = new KeyboardEvent('keydown', {
        key: 'Tab',
        shiftKey: true,
        bubbles: true,
      });
      const preventDefaultSpy = vi.spyOn(shiftTabEvent, 'preventDefault');
      document.dispatchEvent(shiftTabEvent);

      // 마지막 요소로 이동해야 함
      expect(document.activeElement?.id).toBe('btn2');
      expect(preventDefaultSpy).toHaveBeenCalled();

      trap.deactivate();
    });

    it('should deactivate on Escape key when escapeDeactivates is true', async () => {
      const onDeactivate = vi.fn();
      const trap = createFocusTrap(container, {
        escapeDeactivates: true,
        onDeactivate,
      });

      trap.activate();
      await new Promise((resolve) => requestAnimationFrame(resolve));

      const escapeEvent = new KeyboardEvent('keydown', {
        key: 'Escape',
        bubbles: true,
      });
      document.dispatchEvent(escapeEvent);

      expect(trap.isActive()).toBe(false);
      expect(onDeactivate).toHaveBeenCalled();
    });

    it('should not deactivate on Escape when escapeDeactivates is false', async () => {
      const trap = createFocusTrap(container, {
        escapeDeactivates: false,
      });

      trap.activate();
      await new Promise((resolve) => requestAnimationFrame(resolve));

      const escapeEvent = new KeyboardEvent('keydown', {
        key: 'Escape',
        bubbles: true,
      });
      document.dispatchEvent(escapeEvent);

      expect(trap.isActive()).toBe(true);
      trap.deactivate();
    });

    it('should pause and unpause', async () => {
      const trap = createFocusTrap(container);
      trap.activate();

      await new Promise((resolve) => requestAnimationFrame(resolve));

      trap.pause();

      // pause 상태에서는 Tab 트랩이 동작하지 않아야 함
      const btn2 = container.querySelector('#btn2') as HTMLElement;
      btn2.focus();

      const tabEvent = new KeyboardEvent('keydown', {
        key: 'Tab',
        bubbles: true,
      });
      document.dispatchEvent(tabEvent);

      // pause 상태에서는 포커스가 이동하지 않음 (기본 Tab 동작)
      // jsdom에서는 실제 Tab 이동이 시뮬레이션되지 않으므로 btn2 유지
      expect(trap.isActive()).toBe(true);

      trap.unpause();
      trap.deactivate();
    });
  });

  describe('trapFocus (functional)', () => {
    it('should trap focus on Tab at end', () => {
      const btn2 = container.querySelector('#btn2') as HTMLElement;
      btn2.focus();

      const tabEvent = new KeyboardEvent('keydown', {
        key: 'Tab',
        bubbles: true,
      });
      const preventDefaultSpy = vi.spyOn(tabEvent, 'preventDefault');

      trapFocus(tabEvent, container);

      expect(document.activeElement?.id).toBe('btn1');
      expect(preventDefaultSpy).toHaveBeenCalled();
    });

    it('should trap focus on Shift+Tab at start', () => {
      const btn1 = container.querySelector('#btn1') as HTMLElement;
      btn1.focus();

      const shiftTabEvent = new KeyboardEvent('keydown', {
        key: 'Tab',
        shiftKey: true,
        bubbles: true,
      });
      const preventDefaultSpy = vi.spyOn(shiftTabEvent, 'preventDefault');

      trapFocus(shiftTabEvent, container);

      expect(document.activeElement?.id).toBe('btn2');
      expect(preventDefaultSpy).toHaveBeenCalled();
    });

    it('should not prevent default for other keys', () => {
      const btn1 = container.querySelector('#btn1') as HTMLElement;
      btn1.focus();

      const enterEvent = new KeyboardEvent('keydown', {
        key: 'Enter',
        bubbles: true,
      });
      const preventDefaultSpy = vi.spyOn(enterEvent, 'preventDefault');

      trapFocus(enterEvent, container);

      expect(preventDefaultSpy).not.toHaveBeenCalled();
    });

    it('should allow Tab in middle of container', () => {
      const input1 = container.querySelector('#input1') as HTMLElement;
      input1.focus();

      const tabEvent = new KeyboardEvent('keydown', {
        key: 'Tab',
        bubbles: true,
      });
      const preventDefaultSpy = vi.spyOn(tabEvent, 'preventDefault');

      trapFocus(tabEvent, container);

      // 중간 요소에서는 preventDefault 호출 안 함
      expect(preventDefaultSpy).not.toHaveBeenCalled();
    });
  });
});
