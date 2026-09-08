#!/usr/bin/env node
/* eslint-disable @typescript-eslint/no-require-imports, sonarjs/os-command */

/**
 * 서버 시작 전 사전 검사 스크립트
 * 일반적인 문제를 미리 감지하여 디버깅 시간 절약
 *
 * 사용법: node scripts/preflight-check.js
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const PORT = process.env.PORT || 3000;
const WEB_DIR = path.join(__dirname, '..');

console.log('🔍 서버 사전 검사 시작...\n');

let hasError = false;

// 1. 포트 사용 확인
console.log(`1️⃣ 포트 ${PORT} 사용 확인...`);
try {
  const result = execSync(`netstat -ano | findstr ":${PORT}"`, {
    encoding: 'utf-8',
    stdio: ['pipe', 'pipe', 'pipe'],
  });

  if (result.includes('LISTENING')) {
    const lines = result.split('\n').filter((l) => l.includes('LISTENING'));
    const pids = lines.map((l) => l.trim().split(/\s+/).pop()).filter(Boolean);

    console.log(`   ⚠️  포트 ${PORT}이 이미 사용 중입니다.`);
    console.log(`   프로세스 ID: ${[...new Set(pids)].join(', ')}`);
    console.log(`   해결: taskkill /F /PID <PID> 또는 다른 포트 사용\n`);
    hasError = true;
  } else {
    console.log(`   ✅ 포트 ${PORT} 사용 가능\n`);
  }
} catch {
  console.log(`   ✅ 포트 ${PORT} 사용 가능\n`);
}

// 2. Lock 파일 확인
console.log('2️⃣ Lock 파일 확인...');
const lockFile = path.join(WEB_DIR, '.next', 'dev', 'lock');
if (fs.existsSync(lockFile)) {
  console.log('   ⚠️  Lock 파일이 존재합니다: .next/dev/lock');
  console.log('   해결: rm -rf .next\n');
  hasError = true;
} else {
  console.log('   ✅ Lock 파일 없음\n');
}

// 3. middleware.ts 존재 확인 (Next.js 16에서 충돌)
console.log('3️⃣ middleware.ts 충돌 확인...');
const middlewareFile = path.join(WEB_DIR, 'middleware.ts');
const middlewareFileJs = path.join(WEB_DIR, 'middleware.js');
if (fs.existsSync(middlewareFile) || fs.existsSync(middlewareFileJs)) {
  console.log('   ⚠️  middleware.ts/js 파일이 존재합니다.');
  console.log('   Next.js 16에서는 proxy.ts만 사용해야 합니다.');
  console.log('   해결: rm middleware.ts\n');
  hasError = true;
} else {
  console.log('   ✅ middleware.ts 없음 (정상)\n');
}

// 4. proxy.ts 존재 확인
console.log('4️⃣ proxy.ts 확인...');
const proxyFile = path.join(WEB_DIR, 'proxy.ts');
if (!fs.existsSync(proxyFile)) {
  console.log('   ⚠️  proxy.ts 파일이 없습니다.');
  console.log('   Clerk 인증이 작동하지 않을 수 있습니다.\n');
  hasError = true;
} else {
  // proxy.ts 내용 검사
  const proxyContent = fs.readFileSync(proxyFile, 'utf-8');
  if (!proxyContent.includes("'/home'")) {
    console.log("   ⚠️  proxy.ts에 '/home'이 공개 라우트에 없습니다.");
    console.log('   홈 페이지 접근 시 404 오류가 발생할 수 있습니다.\n');
    hasError = true;
  } else {
    console.log('   ✅ proxy.ts 정상\n');
  }
}

// 5. 환경 변수 확인
console.log('5️⃣ 필수 환경 변수 확인...');
const envFile = path.join(WEB_DIR, '.env.local');
if (!fs.existsSync(envFile)) {
  console.log('   ⚠️  .env.local 파일이 없습니다.\n');
  hasError = true;
} else {
  const envContent = fs.readFileSync(envFile, 'utf-8');
  const requiredVars = [
    'NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY',
    'CLERK_SECRET_KEY',
    'NEXT_PUBLIC_SUPABASE_URL',
    'NEXT_PUBLIC_SUPABASE_ANON_KEY',
    'SUPABASE_SERVICE_ROLE_KEY',
    'GOOGLE_GENERATIVE_AI_API_KEY',
  ];

  // 운영 배포 필수 (미설정 시 코치 턴 예약이 fail-closed로 전면 차단)
  const productionRequiredVars = ['UPSTASH_REDIS_REST_URL', 'UPSTASH_REDIS_REST_TOKEN'];

  // 선택적 (경고만)
  const optionalVars = [
    'CLERK_WEBHOOK_SECRET',
    'NEXT_PUBLIC_CLERK_SIGN_IN_URL',
    'NEXT_PUBLIC_CLERK_SIGN_UP_URL',
  ];

  const missingProduction = productionRequiredVars.filter((v) => !envContent.includes(v));
  if (missingProduction.length > 0) {
    console.log(
      '   ⚠️  운영 배포 필수 환경 변수 누락:',
      missingProduction.join(', '),
      '— 운영에서 코치 상담이 전면 중단됩니다.'
    );
  } else {
    console.log('   ✅ 운영 필수 환경 변수 존재');
  }

  const missing = requiredVars.filter((v) => !envContent.includes(v));
  if (missing.length > 0) {
    console.log('   ⚠️  누락된 필수 환경 변수:', missing.join(', '));
    hasError = true;
  } else {
    console.log('   ✅ 필수 환경 변수 존재');
  }

  const missingOptional = optionalVars.filter((v) => !envContent.includes(v));
  if (missingOptional.length > 0) {
    console.log('   💡 선택적 환경 변수 누락:', missingOptional.join(', '));
  }
  console.log('');
}

// 6. node_modules 확인
console.log('6️⃣ node_modules 확인...');
const nodeModules = path.join(WEB_DIR, 'node_modules');
if (!fs.existsSync(nodeModules)) {
  console.log('   ⚠️  node_modules가 없습니다.');
  console.log('   해결: npm install\n');
  hasError = true;
} else {
  console.log('   ✅ node_modules 존재\n');
}

// 7. DB 스키마 확인 (서버 실행 중일 때만)
console.log('7️⃣ DB 스키마 확인...');
const expectedSchemaFile = path.join(WEB_DIR, 'lib', 'db', 'expected-schema.ts');
if (!fs.existsSync(expectedSchemaFile)) {
  console.log('   ⚠️  expected-schema.ts 파일이 없습니다.\n');
} else {
  // expected-schema.ts에서 마이그레이션 파일 목록 추출
  const schemaContent = fs.readFileSync(expectedSchemaFile, 'utf-8');
  const migrationMatches = schemaContent.match(/migration:\s*'([^']+)'/g);
  if (migrationMatches) {
    const migrations = [...new Set(migrationMatches.map((m) => m.match(/'([^']+)'/)[1]))];
    const migrationDir = path.join(WEB_DIR, '..', '..', 'supabase', 'migrations');
    const missingFiles = migrations.filter((m) => !fs.existsSync(path.join(migrationDir, m)));
    if (missingFiles.length > 0) {
      console.log('   ⚠️  마이그레이션 파일 누락:', missingFiles.join(', '));
      hasError = true;
    } else {
      console.log(`   ✅ ${migrations.length}개 마이그레이션 파일 존재`);
    }
  }
  console.log('   💡 원격 DB 스키마 확인: GET /api/health/db-schema\n');
}

// 결과 출력
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
if (hasError) {
  console.log('⚠️  문제가 발견되었습니다. 위의 해결 방법을 확인하세요.');
  process.exit(1);
} else {
  console.log('✅ 모든 검사 통과! 서버를 시작할 수 있습니다.');
  console.log('   npm run dev');
  process.exit(0);
}
