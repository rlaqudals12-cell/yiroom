# DOC-2-R1: 스펙 동기화

> 이룸 프로젝트 SDD(Spec-Driven Development)와 코드 동기화 전략

---

## 1. 핵심 요약

- **SDD-코드 동기화의 핵심**: 스펙 문서가 Single Source of Truth(SSOT)가 되어야 하며, 코드는 스펙의 구현체
- **변경 추적**: Git 기반 + 스펙 ID 태깅으로 양방향 추적 가능
- **자동화 도구**: OpenAPI, TypeSpec, 커스텀 스크립트로 스펙에서 코드, 코드에서 스펙 검증
- **핵심 원칙**: "스펙이 없으면 코드도 없다" / "코드가 스펙을 벗어나면 스펙을 먼저 수정"
- **이룸 적용**: 기존 SDD-WORKFLOW.md를 확장하여 자동 검증 파이프라인 구축

---

## 2. 상세 내용

### 2.1 SDD-코드 동기화

#### 동기화 계층 구조

```
Level 1: 비전/목표 문서
   - docs/FIRST-PRINCIPLES.md
   - 거의 변경 없음, 연간 리뷰
              |
              v
Level 2: 아키텍처 결정 (ADR)
   - docs/adr/ADR-*.md
   - 기술 결정 시 생성, 폐기 시 상태 변경
              |
              v
Level 3: 기능 스펙 (SDD)
   - docs/specs/SDD-*.md
   - 기능 단위, 구현 전 필수 작성
              |
              v
Level 4: 코드 구현
   - apps/web/, packages/
   - SDD 참조 필수, 스펙 ID 주석
```

#### 동기화 규칙

| 규칙 | 설명 | 검증 방법 |
|------|------|----------|
| **스펙 우선** | 코드 작성 전 SDD 존재 확인 | CI에서 스펙 참조 검사 |
| **양방향 참조** | 스펙에 파일 경로, 코드에 스펙 ID | grep 스크립트 |
| **버전 일치** | 스펙 버전과 코드 주석 버전 일치 | 자동 검증 스크립트 |
| **폐기 동기화** | 스펙 폐기 시 코드도 정리 | 정기 리뷰 |

#### 코드 내 스펙 참조 패턴

```typescript
/**
 * 피부 분석 API 핸들러
 *
 * @spec SDD-S1-PROFESSIONAL-ANALYSIS v1.2
 * @see docs/specs/SDD-S1-PROFESSIONAL-ANALYSIS.md
 */
export async function POST(request: NextRequest) {
  // SDD-S1: Section 3.2 "AI 분석 파이프라인"
  const result = await analyzeSkin(imageData);
  return NextResponse.json(result);
}
```

### 2.2 스펙 변경 추적

#### 변경 추적 메커니즘

```yaml
변경 유형:
  MINOR:
    - 오타 수정
    - 설명 명확화
    - 예시 추가
    - 영향: 코드 변경 불필요

  MAJOR:
    - 인터페이스 변경
    - 비즈니스 로직 변경
    - 데이터 스키마 변경
    - 영향: 코드 수정 필수, 마이그레이션 필요

  BREAKING:
    - API 호환성 깨짐
    - 데이터 형식 변경
    - 기능 삭제
    - 영향: 버전 업, 마이그레이션 스크립트 필수
```

#### 스펙 변경 로그 형식

```markdown
## 변경 이력

| 버전 | 날짜 | 유형 | 변경 내용 | 영향 코드 |
|------|------|------|----------|----------|
| 1.3 | 2026-01-16 | MAJOR | 분석 점수 범위 0-100에서 0-1000 | `lib/analysis/score.ts` |
| 1.2 | 2026-01-10 | MINOR | 에러 메시지 개선 | 없음 |
| 1.1 | 2026-01-05 | BREAKING | 응답 형식 변경 | `types/analysis.ts` |
```

#### Git 커밋 컨벤션

```bash
# 스펙 변경 시
docs(spec): SDD-S1 v1.3 - 점수 범위 확장

# 스펙 변경에 따른 코드 수정 시
feat(analysis): SDD-S1 v1.3 점수 범위 반영

# 스펙과 코드 동시 변경 시 (권장하지 않음, 불가피 시)
feat(analysis): SDD-S1 v1.4 - 새 분석 알고리즘

- docs: SDD 업데이트
- feat: 알고리즘 구현
- test: 테스트 추가
```

