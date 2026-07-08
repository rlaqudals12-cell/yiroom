# 리서치: 이미지 생성/편집 — 가상 착장 · AI 보정 · 미래 변화 예측

> **작성일**: 2026-07-09
> **워크플로우 단계**: P7 리서치 (리서치 → 원리 → ADR → 스펙 → 구현)
> **대상 기능**: 신규 3종 — ① 의류 가상 착장(Virtual Try-On) ② AI 보정(Beautify) ③ 미래 변화 예측
> **제약**: 정직성/재현성 원칙(ADR-007), 세션당 수백원대 비용 상한, 품질 우선
> **다음 단계**: 본 문서 기반으로 원리 문서 → ADR → SDD 작성

---

## 0. 핵심 결론 (TL;DR)

| 기능               | 추천 스택                                                         | 이미지당 비용            | 우선순위                |
| ------------------ | ----------------------------------------------------------------- | ------------------------ | ----------------------- |
| **의류 가상 착장** | **FASHN.ai VTON API** (전용) + 본인 사진 + 캡슐 옷 이미지         | ~$0.075 (물량 시 <$0.04) | **P1**                  |
| **AI 보정**        | **Gemini 2.5 Flash Image (Nano Banana)** 프롬프트 기반 자연 보정  | ~$0.039                  | **P1**                  |
| **미래 변화 예측** | Nano Banana 편집 + **강한 면책·"시뮬레이션" 라벨** (또는 P2 보류) | ~$0.039                  | **P2 (법적 검토 필수)** |

- **공통 이미지 엔진**: 이룸은 이미 `lib/gemini` = Gemini 3 Flash 사용 중 → **Nano Banana(Gemini 2.5 Flash Image) 계열이 자연스러운 1순위**. 인물 identity 유지가 이 모델군의 핵심 강점이고, 이미 계정/키/SDK 인프라가 있음.
- **최대 리스크 3개**: (1) 미래 예측 이미지 = **한국 화장품법/의료법상 효능 보증 광고로 오인될 소지** → 강한 면책+제품 비연계 필수. (2) 보정/미래예측이 **분석 결과 자체를 왜곡**하면 재현성 원칙(ADR-007) 붕괴 → "공유용 렌더는 분석과 분리" 아키텍처 강제. (3) 모든 생성 이미지에 **SynthID 워터마크 자동 삽입** + AI 생성물 표시 의무 → 공유 이미지에 "AI 생성" 라벨 노출 불가피.

---

## 1. 이미지 생성/편집 API 지형 (2025–2026)

### 1.1 Google Gemini 이미지 모델 (Nano Banana 계열) — **이룸 1순위 후보**

| 모델                                       | 출시                | 이미지당 가격                                   | 특징                                                | identity 유지                         |
| ------------------------------------------ | ------------------- | ----------------------------------------------- | --------------------------------------------------- | ------------------------------------- |
| **Gemini 2.5 Flash Image** ("Nano Banana") | 2025-08, GA 2025-10 | **$0.039** (1290 토큰 @ $30/1M 출력)            | 자연어 국소 편집, 다중 이미지 블렌딩, 캐릭터 일관성 | ★★★ (얼굴/체형/특징 보존이 핵심 기능) |
| **Nano Banana Pro** (Gemini 3 Pro Image)   | 2026                | **$0.134** (1K/2K), $0.24 (4K), **배치 $0.067** | 최고 품질, 텍스트 렌더링 우수                       | ★★★                                   |
| **Nano Banana 2** (Gemini 3.1 Flash Image) | 2026                | Pro보다 저렴·빠름 (정확 가격 미공개)            | Pro의 경량 형제                                     | ★★★                                   |

