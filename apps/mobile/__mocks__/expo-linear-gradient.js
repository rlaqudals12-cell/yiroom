/**
 * expo-linear-gradient jest mock
 */
const React = require('react');

function LinearGradient(props) {
  return React.createElement('View', { ...props, testID: props.testID || 'linear-gradient' }, props.children);
}

module.exports = { LinearGradient };
