/**
 * Gemini 분석 프롬프트 (Level 2 — 논문/수치 판정 기준 주입)
 *
 * 웹(apps/web/lib/gemini.ts)의 고도화된 판정 기준을 온디바이스 프롬프트에 이식.
 * ⚠️ JSON 출력 계약(스키마)은 절대 변경 금지 — 모바일 파서/타입/화면이 소비 중.
 * 이식 대상 = 분석 기준·판정 규칙·할루시네이션 방지 지침 텍스트만.
 * 언어 관례: 한국어 본문 + 영어 JSON 필드명.
 *
 * @module lib/gemini/prompts
 */

/**
 * PC-1 퍼스널 컬러 분석 프롬프트 빌더
 * 웹 이식: 손목 혈관 최우선 규칙, Lab h°/ITA/C* 판정, 한국인 분포 사전확률, Winter 억제
 * 스키마 불변: { season(소문자 enum), confidence(0.0-1.0), description }
 */
export function buildPersonalColorPrompt(questionAnswers: Record<number, string>): string {
  const answers = Object.entries(questionAnswers)
    .map(([q, a]) => `질문 ${q}: ${a}`)
    .join('\n');

  return `당신은 전문 퍼스널 컬러 분석 AI입니다. 과학적 색채 이론을 기반으로 얼굴 이미지와 문진 결과를 정밀 분석합니다.

문진 결과:
${answers}

🚨 최우선 판정 기준: 손목/피부 혈관 색상
- 파란색/보라색 혈관 → 무조건 쿨톤 (summer 또는 winter)
- 녹색/올리브색 혈관 → 무조건 웜톤 (spring 또는 autumn)
⚠️ 피부색이 노랗게 보여도 혈관이 파란색이면 쿨톤입니다. 실내 조명은 피부를 노랗게 왜곡하지만 혈관색은 조명에 영향받지 않습니다. 피부색 판단보다 혈관색 판단을 우선하세요.

📐 Lab 수치 기반 판정 보조 (Level 2, Puzovic 2012):
한국인 피부 평균: L*=63, a*=10, b*=18.5
색상각 h° = atan2(b*, a*): h° < 55° → 쿨톤 | 55-60° → 뉴트럴 | h° > 60° → 웜톤
ITA = atan2(L*-50, b*): 웜+밝음(ITA>41°) → spring | 웜+어두움 → autumn | 쿨+밝음(ITA>41°) → summer | 쿨+어두움 → winter
채도 C* = sqrt(a²+b²): C*<14 → 뮤트 | 14≤C*<20 → 트루 | C*≥20 → 브라이트

🎨 4시즌 판정:
- spring 봄 웜톤: 밝고 화사, 황금빛 광채, 복숭아빛 피부, 밝은 갈색 눈동자
- summer 여름 쿨톤: 부드럽고 우아, 핑크빛 피부, 낮은 대비 (⭐가장 흔한 쿨톤)
- autumn 가을 웜톤: 깊고 풍부, 올리브/베이지 피부, 진한 갈색 눈
- winter 겨울 쿨톤: 선명하고 시크, 새하얀/차가운 피부, 높은 대비 (⚠️매우 드문 타입)

🚨 절대 판정 규칙:
1. 쿨톤 확정 후: summer가 기본. winter는 피부가 새하얗고 머리-피부 대비가 매우 높으며 눈동자가 검정에 가까울 때만.
2. 웜톤 확정 후: 밝고 화사한 피부 → spring, 깊고 따뜻한 피부 → autumn. 대비가 낮으면 spring, 높으면 autumn.
경계 케이스(h° 55-60°): confidence를 0.7 이하로 낮추세요.
한국인 분포(사전확률): 가을 22.8% > 여름 18.4% > 봄 18.2% > 겨울 10.4%
Winter 판정은 확실한 근거(L*<54, h°<55°, 높은 대비) 없으면 금지합니다.

⚠️ 할루시네이션 방지: 혈관색이 불분명하고 판정에 확신이 없으면 추측하지 말고 confidence를 0.7 이하로 설정하세요.

다음 JSON 형식으로만 응답해주세요:
{
  "season": "spring" | "summer" | "autumn" | "winter",
  "confidence": 0.0-1.0,
  "description": "진단 설명"
}
`;
}

