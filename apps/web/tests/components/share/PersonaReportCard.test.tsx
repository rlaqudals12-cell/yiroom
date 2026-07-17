import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { PersonaReportCard } from '@/components/share/PersonaReportCard';

const GROUP_LABELS = {
  best: '베스트 컬러',
  accent: '포인트 컬러',
  metal: '액세서리',
  avoid: '피하면 좋은 색',
  styles: '추천 스타일',
  care: '관리 포인트',
  bestUse: '옷·베이스 메이크업',
  accentUse: '립·네일·포인트',
  draping: '드레이핑',
};

const BASE = {
  oneLine: '여름 아침의 서늘한 빛을 닮은 사람',
  reproducibilityText: '같은 사진은 같은 결과 — 재현성 검증',
  dateText: '2026. 7. 16.',
  groupLabels: GROUP_LABELS,
  axisRows: [
    { label: '피부', value: '복합성 · 컨디션 82점' },
    { label: '체형', value: '웨이브' },
  ],
};

describe('PersonaReportCard — 진단지 리포트 (채점표 없는 신뢰 장치)', () => {
  it('진단명이 히어로, 은유가 서브카피로 렌더된다', () => {
    render(<PersonaReportCard {...BASE} toneName="뮤티드 서머" attrs={[]} />);
    expect(screen.getByTestId('report-hero')).toHaveTextContent('뮤티드 서머');
    expect(screen.getByText(BASE.oneLine)).toBeInTheDocument();
  });

  it('퍼컬 실패 시 은유가 히어로 자리를 지키고 속성표 섹션은 생략된다 (지어내지 않음)', () => {
    render(<PersonaReportCard {...BASE} attrs={[]} />);
    expect(screen.getByTestId('report-hero')).toHaveTextContent(BASE.oneLine);
    expect(screen.queryByTestId('report-attrs')).toBeNull();
  });

  it('속성표 행(라벨·값)이 표로 렌더된다 — 점수의 자리를 대체하는 신뢰 장치 #1', () => {
    render(
      <PersonaReportCard
        {...BASE}
        toneName="뮤티드 서머"
        attrs={[
          { label: '계절 타입', value: '여름 쿨톤' },
          { label: '채도', value: '부드러운 편' },
        ]}
      />
    );
    const table = screen.getByTestId('report-attrs');
    expect(table).toHaveTextContent('계절 타입');
    expect(table).toHaveTextContent('여름 쿨톤');
    expect(table).toHaveTextContent('부드러운 편');
  });

  it('체크리스트(keyInsights)·개선 포인트(액션 플랜)가 렌더된다 — 목업 밀도 대응', () => {
    render(
      <PersonaReportCard
        {...BASE}
        toneName="뮤티드 서머"
        attrs={[]}
        checklist={['잿빛 섞인 색에서 피부가 맑아 보여요']}
        actionItems={[
          { title: '오늘 쿨톤 립 하나로 인상 정리', why: '대비를 살리는 가장 빠른 방법' },
        ]}
      />
    );
    expect(screen.getByTestId('report-checklist')).toHaveTextContent('맑아 보여요');
    const actions = screen.getByTestId('report-actions');
    expect(actions).toHaveTextContent('01');
    expect(actions).toHaveTextContent('오늘 쿨톤 립 하나로 인상 정리');
    expect(actions).toHaveTextContent('대비를 살리는 가장 빠른 방법');
  });

  it('컬러 섹션 4단(베스트·포인트·액세서리·피할 색)이 세분화 렌더된다', () => {
    render(
      <PersonaReportCard
        {...BASE}
        toneName="뮤티드 서머"
        attrs={[]}
        palette={[{ hex: '#C79AA0', name: '더스티 로즈' }]}
        accents={[{ hex: '#A75D68', name: '로즈 브라운' }]}
        metals={[{ hex: '#C8CCD2', name: '실버' }]}
        worstPalette={[{ hex: '#FF6B00' }]}
      />
    );
    expect(screen.getByTestId('report-swatches')).toHaveTextContent('더스티 로즈');
    expect(screen.getByTestId('report-swatches')).toHaveTextContent('#C79AA0');
    expect(screen.getByTestId('report-accents')).toHaveTextContent('로즈 브라운');
    expect(screen.getByTestId('report-metals')).toHaveTextContent('실버');
    expect(screen.getByTestId('report-worst')).toBeInTheDocument();
  });

  it('뷰티 프로필에 관리 포인트·추천 스타일이 렌더된다', () => {
    render(
      <PersonaReportCard
        {...BASE}
        toneName="뮤티드 서머"
        attrs={[]}
        skinNote="수분 · 모공"
        hairStyles={[{ name: '레이어드 숏', fit: 92 }, { name: '프렌치 보브' }]}
      />
    );
    // 관리 포인트는 프로필 그리드의 카드로 합류
    expect(screen.getByTestId('report-axes')).toHaveTextContent('수분 · 모공');
    const chips = screen.getByTestId('report-hair-styles');
    expect(chips).toHaveTextContent('레이어드 숏');
    expect(chips).toHaveTextContent('프렌치 보브');
    // 어울림 도트는 저장된 fit이 있는 칩에만
    expect(screen.getAllByTestId('report-fit-dots')).toHaveLength(1);
  });

  it('계절 인장은 sealText가 있을 때만 렌더된다 (점수 없는 타입 확정 스탬프)', () => {
    const { rerender } = render(
      <PersonaReportCard {...BASE} toneName="뮤티드 서머" attrs={[]} sealText="여름 쿨톤" />
    );
    expect(screen.getByTestId('report-seal')).toHaveTextContent('여름 쿨톤');

    rerender(<PersonaReportCard {...BASE} toneName="뮤티드 서머" attrs={[]} />);
    expect(screen.queryByTestId('report-seal')).toBeNull();
  });

  it('피하면 좋은 색에 "왜" 한 줄이 붙는다 (12톤 정의 파생)', () => {
    render(
      <PersonaReportCard
        {...BASE}
        toneName="뮤티드 서머"
        attrs={[]}
        palette={[{ hex: '#C79AA0', name: '더스티 로즈' }]}
        worstPalette={[{ hex: '#E04A40' }]}
        avoidNote="선명한 원색이 부드러운 조화를 눌러요"
      />
    );
    expect(screen.getByTestId('report-avoid-note')).toHaveTextContent(
      '선명한 원색이 부드러운 조화를 눌러요'
    );
  });

  it('사진은 photoImg가 주어졌을 때만 캔버스 패널로 렌더된다 (옵트인 = 명시적 선택)', () => {
    const { rerender } = render(<PersonaReportCard {...BASE} toneName="뮤티드 서머" attrs={[]} />);
    expect(screen.queryByTestId('report-photo')).toBeNull();

    const img = new Image();
    rerender(<PersonaReportCard {...BASE} toneName="뮤티드 서머" attrs={[]} photoImg={img} />);
    expect(screen.getByTestId('report-photo')).toBeInTheDocument();
  });

  it('사진에 드레이핑 캡션이 붙는다 — 사진은 장식이 아니라 분석(베스트 색 드레이프)', () => {
    render(
      <PersonaReportCard
        {...BASE}
        toneName="뮤티드 서머"
        attrs={[]}
        photoImg={new Image()}
        palette={[{ hex: '#C79AA0', name: '더스티 로즈' }]}
      />
    );
    expect(screen.getByTestId('report-photo-caption')).toHaveTextContent('드레이핑 · 더스티 로즈');
  });

  it('히어로 팔레트 스트립과 스펙트럼 바가 렌더된다 (시뮬 반영: 첫 3초 착지점·관공서 표 탈피)', () => {
    render(
      <PersonaReportCard
        {...BASE}
        toneName="뮤티드 서머"
        attrs={[{ label: '채도', value: '부드러운 편', spectrumPos: 0.22 }]}
        palette={[{ hex: '#C79AA0', name: '더스티 로즈' }]}
      />
    );
    expect(screen.getByTestId('report-hero-strip')).toBeInTheDocument();
    expect(screen.getByTestId('report-spectrum')).toBeInTheDocument();
  });

  it('신뢰도는 전달됐을 때만 노출된다 (Mock 폴백이면 미표기 — 정직성)', () => {
    const { rerender } = render(
      <PersonaReportCard
        {...BASE}
        toneName="뮤티드 서머"
        attrs={[]}
        confidenceText="분석 신뢰도 87%"
      />
    );
    expect(screen.getByTestId('report-confidence')).toHaveTextContent('분석 신뢰도 87%');

    rerender(<PersonaReportCard {...BASE} toneName="뮤티드 서머" attrs={[]} />);
    expect(screen.queryByTestId('report-confidence')).toBeNull();
    // 재현성 문구는 항상 노출
    expect(screen.getByText(BASE.reproducibilityText)).toBeInTheDocument();
  });

  it('총평(note)·5축 요약·발급번호가 렌더된다', () => {
    render(
      <PersonaReportCard
        {...BASE}
        toneName="뮤티드 서머"
        attrs={[]}
        note="차분한 색이 어울리는 사람이에요."
        serialNo={42}
      />
    );
    expect(screen.getByTestId('report-note')).toHaveTextContent('차분한 색이 어울리는 사람이에요.');
    expect(screen.getByTestId('report-axes')).toHaveTextContent('웨이브');
    expect(screen.getByTestId('report-serial')).toHaveTextContent('No.000042');
  });
});
