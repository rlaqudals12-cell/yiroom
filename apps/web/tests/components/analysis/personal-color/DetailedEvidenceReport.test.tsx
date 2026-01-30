import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import DetailedEvidenceReport from '@/components/analysis/personal-color/DetailedEvidenceReport';
import type { AnalysisEvidence, ImageQuality } from '@/components/analysis/AnalysisEvidenceReport';
import type { ColorInfo } from '@/lib/mock/personal-color';

// 테스트용 Mock 데이터
const mockEvidence: AnalysisEvidence = {
  veinColor: 'blue',
  veinScore: 72,
  skinUndertone: 'pink',
  skinHairContrast: 'medium',
  eyeColor: 'brown',
  lipNaturalColor: 'pink',
};

const mockImageQuality: ImageQuality = {
  lightingCondition: 'natural',
  makeupDetected: false,
  wristImageProvided: true,
  analysisReliability: 'high',
};

const mockBestColors: ColorInfo[] = [
  { name: '라벤더', hex: '#E6E6FA' },
  { name: '로즈 핑크', hex: '#FF66B2' },
  { name: '스카이 블루', hex: '#87CEEB' },
];

const mockWorstColors: ColorInfo[] = [
  { name: '오렌지', hex: '#FF8C00' },
  { name: '올리브 그린', hex: '#808000' },
  { name: '골드', hex: '#FFD700' },
];

describe('DetailedEvidenceReport', () => {
  it('renders nothing when no evidence and no image quality', () => {
    const { container } = render(
      <DetailedEvidenceReport
        evidence={null}
        imageQuality={null}
        seasonType="summer"
        tone="cool"
        bestColors={mockBestColors}
        worstColors={mockWorstColors}
      />
    );
    expect(container.firstChild).toBeNull();
  });

  it('renders tone spectrum bar for cool tone', () => {
    render(
      <DetailedEvidenceReport
        evidence={mockEvidence}
        imageQuality={mockImageQuality}
        seasonType="summer"
        tone="cool"
        bestColors={mockBestColors}
        worstColors={mockWorstColors}
      />
    );

    expect(screen.getByTestId('tone-spectrum-bar')).toBeInTheDocument();
    expect(screen.getByText('쿨톤 확률:')).toBeInTheDocument();
    expect(screen.getByText('72%')).toBeInTheDocument();
  });

  it('renders color compare visual', () => {
    render(
      <DetailedEvidenceReport
        evidence={mockEvidence}
        imageQuality={mockImageQuality}
        seasonType="summer"
        tone="cool"
        bestColors={mockBestColors}
        worstColors={mockWorstColors}
      />
    );

    expect(screen.getByTestId('color-compare-visual')).toBeInTheDocument();
    expect(screen.getByText('잘 어울리는 색')).toBeInTheDocument();
    expect(screen.getByText('피해야 할 색')).toBeInTheDocument();
  });

  it('renders metal tone compare with silver recommended for cool tone', () => {
    render(
      <DetailedEvidenceReport
        evidence={mockEvidence}
        imageQuality={mockImageQuality}
        seasonType="summer"
        tone="cool"
        bestColors={mockBestColors}
        worstColors={mockWorstColors}
      />
    );

    expect(screen.getByTestId('metal-tone-compare')).toBeInTheDocument();
    expect(screen.getByText('골드')).toBeInTheDocument();
    expect(screen.getByText('실버')).toBeInTheDocument();
    // 쿨톤이므로 실버 추천
    expect(
      screen.getByText('쿨톤에게는 은색 계열 악세서리가 피부톤을 더 화사하게 만들어줘요')
    ).toBeInTheDocument();
  });

  it('renders metal tone compare with gold recommended for warm tone', () => {
    const warmEvidence: AnalysisEvidence = {
      ...mockEvidence,
      veinColor: 'green',
      veinScore: 28,
      skinUndertone: 'yellow',
      lipNaturalColor: 'coral',
    };

    render(
      <DetailedEvidenceReport
        evidence={warmEvidence}
        imageQuality={mockImageQuality}
        seasonType="spring"
        tone="warm"
        bestColors={mockBestColors}
        worstColors={mockWorstColors}
      />
    );

    // 웜톤이므로 골드 추천
    expect(
      screen.getByText('웜톤에게는 금색 계열 악세서리가 피부톤과 자연스럽게 어울려요')
    ).toBeInTheDocument();
  });

  it('renders analysis factors visual', () => {
    render(
      <DetailedEvidenceReport
        evidence={mockEvidence}
        imageQuality={mockImageQuality}
        seasonType="summer"
        tone="cool"
        bestColors={mockBestColors}
        worstColors={mockWorstColors}
      />
    );

    expect(screen.getByTestId('analysis-factors-visual')).toBeInTheDocument();
    expect(screen.getByText('혈관 색상')).toBeInTheDocument();
    expect(screen.getByText('피부 언더톤')).toBeInTheDocument();
    expect(screen.getByText('입술 자연색')).toBeInTheDocument();
  });

  it('renders with only image quality (no evidence)', () => {
    render(
      <DetailedEvidenceReport
        evidence={null}
        imageQuality={mockImageQuality}
        seasonType="summer"
        tone="cool"
        bestColors={mockBestColors}
        worstColors={mockWorstColors}
      />
    );

    // 이미지 품질 데이터만 있어도 렌더링
    expect(screen.getByTestId('detailed-evidence-report')).toBeInTheDocument();
    // 톤 스펙트럼은 없음 (evidence 필요)
    expect(screen.queryByTestId('tone-spectrum-bar')).not.toBeInTheDocument();
    // 색상 비교는 있음
    expect(screen.getByTestId('color-compare-visual')).toBeInTheDocument();
  });

  it('handles empty color arrays gracefully', () => {
    render(
      <DetailedEvidenceReport
        evidence={mockEvidence}
        imageQuality={mockImageQuality}
        seasonType="summer"
        tone="cool"
        bestColors={[]}
        worstColors={[]}
      />
    );

    // 색상 비교 카드가 렌더링되지 않음
    expect(screen.queryByTestId('color-compare-visual')).not.toBeInTheDocument();
    // 다른 요소들은 정상 렌더링
    expect(screen.getByTestId('tone-spectrum-bar')).toBeInTheDocument();
  });
});
