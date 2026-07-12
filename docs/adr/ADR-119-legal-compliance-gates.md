# ADR-119: 홍보 전 법적 컴플라이언스 게이트 아키텍처

- **상태**: accepted
- **날짜**: 2026-07-12
- **관련**: [BIOMETRIC-CONSENT-ROLLOUT.md](../BIOMETRIC-CONSENT-ROLLOUT.md) · ADR-007(Mock 폴백) · ADR-099(통합 분석) · memory `legal-audit-preprom-2026-07-12`

## 배경 (Context)

미국·글로벌 커뮤니티 홍보 직전, 11차원 법적 감사(64에이전트·적대검증)에서 CONFIRMED 33건이 확인됐다. 핵심 축은 다섯 가지: ①생체정보(얼굴·체형 이미지)가 동의 게이트 없이 미국 Gemini로 전송(BIPA §15(b)/(d) — 위반당 $1,000~5,000·사적소권), ②연령 확인이 클라이언트 fail-open, ③어필리에이트 고지 컴포넌트가 고아(0 렌더), ④파기 크론 미등록으로 "1년 파기" 약속 미이행, ⑤계정삭제가 일부 버킷·테이블 미파기.

## 결정 (Decision)

### 1. 생체동의 = 가입 동의 단일 관문 + 서버 fail-closed 이중 게이트

- **수집·처리 동의**는 가입 약관 단계(`user_agreements.biometric_agreed` 3컬럼)의 별도 필수 항목 1곳에서 받는다. 모든 분석 흐름이 `/agreement` 게이트를 지나므로 7개 진입점에 각각 동의 UI를 두지 않는다(P4).
- 서버는 `requireBiometricConsent(userId)`(lib/api/biometric-consent.ts)로 7개 분석 라우트에서 재검증 — 미동의·조회실패 시 403(fail-closed). 클라이언트 가드 우회 방어선.
- **저장 동의(`image_consents`)와 분리 유지**: 수집·처리(글로벌·1회) vs 결과 저장(분석 유형별·선택)은 별개 법적 개념.
- 동의 문구에 Google(Gemini)·미국 전송을 명시(BIPA informed consent).

### 2. 연령 게이트 = `requireAgeVerified` fail-closed

`users.birth_date` 기반, 만 14세 미만·미상·에러 시 403. 기존 클라이언트 게이트(fail-open)는 UI 유도용으로 강등. 7개 분석 라우트에서 생체 게이트와 나란히 실행.

### 3. 위치정보 = 명시 동의 버튼 + 좌표 미저장

closet/recommend·style/weather의 GPS를 목적 고지 + 버튼 동의 뒤로. `location_consent` 플래그만 localStorage, 좌표는 비저장·open-meteo에 일시 전달만(위치정보보호법).

### 4. 파기 = 공유 유틸 + 크론 병합 (Vercel Hobby 2크론 상한)

- `lib/api/storage-purge.ts`: 9버킷 정본 + 재귀 수집. 즉시삭제 엔드포인트·soft/hard-delete 크론·cleanup-images가 동일 함수 사용(twins·integrated-sessions 중첩 버킷 누락 해소).
- 정리 크론 3종(접속기록 730일·30일 익명화·동의 만료)은 **이미 매일 도는 hard-delete-users 크론 GET 말미에 병합 호출** — Hobby 플랜 크론 2개 상한(soft/hard가 소진)에서 슬롯 0개로 실효화.

### 5. 고지 = 단일 문구 소스 + 인라인 + 백스톱

`components/affiliate/disclosure-text.ts`(순수 모듈, 서버/클라 공유)를 정본으로 구매 CTA 인접 6표면 인라인 + Footer 백스톱(제휴 수수료 + 통신판매중개자 지위 + 운영자 정보). 문구 변경 시 1파일 갱신으로 전 표면 반영.

### 6. AI 생성물 = 서버 번인 단일 지점

트윈 착장·AI 보정 다운로드는 서버 compose 경로에서 sharp로 가시 라벨('AI GENERATED'/'AI EDITED')을 픽셀에 번인 — 다운로드/공유 100%가 서버를 거치므로 클라 수정 불필요. 라틴 라벨(서버리스 CJK 폰트 부재), 번인 실패는 graceful(원본 반환, DOM 배지 백스톱).

## 대안 (Alternatives Considered)

| 대안                            | 기각 사유                                                                                      |
| ------------------------------- | ---------------------------------------------------------------------------------------------- |
| 미국/일리노이 지역 차단         | BIPA는 금지가 아니라 동의 요구 — 차단은 확장성(미국 시장)을 죽임. 동의 게이트가 합법 진입 경로 |
| 진입점(7곳)별 동의 UI           | 중복·누락 위험(P4 위반). 가입 관문 1곳이 완전 커버                                             |
| 정리 크론 신규 등록             | Hobby 2크론 상한 도달 — 3번째 추가 시 배포 파손. 병합이 슬롯 0 해법                            |
| 클라이언트 캔버스 번인          | 다운로드 경로마다 중복 구현 — 서버 단일 지점이 우월                                            |
| image_consents로 수집 동의 겸용 | 저장(선택·유형별)과 수집(필수·글로벌)은 법적 성격이 달라 혼용 불가                             |

## 결과 (Consequences)

- 기존 사용자 전원 `biometric_agreed=false` → 다음 분석 진입 시 `/agreement` 재동의(법적으로 올바른 절차, dev <100명).
- `birth_date` 미입력 사용자는 분석 403 → 클라이언트 연령 입력 UI로 해소(의도된 동작).
- **배포 순서 제약**: fail-closed라 prod 마이그레이션이 코드보다 먼저(런북 §3). 위반 시 전 분석 403.
- 어필리에이트 전환 웹훅이 서명 필수·fail-closed — 파트너 연동 시 `*_WEBHOOK_SECRET` env 필수.
- 처리방침 §4의 "가입 시 별도 필수 동의" 서술이 게이트 배포로 사실이 됨(허위고지 해소).

## 검증

웹 tsc 0 · prod build exit 0 · 4,065+ 테스트 그린 · eslint 0 · prod 컬럼 PostgREST 실재 확인 후 배포(d2eafe9f).
