/**
 * HistoryCompare 스토리
 * @description 시계열 분석 비교 컴포넌트 카탈로그
 */

import type { Meta, StoryObj } from '@storybook/react';
import HistoryCompare, { type AnalysisHistoryItem } from '../HistoryCompare';

// ============================================
// Mock 데이터
// ============================================

// 샘플 이미지 (base64 placeholder)
const SAMPLE_IMAGE_1 =
  'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="200" height="200"%3E%3Crect fill="%23e8d8c8" width="200" height="200"/%3E%3Ctext x="50%25" y="50%25" text-anchor="middle" dy=".3em" fill="%23666" font-size="14"%3E1/1%3C/text%3E%3C/svg%3E';

const SAMPLE_IMAGE_2 =
  'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="200" height="200"%3E%3Crect fill="%23f0e0d0" width="200" height="200"/%3E%3Ctext x="50%25" y="50%25" text-anchor="middle" dy=".3em" fill="%23666" font-size="14"%3E1/8%3C/text%3E%3C/svg%3E';

const SAMPLE_IMAGE_3 =
  'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="200" height="200"%3E%3Crect fill="%23f5ebe0" width="200" height="200"/%3E%3Ctext x="50%25" y="50%25" text-anchor="middle" dy=".3em" fill="%23666" font-size="14"%3E1/15%3C/text%3E%3C/svg%3E';

const createMockHistory = (count: number): AnalysisHistoryItem[] => {
  return Array.from({ length: count }, (_, i) => ({
    id: `analysis-${i + 1}`,
    date: new Date(2025, 0, 1 + i * 7).toISOString(),
    imageUrl: [SAMPLE_IMAGE_1, SAMPLE_IMAGE_2, SAMPLE_IMAGE_3][i % 3],
    scores: {
      overall: 60 + i * 5,
      hydration: 55 + i * 3,
      elasticity: 58 + i * 4,
      uniformity: 62 + i * 2,
      trouble: 40 - i * 3,
      pore: 35 - i * 2,
    },
    metadata: {
      season: ['spring', 'summer', 'autumn', 'winter'][i % 4] as
        | 'spring'
        | 'summer'
        | 'autumn'
        | 'winter',
      skinType: '복합성',
    },
  }));
};

// 개선 추세 데이터
const improvingHistory: AnalysisHistoryItem[] = [
  {
    id: 'analysis-1',
    date: new Date(2025, 0, 1).toISOString(),
    imageUrl: SAMPLE_IMAGE_1,
    scores: { overall: 55, hydration: 45, elasticity: 50, uniformity: 55, trouble: 50, pore: 45 },
  },
  {
    id: 'analysis-2',
    date: new Date(2025, 0, 8).toISOString(),
    imageUrl: SAMPLE_IMAGE_2,
    scores: { overall: 65, hydration: 55, elasticity: 58, uniformity: 62, trouble: 42, pore: 38 },
  },
  {
    id: 'analysis-3',
    date: new Date(2025, 0, 15).toISOString(),
    imageUrl: SAMPLE_IMAGE_3,
    scores: { overall: 78, hydration: 68, elasticity: 70, uniformity: 72, trouble: 30, pore: 28 },
  },
];

// 하락 추세 데이터
const decliningHistory: AnalysisHistoryItem[] = [
  {
    id: 'analysis-1',
    date: new Date(2025, 0, 1).toISOString(),
    imageUrl: SAMPLE_IMAGE_1,
    scores: { overall: 78, hydration: 68, elasticity: 70, uniformity: 72, trouble: 30, pore: 28 },
  },
  {
    id: 'analysis-2',
    date: new Date(2025, 0, 8).toISOString(),
    imageUrl: SAMPLE_IMAGE_2,
    scores: { overall: 65, hydration: 55, elasticity: 58, uniformity: 62, trouble: 42, pore: 38 },
  },
  {
    id: 'analysis-3',
    date: new Date(2025, 0, 15).toISOString(),
    imageUrl: SAMPLE_IMAGE_3,
    scores: { overall: 55, hydration: 45, elasticity: 50, uniformity: 55, trouble: 50, pore: 45 },
  },
];