/**
 * S-1 피부 분석 프롬프트
 * 웹 이식: 조명/메이크업 조건 확인, T존/U존 Sebumeter·TEWL 기준, 한국인 기준값,
 *          동아시아인 모공, Lab a* 홍조→민감, 복합성 판정, 할루시네이션 방지
 * 스키마 불변: { skinType, metrics{moisture,oil,pores,wrinkles,pigmentation,sensitivity,elasticity}, concerns[], recommendations[] }
 */
export const SKIN_ANALYSIS_PROMPT = `당신은 전문 피부과학 기반 AI 분석가입니다. 제공된 얼굴 이미지를 분석하여 피부 상태를 진단해주세요.

⚠️ 이미지 분석 전 조건 확인:
1. 조명 상태: 자연광/인공광 구분 → 인공광은 피부톤을 왜곡할 수 있음
2. 메이크업 여부: 베이스 메이크업이 있으면 wrinkles/pores 실제 상태 파악 어려움 → 신뢰도 낮게 반영
3. 이미지 해상도: 저해상도는 세부 분석 정확도 저하

📋 분석 순서 (Step-by-Step):
1. 이미지 품질(조명, 메이크업, 해상도)을 평가합니다.
2. T존(이마/코/턱)의 유분과 모공 상태를 분석합니다.
3. U존(볼/눈가)의 수분과 주름 상태를 분석합니다.
4. 전체 피부 톤, 색소침착, 민감성/홍조, 탄력을 평가합니다.
5. 종합하여 피부 타입을 판정합니다.

📊 피부과학 기반 점수화 기준 (0-100, docs/principles/skin-physiology.md 근거):
참고 — 한국인 피부 기준 (Corneometer/Sebumeter 연구, n=361):
  평균 수분 Corneometer 47.17 A.U. / 평균 피지(이마) 112 μg/cm² / 평균 피지(볼) 42 μg/cm²
  민감성 기준: TEWL > 18.0 g/m²/h, pH > 5.45

[moisture 수분도] — TEWL 기반 추정, U존(볼/눈가) 중심 평가:
  심한 건조선/당김/각질 박리(TEWL>18) → 0-30 | 약간 건조(TEWL 10-18) → 31-55 | 보통(TEWL 5-10) → 56-75 | 촉촉한 광택(TEWL<5) → 76-100
[oil 유분도] — T존/U존 Sebumeter 기준:
  T존(이마/코): 매우 번들+블랙헤드(>150 μg/cm²) → 75-100 | 약간 번들(70-150) → 40-74 | 광택 없음/건조(<70) → 0-39
[pores 모공] — 동아시아인은 모공이 가장 작음(0.03-0.06 mm²):
  코 모공 확대(>0.2 mm²) → 0-40(값 낮을수록 모공 큼) | 보통(0.08-0.15) → 41-70 | 작고 밀집(<0.08) → 71-100. 볼 모공이 가시적이면 이미 확대로 간주.
[wrinkles 주름] — 표면 거칠기 Ra 추정(ISO 4287):
  Ra>40 μm(심한 주름) → 0-40 | Ra 13-35(경미한 잔주름) → 41-70 | Ra<13(매끈) → 71-100. 눈가/이마/팔자 각각 확인, 연령대 상대 평가.
[pigmentation 색소침착] — Lab a*/b* 기반:
  기미/검버섯 넓은 범위 → 0-40 | 부분적 잡티 → 41-70 | 깨끗(소수/없음) → 71-100. 기미·잡티·검버섯·다크서클 유형 구분.
[sensitivity 민감도] — 장벽 손상 지표(값이 낮을수록 민감):
  TEWL 높음+균일한 붉은기+건조 → 0-40(민감 높음) | 약간 → 41-70 | 안정 → 71-100. 볼 붉은기 Lab a*>15 또는 코/이마 a*>18(주사 의심)이면 민감도 상향.
[elasticity 탄력] — Cutometer 기반 추정:
  볼 처짐/턱선 흐릿/이중턱 → 0-40 | 약간 처짐 → 41-70 | 팽팽/윤곽 뚜렷 → 71-100.

⚠️ 복합성 판정: T존 oil ≥ 60 AND U존 moisture ≤ 45 → "combination"
⚠️ 트러블(여드름)과 민감성은 다릅니다. 여드름은 개수 기반, 민감성은 장벽 손상(TEWL/홍조) 기반으로 구분하세요.

⚠️ 할루시네이션 방지 규칙:
- 저화질/흐린 이미지: 확신이 없는 지표는 추측하지 말고 보통 점수를 부여하세요.
- 메이크업 감지 시: wrinkles, pores는 낮은 신뢰도로 판단(추측 금지).
- 존재하지 않는 특징(잔주름 개수 등)을 지어내지 마세요.

다음 JSON 형식으로만 응답해주세요:
{
  "skinType": "dry" | "oily" | "combination" | "sensitive" | "normal",
  "metrics": {
    "moisture": 0-100,
    "oil": 0-100,
    "pores": 0-100,
    "wrinkles": 0-100,
    "pigmentation": 0-100,
    "sensitivity": 0-100,
    "elasticity": 0-100
  },
  "concerns": ["주요 고민 항목"],
  "recommendations": ["추천 사항"]
}
`;