### 2.3 자동화 도구

#### 2.3.1 OpenAPI / AsyncAPI

```yaml
# openapi.yaml - API 스펙 정의
openapi: 3.1.0
info:
  title: 이룸 API
  version: 2.0.0

paths:
  /api/analyze/skin:
    post:
      operationId: analyzeSkin
      summary: 피부 분석 수행
      requestBody:
        content:
          application/json:
            schema:
              $ref: '#/components/schemas/SkinAnalysisRequest'
      responses:
        '200':
          description: 분석 성공
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/SkinAnalysisResponse'

components:
  schemas:
    SkinAnalysisRequest:
      type: object
      required:
        - imageBase64
      properties:
        imageBase64:
          type: string
          format: base64
```

#### 2.3.2 TypeSpec (Microsoft)

```typespec
// skin-analysis.tsp
import "@typespec/http";
import "@typespec/rest";

using TypeSpec.Http;
using TypeSpec.Rest;

@service({
  title: "Skin Analysis Service"
})
namespace YiroomApi.Analysis;

model SkinAnalysisRequest {
  imageBase64: string;
  options?: AnalysisOptions;
}

model SkinAnalysisResponse {
  skinType: SkinType;
  scores: Record<string, integer>;
  recommendations: string[];
}

@route("/api/analyze/skin")
interface SkinAnalysis {
  @post
  analyze(@body request: SkinAnalysisRequest): SkinAnalysisResponse;
}
```

#### 2.3.3 Zod 스키마 (현재 이룸 사용)

```typescript
// types/api/skin-analysis.ts
import { z } from 'zod';

/**
 * @spec SDD-S1-PROFESSIONAL-ANALYSIS v1.2
 */
export const skinAnalysisRequestSchema = z.object({
  imageBase64: z.string().min(1),
  options: z.object({
    includeRecommendations: z.boolean().default(true),
    zone: z.enum(['full', 't-zone', 'u-zone']).default('full'),
  }).optional(),
});

export const skinAnalysisResponseSchema = z.object({
  skinType: z.enum(['dry', 'oily', 'combination', 'normal', 'sensitive']),
  scores: z.record(z.string(), z.number().min(0).max(100)),
  recommendations: z.array(z.string()),
});

export type SkinAnalysisRequest = z.infer<typeof skinAnalysisRequestSchema>;
export type SkinAnalysisResponse = z.infer<typeof skinAnalysisResponseSchema>;
```

### 2.4 코드 생성

#### 스펙에서 코드 생성 파이프라인

```
1. 스펙 정의
   - SDD 문서 작성 (Markdown + 인터페이스 정의)
              |
              v
2. 스키마 추출
   - SDD에서 Zod 스키마 자동 생성 (스크립트)
              |
              v
3. 타입 생성
   - Zod에서 TypeScript 타입 추론
              |
              v
4. API 스텁 생성
   - 라우트 핸들러 템플릿 생성
              |
              v
5. 테스트 스텁 생성
   - 테스트 케이스 골격 생성
```

#### 코드 생성 스크립트 예시

```typescript
// scripts/generate-from-spec.ts
import { parseMarkdown } from './lib/markdown-parser';
import { generateZodSchema } from './lib/zod-generator';
import { generateApiRoute } from './lib/route-generator';

interface GenerateOptions {
  specPath: string;
  outputDir: string;
  dryRun?: boolean;
}

async function generateFromSpec(options: GenerateOptions) {
  const { specPath, outputDir, dryRun } = options;

  // 1. SDD 파싱
  const spec = await parseMarkdown(specPath);

  // 2. 인터페이스 섹션 추출
  const interfaces = extractInterfaces(spec);

  // 3. Zod 스키마 생성
  const schemas = generateZodSchema(interfaces);

  // 4. API 라우트 생성
  const routes = generateApiRoute(spec, schemas);

  // 5. 테스트 스텁 생성
  const tests = generateTestStub(spec, schemas);

  if (dryRun) {
    console.log('Generated files (dry-run):');
    console.log(schemas, routes, tests);
    return;
  }

  // 6. 파일 쓰기
  await writeFiles(outputDir, { schemas, routes, tests });
}
```

