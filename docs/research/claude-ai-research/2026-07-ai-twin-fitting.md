# AI 디지털 트윈 기반 가상 피팅·뷰티 시뮬레이션 리서치

> **작성일**: 2026-07-09 | **P7 리서치 단계** (구현 아님, 아이디어 검증)
> **창업자 질문**: "사용자와 최대한 유사한 AI 모델(디지털 트윈)을 만들어 피팅+화장법+퍼스널컬러+얼굴형을 결합 표현하면 실제 스타일리스트급 효과가 나지 않을까? 비용·기술적으로 가능한가?"
> **결론 요약**: **기술적으로 가능. 2025~2026년 이미 상용화됨(Doji·Google Doppl).** 다만 "트윈 1회 생성" 방식(LoRA)은 이룸 비용정책(세션 수백원)에 부적합. **이룸에 맞는 현실적 답은 "Nano Banana(Gemini Flash Image)로 셀카→풀바디 트윈 1장 생성 후 재사용" 하이브리드.** 최대 리스크 3가지는 (1) 트윈 비유사성 신뢰 붕괴, (2) 스토어 딥페이크/초상권 심사, (3) 결합 표현 시 누적 화질 저하.

---

## 0. 창업자 질문에 대한 직답

| 질문           | 답                                                                                                                                                                                                                                                                                                |
| -------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **가능한가?**  | ✅ 예. Doji(디퓨전 트윈)·Google Doppl(Nano Banana 셀카→풀바디)이 2025년에 이미 출시. 이룸이 하려는 "트윈+옷+헤어+메이크업+PC 결합"은 기술적으로 성립.                                                                                                                                             |
| **얼마인가?**  | 방식에 따라 극단적으로 갈림. **LoRA 트윈**: 1회 생성 $0.5~수$ + 인프라, 장당은 저렴 → 이룸 정책 부적합(선투자·운영 복잡). **Nano Banana 트윈**: 트윈 생성 1장 ~$0.03~0.06, 이후 결합 표현 장당 ~$0.03~0.06 → **세션 수백원 정책 안에 들어옴.** FASHN(현재 이룸 방식) 장당 $0.075(볼륨 시 <$0.04). |
| **추천 방식**  | **B안(트윈 1회 생성 후 재사용) + Nano Banana(2c)** 조합. 셀카 여러 장→풀바디 트윈 1장 확정 저장→이후 옷/헤어/메이크업/PC 팔레트를 그 트윈에 프롬프트로 결합. 별도 파인튜닝 인프라 불필요, 상용 API로 즉시.                                                                                        |
| **리스크 톱3** | ① 트윈이 "나 같지 않을 때" 신뢰 붕괴(Doji 실사용 최대 불만) ② 스토어 딥페이크·초상권·미성년 정책 심사 ③ 옷+헤어+메이크업 다중 결합 시 누적 아티팩트·정체성 드리프트                                                                                                                               |

---

## 1. 기존 서비스 분석

### 1.1 Doji (도지) — "AI 디지털 트윈"의 정석

- **접근**: 사용자 셀카 **6장 + 전신 사진 2장** → 자체 디퓨전 모델로 개인화 아바타(트윈) 생성. **생성에 ~30분** 소요, 완료 시 푸시 알림. 마음에 안 들면 **새 사진으로 재학습(retrain)**.
- **사용 흐름**: 트윈 완성 후 앱이 어울릴 옷 룩을 추천, 웹의 의류 링크를 붙여넣어 "나에게 어울리는지" 확인. 소셜(친구 공유·피드백) 결합.
- **자금/팀**: 2025-05 시드 **$14M**(리드 Thrive Capital, 공동 Seven Seven Six). 창업자 Dorian Dargan(前 Apple VisionOS·Meta Oculus), Jim Winkels(前 DeepMind). 초대제, 80개국+.
- **비즈니스 모델**: 가격 미공개, 초대제 베타. 향후 fit 예측·앱 내 구매 통합 계획.
- **품질 평판(중요)**: 실사용 리뷰에서 **"아바타가 실제보다 마르거나 키 커 보인다"**, **"실물이랑 안 닮았다"**는 정체성/체형 정확도 불만이 최대 약점. 회사도 인지하고 "재학습" 옵션 + 정확도 개선을 자금 용처로 명시.
- **시사점**: 트윈 방식의 가치(무한 재사용·소셜)와 **아킬레스건(비유사성 신뢰 붕괴)**을 동시에 보여줌. 이룸이 그대로 가면 같은 벽에 부딪힘.

출처:

