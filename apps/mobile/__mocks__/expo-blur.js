/**
 * expo-blur jest mock
 */
const React = require('react');

function BlurView(props) {
  return React.createElement('View', { ...props, testID: props.testID || 'blur-view' }, props.children);
}

module.exports = { BlurView };
