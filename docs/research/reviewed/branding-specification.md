# 이룸 브랜딩 중립화 스펙

> **작성일**: 2025-12-19
> **목적**: 성별 중립적 브랜딩으로 전환
> **참고**: 웹 리서치 + NEXT-TASKS.md 브랜딩 섹션

---

## 1. 현재 문제점

| 항목 | 현재 상태 | 문제 |
|------|----------|------|
| 로고 심볼 | 5잎 꽃 아이콘 | 여성 타겟 연상 |
| 배경 색상 | 핑크/라벤더 그라데이션 | 여성 타겟 연상 |
| 타겟 | 10대 후반~30대 초반 (성별 무관) | 브랜딩과 불일치 |

---

## 2. 벤치마크 분석

### 2.1 Calm
- **로고**: 미니멀, 둥근 타이포그래피
- **색상**: 블루 계열 (차분함, 신뢰)
- **특징**: 자연스럽고 편안한 느낌

### 2.2 Headspace
- **로고**: 둥근 원형 + 캐릭터
- **색상**: 오렌지 (친근함, 접근성) - **예상외 색상 사용**
- **타이포**: 소문자 산세리프 = 덜 격식적
- **특징**: 명상을 덜 딱딱하게 느끼게 함

### 2.3 Nike Training Club
- **로고**: 스우시 심볼
- **색상**: 고대비 네온 컬러
- **특징**: 에너지, 동기부여, 재미

### 2.4 공통 패턴 (성공적인 중립 브랜딩)
- 기하학적 도형
- 미니멀리즘 (심플한 라인)
- 소문자 타이포그래피
- 예상 밖의 색상 사용 (스테레오타입 회피)
- 다양성과 포용성 강조

---

## 3. 이룸 새 브랜딩 제안

### 3.1 색상 팔레트

```yaml
Primary:
  이룸 블루: oklch(0.53 0.23 262)  # #2e5afa - 유지

Secondary (제안):
  이룸 네이비: oklch(0.35 0.15 262)  # 깊은 신뢰
  이룸 스카이: oklch(0.75 0.10 230)  # 밝은 희망

Accent (제안):
  이룸 골드: oklch(0.75 0.15 85)    # 성장, 성취
  이룸 틸: oklch(0.65 0.12 180)     # 균형, 웰니스
```

### 3.2 심볼 후보 (꽃 대체)

| 후보 | 의미 | 성별 중립도 |
|------|------|-------------|
| **나선/스파이럴** | 성장, 진화, 자기 발전 | 10/10 |
| **원형/동심원** | 완전함, 균형, 전체성 | 10/10 |
| **추상적 사람 형태** | 인간 중심, 웰니스 | 9/10 |
| **기하학적 조합** | 현대적, 다면적 건강 | 9/10 |
| **나뭇잎/새싹** | 성장, 자연, 건강 | 8/10 |

### 3.3 권장 방향

```
1순위: 나선/스파이럴 + 이룸 블루
- "이룸" = 이루다(achieve) + 방(room)
- 나선 = 끊임없는 성장과 발전
- 단순한 기하학적 형태 = 성별/연령 중립

2순위: 동심원 + 이룸 블루
- 원 = 완전함, 전체적 웰니스
- 중첩된 원 = 신체/정신/영양의 통합
```

### 3.4 타이포그래피 제안

```yaml
기존: 이룸 YIROOM (대소문자 혼합)
제안: yiroom 또는 Yiroom (소문자 우세)

폰트 특성:
- 현대적 산세리프
- 둥근 모서리 (친근함)
- 약간의 기하학적 특성

참고 폰트:
- Inter (현재 사용 중 - 유지 가능)
- Plus Jakarta Sans
- Outfit
```

---

## 4. 적용 파일 목록

### 4.1 필수 교체 (웹)