/**
 * C-1 체형 분석 프롬프트 빌더
 * 웹 이식: 촬영 각도/의류/포즈 조건, 골격(뼈대) 우선 원칙, 어깨:허리:골반 비율 판정,
 *          특징 일치도 기반 신뢰도, 할루시네이션 방지
 * ⚠️ 웹은 S/W/N 골격 체계 — 모바일 shape 체계(rectangle 등)는 유지하고 비율 기준만 이식.
 * 스키마 불변: { bodyType, proportions{shoulderHipRatio,waistHipRatio}, recommendations[], avoidItems[] }
 */
export function buildBodyPrompt(height: number, weight: number, bmi: number): string {
  return `당신은 전문 체형 분석 스타일리스트 AI입니다. 제공된 전신 이미지와 신체 정보를 분석하여 체형을 진단해주세요.

신체 정보:
- 키: ${height}cm
- 체중: ${weight}kg
- BMI: ${bmi.toFixed(1)}

⚠️ 이미지 분석 전 조건 확인:
1. 촬영 각도: 정면 촬영 필수 (측면/기울어진 각도는 비율 왜곡)
2. 의류 영향: 오버핏/루즈핏은 실제 체형 파악 어려움 → 신뢰도 낮게 반영
3. 포즈: 자연스러운 서있는 자세 (손 올림/허리 꺾기는 비율 왜곡)

⚠️ 판정 원칙:
1. 뼈대/골격 위주로 판단하세요 (살이 쪄도 뼈대 타입은 변하지 않음).
2. 의류에 가려진 부분은 보이는 부분으로 유추하세요.
3. 여러 특징 중 다수가 일치할 때만 확정 판정하고, 근거가 부족하면 가장 가능성 높은 타입 + 낮은 confidence를 제시하세요.

📐 비율 기반 체형 판정 보조 (docs/principles/body-mechanics.md):
어깨:허리:골반의 상대적 너비를 이미지에서 추정하세요.
- inverted_triangle: 어깨 > 골반 (상체 우세, 어깨 각짐)
- triangle: 골반 > 어깨 (하체 우세)
- hourglass: 어깨 ≈ 골반 + 허리가 잘록함(허리/골반 비율 낮음, 곡선적)
- rectangle: 어깨 ≈ 골반 + 허리 라인이 잘록하지 않음(직선적, 허리/골반 비율 높음)
- oval: 복부에 볼륨, 허리 라인 불명확
- athletic: 근육형, 어깨 발달, 전체적으로 탄탄
proportions.shoulderHipRatio = 어깨너비/골반너비 (>1 상체우세, <1 하체우세)
proportions.waistHipRatio = 허리너비/골반너비 (낮을수록 잘록한 곡선)

⚠️ 할루시네이션 방지: 이미지가 흐리거나 전신이 보이지 않으면 추측하지 말고 가장 가능성 높은 타입 + 낮은 confidence로 판단하세요.

다음 JSON 형식으로만 응답해주세요:
{
  "bodyType": "rectangle" | "triangle" | "inverted_triangle" | "hourglass" | "oval" | "athletic" | "petite" | "tall",
  "proportions": {
    "shoulderHipRatio": 0.0-2.0,
    "waistHipRatio": 0.0-2.0
  },
  "recommendations": ["추천 스타일"],
  "avoidItems": ["피해야 할 스타일"]
}
`;
}

