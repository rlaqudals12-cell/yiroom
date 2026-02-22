/**
 * RadarChart — SVG 기반 레이더(방사형) 차트
 *
 * 피부 분석 6항목, 체형 비율 등 다축 데이터 시각화에 사용.
 * - react-native-svg Polygon + Circle
 * - Reanimated로 그리기 애니메이션 (opacity fade-in)
 * - 테마 토큰 자동 적용
 */
import { useMemo } from 'react';
import { View, Text, StyleSheet, type ViewStyle } from 'react-native';
import Svg, { Polygon, Circle, Line, Text as SvgText } from 'react-native-svg';
import Animated, { FadeIn } from 'react-native-reanimated';

import { useTheme } from '../../lib/theme';
import { brand } from '../../lib/theme/tokens';

export interface RadarDataItem {
  label: string;
  value: number;
  /** 최대값 (기본 100) */
  maxValue?: number;
}

interface RadarChartProps {
  data: RadarDataItem[];
  /** 차트 크기 (기본 240) */
  size?: number;
  /** 채우기 색상 (기본 brand.primary) */
  fillColor?: string;
  /** 채우기 투명도 (기본 0.25) */
  fillOpacity?: number;
  /** 라인 색상 (기본 brand.primary) */
  strokeColor?: string;
  /** 가이드 링 개수 (기본 4) */
  rings?: number;
  /** 라벨 표시 여부 (기본 true) */
  showLabels?: boolean;
  /** 값 표시 여부 (기본 false) */
  showValues?: boolean;
  /** 진입 애니메이션 (기본 true) */
  animated?: boolean;
  style?: ViewStyle;
  testID?: string;
}

export function RadarChart({
  data,
  size = 240,
  fillColor,
  fillOpacity = 0.25,
  strokeColor,
  rings = 4,
  showLabels = true,
  showValues = false,
  animated = true,
  style,
  testID,
}: RadarChartProps): React.JSX.Element {
  const { colors } = useTheme();
  const fill = fillColor ?? brand.primary;
  const stroke = strokeColor ?? brand.primary;

  const center = size / 2;
  const radius = size / 2 - 32; // 라벨 공간 확보
  const count = data.length;

  // 각 꼭짓점 좌표 계산
  const points = useMemo(() => {
    return data.map((item, i) => {
      const angle = (Math.PI * 2 * i) / count - Math.PI / 2;
      const maxVal = item.maxValue ?? 100;
      const ratio = Math.min(item.value / maxVal, 1);
      return {
        x: center + radius * ratio * Math.cos(angle),
        y: center + radius * ratio * Math.sin(angle),
        labelX: center + (radius + 20) * Math.cos(angle),
        labelY: center + (radius + 20) * Math.sin(angle),
      };
    });
  }, [data, count, center, radius]);

  // 데이터 다각형 점 문자열
  const dataPolygon = points.map((p) => `${p.x},${p.y}`).join(' ');

  // 가이드 링 점들
  const guideRings = useMemo(() => {
    return Array.from({ length: rings }, (_, ringIdx) => {
      const ringRatio = (ringIdx + 1) / rings;
      const ringPoints = Array.from({ length: count }, (__, i) => {
        const angle = (Math.PI * 2 * i) / count - Math.PI / 2;
        const x = center + radius * ringRatio * Math.cos(angle);
        const y = center + radius * ringRatio * Math.sin(angle);
        return `${x},${y}`;
      }).join(' ');
      return ringPoints;
    });
  }, [rings, count, center, radius]);

  // 축 라인들
  const axisLines = useMemo(() => {
    return Array.from({ length: count }, (_, i) => {
      const angle = (Math.PI * 2 * i) / count - Math.PI / 2;
      return {
        x: center + radius * Math.cos(angle),
        y: center + radius * Math.sin(angle),
      };
    });
  }, [count, center, radius]);

  const Wrapper = animated ? Animated.View : View;
  const enteringProp = animated ? { entering: FadeIn.duration(600) } : {};

  return (
    <Wrapper
      {...enteringProp}
      style={[styles.container, { width: size, height: size }, style]}
      testID={testID}
    >
      <Svg width={size} height={size}>
        {/* 가이드 링 */}
        {guideRings.map((ring, idx) => (
          <Polygon
            key={`ring-${idx}`}
            points={ring}
            fill="none"
            stroke={colors.border}
            strokeWidth={0.5}
            opacity={0.6}
          />
        ))}

        {/* 축 라인 */}
        {axisLines.map((point, idx) => (
          <Line
            key={`axis-${idx}`}
            x1={center}
            y1={center}
            x2={point.x}
            y2={point.y}
            stroke={colors.border}
            strokeWidth={0.5}
            opacity={0.4}
          />
        ))}

        {/* 데이터 영역 */}
        <Polygon
          points={dataPolygon}
          fill={fill}
          fillOpacity={fillOpacity}
          stroke={stroke}
          strokeWidth={2}
        />

        {/* 꼭짓점 점 */}
        {points.map((point, idx) => (
          <Circle key={`dot-${idx}`} cx={point.x} cy={point.y} r={4} fill={stroke} />
        ))}

        {/* 라벨 (SVG Text) */}
        {showLabels &&
          points.map((point, idx) => (
            <SvgText
              key={`label-${idx}`}
              x={point.labelX}
              y={point.labelY}
              fontSize={11}
              fill={colors.mutedForeground}
              textAnchor="middle"
              alignmentBaseline="central"
            >
              {data[idx].label}
            </SvgText>
          ))}

        {/* 값 표시 */}
        {showValues &&
          points.map((point, idx) => (
            <SvgText
              key={`val-${idx}`}
              x={point.x}
              y={point.y - 10}
              fontSize={10}
              fill={stroke}
              textAnchor="middle"
              fontWeight="600"
            >
              {Math.round(data[idx].value)}
            </SvgText>
          ))}
      </Svg>
    </Wrapper>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
  },
});
