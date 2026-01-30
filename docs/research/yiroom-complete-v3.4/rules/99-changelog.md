# 99. 변경 이력 (Changelog)

> 모든 지침 파일의 변경 이력을 기록합니다.

---

## [v3.4] - 2026-01-15

### 🔧 지침 v6.1 - 세션 자동화 프로토콜

#### 신규 추가: `<session_protocol>` 섹션
| 프로토콜 | 내용 |
|----------|------|
| 세션 시작 | 트리거 조건 ("이어서", "계속", "진행"), 자동 확인 항목 |
| 세션 종료 | 트리거 단어 ("오늘 여기까지", "마무리"), 자동 생성 템플릿 |
| 파일 변경 추적 | 감지 대상, 자동 기록 규칙 |
| 버전 관리 | patch/minor/major 증가 기준 |
| TODO 연동 | 작업 완료 시 자동 체크 |

#### 예시 추가
- 세션 종료 예시 (`<example>` 6번째) 추가

#### 파일 변경
| 파일 | 변경 내용 |
|------|----------|
| `yiroom-claude-instructions-v6.1.md` | 세션 프로토콜 추가 |
| `13-coding-rules.md` | v1.1 - 세션 관리를 지침으로 이전 |
| `PROGRESS.md` | v1.2 - 최신 상태 반영 |
| `99-changelog.md` | v3.4 기록 |

---

## [v3.3] - 2026-01-15

### 🔧 지침 v6 - 파일 참조 방식 전환

#### 핵심 변경: 하드코딩 → 파일 참조
| 섹션 | 이전 (v5) | 변경 (v6) |
|------|----------|----------|
| `<role>` 전문 분야 | "Next.js 16 + React 19" | "01-tech-stack.md 참조" |
| `<context>` 프로젝트 현황 | "완료: Phase 1~3, A, B..." | "04-completed-phases.md 참조" |
| `<context>` 기술 스택 | 전체 테이블 하드코딩 | "01-tech-stack.md 참조" |
| `<constraints>` 제외 기능 | 4개 기능 나열 | "03-feature-classification.md 참조" |

#### 변경 이유
- 기술 업그레이드 시 지침 수정 불필요
- 단일 진실 원천 (Single Source of Truth) 확보
- 파일 간 불일치 위험 제거

#### 파일 변경
| 파일 | 변경 |
|------|------|
| `yiroom-claude-instructions-v6.md` | 신규 생성 |
| `99-changelog.md` | v3.3 기록 |

---

## [v3.2] - 2026-01-14

### 🔧 전체 개선 (Anthropic 베스트 프랙티스 완전 적용)

#### 부정형 → 긍정형 변환
| 이전 | 변경 |
|------|------|
| "신조어 금지" | "일반적인 한국어로 작성 (예: GMG → 목표 달성)" |
| "대규모 리팩토링 금지" | "점진적으로 소규모 단위로 개선" |
| "절대 금지 (영구 제외)" | "제외된 기능 (재제안 불필요)" |

#### 예시 5개로 확장
1. 기능 추가 요청 (캡슐 엔진 레시피)
2. 정보 부족 케이스 (퍼스널컬러 정확도)
3. UI 구현 요청 (운동 카드)
4. API 작성 요청 (인벤토리 CRUD)
5. 엣지 케이스 (제외된 기능 요청)

#### 추가된 내용
- 우선순위 명시 (법적 > 보안 > 기존코드 > 일관성)
- 정보 부족 시 출력 형식 추가
- 16-prompt-patterns.md 파일 참조 추가
- 모호한 표현 구체화

#### 파일 변경
| 파일 | 변경 |
|------|------|
| `yiroom-claude-instructions-v5.md` | 전체 개선 버전 |
| `99-changelog.md` | v3.2 기록 |

---

## [v3.1] - 2026-01-14

### 🔬 Anthropic 2025-2026 베스트 프랙티스 반영
- Claude 4.x 리터럴 해석 특성 반영
- XML 태그 구조화 적용
- 예시(Examples) 기반 지침 강화
- Context Engineering 원칙 적용

### 📁 변경/추가된 파일
| 파일 | 변경 내용 |
|------|----------|
| `16-prompt-patterns.md` | 신규 - Claude 4.x 프롬프트 가이드 |
| `_index.md` | 새 파일 추가 반영 |
| `99-changelog.md` | v3.1 기록 |

### 📝 지침 고도화
- `yiroom-claude-instructions-v4.md` 생성
- XML 태그 구조: role, context, guidelines, constraints, output_format, examples
- 파일 참조 방법 명시
- 실제 사용 예시 2개 포함

---

## [v3.0] - 2026-01-14

### 🔄 구조 변경
- 단일 파일 (v2.2) → 모듈화 구조 (16개 파일)
- ADR (Architecture Decision Records) 폴더 추가
- sessions 폴더 추가 (대화별 산출물)

### 📁 생성된 파일
| 파일 | 원본 섹션 |
|------|----------|
| `_index.md` | 신규 (마스터 인덱스) |
| `00-project-identity.md` | 섹션 1, 2 |
| `01-tech-stack.md` | 섹션 4 |
| `02-architecture.md` | 섹션 12, 15, 25 |
| `03-feature-classification.md` | 섹션 5 |
| `04-completed-phases.md` | 섹션 6 |
| `05-current-gap.md` | 섹션 7 |
| `06-avatar-system.md` | 섹션 16 |
| `07-data-consistency.md` | 섹션 18 |
| `08-body-correction.md` | 섹션 20 |
| `09-capsule-engine.md` | 섹션 10 |
| `10-inventory.md` | 섹션 17, 19 |
| `11-consulting-methodology.md` | 섹션 21, 22, 23 |
| `12-design-system.md` | 섹션 11 |
| `13-coding-rules.md` | 섹션 3, 8, 9, 13, 14 |
| `14-legal.md` | 섹션 26 |
| `15-competitor-analysis.md` | 섹션 24 |
| `99-changelog.md` | 신규 (변경 이력) |

---

## [v2.2] - 2026-01-14

### Added
- 아바타 생성 시스템 (섹션 16)
- 상품 등록 시스템 (섹션 17)
- 데이터 일관성 규칙 (섹션 18)
- 운동/영양 인벤토리 (섹션 19)
- 체형 교정 운동 (섹션 20)
- 이미지 컨설팅 방법론 (섹션 21)
- 디지털 드레이핑 알고리즘 (섹션 22)
- 얼굴형 분류 시스템 (섹션 23)
- 경쟁사 분석 (섹션 24)
- 프로젝트 구조 상세 (섹션 25)
- 법적 필수 기능 현황 (섹션 26)

---

## [v2.1] - 2026-01-13

### Added
- 17개 트랜스크립트 통합
- 26개 섹션 구성

---

## 📋 변경 기록 규칙

1. **파일 수정 시**: 해당 섹션에 기록
2. **구조 변경 시**: 최상단에 새 버전 추가
3. **ADR 작성 시**: 관련 결정사항 링크

---

## 🔗 관련 문서

- `_index.md` - 파일 목록
- `decisions/` - ADR 폴더
