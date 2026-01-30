# GDPR 및 한국 개인정보보호법 준수 가이드: Yiroom 플랫폼을 위한 완벽한 컴플라이언스 로드맵

## 1. 핵심 요약

**Yiroom 플랫폼의 GDPR 및 한국 개인정보보호법(PIPA) 준수를 위한 핵심 사항은 다음과 같습니다:** 개인정보 보유기간은 GDPR의 경우 목적 달성에 필요한 최소 기간, PIPA의 경우 **보유기간 종료 후 5일 이내** 파기가 원칙입니다. 동의 철회 처리는 GDPR은 **최대 1개월**, PIPA는 **10일 이내** 조치해야 하며 PIPA가 더 엄격합니다. 신체 측정 및 피부 분석 데이터는 양 법률 모두 **민감정보/특수범주 데이터**로 분류되어 **별도의 명시적 동의**가 필수입니다. 휴면계정의 경우 한국은 2023년 유효기간제가 폐지되어 자율 정책 운영이 가능하며, 업계 표준은 **1~2년 미이용 시 사전 통지 후 삭제**입니다. 자동 삭제 구현은 Supabase의 **pg_cron + Edge Functions** 조합으로 효율적으로 구현 가능합니다.

---

## 2. 상세 내용

### 2.1 개인정보 보유기간 법적 기준

#### GDPR 보유기간 원칙 (Article 5(1)(e) - Storage Limitation)

GDPR은 **특정 보유기간을 법으로 명시하지 않습니다**. 대신 개인정보처리자가 처리 목적에 따라 적절한 기간을 스스로 정당화해야 합니다. 핵심 원칙은 "개인정보 주체를 식별할 수 있는 형태로 **목적 달성에 필요한 기간 이상 보관 금지**"입니다.

| 데이터 유형 | CNIL(프랑스) 권장 기간 | 근거 |
|------------|----------------------|------|
| 고객 관계 데이터 | 마지막 상호작용 후 **3년** | 목적 달성 |
| 비활성 잠재고객 | **3년** | 최소화 원칙 |
| 접속 로그 | **6개월~1년** (고위험 시 3년) | 보안 목적 |
| 의료 파일 | **20년** | 법적 의무 |

**민감정보(Article 9)** 요건: 신체 측정 및 피부 분석 데이터는 건강 데이터 또는 생체인식정보로 분류될 수 있어 **명시적 동의(explicit consent)**가 필수이며, **DPIA(Data Protection Impact Assessment)** 수행이 요구됩니다.

#### 한국 개인정보보호법 보유기간 기준

PIPA **제21조**는 보유기간 경과 또는 처리 목적 달성 시 **근무일 기준 5일 이내** 파기를 명시합니다. 이는 GDPR보다 훨씬 구체적인 기준입니다.

| 기록 유형 | 법정 보유기간 | 근거 법령 |
|----------|-------------|----------|
| 계약/청약철회 기록 | **5년** | 전자상거래법 |
| 대금결제/재화공급 기록 | **5년** | 전자상거래법 |
| 소비자 불만/분쟁처리 | **3년** | 전자상거래법 |
| 접속 로그 | **3개월** (민감정보 처리 시 **2년**) | 통신비밀보호법, 안전성확보조치 기준 |
| 세법 관련 장부 | **5년** | 국세기본법 |

#### 뷰티/건강/피트니스 데이터 특별 고려사항

**Yiroom 플랫폼 데이터 분류 및 권장 보유기간:**

```
┌─────────────────────────────────────────────────────────────┐
│ 민감정보 (별도 동의 필수) - GDPR Article 9 / PIPA 제23조    │
├─────────────────────────────────────────────────────────────┤
│ • 신체 측정 데이터 (Body measurements) → 계정 유지 기간     │
│ • 피부 분석 데이터 (Skin analysis) → 계정 유지 기간         │
│ • 피부톤 분석 포함 퍼스널 컬러 → 계정 유지 기간             │
│ • 얼굴 사진 (분석용) → 분석 완료 즉시~최대 7일 내 삭제      │
├─────────────────────────────────────────────────────────────┤
│ 일반 개인정보 (표준 동의)                                   │
├─────────────────────────────────────────────────────────────┤
│ • 이름, 이메일, 연락처 → 탈퇴 시까지                        │
│ • 퍼스널 컬러 결과 (피부톤 미포함) → 계정 유지 기간         │
│ • 서비스 이용 기록 → 3년                                    │
└─────────────────────────────────────────────────────────────┘
```

**업계 표준 비교 (Apple Fitness+, Google 기준):**
- 건강/신체 데이터: 최대 **2년**
- 진행 추적 사진: 최대 **1년** (360일)
- 얼굴/생체인식 이미지: **세션 종료 즉시 삭제** 또는 최대 7일

