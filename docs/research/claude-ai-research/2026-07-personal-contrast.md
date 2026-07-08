# 퍼스널 대비(Personal Contrast) 리서치 — P7 리서치 단계

> **작성일**: 2026-07-09
> **작성자**: Claude (P7 워크플로우: 리서치 → 원리 → ADR → 스펙 → 구현 중 **리서치** 단계)
> **동기(창업자 질문)**: "헤어+옷 조합이 색상으로는 맞아도, 피부색(명도)에 따라 안 어울리는 문제가 생긴다. 이게 퍼스널컬러(시즌/12톤)만으로 해결되나?"
> **결론 요약**: **아니다. 시즌은 '어떤 색'을 말하지만 '얼마나 세게 대비를 줄지'는 말하지 않는다.** 퍼스널 대비(personal contrast)는 시즌과 직교(orthogonal)하는 **독립 축**이며, 이룸은 이미 피부 L\*를 정밀 측정하고 있어 낮은 난이도로 추가 가능하다.

---

## 0. 창업자 질문에 대한 답 (1문단)

퍼스널컬러(12톤)는 **색상(hue)·언더톤(warm/cool)·채도(chroma)**를 판정하지만, 사람이 "안 어울린다"고 느끼는 두 번째 원인은 **명도 대비(value contrast) — 즉 피부·모발·눈 사이의 밝기 차이가 옷·헤어·메이크업이 만들어내는 대비와 얼마나 일치하는가**이다. 예를 들어 흑발+창백한 피부(고대비)인 사람이 톤온톤 파스텔(저대비) 코디를 하면 색은 맞아도 얼굴이 "묻히고", 반대로 밝은 갈색 머리+비슷한 밝기의 피부(저대비)인 사람이 흑백 강대비 코디를 하면 옷이 얼굴을 "이겨버린다". 스타일 컨설팅 업계에서는 이를 **"contrast level" 또는 "value contrast"**라 부르며, David Zyla를 비롯한 여러 체계가 시즌과 별개로 다룬다. 핵심은 **개인의 자연 대비 수준을 옷/헤어/메이크업이 '시각적으로 반향(echo)'해야 조화롭다**는 원칙이다. 따라서 창업자의 직관은 정확하며, 이룸은 PC 결과에 `contrast` 축을 추가해 코디·헤어·메이크업 규칙에 반영해야 이 문제를 구조적으로 해결할 수 있다. 이룸은 이미 6존에서 피부 L\*를 정밀 측정하므로(`zone-sampler.ts`), 모발·눈 L\* 샘플링만 추가하면 **측정 기반**(AI 추측이 아닌) 대비 지표를 산출할 수 있다.

---

## 1. 색채학 이론

### 1.1 대비의 두 종류: Value Contrast vs Chroma Contrast

색 컨설팅에서 "personal contrast"는 실제로 두 개의 하위 개념을 포함한다:

| 유형                                  | 정의                                          | 측정 축                  | 스타일 영향                                 |
| ------------------------------------- | --------------------------------------------- | ------------------------ | ------------------------------------------- |
| **Value contrast (명도 대비)**        | 피부·모발·눈 사이의 **밝기(light↔dark)** 차이 | Lab의 **L\***            | 코디의 밝기 갭, 패턴 강도, 립/아이라인 강도 |
| **Chroma/Color contrast (색상 대비)** | 피부와 모발·눈 사이의 **채도/색상** 차이      | Lab의 **C\*(채도), hue** | 액세서리·포인트 컬러의 선명도               |

