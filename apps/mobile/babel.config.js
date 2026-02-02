module.exports = function (api) {
  api.cache(true);

  const isTest = process.env.NODE_ENV === 'test';

  // 테스트 환경에서는 nativewind/babel 프리셋을 건너뜀
  // reanimated: false로 react-native-worklets/plugin 의존성 문제 회피
  const presets = isTest
    ? [
        [
          'babel-preset-expo',
          {
            jsxImportSource: 'nativewind',
            unstable_transformProfile: 'default',
            reanimated: false,
          },
        ],
      ]
    : [
        ['babel-preset-expo', { jsxImportSource: 'nativewind' }],
        'nativewind/babel',
      ];

  // 테스트 환경에서는 reanimated 플러그인 제외
  // (react-native-worklets/plugin 의존성 문제 회피)
  const plugins = isTest ? [] : ['react-native-reanimated/plugin'];

  return {
    presets,
    plugins,
  };
};
