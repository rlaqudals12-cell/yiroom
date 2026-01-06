# SPEC: 분석 모듈 확장 - H-1, M-1, A-1

> 헤어 분석, 정신건강 트래킹, 자세 분석 신규 모듈

**Version**: 1.0
**Date**: 2026-01-07
**Status**: Draft
**Author**: Claude Code

---

## 1. H-1 헤어 분석

### 목적

두피/모발 상태 분석 + 헤어스타일 추천

### 분석 항목

```yaml
두피 분석:
  - 두피 타입: oily | normal | dry | sensitive
  - 각질 상태: clean | moderate | flaky
  - 탈모 위험도: low | medium | high
  - 모공 상태: clear | clogged

모발 분석:
  - 모발 굵기: fine | medium | thick
  - 손상도: healthy | slightly_damaged | damaged | severely_damaged
  - 탄력: elastic | normal | brittle
  - 윤기: shiny | normal | dull
```

### 헤어스타일 추천 연동

```yaml
추천 기준:
  - 얼굴형 (C-1 체형 데이터 활용)
  - 퍼스널 컬러 (PC-1 시즌)
  - 두피/모발 상태
  - 관리 용이성 선호도
```

### 제품 연동

```yaml
두피 케어:
  - 샴푸 (두피 타입별)
  - 스칼프 에센스
  - 각질 제거제

모발 케어:
  - 트리트먼트 (손상도별)
  - 헤어 에센스
  - 열 보호제
```

### 구현 파일

| 파일 | 내용 |
|------|------|
| `app/(main)/analysis/hair/page.tsx` | H-1 메인 페이지 |
| `app/(main)/analysis/hair/result/[id]/page.tsx` | 결과 페이지 |
| `app/api/analyze/hair/route.ts` | 분석 API |
| `lib/gemini.ts` | analyzeHair() 추가 |
| `lib/mock/hair-analysis.ts` | Mock 데이터 |
| `components/analysis/hair/` | UI 컴포넌트 |

### 예상 작업량: 20h

---

## 2. M-1 정신건강 트래킹

### 목적

스트레스/수면/기분 일일 트래킹 + 트렌드 분석

### 주의사항

```
⚠️ 의료 진단 불가 면책 조항 필수
⚠️ 위기 상황 감지 시 전문가 연결 안내
```

### 트래킹 항목

```yaml
일일 체크인:
  - 기분 (1-5 이모지 스케일)
  - 스트레스 레벨 (1-10)
  - 수면 시간 (시간)
  - 수면 품질 (1-5)
  - 에너지 레벨 (1-5)

주간 체크인 (선택):
  - 불안 수준
  - 우울 징후 (PHQ-2 간이 설문)
  - 사회적 연결감
```

### 인사이트 제공

```yaml
트렌드 분석:
  - 주간/월간 기분 변화 그래프
  - 수면-기분 상관관계
  - 운동-스트레스 상관관계 (W-1 연동)
  - 영양-에너지 상관관계 (N-1 연동)

AI 제안:
  - 패턴 기반 조언 (예: "수면 6시간 미만일 때 기분 저하 경향")
  - 개선 액션 제안
```

### DB 스키마

```sql
CREATE TABLE mental_health_logs (
  id UUID PRIMARY KEY,
  clerk_user_id TEXT NOT NULL,
  log_date DATE NOT NULL,
  mood_score SMALLINT CHECK (mood_score BETWEEN 1 AND 5),
  stress_level SMALLINT CHECK (stress_level BETWEEN 1 AND 10),
  sleep_hours DECIMAL(3,1),
  sleep_quality SMALLINT CHECK (sleep_quality BETWEEN 1 AND 5),
  energy_level SMALLINT CHECK (energy_level BETWEEN 1 AND 5),
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (clerk_user_id, log_date)
);
```

### 예상 작업량: 18h

---

## 3. A-1 자세 분석

### 목적

체형 기반 자세 교정 + 스트레칭 추천

### 분석 항목

```yaml
정면 분석:
  - 어깨 높이 대칭
  - 골반 높이 대칭
  - 무릎 정렬
  - 발 각도

측면 분석:
  - 목 전방 경사 (Forward Head Posture)
  - 등 굽음 정도 (Kyphosis)
  - 허리 만곡 (Lordosis)
  - 골반 기울기 (Anterior/Posterior Tilt)

자세 타입:
  - ideal: 이상적
  - forward_head: 거북목
  - rounded_shoulders: 굽은 어깨
  - swayback: 스웨이백
  - flatback: 일자 허리
  - lordosis: 과도한 요추 전만
```

### C-1 연동

```yaml
체형 → 자세 상관관계:
  - Apple 체형: 복부 돌출로 요추 전만 경향
  - Rectangle 체형: 일자 허리 경향
  - Athletic 체형: 골반 전방 경사 가능성

통합 분석:
  - C-1 + A-1 결합 리포트
  - 체형 맞춤 스트레칭 루틴
```

### 스트레칭 추천

```yaml
거북목 (Forward Head):
  - 턱 당기기 운동
  - 목 스트레칭
  - 흉추 가동성 운동

굽은 어깨 (Rounded Shoulders):
  - 가슴 스트레칭
  - 로우 운동
  - 어깨 외회전 강화

골반 전방 경사:
  - 고관절 굴곡근 스트레칭
  - 글루트 강화
  - 복근 강화
```

### MediaPipe 활용

```typescript
// 기존 Phase V 인프라 재사용
import { detectFaceLandmarks } from '@/lib/analysis/face-landmark';

// 전신 랜드마크 추가
import { detectPoseLandmarks } from '@/lib/analysis/pose-landmark';
// MediaPipe Pose (33 keypoints)
```

### 예상 작업량: 25h

---

## 우선순위 권장

| 모듈 | 복잡도 | 기존 연동 | 권장 순서 |
|------|--------|-----------|-----------|
| H-1 헤어 | 중간 | PC-1, 제품 DB | 2순위 |
| M-1 정신건강 | 낮음 | W-1, N-1 | 1순위 |
| A-1 자세 | 높음 | C-1, MediaPipe | 3순위 |

---

## 시지푸스 판정

| 모듈 | 파일 수 | 복잡도 점수 | 판정 |
|------|---------|-------------|------|
| H-1 | 8개 | 45점 | ✅ 시지푸스 필요 |
| M-1 | 6개 | 35점 | ⚠️ 단독 가능 |
| A-1 | 10개+ | 65점 | ✅ 시지푸스 필요 |

---

**Status**: Draft (승인 대기)