- https://techcrunch.com/2025/05/15/doji-raises-14m-to-make-virtual-try-ons-fun-through-ai-avatars/
- https://fashionopedia.com/dojis-ai-powered-app-digital-twins/
- https://www.forbes.com/sites/stephaniehirschmiller/2025/05/29/how-ai-virtual-try-on-solutions-google--doji-are-changing-retail/
- https://www.futurecommerce.com/the-senses/i-tried-doji-but-it-turned-me-into-a-black-man (정체성 왜곡 사례)

### 1.2 Google Doppl — "셀카 1장 → 풀바디 트윈"으로 진화

- **초기(2025-06 출시)**: 전신 사진 업로드 or 익명 AI 아바타 선택 → 원하는 옷 이미지(갤러리/Pinterest/IG/카메라) 오버레이. **움직이는 영상**으로 착용감 표현(차별점).
- **결정적 업데이트(2025-12)**: **셀카 1장 + 평소 사이즈 입력 → Nano Banana(Gemini 2.5 Flash Image)가 풀바디 디지털 버전 여러 장 생성 → 1장을 기본 트윈으로 선택.** 전신 사진 요구 폐지. 다양한 체형 모델 중 선택 가능(익명 선호 대응).
- **정책/비용**: 미국 한정, 18+ 연령확인. 무료(월 생성 횟수 제한). 화질/정확도 지표 미공개.
- **시사점**: **Google이 직접 "셀카→풀바디 트윈"을 Nano Banana로 구현**했다는 것이 이룸에 가장 중요한 신호. 이룸이 쓰는 것과 **동일 모델 계열**로 트윈 방식이 상용 품질에 도달했음을 증명.

출처:

- https://techcrunch.com/2025/12/11/googles-ai-try-on-feature-for-clothes-now-works-with-just-a-selfie/
- https://blog.google/technology/google-labs/doppl/
- https://techcrunch.com/2025/12/08/googles-ai-try-on-feature-now-works-with-just-a-selfie/ (참고: shoppable feed)
- https://www.engadget.com/ai/googles-new-ai-app-doppl-lets-you-try-on-outfits-virtually-120014003.html

### 1.3 에이블리 / Viton — 한국 시장 실전 사례

- **에이블리 'AI 옷입기'(2025-07)**: 사진 1장 업로드 → Y2K/오피스/빈티지/스트릿 등 스타일 착용. **'쇼핑몰 전용 AI 프로필'** = 사용자 트윈이 옷 입은 이미지 자동 생성(가상 피팅+스타일링 겸용). 도입 후 유저 30%↑, 특정몰 착용상품 매출 MoM 20%↑, 거래액 45%↑. **반품률 감소** 효과 보도.
- **시장 지위**: 2025-08 에이블리 MAU 916만 > 무신사 689만. 가상 피팅이 차별화 무기.
- **Viton**: 무신사·29cm·Zara·에이블리·W컨셉 등 **상품 페이지 링크로 가상 피팅** 지원(범몰 앱).
- **시사점**: 한국 사용자는 이미 "사진→AI 착용"에 익숙. 이룸의 차별점은 단순 착용이 아니라 **"5축 정체성(PC/피부/체형/헤어/메이크업)을 트윈에 결합"**이어야 함(경쟁사는 옷 중심, 뷰티 결합은 빈 시장).

출처:

- https://www.etnews.com/20250715000270
- https://www.thedailypost.kr/news/articleView.html?idxno=104204
- https://www.ebn.co.kr/news/articleView.html?idxno=1672721 (반품 감소)
- https://draph.ai/viton_ai_virtual_fitting_app_launch/

---

## 2. 기술 옵션 비교

### 2.1 세 가지 방식

**A안 — 사진 직접 합성 (현재 이룸 FASHN 방식)**
매번 사용자 사진 + 옷 → 합성. 트윈 개념 없음.

- 장점: 단순, 즉시성, 정체성은 원본 사진이라 항상 "본인".
- 단점: 매번 사진 필요, 헤어/메이크업/PC 결합에는 부적합(옷 특화), 세션마다 사진 업로드 마찰.

**B안 — 트윈 1회 생성 후 재사용 (창업자 아이디어의 핵심)**
셀카 여러 장 → 개인화 트윈 확정 → 이후 옷/헤어/메이크업/PC를 트윈에 무한 적용.

