/**
 * ARIA 유틸리티 테스트
 *
 * @see lib/a11y/aria-utils.ts
 */
import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import {
  generateId,
  resetIdCounter,
  announce,
  announceAnalysisComplete,
  announceProgress,
  announceError,
  createLabelledBy,
  createDescribedBy,
  getAnalysisCardAriaProps,
  getConfidenceLevel,
  getSrOnlyProps,
  SR_ONLY_CLASS,
} from '@/lib/a11y/aria-utils';

describe('aria-utils', () => {
  describe('generateId', () => {
    beforeEach(() => {
      resetIdCounter();
    });

    it('should generate unique IDs with prefix', () => {
      const id1 = generateId('test');
      const id2 = generateId('test');
      const id3 = generateId('other');

      expect(id1).toBe('test-1');
      expect(id2).toBe('test-2');
      expect(id3).toBe('other-3');
    });

    it('should reset counter correctly', () => {
      generateId('test');
      generateId('test');
      resetIdCounter();

      const id = generateId('test');
      expect(id).toBe('test-1');
    });
  });

  describe('announce', () => {
    let mockDocument: { getElementById: ReturnType<typeof vi.fn>; createElement: ReturnType<typeof vi.fn>; body: { appendChild: ReturnType<typeof vi.fn> } };
    let mockLiveRegion: { id: string; setAttribute: ReturnType<typeof vi.fn>; className: string; textContent: string };

    beforeEach(() => {
      mockLiveRegion = {
        id: '',
        setAttribute: vi.fn(),
        className: '',
        textContent: '',
      };

      mockDocument = {
        getElementById: vi.fn().mockReturnValue(null),
        createElement: vi.fn().mockReturnValue(mockLiveRegion),
        body: {
          appendChild: vi.fn(),
        },
      };

      vi.stubGlobal('document', mockDocument);
      vi.stubGlobal('requestAnimationFrame', (cb: FrameRequestCallback) => {
        cb(0);
        return 0;
      });
    });

    afterEach(() => {
      vi.unstubAllGlobals();
    });

    it('should create live region if not exists', () => {
      announce('Test message');

      expect(mockDocument.createElement).toHaveBeenCalledWith('div');
      expect(mockLiveRegion.setAttribute).toHaveBeenCalledWith('role', 'status');
      expect(mockLiveRegion.setAttribute).toHaveBeenCalledWith('aria-live', 'polite');
      expect(mockLiveRegion.setAttribute).toHaveBeenCalledWith('aria-atomic', 'true');
    });

    it('should use assertive priority when specified', () => {
      announce('Urgent message', 'assertive');

      expect(mockLiveRegion.id).toBe('a11y-live-assertive');
      expect(mockLiveRegion.setAttribute).toHaveBeenCalledWith('aria-live', 'assertive');
    });

    it('should set message content', () => {
      announce('Test message');

      expect(mockLiveRegion.textContent).toBe('Test message');
    });

    it('should reuse existing live region', () => {
      const existingRegion = { textContent: '' };
      mockDocument.getElementById.mockReturnValue(existingRegion);

      announce('Test message');

      expect(mockDocument.createElement).not.toHaveBeenCalled();
      expect(existingRegion.textContent).toBe('Test message');
    });
  });

  describe('announceAnalysisComplete', () => {
    let announceMessages: string[];
    let existingRegion: { textContent: string };

    beforeEach(() => {
      announceMessages = [];
      existingRegion = {
        get textContent() { return ''; },
        set textContent(val: string) { if (val) announceMessages.push(val); },
      } as { textContent: string };

      vi.stubGlobal('document', {
        getElementById: vi.fn().mockReturnValue(existingRegion),
        createElement: vi.fn().mockReturnValue({
          id: '',
          setAttribute: vi.fn(),
          className: '',
          get textContent() { return ''; },
          set textContent(val: string) { if (val) announceMessages.push(val); },
        }),
        body: { appendChild: vi.fn() },
      });
      vi.stubGlobal('requestAnimationFrame', (cb: FrameRequestCallback) => { cb(0); return 0; });
    });

    afterEach(() => {
      vi.unstubAllGlobals();
    });

    it('should announce skin analysis complete', () => {
      announceAnalysisComplete('skin', false);
      expect(announceMessages).toContain('피부 분석 결과가 준비되었습니다.');
    });

    it('should announce personal-color analysis complete', () => {
      announceAnalysisComplete('personal-color', false);
      expect(announceMessages).toContain('퍼스널컬러 분석 결과가 준비되었습니다.');
    });

    it('should include fallback notice when usedFallback is true', () => {
      announceAnalysisComplete('body', true);
      expect(announceMessages).toContain(
        '체형 분석 결과가 준비되었습니다. 현재 샘플 데이터를 표시하고 있습니다.'
      );
    });
  });

  describe('announceProgress', () => {
    let announceMessages: string[];
    let existingRegion: { textContent: string };

    beforeEach(() => {
      announceMessages = [];
      existingRegion = {
        get textContent() { return ''; },
        set textContent(val: string) { if (val) announceMessages.push(val); },
      } as { textContent: string };

      vi.stubGlobal('document', {
        getElementById: vi.fn().mockReturnValue(existingRegion),
        createElement: vi.fn().mockReturnValue({
          id: '',
          setAttribute: vi.fn(),
          className: '',
          get textContent() { return ''; },
          set textContent(val: string) { if (val) announceMessages.push(val); },
        }),
        body: { appendChild: vi.fn() },
      });
      vi.stubGlobal('requestAnimationFrame', (cb: FrameRequestCallback) => { cb(0); return 0; });
    });

    afterEach(() => {
      vi.unstubAllGlobals();
    });

    it('should announce progress with percentage only', () => {
      announceProgress(50);
      expect(announceMessages).toContain('분석 진행 중: 50% 완료');
    });

    it('should announce progress with stage description', () => {
      announceProgress(75, '이미지 분석');
      expect(announceMessages).toContain('분석 진행 중: 이미지 분석 (75% 완료)');
    });
  });

  describe('createLabelledBy', () => {
    it('should return correct props', () => {
      const props = createLabelledBy('my-title');

      expect(props.id).toBe('my-title');
      expect(props['aria-labelledby']).toBe('my-title');
    });
  });

  describe('createDescribedBy', () => {
    it('should return correct props', () => {
      const props = createDescribedBy('my-description');

      expect(props.id).toBe('my-description');
      expect(props['aria-describedby']).toBe('my-description');
    });
  });

  describe('getAnalysisCardAriaProps', () => {
    it('should return article role', () => {
      const props = getAnalysisCardAriaProps({ analysisType: 'skin' });

      expect(props.role).toBe('article');
      expect(props['data-testid']).toBe('analysis-result-card');
    });

    it('should use aria-labelledby when title exists', () => {
      const props = getAnalysisCardAriaProps({
        analysisType: 'skin',
        titleId: 'skin-title',
        hasTitle: true,
      });

      expect(props['aria-labelledby']).toBe('skin-title');
      expect(props['aria-label']).toBeUndefined();
    });

    it('should use aria-label when no title', () => {
      const props = getAnalysisCardAriaProps({
        analysisType: 'personal-color',
      });

      expect(props['aria-label']).toBe('AI 퍼스널컬러 분석 결과');
      expect(props['aria-labelledby']).toBeUndefined();
    });

    it('should set aria-busy when loading', () => {
      const props = getAnalysisCardAriaProps({
        analysisType: 'body',
        isLoading: true,
      });

      expect(props['aria-busy']).toBe(true);
    });

    it('should return generic label for unknown type', () => {
      const props = getAnalysisCardAriaProps({
        analysisType: 'unknown-type',
      });

      expect(props['aria-label']).toBe('AI 분석 결과');
    });
  });

  describe('getConfidenceLevel', () => {
    it('should return high level for 80+', () => {
      const result = getConfidenceLevel(85);

      expect(result.level).toBe('high');
      expect(result.label).toBe('높음');
      expect(result.description).toContain('높습니다');
      expect(result.description).toContain('85%');
    });

    it('should return high level for exactly 80', () => {
      const result = getConfidenceLevel(80);

      expect(result.level).toBe('high');
    });

    it('should return medium level for 60-79', () => {
      const result = getConfidenceLevel(70);

      expect(result.level).toBe('medium');
      expect(result.label).toBe('중간');
      expect(result.description).toContain('중간입니다');
    });

    it('should return low level for below 60', () => {
      const result = getConfidenceLevel(45);

      expect(result.level).toBe('low');
      expect(result.label).toBe('낮음');
      expect(result.description).toContain('낮습니다');
      expect(result.description).toContain('참고용');
    });
  });

  describe('getSrOnlyProps', () => {
    it('should return sr-only class', () => {
      const props = getSrOnlyProps();

      expect(props.className).toBe(SR_ONLY_CLASS);
      expect(props.className).toBe('sr-only');
    });
  });

  describe('SR_ONLY_CLASS', () => {
    it('should be sr-only', () => {
      expect(SR_ONLY_CLASS).toBe('sr-only');
    });
  });
});
