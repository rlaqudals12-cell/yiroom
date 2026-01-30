#!/usr/bin/env node

/**
 * INDEX.md 동기화 검증 스크립트
 *
 * 기능:
 * - docs/ 폴더의 실제 파일 목록 수집
 * - docs/INDEX.md에서 참조하는 문서 목록 추출
 * - 누락된 문서 또는 존재하지 않는 문서 참조 검출
 *
 * 사용법: node scripts/index-sync-check.js
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT_DIR = path.resolve(__dirname, '..');
const DOCS_DIR = path.join(ROOT_DIR, 'docs');
const INDEX_FILE = path.join(DOCS_DIR, 'INDEX.md');

// ANSI 색상 코드
const COLORS = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  cyan: '\x1b[36m',
  dim: '\x1b[2m',
};

// INDEX.md에 포함되어야 하는 디렉토리
const TRACKED_DIRS = ['specs', 'adr', 'principles'];

// 무시할 파일 패턴
const IGNORE_FILES = [
  'README.md',
  'SYNC-ANALYSIS-REPORT.md',
  'ATOMIC-DECOMPOSITION-REVIEW.md',
];

/**
 * 특정 디렉토리에서 추적 대상 파일 수집
 * @param {string} dir - 디렉토리 경로
 * @param {string} prefix - 파일명 접두사 (예: 'SDD-', 'ADR-')
 * @returns {string[]} - 상대 경로 목록
 */
function collectTrackedFiles(dir, prefix) {
  const files = [];
  const dirPath = path.join(DOCS_DIR, dir);

  if (!fs.existsSync(dirPath)) {
    return files;
  }

  const entries = fs.readdirSync(dirPath, { withFileTypes: true });

  for (const entry of entries) {
    if (entry.isFile() && entry.name.endsWith('.md')) {
      // 무시 파일 체크
      if (IGNORE_FILES.includes(entry.name)) continue;

      // 접두사 체크 (있는 경우)
      if (prefix && !entry.name.startsWith(prefix)) continue;

      files.push(`${dir}/${entry.name}`);
    }
  }

  return files;
}

/**
 * 루트 레벨 문서 수집
 * @returns {string[]}
 */
function collectRootDocs() {
  const files = [];
  const entries = fs.readdirSync(DOCS_DIR, { withFileTypes: true });

  for (const entry of entries) {
    if (entry.isFile() && entry.name.endsWith('.md')) {
      // 무시 파일 체크
      if (IGNORE_FILES.includes(entry.name)) continue;
      // INDEX.md 자체는 제외
      if (entry.name === 'INDEX.md') continue;

      files.push(entry.name);
    }
  }

  return files;
}

/**
 * INDEX.md에서 문서 참조 추출
 * @param {string} content - INDEX.md 내용
 * @returns {Set<string>} - 참조된 파일 경로 집합 (docs/ 기준 상대 경로)
 */
function extractReferencesFromIndex(content) {
  const references = new Set();

  // 마크다운 링크 패턴: [text](path)
  const linkRegex = /\[([^\]]*)\]\(([^)]+)\)/g;

  let match;
  while ((match = linkRegex.exec(content)) !== null) {
    let href = match[2];

    // 외부 링크 및 앵커 제외
    if (href.startsWith('http://') || href.startsWith('https://') || href.startsWith('#')) {
      continue;
    }

    // 앵커 제거
    const [pathPart] = href.split('#');
    if (!pathPart) continue;

    // ./ 접두사 제거 및 정규화
    let normalizedPath = pathPart.replace(/^\.\//, '');

    // ../ 접두사 처리 (docs 외부 참조)
    if (normalizedPath.startsWith('../')) {
      continue; // docs 외부 문서는 추적 대상 아님
    }

    // .md 확장자가 있는 파일만
    if (normalizedPath.endsWith('.md')) {
      references.add(normalizedPath);
    }
  }

  return references;
}

/**
 * 메인 함수
 */