- **핵심**: "reference 이미지 전달 → 새 장면 프롬프트" 방식으로 **얼굴 특징·체형 비율·고유 특성을 여러 렌더에 걸쳐 보존**. 이룸의 "본인 사진에 스타일 입히기"에 정확히 부합.
- **SynthID 비가시 워터마크가 모든 생성/편집 이미지에 자동 삽입** → AI 생성물 식별 가능(법적 표시 의무 대응에 유리하나, 은폐 불가).
- **Google Doppl**(아래 §2)이 바로 이 Nano Banana를 백엔드로 쓰는 소비자 앱 → 이룸이 **동일 모델로 Doppl류 경험을 직접 구현 가능**.
- 출처: [Google Developers Blog](https://developers.googleblog.com/en/introducing-gemini-2-5-flash-image/), [ai.google.dev](https://ai.google.dev/gemini-api/docs/models/gemini-2.5-flash-image), [pricepertoken (Nano Banana Pro)](https://pricepertoken.com/pricing-page/model/google-gemini-3-pro-image-preview), [OpenRouter](https://openrouter.ai/google/gemini-2.5-flash-image)

### 1.2 대안 모델 비교

| 모델                           | 이미지당 가격                                       | identity 유지                               | 비고                                                                |
| ------------------------------ | --------------------------------------------------- | ------------------------------------------- | ------------------------------------------------------------------- |
| **OpenAI gpt-image-1**         | $0.02 / $0.07 / $0.19 (low/med/high) · Mini $0.005~ | 중                                          | **2026-10-23 deprecated**, GPT Image 1.5/2로 이관. 신규 도입 비권장 |
| **FLUX.1 Kontext [pro]** (BFL) | **$0.04**                                           | ★★★ (캐릭터/얼굴 보존 우수, 반복 편집 특화) | Gemini 대안으로 가장 유력. 국소/전역 편집 모두 강함                 |
| **FLUX.1 Kontext [max]**       | **$0.08**                                           | ★★★                                         | 프롬프트 준수·타이포 최상                                           |
| **FLUX.1 Kontext [dev]**       | 오픈웨이트(자가 호스팅)                             | ★★                                          | 비용 절감용이나 인프라 부담                                         |

- **판단**: 이룸은 이미 Gemini 스택 → **Nano Banana를 기본**으로 하고, 편집 품질/identity가 부족하면 **Flux Kontext pro($0.04)를 fallback**으로 두는 이원 전략이 가장 현실적. gpt-image-1은 deprecation 때문에 제외.
- 출처: [OpenAI Images 가격](https://costgoat.com/pricing/openai-images), [platform.openai.com/pricing](https://platform.openai.com/docs/pricing/), [BFL Flux Kontext](https://bfl.ai/models/flux-kontext), [BFL pricing](https://bfl.ai/pricing)

---

## 2. 의류 가상 착장 (Virtual Try-On)

### 2.1 옵션 비교

| 옵션                    | 형태                              | 입력                                      | 가격                          | 상용 조건                        | 판단                            |
| ----------------------- | --------------------------------- | ----------------------------------------- | ----------------------------- | -------------------------------- | ------------------------------- |
| **FASHN.ai VTON API**   | **전용 API**                      | `model_image`(본인) + `garment_image`(옷) | **$0.075/장, 물량 시 <$0.04** | **생성물 상업적 사용 전면 허용** | **★ 최적**                      |
| **Google Doppl**        | 소비자 **앱 전용(공개 API 없음)** | 셀피 + 옷 스크린샷                        | 앱 무료                       | 통합 불가                        | 벤치마크로만                    |
| **Kling / Kolors 2.1**  | 플랫폼 API                        | 인물 + 옷                                 | 중                            | 확인 필요                        | 영상 착장 시 후순위 검토        |
| **IDM-VTON** (오픈소스) | 자가 호스팅                       | 인물 + 옷                                 | GPU 비용                      | 라이선스 확인                    | 품질·운영부담 큼                |
| **Nano Banana 직접**    | 범용 편집                         | 본인 + 옷 프롬프트                        | $0.039                        | 허용                             | 전용 모델 대비 착장 정합도 낮음 |

### 2.2 FASHN.ai 상세 (권장)

- **전용 모델**: 1,800만 착장 예시로 학습한 fashion 특화 모델. 범용 생성모델보다 **옷 정합·주름·질감·상하의 상호작용** 정확도 높음.
- **v1.6**: 네이티브 864×1296, Reframe로 최대 4K. 5–17초 생성.
- **입력**: `model_image`(본인 전신/상반신) + `garment_image`(플랫레이/고스트 마네킹/온모델 모두 가능). 이룸 캡슐 옷 이미지가 그대로 garment 입력이 됨.
- **identity 보존**: Quality 모드에서 원본 얼굴 identity·피부 질감 유지 개선. `Face to Model`(얼굴→상반신 아바타), `Model Swap` 등 부가 엔드포인트 존재.
- **핵심 적합성**: 이룸 시나리오("본인 전신 사진 + AI 추천 캡슐 옷 → 착장 렌더")에 **API 레벨에서 1:1 대응**. 상업적 사용 클리어.
- 출처: [FASHN API](https://fashn.ai/products/api), [FASHN Docs](https://docs.fashn.ai/), [FASHN VTON v1.6](https://docs.fashn.ai/api-reference/tryon-v1-6), [pixazo VTON API 비교](https://www.pixazo.ai/api/virtual-try-on)

### 2.3 Google Doppl (벤치마크)

- Google Labs 실험작, 2025-06 출시, iOS/Android(미국). **셀피만으로 전신 디지털 아바타 생성**(2025-12 업데이트, Nano Banana 사용) → 옷 스크린샷 오버레이 → 정지 이미지+애니메이션 클립.
- **공개 API 없음** → 직접 통합 불가. 단, "치수 정확도는 없음, 시각적 근사"라고 명시 → **이룸도 동일한 정직성 카피 필요**("실제 사이즈 아님").
- 출처: [blog.google Doppl](https://blog.google/technology/google-labs/doppl/), [TechCrunch (셀피 지원)](https://techcrunch.com/2025/12/11/googles-ai-try-on-feature-for-clothes-now-works-with-just-a-selfie/)

---

## 3. AI 보정 (Beautify)

### 3.1 두 갈래 접근

| 접근                          | 방식                                                                                 | 장점                                   | 단점                                                   |
| ----------------------------- | ------------------------------------------------------------------------------------ | -------------------------------------- | ------------------------------------------------------ |
| **A. 생성모델 프롬프트 보정** | Nano Banana/Flux Kontext에 "자연스러운 피부·조명 보정, 이목구비 변형 없이" 국소 편집 | 기존 스택 재사용, 자연스러움 조절 가능 | 얼굴 구조 변형 위험(프롬프트 제어 필요), 이미지당 과금 |
| **B. 전용 뷰티 SDK/API**      | Banuba FaceAR, AILab Tools, Perfect Corp 등 스무딩·슬리밍·화이트닝 필터              | 실시간·저지연, 파라미터 세밀 제어      | 별도 계약·SDK, "성형 필터" 윤리 논란 큼                |

- **권장**: **A안 (Nano Banana 프롬프트 보정)** — 이룸은 "화장품/스타일 앱"이지 "성형 카메라"가 아니므로, **피부톤·잡티·조명 수준의 가벼운 자연 보정**만 허용하고 **이목구비 변형(슬리밍/눈 확대)은 배제**하는 게 브랜드·윤리·법 모두에 안전.
- 출처: [Banuba Beauty AR SDK](https://www.banuba.com/facear-sdk/beauty-ar), [AILab Tools Retouch](https://www.ailabtools.com/retouch-portraits)

### 3.2 윤리·정책 리스크

- 학습 데이터 편향: 한 리뷰에서 상용 뷰티 AI 학습 이미지의 **70%+가 백인 여성** → 서구 미의 기준 강요·바디 다이스모피아 우려. 이룸 타겟(한국 10–30대)에 부적합한 보정이 될 수 있음.
- TikTok **Bold Glamour**류 생성형 필터 = 이목구비 직접 변형 → 사회적 반발. 이룸은 이 방향을 피해야 함.
- **투명성**: 동의 없는 보정·은폐 편집이 윤리 이슈. → 이룸은 **보정 강도 슬라이더 + 기본값 약함 + "보정됨" 표시**로 대응.
- 출처: [The Ethics of Digital Retouching (Medium)](https://medium.com/@kolomiietsvera657/can-ai-be-honest-about-beauty-the-ethics-of-digital-retouching-algorithms-3a0e46ba19a9)

---

## 4. 미래 변화 예측 (정직성이 최대 쟁점)

### 4.1 기존 서비스 사례

- **Perfect Corp AI Skin Simulation**: GAN으로 스킨케어 사용 효과·**미래 피부 상태 예측** 시뮬레이션. 명시적 면책: _"고객에게 피부 정보를 제공할 뿐 진단이나 의학적 조언을 의도하지 않는다."_ 600+ 브랜드 파트너.
- **Haut.AI**: 셀피+라이프스타일 교차분석으로 연령대 평균 기반 **'노화 곡선(aging curve)' 추정**.
- **Skinive 면책 표준 문구**: _"의학적 진단을 제공하지 않으며 전문 의료 조언의 대체물이 아님. 정보·교육 목적. 피부 우려 시 반드시 전문의 상담."_
- 출처: [Perfect Corp 보도자료](https://www.businesswire.com/news/home/20240201522235/en/Perfect-Corp.-Expands-AI-Skin-Simulation-Technology-Helping-Consumers-Visualize-Skin-Improvements-in-Seconds), [Perfect Corp AI Skin Emulation](https://www.perfectcorp.com/business/products/ai-skin-emulation), [Haut.AI](https://haut.ai/), [Banuba 스킨앱 리뷰](https://www.banuba.com/blog/best-skin-care-analysis-apps)

### 4.2 한국 법규 리스크 (★ 가장 중요)

- **화장품법 개정안 2026-04-23 본회의 통과**: AI로 생성한 **가상 전문가(의사·약사 등)가 화장품을 보증·추천하는 것으로 오인시키는 광고 금지**. 약사법·의료기기법도 동일 규제.
- **AI 콘텐츠 표시 의무**: AI 피부진단 앱·가상 메이크업 체험 등은 "인공지능 이용사업자"에 해당 → 편집자·제작 시점·편집 이력 등을 **메타데이터로 표시**해야 함.
- **기능성화장품 효능**: 심사·보고된 내용 범위 내에서만 광고 가능. 미심사 효능 암시는 위반.
- **리스크 해석**: "이 루틴 지키면 며칠 후 이렇게 변해요"라는 **before/after 예측 이미지가 특정 제품/루틴과 연계되면 → 심사받지 않은 효능을 보증하는 과장광고로 오인될 소지**. 식약처가 AI 과장광고 사이버 감시 중(63건 적발 사례).
- 출처: [식약처 AI 전문가 광고 금지 (cosinkorea)](https://www.cosinkorea.com/news/article.html?no=57318), [약사법·화장품법·의료기기법 개정 (kpanews)](https://www.kpanews.co.kr/news/articleView.html?idxno=530787), [화장품 광고자문 기준 해설서 2023 (KCIA PDF)](https://kcia.or.kr/), [식약처 AI 광고 감시 (kpanews)](https://www.kpanews.co.kr/news/articleView.html?idxno=529326)

### 4.3 안전한 표현 방식 (미래 예측 도입 시 준수)

1. **"예측"이 아니라 "시뮬레이션/예시"로 라벨링** — "며칠 후 이렇게 변합니다"(단정) ✗ → "꾸준히 관리하면 이런 방향을 기대할 수 있어요 (예시 시뮬레이션, 개인차 있음)" ✓
2. **특정 제품 효능과 직접 연결 금지** — 루틴(습관) 일반론까지만, 제품명+수치 개선 보증 ✗
3. **면책 상시 노출** — "AI 생성 예시 · 의학적 조언 아님 · 결과 보장 아님 · 개인차 있음"
4. **분석 결과와 물리적 분리** — 예측 렌더는 "재미/동기부여" 레이어이지 진단값 아님을 UI에서 명확히
5. **AI 생성 표시 + SynthID 유지**

---

## 5. 바이럴 공유 설계 사례

- **자연 강화형 필터가 바이럴 승리**: TikTok "real freckles" 필터 = 24시간 4.84억 영상. "Summer Tan", "heart photos" 등 **자연스러운 미화·테마 요소**가 공유를 유발. 과한 성형 필터보다 "진짜 같은 나의 개선판"이 강함.
- **한국 맥락**: 스노우 **퍼스널컬러 자가진단**이 TikTok에서 광범위 공유("정확도 높다"는 반응), Meitu 기반 '스노우 사진' 트렌드. 잼페이스·아이컬러 등 진단 앱은 **"친구에게 자랑/공유"가 자연 성장 동력**으로 관찰됨.
- **공유 유발 요인 정리**: (1) 결과가 **정체성 라벨**("너는 가을 웜톤")이라 자기표현 욕구 자극, (2) 결과 이미지가 **보기 좋음**(보정 가설의 근거), (3) 친구와 **비교·추천** 유도, (4) 새 필터의 신선함.
- **이룸 시사점**: 착장/보정 렌더는 "**나의 5축 정체성 + 개선된 모습**"을 한 장 카드로 → 공유 시 "AI 추천대로 입은 나" 서사가 바이럴 후크. 단 §3–4 정직성 가드레일 준수.
- 출처: [2025 TikTok Filter Trends (Accio)](https://www.accio.com/business/tiktok_filter_trending), [TikTok Beauty Filter Trends (Accio)](https://www.accio.com/business/tiktok_beauty_filter_trend), [퍼스널컬러 앱 UX 평가 (KCI)](https://www.kci.go.kr/kciportal/ci/sereArticleSearch/ciSereArtiView.kci?sereArticleSearchBean.artiId=ART003100393)

---

## 6. 기술 선택 추천안 (종합 표)

| 기능               | 구현 방법                                                                                   | 이미지당 예상 비용             | 세션 상한 적합성              | 리스크                                           |
| ------------------ | ------------------------------------------------------------------------------------------- | ------------------------------ | ----------------------------- | ------------------------------------------------ |
| **의류 가상 착장** | FASHN.ai VTON API (`model_image`+`garment_image`), 캡슐 옷 = garment. Fallback: Nano Banana | ~$0.075 (≈110원, 물량 시 절반) | 착장 1–2장/세션 = 수백원 내 ✓ | 치수 부정확(카피로 방어), 옷 이미지 저작권       |
| **AI 보정**        | Nano Banana 프롬프트 국소 보정(피부·조명, 이목구비 변형 금지) + 강도 슬라이더               | ~$0.039 (≈57원)                | ✓                             | 미의 기준 편향, 다이스모피아, "보정됨" 표시 필요 |
| **미래 변화 예측** | Nano Banana 편집으로 "개선 방향 예시" 렌더 + 강한 면책·시뮬레이션 라벨                      | ~$0.039                        | ✓                             | **법적 최고위험**: 효능 광고 오인, 재현성 훼손   |

> 비용 환산: 1 USD ≈ 1,450원 가정. 세션당 착장+보정 합쳐 2–3장이면 ~200–300원 → 수백원대 상한 내.

---

## 7. 정직성 원칙과의 긴장 지점 (ADR-007 관점)

| 쟁점                    | 허용 가능?     | 근거·가드레일                                                                                                                  |
| ----------------------- | -------------- | ------------------------------------------------------------------------------------------------------------------------------ |
| **공유용 보정 필터**    | ✅ 조건부 허용 | 공유/내보내기 **렌더 레이어에 한정**. 기본 강도 약함, "보정됨" 표시, 이목구비 변형 배제. 인스타 바이럴 목적과 정직성 양립 가능 |
| **분석 결과 자체 왜곡** | ❌ 절대 금지   | 피부 점수·퍼스널컬러 판정 등 **진단값은 보정 이미지가 아니라 원본 기반**. 보정본으로 재분석 금지(재현성 붕괴)                  |
| **미래 예측 이미지**    | ⚠️ 강한 조건부 | "예측/보장"이 아닌 "시뮬레이션 예시 · 개인차 · 의학적 조언 아님" 상시 면책. 제품 효능 비연계. 미준수 시 **P2 보류 권장**       |
| **AI 생성 은폐**        | ❌ 금지        | SynthID 워터마크 유지 + "AI 생성" 라벨. 한국 AI 콘텐츠 표시 의무 대응                                                          |

**핵심 설계 원칙**: **"보정·착장·예측 = 표현(expression) 레이어, 분석 = 진실(truth) 레이어"를 아키텍처에서 물리적으로 분리.** 표현 레이어는 렌더 결과물만 생성하고 분석 파이프라인(`lib/analysis`)에 절대 역류하지 않음. 이로써 "재미있고 바이럴한 이미지"와 "정직한 분석"을 동시에 유지.

---

## 8. 구현 난이도 / 우선순위 제안

### P1 (먼저)

1. **의류 가상 착장 (FASHN.ai)** — 난이도 중. 전용 API라 통합 단순, 이룸 캡슐/옷장과 직결, 바이럴 후크 강함. "AI 추천대로 입은 나" 서사 = 제품 방향(AI 컨설턴트)과 정합. **DB: 착장 렌더 캐시 테이블, RLS 필수.**
2. **AI 보정 (Nano Banana, 공유 레이어 한정)** — 난이도 중하. 기존 `lib/gemini` 확장. 이목구비 변형 배제 프롬프트 + 강도 슬라이더. 바이럴 전제조건(예쁜 공유 이미지) 충족.

### P2 (법적 검토 후)

3. **미래 변화 예측** — 난이도 상(기술은 중, **법무/카피 리스크가 높음**). 화장품법·의료법 효능 표현 규제 검토 완료 + 면책 카피 확정 전까지 **출시 보류**. 리텐션 효과 vs 규제 리스크 재평가. 도입 시 "일반 습관 → 방향성 예시"로만, 절대 제품 효능 보증 아님.

### 공통 선결 과제

- **원리 문서**: `docs/principles/image-generation.md`(identity 보존·편집 원리), `image-processing.md` 확장.
- **ADR**: "표현 레이어 vs 진실 레이어 분리" 아키텍처 결정 → 신규 ADR 필요.
- **비용 가드**: 세션당 이미지 생성 횟수 상한 + Rate Limit(기존 50 req/24h 패턴 재사용).
- **fallback**: 생성 실패 시 Mock/원본 반환(ADR-007 3단계 폴백 준수).

---

## 9. 출처 목록

**이미지 모델·가격**

- Google Developers Blog — Gemini 2.5 Flash Image: https://developers.googleblog.com/en/introducing-gemini-2-5-flash-image/
- Gemini API Docs: https://ai.google.dev/gemini-api/docs/models/gemini-2.5-flash-image
- Nano Banana Pro 가격 (pricepertoken): https://pricepertoken.com/pricing-page/model/google-gemini-3-pro-image-preview
- OpenRouter Gemini 2.5 Flash Image: https://openrouter.ai/google/gemini-2.5-flash-image
- OpenAI 이미지 가격 (CostGoat): https://costgoat.com/pricing/openai-images
- OpenAI Pricing: https://platform.openai.com/docs/pricing/
- BFL Flux Kontext: https://bfl.ai/models/flux-kontext · 가격: https://bfl.ai/pricing

**가상 착장**

- FASHN API: https://fashn.ai/products/api · Docs: https://docs.fashn.ai/ · VTON v1.6: https://docs.fashn.ai/api-reference/tryon-v1-6
- Pixazo VTON API 비교: https://www.pixazo.ai/api/virtual-try-on
- Google Doppl (blog.google): https://blog.google/technology/google-labs/doppl/
- TechCrunch Doppl 셀피: https://techcrunch.com/2025/12/11/googles-ai-try-on-feature-for-clothes-now-works-with-just-a-selfie/

**보정 · 윤리**

- Banuba Beauty AR SDK: https://www.banuba.com/facear-sdk/beauty-ar
- AILab Tools Retouch: https://www.ailabtools.com/retouch-portraits
- 디지털 리터칭 윤리 (Medium): https://medium.com/@kolomiietsvera657/can-ai-be-honest-about-beauty-the-ethics-of-digital-retouching-algorithms-3a0e46ba19a9

**미래 예측 · 면책 · 한국 법규**

- Perfect Corp Skin Simulation (BusinessWire): https://www.businesswire.com/news/home/20240201522235/en/
- Perfect Corp AI Skin Emulation: https://www.perfectcorp.com/business/products/ai-skin-emulation
- Haut.AI: https://haut.ai/
- Banuba 스킨앱 리뷰: https://www.banuba.com/blog/best-skin-care-analysis-apps
- 식약처 AI 전문가 광고 금지 (cosinkorea): https://www.cosinkorea.com/news/article.html?no=57318
- 약사법·화장품법·의료기기법 개정 (kpanews): https://www.kpanews.co.kr/news/articleView.html?idxno=530787
- 식약처 AI 광고 감시 63건 (kpanews): https://www.kpanews.co.kr/news/articleView.html?idxno=529326

**바이럴 공유**

- TikTok Filter Trends 2025 (Accio): https://www.accio.com/business/tiktok_filter_trending
- TikTok Beauty Filter Trends (Accio): https://www.accio.com/business/tiktok_beauty_filter_trend
- 퍼스널컬러 앱 UX 평가 (KCI): https://www.kci.go.kr/kciportal/ci/sereArticleSearch/ciSereArtiView.kci?sereArticleSearchBean.artiId=ART003100393

---

**작성**: Claude Code (P7 리서치 단계) | **다음**: 원리 문서 → ADR(표현/진실 레이어 분리) → SDD
