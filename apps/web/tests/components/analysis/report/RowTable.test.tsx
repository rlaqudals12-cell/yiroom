/**
 * RowTable / AttrRow 테스트 — 진단 속성표 프리미티브
 */
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { Leaf } from 'lucide-react';
import { RowTable, AttrRow } from '@/components/analysis/report';

describe('RowTable', () => {
  it('testId가 지정된 dl로 행들을 감싼다', () => {
    render(
      <RowTable testId="report-attrs">
        <AttrRow label="계절" value="봄 웜톤" />
      </RowTable>
    );

    const table = screen.getByTestId('report-attrs');
    expect(table.tagName).toBe('DL');
    expect(table).toHaveClass('divide-y', 'divide-border');
  });
});

describe('AttrRow', () => {
  it('라벨과 값을 dt/dd로 렌더한다', () => {
    render(
      <RowTable>
        <AttrRow label="언더톤" value="웜 (옐로 베이스)" />
      </RowTable>
    );

    const label = screen.getByText('언더톤');
    const value = screen.getByText('웜 (옐로 베이스)');
    expect(label.tagName).toBe('DT');
    expect(value.tagName).toBe('DD');
  });

  it('아이콘이 지정되면 라인아트 앵커를 렌더한다', () => {
    render(
      <RowTable>
        <AttrRow icon={Leaf} label="계절" value="가을 웜톤" />
      </RowTable>
    );

    // setup.ts 글로벌 lucide mock: testid = lucide-{name}
    expect(screen.getByTestId('lucide-leaf')).toBeInTheDocument();
  });

  it('아이콘이 없으면 라벨부터 시작한다', () => {
    render(
      <RowTable>
        <AttrRow label="계절" value="여름 쿨톤" />
      </RowTable>
    );

    expect(screen.queryByTestId('lucide-leaf')).not.toBeInTheDocument();
    expect(screen.getByText('계절')).toBeInTheDocument();
  });
});