### 2.5 스펙 검증

#### 2.5.1 정적 검증 (CI)

```yaml
# .github/workflows/spec-validation.yml
name: Spec Validation

on: [push, pull_request]

jobs:
  validate-specs:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - name: Validate SDD format
        run: node scripts/validate-sdd-format.js

      - name: Check spec-code references
        run: node scripts/check-spec-references.js

      - name: Verify version consistency
        run: node scripts/verify-spec-versions.js
```

#### 2.5.2 검증 스크립트

```typescript
// scripts/check-spec-references.js
import { glob } from 'glob';
import * as fs from 'fs';

async function checkSpecReferences() {
  const errors: string[] = [];

  // 1. 모든 SDD 파일 수집
  const sddFiles = await glob('docs/specs/SDD-*.md');
  const sddIds = sddFiles.map(f => f.match(/SDD-[\w-]+/)?.[0]).filter(Boolean);

  // 2. 모든 코드 파일에서 @spec 참조 수집
  const codeFiles = await glob('apps/web/**/*.{ts,tsx}');

  for (const codeFile of codeFiles) {
    const content = fs.readFileSync(codeFile, 'utf-8');
    const specRefs = content.matchAll(/@spec\s+(SDD-[\w-]+)/g);

    for (const match of specRefs) {
      const specId = match[1];
      if (!sddIds.includes(specId)) {
        errors.push(`${codeFile}: 참조된 스펙 ${specId}가 존재하지 않음`);
      }
    }
  }

  // 3. SDD에 정의된 파일이 실제 존재하는지 확인
  for (const sddFile of sddFiles) {
    const content = fs.readFileSync(sddFile, 'utf-8');
    const fileRefs = content.matchAll(/`(apps\/web\/[\w/.-]+\.tsx?)`/g);

    for (const match of fileRefs) {
      const filePath = match[1];
      if (!fs.existsSync(filePath)) {
        errors.push(`${sddFile}: 참조된 파일 ${filePath}가 존재하지 않음`);
      }
    }
  }

  if (errors.length > 0) {
    console.error('Spec-Code 동기화 오류:');
    errors.forEach(e => console.error(`  - ${e}`));
    process.exit(1);
  }

  console.log('Spec-Code 동기화 검증 통과');
}

checkSpecReferences();
```

#### 2.5.3 런타임 검증

```typescript
// lib/api/validate-response.ts
import { z } from 'zod';

/**
 * API 응답이 스펙과 일치하는지 런타임 검증
 * 개발 환경에서만 활성화
 */
export function validateResponse<T>(
  schema: z.ZodSchema<T>,
  data: unknown,
  specId: string
): T {
  if (process.env.NODE_ENV !== 'development') {
    return data as T;
  }

  const result = schema.safeParse(data);

  if (!result.success) {
    console.error(`[스펙 위반] ${specId}:`, result.error.format());
    throw new Error(`Response does not match spec ${specId}`);
  }

  return result.data;
}

// 사용 예시
export async function POST(request: NextRequest) {
  const result = await analyzeSkin(imageData);

  // 개발 환경에서 스펙 준수 검증
  return NextResponse.json(
    validateResponse(skinAnalysisResponseSchema, result, 'SDD-S1 v1.2')
  );
}
```

### 2.6 협업 워크플로우

#### 2.6.1 스펙 변경 프로세스

```
1. 변경 제안
   - Issue 생성 (type: spec-change)
   - 영향 범위 분석
              |
              v
2. 스펙 수정 (PR #1)
   - SDD 문서 업데이트
   - 버전 번호 증가
   - 변경 이력 추가
   - 리뷰 및 머지
              |
              v
3. 코드 수정 (PR #2)
   - 스펙 PR 머지 후 시작
   - @spec 버전 업데이트
   - 구현 변경
   - 테스트 업데이트
   - 리뷰 및 머지
              |
              v
4. 검증
   - CI 검증 통과
   - 스펙-코드 동기화 확인
```

#### 2.6.2 역할 분담

| 역할 | 책임 | 도구 |
|------|------|------|
| **PM/Designer** | 기능 요구사항, 사용자 스토리 | Figma, Notion |
| **Tech Lead** | ADR 결정, 스펙 리뷰 | GitHub PR Review |
| **Developer** | SDD 작성, 코드 구현 | Claude Code, VSCode |
| **AI (Claude)** | 스펙 기반 코드 생성, 검증 | 자동화 스크립트 |