function main() {
  console.log(`${COLORS.cyan}=== INDEX.md 동기화 검증 시작 ===${COLORS.reset}\n`);

  // INDEX.md 읽기
  if (!fs.existsSync(INDEX_FILE)) {
    console.error(`${COLORS.red}오류: INDEX.md 파일을 찾을 수 없습니다.${COLORS.reset}`);
    process.exit(1);
  }

  const indexContent = fs.readFileSync(INDEX_FILE, 'utf-8');
  const indexReferences = extractReferencesFromIndex(indexContent);

  console.log(`${COLORS.dim}INDEX.md 참조 문서: ${indexReferences.size}개${COLORS.reset}`);

  // 실제 파일 수집
  const actualFiles = new Set([
    ...collectTrackedFiles('specs', 'SDD-'),
    ...collectTrackedFiles('adr', 'ADR-'),
    ...collectTrackedFiles('principles', null),
    ...collectRootDocs(),
  ]);

  console.log(`${COLORS.dim}실제 문서 파일: ${actualFiles.size}개${COLORS.reset}\n`);

  // 비교
  const missingInIndex = []; // 실제 존재하지만 INDEX에 없음
  const invalidReferences = []; // INDEX에 있지만 실제 파일 없음

  // 실제 파일 중 INDEX에 없는 것
  for (const file of actualFiles) {
    if (!indexReferences.has(file)) {
      missingInIndex.push(file);
    }
  }

  // INDEX 참조 중 실제 파일 없는 것
  for (const ref of indexReferences) {
    const fullPath = path.join(DOCS_DIR, ref);
    if (!fs.existsSync(fullPath)) {
      invalidReferences.push(ref);
    }
  }

  // 결과 출력
  console.log(`${COLORS.cyan}=== 검사 결과 ===${COLORS.reset}\n`);
  console.log(`INDEX.md 참조: ${indexReferences.size}개`);
  console.log(`실제 문서: ${actualFiles.size}개`);
  console.log(`INDEX 누락: ${missingInIndex.length}개`);
  console.log(`잘못된 참조: ${invalidReferences.length}개\n`);

  const hasIssues = missingInIndex.length > 0 || invalidReferences.length > 0;

  if (!hasIssues) {
    console.log(`${COLORS.green}✓ INDEX.md가 최신 상태입니다.${COLORS.reset}\n`);
    process.exit(0);
  }

  if (invalidReferences.length > 0) {
    console.log(`${COLORS.red}✗ 존재하지 않는 파일 참조:${COLORS.reset}`);
    for (const ref of invalidReferences.sort()) {
      console.log(`  ${COLORS.red}✗${COLORS.reset} ${ref}`);
    }
    console.log();
  }

  if (missingInIndex.length > 0) {
    console.log(`${COLORS.yellow}⚠ INDEX.md에 추가 필요:${COLORS.reset}`);

    // 카테고리별 그룹화
    const grouped = {
      specs: [],
      adr: [],
      principles: [],
      root: [],
      other: [],
    };

    for (const file of missingInIndex.sort()) {
      if (file.startsWith('specs/')) grouped.specs.push(file);
      else if (file.startsWith('adr/')) grouped.adr.push(file);
      else if (file.startsWith('principles/')) grouped.principles.push(file);
      else if (!file.includes('/')) grouped.root.push(file);
      else grouped.other.push(file);
    }

    for (const [category, files] of Object.entries(grouped)) {
      if (files.length > 0) {
        console.log(`\n  ${COLORS.dim}[${category}]${COLORS.reset}`);
        for (const file of files) {
          console.log(`    ${COLORS.yellow}+${COLORS.reset} ${file}`);
        }
      }
    }
    console.log();
  }

  // CI 친화적 요약
  console.log(`${COLORS.cyan}=== 요약 ===${COLORS.reset}`);
  console.log(`잘못된 참조: ${invalidReferences.length}`);
  console.log(`INDEX 누락: ${missingInIndex.length}`);

  // 잘못된 참조만 실패로 처리 (누락은 경고)
  if (invalidReferences.length > 0) {
    console.log(`${COLORS.red}종료 코드: 1 (잘못된 참조 있음)${COLORS.reset}`);
    process.exit(1);
  }

  console.log(`${COLORS.yellow}종료 코드: 0 (경고만 있음)${COLORS.reset}`);
  process.exit(0);
}

try {
  main();
} catch (error) {
  console.error(`${COLORS.red}오류 발생:${COLORS.reset}`, error.message);
  process.exit(1);
}