---

### 2.2 자동 삭제 요건 및 구현 방법

#### 법적 요건 비교

| 구분 | GDPR | 한국 PIPA |
|-----|------|----------|
| 삭제 시한 | "지체 없이" (최대 1개월) | **5일 이내** (근무일 기준) |
| 삭제 방법 | 복구 불가능한 방법 | **복구 또는 재생 불가능**하도록 조치 |
| Soft Delete | 임시 조치로만 허용 | **법적 미충족** (원칙적 불인정) |
| Hard Delete | 권장 | **필수** |
| 익명처리 대안 | 진정한 익명화 시 GDPR 적용 제외 | 기술적 삭제 곤란 시 허용 |

#### Soft Delete vs Hard Delete 법적 관점

**GDPR 입장:** "삭제(erasure)"와 "right to be forgotten"의 법적 해석상 **실제 제거가 의도**되며, 단순 비활성화(soft delete)는 일반적으로 **불충분**합니다. 다만, 즉시 완전 삭제가 불가능한 경우(백업 등) "데이터를 사용 불가 상태로(put beyond use)" 만드는 것은 허용됩니다.

**PIPA 입장:** 시행령 제16조는 "**복원이 불가능한 방법으로 영구 삭제**"를 명시하여 soft delete를 원칙적으로 불인정합니다. 단, 다른 법령에 따른 보존 필요 시 **분리 보관**이 허용됩니다.

**권장 구현 전략:**
```
1단계: Soft Delete (즉시) → deleted_at 타임스탬프 기록, 사용자 접근 차단
2단계: Grace Period (30일) → 복구 가능 기간 제공
3단계: Hard Delete (자동) → pg_cron으로 영구 삭제 실행
4단계: 법정 보존 데이터 → 별도 DB로 분리 저장 (접근 제한)
```

#### 데이터 익명처리(Anonymization) 대안

**GDPR 기준 (EDPB 익명화 3대 요건):**
1. **개별화 불가(Individualization)**: 데이터셋에서 개인 식별 불가능
2. **연계 불가(Correlation)**: 동일인 관련 데이터셋 연결 불가능  
3. **추론 불가(Inference)**: 개인 정보 추론 불가능

**PIPA 기준:** 제58조의2에 따라 "시간, 비용, 기술 등을 합리적으로 고려할 때 다른 정보를 사용하여도 더 이상 개인을 알아볼 수 없는 정보"로 처리 시 PIPA 적용이 제외됩니다.

**주의:** 가명처리(Pseudonymization)는 여전히 개인정보로 취급됩니다.

---

### 2.3 동의 철회 처리 절차 (법적 의무)

#### GDPR 동의 철회 요건 (Article 7(3))

**핵심 원칙:** "*동의 철회는 동의 제공만큼 쉬워야 한다(It shall be as easy to withdraw as to give consent)*"

| 요건 | 상세 내용 |
|-----|----------|
| 동일 용이성 | 동의 시 원클릭이었다면 철회도 원클릭으로 가능해야 함 |
| 동일 인터페이스 | 앱에서 동의했다면 앱에서 철회 가능해야 함 |
| 무료 제공 | 철회에 비용 청구 불가 |
| 불이익 금지 | 철회로 인한 서비스 품질 저하 불가 |
| 사전 고지 | 동의 전 철회 권리 안내 필수 |

**처리 기한 (Article 12(3)):**
- **지체 없이** 처리
- 최대 **1개월** 이내
- 복잡한 경우 **추가 2개월** 연장 가능 (첫 1개월 내 통지 필수)

#### 한국 PIPA 동의 철회 요건

PIPA는 별도의 "동의 철회권"을 명시하지 않으나, **제37조 처리정지 요구권**을 통해 동의 철회 효과를 달성합니다.

**처리 기한 (시행령 제41조):**
- 요구 접수일로부터 **10일 이내** 조치 및 결과 통지
- 처리 기간 중 해당 개인정보 **이용/제공 금지**

**실무 처리 절차:**
```
1. 동의 철회 요청 접수 (앱 내 UI 또는 이메일)
2. 정보주체 본인 확인 (Clerk 인증 활용)
3. 10일 이내 삭제 조치 실행
4. 파기 결과 정보주체에게 통지
5. 삭제 감사 로그 기록
```

#### 삭제 vs 보존 데이터 구분

**반드시 삭제해야 할 데이터:**
- 동의에만 기반하여 수집한 개인정보
- 서비스 제공 목적으로만 필요한 데이터
- 신체 측정, 피부 분석, 퍼스널 컬러 결과

