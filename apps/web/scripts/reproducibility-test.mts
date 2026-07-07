/**
 * 판정 재현성 측정 도구 — "같은 사진 → 같은 판정"이 신뢰의 기반
 *
 * @description
 *   사진 폴더를 스캔해 각 사진을 N회 반복 분석(실제 프로덕션 함수 경유)하고
 *   퍼스널컬러(시즌/톤)·피부(타입/점수) 판정 일치율을 리포트한다.
 *   "판정 재현율 N%"는 랜딩 신뢰 카피·지원서 지표의 근거 데이터.
 *
 * @usage
 *   cd apps/web
 *   npx tsx --tsconfig tsconfig.json scripts/reproducibility-test.mts [사진폴더] [반복수]
 *
 *   기본: 폴더 c:/tmp/repro-photos, 반복 5회.
 *   손목 페어링: 파일명이 `<이름>-wrist.<ext>`면 같은 `<이름>.<ext>` 얼굴 사진의
 *   PC 분석에 자동으로 함께 전달된다.
 *
 * @cost 사진 1장 × 5회 = PC 5콜(3.5-flash) + S-1 5콜(flash-lite) — 소액이지만 실키 과금 주의
 * @see docs/plans/2026-07-07-roadmap-to-companion.md Phase 1
 */

import { readFileSync, readdirSync, existsSync } from 'fs';
import { join, basename, extname } from 'path';
import { createRequire } from 'module';

// ── env 로드 (.env.local) + 실호출 강제 ─────────────────────────────────────
const require2 = createRequire(import.meta.url);
const sharp = require2('sharp');
const envPath = join(process.cwd(), '.env.local');
if (existsSync(envPath)) {
  for (const line of readFileSync(envPath, 'utf8').split('\n')) {
    const m = line.match(/^([A-Z_][A-Z0-9_]*)=(.*)$/);
    if (m && process.env[m[1]] === undefined) process.env[m[1]] = m[2].trim();
  }
}
process.env.FORCE_MOCK_AI = 'false';

// ── 인자 ────────────────────────────────────────────────────────────────────
const photoDir = process.argv[2] ?? 'c:/tmp/repro-photos';
const N = Number(process.argv[3] ?? 5);

if (!existsSync(photoDir)) {
  console.error(`사진 폴더 없음: ${photoDir}`);
  console.error('얼굴 사진들을 폴더에 넣고 다시 실행하세요. (손목: <이름>-wrist.jpg)');
  process.exit(1);
}

// ── 이미지 전처리 (앱 클라이언트와 동일: EXIF 회전 + 1024px + JPEG 80%) ────
async function toDataUrl(path: string): Promise<string> {
  const buf = await sharp(path)
    .rotate()
    .resize(1024, 1024, { fit: 'inside', withoutEnlargement: true })
    .jpeg({ quality: 80 })
    .toBuffer();
  return `data:image/jpeg;base64,${buf.toString('base64')}`;
}

// ── 대상 수집 ────────────────────────────────────────────────────────────────
const IMAGE_EXT = new Set(['.jpg', '.jpeg', '.png', '.webp']);
const files = readdirSync(photoDir).filter((f) => IMAGE_EXT.has(extname(f).toLowerCase()));
const wrists = new Map(
  files
    .filter((f) => basename(f, extname(f)).endsWith('-wrist'))
    .map((f) => [basename(f, extname(f)).replace(/-wrist$/, ''), f])
);
const faces = files.filter((f) => !basename(f, extname(f)).endsWith('-wrist'));

if (faces.length === 0) {
  console.error(`폴더에 얼굴 사진 없음: ${photoDir}`);
  process.exit(1);
}

console.log(`사진 ${faces.length}장 × ${N}회 반복 (PC=3.5-flash, S-1=flash-lite 혼합)\n`);

const { analyzePersonalColor, analyzeSkin } = await import('@/lib/gemini');

// ── 실행 ────────────────────────────────────────────────────────────────────
interface PhotoResult {
  file: string;
  pcRuns: string[]; // "season/tone"
  skinRuns: string[]; // skinType
  skinScores: number[];
  errors: number;
}

const results: PhotoResult[] = [];

for (const file of faces) {
  const name = basename(file, extname(file));
  const face = await toDataUrl(join(photoDir, file));
  const wristFile = wrists.get(name);
  const wrist = wristFile ? await toDataUrl(join(photoDir, wristFile)) : undefined;

  const r: PhotoResult = { file, pcRuns: [], skinRuns: [], skinScores: [], errors: 0 };
  process.stdout.write(`▶ ${file}${wristFile ? ' (+손목)' : ''}: `);

  for (let i = 0; i < N; i++) {
    try {
      const pc = (await analyzePersonalColor(face, wrist)) as {
        seasonType?: string;
        season?: string;
        tone?: string;
        undertone?: string;
      };
      r.pcRuns.push(`${pc.seasonType ?? pc.season}/${pc.tone ?? pc.undertone}`);
    } catch {
      r.errors++;
      r.pcRuns.push('ERROR');
    }
    try {
      const s = (await analyzeSkin(face)) as { skinType?: string; overallScore?: number };
      r.skinRuns.push(s.skinType ?? 'ERROR');
      if (typeof s.overallScore === 'number') r.skinScores.push(s.overallScore);
    } catch {
      r.errors++;
      r.skinRuns.push('ERROR');
    }
    process.stdout.write('·');
  }
  console.log(' 완료');
  results.push(r);
}

// ── 리포트 ──────────────────────────────────────────────────────────────────
function consistency(runs: string[]): { rate: number; mode: string } {
  const counts = new Map<string, number>();
  for (const v of runs) counts.set(v, (counts.get(v) ?? 0) + 1);
  const [mode, count] = [...counts.entries()].sort((a, b) => b[1] - a[1])[0];
  return { rate: count / runs.length, mode };
}

console.log('\n══════════ 재현성 리포트 ══════════');
let pcTotal = 0;
let skinTotal = 0;
for (const r of results) {
  const pc = consistency(r.pcRuns);
  const skin = consistency(r.skinRuns);
  const scoreRange = r.skinScores.length
    ? `${Math.min(...r.skinScores)}~${Math.max(...r.skinScores)}`
    : '-';
  pcTotal += pc.rate;
  skinTotal += skin.rate;
  console.log(
    `${r.file}\n  PC   ${(pc.rate * 100).toFixed(0)}% → ${pc.mode}  [${r.pcRuns.join(', ')}]\n  피부 ${(skin.rate * 100).toFixed(0)}% → ${skin.mode} (점수 ${scoreRange})${r.errors ? `\n  ⚠ 에러 ${r.errors}회` : ''}`
  );
}
const n = results.length;
console.log('────────────────────────────────────');
console.log(
  `종합 (사진 ${n}장 × ${N}회): PC 재현율 ${((pcTotal / n) * 100).toFixed(1)}% · 피부 재현율 ${((skinTotal / n) * 100).toFixed(1)}%`
);
console.log('※ 재현율 = 사진별 최빈 판정 비율의 평균. 지원서/랜딩 인용 시 조건 명시:');
console.log(`   "동일 사진 반복 분석, N=${n * N * 2}콜, 얼굴 정면 자연광 기준"`);
