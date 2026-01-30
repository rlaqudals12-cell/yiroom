# SEC-7-R1: GDPR 대응

> EU 일반 데이터 보호 규정 준수 전략

## 1. 리서치 배경

### 1.1 GDPR 2025년 업데이트

2025년 EDPB(European Data Protection Board)는 새로운 가이드라인을 발표하여 개인 권리 강화와 데이터 처리자 의무를 명확화했습니다. 절차적 부분의 조화 노력이 진행 중입니다.

### 1.2 주요 벌금 사례

- Meta: €1.2B (2023)
- Amazon: €746M (2021)
- TikTok: €530M (2025)
- 최대 벌금: €20M 또는 전 세계 매출의 4%

### 1.3 리서치 목표

- 9가지 사용자 권리 구현
- 동의 관리 시스템 구축
- 데이터 침해 대응 절차

## 2. GDPR 9가지 사용자 권리

### 2.1 권리 요약

| 권리 | 설명 | 응답 기한 |
|------|------|----------|
| 정보 제공 권리 | 데이터 수집 목적, 방법 고지 | 즉시 |
| 접근 권리 | 보유 데이터 열람 요청 | 30일 |
| 정정 권리 | 잘못된 데이터 수정 요청 | 30일 |
| 삭제 권리 | 데이터 삭제 요청 (잊힐 권리) | 30일 |
| 처리 제한 권리 | 특정 처리 중단 요청 | 30일 |
| 이동 권리 | 데이터 이전/다운로드 | 30일 |
| 반대 권리 | 마케팅 등 특정 처리 거부 | 즉시 |
| 자동화 결정 권리 | 자동 의사결정 거부 | 30일 |
| 동의 철회 권리 | 동의 언제든 철회 | 즉시 |

### 2.2 권리 구현 API

```typescript
// app/api/gdpr/[action]/route.ts
import { auth } from '@clerk/nextjs/server';
import { NextRequest, NextResponse } from 'next/server';

// 데이터 접근 권리 (Right to Access)
export async function GET(
  request: NextRequest,
  { params }: { params: { action: string } }
) {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  switch (params.action) {
    case 'export':
      // 데이터 이동권 (Right to Portability)
      const userData = await exportUserData(userId);
      return new NextResponse(JSON.stringify(userData, null, 2), {
        headers: {
          'Content-Type': 'application/json',
          'Content-Disposition': `attachment; filename="yiroom-data-${userId}.json"`,
        },
      });

    case 'view':
      // 접근권 (Right to Access)
      const data = await getUserDataSummary(userId);
      return NextResponse.json(data);

    default:
      return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
  }
}

// 삭제, 정정, 반대 권리
export async function POST(
  request: NextRequest,
  { params }: { params: { action: string } }
) {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const body = await request.json();

  switch (params.action) {
    case 'delete':
      // 삭제권 (Right to Erasure)
      await deleteAllUserData(userId);
      return NextResponse.json({ success: true, message: '데이터가 삭제되었습니다.' });

    case 'rectify':
      // 정정권 (Right to Rectification)
      await rectifyUserData(userId, body.corrections);
      return NextResponse.json({ success: true });

    case 'object':
      // 반대권 (Right to Object)
      await processObjection(userId, body.processingType);
      return NextResponse.json({ success: true });

    case 'restrict':
      // 처리 제한권 (Right to Restriction)
      await restrictProcessing(userId, body.scope);
      return NextResponse.json({ success: true });

    default:
      return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
  }
}
```

## 3. 동의 관리 시스템 (CMP)

### 3.1 동의 유형 정의

```typescript
// types/consent.ts

export interface ConsentCategory {
  id: string;
  name: string;
  description: string;
  required: boolean;  // 필수 동의 여부
  defaultValue: boolean;
}

export const CONSENT_CATEGORIES: ConsentCategory[] = [
  {
    id: 'essential',
    name: '필수 서비스',
    description: '로그인, 인증 등 서비스 제공에 필수적인 데이터 처리',
    required: true,
    defaultValue: true,
  },
  {
    id: 'analysis',
    name: 'AI 분석',
    description: '피부, 체형, 퍼스널컬러 등 AI 기반 분석 서비스',
    required: false,
    defaultValue: true,
  },
  {
    id: 'personalization',
    name: '개인화 추천',
    description: '분석 결과 기반 제품 추천 및 맞춤 콘텐츠',
    required: false,
    defaultValue: true,
  },
  {
    id: 'analytics',
    name: '서비스 개선',
    description: '익명화된 사용 패턴 분석을 통한 서비스 개선',
    required: false,
    defaultValue: false,
  },
  {
    id: 'marketing',
    name: '마케팅',
    description: '프로모션, 이벤트 등 마케팅 정보 수신',
    required: false,
    defaultValue: false,
  },
];
```

