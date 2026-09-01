import { describe, expect, it } from 'vitest';
import { detectScannedProductColor } from '@/lib/scan/product-metadata';

describe('detectScannedProductColor', () => {
  it('제품명에 실제 표기된 6자리 HEX를 그대로 보존한다', () => {
    expect(detectScannedProductColor('코랄 립틴트 #87CEEB')).toBe('#87CEEB');
  });

  it('한글·영문 색 이름은 정성 참고용 이름만 보존한다', () => {
    expect(detectScannedProductColor('코랄 립틴트')).toBe('코랄');
    expect(detectScannedProductColor('Rose Lipstick')).toBe('rose');
  });

  it('3자리 HEX와 미분류 제품명은 색 메타데이터를 만들지 않는다', () => {
    expect(detectScannedProductColor('코랄 립틴트 #abc')).toBeUndefined();
    expect(detectScannedProductColor('루비우 13호')).toBeUndefined();
  });
});
