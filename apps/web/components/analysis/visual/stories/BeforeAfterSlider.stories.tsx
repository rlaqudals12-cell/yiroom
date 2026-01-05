/**
 * BeforeAfterSlider 스토리
 * @description Before/After 인터랙티브 슬라이더 컴포넌트 카탈로그
 */

import type { Meta, StoryObj } from '@storybook/react';
import BeforeAfterSlider, {
  SliderPresetButtons,
  SliderPositionIndicator,
} from '../BeforeAfterSlider';
import { useState } from 'react';

// 샘플 이미지 (base64 placeholder)
const SAMPLE_BEFORE =
  'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="400" height="400"%3E%3Crect fill="%23e0c8b8" width="400" height="400"/%3E%3Ctext x="50%25" y="50%25" text-anchor="middle" dy=".3em" fill="%23666" font-size="24"%3EBefore%3C/text%3E%3C/svg%3E';

const SAMPLE_AFTER =
  'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="400" height="400"%3E%3Crect fill="%23f5e6db" width="400" height="400"/%3E%3Ctext x="50%25" y="50%25" text-anchor="middle" dy=".3em" fill="%23333" font-size="24"%3EAfter%3C/text%3E%3C/svg%3E';

// ============================================
// BeforeAfterSlider
// ============================================

const meta: Meta<typeof BeforeAfterSlider> = {
  title: 'Analysis/Visual/BeforeAfterSlider',
  component: BeforeAfterSlider,
  tags: ['autodocs'],
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component: `
### Before/After 인터랙티브 슬라이더

피부 분석 결과에서 시뮬레이션 전/후 비교를 위한 슬라이더 컴포넌트입니다.

#### 주요 기능
- 마우스/터치 드래그로 분할선 이동
- 키보드 접근성 (Arrow 키 지원)
- requestAnimationFrame 최적화
- 다양한 aspect ratio 지원
        `,
      },
    },
  },
  argTypes: {
    initialPosition: {
      control: { type: 'range', min: 0, max: 100 },
      description: '초기 슬라이더 위치 (0-100)',
    },
    direction: {
      control: { type: 'radio' },
      options: ['horizontal', 'vertical'],
      description: '슬라이더 방향',
    },
    aspectRatio: {
      control: { type: 'select' },
      options: ['square', '3/4', '4/3', '16/9', 'auto'],
      description: '컨테이너 비율',
    },
    showHandle: {
      control: 'boolean',
      description: '드래그 핸들 표시 여부',
    },
    showLabels: {
      control: 'boolean',
      description: 'Before/After 라벨 표시 여부',
    },
  },
};

export default meta;
type Story = StoryObj<typeof BeforeAfterSlider>;

// 기본 스토리
export const Default: Story = {
  args: {
    beforeImage: SAMPLE_BEFORE,
    afterImage: SAMPLE_AFTER,
    initialPosition: 50,
    direction: 'horizontal',
    showHandle: true,
    showLabels: true,
  },
  decorators: [
    (Story) => (
      <div className="w-80">
        <Story />
      </div>
    ),
  ],
};

// 수직 방향
export const Vertical: Story = {
  args: {
    ...Default.args,
    direction: 'vertical',
  },
  decorators: Default.decorators,
};

// 커스텀 라벨
export const CustomLabels: Story = {
  args: {
    ...Default.args,
    beforeLabel: '분석 전',
    afterLabel: '분석 후',
  },
  decorators: Default.decorators,
};

// 다양한 비율
export const AspectRatios: Story = {
  render: () => (
    <div className="flex flex-wrap gap-4">
      <div className="w-40">
        <p className="text-sm mb-1">square</p>
        <BeforeAfterSlider
          beforeImage={SAMPLE_BEFORE}
          afterImage={SAMPLE_AFTER}
          aspectRatio="square"
        />
      </div>
      <div className="w-40">
        <p className="text-sm mb-1">3/4</p>
        <BeforeAfterSlider
          beforeImage={SAMPLE_BEFORE}
          afterImage={SAMPLE_AFTER}
          aspectRatio="3/4"
        />
      </div>
      <div className="w-40">
        <p className="text-sm mb-1">16/9</p>
        <BeforeAfterSlider
          beforeImage={SAMPLE_BEFORE}
          afterImage={SAMPLE_AFTER}
          aspectRatio="16/9"
        />
      </div>
    </div>
  ),
};

// 핸들/라벨 숨김
export const Minimal: Story = {
  args: {
    ...Default.args,
    showHandle: false,
    showLabels: false,
  },
  decorators: Default.decorators,
};

// 위치 콜백
export const WithPositionCallback: Story = {
  render: function Render() {
    const [position, setPosition] = useState(50);

    return (
      <div className="w-80 space-y-4">
        <BeforeAfterSlider
          beforeImage={SAMPLE_BEFORE}
          afterImage={SAMPLE_AFTER}
          initialPosition={50}
          onPositionChange={setPosition}
        />
        <p className="text-sm text-center">현재 위치: {Math.round(position)}%</p>
      </div>
    );
  },
};

// ============================================
// SliderPresetButtons
// ============================================

export const PresetButtons: StoryObj<typeof SliderPresetButtons> = {
  render: function Render() {
    const [preset, setPreset] = useState<'subtle' | 'natural' | 'enhanced'>('natural');

    return (
      <div className="space-y-4">
        <SliderPresetButtons activePreset={preset} onPresetChange={setPreset} />
        <p className="text-sm">선택된 프리셋: {preset}</p>
      </div>
    );
  },
};

export const PresetButtonsDisabled: StoryObj<typeof SliderPresetButtons> = {
  render: () => <SliderPresetButtons activePreset="natural" onPresetChange={() => {}} disabled />,
};

// ============================================
// SliderPositionIndicator
// ============================================

export const PositionIndicator: StoryObj<typeof SliderPositionIndicator> = {
  render: function Render() {
    const [position, setPosition] = useState(50);

    return (
      <div className="w-64 space-y-4">
        <SliderPositionIndicator position={position} />
        <input
          type="range"
          min={0}
          max={100}
          value={position}
          onChange={(e) => setPosition(Number(e.target.value))}
          className="w-full"
        />
      </div>
    );
  },
};

// ============================================
// 통합 데모
// ============================================

export const FullDemo: Story = {
  render: function Render() {
    const [position, setPosition] = useState(50);
    const [preset, setPreset] = useState<'subtle' | 'natural' | 'enhanced'>('natural');

    return (
      <div className="w-80 space-y-4">
        <BeforeAfterSlider
          beforeImage={SAMPLE_BEFORE}
          afterImage={SAMPLE_AFTER}
          initialPosition={position}
          onPositionChange={setPosition}
        />
        <SliderPositionIndicator position={position} />
        <SliderPresetButtons activePreset={preset} onPresetChange={setPreset} />
        <div className="text-xs text-muted-foreground">
          <p>위치: {Math.round(position)}%</p>
          <p>프리셋: {preset}</p>
        </div>
      </div>
    );
  },
};
