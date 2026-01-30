#!/usr/bin/env node

/**
 * 문서 내 깨진 링크 검증 스크립트
 *
 * 기능:
 * - docs/ 폴더 내 모든 .md 파일의 상대 경로 링크 검증
 * - 존재하지 않는 파일 참조 검출
 * - 앵커 링크(#)는 파일 존재 여부만 확인
 *
 * 사용법: node scripts/check-broken-links.js
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT_DIR = path.resolve(__dirname, '..');
const DOCS_DIR = path.join(ROOT_DIR, 'docs');

// ANSI 색상 코드
const COLORS = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  cyan: '\x1b[36m',
  dim: '\x1b[2m',
};

/**
 * 재귀적으로 .md 파일 수집
 * @param {string} dir - 검색할 디렉토리
 * @param {string[]} files - 수집된 파일 목록
 * @returns {string[]}
 */
function collectMdFiles(dir, files = []) {
  const entries = fs.readdirSync(dir, { withFileTypes: true });

  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);

    if (entry.isDirectory()) {
      // node_modules 제외
      if (entry.name !== 'node_modules') {
        collectMdFiles(fullPath, files);
      }
    } else if (entry.isFile() && entry.name.endsWith('.md')) {
      files.push(fullPath);
    }
  }

  return files;
}

/**
 * 마크다운 파일에서 링크 추출 (코드 블록 내 링크 제외)
 * @param {string} content - 마크다운 내용
 * @returns {Array<{text: string, href: string, line: number}>}
 */
function extractLinks(content) {
  const links = [];
  const lines = content.split('\n');

  // 마크다운 링크 패턴: [text](href)
  const linkRegex = /\[([^\]]*)\]\(([^)]+)\)/g;

  // 코드 블록 내부인지 추적
  let inCodeBlock = false;

  lines.forEach((line, index) => {
    // 코드 블록 시작/종료 감지 (``` 또는 ~~~)
    if (line.trim().startsWith('```') || line.trim().startsWith('~~~')) {
      inCodeBlock = !inCodeBlock;
      return;
    }

    // 코드 블록 내부면 링크 추출 건너뛰기
    if (inCodeBlock) {
      return;
    }

    // 인라인 코드 내 링크도 제외 (`code` 내부)
    // 단순화: 백틱으로 시작하는 라인은 건너뛰기
    if (line.trim().startsWith('`') && line.trim().endsWith('`')) {
      return;
    }

    let match;
    while ((match = linkRegex.exec(line)) !== null) {
      const href = match[2];
      // 외부 링크(http://, https://) 및 mailto: 제외
      if (!href.startsWith('http://') && !href.startsWith('https://') && !href.startsWith('mailto:')) {
        // HTML 인코딩된 링크 (<https://...>) 제외
        if (href.startsWith('<http') || href.startsWith('<https')) {
          continue;
        }
        // 파싱 오류로 인한 불완전 경로 제외 (<../app 등)
        if (href.startsWith('<')) {
          continue;
        }
        // 템플릿 플레이스홀더 제외 (xxx.md, URL 등)
        if (href === 'URL' || href.includes('xxx') || href.includes('XXX')) {
          continue;
        }
        links.push({
          text: match[1],
          href: href,
          line: index + 1,
        });
      }
    }
  });

  return links;
}

/**
 * 링크 유효성 검사
 * @param {string} sourceFile - 링크가 포함된 소스 파일 경로
 * @param {string} href - 검사할 링크
 * @returns {{valid: boolean, resolvedPath: string}}
 */
function validateLink(sourceFile, href) {
  // 앵커 제거 (파일 존재 여부만 확인)
  const [pathPart] = href.split('#');

  if (!pathPart) {
    // 순수 앵커 링크 (#section)는 같은 파일 내 링크이므로 유효
    return { valid: true, resolvedPath: sourceFile };
  }

  // 상대 경로를 절대 경로로 변환
  const sourceDir = path.dirname(sourceFile);
  const resolvedPath = path.resolve(sourceDir, pathPart);

  // 파일 존재 여부 확인
  const exists = fs.existsSync(resolvedPath);

  return { valid: exists, resolvedPath };
}

/**
 * 메인 함수
 */
function main() {
  console.log(`${COLORS.cyan}=== 문서 링크 검증 시작 ===${COLORS.reset}\n`);

  // docs/ 폴더 내 모든 .md 파일 찾기
  const mdFiles = collectMdFiles(DOCS_DIR);

  console.log(`${COLORS.dim}검사 대상: ${mdFiles.length}개 파일${COLORS.reset}\n`);

  const brokenLinks = [];
  let totalLinks = 0;

  for (const filePath of mdFiles) {
    const content = fs.readFileSync(filePath, 'utf-8');
    const links = extractLinks(content);
    totalLinks += links.length;

    for (const link of links) {
      const { valid, resolvedPath } = validateLink(filePath, link.href);

      if (!valid) {
        const relativePath = path.relative(ROOT_DIR, filePath);
        brokenLinks.push({
          file: relativePath,
          line: link.line,
          text: link.text,
          href: link.href,
          expected: path.relative(ROOT_DIR, resolvedPath),
        });
      }
    }
  }

  // 결과 출력
  console.log(`${COLORS.cyan}=== 검사 결과 ===${COLORS.reset}\n`);
  console.log(`총 링크 수: ${totalLinks}`);
  console.log(`깨진 링크 수: ${brokenLinks.length}\n`);

  if (brokenLinks.length === 0) {
    console.log(`${COLORS.green}✓ 모든 링크가 유효합니다.${COLORS.reset}\n`);
    process.exit(0);
  }

  console.log(`${COLORS.red}✗ 깨진 링크 발견:${COLORS.reset}\n`);

  // 파일별로 그룹화하여 출력
  const groupedByFile = brokenLinks.reduce((acc, link) => {
    if (!acc[link.file]) acc[link.file] = [];
    acc[link.file].push(link);
    return acc;
  }, {});

  for (const [file, links] of Object.entries(groupedByFile)) {
    console.log(`${COLORS.yellow}${file}${COLORS.reset}`);
    for (const link of links) {
      console.log(`  ${COLORS.dim}L${link.line}:${COLORS.reset} [${link.text}](${COLORS.red}${link.href}${COLORS.reset})`);
      console.log(`  ${COLORS.dim}    → 예상 경로: ${link.expected}${COLORS.reset}`);
    }
    console.log();
  }

  // CI 친화적 요약
  console.log(`${COLORS.cyan}=== 요약 ===${COLORS.reset}`);
  console.log(`파일 수: ${Object.keys(groupedByFile).length}`);
  console.log(`깨진 링크: ${brokenLinks.length}`);
  console.log(`${COLORS.red}종료 코드: 1${COLORS.reset}`);

  process.exit(1);
}

try {
  main();
} catch (error) {
  console.error(`${COLORS.red}오류 발생:${COLORS.reset}`, error.message);
  process.exit(1);
}
