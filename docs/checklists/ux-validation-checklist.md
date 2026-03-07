# UX 검증 체크리스트 (인덱스)

> 이 문서는 v3.0에서 3개 문서로 분리되었습니다 (2026-03-08)

---

## 문서 구조

| 문서                                                 | 용도                                  | 사용 시점                     |
| ---------------------------------------------------- | ------------------------------------- | ----------------------------- |
| [ux-pr-checklist.md](./ux-pr-checklist.md)           | 자동 점검 항목 (43개, pass/fail/warn) | `/ux-check` 명령어, 매 PR     |
| [ux-design-principles.md](./ux-design-principles.md) | 디자인 철학 레퍼런스                  | 새 기능 설계 초기             |
| [ux-review-protocol.md](./ux-review-protocol.md)     | 페르소나 워크스루 + 심층 리뷰         | `/quality-improve` Cycle 2    |
| [ux-known-issues.md](./ux-known-issues.md)           | 실패 패턴 라이브러리                  | 패턴 누적 + 체크리스트 피드백 |

## 사용 방법

```
일반 점검:     /ux-check
특정 화면:     /ux-check 홈 화면       (화면 유형 프로필 자동 적용)
빠른 점검:     /ux-check --quick       (Critical+High 12~13항목만)
이력 저장:     /ux-check --save        (결과 파일 저장 + 이전 비교)
심층 리뷰:     /quality-improve        (Cycle 2에서 ux-review-protocol.md 참조)
설계 참조:     docs/checklists/ux-design-principles.md 직접 열람
```

---

**Version**: 5.3 | **Updated**: 2026-03-08
**변경**: v5.3 — D9 자율성, D10 비의료 고지, E1 범위 확장 (43항목) | v5.2 — D7, D8, E5, E6, E7 추가 (41항목)
