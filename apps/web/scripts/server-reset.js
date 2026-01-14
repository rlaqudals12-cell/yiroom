#!/usr/bin/env node
/**
 * server-reset.js
 * 서버 문제 발생 시 빠른 리셋 스크립트
 *
 * 사용법: npm run dev:reset
 *
 * 이 스크립트는:
 * 1. 포트 3000 사용 중인 프로세스 종료
 * 2. .next 캐시 폴더 삭제
 * 3. 개발 서버 시작
 */

const { execSync, spawn } = require('child_process');
const fs = require('fs');
const path = require('path');

const webRoot = path.resolve(__dirname, '..');
const nextFolder = path.join(webRoot, '.next');

console.log('🔄 서버 리셋 시작...\n');

// 1. 포트 3000 사용 프로세스 종료
console.log('1️⃣ 포트 3000 프로세스 확인 및 종료...');
try {
  if (process.platform === 'win32') {
    // Windows
    const result = execSync('netstat -ano | findstr ":3000" | findstr "LISTENING"', {
      encoding: 'utf-8',
      stdio: ['pipe', 'pipe', 'pipe'],
    });

    const lines = result.trim().split('\n');
    const pids = new Set();

    lines.forEach((line) => {
      const parts = line.trim().split(/\s+/);
      const pid = parts[parts.length - 1];
      if (pid && pid !== '0') {
        pids.add(pid);
      }
    });

    pids.forEach((pid) => {
      console.log(`   종료: PID ${pid}`);
      try {
        execSync(`taskkill /F /PID ${pid}`, { stdio: 'ignore' });
      } catch (e) {
        // PowerShell fallback
        try {
          execSync(
            `powershell -Command "Stop-Process -Id ${pid} -Force -ErrorAction SilentlyContinue"`,
            { stdio: 'ignore' }
          );
        } catch (e2) {
          // ignore
        }
      }
    });

    if (pids.size === 0) {
      console.log('   ✅ 포트 3000 사용 중인 프로세스 없음');
    }
  } else {
    // macOS/Linux
    try {
      execSync('lsof -ti:3000 | xargs kill -9 2>/dev/null', { stdio: 'ignore' });
      console.log('   ✅ 포트 3000 프로세스 종료됨');
    } catch (e) {
      console.log('   ✅ 포트 3000 사용 중인 프로세스 없음');
    }
  }
} catch (e) {
  console.log('   ✅ 포트 3000 사용 중인 프로세스 없음');
}

// 2. .next 폴더 삭제
console.log('\n2️⃣ .next 캐시 폴더 삭제...');
if (fs.existsSync(nextFolder)) {
  fs.rmSync(nextFolder, { recursive: true, force: true });
  console.log('   ✅ .next 폴더 삭제 완료');
} else {
  console.log('   ✅ .next 폴더 없음');
}

// 3. 잠시 대기 후 서버 시작
console.log('\n3️⃣ 서버 시작 중...');
console.log('   http://localhost:3000 에서 접속 가능\n');

setTimeout(() => {
  // 서버 시작 (inherit stdio for interactive output)
  const child = spawn('npx', ['next', 'dev', '--turbopack'], {
    cwd: webRoot,
    stdio: 'inherit',
    shell: true,
  });

  child.on('error', (err) => {
    console.error('서버 시작 실패:', err.message);
    process.exit(1);
  });

  child.on('exit', (code) => {
    process.exit(code || 0);
  });
}, 1000);
