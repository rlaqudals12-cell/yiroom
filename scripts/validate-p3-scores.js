#!/usr/bin/env node

/**
 * P3 점수 검증 스크립트
 *
 * 기능:
 * - docs/specs/ 폴더 내 SDD 파일에서 P3 점수 추출
 * - docs/INDEX.md에 명시된 P3 점수와 비교
 * - 불일치 목록 출력
 *
 * 사용법: node scripts/validate-p3-scores.js
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT_DIR = path.resolve(__dirname, '..');
const SPECS_DIR = path.join(ROOT_DIR, 'docs', 'specs');
const INDEX_FILE = path.join(ROOT_DIR, 'docs', 'INDEX.md');

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
 * SDD 파일 목록 수집
 * @returns {string[]}
 */
function collectSddFiles() {
  const files = [];
  const entries = fs.readdirSync(SPECS_DIR, { withFileTypes: true });

  for (const entry of entries) {
    if (entry.isFile() && entry.name.startsWith('SDD-') && entry.name.endsWith('.md')) {
      files.push(path.join(SPECS_DIR, entry.name));
    }
  }

  return files;
}

/**
 * SDD 파일에서 P3 점수 추출
 * 패턴:
 * - "P3 점수: XX점"
 * - "P3 Score: XX"
 * - "> **Complexity**: XX점"
 * @param {string} filePath - SDD 파일 경로
 * @returns {{score: string | null, raw: string | null}}
 */
function extractP3ScoreFromSDD(filePath) {
  const content = fs.readFileSync(filePath, 'utf-8');

  // P3 점수 패턴들
  const patterns = [
    /P3\s*점수[:\s]*([^|\n]+)/i,
    />\s*\*\*P3\s*점수\*\*[:\s]*([^\n]+)/i,
    /\|\s*P3\s*점수\s*\|\s*([^|]+)\|/i,
    />\s*\*\*Complexity\*\*[:\s]*([^\n]+)/i,
  ];

  for (const pattern of patterns) {
    const match = content.match(pattern);
    if (match) {
      const raw = match[1].trim();
      // 숫자만 추출 (첫 번째 숫자)
      const scoreMatch = raw.match(/(\d+)\s*점?/);
      return {
        score: scoreMatch ? scoreMatch[1] : null,
        raw: raw,
      };
    }
  }

  return { score: null, raw: null };
}

/**
 * INDEX.md에서 스펙별 P3 점수 추출
 * 패턴: | [SDD-XXX](./specs/SDD-XXX.md) | 설명 | XX점 |
 * @param {string} indexContent - INDEX.md 내용
 * @returns {Map<string, {score: string, raw: string}>}
 */
function extractP3ScoresFromIndex(indexContent) {
  const scores = new Map();

  // 테이블 행 패턴: | [SDD-xxx](path) | desc | XX점 (status) |
  const pattern = /\|\s*\[([^\]]+)\]\([^)]+\)\s*\|\s*([^|]+)\|\s*([^|]+)\|/g;

  let match;
  while ((match = pattern.exec(indexContent)) !== null) {
    const specName = match[1].trim();
    const raw = match[3].trim();

    // P3 점수 추출 (XX점 형식)
    const scoreMatch = raw.match(/(\d+)\s*점/);
    if (scoreMatch) {
      scores.set(specName, {
        score: scoreMatch[1],
        raw: raw,
      });
    }
  }

  return scores;
}

/**
 * 메인 함수
 */
