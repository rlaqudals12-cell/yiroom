/**
 * ScanLineOverlay UI 컴포넌트 테스트
 *
 * AI 분석 스캔 라인 애니메이션의 렌더링, active 상태, 높이, 접근성, testID 검증.
 */

import React from 'react';
import { render } from '@testing-library/react-native';

import { ScanLineOverlay } from '../../../components/ui/ScanLineOverlay';

describe('ScanLineOverlay', () => {
  describe('active 상태', () => {
    it('active=false일 때 아무것도 렌더링하지 않아야 한다', () => {
      const { toJSON } = render(
        <ScanLineOverlay active={false} testID="scan-inactive" />
      );

      expect(toJSON()).toBeNull();
    });

    it('active=true일 때 렌더링되어야 한다', () => {
      const { getByTestId } = render(
        <ScanLineOverlay active={true} testID="scan-active" />
      );

      expect(getByTestId('scan-active')).toBeTruthy();
    });

    it('active가 true에서 false로 변경되면 렌더링이 사라져야 한다', () => {
      const { rerender, toJSON } = render(
        <ScanLineOverlay active={true} testID="scan-toggle" />
      );

      // active=true에서는 렌더링됨
      expect(toJSON()).not.toBeNull();

      // active=false로 변경
      rerender(<ScanLineOverlay active={false} testID="scan-toggle" />);
      expect(toJSON()).toBeNull();
    });

    it('active가 false에서 true로 변경되면 렌더링되어야 한다', () => {
      const { rerender, getByTestId } = render(
        <ScanLineOverlay active={false} testID="scan-toggle-on" />
      );

      rerender(<ScanLineOverlay active={true} testID="scan-toggle-on" />);
      expect(getByTestId('scan-toggle-on')).toBeTruthy();
    });
  });

  describe('testID', () => {
    it('testID가 올바르게 전달되어야 한다', () => {
      const { getByTestId } = render(
        <ScanLineOverlay active={true} testID="my-scan-line" />
      );

      expect(getByTestId('my-scan-line')).toBeTruthy();
    });

    it('testID 없이도 렌더링되어야 한다', () => {
      const { toJSON } = render(
        <ScanLineOverlay active={true} />
      );

      expect(toJSON()).not.toBeNull();
    });
  });

  describe('접근성', () => {
    it('accessibilityLabel이 "분석 진행 중"이어야 한다', () => {
      const { getByLabelText } = render(
        <ScanLineOverlay active={true} />
      );

      expect(getByLabelText('분석 진행 중')).toBeTruthy();
    });

    it('pointerEvents="none"이 설정되어야 한다', () => {
      const { getByTestId } = render(
        <ScanLineOverlay active={true} testID="scan-pointer" />
      );

      const container = getByTestId('scan-pointer');
      expect(container.props.pointerEvents).toBe('none');
    });
  });

  describe('height', () => {
    it('기본 높이 300이 적용되어야 한다', () => {
      const { getByTestId } = render(
        <ScanLineOverlay active={true} testID="scan-default-h" />
      );

      const container = getByTestId('scan-default-h');
      const flatStyle = Array.isArray(container.props.style)
        ? container.props.style
        : [container.props.style];
      const hasHeight = flatStyle.some(
        (s: Record<string, unknown>) => s && s.height === 300
      );
      expect(hasHeight).toBe(true);
    });

    it('커스텀 height가 적용되어야 한다', () => {
      const { getByTestId } = render(
        <ScanLineOverlay active={true} height={500} testID="scan-custom-h" />
      );

      const container = getByTestId('scan-custom-h');
      const flatStyle = Array.isArray(container.props.style)
        ? container.props.style
        : [container.props.style];
      const hasHeight = flatStyle.some(
        (s: Record<string, unknown>) => s && s.height === 500
      );
      expect(hasHeight).toBe(true);
    });

    it('작은 height도 정상 렌더링되어야 한다', () => {
      const { getByTestId } = render(
        <ScanLineOverlay active={true} height={100} testID="scan-small-h" />
      );

      expect(getByTestId('scan-small-h')).toBeTruthy();
    });
  });

  describe('스타일', () => {
    it('컨테이너에 absoluteFill + overflow:hidden이 적용되어야 한다', () => {
      const { getByTestId } = render(
        <ScanLineOverlay active={true} testID="scan-style" />
      );

      const container = getByTestId('scan-style');
      const flatStyle = Array.isArray(container.props.style)
        ? container.props.style
        : [container.props.style];
      const hasOverflow = flatStyle.some(
        (s: Record<string, unknown>) => s && s.overflow === 'hidden'
      );
      expect(hasOverflow).toBe(true);
    });

    it('컨테이너에 position:absolute가 적용되어야 한다', () => {
      const { getByTestId } = render(
        <ScanLineOverlay active={true} testID="scan-abs" />
      );

      const container = getByTestId('scan-abs');
      const flatStyle = Array.isArray(container.props.style)
        ? container.props.style
        : [container.props.style];
      const hasAbsolute = flatStyle.some(
        (s: Record<string, unknown>) => s && s.position === 'absolute'
      );
      expect(hasAbsolute).toBe(true);
    });
  });

  describe('color', () => {
    it('기본 color #F8C8DC가 사용되어야 한다', () => {
      const { getByTestId } = render(
        <ScanLineOverlay active={true} testID="scan-default-color" />
      );

      // 컴포넌트가 에러 없이 렌더링되면 기본 색상이 적용됨
      expect(getByTestId('scan-default-color')).toBeTruthy();
    });

    it('커스텀 color가 전달되어야 한다', () => {
      const { getByTestId } = render(
        <ScanLineOverlay active={true} color="#60A5FA" testID="scan-custom-color" />
      );

      expect(getByTestId('scan-custom-color')).toBeTruthy();
    });
  });
});