**법정 보존 가능 데이터 (분리 보관 필수):**

| 데이터 유형 | 보존 기간 | 근거 |
|------------|----------|------|
| 결제 기록 | 5년 | 전자상거래법 |
| 계약 관련 기록 | 5년 | 전자상거래법 |
| 분쟁 처리 기록 | 3년 | 전자상거래법 |
| 접속 로그 | 3개월~2년 | 통신비밀보호법 |

**사용자 통지 내용:**
- 삭제 완료 사실
- 삭제된 개인정보 항목
- 삭제 일시
- 법정 보존 데이터가 있는 경우 해당 내용 및 보존 기간

---

### 2.4 휴면계정 처리 기준

#### 한국 휴면계정 제도 변경 (2023년 9월 15일)

**중요 변경사항:** 구 제39조의6 "개인정보 유효기간제" (1년 미이용 시 파기/분리보관 의무)가 **폐지**되었습니다. 현재는 자율적 휴면정책 운영이 가능합니다.

**폐지 배경:**
- 개인정보 자기결정권 제한 문제
- 이용자 의사와 무관한 강제 분리/파기 문제
- 코로나19 등으로 인한 장기 미이용 서비스 불편

#### GDPR 휴면계정 가이드라인

GDPR은 **특정 휴면 기간을 명시하지 않습니다**. 다만 Storage Limitation 원칙에 따라 불필요하게 된 데이터는 삭제해야 합니다.

**업계 표준 비교:**

| 플랫폼 | 휴면 기간 | 사전 통지 | 복구 가능 여부 |
|-------|----------|----------|---------------|
| **Google** | 2년 | 수개월 전부터 다수 통지 | 통지 기간 중 복구 가능 |
| **Apple** | 1년 (재량) | 30일 전 이메일 | 지원팀 문의로 복구 |
| **Yahoo** | 12개월 | 제한적 | 제한적 |
| **업계 평균** | 12~36개월 | 30일 | 30일 |

#### Yiroom 플랫폼 권장 휴면정책

**뷰티/건강 앱 특성 고려 권장안:**

```
권장 휴면 기간: 1~2년
├── 근거: 피부/신체 변화 주기, 계절별 이용 패턴
├── 최소 연 1회 이용 예상 서비스 특성 반영
│
휴면 전환 절차:
├── 기준 기간 90일 전: 첫 번째 안내 (이메일)
├── 기준 기간 30일 전: 두 번째 안내 (이메일 + 앱 푸시)
├── 기준 기간 7일 전: 최종 안내 (이메일 + 앱 푸시 + SMS)
├── 휴면 전환 시: 확인 통지 및 복구 방법 안내
│
복구 정책:
├── 휴면 후 30일: 단순 로그인으로 복구 가능
└── 휴면 후 30일 이후: 영구 삭제 (또는 익명화)
```

**휴면정책 변경 시 의무사항:**
1. 변경 사실 사전 안내
2. 이의 제기/탈퇴/계속 이용 선택권 부여
3. 변경 사유 고지 (법 개정 등)
4. **마케팅 목적 활용 금지** (쿠폰/포인트 지급 연계 불가)

---

### 2.5 Cron Job 기반 자동 삭제 구현

#### Supabase pg_cron + Edge Functions 아키텍처

Supabase는 PostgreSQL의 `pg_cron` 확장과 `pg_net`을 통해 네이티브 스케줄링을 지원합니다. 이는 별도의 서버 없이 자동 삭제를 구현하는 가장 효율적인 방법입니다.

**전체 아키텍처 흐름:**
```
사용자 삭제 요청
       ↓
API Route → DeletionService.requestDeletion()
       ↓
deletion_scheduled_at 설정 (현재 + 30일)
       ↓
deletion_audit_log 기록
       ↓
pg_cron (매일 실행)
       ↓
┌─────────────────────────────────────────┐
│ send-deletion-reminders Edge Function   │
│ (7일, 3일, 1일 전 알림 발송)             │
└─────────────────────────────────────────┘
       ↓
┌─────────────────────────────────────────┐
│ gdpr-data-cleanup Edge Function         │
│ (hard_delete_user() PostgreSQL 함수 실행)│
└─────────────────────────────────────────┘
       ↓
Cascading Delete (모든 관련 테이블)
       ↓
최종 감사 로그 기록
```

#### 데이터베이스 스키마 설계

