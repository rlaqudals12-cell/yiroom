# 최종 목적지 로드맵 — "분석기 → 조언자 → 동반자"

> 2026-07-07 수립. 전제 변경: **합격 전 고도화 동결 해제** — 시간 확보로 최종 목적지까지 개발 진행.
> 목적지: "나를 가장 잘 아는 존재, 그래서 세상과 나를 연결해주는 존재" (CLAUDE.md)

## 목적지 분해

```
동반자 = ① 정확히 안다(신뢰) + ② 매일 이끈다(실행) + ③ 대화한다(관계) + ④ 세상과 잇는다(연결)
```

근거 리서치: `memory/market-position-2026-07.md` (경쟁 최소 조건 3 + 컨설턴트 TOP5),
`memory/roadmap-3d-avatar.md`, 2026-07-07 재현성 실측 (PC/피부 5/5 일치).

## Phase 0 — 진행 중 마무리 (1~2일)

- [x] 데일리 캡슐 "솔루션 한 줄" 배선 ✅(c5686606) — 내 진단 데이터(추천성분·파운데이션 호수·best_colors 이름·체형 style_recommendations)를 아이템별 실행 지침으로 조립
- [x] 라이브 통합 분석 수정 배포 (V2 타임아웃+maxDuration+게이트) — 사용자 최종 확인 대기 (3.5-flash + maxDuration 수정 후)
- 완료 기준: 캡슐이 "generic 체크리스트"가 아닌 "내 진단 기반 지침"

## Phase 1 — 신뢰 기반 (~1주) · 경쟁 조건 ①

- [x] 재현성 측정 자동화 ✅(scripts/reproducibility-test.mts): 사진 N장 × 5회 반복 스크립트 → "판정 재현율 N%" 공식 지표
- [ ] 지표 문서화 + 랜딩 신뢰 카피 (사진 N장 확보 후 — repro-photos 폴더 대기) ("동일 사진 반복 분석 일치율 N%")
- [x] 품질 게이트 강화 ✅(e6feece3 — 서버 디코더 부활+통합 이식+해상도 하드게이트): 저품질 입력 reliability 'low' 강제 (현재 medium — 후함), route/CIE-1 앞단 게이트 실사
- [x] flash-lite A/B ✅(052bb1c0 — 모듈별 혼합: 피부=lite 5초, 색판정=3.5) (현재 15~19초/축 — lite는 더 싸고 빠름, 판정 품질만 검증)
- [ ] isMock 표면 잔여 정리 (W/N 등 숨김 모듈 폴백 10곳 — 복원 시)

## Phase 2 — 출시 ⏸ 파킹 (2026-07-07 사용자 결정: 합격 or 본인 만족 시점에)

- [ ] 실기기 APK 스모크 (카메라·성능) — `c:\dev\yiroom-release\yiroom-v1.0.0-preview.apk`
- [ ] Play 개발자 계정($25) + 제출 — 런북 `docs/PLAY-STORE-SUBMISSION.md`
- (유지) Vercel 자동배포 정상화 확인 + 애널리틱스 이벤트 확충은 개발 중 병행

## Phase 3 — 조언자 완성: 실물 연결 (2~4주) · 목적지의 몸통, 경쟁 조건 ②③

- [x] 제품 파이프 개통 ✅(2026-07-08): prod 0행→시드 700(화장품 500·색조 123·영양제 200) + 컬럼/CHECK gap-apply 3건 + `/api/products/matched` 유령 컬럼 버그를 정합 엔진(lib/products/matching)으로 재작성
- [x] 캡슐 솔루션 → 실제 제품 카드 연결 ✅(152316b3): 아이템별 최고 매칭 제품 칩(더블클렌징 서브타입 정합·시즌 하드필터·가격 접근성) → /products/cosmetic/{id}
- [~] **색조 SKU 확충 (수천)**: 수집기 완성 ✅(`scripts/collect-makeup-catalog.mts` — 네이버 검색→정규화/중복제거→Gemini lite 태깅[3/3 재현 검증]→적재, rating null·불확실 시즌 빈배열 정직 원칙). **네이버 API 키 등록만 남음(사용자 5분)**: developers.naver.com 앱 등록→검색 API→NAVER_CLIENT_ID/SECRET을 .env.local에
- [x] **옷장 자동화** ✅(0186b00f): /closet/add/batch — N장 선택→장당 AI 분류(FAST_MODEL·동시3)→인라인 수정→일괄 저장. classify에 seasons/occasions 추출 추가. **잠복버그 2건 동시 해소**: ①/closet/add 직접 insert가 clerk_user_id 누락(NOT NULL+RLS)으로 등록 항상 실패→API 경유 ②inventory-images 버킷 prod 부재(업로드 전멸)→생성. 후속: 옷장이 BottomNav에 없음(통합분석 CTA로만 도달)·배색엔진(LCh) 미연결은 TPO 코디 때 배선
- [x] **TPO 코디** ✅(ae64071f): /closet/recommend — 날씨 실연동(Open-Meteo·무키·계절추정 폴백 표시)+상황 칩+"이 코디에 이 립"(시즌 립 3종)+LCh 색조화 팁(color-bridge 신설 — 배색엔진 첫 옷장 배선). 스타일탭 정직화: 유령 PC 쿼리(result_season)·가짜 코디 4벌·죽은 라우트 2곳 → 실옷장 매칭/실라우트. **Phase 3 코어 완료** (색조 확충만 네이버 키 대기)

