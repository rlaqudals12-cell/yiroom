# ADR-095: 페르소나 기반 UX 시뮬레이션 개선

## 상태

승인됨 (2026-03-15)

## 맥락

6명의 전문가+일반 사용자 페르소나(보안 전문가, UX 디자이너, 시니어 사용자, 시각장애 사용자, 피부과 전문의, 초보 사용자)를 대상으로 편의성·보안·사용성 시뮬레이션을 실시하여 25건의 UX 개선 항목을 도출했다.

이 중 코드로 해결 가능한 항목을 3차에 걸쳐 구현했다.

## 결정

### 1차 개선 (보안·편의성)

- **API error.message 클라이언트 노출 제거** (21건): 내부 에러 메시지 대신 고정 한국어 메시지 반환
- **Feature Flag 안전 기본값**: `?? true` → `?? false`로 변경 (미등록 플래그 기본 비활성화)
- **위험 작업 확인 강화**: 계정 삭제 시 이중 확인 + 사용 통계 표시
- **개인정보 접근 로그**: 데이터 내보내기/삭제 시 감사 로그 기록

### 2차 개선 (데이터 포터빌리티 + 분석 UX)

- **데이터 내보내기 확장**: 10개 → 15개 Supabase 테이블 (hair, makeup, oral_health, wishlists, inventory 추가)
- **분석 예상 시간 표시**: AnalysisLoadingBase에 `estimatedRemaining` 계산 + "약 N초 남음" 표시

### 3차 개선 (에러 처리 + 네비게이션 + 인사이트)

- **useAnalysisStatus hasError**: 분석 상태 조회 실패 시 에러 상태 노출 + refetch 기능
- **HomeStateRouter 에러 UI**: fetch 실패 시 "신규 사용자"로 잘못 표시하는 대신 에러 UI + 재시도 버튼
- **checkingExisting 뒤로가기**: 피부/PC-1 분석의 기존 결과 확인 스피너에 "돌아가기" 링크 추가
- **구강건강 페이지 뒤로가기**: 헤더에 ArrowLeft 네비게이션 추가
- **oralInsight good 등급**: 구강 건강이 good인 지표에도 유지 목적 식품 추천 제공 (기존: 0건)
- **요약 메시지 분화**: good 4개 이상 "매우 좋아요" / 그 외 "양호해요" 구분
- **알림 설정 toast 피드백**: sonner toast로 저장 성공/실패 피드백 제공
- **PC-1 error.tsx 생성**: 퍼스널 컬러 분석 라우트 에러 바운더리 추가
- **skin error.tsx 이모지 수정**: 에러 컨텍스트에 부적절한 ✨ → ⚠️ 교체

## 대안

- **에러 상태 무시**: fetch 실패 시 빈 상태 표시 → 사용자가 "분석을 안 했다"고 오해
- **toast 대신 inline 메시지**: 설정 저장 피드백을 인라인으로 → 공간 낭비, sonner가 이미 프로젝트 표준
- **good 등급 추천 생략**: 건강한 사용자에게 아무 정보 없음 → 앱 가치 전달 실패

## 결과

- 편의성: checkingExisting 탈출 경로, 알림 저장 피드백, 분석 시간 예측
- 보안: API error.message 노출 완전 제거, 안전한 feature flag 기본값
- 사용성: 에러 시 올바른 UI, good 등급에서도 유용한 정보 제공
- 접근성: AnalysisLoadingBase aria-label에 남은 시간 정보 포함

## 관련 문서

- [SDD-HOME-3STATE.md](../specs/SDD-HOME-3STATE.md) — HomeStateRouter 스펙
- [SDD-OH-1-ORAL-HEALTH.md](../specs/SDD-OH-1-ORAL-HEALTH.md) — 구강건강 모듈 스펙
- [ADR-007](./ADR-007-mock-fallback-strategy.md) — AI Mock Fallback 전략
- [error-handling-patterns.md](../../.claude/rules/error-handling-patterns.md) — 에러 처리 패턴

---

**Version**: 1.0 | **Created**: 2026-03-15