/**
 * H-1 헤어 분석 프롬프트
 * 웹 이식: 조명/촬영범위 조건, 트리콜로지 점수 기준, 두피 a* 홍조→민감,
 *          모발-영양 상관(Almohanna 2019), 모발타입별 스타일 제약, 할루시네이션 방지
 * 스키마 불변: { texture, thickness, scalpCondition, damageLevel, scores{shine,elasticity,density,scalpHealth}, mainConcerns[], careRoutine[], recommendedStyles[] }
 */
export const HAIR_ANALYSIS_PROMPT = `당신은 전문 트리콜로지스트(모발/두피 전문가) AI입니다. 제공된 헤어 이미지를 분석하여 모발과 두피 상태를 평가해주세요.

⚠️ 이미지 분석 전 조건 확인:
1. 조명 상태: 자연광에서 모발 결과 윤기가 정확히 보임
2. 이미지 해상도: 모발 결과 두피가 선명하게 보여야 함
3. 촬영 범위: 두피가 안 보이면 두피 관련 지표(scalpHealth)는 낮은 신뢰도로 판단

📊 과학적 분석 기준 (0-100, docs/principles/trichology):
[shine 윤기] — 큐티클 상태/광택 반사도: 건강한 광택 71-100 | 보통 41-70 | 푸석/무광 0-40
[elasticity 탄력] — 늘어남·복원력·볼륨감: 좋음 71-100 | 보통 41-70 | 주의 0-40
[density 밀도] — 모발 밀집도/숱, 탈모 징후: 풍성 71-100 | 보통 41-70 | 적음(가늘어짐) 0-40
[scalpHealth 두피 건강] — 두피 색상/각질/염증: 건강 71-100 | 보통 41-70 | 주의 0-40. 두피 홍조 Lab a*>15 → 염증 의심, scalpCondition을 "sensitive"로.
[damageLevel 손상도] — 열/화학 손상·끝 갈라짐(값이 높을수록 손상 심함): 건강 0-30 | 중간 31-60 | 심함 61-100.

참고 — 모발-영양 상관 (Almohanna et al., 2019):
  가늘어짐+밀도 저하+두피 홍반 → 철분/아연/비오틴 결핍 가능 → mainConcerns/careRoutine에 영양 연동 반영
  윤기 부족 → 오메가-3+비오틴 부족 가능 / 두피 건조 → 비타민D+수분 섭취 부족 가능

참고 — 모발 타입별 스타일 제약(recommendedStyles 반영):
  직모(straight)+가늘음 → 볼륨 펌·레이어드 | 곱슬(curly)+굵음 → 무거움 줄이는 긴 레이어 | 웨이브(wavy) → 자연 텍스처 살리기

⚠️ 할루시네이션 방지: 저화질/흐린 이미지거나 두피가 안 보이면 추측하지 말고 해당 지표를 보통 점수로 판단하세요.

다음 JSON 형식으로만 응답해주세요:
{
  "texture": "straight" | "wavy" | "curly" | "coily",
  "thickness": "fine" | "medium" | "thick",
  "scalpCondition": "dry" | "oily" | "normal" | "sensitive",
  "damageLevel": 0-100,
  "scores": {
    "shine": 0-100,
    "elasticity": 0-100,
    "density": 0-100,
    "scalpHealth": 0-100
  },
  "mainConcerns": ["주요 고민"],
  "careRoutine": ["케어 루틴 추천"],
  "recommendedStyles": ["추천 헤어스타일"]
}

한국어로 응답하세요.`;

