# BUNDLE-15: 위기 관리 및 보안

> 위기 대응, 데이터 보안, 인시던트 관리 리서치

---

## 메타데이터

| 항목 | 값 |
|------|-----|
| **Bundle ID** | BUNDLE-15 |
| **우선순위** | P2 |
| **예상 시간** | 2시간 |
| **도메인** | 보안/위기관리 |
| **포함 항목** | CRISIS-PR, CRISIS-DATA-BREACH, OPS-DR, OPS-INCIDENT |

---

## 입력

### 참조 문서
- `.claude/rules/security-checklist.md` - 보안 체크리스트
- `docs/research/claude-ai-research/OPS-SLO-SLI-R1.md` - SLO/SLI

### 선행 리서치
- BUNDLE-07: 운영 및 인프라
- BUNDLE-11: 법률/규정 준수

---

## 출력

### 생성할 파일

| 파일명 | 내용 |
|--------|------|
| `docs/research/claude-ai-research/CRISIS-PR-R1.md` | 위기 PR 전략 |
| `docs/research/claude-ai-research/CRISIS-DATA-BREACH-R1.md` | 데이터 유출 대응 |
| `docs/research/claude-ai-research/OPS-DR-R1.md` | 재해 복구 계획 |
| `docs/research/claude-ai-research/OPS-INCIDENT-R1.md` | 인시던트 관리 |

### 출력 형식
- `RESEARCH-OUTPUT-FORMAT.md` 준수
- 각 파일 1500-3000단어

---

## 프롬프트

### CRISIS-PR

```
AI 뷰티 앱의 위기 PR 전략을 조사해주세요.

조사 범위:
1. 잠재적 위기 시나리오 식별
   - AI 오분석 이슈 (퍼스널컬러 오류)
   - 개인정보 유출
   - 부정확한 건강 정보 제공
   - 서비스 장애
2. 위기 대응 프로세스
3. 사과 커뮤니케이션 가이드
4. 소셜 미디어 위기 관리
5. 미디어 대응 전략
6. 위기 후 신뢰 회복

기대 결과:
- 위기 시나리오별 대응 플레이북
- 사과문 템플릿
- 미디어 Q&A 가이드
- 위기 대응 조직 체계
```

### CRISIS-DATA-BREACH

```
개인정보 유출 사고 대응 계획을 조사해주세요.

조사 범위:
1. 유출 사고 탐지 방법
2. 초기 대응 (골든 아워)
3. 법적 신고 의무 (PIPA)
4. 피해자 통지 프로세스
5. 포렌식 조사
6. 재발 방지 대책

기대 결과:
- 데이터 유출 대응 체크리스트
- 신고 타임라인 (72시간 규정)
- 피해자 통지 템플릿
- 사후 조치 가이드

참고: 한국 개인정보보호법 신고 의무
```

### OPS-DR

```
재해 복구 (Disaster Recovery) 계획을 조사해주세요.

조사 범위:
1. RPO/RTO 목표 설정
2. 백업 전략 (데이터, 설정)
3. 멀티 리전 구성
4. 페일오버 자동화
5. DR 테스트 계획
6. 비즈니스 연속성 계획 (BCP)

기대 결과:
- DR 계획 문서 템플릿
- Supabase/Vercel 백업 가이드
- 페일오버 절차서
- DR 테스트 시나리오
```

### OPS-INCIDENT

```
인시던트 관리 프로세스를 조사해주세요.

조사 범위:
1. 인시던트 심각도 분류 (SEV 1-4)
2. 온콜 로테이션
3. 인시던트 커맨더 역할
4. 커뮤니케이션 채널
5. 포스트모템 작성
6. 인시던트 지표 추적

기대 결과:
- 인시던트 대응 프로세스 문서
- 심각도별 대응 SLA
- 포스트모템 템플릿
- 온콜 가이드
```

---

## 의존성

```
선행: BUNDLE-07 (Ops), BUNDLE-11 (Legal)
후행: 없음
병렬: 없음
```

---

## 검증

- [ ] 4개 파일 모두 생성됨
- [ ] 한국 법률 요구사항 반영
- [ ] 실행 가능한 플레이북 포함
- [ ] 템플릿 및 체크리스트 제공

---

**Version**: 1.0 | **Created**: 2026-01-18
