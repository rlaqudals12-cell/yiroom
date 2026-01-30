# 워크플로우 로드맵

> Boris Cherny (Claude Code 제작자) 워크플로우 중 향후 도입 검토 항목

## 현재 구현 상태 (v9.6)

| 패턴           | 상태    | 구현 방식                                |
| -------------- | ------- | ---------------------------------------- |
| CLAUDE.md      | ✅ 완료 | 2.5k+ 토큰, 지속 업데이트                |
| 슬래시 명령어  | ✅ 완료 | 9개 (`/qplan`, `/qcode`, `/sisyphus` 등) |
| 서브에이전트   | ✅ 완료 | 7개 (6 전문가 + 오케스트레이터)          |
| Opus 4.5       | ✅ 완료 | 시지푸스 전용                            |
| 검증 루프      | ✅ 완료 | typecheck + lint + test                  |
| 권한 사전 허용 | ✅ 완료 | 364개 규칙 (settings.local.json)         |
| Plan Mode      | ✅ 완료 | `/qplan` 명령어                          |
| 커밋 시 포매팅 | ✅ 완료 | Husky + lint-staged                      |

---

## 향후 도입 검토 항목

### 1. PostToolUse 포매팅 훅

**역할**: 도구 실행 후 자동 코드 포매팅

**현재 대체 수단**: Husky + lint-staged (커밋 시점 포매팅)

**도입 검토 시점**:

- 팀 규모 5명+ 도달 시
- CI 포매팅 실패가 빈번할 때 (월 10건+)
- 실시간 포매팅 피드백 필요 시

**구현 가이드**:

```json
// .claude/settings.json
{
  "hooks": {
    "PostToolUse": [
      {
        "matcher": "Edit|Write",
        "command": "npx prettier --write $FILE"
      }
    ]
  }
}
```

**주의사항**:

- Husky 훅과 중복 실행 방지 필요
- 대용량 파일 편집 시 지연 발생 가능

---

### 2. /commit-push-pr 명령어

**역할**: git commit + push + PR 생성 원스톱 자동화

**현재 대체 수단**: 수동 git 명령어 실행

**도입 검토 시점**:

- 일일 PR 생성 5건+ 시
- 팀 PR 컨벤션 강제 필요 시
- 반복적인 커밋 메시지 형식 요구 시

**구현 가이드**:

```markdown
# .claude/commands/commit-push-pr.md

## /commit-push-pr 명령어

git 작업을 한 번에 처리합니다.

### 실행 순서

1. `git status`로 변경 파일 확인
2. `git diff`로 변경 내용 분석
3. 커밋 메시지 자동 생성 (컨벤션 준수)
4. `git add .` + `git commit`
5. `git push -u origin <branch>`
6. `gh pr create` (PR 템플릿 적용)

### 커밋 메시지 형식

\`\`\`
<type>(<scope>): <subject>

<body>

🤖 Generated with [Claude Code](https://claude.com/claude-code)

Co-Authored-By: Claude Opus 4.5 <noreply@anthropic.com>
\`\`\`

### 사용 예시

\`\`\`
/commit-push-pr
/commit-push-pr --draft
/commit-push-pr --no-pr
\`\`\`
```

**주의사항**:

- 민감한 파일 커밋 방지 로직 필요 (.env 등)
- PR 리뷰어 자동 지정 설정 검토

---

### 3. Adversarial 에이전트

**역할**: 코드 리뷰 결과에 구멍 찾기 (5개 추가 에이전트)

**현재 대체 수단**: 7개 전문 에이전트 파이프라인

**도입 검토 시점**:

- 팀 규모 10명+ 도달 시
- 프로덕션 버그 빈도 높을 때 (월 5건+)
- 높은 SLA 요구 서비스 운영 시
- 보안/결제 등 크리티컬 모듈 추가 시

**구현 가이드**:

```markdown
# .claude/agents/adversarial-reviewer.md

# Adversarial Reviewer

원래 리뷰 결과에 구멍을 찾는 에이전트

## 역할

- 다른 에이전트 결과물에 반론 제시
- 엣지케이스 발견
- 보안 취약점 심층 분석

## 실행 방식

1. code-quality 결과 수신
2. 5개 관점에서 반박 시도:
   - 성능 병목 가능성
   - 동시성 이슈
   - 메모리 누수 가능성
   - 입력 검증 우회
   - 에러 전파 경로

## 출력 형식

- 반박 성공: 구체적 수정 제안
- 반박 실패: "검증 완료" 표시
```

**주의사항**:

- 에이전트 수 증가로 비용 상승
- 실행 시간 증가 (파이프라인 길이)
- 과도한 반박으로 생산성 저하 가능

---

### 4. 팀 공유 설정 (.claude/settings.json)

**역할**: 팀 전체 공유 권한 및 설정 관리

**현재 상태**: .claude/settings.local.json (개인용)

**도입 검토 시점**:

- 팀 협업 시작 시
- 새 팀원 온보딩 시간 단축 필요 시

**구현 가이드**:

```json
// .claude/settings.json (git 추적)
{
  "permissions": {
    "allow": ["Bash(npm run:*)", "Bash(git:*)", "Bash(npx:*)"]
  },
  "model": "opus-4.5"
}
```

**주의사항**:

- 민감한 경로는 .local.json에 유지
- 팀 리뷰 후 머지

---

## 도입 결정 체크리스트

새 워크플로우 도입 전 확인:

1. **필요성**: 현재 워크플로우로 해결 불가능한가?
2. **빈도**: 해당 작업이 반복적으로 발생하는가?
3. **ROI**: 도입 비용 < 절감 효과인가?
4. **팀 합의**: 팀원 모두 사용 가능한가?

---

## 참고 자료

- [Boris Cherny 워크플로우 (2026)](https://venturebeat.com/technology/the-creator-of-claude-code-just-revealed-his-workflow-and-developers-are)
- [Claude Code Best Practices](https://www.anthropic.com/engineering/claude-code-best-practices)
- [InfoQ - Claude Code Creator Workflow](https://www.infoq.com/news/2026/01/claude-code-creator-workflow/)

---

## 변경 이력

| 버전 | 날짜       | 변경 내용                                  |
| ---- | ---------- | ------------------------------------------ |
| 1.0  | 2026-01-11 | 초기 버전, Boris 워크플로우 분석 기반 작성 |
