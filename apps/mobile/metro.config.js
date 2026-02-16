const { getDefaultConfig } = require('expo/metro-config');
const { withNativeWind } = require('nativewind/metro');
const path = require('path');

// 모노레포 루트 경로
const projectRoot = __dirname;
const monorepoRoot = path.resolve(projectRoot, '../..');

const config = getDefaultConfig(projectRoot);

// 모노레포 워크스페이스 패키지 처리 (Expo 기본값 유지 + monorepo root 추가)
config.watchFolders = [...(config.watchFolders || []), monorepoRoot];
config.resolver.nodeModulesPaths = [
  path.resolve(projectRoot, 'node_modules'),
  path.resolve(monorepoRoot, 'node_modules'),
];

// @yiroom/shared 패키지 해석 + React 중복 방지 (모바일 버전 고정)
config.resolver.extraNodeModules = {
  '@yiroom/shared': path.resolve(monorepoRoot, 'packages/shared'),
  'react': path.resolve(projectRoot, 'node_modules/react'),
  'react-dom': path.resolve(projectRoot, 'node_modules/react-dom'),
  'react-native': path.resolve(projectRoot, 'node_modules/react-native'),
};

module.exports = withNativeWind(config, { input: './global.css' });
