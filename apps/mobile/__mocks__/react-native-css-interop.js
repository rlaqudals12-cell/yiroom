/**
 * react-native-css-interop mock
 * NativeWind의 jsx-runtime이 이 모듈의 하위 경로를 참조하므로
 * moduleNameMapper로 모든 하위 경로도 이 파일로 리다이렉트해야 합니다.
 *
 * jsx/jsxs/Fragment는 React의 실제 jsx-runtime을 위임하여
 * JSX 렌더링이 정상 작동하도록 합니다.
 */
const actualJSX = require('react/jsx-runtime');

module.exports = {
  cssInterop: jest.fn(),
  remapProps: jest.fn(),
  createInteropElement: jest.fn((type, props, ...children) => ({
    type,
    props,
    children,
  })),
  StyleSheet: {
    create: (styles) => styles,
    register: jest.fn(),
  },
  // jsx-runtime: React의 실제 함수 위임
  jsx: actualJSX.jsx,
  jsxs: actualJSX.jsxs,
  Fragment: actualJSX.Fragment,
};