- **B-1 (LoRA 파인튜닝)**: 사용자별 LoRA를 학습. 정체성 충실도 최고, 그러나 **학습 1회 $50~300(전용 런) 또는 경량 $0.5~수$**, 사용자마다 별도 모델·스토리지·GPU 오케스트레이션 필요. **이룸엔 과함**(선투자·운영 복잡, 세션 정책 위배).
- **B-2 (InstantID / IP-Adapter / PuLID = 학습 없는 identity 보존)**: **파인튜닝 없이** 참조 얼굴 임베딩으로 정체성 유지. 학습 비용 0, 장당 추론만. 트윈을 "임베딩+대표 이미지"로 관리. SD 생태계 기반이라 자체 GPU 필요(Replicate/fal 호스팅 가능).
- **B-3 (Nano Banana 트윈) ★추천**: Gemini Flash Image가 **참조 이미지 여러 장(최대 20)으로 얼굴·체형·특징을 여러 생성에 걸쳐 안정 유지.** 셀카→풀바디 트윈 1장 생성 후 저장, 이후 그 트윈+옷/헤어/메이크업을 프롬프트 결합. **Google Doppl이 실제로 이 방식.** 파인튜닝·자체 GPU 불필요.

**C안 — Gemini Nano Banana의 multi-image identity 유지**
= B-3의 엔진 근거. "참조 이미지 전달 후 새 장면 프롬프트 → 얼굴 특징·체형 비율·특징 보존." 다중 이미지 융합·스타일 전이·가상 피팅 임베드가 공식 유스케이스로 명시됨. **이룸은 이미 Gemini 3 Flash 사용 중이라 진입장벽 최저.**

### 2.2 비교표

| 방식                                | 정체성 충실도      | 뷰티(헤어·메이크업) 결합 | 1회(트윈) 비용             | 장당 비용                              | 인프라 부담                          | 성숙도           | 이룸 적합성                   |
| ----------------------------------- | ------------------ | ------------------------ | -------------------------- | -------------------------------------- | ------------------------------------ | ---------------- | ----------------------------- |
| **A. 사진 직접 합성 (FASHN)**       | 최고(원본 사진)    | 낮음(옷 특화)            | 없음                       | ~$0.075 (볼륨 <$0.04, 576×864 저해상)  | 없음(API)                            | 높음(운영중)     | 현행 유지 가치 O, 뷰티 결합 X |
| **B-1. LoRA 파인튜닝**              | 최상               | 우수                     | $0.5~수$ (전용 런 $50~300) | 저렴(추론만)                           | **높음**(사용자별 모델·GPU·스토리지) | 중~높음          | ✗ 과투자·정책 위배            |
| **B-2. InstantID/IP-Adapter/PuLID** | 높음(학습 없이)    | 우수                     | 0 (학습 없음)              | ~$0.02~0.05 (자체/호스팅 GPU)          | 중(SD 파이프라인 자체 운영)          | 높음             | △ 가능하나 스택 신규          |
| **B-3. Nano Banana 트윈 ★**         | 중~높음(참조 다장) | **우수(프롬프트 결합)**  | ~$0.03~0.06 (트윈 1장)     | ~$0.03~0.06/장 (1K), 2K $0.05·4K $0.06 | 없음(Gemini API)                     | 높음(Doppl 검증) | **◎ 최적**                    |
| **C. = B-3 엔진**                   | —                  | —                        | —                          | —                                      | —                                    | —                | 이미 Gemini 사용중            |

> 비용 주: Nano Banana 기본 $0.03/장(≈1290 토큰 × $30/1M), Nano Banana 2 해상도별 1K $0.03·2K $0.05·4K $0.06. FASHN $0.075(2025-03 기준, 볼륨 시 <$0.04, 576×864). LoRA 전용 런 $50~300/회.

출처:

- https://developers.googleblog.com/en/introducing-gemini-2-5-flash-image/ (character consistency, multi-image fusion, virtual try-on 유스케이스)
- https://unifically.com/blogs/nano-banana (0.03/장)
- https://kie.ai/nano-banana-2 (해상도별 가격)
- https://openrouter.ai/google/gemini-2.5-flash-image
- https://fashn.ai/blog/pricing-update-for-developer-api (0.075/장)
- https://help.fashn.ai/plans-and-pricing/api-pricing
- https://instantid.github.io/ , https://github.com/instantX-research/InstantID , https://arxiv.org/abs/2401.07519 (학습 없는 identity 보존)
- https://www.stratagem-systems.com/blog/lora-fine-tuning-cost-analysis-2026 (LoRA $50~300)
- https://replicate.com/pricing , https://fal.ai/pricing (호스팅 추론 단가)

---

## 3. 뷰티 적용 (헤어·메이크업·PC 결합)

