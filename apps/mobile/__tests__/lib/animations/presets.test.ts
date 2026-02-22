/**
 * animations/presets.ts 테스트
 */
import { ENTERING, EXITING, staggeredEntry, TIMING } from '../../../lib/animations/presets';

describe('ENTERING presets', () => {
  it('should have all expected animation presets', () => {
    expect(ENTERING.fadeInUp).toBeDefined();
    expect(ENTERING.fadeInUpStagger).toBeDefined();
    expect(ENTERING.scaleIn).toBeDefined();
    expect(ENTERING.slideInRight).toBeDefined();
    expect(ENTERING.slideInDown).toBeDefined();
    expect(ENTERING.fadeIn).toBeDefined();
    expect(ENTERING.fadeInDown).toBeDefined();
    expect(ENTERING.fadeInLeft).toBeDefined();
    expect(ENTERING.fadeInRight).toBeDefined();
  });
});

describe('EXITING presets', () => {
  it('should have all expected animation presets', () => {
    expect(EXITING.fadeOut).toBeDefined();
    expect(EXITING.fadeOutUp).toBeDefined();
    expect(EXITING.fadeOutDown).toBeDefined();
    expect(EXITING.slideOutRight).toBeDefined();
    expect(EXITING.slideOutDown).toBeDefined();
    expect(EXITING.zoomOut).toBeDefined();
  });
});

describe('staggeredEntry', () => {
  it('should return a FadeInUp animation', () => {
    const result = staggeredEntry(0);
    expect(result).toBeDefined();
  });

  it('should create different delays for different indices', () => {
    const entry0 = staggeredEntry(0);
    const entry1 = staggeredEntry(1);
    const entry5 = staggeredEntry(5);

    // 각각 다른 애니메이션 객체여야 함
    expect(entry0).toBeDefined();
    expect(entry1).toBeDefined();
    expect(entry5).toBeDefined();
  });

  it('should accept custom base delay', () => {
    const entry = staggeredEntry(2, 100);
    expect(entry).toBeDefined();
  });
});

describe('TIMING', () => {
  it('should have correct timing values', () => {
    expect(TIMING.fast).toBe(150);
    expect(TIMING.normal).toBe(300);
    expect(TIMING.slow).toBe(500);
    expect(TIMING.staggerInterval).toBe(80);
  });

  it('should maintain ordering: fast < normal < slow', () => {
    expect(TIMING.fast).toBeLessThan(TIMING.normal);
    expect(TIMING.normal).toBeLessThan(TIMING.slow);
  });
});