| 파일 | 크기 | 용도 |
|------|------|------|
| `public/logo.png` | 다양 | 헤더 로고 |
| `public/og-image.png` | 1200x630 | SNS 공유 |
| `public/icons/icon-192x192.png` | 192x192 | PWA 아이콘 |
| `public/icons/icon-256x256.png` | 256x256 | PWA 아이콘 |
| `public/icons/icon-384x384.png` | 384x384 | PWA 아이콘 |
| `public/icons/icon-512x512.png` | 512x512 | PWA 아이콘 |
| `public/favicon-16x16.png` | 16x16 | 파비콘 |
| `public/favicon-32x32.png` | 32x32 | 파비콘 |

### 4.2 필수 교체 (모바일 앱)

| 파일 | 크기 | 용도 |
|------|------|------|
| `apps/mobile/assets/icon.png` | 1024x1024 | 앱 아이콘 |
| `apps/mobile/assets/adaptive-icon.png` | 1024x1024 | Android Adaptive 아이콘 |
| `apps/mobile/assets/splash-icon.png` | 다양 | 스플래시 스크린 |

### 4.3 코드 수정

| 파일 | 변경 내용 | 상태 |
|------|----------|------|
| `public/manifest.webmanifest` | theme_color: #ec4899 → #2e5afa | ✅ 완료 |
| `app/layout.tsx` | favicon 경로 (변경 없으면 유지) | 대기 |
| `globals.css` | --gradient-brand 수정 필요 | 대기 |
| `DESIGN-SYSTEM.md` | 브랜드 그라디언트 업데이트 | 대기 |

---

## 5. 작업 체크리스트

### Phase 1: 디자인 (Figma)
- [ ] 심볼 디자인 (3~5개 후보)
- [ ] 색상 조합 테스트
- [ ] 다크모드 버전
- [ ] 사이즈별 가독성 테스트

### Phase 2: 에셋 제작
- [ ] SVG 마스터 파일
- [ ] PNG 익스포트 (모든 크기)
- [ ] OG 이미지 제작
- [ ] 파비콘 제작

### Phase 3: 적용
- [ ] `public/` 파일 교체
- [ ] 빌드 테스트
- [ ] 다크모드 확인
- [ ] 모바일 앱 아이콘 확인

### Phase 4: 검증
- [ ] PWA 설치 테스트
- [ ] SNS 공유 미리보기 테스트
- [ ] 전체 페이지 확인

---

## 6. 참고 자료

### 웹 리서치 소스
- [99designs - Wellness Logos](https://99designs.com/inspiration/logos/wellness)
- [DesignRush - Health & Wellness Logo Designs 2025](https://www.designrush.com/best-designs/logo/health-wellness)
- [VistaPrint - Health and Wellness Logo Trends](https://www.vistaprint.com/hub/health-wellness-branding)
- [Kimp - Headspace Brand Visual Identity](https://www.kimp.io/headspace-brand/)
- [1000logos - Calm Logo](https://1000logos.net/calm-logo/)
- [DesignRush - Fitness App Design Examples](https://www.designrush.com/best-designs/apps/trends/fitness-app-design-examples)

### 이룸 프로젝트 문서
- [NEXT-TASKS.md](../../phase-next/NEXT-TASKS.md) - 브랜딩 중립화 섹션
- [DESIGN-SYSTEM.md](../../DESIGN-SYSTEM.md) - 색상 토큰
- [DESIGN-WORKFLOW.md](../../DESIGN-WORKFLOW.md) - Cursor Visual Editor + Gemini 3 워크플로우

### 디자인 워크플로우 참고

Figma 디자인 완료 후 세부 조정 시 DESIGN-WORKFLOW.md의 워크플로우 활용 가능:
- Cursor Visual Editor로 색상/스타일 미세 조정
- Point-and-Prompt로 컴포넌트 수정
- Claude Code로 검증 및 테스트

---

**Version**: 1.1
**Updated**: 2025-12-19
**Status**: 리서치 완료, theme_color 수정 완료, Figma 디자인 대기