- **디퓨전 vs 기존 이룸 AR 오버레이**: 이룸 현행 VTO(립/블러셔 오버레이)는 "필터"에 가까움. 반면 **디퓨전 재생성 방식**(AI SuitUp·Musely·getimg 등)은 헤어를 얼굴에 **직접 렌더**해 엣지·광택·그림자가 조명·두상에 맞음. Musely는 픽셀 단위 모발 세그먼트로 뿌리~끝 색 전이(94% blend, ~30초). getimg은 플랫 필터가 아니라 얼굴형·피부톤·헤어라인 보존하며 재생성.
- **이룸 결합 시나리오**: 트윈 1장 확정 → 프롬프트에 "PC 팔레트 색 립/의상 + 추천 헤어컬러 + 메이크업 스타일 + 얼굴형 맞춤" 결합. Nano Banana의 multi-image + 자연어 편집으로 한 장에 5축 결합 표현 가능.
- **차별화 지점**: 경쟁사(Doji/Doppl/에이블리)는 **옷 중심**. **"퍼스널컬러·얼굴형·피부까지 반영한 뷰티 결합 트윈"은 사실상 빈 시장** — 이룸 5축 정체성의 시각적 종착점이 될 수 있음.
- **품질 주의**: 다중 결합(옷+헤어+메이크업 동시)일수록 **정체성 드리프트·아티팩트 누적**. 축을 하나씩 레이어링하며 정체성 앵커(트윈 참조 이미지)를 매 호출 재주입하는 설계 필요.

출처:

- https://www.aisuitup.com/post/top-ai-hairstyle-try-on-tools
- https://musely.ai/tools/hair-color-changer
- https://getimg.ai/use-cases/ai-hairstyle-changer
- https://arxiv.org/pdf/2407.14078 (Stable-Hair: 디퓨전 헤어 전이)

---

## 4. 리스크

### 톱3

1. **트윈 비유사성 → 신뢰 붕괴 (최대 리스크)**
   Doji 실사용 최대 불만 = "실물과 안 닮음/체형 왜곡", futurecommerce 사례는 인종까지 바뀜. 이룸의 핵심 가치가 "나를 가장 잘 아는 존재"인데, **트윈이 나 같지 않으면 브랜드 신뢰가 정면으로 무너짐.**
   - 완화: (a) 트윈 확정 전 사용자 승인 게이트("이게 나 맞나요?" 재생성 루프, Doppl·Doji 방식), (b) 원본 셀카를 항상 곁에 표기(과대 표현 방지), (c) 체형은 트윈 생성보다 이룸 기존 MediaPipe 측정값을 프롬프트 제약으로 주입해 "마르게/크게" 왜곡 억제.

2. **스토어 딥페이크·초상권·미성년 정책 심사**
   Google Play 2025 AI 콘텐츠 정책: 유해/비동의 딥페이크 생성 차단 사전 조치 의무, 앱 내 신고 기능 필수, **2025-11부터 제3자 AI 제공자(Gemini 등)에 개인데이터 전송 시 제공자·데이터 명시 동의 화면 필수.** Apple도 유사 가이드라인으로 페이스스왑/누디파이 앱 상시 제거. Doppl은 **18+ 연령확인·미국 한정**으로 대응.
   - 완화: (a) "본인 사진만" 업로드 약관+동의 게이트, (b) Gemini 데이터 전송 고지 동의 화면, (c) 앱 내 신고/삭제, (d) 미성년 정책 검토(연령 게이트), (e) 타인 얼굴 업로드 차단 검출.

3. **다중 결합 시 누적 화질 저하·정체성 드리프트**
   옷+헤어+메이크업+PC를 한 번에 얹을수록 얼굴이 뭉개지거나 다른 사람이 됨. 저해상(FASHN 576×864)·다단 편집일수록 심화.
   - 완화: 레이어 순차 적용 + 매 단계 트윈 참조 재주입 + 얼굴 영역 마스킹/보존, 필요시 2K 렌더($0.05).

### 기타 리스크

- **비용 폭주**: 트윈 재생성 루프·다축 결합은 세션당 여러 장 호출 → 세션 수백원 상한 초과 가능. 캐싱(트윈 1회 확정 후 재사용)·해상도 티어링으로 방어.
- **콜드스타트 UX**: Doji 30분 생성은 이탈 유발. Nano Banana는 초 단위라 유리.
- **한국 개인정보/생체정보**: 얼굴 = 민감정보. 저장·삭제·동의 설계 필수(이룸 30일 익명화 정책과 정합).

