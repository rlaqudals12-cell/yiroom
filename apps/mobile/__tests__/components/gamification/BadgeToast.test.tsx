import { render } from '@testing-library/react-native';

import { BadgeToast } from '@/components/gamification/BadgeToast';
import type { Badge } from '@/types/gamification';

const BADGE: Badge = {
  id: 'badge-1',
  code: 'first-analysis',
  name: '첫 분석',
  description: '첫 분석을 완료했어요.',
  icon: '★',
  category: 'analysis',
  rarity: 'common',
  requirement: { type: 'complete', domain: 'analysis', module: 'skin' },
  xpReward: 10,
  sortOrder: 1,
  createdAt: new Date('2026-08-18T00:00:00.000Z'),
};

interface TestRendererNode {
  type: string;
  children: Array<TestRendererNode | string>;
}

function collectHostTypes(node: TestRendererNode | TestRendererNode[] | null): string[] {
  if (!node) return [];
  if (Array.isArray(node)) return node.flatMap(collectHostTypes);

  return [
    node.type,
    ...node.children.flatMap((child: TestRendererNode | string) =>
      typeof child === 'string' ? [] : collectHostTypes(child)
    ),
  ];
}

describe('BadgeToast', () => {
  it('React Native 호스트 컴포넌트만 렌더링한다', () => {
    const rendered = render(<BadgeToast badge={BADGE} />);

    expect(rendered.getByTestId('badge-toast')).toBeTruthy();
    expect(collectHostTypes(rendered.toJSON() as TestRendererNode)).not.toEqual(
      expect.arrayContaining(['div', 'span'])
    );
    expect(rendered.getByText('첫 분석')).toBeTruthy();
  });
});
