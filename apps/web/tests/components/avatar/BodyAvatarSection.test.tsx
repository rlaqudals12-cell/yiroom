/**
 * AV-5: BodyAvatarSection 테스트 — 폴백/토글 분기
 * (3D 캔버스 자체는 WebGL 필요 — jsdom에서는 dynamic 로딩 상태로 남아 분기 로직만 검증)
 */

import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { BodyAvatarSection } from '@/components/avatar/BodyAvatarSection';
import type { BodyRowForAvatar } from '@/lib/avatar';

// next/dynamic — jsdom에서 3D 청크 로드 없이 null 렌더
vi.mock('next/dynamic', () => ({
  default: () => {
    const Noop = (): null => null;
    return Noop;
  },
}));

const ROW: BodyRowForAvatar = {
  body_type: 'W',
  ratio: 1.15,
  shoulder: null,
  waist: null,
  hip: null,
};

describe('BodyAvatarSection', () => {
  it('row가 없으면 2D 실루엣 폴백을 렌더한다 (라벨에 짧은 풀이 병기)', () => {
    render(<BodyAvatarSection row={null} bodyType="S" label="스트레이트" />);
    expect(screen.getByTestId('body-avatar-section')).toBeInTheDocument();
    expect(screen.getByTestId('anonymous-body-template')).toBeInTheDocument();
    // 라벨 단독이 아닌 "스트레이트 — 상체가 탄탄한 타입" 형태로 풀이가 병기됨 (#1)
    expect(screen.getByText('스트레이트 — 상체가 탄탄한 타입')).toBeInTheDocument();
  });

  it('row가 있으면 3D 컨테이너 + 라벨(풀이 병기)을 렌더한다', () => {
    render(<BodyAvatarSection row={ROW} bodyType="W" label="웨이브" />);
    expect(screen.getByTestId('body-avatar-section')).toBeInTheDocument();
    expect(screen.queryByTestId('anonymous-body-template')).not.toBeInTheDocument();
    expect(screen.getByText('웨이브 — 곡선이 부드러운 타입')).toBeInTheDocument();
  });

  it('아바타가 실물이 아닌 비율 표현임을 정직하게 안내한다 (#2)', () => {
    render(<BodyAvatarSection row={ROW} bodyType="N" label="내추럴" />);
    expect(
      screen.getByText('내 비율로 만든 체형 실루엣이에요 (실제 모습이 아닌 비율 표현)')
    ).toBeInTheDocument();
  });

  it('2D 폴백에서도 정직 캡션을 노출한다', () => {
    render(<BodyAvatarSection row={null} bodyType="N" label="내추럴" />);
    expect(
      screen.getByText('내 비율로 만든 체형 실루엣이에요 (실제 모습이 아닌 비율 표현)')
    ).toBeInTheDocument();
  });

  it('직전 분석이 없으면 비교 토글을 노출하지 않는다', () => {
    render(<BodyAvatarSection row={ROW} bodyType="W" />);
    expect(screen.queryByTestId('body-avatar-compare-toggle')).not.toBeInTheDocument();
  });

  it('직전 분석이 있으면 비교 토글이 노출되고 aria-pressed가 토글된다 (지난 분석 카피)', async () => {
    const { default: userEvent } = await import('@testing-library/user-event');
    render(<BodyAvatarSection row={ROW} previousRow={{ ...ROW, ratio: 1.05 }} bodyType="W" />);

    const toggle = screen.getByTestId('body-avatar-compare-toggle');
    expect(toggle).toHaveAttribute('aria-pressed', 'false');
    expect(toggle).toHaveTextContent('지난 분석과 비교');

    await userEvent.click(toggle);
    expect(toggle).toHaveAttribute('aria-pressed', 'true');
    expect(toggle).toHaveTextContent('지난 분석의 실루엣이에요');
  });
});