출처:

- https://support.google.com/googleplay/android-developer/answer/14094294 (Play AI 콘텐츠 정책)
- https://support.google.com/googleplay/android-developer/answer/16296680 (2025-07-10 정책)
- https://www.forasoft.com/blog/article/how-to-get-you-app-approved-on-google-play-and-the-app-store (2026 심사)
- https://indicator.media/p/most-faceswap-apps-in-the-apple-and-google-stores-could-be-used-to-make-deepfake-nudes

---

## 5. 추천안 (P7 → ADR 후보)

**단계적 도입 (MVP → 확장)**

1. **MVP: Nano Banana 셀카→풀바디 트윈 1장 (B-3)**
   - 이룸 온보딩 셀카(+기존 5축 분석 데이터) → 트윈 1장 생성 → **"이게 나 맞나요?" 승인 게이트** → 확정 저장(재사용).
   - 체형은 이룸 MediaPipe 측정값을 프롬프트 제약으로 주입(왜곡 억제, 3D 아바타 ADR-110과 시너지).
   - 엔진은 이미 쓰는 Gemini 계열 → 신규 인프라 0.

2. **결합 표현**: 트윈에 PC 팔레트 의상 + 추천 헤어컬러 + 메이크업 + 얼굴형 맞춤을 **레이어 순차** 적용. 5축 정체성의 시각적 종착점 = "스타일리스트가 코디해준 나".

3. **비용 가드레일**: 트윈 1회 확정 후 재사용(핵심), 기본 1K($0.03), 하이라이트 컷만 2K. 세션당 호출 상한.

4. **정책 가드레일**: 본인 사진 동의 게이트 + Gemini 전송 고지 + 앱 내 신고/삭제 + 연령/타인얼굴 검출.

**하지 말 것**: B-1(LoRA 사용자별 파인튜닝) — 선투자·운영 복잡·세션정책 위배. Doji식 30분 자체 디퓨전 학습도 이룸 규모엔 과투자.

**차별화 결론**: 경쟁사는 "옷을 트윈에 입힌다"에서 멈춤. **이룸은 "PC+피부+체형+헤어+메이크업 5축을 트윈에 결합"** — 이것이 "실제 스타일리스트급 효과"이자 이룸만의 빈 시장. 창업자 가설은 **기술·비용상 성립하며, 이룸의 5축 정체성과 정확히 맞물린다.**

---

## 6. 워크플로우 다음 단계 (P7)

- [ ] **원리 문서**: `docs/principles/`에 identity-preserving generation(참조 임베딩·정체성 앵커) 원리 정리
- [ ] **ADR**: "트윈 방식 선택(B-3 Nano Banana vs B-2 InstantID)" + 비용·정책 trade-off 기록 (ADR-110 3D 아바타와의 관계 명시)
- [ ] **스펙(SDD)**: 트윈 생성 입출력, 승인 게이트, 5축 레이어링 순서, 캐싱·해상도 티어, 동의 플로우
- [ ] **비용 시뮬**: 세션당 호출 수 × 단가 vs 이룸 수백원 상한 실측

---

**참고 문헌 (핵심 URL 재집계)**

- Doji: techcrunch.com/2025/05/15/doji-raises-14m..., fashionopedia.com/dojis-ai-powered-app-digital-twins, futurecommerce.com/the-senses/i-tried-doji-but-it-turned-me-into-a-black-man
- Google Doppl: blog.google/technology/google-labs/doppl, techcrunch.com/2025/12/11/googles-ai-try-on-feature-for-clothes-now-works-with-just-a-selfie
- 에이블리/Viton: etnews.com/20250715000270, thedailypost.kr/news/articleView.html?idxno=104204, draph.ai/viton_ai_virtual_fitting_app_launch
- Nano Banana: developers.googleblog.com/en/introducing-gemini-2-5-flash-image, unifically.com/blogs/nano-banana, kie.ai/nano-banana-2
- FASHN: fashn.ai/blog/pricing-update-for-developer-api, help.fashn.ai/plans-and-pricing/api-pricing
- Identity 보존: instantid.github.io, arxiv.org/abs/2401.07519, stratagem-systems.com/blog/lora-fine-tuning-cost-analysis-2026
- 뷰티 디퓨전: aisuitup.com/post/top-ai-hairstyle-try-on-tools, musely.ai/tools/hair-color-changer, arxiv.org/pdf/2407.14078
- 정책: support.google.com/googleplay/android-developer/answer/14094294, indicator.media/p/most-faceswap-apps...
