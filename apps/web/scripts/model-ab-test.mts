/**
 * 모델 A/B 측정 도구 — 기본 모델 vs flash-lite 판정 일치·재현성·지연 비교
 *
 * @description
 *   reproducibility-test.mts와 동일 방법론으로 hair/makeup(+전신 사진 있으면 body)을
 *   N회 반복 분석해 축별 판정 문자열·점수·지연·JSON 에러를 기록한다.
 *   모델 선택은 env GEMINI_MODEL로 프로세스 단위 결정(코드 무변경 A/B):
 *
 *   기준:  npx tsx --tsconfig tsconfig.json scripts/model-ab-test.mts [사진폴더] [반복수]
 *   lite:  GEMINI_MODEL=gemini-3.1-flash-lite npx tsx ... (동일 인자)
 *
 *   결과는 콘솔 + c:/tmp/model-ab-<model>.json 저장 → 두 파일을 대조해 전환 판정.
 *   통과 기준(피부 A/B와 동일): 판정 최빈값 동일 + JSON 에러 0 + 재현율 기준 모델 이상.
 *
 * @usage 전신 사진은 파일명에 body 포함(<이름>-body.jpg) 시 body 축도 측정.
 * @cost 사진 1장 × 5회 × 2축 = 10콜/모델 — 실키 과금 주의(소액)
 * @see scripts/reproducibility-test.mts · lib/gemini/client.ts FAST_MODEL 주석 (2026-07-07 A/B)
 */

import { readFileSync, readdirSync, existsSync, writeFileSync } from 'fs';
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
const modelLabel = process.env.GEMINI_MODEL || 'gemini-3.5-flash(기본)';

if (!existsSync(photoDir)) {
  console.error(`사진 폴더 없음: ${photoDir}`);
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

// ── 대상 수집 (wrist 파일 제외, body 파일 분리) ─────────────────────────────
const IMAGE_EXT = new Set(['.jpg', '.jpeg', '.png', '.webp']);
const files = readdirSync(photoDir).filter((f) => IMAGE_EXT.has(extname(f).toLowerCase()));
const bodies = files.filter((f) => basename(f, extname(f)).toLowerCase().includes('body'));
const faces = files.filter(
  (f) =>
    !basename(f, extname(f)).endsWith('-wrist') &&
    !basename(f, extname(f)).toLowerCase().includes('body')
);

if (faces.length === 0) {
  console.error(`폴더에 얼굴 사진 없음: ${photoDir}`);
  process.exit(1);
}

console.log(
  `모델=${modelLabel} · 얼굴 ${faces.length}장${bodies.length ? ` · 전신 ${bodies.length}장` : ' (전신 없음 → body 축 생략)'} × ${N}회\n`
);

const { analyzeHair, analyzeMakeup, analyzeBody } = await import('@/lib/gemini');

// ── 실행 ────────────────────────────────────────────────────────────────────
interface AxisRuns {
  runs: string[]; // 판정 문자열
  scores: number[];
  latenciesMs: number[];
  errors: number;
}
type PhotoReport = Record<string, AxisRuns>;
const report: Record<string, PhotoReport> = {};

function newAxis(): AxisRuns {
  return { runs: [], scores: [], latenciesMs: [], errors: 0 };
}

async function measure(
  axis: AxisRuns,
  call: () => Promise<{ det: string; score?: number }>
): Promise<void> {
  const t0 = Date.now();
  try {
    const { det, score } = await call();
    axis.latenciesMs.push(Date.now() - t0);
    axis.runs.push(det);
    if (typeof score === 'number') axis.scores.push(score);
  } catch (e) {
    axis.latenciesMs.push(Date.now() - t0);
    axis.errors++;
    axis.runs.push('ERROR');
    console.error(`\n  ✖ ${e instanceof Error ? e.message.slice(0, 80) : e}`);
  }
}

for (const file of faces) {
  const face = await toDataUrl(join(photoDir, file));
  const r: PhotoReport = { hair: newAxis(), makeup: newAxis() };
  report[file] = r;
  process.stdout.write(`▶ ${file}: `);

  for (let i = 0; i < N; i++) {
    await measure(r.hair, async () => {
      const h = await analyzeHair(face);
      return {
        det: `${h.hairType}/${h.hairThickness}/${h.scalpType}`,
        score: h.overallScore,
      };
    });
    await measure(r.makeup, async () => {
      const m = await analyzeMakeup(face);
      return {
        det: `${m.undertone}/${m.faceShape}/${m.eyeShape}/${m.lipShape}`,
        score: m.overallScore,
      };
    });
    process.stdout.write('·');
  }
  console.log(' 완료');
}

for (const file of bodies) {
  const body = await toDataUrl(join(photoDir, file));
  const r: PhotoReport = { body: newAxis() };
  report[file] = r;
  process.stdout.write(`▶ ${file} (body): `);
  for (let i = 0; i < N; i++) {
    await measure(r.body, async () => {
      const b = await analyzeBody(body);
      return { det: `${b.bodyType}`, score: b.overallScore ?? b.confidence };
    });
    process.stdout.write('·');
  }
  console.log(' 완료');
}

// ── 리포트 ──────────────────────────────────────────────────────────────────
function consistency(runs: string[]): { rate: number; mode: string } {
  const counts = new Map<string, number>();
  for (const v of runs) counts.set(v, (counts.get(v) ?? 0) + 1);
  const [mode, count] = [...counts.entries()].sort((a, b) => b[1] - a[1])[0];
  return { rate: count / runs.length, mode };
}
const avg = (xs: number[]) => (xs.length ? Math.round(xs.reduce((a, b) => a + b) / xs.length) : 0);

console.log(`\n══════════ A/B 리포트 — ${modelLabel} ══════════`);
for (const [file, axes] of Object.entries(report)) {
  console.log(file);
  for (const [axis, r] of Object.entries(axes)) {
    const c = consistency(r.runs);
    const scoreRange = r.scores.length ? `${Math.min(...r.scores)}~${Math.max(...r.scores)}` : '-';
    console.log(
      `  ${axis.padEnd(6)} ${(c.rate * 100).toFixed(0)}% → ${c.mode}  점수 ${scoreRange} · 평균 ${avg(r.latenciesMs)}ms · 에러 ${r.errors}\n         [${r.runs.join(', ')}]`
    );
  }
}

const outFile = `c:/tmp/model-ab-${(process.env.GEMINI_MODEL || 'default').replace(/[^a-z0-9.-]/gi, '_')}.json`;
writeFileSync(outFile, JSON.stringify({ model: modelLabel, N, report }, null, 2));
console.log(`\n저장: ${outFile}`);
