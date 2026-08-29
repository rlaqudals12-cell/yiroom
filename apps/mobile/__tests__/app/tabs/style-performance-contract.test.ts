import { readFileSync } from 'node:fs';
import { join } from 'node:path';

describe('스타일 탭 옷장 매칭 성능 계약', () => {
  it('옷장 조합 스캔을 안정된 매처 참조 기준으로 메모한다', () => {
    const source = readFileSync(join(process.cwd(), 'app/(tabs)/style.tsx'), 'utf8');

    expect(source).toContain(
      'useMemo(() => getOutfitSuggestion(), [getOutfitSuggestion])'
    );
  });
});
