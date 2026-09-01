'use client';

import { useCallback, useEffect, useState } from 'react';
import { ShieldCheck } from 'lucide-react';

type SafetyProfileResponse = {
  success?: boolean;
  data?: {
    conditions?: string[];
    medications?: string[];
    consentGiven?: boolean;
  };
  error?: { userMessage?: string };
};

interface SkinSafetyScreeningProps {
  onComplete: () => void;
}

const CONDITION_KEYS = new Set([
  'pregnancy',
  'pregnant',
  'breastfeeding',
  'lactation',
  'pregnancy_or_breastfeeding',
]);
const MEDICATION_KEYS = new Set(['isotretinoin', 'accutane', 'roaccutane']);

function hasAny(values: string[] | undefined, keys: Set<string>): boolean {
  return (values ?? []).some((value) => keys.has(value.trim().toLowerCase()));
}

function withoutKeys(values: string[] | undefined, keys: Set<string>): string[] {
  return (values ?? []).filter((value) => !keys.has(value.trim().toLowerCase()));
}

export function SkinSafetyScreening({ onComplete }: SkinSafetyScreeningProps) {
  const [pregnancyOrBreastfeeding, setPregnancyOrBreastfeeding] = useState<boolean | null>(null);
  const [isotretinoin, setIsotretinoin] = useState<boolean | null>(null);
  const [consented, setConsented] = useState(false);
  const [existingConditions, setExistingConditions] = useState<string[]>([]);
  const [existingMedications, setExistingMedications] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    async function loadProfile() {
      try {
        const response = await fetch('/api/safety/profile');
        if (!response.ok) return;
        const json = (await response.json()) as SafetyProfileResponse;
        if (cancelled || !json.data) return;
        const conditions = json.data.conditions ?? [];
        const medications = json.data.medications ?? [];
        setExistingConditions(conditions);
        setExistingMedications(medications);
        if (json.data.consentGiven) {
          setConsented(true);
          setPregnancyOrBreastfeeding(hasAny(conditions, CONDITION_KEYS));
          setIsotretinoin(hasAny(medications, MEDICATION_KEYS));
        }
      } catch {
        // 조회 실패 시 빈 선택 상태를 유지한다. 사용자는 저장 없이 건너뛸 수 있다.
      }
    }
    void loadProfile();
    return () => {
      cancelled = true;
    };
  }, []);

  const handleSave = useCallback(async () => {
    if (!consented) {
      setError('민감정보 수집·이용 동의 후 저장하거나 나중에 입력해주세요.');
      return;
    }
    if (pregnancyOrBreastfeeding === null || isotretinoin === null) {
      setError('두 안전 문항에 모두 답해주세요.');
      return;
    }

    setLoading(true);
    setError(null);
    const conditions = withoutKeys(existingConditions, CONDITION_KEYS);
    const medications = withoutKeys(existingMedications, MEDICATION_KEYS);
    // 왜: 결합 질문의 답을 임신과 수유가 모두 사실인 것처럼 두 값으로 저장하지 않는다.
    if (pregnancyOrBreastfeeding) conditions.push('pregnancy_or_breastfeeding');
    if (isotretinoin) medications.push('isotretinoin');

    try {
      const response = await fetch('/api/safety/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          conditions,
          medications,
          consentGiven: true,
          consentVersion: '1.0',
        }),
      });
      const json = (await response.json()) as SafetyProfileResponse;
      if (!response.ok || json.success !== true) {
        throw new Error(json.error?.userMessage ?? '안전 문진을 저장할 수 없어요.');
      }
      onComplete();
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : '안전 문진을 저장할 수 없어요.');
    } finally {
      setLoading(false);
    }
  }, [
    consented,
    existingConditions,
    existingMedications,
    isotretinoin,
    onComplete,
    pregnancyOrBreastfeeding,
  ]);

  return (
    <section
      className="rounded-2xl border border-border bg-card p-5 shadow-[var(--shadow-card)]"
      data-testid="skin-safety-screening"
    >
      <div className="mb-5 flex items-start gap-3">
        <ShieldCheck className="mt-0.5 h-5 w-5 shrink-0 text-foreground" aria-hidden="true" />
        <div>
          <h2 className="font-serif text-xl text-foreground">먼저 안전 상태를 확인할게요</h2>
          <p className="mt-1 text-sm leading-relaxed text-muted-foreground">
            안전한 루틴을 위해 임신·수유와 복용 약을 확인해요. 입력하지 않으면 레티노이드 일정은
            제안하지 않아요.
          </p>
        </div>
      </div>

      <SafetyQuestion
        label="현재 임신 중이거나 수유 중인가요?"
        value={pregnancyOrBreastfeeding}
        onChange={setPregnancyOrBreastfeeding}
        testId="pregnancy-breastfeeding-question"
      />
      <SafetyQuestion
        label="현재 이소트레티노인을 복용 중인가요?"
        value={isotretinoin}
        onChange={setIsotretinoin}
        testId="isotretinoin-question"
      />

      <label className="mt-4 flex cursor-pointer items-start gap-2 text-sm text-foreground">
        <input
          type="checkbox"
          checked={consented}
          onChange={(event) => setConsented(event.target.checked)}
          className="mt-0.5 h-4 w-4 accent-foreground"
        />
        <span>
          건강 정보 수집·이용에 동의합니다 <span className="text-muted-foreground">(선택)</span>
          <span className="mt-1 block text-xs text-muted-foreground">
            선택한 정보는 암호화해 루틴·제품 안전 확인에만 사용해요.
          </span>
        </span>
      </label>

      {error && (
        <p className="mt-3 text-sm text-destructive" role="alert">
          {error}
        </p>
      )}

      <div className="mt-5 space-y-2">
        <button
          type="button"
          onClick={() => void handleSave()}
          disabled={loading}
          className="w-full rounded-xl bg-primary px-4 py-3 text-sm font-medium text-primary-foreground disabled:opacity-50"
        >
          {loading ? '저장 중...' : '동의하고 계속'}
        </button>
        <button
          type="button"
          onClick={onComplete}
          disabled={loading}
          className="w-full rounded-xl border border-border px-4 py-3 text-sm text-foreground disabled:opacity-50"
        >
          나중에 입력
        </button>
      </div>

      <p className="mt-4 text-xs leading-relaxed text-muted-foreground">
        이 안내는 의료 조언이 아닌 일반 참고 정보예요. 복용 중인 약이 있다면 전문 의료인과
        상의해주세요.
      </p>
    </section>
  );
}

function SafetyQuestion({
  label,
  value,
  onChange,
  testId,
}: {
  label: string;
  value: boolean | null;
  onChange: (value: boolean) => void;
  testId: string;
}) {
  return (
    <fieldset className="border-t border-border py-4" data-testid={testId}>
      <legend className="mb-3 w-full pt-4 text-sm font-medium text-foreground">{label}</legend>
      <div className="grid grid-cols-2 gap-2">
        {[
          { answer: true, label: '네' },
          { answer: false, label: '아니요' },
        ].map((option) => (
          <button
            key={option.label}
            type="button"
            aria-pressed={value === option.answer}
            onClick={() => onChange(option.answer)}
            className={`min-h-11 rounded-xl border px-4 text-sm ${
              value === option.answer
                ? 'border-foreground bg-muted font-medium text-foreground'
                : 'border-border text-muted-foreground'
            }`}
          >
            {option.label}
          </button>
        ))}
      </div>
    </fieldset>
  );
}
