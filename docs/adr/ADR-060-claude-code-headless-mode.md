# ADR-060: Claude Code Headless Mode 도입 보류

## 상태

**검토 완료, 도입 보류** (2026-01-31)

## 컨텍스트

Claude Code의 headless mode는 비대화형(non-interactive) 방식으로 CLI를 실행하여 CI/CD 파이프라인, 자동화 스크립트 등에서 활용할 수 있는 기능이다.

### Headless Mode 개요

```bash
# 기본 사용
claude -p "작업 설명"
claude --print "코드 분석해줘"

# 도구 제한
claude --tools "Read,Grep,Edit" -p "변수명 변경"
```

### 제공 가능한 기능

| 기능 | 설명 |
|------|------|
| PR 자동 리뷰 | Claude가 PR diff 분석 후 리뷰 코멘트 |
| 테스트 자동 생성 | 새 코드에 대해 테스트 자동 생성 |
| 문서 동기화 | 코드 변경 시 문서 자동 업데이트 |
| 버그 분석 | 에러 로그 분석 및 수정 제안 |

## 결정

**런칭 후 (2026년 3월 이후) 재검토**

현 시점에서 headless mode 도입을 보류한다.

## 근거

### 1. 기존 CI/CD가 충분히 강력함

현재 구축된 자동화:
- Lint, Typecheck (Turbo)
- 테스트 3샤드 병렬 실행 (Vitest)
- 접근성 테스트 (axe-core)
- Dead code / 중복 코드 검사
- Lighthouse, 번들 크기 체크

### 2. 런칭 마일스톤 집중 필요

```
비공개 테스트: 2026-02-12 (D-12)
정식 출시: 2026-02-25 (D-25)
구글 액셀러레이터: 2026-02-28 (D-28)
```

P0 우선순위 작업에 리소스 집중이 필요하다.

### 3. Nice-to-have 기능

Headless mode가 제공하는 기능은 "있으면 좋은" 수준이며, 런칭에 필수적이지 않다.

### 4. 도구 성숙도

Claude Code headless mode는 일부 제한사항이 있음:
- Task tools 미지원
- OAuth 토큰 갱신 이슈
- 문서화 부족

## 향후 계획

### 재검토 시점

- 정식 런칭 완료 후 (2026년 3월)
- MAU 1만+ 달성 시 (개발 효율성 중요도 증가)

### 예상 활용 시나리오

```yaml
# 향후 추가 가능한 워크플로우
name: AI Code Review
on: pull_request

jobs:
  ai-review:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - name: Claude Code Review
        run: |
          claude -p "이 PR의 코드 변경사항을 검토하고
                    보안, 성능, 코드 품질 관점에서 피드백해줘" \
                 --tools "Read,Grep"
```

### 도입 시 고려사항

1. API 비용 관리 (사용량 모니터링)
2. 보안 (신뢰할 수 있는 환경에서만 실행)
3. 권한 제한 (`--disallowedTools` 활용)

## 관련 문서

- [Claude Code 공식 문서](https://docs.anthropic.com/claude-code)
- [.github/workflows/ci.yml](../../.github/workflows/ci.yml) - 현재 CI 설정

---

**작성일**: 2026-01-31
**작성자**: Claude Code
**다음 검토일**: 2026-03-15