**사용자 테이블 (Soft Delete 지원):**
```sql
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT NOT NULL,
  name TEXT,
  clerk_user_id TEXT UNIQUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  deleted_at TIMESTAMPTZ,              -- NULL = 활성, 타임스탬프 = soft deleted
  deletion_requested_at TIMESTAMPTZ,   -- 삭제 요청 시점
  deletion_scheduled_at TIMESTAMPTZ    -- 실제 삭제 예정 시점
);

-- 활성 사용자만의 고유 인덱스
CREATE UNIQUE INDEX idx_users_email_active ON users(email) WHERE deleted_at IS NULL;

-- 효율적인 삭제 쿼리를 위한 인덱스
CREATE INDEX idx_users_deleted_at ON users(deleted_at) WHERE deleted_at IS NOT NULL;
CREATE INDEX idx_users_deletion_scheduled ON users(deletion_scheduled_at) 
  WHERE deletion_scheduled_at IS NOT NULL;
```

**감사 로그 테이블 (불변성 보장):**
```sql
CREATE TABLE deletion_audit_log (
  id BIGSERIAL PRIMARY KEY,
  user_id UUID NOT NULL,
  action TEXT NOT NULL CHECK (action IN (
    'DELETION_REQUESTED',
    'NOTIFICATION_SENT',
    'GRACE_PERIOD_STARTED',
    'SOFT_DELETE_INITIATED',
    'HARD_DELETE_COMPLETED',
    'DELETION_CANCELLED',
    'DATA_EXPORTED'
  )),
  performed_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  performed_by UUID,
  metadata JSONB DEFAULT '{}',
  is_permanent BOOLEAN DEFAULT false,
  ip_address INET,
  user_agent TEXT
);

-- 감사 로그 불변성 보장 트리거
CREATE OR REPLACE FUNCTION prevent_audit_modification()
RETURNS TRIGGER AS $$
BEGIN
  RAISE EXCEPTION '감사 로그는 수정하거나 삭제할 수 없습니다';
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER audit_log_immutable
BEFORE UPDATE OR DELETE ON deletion_audit_log
FOR EACH ROW EXECUTE FUNCTION prevent_audit_modification();
```

#### 감사 로그 보관 요건

**PIPA 안전성 확보조치 기준 제8조:**
- 접속기록 **최소 1년** 보관
- 민감정보 처리 시 **최소 2년** 보관
- 기록 항목: 식별자, 접속일시, 접속지, 처리내역

**감사 로그 기록 항목:**
```
- 파기 일시
- 파기 대상 (개인정보 항목)
- 파기 방법
- 파기 담당자
- 파기 확인자 (CPO)
- 파기 사유
```

---

## 3. 구현 체크리스트

### 법적 컴플라이언스 체크리스트

#### 3.1 동의 수집 및 관리
- [ ] 민감정보(신체측정/피부분석)에 대한 **별도 명시적 동의** 구현
- [ ] 동의 철회가 동의 제공만큼 쉽게 가능하도록 UI 구현
- [ ] 동의 제공 전 철회 권리 안내 문구 표시
- [ ] 동의 기록 저장 (시점, 버전, 선택 항목, IP 등)
- [ ] 사전 체크된 동의 박스 제거 (명시적 옵트인만 허용)
- [ ] 동의/거부 버튼 동일한 시각적 비중 부여

#### 3.2 개인정보처리방침
- [ ] 데이터 유형별 **보유기간 명시**
- [ ] 파기 절차 및 방법 명시
- [ ] 민감정보 처리 사항 **별도 고지**
- [ ] 국외 이전 사항 **분리 공개** (Supabase 해외 서버 사용 시)
- [ ] 한국어 버전 제공 (한국 사용자 대상)
- [ ] 이전 버전 아카이브 유지

#### 3.3 정보주체 권리 보장
- [ ] 삭제 요청 처리 프로세스 구현 (GDPR 1개월 / PIPA 10일 이내)
- [ ] 앱 내 계정 삭제 기능 구현 (Apple App Store 필수 요건)
- [ ] 데이터 이동성(다운로드) 기능 구현
- [ ] 본인 확인 절차 구현 (Clerk 인증 연동)
- [ ] 삭제 완료 통지 시스템 구현

#### 3.4 데이터 보호
- [ ] 민감정보 처리에 대한 **DPIA 수행**
- [ ] 전송 중/저장 시 암호화 적용
- [ ] 역할 기반 접근 제어 구현 (Supabase RLS)
- [ ] 침해 사고 대응 절차 수립 (72시간 이내 신고)
- [ ] **CPO(개인정보보호책임자)** 지정 (미지정 시 과태료 최대 1,000만원)

### 기술 구현 체크리스트