#### 2.6.3 Claude Code 워크플로우

```yaml
# Claude Code 작업 순서

1. 작업 시작 전:
   - "이 기능의 SDD가 있나요?"
   - 없으면: SDD 작성 먼저 제안
   - 있으면: SDD 확인 후 구현

2. 구현 중:
   - 코드에 @spec 주석 추가
   - SDD 섹션 참조 명시
   - 스펙과 다른 부분 있으면 질문

3. 구현 완료:
   - 테스트 코드에도 @spec 참조
   - SDD "구현 상태" 섹션 업데이트 제안
   - 스펙 대비 구현 차이점 보고
```

---

## 3. 구현 시 필수 사항

### 즉시 적용 (Week 1)

- [ ] 모든 SDD에 버전 번호 추가 (v1.0 형식)
- [ ] 모든 SDD에 변경 이력 섹션 추가
- [ ] 코드에 @spec JSDoc 주석 패턴 적용 시작
- [ ] `scripts/check-spec-references.js` 생성

### 단기 (Week 2-3)

- [ ] CI 파이프라인에 스펙 검증 추가
- [ ] Zod 스키마에 @spec 주석 표준화
- [ ] SDD 템플릿에 "영향 코드 파일" 섹션 추가
- [ ] 기존 주요 API에 @spec 참조 추가

### 중기 (Month 1)

- [ ] 스펙에서 코드 생성 스크립트 개발
- [ ] 런타임 스펙 검증 (개발 환경)
- [ ] 스펙 변경 알림 자동화 (Slack/Discord)
- [ ] 스펙 커버리지 대시보드

### 장기 (Quarter 1)

- [ ] TypeSpec 또는 OpenAPI 도입 검토
- [ ] 스펙-테스트 자동 연동
- [ ] 스펙 기반 문서 사이트 자동 생성
- [ ] AI 스펙 검증 도구 (Claude API 활용)

---

## 4. 스크립트 예시

### 4.1 스펙 참조 검사 스크립트

```typescript
// scripts/check-spec-references.ts
import { glob } from 'glob';
import * as fs from 'fs';
import * as path from 'path';

interface CheckResult {
  orphanedSpecs: string[];      // 코드에서 참조되지 않는 스펙
  orphanedCode: string[];       // 스펙이 없는 API 코드
  versionMismatches: string[];  // 버전 불일치
  brokenReferences: string[];   // 깨진 참조
}

async function checkSpecReferences(): Promise<CheckResult> {
  const result: CheckResult = {
    orphanedSpecs: [],
    orphanedCode: [],
    versionMismatches: [],
    brokenReferences: [],
  };

  // SDD 파일 수집
  const sddFiles = await glob('docs/specs/SDD-*.md');
  const sddMap = new Map<string, { version: string; path: string }>();

  for (const sddFile of sddFiles) {
    const content = fs.readFileSync(sddFile, 'utf-8');
    const idMatch = sddFile.match(/SDD-([\w-]+)/);
    const versionMatch = content.match(/Version:\s*([\d.]+)/i);

    if (idMatch) {
      sddMap.set(`SDD-${idMatch[1]}`, {
        version: versionMatch?.[1] || '1.0',
        path: sddFile,
      });
    }
  }

  // API 라우트 파일 검사
  const apiFiles = await glob('apps/web/app/api/**/*.ts');
  const referencedSpecs = new Set<string>();

  for (const apiFile of apiFiles) {
    const content = fs.readFileSync(apiFile, 'utf-8');
    const specMatches = content.matchAll(/@spec\s+(SDD-[\w-]+)(?:\s+v?([\d.]+))?/g);

    let hasSpecRef = false;
    for (const match of specMatches) {
      hasSpecRef = true;
      const specId = match[1];
      const codeVersion = match[2];

      referencedSpecs.add(specId);

      const spec = sddMap.get(specId);
      if (!spec) {
        result.brokenReferences.push(`${apiFile}: ${specId} 존재하지 않음`);
      } else if (codeVersion && codeVersion !== spec.version) {
        result.versionMismatches.push(
          `${apiFile}: ${specId} 버전 불일치 (코드: v${codeVersion}, 스펙: v${spec.version})`
        );
      }
    }

    // POST/PUT/PATCH 핸들러가 있지만 스펙 참조가 없는 경우
    if (!hasSpecRef && /export\s+async\s+function\s+(POST|PUT|PATCH)/.test(content)) {
      result.orphanedCode.push(apiFile);
    }
  }

  // 참조되지 않는 스펙 찾기
  for (const [specId, spec] of sddMap) {
    if (!referencedSpecs.has(specId)) {
      result.orphanedSpecs.push(`${specId} (${spec.path})`);
    }
  }

  return result;
}

// 실행
checkSpecReferences().then(result => {
  console.log('\n=== 스펙-코드 동기화 검사 결과 ===\n');

  if (result.brokenReferences.length > 0) {
    console.log('[ERROR] 깨진 참조:');
    result.brokenReferences.forEach(r => console.log(`  - ${r}`));
  }

  if (result.versionMismatches.length > 0) {
    console.log('\n[WARNING] 버전 불일치:');
    result.versionMismatches.forEach(r => console.log(`  - ${r}`));
  }

  if (result.orphanedCode.length > 0) {
    console.log('\n[INFO] 스펙 참조 없는 API:');
    result.orphanedCode.forEach(r => console.log(`  - ${r}`));
  }

  if (result.orphanedSpecs.length > 0) {
    console.log('\n[INFO] 참조되지 않는 스펙:');
    result.orphanedSpecs.forEach(r => console.log(`  - ${r}`));
  }

  const hasErrors = result.brokenReferences.length > 0;
  process.exit(hasErrors ? 1 : 0);
});
```

