# AI 이미지 생성 프롬프트

> 체형별 스타일 이미지 생성을 위한 AI 프롬프트 가이드

## 개요

체형 분석 결과 페이지에서 사용할 스타일 이미지를 AI로 생성하기 위한 프롬프트입니다.
저작권 문제 없이 사용 가능한 AI 생성 이미지를 활용합니다.

## 이미지 사양

- **크기**: 3:4 비율 (900x1200px 권장)
- **형식**: JPG/WebP
- **스타일**: 패션 일러스트레이션 또는 깔끔한 룩북 스타일
- **배경**: 심플하고 깔끔한 단색 또는 그라데이션

## 공통 프롬프트 지침

```
Fashion illustration style, full body shot, clean minimal background,
Korean fashion aesthetic, professional lookbook photography style,
soft natural lighting, high fashion editorial quality,
no face detail (focus on clothing), elegant pose
```

---

## 스트레이트 체형 (S타입)

### 특징

- 상체 볼륨감, 입체적, 직선적 실루엣
- 정장/베이직 스타일이 잘 어울림
- I라인 실루엣 추천

### 1. straight-formal.jpg (포멀 스타일)

```
Fashion illustration, full body female figure, straight body type with
structured upper body, wearing tailored blazer and straight-leg trousers,
I-line silhouette, professional office look,
clean white/light grey gradient background,
Korean fashion style, minimal accessories,
sophisticated and elegant mood,
--ar 3:4 --style raw --v 6
```

### 2. straight-casual.jpg (캐주얼 스타일)

```
Fashion illustration, full body female figure, straight body type,
wearing fitted V-neck sweater and classic straight jeans,
simple structured outfit, clean lines,
casual yet polished look, minimal styling,
light beige/cream background,
Korean street fashion aesthetic,
--ar 3:4 --style raw --v 6
```

### 3. straight-minimal.jpg (미니멀 스타일)

```
Fashion illustration, full body female figure, straight body type,
wearing crisp white shirt tucked into pencil skirt,
minimalist outfit, clean silhouette,
monochromatic color palette, black and white,
soft grey background,
high-end fashion editorial style,
--ar 3:4 --style raw --v 6
```

---

## 웨이브 체형 (W타입)

### 특징

- 하체 볼륨감, 곡선적, 부드러운 실루엣
- 페미닌/로맨틱 스타일이 잘 어울림
- X라인/하이웨이스트 추천

### 1. wave-feminine.jpg (페미닌 스타일)

```
Fashion illustration, full body female figure, wave body type with
curved silhouette and defined waist, wearing flowy peplum blouse
and high-waisted A-line skirt, feminine and soft,
romantic pastel pink/rose background gradient,
Korean feminine fashion style,
delicate accessories, soft fabric textures,
--ar 3:4 --style raw --v 6
```

### 2. wave-romantic.jpg (로맨틱 스타일)

```
Fashion illustration, full body female figure, wave body type,
wearing ruffled blouse with high-waisted wide-leg pants,
romantic and dreamy outfit, soft flowing fabrics,
floral or lace details, elegant feminine mood,
soft lavender/pink background,
Korean romantic fashion aesthetic,
--ar 3:4 --style raw --v 6
```

### 3. wave-elegant.jpg (엘레강스 스타일)

```
Fashion illustration, full body female figure, wave body type,
wearing fitted wrap dress with defined waist,
elegant evening look, sophisticated curves,
X-line silhouette emphasized,
champagne/gold background gradient,
luxurious and graceful mood,
--ar 3:4 --style raw --v 6
```

---

## 내추럴 체형 (N타입)

### 특징

- 골격감, 프레임이 큼, 자연스러운 실루엣
- 캐주얼/릴렉스드 스타일이 잘 어울림
- 오버사이즈/루즈핏 추천

### 1. natural-casual.jpg (캐주얼 스타일)

```
Fashion illustration, full body female figure, natural body type with
broad frame, wearing oversized cotton shirt and relaxed fit chinos,
effortless casual style, natural materials,
earth tone colors, comfortable yet stylish,
warm beige/sage green background,
Korean casual fashion aesthetic,
--ar 3:4 --style raw --v 6
```

### 2. natural-relaxed.jpg (릴렉스드 스타일)

```
Fashion illustration, full body female figure, natural body type,
wearing loose knit cardigan over simple tank top with wide-leg linen pants,
relaxed and comfortable outfit, layered look,
natural fabric textures, neutral earth tones,
soft olive/khaki background,
laid-back sophisticated style,
--ar 3:4 --style raw --v 6
```

### 3. natural-oversized.jpg (오버사이즈 스타일)

```
Fashion illustration, full body female figure, natural body type,
wearing oversized blazer with loose straight pants,
modern oversized silhouette, effortless chic,
structured yet relaxed fit,
cool grey/blue background,
Korean street fashion style,
contemporary fashion editorial,
--ar 3:4 --style raw --v 6
```

---

## 생성 도구 권장

1. **Midjourney** (v6 권장)
   - `--ar 3:4 --style raw` 파라미터 사용
   - 고품질 패션 일러스트레이션에 적합

2. **DALL-E 3**
   - 자연스러운 포즈와 의상 표현 우수
   - 한국 패션 스타일 참조 가능

3. **Stable Diffusion**
   - Fashion/Clothing LoRA 모델 활용
   - 일관된 스타일 유지 가능

## 파일 저장 위치

```
apps/web/public/images/body-types/
├── straight-formal.jpg
├── straight-casual.jpg
├── straight-minimal.jpg
├── wave-feminine.jpg
├── wave-romantic.jpg
├── wave-elegant.jpg
├── natural-casual.jpg
├── natural-relaxed.jpg
└── natural-oversized.jpg
```

## 주의사항

1. **저작권**: AI 생성 이미지 사용 시 생성 도구의 라이선스 정책 확인
2. **일관성**: 동일한 설정으로 모든 이미지 생성하여 스타일 통일
3. **크기 최적화**: 웹 사용을 위해 이미지 압축 필수 (WebP 권장)
4. **대체 이미지**: 이미지 로딩 실패 시 플레이스홀더 표시됨

---

**Version**: 1.0 | **Created**: 2026-01-02
