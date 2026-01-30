# 법무/규제 문서

> **Version**: 1.0 | **Updated**: 2026-01-21
> 이룸 서비스의 법률/규제 준수 가이드

---

## 문서 목록

| 문서 | 설명 | 핵심 내용 |
|------|------|----------|
| [PRIVACY-COMPLIANCE.md](PRIVACY-COMPLIANCE.md) | 개인정보보호법 준수 | PIPA, 동의 UI, 이미지 보안 |
| [MEDICAL-BOUNDARY.md](MEDICAL-BOUNDARY.md) | 의료기기 경계 정의 | 금지/허용 표현, AI 프롬프트 제약 |
| [ADVERTISING-DISCLOSURE.md](ADVERTISING-DISCLOSURE.md) | 광고 표기 가이드 | 국가별 표기, 화장품 효능 제한 |
| [TERMS-OF-SERVICE.md](TERMS-OF-SERVICE.md) | 이용약관 템플릿 | AI 분석 면책, 사용자 권리 |

---

## 핵심 준수 사항

### 1. 개인정보보호

```
□ 민감정보(얼굴, 피부) 처리 동의 UI 필수
□ 이미지 30일 미접속 시 자동 익명화
□ clerk_user_id 기반 RLS 정책
□ 서명된 URL (1시간 만료)
□ 감사 로그 기록
```

### 2. 의료기기 경계

```
금지 표현:
❌ "진단", "치료", "효능", "효과"

허용 표현:
✅ "AI 분석", "참고 정보", "피부 상태 관찰"
✅ "결과는 참고용이며, 정확한 진단은 전문가와 상담하세요"
```

### 3. 광고 표기

```
어필리에이트 링크:
✅ "광고" 또는 "제휴 링크" 명시
✅ FTC/공정거래위원회 가이드라인 준수

쿠팡 파트너스:
✅ "이 포스팅은 쿠팡 파트너스 활동의 일환으로,
    이에 따른 일정액의 수수료를 제공받습니다"
```

---

## 국가별 규정

| 국가 | 개인정보 | 광고 표기 | 의료 경계 |
|------|----------|----------|----------|
| **한국** | PIPA | 공정거래위원회 | 의료기기법 |
| **일본** | APPI | 景品表示法 | 薬機法 |
| **미국** | CCPA/State | FTC | FDA |
| **EU** | GDPR | ASA | MDR |

---

## 관련 ADR

| ADR | 제목 | 관련 내용 |
|-----|------|----------|
| [ADR-022](../adr/ADR-022-age-verification.md) | 연령 인증 | 14세 미만 제한 |
| [ADR-023](../adr/ADR-023-terms-agreement-flow.md) | 약관 동의 플로우 | 동의 UI 설계 |
| [ADR-024](../adr/ADR-024-ai-transparency.md) | AI 투명성 | AI 분석 고지 |
| [ADR-025](../adr/ADR-025-audit-logging.md) | 감사 로깅 | 개인정보 접근 기록 |

---

## 관련 원리 문서

| 문서 | 설명 |
|------|------|
| [legal-compliance.md](../principles/legal-compliance.md) | 법적 준수 원리 |
| [security-patterns.md](../principles/security-patterns.md) | 보안 아키텍처 |

---

## 체크리스트

### 새 기능 출시 전

```markdown
□ 개인정보 수집 시 동의 UI 존재
□ AI 분석 결과에 면책 문구 포함
□ 어필리에이트 링크에 광고 표기
□ 의료 경계 문구 검토
□ 감사 로그 기록 확인
```

### 글로벌 확장 전

```markdown
□ 대상 국가 개인정보보호법 검토
□ 광고 표기 규정 확인
□ 의료기기 규정 확인
□ 약관/방침 다국어 번역
```

---

**Author**: Claude Code