#### 3.5 자동 삭제 시스템
- [ ] 데이터 유형별 보유기간 스케줄 정의
- [ ] pg_cron을 통한 일일 삭제 작업 스케줄링
- [ ] Soft Delete → Hard Delete 2단계 삭제 프로세스 구현
- [ ] 삭제 전 사전 통지 워크플로우 구현 (7일, 3일, 1일 전)
- [ ] 대용량 데이터 청크 처리 구현 (100건 단위)
- [ ] 에러 핸들링 및 재시도 메커니즘 구현
- [ ] PostgreSQL 함수를 통한 트랜잭션 안전성 보장

#### 3.6 감사 및 모니터링
- [ ] 불변 감사 로그 테이블 생성
- [ ] 삭제 감사 트레일 기록 구현
- [ ] 접속 로그 2년 보관 설정 (민감정보 처리)
- [ ] 정기 컴플라이언스 감사 일정 수립 (분기별)
- [ ] cron.job_run_details 모니터링

#### 3.7 휴면계정 관리
- [ ] 휴면 기준 기간 정의 (권장: 1~2년)
- [ ] 미활동 감지 트리거 구현
- [ ] 단계별 사전 통지 시스템 구현 (90일, 30일, 7일 전)
- [ ] 휴면 복구 기능 구현 (30일 유예기간)
- [ ] 휴면정책 변경 시 사전 안내 프로세스

#### 3.8 Clerk 연동
- [ ] Clerk deleteUser API 연동
- [ ] Sign in with Apple 토큰 폐기 처리
- [ ] Supabase 삭제와 Clerk 삭제 동기화

---

## 4. TypeScript 코드 예제

### 4.1 pg_cron 스케줄 설정 (SQL)

```sql
-- Vault에 프로젝트 자격 증명 저장
SELECT vault.create_secret('https://YOUR-PROJECT.supabase.co', 'project_url');
SELECT vault.create_secret('YOUR_SERVICE_ROLE_KEY', 'service_role_key');

-- 일일 GDPR 데이터 정리 작업 스케줄링 (매일 새벽 3시 UTC)
SELECT cron.schedule(
  'daily-gdpr-data-cleanup',
  '0 3 * * *',
  $$
  SELECT net.http_post(
    url := (SELECT decrypted_secret FROM vault.decrypted_secrets WHERE name = 'project_url') 
           || '/functions/v1/gdpr-data-cleanup',
    headers := jsonb_build_object(
      'Content-type', 'application/json',
      'Authorization', 'Bearer ' || (SELECT decrypted_secret FROM vault.decrypted_secrets WHERE name = 'service_role_key')
    ),
    body := jsonb_build_object('triggered_at', now()::text)
  ) AS request_id;
  $$
);

-- 삭제 알림 발송 작업 스케줄링 (매일 오전 9시 KST = 0시 UTC)
SELECT cron.schedule(
  'send-deletion-reminders',
  '0 0 * * *',
  $$
  SELECT net.http_post(
    url := (SELECT decrypted_secret FROM vault.decrypted_secrets WHERE name = 'project_url') 
           || '/functions/v1/send-deletion-reminders',
    headers := jsonb_build_object(
      'Content-type', 'application/json',
      'Authorization', 'Bearer ' || (SELECT decrypted_secret FROM vault.decrypted_secrets WHERE name = 'service_role_key')
    ),
    body := jsonb_build_object('triggered_at', now()::text)
  ) AS request_id;
  $$
);
```

### 4.2 PostgreSQL Hard Delete 함수

```sql
-- 사용자 영구 삭제 함수 (GDPR/PIPA 준수)
CREATE OR REPLACE FUNCTION hard_delete_user(p_user_id UUID)
RETURNS void AS $$
BEGIN
  -- 외래 키 순서에 따라 관련 테이블 삭제
  DELETE FROM user_body_measurements WHERE user_id = p_user_id;
  DELETE FROM user_skin_analysis WHERE user_id = p_user_id;
  DELETE FROM user_personal_color WHERE user_id = p_user_id;
  DELETE FROM user_preferences WHERE user_id = p_user_id;
  DELETE FROM user_sessions WHERE user_id = p_user_id;
  DELETE FROM users WHERE id = p_user_id;
  
  -- 영구 삭제 감사 로그 기록
  INSERT INTO deletion_audit_log (user_id, action, performed_at, is_permanent)
  VALUES (p_user_id, 'HARD_DELETE_COMPLETED', NOW(), true);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Soft Delete 함수 (Grace Period 시작)
CREATE OR REPLACE FUNCTION soft_delete_user(p_user_id UUID)
RETURNS void AS $$
DECLARE
  v_now TIMESTAMPTZ := NOW();
BEGIN
  -- 사용자 soft delete 처리
  UPDATE users SET deleted_at = v_now WHERE id = p_user_id AND deleted_at IS NULL;
  
  -- 관련 테이블 cascade soft delete
  UPDATE user_body_measurements SET deleted_at = v_now WHERE user_id = p_user_id AND deleted_at IS NULL;
  UPDATE user_skin_analysis SET deleted_at = v_now WHERE user_id = p_user_id AND deleted_at IS NULL;
  UPDATE user_personal_color SET deleted_at = v_now WHERE user_id = p_user_id AND deleted_at IS NULL;
  
  -- 감사 로그 기록
  INSERT INTO deletion_audit_log (user_id, action, performed_at)
  VALUES (p_user_id, 'SOFT_DELETE_INITIATED', v_now);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

### 4.3 GDPR 삭제 서비스 (TypeScript)

```typescript
// src/services/gdpr/deletionService.ts
import { createClient, SupabaseClient } from '@supabase/supabase-js'
import { clerkClient } from '@clerk/nextjs/server'
import type { Database } from '@/types/database.types'

