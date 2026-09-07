import { readFile } from 'node:fs/promises';
import { render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import MethodologyPage, { metadata } from '@/app/methodology/page';
import { getMethodologyDocuments, passesMedicalExpressionScan } from '@/app/methodology/documents';
import { PrincipleDocument } from '@/app/methodology/PrincipleDocument';

vi.mock('node:fs/promises', () => {
  const readFile = vi.fn();
  return { readFile, default: { readFile } };
});
afterEach(() => vi.resetAllMocks());

describe('방법론 공개 범위', () => {
  it.each([
    '치료',
    '진단',
    '질환',
    '시술',
    '의료',
    '병원',
    '의원',
    '여드름',
    '아토피',
    '개선 효과',
    'medical',
    'diagnosis',
    'treatment',
    'ACNE',
  ])('%s 원문은 공개하지 않는다', (term) => {
    expect(passesMedicalExpressionScan(`# 원리\n${term}`)).toBe(false);
  });

  it('빈 원문도 통과시키지 않는다', () => expect(passesMedicalExpressionScan('  ')).toBe(false));

  it('고정 허용 문서만 읽고 의료 표현이 있으면 목록과 본문에서 제외한다', async () => {
    vi.mocked(readFile).mockResolvedValue('# 피부 치료');
    expect(await getMethodologyDocuments()).toEqual([]);
    expect(readFile).toHaveBeenCalledTimes(1);
    expect(vi.mocked(readFile).mock.calls[0][0].toString()).toMatch(/personal-contrast\.md$/);
  });

  it('읽기 실패를 빈 상태와 홈 CTA로 표현한다', async () => {
    vi.mocked(readFile).mockRejectedValue(new Error('missing'));
    render(await MethodologyPage());
    expect(screen.getByTestId('methodology-empty')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: '이룸 홈으로' })).toHaveAttribute('href', '/');
  });

  it('검토 문서를 목차와 읽기 전용 본문으로 렌더하고 noindex를 선언한다', async () => {
    vi.mocked(readFile).mockResolvedValue('# 퍼스널 대비 원리\n\n명도 차이를 해석해요.');
    render(await MethodologyPage());
    expect(screen.getByRole('link', { name: '퍼스널 대비 원리' })).toHaveAttribute(
      'href',
      '#personal-contrast'
    );
    expect(screen.getByRole('heading', { name: '퍼스널 대비 원리' })).toBeInTheDocument();
    expect(screen.getByText('명도 차이를 해석해요.')).toBeInTheDocument();
    expect(metadata.robots).toEqual({ index: false, follow: false });
  });
});

describe('원리 서식 렌더링', () => {
  it('제목·강조·인라인코드·목록·표·코드블록을 안전하게 표시한다', () => {
    const { container } = render(
      <PrincipleDocument
        markdown={
          '# 제목\n**강조**와 `값`\n- 항목\n1. 순서\n| 열 |\n| --- |\n| 셀 |\n```\n공식\n```\n> 인용\n---\n[내부 문서](../../private.md)\n<script>alert(1)</script>'
        }
      />
    );
    expect(screen.getByRole('heading', { name: '제목' })).toBeInTheDocument();
    expect(container.querySelector('strong')).toHaveTextContent('강조');
    expect(screen.getAllByRole('list')).toHaveLength(2);
    expect(screen.getByRole('cell')).toHaveTextContent('셀');
    expect(container.querySelector('pre')).toHaveTextContent('공식');
    expect(container.querySelector('blockquote')).toHaveTextContent('인용');
    expect(container.querySelector('script')).toBeNull();
    expect(container.querySelector('a')).toBeNull();
    expect(screen.getByText('<script>alert(1)</script>')).toBeInTheDocument();
  });
});
