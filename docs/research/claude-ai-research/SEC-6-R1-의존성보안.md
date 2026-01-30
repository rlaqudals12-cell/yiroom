# SEC-6-R1: 의존성 보안

> npm 공급망 보안 및 취약점 관리 전략

## 1. 리서치 배경

### 1.1 2025년 공급망 공격 현황

2025년 Shai-Hulud 공격을 포함한 대규모 npm 공급망 공격이 발생했습니다. 악성 패키지가 ngx-bootstrap, ng2-file-upload 등 인기 패키지를 감염시켜 개발자 인증정보와 API 키를 탈취했습니다.

### 1.2 주요 통계

- 2024년 악성 npm 패키지: 3,000개 이상 (Snyk)
- 2025년 Q1 데이터 탈취 악성코드: 56% (전분기 대비 2배)
- npm 패키지 35개 중 1개가 취약점 보유

### 1.3 리서치 목표

- 의존성 취약점 자동 감지
- 공급망 공격 방어 전략
- CI/CD 보안 게이트 구축

## 2. 기본 보안 설정

### 2.1 npm 안전 설정

```bash
# 생명주기 스크립트 비활성화 (전역 설정)
npm config set ignore-scripts true

# 또는 프로젝트별 설정 (.npmrc)
echo "ignore-scripts=true" >> .npmrc

# 패키지 잠금 강제
echo "package-lock=true" >> .npmrc

# 엄격한 SSL
echo "strict-ssl=true" >> .npmrc

# 감사 레벨 설정
echo "audit-level=moderate" >> .npmrc
```

### 2.2 .npmrc 보안 설정

```ini
# .npmrc

# 스크립트 비활성화 (기본)
ignore-scripts=true

# 패키지 잠금 필수
package-lock=true

# SSL 강제
strict-ssl=true

# 감사 레벨
audit-level=moderate

# 레지스트리 설정
registry=https://registry.npmjs.org/

# 프록시 설정 (필요시)
# https-proxy=http://proxy.company.com:8080
```

### 2.3 허용된 스크립트 (필요한 경우)

```json
// package.json
{
  "scripts": {
    "postinstall": "prisma generate",  // 필수 스크립트만
  },
  "trustedDependencies": [
    "prisma"  // 스크립트 실행 허용 패키지
  ]
}
```

## 3. 취약점 감사

### 3.1 npm audit

```bash
# 기본 감사
npm audit

# JSON 출력 (CI용)
npm audit --json > audit-report.json

# 심각한 취약점만 실패
npm audit --audit-level=critical

# 자동 수정 (안전한 경우만)
npm audit fix

# 강제 수정 (주의: 브레이킹 체인지 가능)
npm audit fix --force
```

### 3.2 자동 감사 스크립트

```typescript
// scripts/security-audit.ts
import { execSync } from 'child_process';

interface AuditResult {
  vulnerabilities: {
    critical: number;
    high: number;
    moderate: number;
    low: number;
  };
}

function runSecurityAudit(): void {
  console.log('🔍 Running security audit...\n');

  try {
    const output = execSync('npm audit --json', { encoding: 'utf-8' });
    const result: AuditResult = JSON.parse(output);

    const { critical, high, moderate, low } = result.vulnerabilities;

    console.log('Vulnerability Summary:');
    console.log(`  Critical: ${critical}`);
    console.log(`  High: ${high}`);
    console.log(`  Moderate: ${moderate}`);
    console.log(`  Low: ${low}`);

    // 임계값 체크
    if (critical > 0) {
      console.error('\n❌ Critical vulnerabilities found! Blocking deployment.');
      process.exit(1);
    }

    if (high > 5) {
      console.error('\n⚠️ Too many high-severity vulnerabilities.');
      process.exit(1);
    }

    console.log('\n✅ Security audit passed.');
  } catch (error) {
    // npm audit가 취약점 발견 시 non-zero exit
    const errorOutput = (error as any).stdout;
    if (errorOutput) {
      const result = JSON.parse(errorOutput);
      console.error('Vulnerabilities found:', result.vulnerabilities);
    }
    process.exit(1);
  }
}

runSecurityAudit();
```

## 4. 의존성 모니터링 도구

### 4.1 Snyk 통합

```yaml
# .github/workflows/snyk.yml
name: Snyk Security

on:
  push:
    branches: [main]
  pull_request:

jobs:
  snyk:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '20'

      - name: Install dependencies
        run: npm ci

      - name: Run Snyk
        uses: snyk/actions/node@master
        env:
          SNYK_TOKEN: ${{ secrets.SNYK_TOKEN }}
        with:
          args: --severity-threshold=high
```

### 4.2 Socket.dev 통합