## Phase 4 — 동반자: 대화와 관계 (2~3주)

- [x] **AI 컨설턴트 채팅** ✅(bb6be354): /coach — 5축 프로필 주입은 기설비(getUserContext 15테이블) 확인, 신규 = "이 옷 어울려?" 사진 판정(멀티모달 스트림, 실키 검증: 코랄→여름쿨톤 보완법) + ConsultantCTA ?q/?category 미배선 결함 수정. 대화 저장·이어보기 배선 완료 ✅(b40f94cb — 세션 자동생성+메시지 저장+히스토리 패널 마운트+baseline 테스트 5건 수정). 잔여 후보: /chat 레거시 정리, 코치 네비 노출
- [x] **스타일 리포트** ✅(53666b50): /share/report/[token] — 비로그인 공개 문서(시즌 히어로+팔레트+시즌 립+피부/체형/헤어/메이크업+무료 CTA). report_shares 토큰(소유권 검증·재사용·화이트리스트 추출 — 사진/식별자 타입에 없음). 통합 결과에 공유 버튼. **부수 수리(12번째): /api/og가 proxy 미공개라 모든 OG가 크롤러에 404이던 것** → 공개 등록. 라이브 검증: 리포트 200·OG 200·무효토큰 404
- [x] 변화 추적: skinTrend 전 축 확장 ✅(f79b26a8 — 헤어·메이크업 결과에 "직전 대비" 칩, 피부는 기존재. 홈 뱃지 정리 결정과 충돌 없게 결과 페이지 표면). **3D 아바타 ✅(2026-07-08, ADR-110)**: P7 풀사이클(원리 `avatar-3d.md`→ADR-110→SDD→구현). 절차적 파라메트릭 메시(SMPL 에셋은 비상업 라이선스라 원리만 차용), 체형 결과 페이지에 회전 3D+직전 비교 고스트+2D 폴백. body_ratios JSONB 축적 시작(prod gap-apply 완). 부수: 유령 수리 3건(body-v2→body_analyses 정렬 #13, useUserMatching 유령 테이블·컬럼, OG metadata 유령 테이블 4모듈). **웹 v1 — 모바일 패리티는 의도적 제외(웹 검증 후)**
- [x] Level 3 프롬프트 ✅(9ea7c53c): skin/body/hair 3축에 직전 분석 tie-break 주입. 실측 기반 설계 — 상시 앵커는 재현성 하락(3/3→2/3), tie-break 한정으로 5/5 회복. PC는 Lab 결정론이라 미주입(판정 독립성)

## Phase 5 — 세상과 연결 (지속)

- [ ] 어필리에이트 전환 실측 → 수익 모델 검증
- [ ] i18n·숨긴 기능(W/N 등) 재검토 — 목적지 필수 아님, 데이터 보고 판단
- [ ] 12월 프라이머 지원 — Phase 1~3의 지표(재현율·다운로드·전환)가 트랙션 스토리

## 순서의 논리

신뢰(1) 없이는 뭘 얹어도 안 믿는다 → 출시(2)는 심사 대기 때문에 병행 선행 →
실물 연결(3)이 "조언자"의 완성 → 대화(4)는 3의 데이터를 먹고 산다.

## 관련 문서

- 경쟁·기능 리서치: `~/.claude/projects/.../memory/market-position-2026-07.md`
- 3D 아바타: `docs/research/claude-ai-research/2026-07-06-3d-body-avatar-roadmap.md`
- 재현성 실측: 커밋 32255f0f (thinkingLevel low, PC/피부 5/5)
