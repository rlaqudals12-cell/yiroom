/**
 * PNG 아이콘 생성 스크립트
 * favicon.svg를 기반으로 모든 크기의 PNG 아이콘 생성
 */

import sharp from 'sharp';
import { readFileSync, existsSync, mkdirSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const publicDir = join(__dirname, '..', 'public');
const iconsDir = join(publicDir, 'icons');

// icons 폴더 확인
if (!existsSync(iconsDir)) {
  mkdirSync(iconsDir, { recursive: true });
}

// SVG 소스 읽기
const svgPath = join(publicDir, 'favicon.svg');
const svgContent = readFileSync(svgPath, 'utf-8');

// 파비콘 크기
const faviconSizes = [16, 32];

// PWA 아이콘 크기
const pwaSizes = [192, 256, 384, 512];

async function generateAllIcons() {
  console.log('🎨 이룸 아이콘 생성 시작...\n');

  // 파비콘 생성
  console.log('📌 파비콘 생성:');
  for (const size of faviconSizes) {
    const outputPath = join(publicDir, `favicon-${size}x${size}.png`);

    await sharp(Buffer.from(svgContent))
      .resize(size, size)
      .png()
      .toFile(outputPath);

    console.log(`  ✅ favicon-${size}x${size}.png`);
  }

  // PWA 아이콘 생성
  console.log('\n📱 PWA 아이콘 생성:');
  for (const size of pwaSizes) {
    const outputPath = join(iconsDir, `icon-${size}x${size}.png`);

    await sharp(Buffer.from(svgContent))
      .resize(size, size)
      .png()
      .toFile(outputPath);

    console.log(`  ✅ icons/icon-${size}x${size}.png`);
  }

  console.log('\n🎉 모든 아이콘 생성 완료!');
}

generateAllIcons().catch(console.error);