### 3.2 동의 저장 및 관리

```typescript
// lib/consent/consent-manager.ts

interface UserConsent {
  userId: string;
  consents: Record<string, boolean>;
  version: string;  // 개인정보처리방침 버전
  consentedAt: string;
  ipAddress?: string;
  userAgent?: string;
}

export async function saveConsent(
  supabase: SupabaseClient,
  consent: UserConsent
): Promise<void> {
  await supabase
    .from('user_consents')
    .upsert({
      clerk_user_id: consent.userId,
      consents: consent.consents,
      policy_version: consent.version,
      consented_at: consent.consentedAt,
      ip_address: consent.ipAddress,
      user_agent: consent.userAgent,
    });

  // 감사 로그
  await logAudit('consent.updated', {
    userId: consent.userId,
    consents: consent.consents,
    version: consent.version,
  });
}

export async function getConsent(
  supabase: SupabaseClient,
  userId: string
): Promise<UserConsent | null> {
  const { data } = await supabase
    .from('user_consents')
    .select('*')
    .eq('clerk_user_id', userId)
    .single();

  if (!data) return null;

  return {
    userId,
    consents: data.consents,
    version: data.policy_version,
    consentedAt: data.consented_at,
  };
}

export async function withdrawConsent(
  supabase: SupabaseClient,
  userId: string,
  category: string
): Promise<void> {
  const current = await getConsent(supabase, userId);
  if (!current) return;

  const updated = {
    ...current.consents,
    [category]: false,
  };

  await saveConsent(supabase, {
    ...current,
    consents: updated,
    consentedAt: new Date().toISOString(),
  });

  // 관련 데이터 처리 중단
  await stopProcessingForCategory(supabase, userId, category);
}
```

### 3.3 동의 UI 컴포넌트

```tsx
// components/consent/ConsentBanner.tsx
'use client';

import { useState } from 'react';
import { CONSENT_CATEGORIES } from '@/types/consent';

export function ConsentBanner() {
  const [consents, setConsents] = useState<Record<string, boolean>>(
    Object.fromEntries(
      CONSENT_CATEGORIES.map(c => [c.id, c.defaultValue])
    )
  );
  const [showDetails, setShowDetails] = useState(false);

  const handleAcceptAll = async () => {
    const allConsents = Object.fromEntries(
      CONSENT_CATEGORIES.map(c => [c.id, true])
    );
    await saveUserConsent(allConsents);
  };

  const handleAcceptSelected = async () => {
    await saveUserConsent(consents);
  };

  const handleRejectOptional = async () => {
    const minimalConsents = Object.fromEntries(
      CONSENT_CATEGORIES.map(c => [c.id, c.required])
    );
    await saveUserConsent(minimalConsents);
  };

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-white border-t shadow-lg p-6 z-50">
      <div className="max-w-4xl mx-auto">
        <h2 className="text-lg font-bold mb-2">개인정보 처리 동의</h2>
        <p className="text-sm text-gray-600 mb-4">
          이룸은 더 나은 서비스를 위해 개인정보를 수집합니다.
          동의하지 않아도 기본 서비스는 이용 가능합니다.
        </p>

        {showDetails && (
          <div className="space-y-3 mb-4">
            {CONSENT_CATEGORIES.map(category => (
              <label key={category.id} className="flex items-start gap-3">
                <input
                  type="checkbox"
                  checked={consents[category.id]}
                  disabled={category.required}
                  onChange={(e) => setConsents(prev => ({
                    ...prev,
                    [category.id]: e.target.checked
                  }))}
                  className="mt-1"
                />
                <div>
                  <span className="font-medium">
                    {category.name}
                    {category.required && <span className="text-red-500 ml-1">(필수)</span>}
                  </span>
                  <p className="text-sm text-gray-500">{category.description}</p>
                </div>
              </label>
            ))}
          </div>
        )}

        <div className="flex flex-wrap gap-3">
          <button
            onClick={handleAcceptAll}
            className="px-4 py-2 bg-primary text-white rounded-lg"
          >
            모두 동의
          </button>
          <button
            onClick={() => setShowDetails(!showDetails)}
            className="px-4 py-2 border rounded-lg"
          >
            {showDetails ? '간략히' : '상세 설정'}
          </button>
          <button
            onClick={handleRejectOptional}
            className="px-4 py-2 text-gray-600"
          >
            필수만 동의
          </button>
        </div>

        <p className="text-xs text-gray-400 mt-3">
          <a href="/privacy" className="underline">개인정보처리방침</a>에서
          자세한 내용을 확인하실 수 있습니다.
        </p>
      </div>
    </div>
  );
}
```

