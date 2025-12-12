# 🤖 AGENT-STRATEGY.md - Agent & Subagent 활용 전략

**목적**: Claude Code의 Agent 기능을 최대한 활용하여 생산성 극대화  
**핵심**: "적재적소에 올바른 Agent 배치"

---

## 🎯 Agent 활용 핵심 개념

### Agent vs Subagent
```yaml
Main Agent (Claude):
  - 전체 작업 조율
  - 사용자와 직접 소통
  - 컨텍스트 유지 관리
  - Plan Mode 제어

Subagent:
  - 특정 작업 전문화
  - 독립된 컨텍스트
  - 병렬 실행 가능
  - 결과만 Main에 반환
```

### 언제 Subagent를 쓸까?
```yaml
효과적인 경우:
  ✅ 대량 파일 검색
  ✅ 병렬 검토 작업
  ✅ 독립적 모듈 개발
  ✅ 반복적 검증 작업

비효율적인 경우:
  ❌ 간단한 수정
  ❌ 순차적 작업
  ❌ 컨텍스트 공유 필요
  ❌ 실시간 피드백 필요
```

---

## 📋 이룸 프로젝트 전용 Subagent 정의

### 1. 스펙 검토 Agent
```yaml
---
name: yiroom-spec-reviewer
description: 이룸 프로젝트 스펙 문서 검토 전문가. 논리적 허점과 엣지케이스 발견
tools: Read, Grep, Glob
model: sonnet
---

당신은 이룸 프로젝트의 스펙 검토 전문가입니다.

역할:
1. Feature/Task/Dev 문서 간 일관성 검증
2. 논리적 허점 발견
3. 엣지케이스 식별
4. 구현 가능성 평가

검토 기준:
- 요구사항 명확성
- 기술적 타당성
- 성능 영향도
- 보안 취약점

결과 형식:
## 검토 결과
### ✅ 잘된 점
### ⚠️ 개선 필요
### 🚨 critical 이슈
### 💡 제안사항
```

### 2. 코드 품질 Agent
```yaml
---
name: yiroom-code-quality
description: 이룸 프로젝트 코드 품질 검사. Next.js 15 + TypeScript 표준 준수
tools: Read, Grep, Bash
model: sonnet
---

이룸 프로젝트 코드 품질 기준:

체크리스트:
1. TypeScript strict mode 준수
2. Next.js 15 App Router 패턴
3. Tailwind v4 + shadcn/ui 규칙
4. 한국어 주석 사용
5. Guard clause 패턴

자동 실행:
- npm run lint
- npm run type-check
- npm run test

보고서 생성:
- 코드 스멜 목록
- 개선 우선순위
- 리팩토링 제안
```

### 3. 테스트 작성 Agent
```yaml
---
name: yiroom-test-writer
description: 이룸 프로젝트 테스트 코드 작성 전문가
tools: Read, Write, Edit, Bash
model: inherit
---

테스트 작성 원칙:
1. 유닛 테스트 우선
2. 핵심 비즈니스 로직 집중
3. 엣지케이스 포함
4. 한국어 테스트 설명

테스트 구조:
describe('[기능명]', () => {
  it('정상 케이스 설명', () => {})
  it('에러 케이스 설명', () => {})
  it('엣지 케이스 설명', () => {})
})

커버리지 목표: 70%+
```

### 4. UI/UX 검증 Agent
```yaml
---
name: yiroom-ui-validator
description: 이룸 브랜드 가이드라인 준수 및 사용성 검증
tools: Read, Grep
model: sonnet
---

브랜드 체크:
- 톤앤매너: 따뜻한 전문가
- 문구: 존댓말, 긍정적
- 색상: 브랜드 컬러 준수
- 모바일 우선 디자인

접근성 체크:
- 시멘틱 HTML
- ARIA 레이블
- 키보드 네비게이션
- 컨트라스트 비율

성능 체크:
- 이미지 최적화
- 레이지 로딩
- 번들 크기
```

---

## 🔄 Agent 활용 패턴

### 패턴 1: 병렬 검토
```bash
# 사용법
"3개 subagent로 동시 검토:
1. yiroom-spec-reviewer로 스펙 검토
2. yiroom-code-quality로 코드 품질
3. yiroom-ui-validator로 UI 검증"

# 효과
- 시간 단축 (3배)
- 다각도 검증
- 독립적 피드백
```

### 패턴 2: 순차 파이프라인
```bash
# 사용법
"다음 순서로 진행:
1. yiroom-spec-reviewer로 스펙 확정
2. 코드 구현
3. yiroom-test-writer로 테스트 작성
4. yiroom-code-quality로 최종 검증"

# 효과
- 체계적 진행
- 단계별 품질 보증
- 명확한 완료 기준
```

### 패턴 3: 탐색 후 실행
```bash
# 사용법
"subagent로 관련 파일 모두 찾은 후
메인에서 일괄 수정"

# 효과
- 컨텍스트 절약
- 정확한 타겟팅
- 일관된 수정
```

### 패턴 4: 검증 루프
```bash
# 사용법
"구현 → subagent 검증 → 수정
→ 재검증 (통과할 때까지)"

# 효과
- 자동 품질 개선
- 인간 개입 최소화
- 일정 수준 보장
```