```yaml
# .github/workflows/socket.yml
name: Socket Security

on:
  pull_request:

jobs:
  socket:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - name: Install Socket CLI
        run: npm install -g @socketsecurity/cli

      - name: Run Socket scan
        run: socket scan --json > socket-report.json
        env:
          SOCKET_SECURITY_API_KEY: ${{ secrets.SOCKET_API_KEY }}

      - name: Check for issues
        run: |
          if jq -e '.issues[] | select(.severity == "critical")' socket-report.json; then
            echo "Critical issues found!"
            exit 1
          fi
```

### 4.3 Dependabot 설정

```yaml
# .github/dependabot.yml
version: 2
updates:
  - package-ecosystem: "npm"
    directory: "/"
    schedule:
      interval: "weekly"
      day: "monday"
    open-pull-requests-limit: 10
    groups:
      # 패키지 그룹화
      production-dependencies:
        patterns:
          - "*"
        exclude-patterns:
          - "@types/*"
          - "eslint*"
          - "vitest*"
      dev-dependencies:
        patterns:
          - "@types/*"
          - "eslint*"
          - "vitest*"
    # 보안 업데이트 우선
    allow:
      - dependency-type: "all"
    commit-message:
      prefix: "deps"
      include: "scope"
```

## 5. 패키지 설치 전 검증

### 5.1 npq (Node Package Quality)

```bash
# npq 설치
npm install -g npq

# 패키지 설치 전 검증
npq install lodash

# 검증 항목:
# - 다운로드 수
# - 마지막 업데이트
# - 알려진 취약점
# - 메인테이너 수
# - README 존재 여부
```

### 5.2 수동 검증 체크리스트

```typescript
// scripts/verify-package.ts

interface PackageVerification {
  name: string;
  checks: {
    hasOfficialRepo: boolean;
    recentUpdate: boolean;      // 6개월 이내
    activeMainteiner: boolean;  // 2명 이상
    noKnownVulns: boolean;
    typesAvailable: boolean;
    popularUsage: boolean;      // 주간 다운로드 10k+
  };
}

async function verifyPackage(packageName: string): Promise<PackageVerification> {
  const npmInfo = await fetch(`https://registry.npmjs.org/${packageName}`);
  const data = await npmInfo.json();

  const lastPublish = new Date(data.time[data['dist-tags'].latest]);
  const sixMonthsAgo = new Date();
  sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

  return {
    name: packageName,
    checks: {
      hasOfficialRepo: !!data.repository?.url,
      recentUpdate: lastPublish > sixMonthsAgo,
      activeMainteiner: Object.keys(data.maintainers || {}).length >= 2,
      noKnownVulns: true,  // npm audit로 별도 체크
      typesAvailable: !!data.types || packageName.startsWith('@types/'),
      popularUsage: true,   // npm API로 다운로드 수 체크
    },
  };
}
```

## 6. 패키지 잠금 전략

### 6.1 Lockfile 관리

```bash
# package-lock.json 커밋 필수
git add package-lock.json
git commit -m "deps: update lockfile"

# CI에서 정확한 버전 설치
npm ci  # (npm install 대신)

# lockfile 무결성 검증
npm ci --ignore-scripts  # 스크립트 없이 설치
```

### 6.2 버전 고정

```json
// package.json
{
  "dependencies": {
    // ❌ 범위 버전 (위험)
    "lodash": "^4.17.0",   // 4.17.x 모두 허용
    "axios": "~1.5.0",     // 1.5.x 모두 허용

    // ✅ 정확한 버전 (안전)
    "lodash": "4.17.21",   // 정확히 이 버전만
    "axios": "1.6.2",      // 정확히 이 버전만
  },
  "overrides": {
    // 취약 버전 강제 업그레이드
    "minimist": "1.2.8",
    "semver": "7.5.4"
  }
}
```

### 6.3 shrinkwrap (엄격한 잠금)

```bash
# shrinkwrap 생성 (package-lock.json보다 엄격)
npm shrinkwrap

# shrinkwrap 파일은 반드시 커밋
git add npm-shrinkwrap.json
```

## 7. CI/CD 보안 게이트

### 7.1 통합 보안 파이프라인

```yaml
# .github/workflows/security.yml
name: Security Pipeline

on:
  push:
    branches: [main]
  pull_request:

jobs:
  security-gate:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'npm'

      # 1. Lockfile 검증
      - name: Verify lockfile
        run: |
          if [ ! -f package-lock.json ]; then
            echo "❌ package-lock.json not found!"
            exit 1
          fi

      # 2. Clean install
      - name: Install dependencies
        run: npm ci --ignore-scripts

      # 3. npm audit
      - name: Run npm audit
        run: npm audit --audit-level=high

      # 4. Snyk scan
      - name: Snyk vulnerability scan
        uses: snyk/actions/node@master
        continue-on-error: true
        env:
          SNYK_TOKEN: ${{ secrets.SNYK_TOKEN }}
        with:
          args: --severity-threshold=high

      # 5. License check
      - name: Check licenses
        run: npx license-checker --onlyAllow "MIT;ISC;Apache-2.0;BSD-2-Clause;BSD-3-Clause"

      # 6. 결과 리포트
      - name: Generate security report
        if: always()
        run: |
          echo "## Security Scan Results" >> $GITHUB_STEP_SUMMARY
          npm audit --json | jq '.vulnerabilities' >> $GITHUB_STEP_SUMMARY
```

### 7.2 Pre-commit Hook

```bash
# .husky/pre-commit
#!/bin/sh
. "$(dirname "$0")/_/husky.sh"

# 새 패키지 추가 감지
if git diff --cached package.json | grep -E '^\+.*"[^"]+": "[^"]+"'; then
  echo "⚠️ New dependency detected. Running security check..."
  npm audit --audit-level=high
fi
```

## 8. 사고 대응

### 8.1 취약점 발견 시

```typescript
// 취약점 대응 절차

const VULN_RESPONSE = {
  critical: {
    action: 'IMMEDIATE',
    steps: [
      '1. 배포 중단',
      '2. 취약 패키지 버전 고정 (overrides)',
      '3. 패치 버전 즉시 적용',
      '4. 영향 범위 분석',
      '5. 보안팀 보고',
    ],
    sla: '4시간 이내',
  },

  high: {
    action: 'URGENT',
    steps: [
      '1. 영향 범위 분석',
      '2. 패치 계획 수립',
      '3. 24시간 내 패치 적용',
    ],
    sla: '24시간 이내',
  },

  moderate: {
    action: 'PLANNED',
    steps: [
      '1. 다음 릴리스에 포함',
      '2. 일주일 내 패치',
    ],
    sla: '1주일 이내',
  },
};
```

### 8.2 인증정보 유출 시 (CISA 권장)

```bash
# 2025년 CISA 권고사항

# 1. 의존성 버전 고정 (2025-09-16 이전 안전 버전으로)
npm install package@safe-version --save-exact

# 2. 모든 개발자 인증정보 즉시 로테이션
# - GitHub 토큰
# - npm 토큰
# - AWS 키
# - 클라우드 인증정보

# 3. 피싱 방지 MFA 강제
# - GitHub, npm 계정 모두

# 4. CI/CD 환경 검사
# - GitHub Actions secrets 검토
# - 빌드 로그에서 인증정보 노출 확인
```

## 9. 정기 점검

### 9.1 주간 점검

```bash
# 매주 월요일 자동 실행 (GitHub Actions)
# - npm audit
# - npm outdated
# - Snyk scan

# 주간 리포트 생성
npm audit --json > reports/audit-$(date +%Y%m%d).json
npm outdated --json > reports/outdated-$(date +%Y%m%d).json
```

### 9.2 월간 점검

```markdown
## 월간 의존성 리뷰 체크리스트

- [ ] 사용하지 않는 의존성 제거 (depcheck)
- [ ] 메이저 버전 업데이트 검토
- [ ] 새 보안 권고 확인
- [ ] 라이선스 변경 확인
- [ ] 대체 가능한 더 안전한 패키지 검토
```

## 10. 구현 체크리스트

### 10.1 P0 (필수 구현)

- [ ] npm ignore-scripts 설정
- [ ] package-lock.json 커밋
- [ ] npm ci 사용 (CI/CD)
- [ ] npm audit CI 통합

### 10.2 P1 (권장 구현)

- [ ] Snyk 또는 Socket 통합
- [ ] Dependabot 활성화
- [ ] 라이선스 검사
- [ ] Pre-commit 보안 훅

### 10.3 P2 (고급 구현)

- [ ] 프라이빗 레지스트리 도입
- [ ] SBOM (Software Bill of Materials) 생성
- [ ] 의존성 승인 워크플로우
- [ ] 취약점 대시보드

## 11. 참고 자료

- [CISA npm Supply Chain Advisory](https://www.cisa.gov/news-events/alerts/2025/09/23/widespread-supply-chain-compromise-impacting-npm-ecosystem)
- [Snyk NPM Security](https://snyk.io/blog/npm-security-preventing-supply-chain-attacks/)
- [npm Security Best Practices](https://docs.npmjs.com/packages-and-modules/securing-your-code)

---

**Version**: 1.0 | **Created**: 2026-01-19
**Category**: 보안 심화 | **Priority**: P0