## 4. 개인정보처리방침

### 4.1 필수 고지 사항

```typescript
// 개인정보처리방침 필수 항목

const PRIVACY_POLICY_REQUIREMENTS = {
  // 1. 수집 정보
  dataCollected: [
    { type: '식별 정보', items: ['이메일', '이름'], purpose: '회원 관리' },
    { type: '생체 정보', items: ['얼굴 이미지', '피부 이미지'], purpose: 'AI 분석' },
    { type: '분석 결과', items: ['피부 타입', '퍼스널컬러'], purpose: '맞춤 추천' },
  ],

  // 2. 처리 목적
  purposes: [
    'AI 기반 피부/체형/퍼스널컬러 분석 서비스 제공',
    '맞춤형 제품 추천',
    '서비스 개선 및 통계 분석',
  ],

  // 3. 법적 근거
  legalBasis: [
    { basis: '동의', scope: '얼굴 이미지 수집 및 분석' },
    { basis: '계약 이행', scope: '분석 결과 제공' },
    { basis: '정당한 이익', scope: '서비스 개선' },
  ],

  // 4. 보존 기간
  retention: [
    { data: '얼굴 이미지', period: '분석 완료 후 30일' },
    { data: '분석 결과', period: '회원 탈퇴 시까지' },
    { data: '로그 데이터', period: '1년' },
  ],

  // 5. 제3자 제공
  thirdParties: [
    { name: 'Google (Gemini)', purpose: 'AI 분석', country: '미국' },
    { name: 'Supabase', purpose: '데이터 저장', country: '미국' },
    { name: 'Clerk', purpose: '인증 서비스', country: '미국' },
  ],

  // 6. 권리 및 행사 방법
  rights: {
    contact: 'privacy@yiroom.app',
    responseTime: '30일 이내',
    supervisoryAuthority: 'KISA (한국인터넷진흥원)',
  },
};
```

## 5. 데이터 침해 대응

### 5.1 침해 대응 절차

```typescript
// lib/gdpr/breach-response.ts

interface DataBreach {
  id: string;
  detectedAt: string;
  type: 'unauthorized_access' | 'data_loss' | 'data_theft' | 'accidental_disclosure';
  severity: 'low' | 'medium' | 'high' | 'critical';
  affectedData: string[];
  affectedUsers: number;
  description: string;
}

// 72시간 내 감독 기관 통보 필수 (고위험 침해)
export async function handleDataBreach(breach: DataBreach): Promise<void> {
  const now = new Date();

  // 1. 즉시 기록
  await logBreachIncident(breach);

  // 2. 위험도 평가
  const riskAssessment = assessBreachRisk(breach);

  // 3. 감독 기관 통보 (72시간 내)
  if (riskAssessment.requiresNotification) {
    await notifySupervisoryAuthority({
      ...breach,
      riskAssessment,
      notificationDeadline: new Date(now.getTime() + 72 * 60 * 60 * 1000),
    });
  }

  // 4. 사용자 통보 (고위험인 경우)
  if (riskAssessment.requiresUserNotification) {
    await notifyAffectedUsers(breach);
  }

  // 5. 완화 조치
  await implementMitigationMeasures(breach);
}

function assessBreachRisk(breach: DataBreach): RiskAssessment {
  // 위험도 매트릭스
  const hasSpecialCategory = breach.affectedData.some(d =>
    ['facial_image', 'health_data'].includes(d)
  );

  const largeScale = breach.affectedUsers > 1000;

  return {
    level: hasSpecialCategory || largeScale ? 'high' : 'medium',
    requiresNotification: true,  // 대부분의 침해는 통보 필요
    requiresUserNotification: hasSpecialCategory || breach.severity === 'critical',
    reasoning: `특수 카테고리 데이터: ${hasSpecialCategory}, 대규모: ${largeScale}`,
  };
}
```

### 5.2 감독 기관 통보 템플릿

