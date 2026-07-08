'use client';

/**
 * 통합 분석 자가입력 폼
 *
 * @see docs/specs/SDD-INTEGRATED-RESULT-UI.md §2.4
 */

import { useState, useCallback, useEffect } from 'react';
import type {
  SkinQuestionnaire,
  HairQuestionnaire,
  BodyQuestionnaire,
  RecommendationGender,
  RecommendationSituation,
} from '@/lib/analysis/integrated';

export interface QuestionnaireData {
  skin: SkinQuestionnaire;
  hair: HairQuestionnaire;
  body: BodyQuestionnaire;
  /** 성별 (추천 분기 전용, 선택) — 분석 판정엔 미주입 */
  gender?: RecommendationGender;
  /** 상황/TPO (선택) */
  situation?: RecommendationSituation;
}

export interface QuestionnaireFormProps {
  onChange: (data: QuestionnaireData) => void;
  showBodyFields: boolean; // 전신 사진 없으면 true
  /** 온보딩에서 저장된 성별 기본값 (있으면 미리 선택) */
  defaultGender?: RecommendationGender;
}

const GENDER_OPTIONS: Array<{ value: RecommendationGender; label: string }> = [
  { value: 'female', label: '여성' },
  { value: 'male', label: '남성' },
  { value: 'neutral', label: '선택 안 함' },
];

const SITUATION_OPTIONS: Array<{ value: RecommendationSituation; label: string }> = [
  { value: 'daily', label: '일상' },
  { value: 'date', label: '소개팅' },
  { value: 'interview', label: '면접' },
  { value: 'party', label: '모임' },
  { value: 'travel', label: '여행' },
];

const SKIN_TYPES: Array<{ value: SkinQuestionnaire['selfReportedType']; label: string }> = [
  { value: 'dry', label: '건성' },
  { value: 'oily', label: '지성' },
  { value: 'combination', label: '복합성' },
  { value: 'normal', label: '중성' },
  { value: 'sensitive', label: '민감성' },
  { value: 'unknown', label: '잘 모르겠어요' },
];

const HAIR_LENGTHS: Array<{ value: NonNullable<HairQuestionnaire['length']>; label: string }> = [
  { value: 'very_short', label: '매우 짧음' },
  { value: 'short', label: '짧음' },
  { value: 'medium', label: '중간' },
  { value: 'long', label: '긴 편' },
  { value: 'very_long', label: '매우 김' },
];

const HAIR_DENSITY: Array<{ value: NonNullable<HairQuestionnaire['density']>; label: string }> = [
  { value: 'thin', label: '적음' },
  { value: 'medium', label: '보통' },
  { value: 'thick', label: '많음' },
];

const HAIR_CURL: Array<{ value: NonNullable<HairQuestionnaire['curlType']>; label: string }> = [
  { value: 'straight', label: '직모' },
  { value: 'wavy', label: '살짝 웨이브' },
  { value: 'curly', label: '곱슬' },
  { value: 'coily', label: '심한 곱슬' },
];