---

## 🧠 Thinking Mode 조합

### Agent별 최적 Thinking 레벨
```yaml
스펙 검토:
  - ultrathink 사용 (복잡한 로직)
  - 전체 시스템 영향 고려

코드 구현:
  - think hard 사용 (중간 복잡도)
  - 모듈별 집중

버그 수정:
  - think 사용 (빠른 대응)
  - 특정 문제 해결

아키텍처 설계:
  - ultrathink 필수
  - 장기적 확장성 고려
```

### 상황별 조합 예시
```yaml
복잡한 기능 개발:
1. Main: "ultrathink로 전체 설계"
2. Sub1: "think hard로 API 설계"
3. Sub2: "think hard로 UI 설계"
4. Main: "통합 및 조율"

긴급 버그 수정:
1. Main: "think로 빠른 분석"
2. Sub: "문제 파일 탐색"
3. Main: "즉시 수정"
```

---

## 📊 Agent 성능 최적화

### 컨텍스트 관리
```yaml
Subagent 장점:
  - 독립 컨텍스트 = 메인 보호
  - 필요한 정보만 반환
  - 병렬 처리 가능

주의사항:
  - 과도한 분할 = 오버헤드
  - 컨텍스트 공유 불가
  - 설정 시간 소요
```

### 토큰 효율화
```yaml
효율적 사용:
  - 큰 파일 검색 → Subagent
  - 반복 작업 → Subagent
  - 핵심 로직 → Main

비효율적 사용:
  - 간단 수정 → Main이 직접
  - 연속 작업 → Main 유지
  - 대화형 작업 → Main only
```

---

## 🚀 실전 활용 시나리오

### 시나리오 1: 새 기능 개발
```bash
병민님: "퍼스널컬러 진단 기능 만들어줘"

Claude:
1. Plan Mode 진입
2. "ultrathink로 기능 분석"
3. "3개 subagent로 동시 작업:
   - DB 스키마 설계
   - API 엔드포인트 설계
   - UI 컴포넌트 설계"
4. 통합 계획 수립
5. "이 계획으로 진행할까요?"

병민님: "좋아"

Claude:
6. 실행 모드 전환
7. 순차 구현
8. "yiroom-test-writer로 테스트 작성"
9. "yiroom-code-quality로 품질 검증"
10. 완료 보고
```

### 시나리오 2: 대규모 리팩토링
```bash
병민님: "전체 코드 TypeScript strict 적용해줘"

Claude:
1. "subagent로 전체 파일 스캔"
2. 영향도 분석 보고
3. "5개 subagent로 모듈별 병렬 수정:
   - components/
   - lib/
   - hooks/
   - app/
   - types/"
4. 통합 테스트
5. 완료 보고
```

### 시나리오 3: 버그 헌팅
```bash
병민님: "로그인이 안 돼"

Claude:
1. "think로 빠른 분석"
2. "subagent로 auth 관련 파일 검색"
3. 의심 지점 식별
4. "subagent로 로그 분석"
5. 원인 발견 및 수정
6. "yiroom-test-writer로 재발 방지 테스트"
```

---

## 📋 Agent 설정 체크리스트

### 프로젝트 시작 시
- [ ] `.claude/agents/` 폴더 생성
- [ ] 프로젝트별 agent 정의
- [ ] 팀 표준 agent 공유
- [ ] agent 역할 문서화

### 작업 시작 전
- [ ] 필요한 agent 식별
- [ ] agent 조합 계획
- [ ] 예상 토큰 소비 확인
- [ ] Plan Mode 활용 여부

### 작업 진행 중
- [ ] agent 성능 모니터링
- [ ] 필요시 agent 조정
- [ ] 결과 검증
- [ ] 피드백 반영

---

## ⚠️ Agent 사용 주의사항

### 피해야 할 실수
```yaml
과도한 분할:
  ❌ 모든 작업 subagent화
  ✅ 필요한 경우만 분할

컨텍스트 의존:
  ❌ subagent에 전체 컨텍스트 기대
  ✅ 독립 실행 가능한 작업만

무한 루프:
  ❌ subagent가 subagent 호출
  ✅ 단일 레벨 유지
```

### 트러블슈팅
```yaml
Agent 응답 없음:
  - 도구 권한 확인
  - 모델 설정 확인
  - 컨텍스트 크기 확인

잘못된 결과:
  - 프롬프트 명확성 개선
  - 도구 제한 조정
  - 모델 변경 고려

성능 저하:
  - agent 수 줄이기
  - 순차 실행 고려
  - 컨텍스트 정리
```

---

## 🎯 Agent 활용 마스터 팁

### Level 1: 초급
```yaml
- 기본 subagent 사용
- Plan Mode 활용
- think 키워드 사용
```

### Level 2: 중급
```yaml
- 커스텀 agent 작성
- 병렬 처리 활용
- 파이프라인 구축
```

### Level 3: 고급
```yaml
- agent 조합 최적화
- 자동화 워크플로우
- CI/CD 통합
```

### Level 4: 마스터
```yaml
- agent 오케스트레이션
- 자가 치유 시스템
- 완전 자동화 달성
```

---

**Agent를 마스터하면 "1명이 10명의 생산성" 달성! 🚀**
