# 이룸 프로덕션 배포 체크리스트

> **마지막 업데이트**: 2026-01-03
> **대상 환경**: Vercel + Supabase + Clerk

---

## 1. 환경 변수 설정 (Vercel)

### 필수 변수

```bash
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://[project-id].supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=[anon-key]
SUPABASE_SERVICE_ROLE_KEY=[service-role-key]

# Clerk
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_live_...
CLERK_SECRET_KEY=sk_live_...

# AI
GOOGLE_GENERATIVE_AI_API_KEY=[gemini-api-key]

# Web Push (L-1)
NEXT_PUBLIC_VAPID_PUBLIC_KEY=[public-key]
VAPID_PRIVATE_KEY=[private-key]
VAPID_SUBJECT=mailto:support@yiroom.app

# 모니터링 (선택)
SENTRY_DSN=[sentry-dsn]
```

### 설정 방법

1. Vercel Dashboard > Project > Settings > Environment Variables
2. 각 변수 추가 (Production 환경 선택)
3. Redeploy 실행

---

## 2. Supabase 설정

### 2.1 테이블 마이그레이션

```sql
-- push_subscriptions (L-1 Web Push)
CREATE TABLE IF NOT EXISTS push_subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  clerk_user_id TEXT NOT NULL,
  endpoint TEXT NOT NULL,
  p256dh TEXT NOT NULL,
  auth TEXT NOT NULL,
  user_agent TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  is_active BOOLEAN DEFAULT true,
  UNIQUE(clerk_user_id, endpoint)
);

CREATE INDEX IF NOT EXISTS idx_push_subscriptions_user
  ON push_subscriptions(clerk_user_id);
CREATE INDEX IF NOT EXISTS idx_push_subscriptions_active
  ON push_subscriptions(is_active) WHERE is_active = true;

ALTER TABLE push_subscriptions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own subscriptions"
  ON push_subscriptions FOR ALL
  USING (clerk_user_id = auth.jwt() ->> 'sub');

CREATE POLICY "Service role full access"
  ON push_subscriptions FOR ALL
  USING (auth.jwt() ->> 'role' = 'service_role');
```

### 2.2 RLS 확인

모든 사용자 데이터 테이블에 RLS 활성화 확인:

- [x] users
- [x] personal_color_assessments
- [x] skin_analyses
- [x] body_analyses
- [x] workout_analyses, workout_plans, workout_logs
- [x] meal_records, water_records, daily_nutrition_summary
- [x] friendships, wellness_scores
- [x] push_subscriptions

---

## 3. Clerk 설정

### 3.1 프로덕션 키 발급

1. Clerk Dashboard > API Keys
2. Production instance 생성 (아직 없다면)
3. Publishable Key, Secret Key 복사
4. Vercel 환경변수에 설정

### 3.2 JWT 템플릿 확인

Clerk Dashboard > JWT Templates에서 Supabase 템플릿 확인:

```json
{
  "sub": "{{user.id}}",
  "email": "{{user.primary_email_address}}",
  "role": "authenticated"
}
```

---

## 4. 도메인 설정

### Vercel

- Production Domain: yiroom.app (예시)
- HTTPS 자동 활성화

### Clerk

- Clerk Dashboard > Domains에서 프로덕션 도메인 추가

### Supabase

- 별도 도메인 설정 불필요 (API 엔드포인트 사용)

---

## 5. 최종 점검

### 빌드 확인

```bash
npm run build:web
# 에러 없이 완료되어야 함
```

### 테스트 확인

```bash
npm run test
# 모든 테스트 통과
```

### 기능 테스트 (수동)

- [ ] 로그인/로그아웃
- [ ] 퍼스널 컬러 분석
- [ ] 운동 온보딩 및 기록
- [ ] 영양 기록
- [ ] 푸시 알림 구독/테스트
- [ ] 친구 추가/리더보드
- [ ] 다국어 전환

---

## 6. 배포 후 모니터링

### Vercel Analytics

- Vercel Dashboard > Analytics에서 성능 모니터링

### Sentry (선택)

- 에러 추적 및 알림 설정

### Supabase Dashboard

- API 사용량 모니터링
- DB 성능 확인

---

## 7. 롤백 계획

### 코드 롤백

```bash
# 이전 커밋으로 롤백
git revert HEAD
git push
```

### Vercel 롤백

- Vercel Dashboard > Deployments에서 이전 배포 선택 > Promote to Production

### DB 롤백

- Supabase Dashboard > Database > Backups에서 복원

---

## 체크리스트 요약

| 항목                  | 상태 | 담당    |
| --------------------- | ---- | ------- |
| Vercel 환경변수       | ⏳   | 배포 시 |
| Supabase 마이그레이션 | ⏳   | 배포 시 |
| Clerk 프로덕션 키     | ⏳   | 배포 시 |
| 도메인 설정           | ⏳   | 배포 시 |
| 기능 테스트           | ⏳   | 배포 후 |
| 모니터링 설정         | ⏳   | 배포 후 |

---

**참고**: 이 체크리스트는 배포 시점에 순서대로 진행하세요.
