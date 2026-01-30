# 이룸 (Yiroom) 프로젝트 지침 인덱스

> 이 파일은 모든 지침 파일의 마스터 인덱스입니다.
> 버전: 3.2 (전체 개선 버전)
> 최종 업데이트: 2026-01-14

---

## 📖 읽는 순서

### 🔴 필수 (모든 작업 전 확인)
1. `00-project-identity.md` - 프로젝트 정체성 + 제1원리
2. `01-tech-stack.md` - 기술 스택
3. `13-coding-rules.md` - 코딩 규칙 + 절대 규칙

### 🟡 상황별 참조
| 작업 유형 | 참조 파일 |
|----------|----------|
| 새 기능 개발 | 03, 04, 05 |
| 분석 모듈 | 06, 07, 11 |
| 추천 모듈 | 09, 10 |
| 운동/체형 | 08, 10 |
| UI/UX | 12 |
| 법적 검토 | 14 |
| 경쟁사 비교 | 15 |

---

## 📁 파일 목록

### Core (핵심)
| 파일 | 내용 | 버전 |
|------|------|------|
| `00-project-identity.md` | 프로젝트 정체성, 제1원리 사고법 | 1.0 |
| `01-tech-stack.md` | 기술 스택 | 1.0 |
| `02-architecture.md` | 프로젝트 구조, 도구 | 1.0 |

### Status (상태)
| 파일 | 내용 | 버전 |
|------|------|------|
| `03-feature-classification.md` | 기능 분류 체계 (보류/제외) | 1.0 |
| `04-completed-phases.md` | 완료된 Phase 목록 | 1.0 |
| `05-current-gap.md` | 현재 Gap (미완성 기능) | 1.0 |

### Systems (시스템)
| 파일 | 내용 | 버전 |
|------|------|------|
| `06-avatar-system.md` | 아바타 생성, AI 치수 예측 | 1.0 |
| `07-data-consistency.md` | 데이터 일관성 규칙 | 1.0 |
| `08-body-correction.md` | 체형 교정 운동 시스템 | 1.0 |
| `09-capsule-engine.md` | 캡슐 루틴 엔진 | 1.0 |
| `10-inventory.md` | 인벤토리 시스템 (상품 등록 포함) | 1.0 |
| `11-consulting-methodology.md` | 이미지 컨설팅 방법론 | 1.0 |

### Guidelines (가이드라인)
| 파일 | 내용 | 버전 |
|------|------|------|
| `12-design-system.md` | 디자인 시스템, UX 원칙 | 1.0 |
| `13-coding-rules.md` | 코딩 규칙, 절대 규칙, 세션 관리 | 1.0 |
| `14-legal.md` | 법적 필수 기능 | 1.0 |

### Reference (참고)
| 파일 | 내용 | 버전 |
|------|------|------|
| `15-competitor-analysis.md` | 경쟁사 분석 | 1.0 |
| `16-prompt-patterns.md` | Claude 4.x 프롬프트 패턴 | 1.0 |
| `99-changelog.md` | 변경 이력 | 1.1 |

---

## 🔄 변경 규칙

1. **파일 수정 시**: 해당 파일의 `version` 업데이트
2. **구조 변경 시**: `_index.md` 업데이트
3. **결정 변경 시**: `decisions/` 폴더에 ADR 작성
4. **모든 변경**: `99-changelog.md`에 기록

---

## 📂 관련 폴더

```
rules/          ← 지침 파일 (이 폴더)
decisions/      ← ADR (Architecture Decision Records)
sessions/       ← 대화별 산출물
```
