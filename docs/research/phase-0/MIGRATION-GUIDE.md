# 이룸 Claude.ai 경량화 가이드 (v7 → v8.1)

> 생성일: 2026-01-15
> 목적: 대화 끊김 방지 + 핵심 컨텍스트 보존
> 최종 버전: **v8.1** (대화 이어가기 최적화)

---

## 🔄 v8 → v8.1 변경사항

### 문제점 발견 및 해결
| 문제 | v8 | v8.1 해결 |
|------|----|----|
| Lazy Loading 미작동 | 트리거 안내만 | **핵심 개념 인라인 포함** |
| 세션 요약 부족 | 4줄 템플릿 | **상세 템플릿 + 제약 보존** |
| 끊김 예방 미흡 | 팁만 제공 | **구체적 징후 + 행동 지침** |
| 누락 요소 | 다수 | **전체 보완 완료** |

### 보완된 누락 요소
- ✅ Claude 4.x 프롬프트 패턴 (REFERENCE.md)
- ✅ 얼굴형별 스타일링 방향 상세 (SYSTEMS.md)
- ✅ 영양 캡슐 예시 (SYSTEMS.md)
- ✅ 골반 후방 경사 교정 (SYSTEMS.md)
- ✅ ABCL 프레임워크 (SYSTEMS.md)

---

## ✅ 핵심 요소 완전성 검증

| 핵심 요소 | v7 | v8 | 상태 |
|----------|----|----|------|
| 프로젝트 정체성 | ✅ | ✅ CORE.md | ✅ |
| 기술 스택 | ✅ | ✅ CORE.md | ✅ |
| 3대 원칙 | ✅ | ✅ CORE.md | ✅ |
| 시지푸스 오케스트레이터 | ✅ | ✅ CORE.md | ✅ |
| .beads 이슈 트래킹 | ✅ | ✅ CORE.md | ✅ |
| 완료 Phase 목록 | ✅ | ✅ STATUS.md | ✅ |
| 영구 제외 기능 | ✅ | ✅ STATUS.md | ✅ |
| Phase N 구현 가이드 | ✅ | ✅ STATUS.md | ✅ |
| 시지푸스 복잡도 평가 | ✅ | ✅ STATUS.md | ✅ |
| 절대 주의사항 | ✅ | ✅ STATUS.md | ✅ |
| 캡슐 엔진 로직 | ✅ | ✅ SYSTEMS.md | ✅ |
| 헬스장 기구 DB | ✅ | ✅ SYSTEMS.md | ✅ |
| 아바타/체형/컨설팅 | ✅ | ✅ SYSTEMS.md | ✅ |
| 법적 요구사항 | ✅ | ✅ REFERENCE.md | ✅ |
| 경쟁사 분석 | ✅ | ✅ REFERENCE.md | ✅ |
| 세션 자동화 규칙 | ✅ | ✅ PROGRESS.md | ✅ |
| 버전 관리 규칙 | ✅ | ✅ PROGRESS.md | ✅ |
| 고도화 로드맵 Phase 0 | ✅ | ✅ PROGRESS.md | ✅ |

**→ 모든 핵심 요소 100% 포함 확인 ✅**

---

## 🎯 v8.1 핵심 개선: 대화 이어가기

### 지침에 핵심 개념 인라인 포함
```
v8: 지침 → "SYSTEMS.md 참조" → 사용자가 요청해야 참조
v8.1: 지침에 캡슐 루틴, 영구 제외 등 핵심 개념 직접 포함

→ 파일 참조 없이도 핵심 맥락 유지
```

### 세션 요약 템플릿 강화
```markdown
## 세션 요약 [날짜]

### 완료
- [구체적인 작업 내용]

### 핵심 결정
- [결정 사항 + 이유]

### 보류/검토 중
- [아직 결정 안 된 사항]

### 반드시 기억할 제약      ← 신규
- [다음 세션에서 반드시 고려할 것]

### 다음 작업
- [구체적인 다음 단계]

### 다음 세션 시작 프롬프트
"이룸 프로젝트 이어서. [구체적 작업] 진행할게."
```