function main() {
  console.log(`${COLORS.cyan}=== P3 점수 검증 시작 ===${COLORS.reset}\n`);

  // INDEX.md 읽기
  if (!fs.existsSync(INDEX_FILE)) {
    console.error(`${COLORS.red}오류: INDEX.md 파일을 찾을 수 없습니다.${COLORS.reset}`);
    process.exit(1);
  }

  const indexContent = fs.readFileSync(INDEX_FILE, 'utf-8');
  const indexScores = extractP3ScoresFromIndex(indexContent);

  console.log(`${COLORS.dim}INDEX.md에서 ${indexScores.size}개 스펙의 P3 점수 발견${COLORS.reset}\n`);

  // SDD 파일들 검사
  const sddFiles = collectSddFiles();

  console.log(`${COLORS.dim}검사 대상: ${sddFiles.length}개 SDD 파일${COLORS.reset}\n`);

  const mismatches = [];
  const specScores = new Map();

  for (const filePath of sddFiles) {
    const fileName = path.basename(filePath, '.md');
    const { score, raw } = extractP3ScoreFromSDD(filePath);

    specScores.set(fileName, { score, raw, filePath });
  }

  // INDEX.md 기준으로 비교
  for (const [specName, indexData] of indexScores) {
    const sddData = specScores.get(specName);

    if (!sddData) {
      // INDEX에 있지만 SDD 파일 없음 (다른 스크립트에서 검사)
      continue;
    }

    if (sddData.score === null) {
      mismatches.push({
        spec: specName,
        indexScore: indexData.score,
        indexRaw: indexData.raw,
        sddScore: 'N/A',
        sddRaw: 'P3 점수 없음',
        type: 'missing_in_sdd',
      });
    } else if (sddData.score !== indexData.score) {
      mismatches.push({
        spec: specName,
        indexScore: indexData.score,
        indexRaw: indexData.raw,
        sddScore: sddData.score,
        sddRaw: sddData.raw,
        type: 'mismatch',
      });
    }
  }

  // 결과 출력
  console.log(`${COLORS.cyan}=== 검사 결과 ===${COLORS.reset}\n`);
  console.log(`INDEX.md P3 점수: ${indexScores.size}개`);
  console.log(`SDD 파일: ${sddFiles.length}개`);
  console.log(`불일치: ${mismatches.length}개\n`);

  if (mismatches.length === 0) {
    console.log(`${COLORS.green}✓ 모든 P3 점수가 일치합니다.${COLORS.reset}\n`);
    process.exit(0);
  }

  console.log(`${COLORS.red}✗ P3 점수 불일치 발견:${COLORS.reset}\n`);

  // 불일치 유형별 그룹화
  const missingInSdd = mismatches.filter((m) => m.type === 'missing_in_sdd');
  const scoreMismatches = mismatches.filter((m) => m.type === 'mismatch');

  if (missingInSdd.length > 0) {
    console.log(`${COLORS.yellow}[SDD에 P3 점수 누락]${COLORS.reset}`);
    for (const item of missingInSdd) {
      console.log(`  ${item.spec}`);
      console.log(`    ${COLORS.dim}INDEX: ${item.indexRaw}${COLORS.reset}`);
      console.log(`    ${COLORS.red}SDD: P3 점수 없음${COLORS.reset}`);
    }
    console.log();
  }

  if (scoreMismatches.length > 0) {
    console.log(`${COLORS.yellow}[점수 불일치]${COLORS.reset}`);
    for (const item of scoreMismatches) {
      console.log(`  ${item.spec}`);
      console.log(`    ${COLORS.dim}INDEX: ${item.indexScore}점 (${item.indexRaw})${COLORS.reset}`);
      console.log(`    ${COLORS.red}SDD: ${item.sddScore}점 (${item.sddRaw})${COLORS.reset}`);
    }
    console.log();
  }

  // CI 친화적 요약
  console.log(`${COLORS.cyan}=== 요약 ===${COLORS.reset}`);
  console.log(`SDD 누락: ${missingInSdd.length}`);
  console.log(`점수 불일치: ${scoreMismatches.length}`);
  console.log(`${COLORS.red}종료 코드: 1${COLORS.reset}`);

  process.exit(1);
}

try {
  main();
} catch (error) {
  console.error(`${COLORS.red}오류 발생:${COLORS.reset}`, error.message);
  process.exit(1);
}
