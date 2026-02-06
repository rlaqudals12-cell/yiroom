# Git 워크플로우 규칙

> 모든 Git 작업에 적용되는 범용 규칙

---

## 브랜치 전략

### 브랜치 구조

```
main                    # 프로덕션 (보호됨)
├── feature/PC-1-xxx    # 기능 개발
├── fix/issue-123       # 버그 수정
├── refactor/xxx        # 리팩토링
└── docs/xxx            # 문서 작업
```

### 네이밍 규칙

| 접두사      | 용도      | 예시                        |
| ----------- | --------- | --------------------------- |
| `feature/`  | 새 기능   | `feature/coach-chat`        |
| `fix/`      | 버그 수정 | `fix/skin-analysis-timeout` |
| `refactor/` | 리팩토링  | `refactor/api-structure`    |
| `docs/`     | 문서      | `docs/adr-update`           |
| `hotfix/`   | 긴급 수정 | `hotfix/auth-error`         |

---

## 커밋 메시지

### Conventional Commits 형식

```
<type>(<scope>): <subject>

<body>

Co-Authored-By: Claude Opus 4.6 <noreply@anthropic.com>
```

### Types

| 타입     | 설명                    | 버전 영향 |
| -------- | ----------------------- | --------- |
| feat     | 새 기능                 | Minor     |
| fix      | 버그 수정               | Patch     |
| docs     | 문서 변경               | -         |
| style    | 포매팅 (코드 변경 없음) | -         |
| refactor | 리팩토링                | -         |
| test     | 테스트 추가/수정        | -         |
| chore    | 빌드/설정 변경          | -         |
| perf     | 성능 개선               | Patch     |

### Scopes

```
# 모듈별
workout, nutrition, products, dashboard, coach

# 기능별
db, auth, ui, a11y, api

# 분석별
pc1, s1, c1, w1, n1
```

### 예시

```bash
# 기능 추가
feat(coach): AI 웰니스 코치 채팅 기능 추가

# 버그 수정
fix(api): 피부 분석 API 429 에러 재시도 로직 수정

# 리팩토링
refactor(db): RLS 정책 통합 및 최적화

# 문서
docs(adr): ADR-027 코치 스트리밍 아키텍처 추가
```

---

## PR (Pull Request) 워크플로우

### PR 생성 전 체크리스트

```bash
# 1. 최신 main 반영
git fetch origin
git rebase origin/main

# 2. 린트 및 타입 체크
npm run lint
npm run typecheck

# 3. 테스트 실행
npm run test

# 4. 포맷팅
npx prettier --write .
```

### PR 템플릿

```markdown
## 요약

[변경 사항 1-2문장 설명]

## 변경 유형

- [ ] 새 기능 (feat)
- [ ] 버그 수정 (fix)
- [ ] 리팩토링 (refactor)
- [ ] 문서 (docs)

## 변경 파일

- [파일1]: [변경 내용]
- [파일2]: [변경 내용]

## 테스트

- [ ] 단위 테스트 추가/수정
- [ ] 수동 테스트 완료
- [ ] 기존 테스트 통과

## 스크린샷 (UI 변경 시)

[Before/After 이미지]

## 관련 이슈

Closes #123
```

### 리뷰 체크리스트

| 항목             | 확인                |
| ---------------- | ------------------- |
| 코드 스타일 준수 | 린트/타입체크 통과  |
| 테스트 커버리지  | 70% 이상            |
| 보안 취약점      | OWASP 체크          |
| 성능 영향        | 번들 크기, API 응답 |
| 문서화           | 필요 시 업데이트    |

---

## 머지 전략

### Squash Merge (권장)

```bash
# 여러 커밋을 하나로 압축
git merge --squash feature/xxx
```

- 깔끔한 main 히스토리
- PR 단위로 추적 용이

### Rebase Merge

```bash
# 선형 히스토리 유지
git rebase main
git merge --ff-only feature/xxx
```

- 커밋 히스토리 보존
- 복잡한 기능에 적합

---

## 충돌 해결

### 기본 플로우

```bash
# 1. 최신 main 가져오기
git fetch origin main

# 2. rebase 시도
git rebase origin/main

# 3. 충돌 발생 시 해결
# 파일 수정 후:
git add <resolved-files>
git rebase --continue

# 4. 포기 시
git rebase --abort
```

### 주의사항

- 공유 브랜치에서 rebase 금지
- 충돌 해결 후 반드시 테스트 실행

---

## 금지 사항

| 금지                       | 이유          |
| -------------------------- | ------------- |
| `.env` 파일 커밋           | 보안 위험     |
| `--no-verify` 플래그       | 검증 우회     |
| `git push --force` to main | 히스토리 손상 |
| 대용량 바이너리 커밋       | 저장소 비대화 |
| 민감 정보 하드코딩         | 보안 위험     |

---

## 유용한 명령어

```bash
# 브랜치 정리
git branch -d feature/xxx        # 로컬 삭제
git push origin --delete feature/xxx  # 원격 삭제

# 커밋 수정 (push 전)
git commit --amend              # 마지막 커밋 수정
git rebase -i HEAD~3            # 최근 3개 커밋 편집

# 변경사항 임시 저장
git stash
git stash pop

# 특정 커밋 체리픽
git cherry-pick <commit-hash>
```

---

## 관련 문서

- [code-style.md](./code-style.md) - 코드 스타일 규칙
- [testing-patterns.md](./testing-patterns.md) - 테스트 패턴

---

**Version**: 2.0 | **Updated**: 2026-01-19 | PR 템플릿, 리뷰 체크리스트 추가