interface DeletionConfig {
  gracePeriodDays: number        // 유예 기간 (일)
  notificationDays: number[]     // 삭제 전 알림 발송 시점
}

const DEFAULT_CONFIG: DeletionConfig = {
  gracePeriodDays: 30,
  notificationDays: [7, 3, 1]
}

export class GDPRDeletionService {
  private supabase: SupabaseClient<Database>
  private config: DeletionConfig

  constructor(
    supabaseUrl: string,
    supabaseKey: string,
    config: Partial<DeletionConfig> = {}
  ) {
    this.supabase = createClient<Database>(supabaseUrl, supabaseKey)
    this.config = { ...DEFAULT_CONFIG, ...config }
  }

  /**
   * 삭제 요청 시작 (유예 기간 적용)
   * GDPR: 최대 1개월 / PIPA: 10일 이내 처리
   */
  async requestDeletion(userId: string, reason?: string): Promise<{
    success: boolean
    scheduledAt: Date
    message: string
  }> {
    const scheduledAt = new Date()
    scheduledAt.setDate(scheduledAt.getDate() + this.config.gracePeriodDays)

    // 삭제 예약 설정
    const { error: updateError } = await this.supabase
      .from('users')
      .update({
        deletion_requested_at: new Date().toISOString(),
        deletion_scheduled_at: scheduledAt.toISOString()
      })
      .eq('id', userId)
      .is('deleted_at', null)

    if (updateError) {
      throw new Error(`삭제 요청 실패: ${updateError.message}`)
    }

    // 감사 로그 기록
    await this.supabase.from('deletion_audit_log').insert({
      user_id: userId,
      action: 'DELETION_REQUESTED',
      metadata: { reason, scheduled_at: scheduledAt.toISOString() }
    })

    return {
      success: true,
      scheduledAt,
      message: `계정이 ${scheduledAt.toLocaleDateString('ko-KR')}에 삭제 예정입니다`
    }
  }

  /**
   * 삭제 요청 취소 (유예 기간 내)
   */
  async cancelDeletion(userId: string): Promise<boolean> {
    const { data: user, error: fetchError } = await this.supabase
      .from('users')
      .select('deletion_scheduled_at')
      .eq('id', userId)
      .single()

    if (fetchError || !user?.deletion_scheduled_at) {
      return false
    }

    // 유예 기간 내에만 취소 가능
    if (new Date(user.deletion_scheduled_at) <= new Date()) {
      throw new Error('유예 기간이 만료되었습니다')
    }

    const { error } = await this.supabase
      .from('users')
      .update({
        deletion_requested_at: null,
        deletion_scheduled_at: null
      })
      .eq('id', userId)

    if (!error) {
      await this.supabase.from('deletion_audit_log').insert({
        user_id: userId,
        action: 'DELETION_CANCELLED'
      })
    }

    return !error
  }

  /**
   * 데이터 내보내기 (GDPR 데이터 이동권)
   */
  async exportUserData(userId: string): Promise<Record<string, unknown>> {
    const tables = [
      'users', 
      'user_body_measurements', 
      'user_skin_analysis', 
      'user_personal_color',
      'user_preferences'
    ]
    const exportData: Record<string, unknown> = {}

    for (const table of tables) {
      const { data, error } = await this.supabase
        .from(table)
        .select('*')
        .eq(table === 'users' ? 'id' : 'user_id', userId)

      if (!error && data) {
        exportData[table] = data
      }
    }

    // 내보내기 감사 로그
    await this.supabase.from('deletion_audit_log').insert({
      user_id: userId,
      action: 'DATA_EXPORTED'
    })

    return exportData
  }

