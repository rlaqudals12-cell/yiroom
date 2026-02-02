# 이룸 (Yiroom) API 문서

> 온전한 나를 위한 통합 웰니스 AI 플랫폼 API

## 개요

이룸 API는 AI 기반 뷰티/헬스 분석 및 개인화 추천 서비스를 제공합니다.

### 주요 기능

| 카테고리 | API | 설명 |
|----------|-----|------|
| **Analysis** | PC-2, S-2, C-2, H-1, OH-1 | AI 이미지 분석 (퍼스널컬러, 피부, 체형, 헤어, 구강건강) |
| **Nutrition** | N-1 | 식단 기록 및 영양 관리 |
| **Workout** | W-1 | 운동 추천 및 기록 |
| **Coach** | AI Coach | AI 웰니스 코칭 챗봇 |
| **Products** | Smart Matching | 분석 결과 기반 제품 추천 |
| **User** | Account | 사용자 계정 관리 |

## 빠른 시작

### 1. 인증

모든 API는 Clerk JWT 토큰이 필요합니다.

```bash
curl -X POST https://yiroom.app/api/analyze/skin-v2 \
  -H "Authorization: Bearer <YOUR_CLERK_JWT_TOKEN>" \
  -H "Content-Type: application/json" \
  -d '{"imageBase64": "data:image/jpeg;base64,..."}'
```

### 2. 기본 요청/응답 형식

**성공 응답:**
```json
{
  "success": true,
  "data": { ... },
  "result": { ... },
  "usedFallback": false,
  "gamification": {
    "xpAwarded": 10,
    "badgeResults": []
  }
}
```

**에러 응답:**
```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Invalid request body",
    "userMessage": "입력 정보를 확인해주세요.",
    "details": { ... }
  }
}
```

## API 엔드포인트

### Analysis APIs

#### 퍼스널컬러 분석 (PC-2)
```
POST /api/analyze/personal-color-v2
GET  /api/analyze/personal-color-v2
```

Lab 색공간 기반 12톤 퍼스널컬러 분석. 이미지 또는 RGB 값으로 분석 가능.

**12톤 시스템:**
- Spring: `light-spring`, `true-spring`, `bright-spring`
- Summer: `light-summer`, `true-summer`, `muted-summer`
- Autumn: `muted-autumn`, `true-autumn`, `deep-autumn`
- Winter: `bright-winter`, `true-winter`, `deep-winter`

#### 피부 분석 (S-2)
```
POST /api/analyze/skin-v2
GET  /api/analyze/skin-v2
```

7존 기반 고도화 피부 분석. 아시아인 피부 기준 적용.

**분석 존:**
- T존: 이마, 코, 턱
- U존: 좌/우 볼
- 기타: 눈가, 입술

#### 체형 분석 (C-2)
```
POST /api/analyze/body-v2
GET  /api/analyze/body-v2
```

MediaPipe Pose 33 랜드마크 기반 체형 분석.

**체형 분류:**
- `rectangle` (직선형)
- `inverted-triangle` (역삼각형)
- `triangle` (삼각형)
- `oval` (타원형)
- `hourglass` (모래시계)

#### 헤어 분석 (H-1)
```
POST /api/analyze/hair-v2
GET  /api/analyze/hair-v2
```

얼굴형 분석 기반 헤어스타일 추천.

**얼굴형 분류 (7가지):**
`oval`, `round`, `square`, `oblong`, `heart`, `diamond`, `triangle`

#### 구강건강 분석 (OH-1)
```
POST /api/analyze/oral-health
```

VITA 셰이드 기반 치아 색상 분석 및 잇몸 건강 분석.

**분석 유형:**
- `tooth_color`: 치아 색상만
- `gum_health`: 잇몸 건강만
- `full`: 전체 분석

### Nutrition APIs

#### 식사 기록
```
POST /api/nutrition/meals
GET  /api/nutrition/meals?date=2026-02-02
```

**기록 유형:**
- `photo`: 사진 분석
- `search`: 음식 검색
- `barcode`: 바코드 스캔
- `manual`: 수동 입력

#### 영양 요약
```
GET /api/nutrition/summary/daily?date=2026-02-02
```

### Workout APIs

#### 운동 추천 (W-1)
```
POST /api/workout/recommend
```

**운동 타입 (5가지):**
- `toner`: 근력 운동 (탄탄한 몸매)
- `builder`: 근육 증가
- `burner`: 지방 연소
- `mover`: 유산소/기능성 운동
- `flexer`: 유연성/스트레칭

#### 스트레칭 루틴
```
POST /api/workout/stretching
```

### Coach APIs

#### AI 코치 채팅 (스트리밍)
```
POST /api/coach/stream
```