```typescript
// 72시간 내 감독 기관 통보 내용

interface SupervisoryNotification {
  // 필수 정보
  nature: string;              // 침해 성격
  categories: string[];        // 영향받는 데이터 유형
  approximateNumber: number;   // 영향받는 사용자 수
  consequences: string;        // 예상되는 결과
  measures: string[];          // 취한/계획된 조치

  // 연락처
  dpoContact: {
    name: string;
    email: string;
    phone: string;
  };
}

const NOTIFICATION_TEMPLATE: SupervisoryNotification = {
  nature: '외부 공격자에 의한 데이터베이스 무단 접근',
  categories: ['이메일', '이름', '피부 분석 결과'],
  approximateNumber: 1500,
  consequences: '개인 정보 노출로 인한 프라이버시 침해 가능성',
  measures: [
    '영향받는 시스템 격리',
    '비밀번호 강제 재설정',
    '추가 보안 모니터링 강화',
    '영향받는 사용자 개별 통보',
  ],
  dpoContact: {
    name: 'DPO 담당자',
    email: 'dpo@yiroom.app',
    phone: '+82-2-xxxx-xxxx',
  },
};
```

## 6. DPIA (데이터 보호 영향 평가)

### 6.1 DPIA 필요 조건

```typescript
// AI 분석 서비스는 DPIA 필수

const DPIA_TRIGGERS = [
  '대규모 특수 카테고리 데이터 처리',       // 얼굴 이미지 = 생체 데이터
  '프로파일링 기반 자동화된 의사결정',      // AI 분석 결과
  '민감한 데이터의 체계적 모니터링',        // 사용 패턴 분석
];

interface DPIAReport {
  projectName: string;
  description: string;
  necessity: string;
  risks: DPIARisk[];
  mitigations: DPIAMitigation[];
  dpoOpinion: string;
  approvalDate: string;
}
```

### 6.2 AI 분석 서비스 DPIA

```typescript
const YIROOM_DPIA: DPIAReport = {
  projectName: '이룸 AI 피부/퍼스널컬러 분석 서비스',
  description: '사용자 얼굴 이미지를 AI로 분석하여 피부 타입, 퍼스널컬러 등을 도출',

  necessity: `
    - 목적: 맞춤형 뷰티 추천을 위한 개인화 분석
    - 대안 검토: 설문 기반 분석은 정확도 낮음
    - 비례성: 최소한의 이미지만 수집, 분석 후 자동 삭제
  `,

  risks: [
    {
      risk: '얼굴 이미지 유출',
      likelihood: 'low',
      impact: 'high',
      overall: 'medium',
    },
    {
      risk: '분석 결과 오용 (차별 등)',
      likelihood: 'very_low',
      impact: 'medium',
      overall: 'low',
    },
    {
      risk: 'AI 편향으로 인한 부정확한 결과',
      likelihood: 'medium',
      impact: 'low',
      overall: 'low',
    },
  ],

  mitigations: [
    {
      risk: '얼굴 이미지 유출',
      measure: '암호화 저장, 30일 자동 삭제, 접근 로깅',
      residualRisk: 'low',
    },
    {
      risk: 'AI 편향',
      measure: '다양한 피부톤 데이터셋 학습, 정기적 편향 테스트',
      residualRisk: 'very_low',
    },
  ],

  dpoOpinion: '적절한 완화 조치 적용 시 처리 진행 가능',
  approvalDate: '2026-01-15',
};
```

## 7. 구현 체크리스트

### 7.1 P0 (필수 구현)

- [ ] 개인정보처리방침 페이지
- [ ] 동의 수집 및 저장
- [ ] 데이터 삭제 API (잊힐 권리)
- [ ] 데이터 내보내기 API (이동권)

### 7.2 P1 (권장 구현)

- [ ] 동의 관리 대시보드 (사용자용)
- [ ] 동의 철회 기능
- [ ] 처리 제한 기능
- [ ] 침해 대응 절차 문서화

### 7.3 P2 (고급 구현)

- [ ] DPIA 문서 작성
- [ ] 자동화된 침해 감지
- [ ] 정기적 GDPR 감사
- [ ] DPO 연락 채널

## 8. 참고 자료

- [GDPR 공식 텍스트](https://gdpr-info.eu/)
- [EDPB Guidelines](https://edpb.europa.eu/our-work-tools/general-guidance_en)
- [GDPR Compliance for Apps](https://gdprlocal.com/gdpr-compliance-for-apps/)

---

**Version**: 1.0 | **Created**: 2026-01-19
**Category**: 보안 심화 | **Priority**: P0