### 끊김 예방 행동 지침
```
⚠️ 끊기기 전 징후:
- 응답이 점점 짧아짐
- 이전 결정과 모순되는 답변
- 반복적인 내용

→ 징후 발견 시: "지금까지 요약해줘" 요청
```

---

## 📊 경량화 결과

### 파일 수 변화
```
v7: 19개 파일 + 지침
v8: 4개 파일 + 지침 + CLAUDE.md (Claude Code용)

→ 79% 파일 수 감소
```

### 토큰 절감 (추정)
| 항목 | v7 | v8 | 절감 |
|------|----|----|------|
| 지침 | ~2,500 토큰 | ~800 토큰 | **68%** |
| 파일 총합 | ~15,000 토큰 | ~6,000 토큰 | **60%** |
| 세션당 로드 | 전체 로드 | Lazy Loading | **85-90%** |

---

## 🗂️ 파일 구조 변화

### Before (v7) - 19개 파일
```
00-project-identity.md
01-tech-stack.md
02-architecture.md
03-feature-classification.md
04-completed-phases.md
05-current-gap.md
06-avatar-system.md
07-data-consistency.md
08-body-correction.md
09-capsule-engine.md
10-inventory.md
11-consulting-methodology.md
12-design-system.md
13-coding-rules.md
14-legal.md
15-competitor-analysis.md
16-prompt-patterns.md
99-changelog.md
PROGRESS.md
_index.md
```

### After (v8) - 5개 파일
```
CORE.md       ← 00+01+02+13 통합
STATUS.md     ← 03+04+05 통합
SYSTEMS.md    ← 06+07+08+09+10+11 통합
REFERENCE.md  ← 12+14+15 통합
PROGRESS.md   ← 경량화
```

### Claude Code 전용
```
CLAUDE.md     ← 구현 작업용 (분리)
```

---

## 🚀 적용 방법

### Step 1: Claude.ai Projects 설정

1. **Instructions (지침)에 붙여넣기:**
   - `yiroom-claude-instructions-v8.md` 전체 내용

2. **Files에 업로드:**
   - `CORE.md`
   - `STATUS.md`
   - `SYSTEMS.md`
   - `REFERENCE.md`
   - `PROGRESS.md`

### Step 2: Claude Code 설정 (선택)

프로젝트 루트에 `CLAUDE.md` 파일 배치:
```bash
cp CLAUDE.md /path/to/yiroom/CLAUDE.md
```

---

## ✨ 핵심 변화

### 1. Lazy Loading 도입
```
❌ v7: 모든 파일 항상 참조
✅ v8: 트리거 키워드 감지 시 해당 파일만 참조

예시:
- "캡슐 루틴" 언급 → SYSTEMS.md 참조
- "법적 요구사항" 언급 → REFERENCE.md 참조
```

### 2. 환경별 분리
```
Claude.ai: 설계/기획/아키텍처 (지침 v8)
Claude Code: 구현/코딩 (CLAUDE.md)
```

### 3. 대화 끊김 방지
```
- 30-45분마다 요약 요청
- 세션 종료 프로토콜 유지
- 핵심 정보만 지침에 포함
```

---

## 🔄 마이그레이션 체크리스트

- [ ] Claude.ai Instructions에 v8 지침 붙여넣기
- [ ] 기존 v7 파일들 제거 (백업 권장)
- [ ] 새 5개 파일 업로드
- [ ] 테스트 대화로 동작 확인
- [ ] Claude Code에 CLAUDE.md 배치 (선택)

---

## 💡 사용 팁

### 세션 시작
```
이룸 프로젝트 이어서.
```

### 특정 시스템 논의
```
캡슐 루틴 엔진 개선 방안 논의해줘.
→ Claude가 자동으로 SYSTEMS.md 참조
```

### 세션 종료
```
오늘 여기까지
→ 완료/결정/다음/프롬프트 자동 생성
```

### 끊기기 전 대비
```
지금까지 요약해줘.
→ 새 세션에서 바로 이어서 작업 가능
```

---

## 📝 문의 및 개선

지침이나 파일 구조 개선이 필요하면:
1. 문제점 구체적으로 설명
2. 개선 방향 제안
3. 테스트 후 적용
