# BUNDLE-04: UX/접근성 통합

> 사용자 경험 및 접근성 표준 리서치

---

## 메타데이터

| 항목 | 값 |
|------|-----|
| **Bundle ID** | BUNDLE-04 |
| **우선순위** | P1 |
| **예상 시간** | 2시간 |
| **도메인** | UX/접근성 |
| **포함 항목** | A11Y-WCAG22, APP-PROGRESSIVE-DISCLOSURE, APP-ACCESSIBILITY-DEPTH, USER-ACCESSIBILITY-REAL |

---

## 입력

### 참조 문서
- `.claude/rules/react-patterns.md` - React 패턴
- `.claude/rules/mobile-patterns.md` - 모바일 패턴
- `apps/web/app/globals.css` - 현재 스타일
- `docs/research/claude-ai-research/SEO-NEXTJS-2026-R1.md` - SEO 리서치

### 선행 리서치
- BUNDLE-01: Next.js 기술 스택

---

## 출력

### 생성할 파일

| 파일명 | 내용 |
|--------|------|
| `docs/research/claude-ai-research/A11Y-WCAG22-R1.md` | WCAG 2.2 준수 가이드 |
| `docs/research/claude-ai-research/APP-PROGRESSIVE-DISCLOSURE-R1.md` | 점진적 공개 패턴 |
| `docs/research/claude-ai-research/APP-ACCESSIBILITY-DEPTH-R1.md` | 접근성 심화 |
| `docs/research/claude-ai-research/USER-ACCESSIBILITY-REAL-R1.md` | 실제 사용자 접근성 니즈 |

### 출력 형식
- `RESEARCH-OUTPUT-FORMAT.md` 준수
- 각 파일 1500-3000단어

---

## 프롬프트

### A11Y-WCAG22

```
WCAG 2.2 (2023년 10월 발표) 기준 웹 접근성 가이드를 조사해주세요.

조사 범위:
1. WCAG 2.2 새 성공 기준 (2.4.11~2.5.8)
2. 한국 웹 접근성 인증 (KWACC) 요구사항
3. React/Next.js 접근성 구현 패턴
4. 스크린 리더 호환성 (VoiceOver, TalkBack)
5. 키보드 네비게이션 구현
6. 색상 대비 및 텍스트 크기 조정

기대 결과:
- 이룸 앱 WCAG 2.2 AA 준수 체크리스트
- React 접근성 컴포넌트 패턴
- 테스트 도구 및 자동화 방법
- 한국 인증 획득 가이드
```

### APP-PROGRESSIVE-DISCLOSURE

```
복잡한 AI 분석 결과를 위한 점진적 공개 UX 패턴을 조사해주세요.

조사 범위:
1. 점진적 공개 원칙 및 심리학적 기반
2. 정보 계층 구조 설계
3. 요약 → 상세 드릴다운 패턴
4. 탭/아코디언/모달 사용 가이드
5. 사용자 숙련도별 UI 적응
6. 모바일 우선 정보 구조

기대 결과:
- 이룸 분석 결과 페이지 정보 구조 제안
- 3단계 정보 계층 (요약/기본/심화)
- 컴포넌트 패턴 라이브러리 가이드
- 사용자 테스트 시나리오
```

### APP-ACCESSIBILITY-DEPTH

```
뷰티/웰니스 앱의 심화 접근성 고려사항을 조사해주세요.

조사 범위:
1. 색맹/색약 사용자를 위한 퍼스널컬러 표현
2. 시각 장애인을 위한 이미지 분석 결과 전달
3. 고령 사용자 UI/UX 고려사항
4. 인지 장애 사용자를 위한 단순화
5. 청각 장애인을 위한 시각적 피드백
6. 저시력 사용자를 위한 고대비 모드

기대 결과:
- 도메인 특화 접근성 가이드
- 대안적 정보 전달 방법 설계
- 접근성 모드 UI 명세
- 사용자 페르소나별 요구사항
```

### USER-ACCESSIBILITY-REAL

```
실제 장애인 사용자의 뷰티 앱 사용 경험을 조사해주세요.

조사 범위:
1. 장애인 사용자 인터뷰 사례 연구
2. 장애인 뷰티 커뮤니티 니즈 분석
3. 접근성 개선이 비장애인에게 주는 이점
4. 포용적 디자인 성공 사례
5. 장애인 사용자 테스트 방법
6. 한국 장애인 디지털 접근성 현황

기대 결과:
- 실제 사용자 니즈 기반 요구사항
- 포용적 디자인 원칙 정리
- 사용자 테스트 프로토콜
- 접근성 개선 우선순위
```

---

## 의존성

```
선행: BUNDLE-01 (Tech)
후행: BUNDLE-08 (Psychology), BUNDLE-06 (Cross-Domain)
병렬: BUNDLE-03 (Acquisition), BUNDLE-12 (Team)
```

---

## 검증

- [ ] 4개 파일 모두 생성됨
- [ ] WCAG 2.2 최신 기준 반영
- [ ] 한국 접근성 인증 고려
- [ ] 뷰티 도메인 특화 내용 포함

---

**Version**: 1.0 | **Created**: 2026-01-18