Server-Sent Events (SSE) 형식으로 실시간 응답.

### Products APIs

#### 추천 제품 조회
```
GET /api/affiliate/products?category=skincare&analysisType=skin
```

#### 사이즈 추천
```
POST /api/smart-matching/size-recommend
```

### User APIs

#### 계정 관리
```
GET    /api/user/account
DELETE /api/user/account
```

#### 데이터 내보내기
```
GET /api/user/export
```

#### 레벨 정보
```
GET /api/user/level
```

## Rate Limiting

| API 유형 | 제한 |
|----------|------|
| 분석 API | 50 requests / 24h / user |
| 일반 API | 100 requests / 1min / user |

Rate Limit 초과 시 `429` 응답과 함께 `Retry-After` 헤더가 반환됩니다.

## Mock Fallback

모든 AI 분석 API는 다음 조건에서 Mock 데이터로 폴백합니다:

1. **타임아웃**: 3초 초과
2. **재시도**: 최대 2회
3. **AI 서비스 오류**: Gemini API 실패

응답의 `usedFallback: true`로 Mock 사용 여부를 확인할 수 있습니다.

**개발/테스트 시 Mock 강제 사용:**
```json
{
  "imageBase64": "...",
  "useMock": true
}
```

## 에러 코드

| 코드 | HTTP | 설명 |
|------|------|------|
| `AUTH_ERROR` | 401 | 인증 필요 |
| `FORBIDDEN` | 403 | 권한 없음 |
| `VALIDATION_ERROR` | 400 | 입력값 검증 실패 |
| `NOT_FOUND` | 404 | 리소스 없음 |
| `RATE_LIMIT_ERROR` | 429 | 요청 제한 초과 |
| `IMAGE_QUALITY_ERROR` | 422 | 이미지 품질 부적합 |
| `AI_SERVICE_ERROR` | 500 | AI 서비스 오류 |
| `DB_ERROR` | 500 | 데이터베이스 오류 |
| `INTERNAL_ERROR` | 500 | 서버 오류 |

## 이미지 요구사항

분석 API에 사용되는 이미지는 다음 조건을 충족해야 합니다:

| 항목 | 요구사항 |
|------|----------|
| 형식 | JPEG, PNG |
| 크기 | 최소 480x480px, 권장 1024x1024px |
| 선명도 | Sharpness score >= 40 |
| 조명 | 자연광 권장, 역광 금지 |
| 얼굴 위치 | 이미지 중앙, 50% 이상 차지 |

품질 검사 실패 시 `IMAGE_QUALITY_ERROR` (422) 응답이 반환됩니다.

## 게이미피케이션

분석 및 기록 API 성공 시 게이미피케이션 보상이 제공됩니다:

| 활동 | XP |
|------|-----|
| 분석 완료 | 10 XP |
| 식단 기록 | 5 XP |
| 운동 완료 | 10 XP |
| 연속 기록 | 보너스 XP |

**배지 유형:**
- 분석 배지: 각 분석 유형별 첫 완료
- 올인원 배지: 모든 분석 완료
- 스트릭 배지: 연속 기록 달성

## OpenAPI 스펙

전체 API 스펙은 OpenAPI 3.0 형식으로 제공됩니다:

- **파일**: [openapi.yaml](./openapi.yaml)
- **버전**: 2.1.0

### 스펙 파일 사용

```bash
# Swagger UI 로컬 실행 (Redocly)
npx @redocly/cli preview-docs docs/api/openapi.yaml

# 또는 swagger-ui-watcher 사용
npx swagger-ui-watcher docs/api/openapi.yaml

# 코드 생성 (TypeScript)
npx openapi-typescript docs/api/openapi.yaml -o types/api.d.ts

# 스펙 검증
npx @redocly/cli lint docs/api/openapi.yaml
```

### Postman/Insomnia 가져오기

1. OpenAPI 스펙 파일을 Postman/Insomnia로 가져오기
2. 환경 변수 설정:
   - `baseUrl`: `https://yiroom.app/api` (프로덕션) 또는 `http://localhost:3000/api` (개발)
   - `clerkToken`: Clerk JWT 토큰

## SDK (향후 제공 예정)

```typescript
// 예정된 SDK 사용 예시
import { YiroomClient } from '@yiroom/sdk';

const client = new YiroomClient({ token: 'your-clerk-jwt' });

const result = await client.analysis.skin({
  imageBase64: 'data:image/jpeg;base64,...'
});

console.log(result.skinType); // 'combination'
console.log(result.vitalityScore); // 78
```

## 지원

- **이슈 리포트**: GitHub Issues
- **이메일**: dev@yiroom.app
- **문서**: https://docs.yiroom.app

---

**Version**: 2.1.0 | **Updated**: 2026-02-02