### 4.2 SDD 템플릿 생성 스크립트

```typescript
// scripts/create-sdd.ts
import * as fs from 'fs';
import * as path from 'path';

interface SDDOptions {
  id: string;
  title: string;
  type: 'feature' | 'api' | 'component' | 'system';
}

function generateSDD(options: SDDOptions): string {
  const today = new Date().toISOString().split('T')[0];

  return `# ${options.id}: ${options.title}

> ${getTypeDescription(options.type)}

---

## TL;DR

| 항목 | 내용 |
|------|------|
| **목표** | [한 줄 요약] |
| **핵심 파일** | \`lib/[module]/*.ts\` |
| **복잡도** | [점수]점 ([Quick/Light/Standard/Full]) |
| **예상 파일** | [N]개 |
| **의존성** | [선행 모듈/없음] |

---

## 1. 개요

### 1.1 목적

[이 기능의 목적]

### 1.2 범위

**포함:**
- [포함 항목]

**제외:**
- [제외 항목]

---

## 2. 요구사항

### 2.1 기능 요구사항

| ID | 요구사항 | 우선순위 |
|----|----------|----------|
| FR-1 | [요구사항] | P0 |

### 2.2 비기능 요구사항

| ID | 요구사항 | 기준 |
|----|----------|------|
| NFR-1 | 응답 시간 | < 2초 |

---

## 3. 설계

### 3.1 아키텍처

[Mermaid 다이어그램]

### 3.2 데이터 모델

\`\`\`typescript
interface [ModelName] {
  id: string;
  // ...
}
\`\`\`

### 3.3 API 스펙

\`\`\`typescript
// POST /api/[endpoint]
// @spec ${options.id} v1.0
\`\`\`

---

## 4. 구현 가이드

### 4.1 파일 구조

\`\`\`
apps/web/
+-- app/api/[endpoint]/route.ts
+-- lib/[module]/
|   +-- types.ts
|   +-- service.ts
+-- components/[module]/
\`\`\`

### 4.2 구현 순서

1. [ ] 타입 정의
2. [ ] 서비스 로직
3. [ ] API 라우트
4. [ ] 테스트

---

## 5. 테스트

### 5.1 테스트 케이스

| ID | 시나리오 | 예상 결과 |
|----|----------|----------|
| TC-1 | [시나리오] | [결과] |

---

## 6. 변경 이력

| 버전 | 날짜 | 유형 | 변경 내용 | 영향 코드 |
|------|------|------|----------|----------|
| 1.0 | ${today} | - | 초기 작성 | - |

---

**Version**: 1.0 | **Updated**: ${today}
`;
}

