/**
 * 피부 분석 메트릭 → ConcernCard 매핑 데이터
 *
 * SkinMetric[] (DB/AI 결과) → ConcernCardItem[] (UI 표시) 변환
 *
 * @see docs/specs/SDD-CONCERN-CARD.md
 */
import { SKIN_ILLUSTRATIONS } from './SkinConcernIllustrations';
import { createElement } from 'react';
import type { SkinMetric } from '@/lib/mock/skin-analysis';
import type { ConcernCardItem, ConcernSeverity } from '@/types/analysis-concern';

/** 기존 skin-detailed.ts 경계값과 동일: 71+ good, 41-70 normal, <41 warning */
export function getSeverity(score: number): {
  severity: ConcernSeverity;
  severityLabel: string;
} {
  if (score >= 71) return { severity: 'good', severityLabel: '좋음' };
  if (score >= 41) return { severity: 'normal', severityLabel: '보통' };
  return { severity: 'warning', severityLabel: '관리 필요' };
}

/** 메트릭별 팁 정의 */
interface MetricConfig {
  tips: { good: string; normal: string; warning: string };
}

const METRIC_CONFIG: Record<string, MetricConfig> = {
  hydration: {
    tips: {
      good: '수분 밸런스가 잘 유지되고 있어요',
      normal: '수분 크림으로 보습을 강화해보세요',
      warning: '히알루론산 세럼으로 수분 충전이 필요해요',
    },
  },
  oil: {
    tips: {
      good: '유분 밸런스가 좋은 상태예요',
      normal: '가벼운 수분 크림으로 밸런스를 맞춰보세요',
      warning: '유분 조절 토너 사용을 추천해요',
    },
  },
  pores: {
    tips: {
      good: '모공 상태가 깨끗해요',
      normal: '주기적인 각질 관리를 추천해요',
      warning: '주 2회 클레이 마스크를 추천해요',
    },
  },
  wrinkles: {
    tips: {
      good: '피부결이 매끄러운 상태예요',
      normal: '자외선 차단제 꼼꼼히 발라주세요',
      warning: '레티놀 크림으로 주름을 관리해보세요',
    },
  },
  elasticity: {
    tips: {
      good: '탄력이 좋은 피부예요',
      normal: '콜라겐 부스터 세럼을 시작해보세요',
      warning: '콜라겐 부스터 세럼이 필요해요',
    },
  },
  pigmentation: {
    tips: {
      good: '피부톤이 균일한 상태예요',
      normal: '비타민C 세럼으로 관리해보세요',
      warning: '비타민C 세럼으로 꾸준히 관리해주세요',
    },
  },
  trouble: {
    tips: {
      good: '트러블 없이 깨끗한 피부예요',
      normal: '자극적인 음식을 줄여보세요',
      warning: '살리실산(BHA) 스팟 케어를 추천해요',
    },
  },
  sensitivity: {
    tips: {
      good: '피부 장벽이 건강한 상태예요',
      normal: '순한 클렌저 사용을 추천해요',
      warning: '판테놀 진정 크림을 사용해보세요',
    },
  },
};

/** 점수에 따른 동적 팁 반환 */
export function getTipForScore(metricId: string, score: number): string {
  const config = METRIC_CONFIG[metricId];
  if (!config) return '';

  const { severity } = getSeverity(score);
  return config.tips[severity];
}

/** SkinMetric[] → ConcernCardItem[] 변환 */
export function mapSkinMetricsToConcernCards(metrics: SkinMetric[]): ConcernCardItem[] {
  return metrics
    .filter((m) => METRIC_CONFIG[m.id] != null)
    .map((metric) => {
      const { severity, severityLabel } = getSeverity(metric.value);

      return {
        id: metric.id,
        icon: SKIN_ILLUSTRATIONS[metric.id]
          ? createElement(SKIN_ILLUSTRATIONS[metric.id], { size: 32 })
          : null,
        label: metric.name,
        score: metric.value,
        severity,
        severityLabel,
        tip: getTipForScore(metric.id, metric.value),
      };
    });
}