  /**
   * 대량 삭제 (청크 처리로 성능 최적화)
   */
  async batchDeleteByIds(
    table: string,
    ids: string[],
    chunkSize: number = 100
  ): Promise<{ deleted: number; errors: string[] }> {
    let deleted = 0
    const errors: string[] = []

    for (let i = 0; i < ids.length; i += chunkSize) {
      const chunk = ids.slice(i, i + chunkSize)
      
      const { error, count } = await this.supabase
        .from(table)
        .delete()
        .in('id', chunk)

      if (error) {
        errors.push(`청크 ${i / chunkSize}: ${error.message}`)
      } else {
        deleted += count ?? chunk.length
      }
    }

    return { deleted, errors }
  }
}
```

### 4.4 Supabase Edge Function: 자동 삭제 실행

```typescript
// supabase/functions/gdpr-data-cleanup/index.ts
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

interface DeletionResult {
  success: boolean
  timestamp: string
  processed: number
  failed: number
  errors: string[]
}

serve(async (req): Promise<Response> => {
  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    // 1. 삭제 예정일이 지난 사용자 조회
    const { data: pendingDeletions, error: fetchError } = await supabase
      .from('users')
      .select('id, email, clerk_user_id, deletion_scheduled_at')
      .not('deletion_scheduled_at', 'is', null)
      .lte('deletion_scheduled_at', new Date().toISOString())
      .is('deleted_at', null)

    if (fetchError) throw fetchError

    const results: DeletionResult = {
      success: true,
      timestamp: new Date().toISOString(),
      processed: 0,
      failed: 0,
      errors: []
    }

    // 2. 각 사용자에 대해 삭제 처리
    for (const user of pendingDeletions ?? []) {
      try {
        // Clerk 사용자 삭제
        if (user.clerk_user_id) {
          try {
            const clerkRes = await fetch(
              `https://api.clerk.com/v1/users/${user.clerk_user_id}`,
              {
                method: 'DELETE',
                headers: {
                  'Authorization': `Bearer ${Deno.env.get('CLERK_SECRET_KEY')}`,
                  'Content-Type': 'application/json'
                }
              }
            )
            if (!clerkRes.ok) {
              console.warn(`Clerk 삭제 실패: ${user.clerk_user_id}`)
            }
          } catch (clerkError) {
            console.warn(`Clerk API 오류: ${clerkError}`)
          }
        }

        // PostgreSQL 함수로 원자적 삭제 실행
        const { error: deleteError } = await supabase
          .rpc('hard_delete_user', { p_user_id: user.id })

        if (deleteError) {
          results.failed++
          results.errors.push(`사용자 ${user.id}: ${deleteError.message}`)
          
          // 실패 로그 기록
          await supabase.from('deletion_audit_log').insert({
            user_id: user.id,
            action: 'HARD_DELETE_FAILED' as any,
            metadata: { error: deleteError.message }
          })
        } else {
          results.processed++
        }
      } catch (err) {
        results.failed++
        results.errors.push(`사용자 ${user.id}: ${(err as Error).message}`)
      }
    }

    return new Response(
      JSON.stringify(results),
      { headers: { 'Content-Type': 'application/json' } }
    )
  } catch (error) {
    return new Response(
      JSON.stringify({ success: false, error: (error as Error).message }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    )
  }
})
```

### 4.5 삭제 전 알림 발송 Edge Function

```typescript
// supabase/functions/send-deletion-reminders/index.ts
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

