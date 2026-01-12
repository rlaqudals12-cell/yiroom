/**
 * SVG to PNG 변환 스크립트
 * 로고 아이콘을 다양한 사이즈의 PNG로 변환
 */

import sharp from 'sharp';
import { readFileSync, mkdirSync, existsSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const publicDir = join(__dirname, '../public');

// 변환할 사이즈 목록
const sizes = [
  { name: 'favicon-16x16.png', size: 16 },
  { name: 'favicon-32x32.png', size: 32 },
  { name: 'icons/icon-192x192.png', size: 192 },
  { name: 'icons/icon-256x256.png', size: 256 },
  { name: 'icons/icon-384x384.png', size: 384 },
  { name: 'icons/icon-512x512.png', size: 512 },
];

async function convertSvgToPng() {
  const svgPath = join(publicDir, 'icon-neutral.svg');
  const svgBuffer = readFileSync(svgPath);

  // icons 디렉토리 확인
  const iconsDir = join(publicDir, 'icons');
  if (!existsSync(iconsDir)) {
    mkdirSync(iconsDir, { recursive: true });
  }

  console.log('🎨 로고 PNG 변환 시작...\n');

  for (const { name, size } of sizes) {
    const outputPath = join(publicDir, name);

    try {
      await sharp(svgBuffer)
        .resize(size, size)
        .png()
        .toFile(outputPath);

      console.log(`✅ ${name} (${size}x${size})`);
    } catch (error) {
      console.error(`❌ ${name} 변환 실패:`, error.message);
    }
  }

  // 메인 로고 PNG도 생성
  const logoSvgPath = join(publicDir, 'logo.svg');
  const logoSvgBuffer = readFileSync(logoSvgPath);

  try {
    await sharp(logoSvgBuffer)
      .resize(240, 80)
      .png()
      .toFile(join(publicDir, 'logo-new.png'));

    console.log(`✅ logo-new.png (240x80)`);
  } catch (error) {
    console.error(`❌ logo-new.png 변환 실패:`, error.message);
  }

  console.log('\n🎉 변환 완료!');
  console.log('\n📋 다음 단계:');
  console.log('1. logo-new.png 확인 후 logo.png로 교체');
  console.log('2. 브라우저에서 favicon 확인');
}

convertSvgToPng().catch(console.error);
