# AI 코드 리뷰 규칙

> Vibe Coding 리스크 방지 및 AI 생성 코드 품질 관리

## 배경

2026년 기준 AI 생성 코드의 45%에 보안 결함이 있으며, 40% 이상의 주니어 개발자가 이해하지 못한 AI 코드를 배포합니다. 이 규칙은 AI 도구 활용의 이점을 유지하면서 리스크를 최소화합니다.

## 필수 리뷰 체크리스트

### 1. 보안 검토 (OWASP Top 10)

AI가 생성한 코드에서 반드시 확인:

- [ ] **SQL Injection**: Supabase 쿼리에서 직접 문자열 연결 없음
- [ ] **XSS**: 사용자 입력을 `dangerouslySetInnerHTML` 없이 렌더링
- [ ] **인증 우회**: `auth.protect()` 호출 여부 확인
- [ ] **민감 데이터 노출**: `.env` 변수가 `NEXT_PUBLIC_`이 아닌지 확인
- [ ] **Rate Limiting**: 외부 API 호출에 제한 있는지 확인

### 2. 아키텍처 일관성

```
질문: 이 코드가 기존 패턴을 따르는가?

체크:
- [ ] Repository 패턴 사용 (lib/api/, lib/products/)
- [ ] Supabase 클라이언트 올바른 함수 사용
- [ ] 컴포넌트 위치가 기존 구조와 일치
- [ ] 타입 정의가 types/ 또는 해당 파일에 존재
```

### 3. 테스트 커버리지

AI 생성 코드에는 **반드시** 테스트 동반:

```typescript
// 좋은 예: AI가 새 함수 생성 시 테스트도 함께
// lib/utils/newFunction.ts
export function newFunction() { ... }

// tests/lib/utils/newFunction.test.ts
describe('newFunction', () => {
  it('should ...', () => { ... });
});
```

### 4. 에러 핸들링

AI 코드에서 누락되기 쉬운 부분:

```typescript
// 나쁜 예: 에러 핸들링 없음
const data = await supabase.from('users').select('*');

// 좋은 예: 에러 체크 포함
const { data, error } = await supabase.from('users').select('*');
if (error) {
  console.error('[Module] Error:', error);
  throw new Error('사용자 정보를 불러올 수 없습니다.');
}
```

## AI 생성 코드 식별

### 자동 태그

Claude Code가 생성한 코드는 커밋 메시지에 자동 포함:

```
Co-Authored-By: Claude Opus 4.6 <noreply@anthropic.com>
```

### 수동 태그 (선택)

복잡한 AI 생성 로직에 주석 추가:

```typescript
// AI-GENERATED: 이 로직은 Claude가 생성함 - 리뷰 필요
function complexAlgorithm() { ... }
```

## 금지 패턴

### 1. 블라인드 AI 코드 수락

```
❌ 금지: AI 출력을 검토 없이 그대로 커밋
✅ 필수: 모든 AI 출력은 이해하고 검증 후 커밋
```

### 2. 테스트 없는 AI 코드

```
❌ 금지: AI가 생성한 유틸리티/훅을 테스트 없이 배포
✅ 필수: 모든 새 함수에 최소 1개 테스트 케이스
```

### 3. 보안 우회

```
❌ 금지: AI가 제안한 빠른 해결책이 보안 검사를 우회
✅ 필수: 보안 관련 코드는 반드시 기존 패턴 따르기
```

## 리뷰 프로세스

### 단순 변경 (1-3 파일)

1. 코드 직접 검토
2. typecheck + lint 통과 확인
3. 관련 테스트 실행

### 복잡한 변경 (4+ 파일)

1. `/sisyphus` 명령으로 전문 에이전트 리뷰
2. 보안 체크리스트 수동 확인
3. 전체 테스트 스위트 실행
4. 필요시 동료 리뷰 요청

## 참고 자료

- [Google Cloud: Vibe Coding 가이드](https://cloud.google.com/discover/what-is-vibe-coding)
- [OWASP Top 10](https://owasp.org/www-project-top-ten/)
- [Anthropic: Claude Code Best Practices](https://www.anthropic.com/engineering/claude-code-best-practices)

---

**Version**: 1.0 | **Updated**: 2026-01-13
