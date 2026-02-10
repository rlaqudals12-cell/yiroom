# /wrap-up - 세션 메모리 관리

> 대화 세션 종료 시 컨텍스트 저장 및 다음 세션 준비

---

## 명령 실행 시 수행할 작업

### 1. 현재 세션 분석

```
수집 항목:
- 진행한 작업 목록
- 완료된 TODO 항목
- 미완료 작업
- 발생한 오류/블로커
- 수정된 파일 목록
- 중요 결정사항
```

### 2. 세션 요약 생성

다음 형식으로 요약 문서 생성:

```markdown
# 세션 요약 - {날짜} {시간}

## 완료된 작업

- [x] 작업 1
- [x] 작업 2

## 미완료 작업 (다음 세션 계속)

- [ ] 작업 3
- [ ] 작업 4

## 주요 결정사항

- 결정 1: 이유
- 결정 2: 이유

## 발생한 이슈

- 이슈 1: 해결 방법 또는 상태

## 수정된 파일

- `path/to/file1.ts` - 변경 내용
- `path/to/file2.tsx` - 변경 내용

## 다음 세션 시작 컨텍스트

[다음 세션에서 바로 시작할 수 있는 요약]

## 관련 문서

- [관련 계획 문서](path/to/plan.md)
- [관련 스펙 문서](path/to/spec.md)
```

### 3. 저장 위치

```
.claude/sessions/
├── YYYY-MM-DD-HHMM-{topic}.md   # 개별 세션
└── LATEST.md                     # 최근 세션 (심볼릭)

# 또는 프로젝트별 위치
docs/sessions/
└── YYYY-MM-DD-HHMM-{topic}.md
```

### 4. 다음 세션 연계

다음 세션 시작 시 읽을 수 있도록:

1. `LATEST.md`에 최근 세션 링크
2. 세션 파일에 "다음 세션 시작 컨텍스트" 섹션 포함
3. 관련 계획 문서 링크 포함

---

## 사용 예시

### 기본 사용

```
/wrap-up
```

작업 중인 내용을 자동으로 분석하고 세션 요약 생성

### 주제 지정

```
/wrap-up 모바일 빌드 작업
```

주제를 파일명에 포함하여 저장

### 다음 세션 시작

```
# 다음 세션에서
cat .claude/sessions/LATEST.md
# 또는
cat docs/sessions/LATEST.md
```

---

## 자동 수집 정보

| 항목      | 소스                     | 용도      |
| --------- | ------------------------ | --------- |
| TODO 상태 | TodoWrite 내역           | 진행 상황 |
| Git 변경  | `git status`, `git diff` | 수정 파일 |
| 계획 문서 | `.claude/plans/`         | 컨텍스트  |
| 오류 로그 | 대화 내역                | 이슈 추적 |

---

## 세션 템플릿

### 생성되는 파일 형식

````markdown
# 세션 요약 - 2026-02-04 15:30

> **주제**: 모바일 앱 빌드 계획
> **관련 계획**: [cheeky-jingling-tome.md](../.claude/plans/cheeky-jingling-tome.md)

---

## 완료된 작업

- [x] MOBILE-BUILD-PLAN.md 작성
- [x] EAS 빌드 오류 분석
- [x] 고급 기능 로드맵 검토

## 미완료 작업

- [ ] Phase 1 로컬 테스트 (T1.1 ~ T2.8)
- [ ] EAS 빌드 오류 해결 (F1 ~ F6)

## 주요 결정사항

| 결정                   | 이유                                    |
| ---------------------- | --------------------------------------- |
| Base44 미사용          | 네이티브 앱 미지원, 기존 Expo 스택 유지 |
| MCP 장기 기억 3월 이후 | 사용자 데이터 축적 필요                 |

## 발생한 이슈

- **EAS 빌드 실패**: "Unknown error in Build complete hook"
  - 상태: 미해결
  - 다음 시도: F1 (@yiroom/shared 제거)

## 다음 세션 시작 컨텍스트

```bash
# 1. 현재 상태 확인
cat apps/mobile/docs/MOBILE-BUILD-PLAN.md

# 2. Phase 1 로컬 테스트 시작
cd apps/mobile
npx expo start

# 3. 테스트 항목 확인
# T1.1 개발 서버 시작
# T2.1 Clerk 인증 테스트
```
````

## 관련 문서

- [MOBILE-BUILD-PLAN.md](apps/mobile/docs/MOBILE-BUILD-PLAN.md)
- [계획 문서](../.claude/plans/cheeky-jingling-tome.md)
- [고급 기능 로드맵](docs/roadmaps/ADVANCED-FEATURES-ROADMAP.md)

```

---

## 연동

### 관련 명령어

| 명령어 | 연계 |
|--------|------|
| `/standup` | 세션 요약 활용한 일일 현황 |
| `/qplan` | 미완료 작업 계획 수립 |

### 관련 문서

- [standup.md](./standup.md) - 일일 현황
- [계획 모드](../.claude/plans/) - 계획 문서

---

**Version**: 1.0 | **Created**: 2026-02-04
```