export function QuestionnaireForm({
  onChange,
  showBodyFields,
  defaultGender,
}: QuestionnaireFormProps): React.JSX.Element {
  const [gender, setGender] = useState<RecommendationGender | undefined>(defaultGender);
  const [situation, setSituation] = useState<RecommendationSituation | undefined>();
  const [skinType, setSkinType] = useState<SkinQuestionnaire['selfReportedType']>('unknown');
  const [hairLength, setHairLength] = useState<HairQuestionnaire['length']>();
  const [hairDensity, setHairDensity] = useState<HairQuestionnaire['density']>();
  const [hairCurl, setHairCurl] = useState<HairQuestionnaire['curlType']>();
  const [heightCm, setHeightCm] = useState<number | ''>('');
  const [weightKg, setWeightKg] = useState<number | ''>('');
  const [shoulderCm, setShoulderCm] = useState<number | ''>('');
  const [waistCm, setWaistCm] = useState<number | ''>('');

  const emitChange = useCallback(() => {
    const data: QuestionnaireData = {
      skin: { selfReportedType: skinType, concerns: [] },
      hair: {
        length: hairLength,
        density: hairDensity,
        curlType: hairCurl,
      },
      body: {
        heightCm: heightCm === '' ? undefined : heightCm,
        weightKg: weightKg === '' ? undefined : weightKg,
        shoulderWidthCm: shoulderCm === '' ? undefined : shoulderCm,
        waistCm: waistCm === '' ? undefined : waistCm,
      },
      gender,
      situation,
    };
    onChange(data);
  }, [
    gender,
    situation,
    skinType,
    hairLength,
    hairDensity,
    hairCurl,
    heightCm,
    weightKg,
    shoulderCm,
    waistCm,
    onChange,
  ]);

  // 왜: 입력 변경 시마다 부모에 전달 (제출 전 검증을 위해)
  useEffect(() => {
    emitChange();
  }, [emitChange]);

  return (
    <div className="space-y-6" data-testid="integrated-questionnaire">
      {/* 성별 + 상황 (추천 분기용 — 분석 판정엔 영향 없음) */}
      <fieldset data-testid="recommendation-context">
        <legend className="mb-3 text-sm font-semibold text-white">
          추천 맞춤 <span className="text-zinc-500">(선택)</span>
        </legend>
        <div className="space-y-3">
          <div>
            <p className="mb-2 text-xs text-zinc-400">성별 (추천 제안에만 사용해요)</p>
            <div className="flex flex-wrap gap-2">
              {GENDER_OPTIONS.map((opt) => (
                <button
                  key={opt.value}
                  type="button"
                  aria-pressed={gender === opt.value}
                  onClick={() => setGender(gender === opt.value ? undefined : opt.value)}
                  className={`rounded-full border px-4 py-2 text-sm transition-colors ${
                    gender === opt.value
                      ? 'border-pink-500 bg-pink-500/20 text-pink-300'
                      : 'border-zinc-700 bg-neutral-900 text-zinc-300 hover:border-pink-500/50'
                  }`}
                  data-testid={`gender-option-${opt.value}`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>
          <div>
            <p className="mb-2 text-xs text-zinc-400">어떤 상황을 준비하나요?</p>
            <div className="flex flex-wrap gap-2">
              {SITUATION_OPTIONS.map((opt) => (
                <button
                  key={opt.value}
                  type="button"
                  aria-pressed={situation === opt.value}
                  onClick={() => setSituation(situation === opt.value ? undefined : opt.value)}
                  className={`rounded-full border px-3 py-1.5 text-xs transition-colors ${
                    situation === opt.value
                      ? 'border-violet-500 bg-violet-500/20 text-violet-300'
                      : 'border-zinc-700 bg-neutral-900 text-zinc-400 hover:border-violet-500/50'
                  }`}
                  data-testid={`situation-option-${opt.value}`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>
        </div>
      </fieldset>

      {/* 피부 타입 (1문항) */}
      <fieldset>
        <legend className="mb-3 text-sm font-semibold text-white">피부 타입</legend>
        <div className="flex flex-wrap gap-2">
          {SKIN_TYPES.map((opt) => (
            <button
              key={opt.value}
              type="button"
              onClick={() => setSkinType(opt.value)}
              className={`rounded-full border px-4 py-2 text-sm transition-colors ${
                skinType === opt.value
                  ? 'border-pink-500 bg-pink-500/20 text-pink-300'
                  : 'border-zinc-700 bg-neutral-900 text-zinc-300 hover:border-pink-500/50'
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </fieldset>

      {/* 헤어 (3문항, 모두 선택) */}
      <fieldset>
        <legend className="mb-3 text-sm font-semibold text-white">헤어 정보 (선택)</legend>
        <div className="space-y-3">
          <div>
            <p className="mb-2 text-xs text-zinc-400">머리 길이</p>
            <div className="flex flex-wrap gap-2">
              {HAIR_LENGTHS.map((opt) => (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => setHairLength(hairLength === opt.value ? undefined : opt.value)}
                  className={`rounded-full border px-3 py-1.5 text-xs transition-colors ${
                    hairLength === opt.value
                      ? 'border-violet-500 bg-violet-500/20 text-violet-300'
                      : 'border-zinc-700 bg-neutral-900 text-zinc-400 hover:border-violet-500/50'
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>
          <div>
            <p className="mb-2 text-xs text-zinc-400">머리숱</p>
            <div className="flex flex-wrap gap-2">
              {HAIR_DENSITY.map((opt) => (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => setHairDensity(hairDensity === opt.value ? undefined : opt.value)}
                  className={`rounded-full border px-3 py-1.5 text-xs transition-colors ${
                    hairDensity === opt.value
                      ? 'border-violet-500 bg-violet-500/20 text-violet-300'
                      : 'border-zinc-700 bg-neutral-900 text-zinc-400 hover:border-violet-500/50'
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>
          <div>
            <p className="mb-2 text-xs text-zinc-400">곱슬기</p>
            <div className="flex flex-wrap gap-2">
              {HAIR_CURL.map((opt) => (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => setHairCurl(hairCurl === opt.value ? undefined : opt.value)}
                  className={`rounded-full border px-3 py-1.5 text-xs transition-colors ${
                    hairCurl === opt.value
                      ? 'border-violet-500 bg-violet-500/20 text-violet-300'
                      : 'border-zinc-700 bg-neutral-900 text-zinc-400 hover:border-violet-500/50'
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>
        </div>
      </fieldset>

      {/* 체형 (전신 사진 없을 때만 표시) */}
      {showBodyFields && (
        <fieldset>
          <legend className="mb-3 text-sm font-semibold text-white">
            신체 정보 <span className="text-zinc-500">(전신 사진 대신)</span>
          </legend>
          <div className="grid grid-cols-2 gap-3">
            <NumberInput
              label="키 (cm)"
              value={heightCm}
              min={100}
              max={220}
              onChange={setHeightCm}
            />
            <NumberInput
              label="몸무게 (kg)"
              value={weightKg}
              min={30}
              max={200}
              onChange={setWeightKg}
            />
            <NumberInput
              label="어깨 너비 (cm)"
              value={shoulderCm}
              min={25}
              max={60}
              onChange={setShoulderCm}
            />
            <NumberInput
              label="허리 (cm)"
              value={waistCm}
              min={40}
              max={150}
              onChange={setWaistCm}
            />
          </div>
          <p className="mt-2 text-xs text-zinc-500">
            * 키만 입력해도 분석 가능해요. 정확도가 올라갈수록 세부 입력 추천.
          </p>
        </fieldset>
      )}

      {/* 전신 사진 업로드 시 신체 정보 입력란이 숨겨지는 이유 안내 (QA #4) */}
      {!showBodyFields && (
        <p className="text-xs text-zinc-500">
          전신 사진으로 체형을 자동 분석해요. 수동 입력은 필요 없어요.
        </p>
      )}
    </div>
  );
}

interface NumberInputProps {
  label: string;
  value: number | '';
  min: number;
  max: number;
  onChange: (v: number | '') => void;
}

function NumberInput({ label, value, min, max, onChange }: NumberInputProps): React.JSX.Element {
  return (
    <label className="flex flex-col gap-1">
      <span className="text-xs text-zinc-400">{label}</span>
      <input
        type="number"
        inputMode="numeric"
        min={min}
        max={max}
        value={value}
        onChange={(e) => {
          const raw = e.target.value;
          if (raw === '') return onChange('');
          const n = Number(raw);
          // 상한 초과 오타(예: 어깨너비 5093284)·음수 즉시 차단 — 서버 zod 거부로 통합분석 전체가 실패하던 버그 방지
          if (Number.isFinite(n) && n >= 0) onChange(Math.min(n, max));
        }}
        onBlur={() => {
          // 하한 미만은 blur 시 보정(타이핑 중 "1"→"100" 방해 방지). 상한/음수는 onChange에서 이미 처리
          if (value !== '' && value < min) onChange(min);
        }}
        className="rounded-lg border border-zinc-700 bg-neutral-900 px-3 py-2 text-sm text-white placeholder:text-zinc-500 focus:border-pink-500 focus:outline-none"
      />
    </label>
  );
}
