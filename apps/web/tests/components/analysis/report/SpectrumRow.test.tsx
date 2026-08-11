/**
 * SpectrumRow 테스트 — 뮤트 단색 스펙트럼 행 프리미티브 (신호등 게이지 대체)
 */
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { Droplets } from 'lucide-react';
import { RowTable, SpectrumRow } from '@/components/analysis/report';

describe('SpectrumRow', () => {
  it('라벨과 상태 텍스트를 렌더한다', () => {
    render(
      <RowTable>
        <SpectrumRow label="유분" pos={0.6} status="보통" testId="row-oil" />
      </RowTable>
    );

    expect(screen.getByText('유분')).toBeInTheDocument();
    expect(screen.getByText('보통')).toBeInTheDocument();
  });

  it('위치 마커를 pos 비율 지점에 놓는다', () => {
    render(
      <RowTable>
        <SpectrumRow label="수분" pos={0.5} status="양호" testId="row-hydration" />
      </RowTable>
    );

    const track = screen.getByTestId('row-hydration-track');
    const marker = track.firstElementChild as HTMLElement;
    expect(marker.style.left).toBe('calc(50% - 4.5px)');
  });

  it('범위 밖 pos는 0~1로 클램프한다 (트랙 이탈 방지)', () => {
    render(
      <RowTable>
        <SpectrumRow label="탄력" pos={1.7} status="컨디션 82점 · 양호" testId="row-elastic" />
      </RowTable>
    );

    const track = screen.getByTestId('row-elastic-track');
    const marker = track.firstElementChild as HTMLElement;
    expect(marker.style.left).toBe('calc(100% - 4.5px)');
  });

  it('트랙이 progressbar를 소유하고, aria-label에 상태어를 싣는다', () => {
    render(
      <RowTable>
        <SpectrumRow label="두피" pos={0.38} status="38점 · 집중 케어" testId="row-scalp" />
      </RowTable>
    );

    const track = screen.getByTestId('row-scalp-track');
    expect(track).toHaveAttribute('role', 'progressbar');
    // 상태어가 접근 가능한 이름에 포함돼야 보조기기에서 "38점 · 집중 케어"가 사라지지 않는다
    expect(track).toHaveAttribute('aria-label', '두피: 38점 · 집중 케어');
    expect(track).toHaveAttribute('aria-valuenow', '38');
    expect(track).toHaveAttribute('aria-valuemin', '0');
    expect(track).toHaveAttribute('aria-valuemax', '100');
    // 트랙은 더 이상 aria-hidden이 아니다(장식 마커만 숨긴다)
    expect(track).not.toHaveAttribute('aria-hidden');
  });

  it('상태 텍스트는 progressbar 바깥 DD로 남는다 (children-presentational 소실 방지)', () => {
    render(
      <RowTable>
        <SpectrumRow label="두피" pos={0.3} status="집중 케어" testId="row-scalp-text" />
      </RowTable>
    );

    const status = screen.getByText('집중 케어');
    expect(status.tagName).toBe('DD');
    // progressbar 서브트리 안에 있으면 presentational로 접혀 읽히지 않는다
    expect(status.closest('[role="progressbar"]')).toBeNull();
    expect(screen.getByText('두피').closest('[role="progressbar"]')).toBeNull();
  });

  it('범위 밖 pos의 aria-valuenow도 0~100으로 클램프된다', () => {
    render(
      <RowTable>
        <SpectrumRow label="탄력" pos={1.7} status="양호" testId="row-clamp-aria" />
      </RowTable>
    );

    expect(screen.getByTestId('row-clamp-aria-track')).toHaveAttribute('aria-valuenow', '100');
  });

  it('아이콘이 있으면 AttrRow와 동일한 24px 원형 앵커 컨테이너에 담는다', () => {
    render(
      <RowTable>
        <SpectrumRow icon={Droplets} label="수분" pos={0.5} status="양호" testId="row-icon" />
      </RowTable>
    );

    const row = screen.getByTestId('row-icon');
    // 앵커 컨테이너 규격 — h-6 w-6(24px) 원형 + 크림 지면 틴트 (AttrRow 문법 공유)
    const anchor = row.querySelector('span.h-6.w-6');
    expect(anchor).not.toBeNull();
    expect(anchor).toHaveClass('rounded-full', 'bg-surface-ground');
    expect(anchor).toHaveAttribute('aria-hidden', 'true');
    // 아이콘은 앵커 안에 담긴다 (setup.ts가 lucide를 span[data-testid=lucide-*]로 mock)
    expect(anchor?.querySelector('[data-testid="lucide-droplets"]')).not.toBeNull();
  });

  it('아이콘이 없으면 앵커 컨테이너 없이 라벨부터 시작한다', () => {
    render(
      <RowTable>
        <SpectrumRow label="유분" pos={0.4} status="보통" testId="row-no-icon" />
      </RowTable>
    );

    expect(screen.getByTestId('row-no-icon').querySelector('span.h-6.w-6')).toBeNull();
  });

  it('신호등 상태색 클래스를 사용하지 않는다 (ADR-120 금지 패턴)', () => {
    render(
      <RowTable>
        <SpectrumRow label="모발" pos={0.9} status="양호" testId="row-hair" />
      </RowTable>
    );

    const row = screen.getByTestId('row-hair');
    expect(row.innerHTML).not.toMatch(/(?:text|bg)-(?:red|green|amber)-/);
  });
});
