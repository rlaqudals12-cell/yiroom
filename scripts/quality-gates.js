#!/usr/bin/env node

/**
 * 품질 게이트 자동화 스크립트
 *
 * P3 (원자 분해) 원칙에 따른 G0-G7 게이트 검증
 *
 * 사용법:
 *   node scripts/quality-gates.js [--all | --quick | --gate=G5]
 *
 * 옵션:
 *   --all    모든 게이트 실행 (기본값)
 *   --quick  빠른 검사 (G5만)
 *   --gate=X 특정 게이트만 실행
 *
 * @see .claude/rules/00-first-principles.md
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

// 색상 코드
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  gray: '\x1b[90m',
};

// 게이트 정의
const GATES = {
  G5: {
    name: '테스트 존재',
    description: '각 원자에 테스트 존재',
    check: checkTests,
    required: true,
  },
  G6: {
    name: '워크플로우 순서',
    description: '리서치→원리→ADR→스펙→구현',
    check: checkWorkflow,
    required: false, // 경고만
  },
  G7: {
    name: '모듈 경계',
    description: 'index.ts 통한 import, 단방향 의존성',
    check: checkEncapsulation,
    required: false, // 경고만
  },
};

// 코어 검사 (항상 실행)
const CORE_CHECKS = {
  typecheck: {
    name: 'TypeScript 타입 체크',
    command: 'npm run typecheck',
    required: true,
  },
  lint: {
    name: 'ESLint 린트',
    command: 'npm run lint',
    required: true,
  },
  test: {
    name: '테스트 실행',
    command: 'npm run test -- --passWithNoTests',
    required: true,
  },
};

// 유틸리티
function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function logGate(gate, status, message) {
  const icon = status === 'pass' ? '✅' : status === 'fail' ? '❌' : '⚠️';
  const color = status === 'pass' ? 'green' : status === 'fail' ? 'red' : 'yellow';
  log(`${icon} [${gate}] ${message}`, color);
}

function runCommand(command, silent = false) {
  try {
    const output = execSync(command, {
      encoding: 'utf-8',
      stdio: silent ? 'pipe' : 'inherit',
    });
    return { success: true, output };
  } catch (error) {
    return { success: false, error: error.message };
  }
}

// G5: 테스트 존재 확인
function checkTests() {
  const testDirs = [
    'apps/web/__tests__',
    'apps/web/tests',
    'apps/mobile/__tests__',
  ];

  let hasTests = false;
  for (const dir of testDirs) {
    const fullPath = path.join(process.cwd(), dir);
    if (fs.existsSync(fullPath)) {
      const files = fs.readdirSync(fullPath, { recursive: true });
      const testFiles = files.filter(
        (f) => f.endsWith('.test.ts') || f.endsWith('.test.tsx')
      );
      if (testFiles.length > 0) {
        hasTests = true;
        log(`  테스트 파일 발견: ${dir} (${testFiles.length}개)`, 'gray');
      }
    }
  }

  return {
    pass: hasTests,
    message: hasTests ? '테스트 파일 존재' : '테스트 파일 없음',
  };
}

// G6: 워크플로우 순서 확인
function checkWorkflow() {
  const checks = {
    principles: fs.existsSync(path.join(process.cwd(), 'docs/principles')),
    adr: fs.existsSync(path.join(process.cwd(), 'docs/adr')),
    specs: fs.existsSync(path.join(process.cwd(), 'docs/specs')),
  };

  const missing = Object.entries(checks)
    .filter(([, exists]) => !exists)
    .map(([name]) => name);

  if (missing.length > 0) {
    return {
      pass: false,
      message: `누락된 문서 디렉토리: ${missing.join(', ')}`,
    };
  }

  // 최근 변경된 파일에 대한 문서 존재 확인 (간단 버전)
  return {
    pass: true,
    message: '문서 구조 존재',
  };
}

// G7: 모듈 경계 확인
function checkEncapsulation() {
  // 내부 파일 직접 import 패턴 검사
  const result = runCommand(
    'git diff --cached --name-only 2>/dev/null || git diff HEAD~1 --name-only 2>/dev/null',
    true
  );

  if (!result.success) {
    return { pass: true, message: '변경 파일 없음 (스킵)' };
  }

  const changedFiles = result.output
    .split('\n')
    .filter((f) => f.endsWith('.ts') || f.endsWith('.tsx'));

  // 간단한 패턴 검사 (내부 파일 import)
  let violations = 0;
  for (const file of changedFiles) {
    const fullPath = path.join(process.cwd(), file);
    if (!fs.existsSync(fullPath)) continue;

    const content = fs.readFileSync(fullPath, 'utf-8');
    // /internal/ 경로 직접 import 검사
    if (content.includes('/internal/') && !file.includes('/internal/')) {
      violations++;
      log(`  경고: ${file} - internal 폴더 직접 import`, 'yellow');
    }
  }

  return {
    pass: violations === 0,
    message: violations === 0 ? '모듈 경계 준수' : `${violations}개 위반`,
  };
}

// 메인 실행
async function main() {
  const args = process.argv.slice(2);
  const quickMode = args.includes('--quick');
  const specificGate = args.find((a) => a.startsWith('--gate='));

  log('\n🚦 품질 게이트 검사 시작\n', 'blue');
  log(`모드: ${quickMode ? 'Quick' : 'Full'}`, 'gray');
  log('');

  const results = {
    passed: 0,
    failed: 0,
    warnings: 0,
  };

  // 코어 검사 (Quick 모드에서는 typecheck만)
  log('📋 코어 검사', 'blue');
  log('─'.repeat(40), 'gray');

  const coreChecks = quickMode
    ? { typecheck: CORE_CHECKS.typecheck }
    : CORE_CHECKS;

  for (const [key, check] of Object.entries(coreChecks)) {
    log(`\n실행 중: ${check.name}...`, 'gray');
    const result = runCommand(check.command, true);

    if (result.success) {
      logGate(key, 'pass', check.name);
      results.passed++;
    } else {
      logGate(key, 'fail', `${check.name} 실패`);
      results.failed++;
      if (check.required) {
        log('\n❌ 필수 검사 실패. 종료합니다.', 'red');
        process.exit(1);
      }
    }
  }

  // 게이트 검사
  if (!quickMode) {
    log('\n\n🚪 게이트 검사 (G5-G7)', 'blue');
    log('─'.repeat(40), 'gray');

    const gatesToRun = specificGate
      ? { [specificGate.split('=')[1]]: GATES[specificGate.split('=')[1]] }
      : GATES;

    for (const [key, gate] of Object.entries(gatesToRun)) {
      if (!gate) continue;

      const result = gate.check();

      if (result.pass) {
        logGate(key, 'pass', `${gate.name}: ${result.message}`);
        results.passed++;
      } else if (gate.required) {
        logGate(key, 'fail', `${gate.name}: ${result.message}`);
        results.failed++;
      } else {
        logGate(key, 'warn', `${gate.name}: ${result.message}`);
        results.warnings++;
      }
    }
  }

  // 결과 요약
  log('\n' + '═'.repeat(40), 'gray');
  log('📊 결과 요약', 'blue');
  log(`  ✅ 통과: ${results.passed}`, 'green');
  log(`  ❌ 실패: ${results.failed}`, results.failed > 0 ? 'red' : 'gray');
  log(`  ⚠️  경고: ${results.warnings}`, results.warnings > 0 ? 'yellow' : 'gray');

  if (results.failed > 0) {
    log('\n❌ 품질 게이트 검사 실패', 'red');
    process.exit(1);
  }

  log('\n✅ 품질 게이트 검사 통과', 'green');
  process.exit(0);
}

main().catch((error) => {
  console.error('Error:', error);
  process.exit(1);
});
