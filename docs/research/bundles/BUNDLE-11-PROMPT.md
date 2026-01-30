# BUNDLE-11: 법률/규정 준수

> 개인정보보호, 의료법, 저작권 리서치

---

## 메타데이터

| 항목 | 값 |
|------|-----|
| **Bundle ID** | BUNDLE-11 |
| **우선순위** | P2 |
| **예상 시간** | 2시간 |
| **도메인** | 법률/규정 |
| **포함 항목** | BIZ-LEGAL-COMPLIANCE, OPS-COMPLIANCE-AUTO, USER-PRIVACY-CONCERN, CORP-IP |

---

## 입력

### 참조 문서
- `docs/specs/SDD-LEGAL-SUPPORT.md` - 법적 지원 스펙
- `docs/specs/SDD-AI-TRANSPARENCY.md` - AI 투명성
- `.claude/rules/security-checklist.md` - 보안 체크리스트

### 선행 리서치
- 없음 (독립적, 필수 준수 영역)

---

## 출력

### 생성할 파일

| 파일명 | 내용 |
|--------|------|
| `docs/research/claude-ai-research/BIZ-LEGAL-COMPLIANCE-R1.md` | 법률 준수 개요 |
| `docs/research/claude-ai-research/OPS-COMPLIANCE-AUTO-R1.md` | 자동화된 규정 준수 |
| `docs/research/claude-ai-research/USER-PRIVACY-CONCERN-R1.md` | 사용자 프라이버시 |
| `docs/research/claude-ai-research/CORP-IP-R1.md` | 지식재산권 보호 |

### 출력 형식
- `RESEARCH-OUTPUT-FORMAT.md` 준수
- 각 파일 1500-3000단어

---

## 프롬프트

### BIZ-LEGAL-COMPLIANCE

```
한국 AI 뷰티 앱의 법률 준수 요구사항을 조사해주세요.

조사 범위:
1. 개인정보보호법 (PIPA) 핵심 요구사항
2. 청소년보호법 (미성년자 이미지 처리)
3. 의료법/의료기기법 제약사항
4. 광고법/표시광고법 요구사항
5. 전자상거래법 준수 사항
6. 약사법 (건강기능식품 추천)

기대 결과:
- 법률별 준수 체크리스트
- 위반 시 제재 수준
- 법률 자문 필요 영역 식별
- 약관 및 고지 문구 가이드

참고: docs/specs/SDD-LEGAL-SUPPORT.md 연계
```

### OPS-COMPLIANCE-AUTO

```
규정 준수 자동화 시스템 구축 전략을 조사해주세요.

조사 범위:
1. 개인정보 자동 익명화/삭제
2. 동의 관리 플랫폼 (CMP)
3. 이미지 보관 정책 자동화
4. 감사 로그 자동 생성
5. 연령 확인 자동화
6. 규정 변경 모니터링

기대 결과:
- 자동화 가능 규정 준수 영역
- 구현 우선순위 및 방법
- 도구/플랫폼 추천
- 규정 준수 대시보드 설계
```

### USER-PRIVACY-CONCERN

```
뷰티 앱 사용자의 프라이버시 우려사항을 조사해주세요.

조사 범위:
1. 얼굴 이미지 제공 거부감
2. 데이터 활용 투명성 기대
3. 제3자 공유 우려
4. 데이터 삭제권 인식
5. 맞춤 광고 거부감
6. 데이터 유출 불안

기대 결과:
- 프라이버시 우려 수준별 대응 전략
- 신뢰 구축 커뮤니케이션 가이드
- 프라이버시 센터 설계
- 동의 획득 UX 개선
```

### CORP-IP

```
AI 뷰티 앱의 지식재산권 보호 전략을 조사해주세요.

조사 범위:
1. 특허 출원 가능 영역 (알고리즘, UI)
2. 상표권 등록 전략
3. AI 생성 콘텐츠 저작권
4. 오픈소스 라이선스 관리
5. 제휴사 IP 사용 계약
6. 특허 침해 리스크 관리

기대 결과:
- IP 포트폴리오 구축 전략
- 특허 출원 후보 목록
- 오픈소스 라이선스 체크리스트
- IP 보호 비용/ROI 분석
```

---

## 의존성

```
선행: 없음
후행: BUNDLE-15 (Crisis)
병렬: BUNDLE-01 (Tech), BUNDLE-02 (Biz), BUNDLE-05 (Platform)
```

---

## 검증

- [ ] 4개 파일 모두 생성됨
- [ ] 한국 법률 특화 내용
- [ ] 실행 가능한 체크리스트 포함
- [ ] 법률 자문 범위 명시

---

**Version**: 1.0 | **Created**: 2026-01-18
