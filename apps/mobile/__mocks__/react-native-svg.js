/**
 * react-native-svg jest mock
 */
const React = require('react');

const createMock = (name) => {
  const component = (props) =>
    React.createElement(name, props, props.children);
  component.displayName = name;
  return component;
};

module.exports = {
  __esModule: true,
  default: createMock('Svg'),
  Svg: createMock('Svg'),
  Defs: createMock('Defs'),
  LinearGradient: createMock('LinearGradient'),
  Stop: createMock('Stop'),
  Text: createMock('SvgText'),
  Circle: createMock('Circle'),
  Path: createMock('Path'),
  Rect: createMock('Rect'),
  G: createMock('G'),
  Line: createMock('Line'),
};
