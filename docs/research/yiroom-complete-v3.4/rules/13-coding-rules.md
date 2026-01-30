# 13. 코딩 규칙

> version: 1.1
> last_updated: 2026-01-15
> source: v2.2 섹션 3, 8, 9, 13, 14

---

## 📋 3대 개발 원칙 (절대 규칙)

1. **Spec-First**: 스펙 없는 코드 작성 금지
2. **Plan-Then-Execute**: 계획 없는 실행 금지  
3. **Verify-Loop**: 모든 결과는 typecheck + lint + test 통과 필수

---

## 💻 네이밍 컨벤션

| 대상 | 규칙 | 예시 |
|------|------|------|
| 컴포넌트 | PascalCase | `UserProfile.tsx` |
| 함수/변수 | camelCase | `getUserData()` |
| 상수 | UPPER_SNAKE_CASE | `MAX_RETRY_COUNT` |
| 타입/인터페이스 | PascalCase | `interface UserData` |
| 파일명 | kebab-case (일반) / PascalCase (컴포넌트) | `api-utils.ts` |

---

## 📝 주석 규칙

- **한국어 주석 필수**
- 복잡한 로직에 WHY 설명
- TODO/FIXME 사용 시 담당자 명시

```typescript
// ✅ 좋은 예
// 캡슐 루틴 엔진: 보유 기구 없을 때 맨몸 운동으로 대체
// TODO(byungmin): Phase 2에서 헬스장 기구 추가 필요

// ❌ 나쁜 예
// This function handles the capsule routine
// TODO: fix later
```

---

## 🚨 절대 규칙

### 기존 기능 보호
- 기존 파일 수정 전 **반드시 승인 요청**
- 수정 시 이유 + 대안 + 영향 범위 설명 필수
- 대규모 리팩토링 금지 (점진적 개선만)

### 제외/보류 기능 준수
- 🔴 영구 제외 기능은 **절대 다시 제안하지 않음**
- 🟡🟠🔵 보류 기능은 사유와 재검토 조건 확인 후 제안
- 새 기능 제외 시 즉시 분류 체계에 추가

### 버그 추적
- 버그 발견/수정 시 패턴 기록
- 반복 버그 영역은 수정 시 각별히 주의

### 기술 변경
- 기존 기술 선택 사유 확인 없이 변경 제안 금지
- 변경 제안 시 기존 선택 사유 먼저 설명

---

## 📝 세션 관리 규칙

> 상세 프로토콜: **yiroom-claude-instructions-v6.1.md의 `<session_protocol>` 참조**

### 세션 종료 트리거
다음 키워드 입력 시 자동으로 세션 요약 생성:
- "오늘 여기까지"
- "다음에 계속"
- "세션 종료"
- "요약해줘"
- "마무리"

### 자동 업데이트 대상
| 파일 | 업데이트 내용 |
|------|-------------|
| PROGRESS.md | 현재 상태, TODO, 미해결 이슈 |
| 99-changelog.md | 버전, 변경 내용 |

---

## 💬 응답 스타일

- 한국어로 답변
- 표와 다이어그램 활용해서 명확하게
- 결정 필요 시 선택지 + 추천안 제시
- 코드 수정 시 변경 전/후 비교 제공
- 기존 패턴 따르기 (새 패턴 도입 시 근거 필요)

---

## 🔗 관련 문서

- `12-design-system.md` - UI 텍스트 가이드
- `01-tech-stack.md` - 기술 스택
- `yiroom-claude-instructions-v6.1.md` - 세션 프로토콜 상세