function getTypeDescription(type: SDDOptions['type']): string {
  const descriptions = {
    feature: '사용자 기능 스펙 문서',
    api: 'API 엔드포인트 스펙 문서',
    component: 'UI 컴포넌트 스펙 문서',
    system: '시스템/인프라 스펙 문서',
  };
  return descriptions[type];
}

// CLI 사용
const [, , id, title, type = 'feature'] = process.argv;

if (!id || !title) {
  console.log('Usage: npx ts-node scripts/create-sdd.ts <ID> <TITLE> [TYPE]');
  console.log('Example: npx ts-node scripts/create-sdd.ts SDD-S2 "피부분석v2" feature');
  process.exit(1);
}

const content = generateSDD({
  id,
  title,
  type: type as SDDOptions['type'],
});

const outputPath = path.join('docs/specs', `${id}.md`);
fs.writeFileSync(outputPath, content);
console.log(`Created: ${outputPath}`);
```

### 4.3 버전 동기화 스크립트

```typescript
// scripts/sync-spec-versions.ts

/**
 * 스펙 버전과 코드 버전 동기화 도우미
 * 사용: npx ts-node scripts/sync-spec-versions.ts SDD-S1 1.3
 */

import * as fs from 'fs';
import { glob } from 'glob';

async function syncSpecVersion(specId: string, newVersion: string) {
  console.log(`Syncing ${specId} to v${newVersion}...`);

  // 1. SDD 파일 업데이트
  const sddFiles = await glob(`docs/specs/${specId}*.md`);
  for (const sddFile of sddFiles) {
    let content = fs.readFileSync(sddFile, 'utf-8');
    content = content.replace(
      /Version:\s*[\d.]+/i,
      `Version: ${newVersion}`
    );
    fs.writeFileSync(sddFile, content);
    console.log(`  Updated: ${sddFile}`);
  }

  // 2. 코드 파일의 @spec 참조 업데이트
  const codeFiles = await glob('apps/web/**/*.{ts,tsx}');
  let updatedCount = 0;

  for (const codeFile of codeFiles) {
    let content = fs.readFileSync(codeFile, 'utf-8');
    const regex = new RegExp(`@spec\\s+${specId}\\s+v?[\\d.]+`, 'g');

    if (regex.test(content)) {
      content = content.replace(regex, `@spec ${specId} v${newVersion}`);
      fs.writeFileSync(codeFile, content);
      updatedCount++;
      console.log(`  Updated: ${codeFile}`);
    }
  }

  console.log(`\nDone! Updated ${updatedCount} code files.`);
}

const [, , specId, version] = process.argv;
if (!specId || !version) {
  console.log('Usage: npx ts-node scripts/sync-spec-versions.ts <SPEC-ID> <VERSION>');
  process.exit(1);
}

syncSpecVersion(specId, version);
```

---

## 5. 참고 자료

### 공식 문서

- [OpenAPI Specification 3.1](https://spec.openapis.org/oas/v3.1.0) - API 스펙 표준
- [TypeSpec](https://typespec.io/) - Microsoft API 스펙 언어
- [AsyncAPI](https://www.asyncapi.com/) - 이벤트 기반 API 스펙
- [Zod Documentation](https://zod.dev/) - TypeScript 스키마 검증

### 도구

- [openapi-generator](https://openapi-generator.tech/) - OpenAPI에서 코드 생성
- [orval](https://orval.dev/) - OpenAPI에서 React Query 생성
- [ts-json-schema-generator](https://github.com/vega/ts-json-schema-generator) - TypeScript에서 JSON Schema

### 관련 개념

- Contract-First Development
- Design-First API Development
- Schema-Driven Development
- API-First Design

### 이룸 프로젝트 내부 문서

- `docs/SDD-WORKFLOW.md` - SDD 워크플로우 가이드
- `docs/FIRST-PRINCIPLES.md` - 제1원칙
- `.claude/rules/00-first-principles.md` - 원칙 적용 규칙
- `docs/research/README.md` - 리서치 워크플로우

---

**Version**: 1.0 | **Updated**: 2026-01-16 | **Author**: Claude AI Research
**Note**: WebSearch 제한으로 내부 지식 기반 작성. 최신 도구 버전 확인 권장.