실무에서는 **value contrast가 압도적으로 지배적**이다. 여러 컨설턴트가 "당신의 시즌보다 value contrast level이 더 중요하다"고 주장하는데, 이유는 명도 대비가 옷을 입었을 때 얼굴이 부각되는지 묻히는지를 가장 크게 좌우하기 때문이다. ([Signature Style Systems](https://signaturestylesystems.com/why-your-value-contrast-level-matters-more-than-your-season/))

### 1.2 이론 체계에서의 대비 취급

- **12/16 시즌 체계(Sci\\ART 계열)**: 대비를 **간접적으로만** 다룬다. "Deep/Bright Winter"는 고대비, "Light/Soft Summer"는 저대비 경향이 있지만, 시즌 라벨 자체가 대비를 명시적으로 분리하지 않는다. 같은 "True Autumn"이라도 사람마다 대비 수준이 다를 수 있어, 시즌만으로는 코디 강도를 결정할 수 없다. 이것이 이룸이 별도 축을 둬야 하는 근거다.
- **David Zyla 체계 (Color Your Style, 24 archetype)**: 각 색을 신체(모발·피부·눈)에서 직접 추출하며, 대비를 **"레벨(Level 1~3)"**로 명시적으로 다룬다. 저대비 룩(Level 1, 톤온톤)부터 고대비 드라마틱 룩(Level 3, 더 어둡고/쿨하고/선명한 색으로 대비 강화)까지 옷장을 레벨별로 구성하라고 조언한다. 이는 "한 사람도 상황(TPO)에 따라 대비 레벨을 조절"하는 것을 전제로 한다. ([Signature Style Systems — Zyla](https://signaturestylesystems.com/three-top-takeaways-from-david-zylas-color-system/), [Style Syntax](https://stylesyntax.com/blog/2014/08/07/book-review-zyla/))
- **Inside Out Style (Imogen Lamport)**: value contrast를 실전 스타일 규칙의 1순위로 두고, "대비는 얼굴에 가장 가까운 목선(neckline)에서 가장 중요하다"는 실무 원칙을 제시. ([Inside Out Style — High Contrast](https://insideoutstyleblog.com/2015/01/how-to-work-with-your-contrast-high-contrast.html))

### 1.3 핵심 원칙 (모든 체계 공통)

> **"자연 대비를 옷/헤어/메이크업으로 반향하라 (visual echo)."**
> 개인의 피부-모발-눈 대비 수준과 착장의 대비 수준이 일치하면 얼굴이 자연스럽게 강조되고, 불일치하면 얼굴이 묻히거나(옷이 셈) 옷이 무너져 보인다(얼굴이 셈).

---

## 2. 측정 방법

### 2.1 원리: L\* 기반 대비 지표

대비는 **grayscale value scale(0~10, 흑→백)** 또는 동등하게 **Lab의 L\*(0~100)**에서 계산한다. 실무·상용 도구가 쓰는 두 방법:

**(A) 흑백 사진 테스트 (정성)**
자연광 셀피를 grayscale 변환 → 모발·눈이 피부에서 "튀어나오면" 고대비, "뭉개지면" 저대비. ([color-analysis.app](https://color-analysis.app/blog/what-is-your-contrast-level-high-and-low-contrast-coloring-guide))

**(B) Value Scale 차이법 (정량 — 이룸이 채택할 방식)**
0~10 grayscale에서 피부·모발·눈을 각각 평가 → **최댓값 − 최솟값**:

| 대비 수준           | Value gap (0~10 스케일) | L\* 환산 갭(≈×10) | 예시                                            |
| ------------------- | ----------------------- | ----------------- | ----------------------------------------------- |
| **Low (저대비)**    | 0–3                     | ΔL\* ≈ 0–30       | 밝은 갈색 머리 + 밝은 베이지 피부               |
| **Medium (중대비)** | 4–6                     | ΔL\* ≈ 30–60      | 중간 갈색 머리 + 중간 피부                      |
| **High (고대비)**   | 7+                      | ΔL\* ≈ 70+        | 흑발 + 창백한 피부, 또는 딥 피부 + 밝은 눈/치아 |

출처: [color-analysis.app 4단계 공식](https://color-analysis.app/blog/what-is-your-contrast-level-high-and-low-contrast-coloring-guide), [Signature Style Systems 4단계](https://signaturestylesystems.com/why-your-value-contrast-level-matters-more-than-your-season/)

### 2.2 상용 도구의 4단계 공식

두 소스가 사실상 동일한 절차를 제시한다:

1. **개별 value 평가**: 모발 L\*, 피부 L\*, (눈 L\*)를 각각 측정
2. **1차 대비 산출**: `primaryContrast = |L*_hair − L*_skin|` (모발-피부가 주된 대비)
3. **아웃라이어 식별**: 눈·눈흰자·치아가 모발-피부 범위 **밖**으로 튀는지 체크 (저대비인데 눈만 강렬한 "low contrast with a touch of high" 케이스)
4. **2차 대비 기록**: 위 패턴을 라벨링

→ 이룸 알고리즘 요약:

```
skinL  = weightedAvgLab.L        // 이미 측정됨 (zone-sampler)
hairL  = sampleHairLab().L       // 신규 샘플링 필요
eyeL   = sampleEyeLab().L        // 신규 샘플링 필요 (선택)

primaryContrast = |hairL - skinL|            // 주 지표 (모발-피부)
eyeAccent       = max(0, eyeContrast - primaryContrast)  // "touch of high" 판정

contrastLevel =
  primaryContrast >= 45 ? 'high'   :
  primaryContrast >= 25 ? 'medium' :
                          'low'
// (Lab L* 갭 기준. value-scale 4/7 임계 → L* 25/45 근사. 한국인 데이터로 캘리브레이션 필요)
```

### 2.3 임계값 주의 (한국인 캘리브레이션)

- 위 0–3/4–6/7+ 임계는 **서구권 다양한 모발색** 기준. 한국인은 대부분 흑발~진갈색(모발 L\* 낮음)이라 **모발-피부 대비가 구조적으로 높게 나오는 경향**이 있다. 따라서 단순 임계 적용 시 대부분 "high"로 쏠릴 위험.
- **염색이 대비를 바꾼다**: 탈색/밝은 염색은 hairL을 크게 올려 대비를 낮춘다. → 대비는 시즌(평생 고정)과 달리 **가변 축**으로 취급해야 함(홈 축 cadence상 "🔄 천천히" 그룹).
- 초기값은 위 근사 임계로 시작하되, 실제 한국인 샘플 분포로 백분위 기반 재보정(예: 하위 33%/상위 33%) 권장. → **원리 문서 단계에서 확정**.

---

## 3. 적용 규칙 (대비 수준별 스타일)

여러 소스를 종합한 실전 규칙표:

| 영역                     | **High (고대비)**                                 | **Medium (중대비)**        | **Low (저대비)**                                             |
| ------------------------ | ------------------------------------------------- | -------------------------- | ------------------------------------------------------------ |
| **코디 배색**            | 흑백, 딥 주얼톤+옅은 뉴트럴 등 명도 갭 큰 조합 OK | 밸런스 조합(차콜+틸)       | 톤온톤/모노크롬, **3 value step 이내** 배색                  |
| **패턴**                 | 크고 선명한 패턴, 명확한 경계                     | 중간 강도                  | 흐릿한/블렌디드 패턴, 저대비 플로럴                          |
| **립**                   | 채도 높은 레드·베리                               | 뉴트럴-로즈                | 뮤티드 로즈, 시어                                            |
| **아이라인/브로우**      | 또렷한 잉키 라이너, 선명한 브로우                 | 정의된 브로우, 미드톤 섀도 | 소프트 토프 라이너, 디퓨즈드 브로우                          |
| **헤어(뿌리-모발 대비)** | 로우라이트 없이 명확한 단색                       | 측정된 디멘션              | 부드러운 글레이즈, 급격한 명암 점프 회피                     |
| **핵심 위치**            | —                                                 | —                          | **대비는 목선(neckline)에서 가장 중요** — 얼굴에 가장 가까움 |

출처: [color-analysis.app](https://color-analysis.app/blog/what-is-your-contrast-level-high-and-low-contrast-coloring-guide), [Your Color Style](https://yourcolorstyle.com/blogs/blog/high-contrast-vs-low-contrast-outfits), [Inside Out Style](https://insideoutstyleblog.com/2014/03/getting-your-value-contrast-levels-right.html)

### 3.1 헤어·메이크업 연결 (이룸 M-1/H-1 직접 연동)

- **메이크업 강도 = 대비 수준의 함수**: 이룸 M-1은 이미 PC 시즌 색상을 립/섀도에 반영하는데, 여기에 **대비 축이 "강도(intensity)" 파라미터**를 결정하도록 추가. (예: 같은 웜톤 레드라도 고대비=풀커버 선명, 저대비=시어 발색)
- **헤어 컬러 대비(H-1)**: 뿌리-모발 대비, 얼굴 프레이밍 대비를 개인 대비 수준에 맞춤. 저대비인 사람에게 강한 발레아주/급격한 옴브레는 부조화. 고대비인 사람은 단색 딥 컬러가 얼굴을 살림.

---

## 4. 어두운 피부/딥 톤 케이스 — PC와 대비의 경계

창업자 질문의 핵심 지점: **"12톤 deep 판정"과 "대비"의 관계**.

- **흔한 오해**: "피부가 어두우면 자동으로 Deep(딥) 시즌" → **틀림**. 딥 스킨도 icy(Winter)/rosy(Summer)/golden(Autumn)/clear-bright(Spring) 모두 가능. 판정은 undertone·value·chroma **세 축**으로 이뤄진다. ([useless wardrobe](https://www.uselesswardrobe.dk/a-guide-to-color-analysis-for-people-of-color/), [color-analysis.app dark skin](https://color-analysis.app/blog/dark-skin-tone-palette-guide))
- **PC(시즌)가 설명하는 것**: 어떤 hue/undertone/chroma가 어울리는가 (예: 쿨 딥 → 코발트·에메랄드·딥플럼 / 웜 딥 → 번트오렌지·테라코타·러스트). 또한 **저채도 흐린 색(khaki, greige, dusty mauve)은 딥 피부를 칙칙(ashy)하게** 만든다는 chroma 규칙.
- **대비가 추가로 설명하는 것**: 딥 스킨 + 밝은 눈/치아/흰 셔츠는 **자체 고대비**를 형성 → 강한 배색·선명한 색이 조화. 하지만 딥 스킨 + 딥 모발 + 어두운 눈이면 오히려 **저~중대비**일 수 있어, 이 경우 톤온톤 딥 컬러가 더 자연스럽다. **즉 "피부가 어둡다=고대비"가 아니다.** 대비는 피부 절대 밝기가 아니라 **피부-모발-눈 사이의 갭**이다.
- **경계 정리**:
  - PC = _색의 방향_(warm/cool, 어떤 색) — 절대 undertone/hue/chroma
  - Contrast = _대비의 세기_(얼마나 강하게) — L\* 간 상대 갭
  - 둘은 **직교**. 같은 딥윈터라도 대비는 사람마다 다르고, 대비 축이 코디/메이크업 **강도**를 별도로 결정한다.

출처: [color-analysis.app — deep/high contrast](https://color-analysis.app/blog/dark-skin-tone-palette-guide), [Inside Out Style — darker skin value/contrast](https://insideoutstyleblog.com/2017/04/value-and-contrast-with-darker-skin-tones-the-celebrity-version.html), [Palette Hunt — dark skin](https://www.palettehunt.com/colors/best-colors-for-dark-skin)

---

## 5. 기존 코드 연결점 (이룸 PC-v2)

**위치**: `apps/web/lib/analysis/personal-color-v2/`

### 5.1 이미 있는 것 (재사용 가능)

| 요소                                              | 파일                                   | 현황                                                                       |
| ------------------------------------------------- | -------------------------------------- | -------------------------------------------------------------------------- |
| **피부 L\* 정밀 측정**                            | `zone-sampler.ts` → `weightedAvgLab.L` | ✅ 6존 가중평균 L\*/a\*/b\* 산출. **대비의 skinL 입력으로 즉시 사용 가능** |
| Lab 유틸(`rgbToLab`, `calculateChroma/Hue/ITA`)   | `@/lib/color`, `zone-sampler.ts:18`    | ✅                                                                         |
| **`contrastLevel: 'low'\|'medium'\|'high'` 필드** | `types.ts:117`                         | ⚠️ **타입에는 이미 존재**                                                  |
| `hairColorLab` / `eyeColorLab` 필드               | `types.ts:113-115`                     | ⚠️ 타입 존재, 값은 미측정                                                  |

### 5.2 문제: 현재 contrast는 "측정"이 아니라 "추측"

`grep` 결과, `contrastLevel`/`hairColorLab`/`eyeColorLab`는 **실제 픽셀 측정이 아니라 두 경로로만 채워짐**:

- **`mock.ts:342`** — `selectByKey(classification.subtype, {...})`: **서브타입(light/deep 등)으로 하드코딩 매핑**. 실제 개인 대비 아님.
- **`prompts.ts:184-187`** — Gemini에게 `hairColorLab`/`eyeColorLab`/`contrastLevel`을 **출력하도록 요청**(AI 추측). VLM은 대비 같은 상대적 명도 판단에 불안정.

→ **즉, 창업자가 지적한 문제를 풀 필드는 이미 스키마에 있지만, 값이 신뢰할 수 없다.** 진짜 해결은 **모발·눈 L\* 절차적 샘플링 추가**로 측정 기반 대비를 계산하는 것.

### 5.3 추가로 필요한 것 (신규)

1. **모발 존 샘플러** — `zone-sampler.ts` 패턴 복제. 얼굴 랜드마크(예: 이마 위 헤어라인 10번 위쪽, 관자놀이 127/356 바깥 상단)에서 모발 픽셀 L\* 샘플링. `isSkinPixel` 대신 **비피부 + 저명도 필터** 사용.
2. **눈(홍채) 존 샘플러(선택)** — 홍채 랜드마크(468-point Face Mesh의 iris refine 시 468~477)에서 L\* 샘플. 없으면 primaryContrast(모발-피부)만으로도 실용적.
3. **대비 계산 함수** — `computePersonalContrast(skinL, hairL, eyeL?)` → `{ primaryContrast, eyeAccent, contrastLevel }`. §2.2 알고리즘.
4. **서버 교차검증** — PC의 기존 5-check 패턴(prompt-engineering.md Level 2)처럼, AI가 준 contrastLevel과 측정 contrastLevel 불일치 시 **측정값 우선 + 신뢰도 조정**.

---

## 6. 이룸 적용 스케치

### 6.1 데이터 흐름

```
[이미지]
  → zone-sampler: skin weightedAvgLab.L  (기존)
  → hair-sampler:  hairLab.L             (신규, zone-sampler 복제)
  → (선택) iris-sampler: eyeLab.L        (신규)
  → computePersonalContrast()            (신규)
       ↳ { primaryContrast, contrastLevel, eyeAccent }
  → PersonalColorV2Result.detailedAnalysis.contrastLevel  (측정값으로 채움)
  → 서버 교차검증(AI contrastLevel vs 측정)
```

### 6.2 결과 스키마 확장 (제안)

`detailedAnalysis`에 측정 근거 추가 (기존 `contrastLevel` 유지, 하위호환):

```typescript
detailedAnalysis: {
  skinToneLab, hairColorLab, eyeColorLab,
  contrastLevel: 'low' | 'medium' | 'high',   // 기존 (이제 측정값)
  // 신규 (선택적, optional로 하위호환)
  contrastDetail?: {
    skinL: number;
    hairL: number;
    primaryContrast: number;      // |hairL - skinL|
    eyeAccent?: number;           // "touch of high" 판정
    source: 'measured' | 'ai' | 'mock';
  };
}
```

### 6.3 규칙 반영 지점 (코디/헤어/메이크업)

| 모듈                    | 반영 방식                                                                                                       |
| ----------------------- | --------------------------------------------------------------------------------------------------------------- |
| **코디(C-1/제품 매칭)** | contrastLevel → 배색 강도 필터. low=톤온톤(ΔL\* ≤ 30) 우선, high=강대비 조합 허용. 목선 근처 대비 가중.         |
| **헤어(H-1)**           | 뿌리-모발/프레이밍 대비를 개인 대비에 맞춤. low=글레이즈, high=단색 딥.                                         |
| **메이크업(M-1)**       | 기존 PC 시즌 색상 위에 **intensity 파라미터** 추가: high=풀커버·선명, low=시어·뮤티드. 립/라이너/브로우 강도.   |
| **결과 UI(PC 결과)**    | "당신의 대비 = 고/중/저" 칩 + "왜 이 강도가 어울리나" progressive disclosure (제품 방향: 결론 먼저, 근거 접기). |

### 6.4 P7 후속 산출물 (이 리서치 다음 단계)

1. **원리 문서**: `docs/principles/color-science.md`에 §대비(value contrast) 섹션 추가 — L\* 갭 정의, 한국인 임계 캘리브레이션, 모발/홍채 샘플링 원리.
2. **ADR**: "퍼스널 대비 축 도입 — PC에 contrast 필드 측정 기반 산출" (대안: AI-only 추측 유지 vs 측정 추가 / trade-off: 랜드마크 샘플링 복잡도 vs 신뢰도).
3. **스펙(SDD)**: 입출력(skinL/hairL/eyeL → contrastLevel), 임계, 교차검증, 코디/헤어/메이크업 규칙 매핑.
4. **구현**: hair-sampler + computePersonalContrast + 서버 검증 + 규칙 반영.

### 6.5 구현 난이도 평가

| 항목                     | 난이도      | 근거                                                                                                                                     |
| ------------------------ | ----------- | ---------------------------------------------------------------------------------------------------------------------------------------- |
| 피부 L\* 확보            | **무(無)**  | `weightedAvgLab.L` 이미 있음                                                                                                             |
| 모발 L\* 샘플러          | **낮음**    | `zone-sampler.ts` 패턴 복제, 필터만 변경(비피부+저명도)                                                                                  |
| 눈 L\* 샘플러            | **중**      | Face Mesh iris refine 랜드마크 필요(468→478), 선택적                                                                                     |
| 대비 계산 + 임계         | **낮음**    | 단순 산술. 단 **한국인 임계 캘리브레이션은 데이터 필요**                                                                                 |
| 규칙 반영(코디/헤어/M-1) | **중**      | 기존 모듈에 intensity 파라미터 추가 배선                                                                                                 |
| **종합**                 | **낮음~중** | 스키마·피부측정·mock 필드가 이미 존재 → **주 작업은 모발 샘플러 1개 + 규칙 배선**. 눈 샘플러는 v2로 미뤄도 primaryContrast만으로 실용적. |

---

## 7. 출처 (URL)

- David Zyla contrast levels / archetypes — Signature Style Systems: https://signaturestylesystems.com/three-top-takeaways-from-david-zylas-color-system/
- "Why value contrast matters more than your season" (4단계 측정) — Signature Style Systems: https://signaturestylesystems.com/why-your-value-contrast-level-matters-more-than-your-season/
- Contrast level 정의·측정(흑백테스트·0-10 value scale·임계 0-3/4-6/7+)·스타일 규칙 — color-analysis.app: https://color-analysis.app/blog/what-is-your-contrast-level-high-and-low-contrast-coloring-guide
- High vs low contrast outfits — Your Color Style: https://yourcolorstyle.com/blogs/blog/high-contrast-vs-low-contrast-outfits
- Value contrast 실무 규칙·neckline 원칙 — Inside Out Style: https://insideoutstyleblog.com/2014/03/getting-your-value-contrast-levels-right.html , https://insideoutstyleblog.com/2015/01/how-to-work-with-your-contrast-high-contrast.html
- 딥/다크 스킨 대비·value·chroma — color-analysis.app: https://color-analysis.app/blog/dark-skin-tone-palette-guide
- 다크 스킨 ≠ 자동 Deep 시즌 — Useless Wardrobe: https://www.uselesswardrobe.dk/a-guide-to-color-analysis-for-people-of-color/
- 다크 스킨 value/contrast (셀럽 예시) — Inside Out Style: https://insideoutstyleblog.com/2017/04/value-and-contrast-with-darker-skin-tones-the-celebrity-version.html
- 다크 스킨 베스트 컬러(저채도=ashy 회피) — Palette Hunt: https://www.palettehunt.com/colors/best-colors-for-dark-skin
- Zyla 서평(레벨 개념) — Style Syntax: https://stylesyntax.com/blog/2014/08/07/book-review-zyla/
- Medium 해설(contrast level in personal style) — Juliette Moreau: https://medium.com/@juliette_moreau_fashion/what-is-contrast-level-in-personal-style-unlocking-the-secret-to-harmonious-outfits-0806998c7aec

---

**P7 단계**: 리서치 ✅ → (다음) 원리 문서 → ADR → 스펙 → 구현
