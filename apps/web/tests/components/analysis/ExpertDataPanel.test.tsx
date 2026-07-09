/**
 * ExpertDataPanel — 원시 영문 값 한국어화 (W4 #3)
 * 여러 분석이 공유하는 전문가 패널: front/fitted/angular/straight 등 → 한국어 매핑.
 * (next-intl / lucide-react는 tests/setup.ts에서 글로벌 mock)
 */

import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { ExpertDataPanel } from '@/components/analysis/ExpertDataPanel';

describe('ExpertDataPanel — 값 한국어화', () => {
  it('이미지 품질 원시 영문 값을 한국어로 표시한다', () => {
    render(
      <ExpertDataPanel
        data={{
          imageQuality: {
            angle: 'front',
            clothingFit: 'fitted',
            analysisReliability: 'high',
          },
        }}
      />
    );

    expect(screen.getByText('정면 촬영')).toBeInTheDocument();
    expect(screen.getByText('몸에 맞는 옷')).toBeInTheDocument();
    expect(screen.getByText('높음')).toBeInTheDocument();
    // 원시 영문 값은 노출되지 않아야 함
    expect(screen.queryByText('front')).not.toBeInTheDocument();
    expect(screen.queryByText('fitted')).not.toBeInTheDocument();
  });

  it('근거 요약의 키와 값(각진/직선 등)을 필드별로 한국어화한다', () => {
    render(
      <ExpertDataPanel
        data={{
          evidenceSummary: {
            shoulderLine: 'angular',
            waistDefinition: 'straight',
            silhouette: 'X',
          },
        }}
      />
    );

    // 키 라벨 한국어화
    expect(screen.getByText(/어깨선:/)).toBeInTheDocument();
    expect(screen.getByText(/실루엣:/)).toBeInTheDocument();
    // 값 한국어화 (필드 구분: waist의 straight = "직선 허리")
    expect(screen.getByText('각진 어깨선')).toBeInTheDocument();
    expect(screen.getByText('직선 허리')).toBeInTheDocument();
    expect(screen.getByText('X자형')).toBeInTheDocument();
    expect(screen.queryByText('angular')).not.toBeInTheDocument();
  });

  it('매핑에 없는 미지 값은 원문을 유지한다 (지어내기 금지)', () => {
    render(
      <ExpertDataPanel
        data={{
          evidenceSummary: {
            unknownField: 'weirdValue',
          },
        }}
      />
    );

    expect(screen.getByText('weirdValue')).toBeInTheDocument();
    // 키도 매핑에 없으면 원문 유지
    expect(screen.getByText(/unknownField:/)).toBeInTheDocument();
  });
});