// 안정 추세 데이터
const stableHistory: AnalysisHistoryItem[] = [
  {
    id: 'analysis-1',
    date: new Date(2025, 0, 1).toISOString(),
    scores: { overall: 70, hydration: 65, elasticity: 68, uniformity: 70 },
  },
  {
    id: 'analysis-2',
    date: new Date(2025, 0, 8).toISOString(),
    scores: { overall: 71, hydration: 66, elasticity: 67, uniformity: 69 },
  },
  {
    id: 'analysis-3',
    date: new Date(2025, 0, 15).toISOString(),
    scores: { overall: 70, hydration: 65, elasticity: 68, uniformity: 71 },
  },
];

// ============================================
// Meta
// ============================================

const meta: Meta<typeof HistoryCompare> = {
  title: 'Analysis/Visual/HistoryCompare',
  component: HistoryCompare,
  tags: ['autodocs'],
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component: `
### 시계열 분석 비교 컴포넌트

피부 분석 기록을 시간순으로 비교하는 컴포넌트입니다.

#### 주요 기능
- 두 날짜 간 분석 결과 비교
- Before/After 이미지 슬라이더
- 지표별 변화량 및 트렌드 시각화
- 종합 평가 메시지
        `,
      },
    },
  },
  decorators: [
    (Story) => (
      <div className="w-96">
        <Story />
      </div>
    ),
  ],
};

export default meta;
type Story = StoryObj<typeof HistoryCompare>;

// ============================================
// 스토리
// ============================================

// 기본 (3회 분석)
export const Default: Story = {
  args: {
    history: createMockHistory(3),
  },
};

// 개선 추세
export const Improving: Story = {
  args: {
    history: improvingHistory,
  },
  parameters: {
    docs: {
      description: {
        story: '피부 상태가 전반적으로 개선되는 추세를 보여줍니다.',
      },
    },
  },
};

// 하락 추세
export const Declining: Story = {
  args: {
    history: decliningHistory,
  },
  parameters: {
    docs: {
      description: {
        story: '피부 상태가 하락하는 추세를 보여줍니다.',
      },
    },
  },
};

// 안정 추세
export const Stable: Story = {
  args: {
    history: stableHistory,
  },
  parameters: {
    docs: {
      description: {
        story: '피부 상태가 안정적으로 유지되는 상태를 보여줍니다.',
      },
    },
  },
};

// 많은 기록 (5회)
export const ManyRecords: Story = {
  args: {
    history: createMockHistory(5),
  },
};

// 이미지 없음
export const NoImages: Story = {
  args: {
    history: stableHistory,
  },
  parameters: {
    docs: {
      description: {
        story: '이미지 없이 점수만 비교합니다.',
      },
    },
  },
};

// 기록 1개
export const SingleRecord: Story = {
  args: {
    history: [createMockHistory(1)[0]],
  },
  parameters: {
    docs: {
      description: {
        story: '기록이 1개인 경우 비교 불가 안내를 표시합니다.',
      },
    },
  },
};

// 기록 없음
export const NoRecords: Story = {
  args: {
    history: [],
  },
  parameters: {
    docs: {
      description: {
        story: '기록이 없는 경우 안내 메시지를 표시합니다.',
      },
    },
  },
};

// 부분 점수
export const PartialScores: Story = {
  args: {
    history: [
      {
        id: 'analysis-1',
        date: new Date(2025, 0, 1).toISOString(),
        scores: { overall: 60, hydration: 50 },
      },
      {
        id: 'analysis-2',
        date: new Date(2025, 0, 8).toISOString(),
        scores: { overall: 70, hydration: 60 },
      },
    ],
  },
  parameters: {
    docs: {
      description: {
        story: '일부 지표만 있는 경우 해당 지표만 비교합니다.',
      },
    },
  },
};

// 이미지 클릭 핸들러
export const WithImageClick: Story = {
  args: {
    history: improvingHistory,
    onImageClick: (item) => {
      alert(`클릭: ${item.id}\n날짜: ${new Date(item.date).toLocaleDateString()}`);
    },
  },
  parameters: {
    docs: {
      description: {
        story: '이미지 클릭 시 상세 정보를 확인할 수 있습니다.',
      },
    },
  },
};