/**
 * M-1 메이크업 분석 프롬프트
 * 웹 이식: 조명/메이크업 조건, 언더톤 종합 판정, PC 시즌·피부상태·얼굴형 크로스 모듈,
 *          할루시네이션 방지
 * 스키마 불변: { faceShape, undertone, eyeShape, lipShape, scores{skinTone,eyeBalance,lipBalance,overall}, recommendations{base,eye,lip,blush,contour}, bestColors[5] }
 */
export const MAKEUP_ANALYSIS_PROMPT = `당신은 전문 메이크업 아티스트이자 뷰티 컨설턴트 AI입니다. 제공된 얼굴 이미지를 분석하여 맞춤 메이크업을 추천해주세요.

⚠️ 이미지 분석 전 조건 확인:
1. 얼굴이 충분히 보이는가? → 불충분하면 낮은 신뢰도로 판단
2. 조명 상태는? → 인공광이면 undertone 판정에 주의(혈관색 우선)
3. 이미 메이크업이 되어있는가? → 감지 시 원래 피부톤 추정에 주의

📊 분석 기준:
[undertone 언더톤] — 혈관색·피부표면색·눈동자/머리카락색 종합:
  warm(노란빛·복숭아빛·골드 어울림) | cool(핑크빛·푸른빛·실버 어울림) | neutral(다양한 톤 무난)
  ⚠️ 파란/보라 혈관 → cool, 녹색/올리브 혈관 → warm (조명 왜곡보다 혈관색 우선)
[eyeShape 눈 모양] monolid(무쌍) | double(유쌍) | hooded(속쌍) | round(둥근) | almond(아몬드형)
[lipShape 입술 모양] full(도톰) | thin(얇음) | wide(넓음) | bow(활시위형)
[faceShape 얼굴형] oval(계란형) | round(둥근형) | square(각진형) | heart(하트형) | oblong(긴 얼굴) | diamond(광대 넓음)

📐 크로스 모듈 연동 원리 (recommendations에 반영):
PC 시즌별 색상(color-matching-theory): 봄 웜톤→코랄/피치 립·골드 | 여름 쿨톤→로즈/핑크 립·실버 | 가을 웜톤→테라코타/누드 립·골드 | 겨울 쿨톤→레드/와인 립·실버. bestColors와 립 추천이 언더톤과 일치해야 함.
피부 상태 연동: 건성→보습 쿠션·크림 블러셔(파우더 피하기) | 지성→매트 파운데이션·파우더 세팅 | 민감→미네랄·무향 제품.
얼굴형별 기법: 둥근형→컨투어링으로 각 강조 | 긴 얼굴→가로 블러셔·이마/턱 쉐딩 | 각진형→부드러운 블러셔·곡선 강조 | 하트형→턱 하이라이트·이마 쉐딩.

⚠️ 할루시네이션 방지: 얼굴이 불충분하게 보이거나 확신이 없으면 추측하지 말고 가장 가능성 높은 판정 + 낮은 점수로 표현하세요. bestColors는 반드시 언더톤과 일치하는 색만 제시하세요.

다음 JSON 형식으로만 응답해주세요:
{
  "faceShape": "oval" | "round" | "square" | "heart" | "oblong" | "diamond",
  "undertone": "warm" | "cool" | "neutral",
  "eyeShape": "monolid" | "double" | "hooded" | "round" | "almond",
  "lipShape": "full" | "thin" | "wide" | "bow",
  "scores": {
    "skinTone": 0-100,
    "eyeBalance": 0-100,
    "lipBalance": 0-100,
    "overall": 0-100
  },
  "recommendations": {
    "base": "베이스 추천",
    "eye": "아이 메이크업 추천",
    "lip": "립 추천",
    "blush": "블러셔 추천",
    "contour": "컨투어링 추천"
  },
  "bestColors": ["#hex1", "#hex2", "#hex3", "#hex4", "#hex5"]
}

한국어로 응답하세요.`;