serve(async (req): Promise<Response> => {
  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
  )

  const notificationDays = [7, 3, 1]  // 삭제 D-7, D-3, D-1 알림
  const notified: string[] = []

  for (const days of notificationDays) {
    const targetDate = new Date()
    targetDate.setDate(targetDate.getDate() + days)
    const dateStr = targetDate.toISOString().split('T')[0]

    // 해당 일자에 삭제 예정인 사용자 조회
    const { data: users } = await supabase
      .from('users')
      .select('id, email, name, deletion_scheduled_at')
      .gte('deletion_scheduled_at', `${dateStr}T00:00:00`)
      .lte('deletion_scheduled_at', `${dateStr}T23:59:59`)
      .is('deleted_at', null)

    for (const user of users ?? []) {
      try {
        // 이메일 발송 (Resend, SendGrid 등 연동)
        // await sendEmail({
        //   to: user.email,
        //   subject: `[Yiroom] 계정 삭제 ${days}일 전 안내`,
        //   template: 'deletion-reminder',
        //   data: {
        //     name: user.name,
        //     daysRemaining: days,
        //     deletionDate: new Date(user.deletion_scheduled_at).toLocaleDateString('ko-KR'),
        //     cancelUrl: `${Deno.env.get('APP_URL')}/account/cancel-deletion`
        //   }
        // })

        // 알림 발송 로그 기록
        await supabase.from('deletion_audit_log').insert({
          user_id: user.id,
          action: 'NOTIFICATION_SENT',
          metadata: { 
            type: 'deletion_reminder',
            days_before_deletion: days,
            email: user.email
          }
        })

        notified.push(user.id)
      } catch (err) {
        console.error(`알림 발송 실패 (${user.id}):`, err)
      }
    }
  }

  return new Response(
    JSON.stringify({ 
      success: true, 
      notified_count: notified.length,
      notified_users: notified 
    }),
    { headers: { 'Content-Type': 'application/json' } }
  )
})
```

### 4.6 데이터 익명화 함수 (PostgreSQL)

```sql
-- 이메일 익명화 (도메인 유지로 분석 가능)
CREATE OR REPLACE FUNCTION anonymize_email(email TEXT)
RETURNS TEXT AS $$
BEGIN
  RETURN 'anon_' || encode(sha256(email::bytea), 'hex')::TEXT 
         || '@' || split_part(email, '@', 2);
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- 전체 사용자 데이터 익명화 함수
CREATE OR REPLACE FUNCTION anonymize_user_data(p_user_id UUID)
RETURNS void AS $$
BEGIN
  -- 사용자 기본 정보 익명화
  UPDATE users SET
    email = anonymize_email(email),
    name = 'Anonymous User ' || LEFT(encode(sha256(name::bytea), 'hex'), 8),
    clerk_user_id = NULL
  WHERE id = p_user_id;
  
  -- 민감정보 완전 삭제 (익명화 불가)
  DELETE FROM user_body_measurements WHERE user_id = p_user_id;
  DELETE FROM user_skin_analysis WHERE user_id = p_user_id;
  DELETE FROM user_personal_color WHERE user_id = p_user_id;
  
  -- 익명화 감사 로그
  INSERT INTO deletion_audit_log (user_id, action, metadata)
  VALUES (p_user_id, 'DATA_ANONYMIZED', '{"type": "full_anonymization"}');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

---

## 5. 참고 자료

### 공식 법령 및 규정

| 자료명 | URL |
|-------|-----|
| GDPR 전문 (영문) | https://gdpr-info.eu |
| 한국 개인정보보호법 | https://www.law.go.kr |
| GDPR Article 5 (Storage Limitation) | https://gdpr-info.eu/art-5-gdpr/ |
| GDPR Article 7 (Consent) | https://gdpr-info.eu/art-7-gdpr/ |
| GDPR Article 9 (Special Categories) | https://gdpr-info.eu/art-9-gdpr/ |
| GDPR Article 17 (Right to Erasure) | https://gdpr-info.eu/art-17-gdpr/ |

### 규제 기관 가이드라인

| 자료명 | URL |
|-------|-----|
| 개인정보보호위원회 | https://www.pipc.go.kr |
| 개인정보 포털 | https://www.privacy.go.kr |
| EDPB Guidelines 4/2019 (Data Protection by Design) | https://www.edpb.europa.eu |
| ICO Storage Limitation Guide | https://ico.org.uk/for-organisations/uk-gdpr-guidance-and-resources/data-protection-principles/ |
| ICO Right to Erasure | https://ico.org.uk/for-organisations/uk-gdpr-guidance-and-resources/individual-rights/ |
| CNIL Data Retention Guide | https://www.cnil.fr/en/sheet-ndeg14-define-data-retention-period |

### 기술 구현 문서

| 자료명 | URL |
|-------|-----|
| Supabase pg_cron 문서 | https://supabase.com/docs/guides/database/extensions/pg_cron |
| Supabase Edge Functions | https://supabase.com/docs/guides/functions |
| Supabase Vault (보안 시크릿 관리) | https://supabase.com/docs/guides/database/vault |
| PostgreSQL Anonymizer | https://postgresql-anonymizer.readthedocs.io |
| Clerk User Deletion API | https://clerk.com/docs/reference/backend-api |

### 업계 사례 및 비교 분석

| 자료명 | URL |
|-------|-----|
| Google Inactive Account Policy | https://support.google.com/accounts/answer/12418290 |
| Apple Account Terms | https://www.apple.com/legal/internet-services/itunes/ |
| DLA Piper GDPR/PIPA 비교 | https://www.dlapiperdataprotection.com |
| IAPP Korea Data Protection Guide | https://iapp.org |
| DataGuidance South Korea Overview | https://www.dataguidance.com |

---

**문서 작성일:** 2026년 1월 16일  
**적용 대상:** Yiroom 플랫폼 (Next.js 16, React 19, TypeScript, Expo SDK 54, Supabase, Clerk)