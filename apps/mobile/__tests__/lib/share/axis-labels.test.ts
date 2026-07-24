/**
 * 5축 원시값 해석 계약 테스트 — pick/nestedTone/toKoLabel + enum ko 맵
 * (card-data에서 공용화한 계약: 미지 영문 null·비ASCII 통과·양형태 해석)
 */
import {
  cleanValue,
  pick,
  nestedTone,
  toKoLabel,
  SKIN_TYPE_KO,
  BODY_TYPE_KO,
  FACE_SHAPE_KO,
  UNDERTONE_KO,
} from '../../../lib/share/axis-labels';

describe('cleanValue', () => {
  it('비어있지 않은 문자열만 통과하고 placeholder는 거른다', () => {
    expect(cleanValue('muted-summer')).toBe('muted-summer');
    expect(cleanValue('  oily  ')).toBe('oily');
    expect(cleanValue('-')).toBeNull();
    expect(cleanValue('')).toBeNull();
    expect(cleanValue('   ')).toBeNull();
  });

  it('문자열이 아니면 null (숫자/객체/undefined 방어)', () => {
    expect(cleanValue(82)).toBeNull();
    expect(cleanValue({ tone: 'x' })).toBeNull();
    expect(cleanValue(null)).toBeNull();
    expect(cleanValue(undefined)).toBeNull();
  });
});

describe('pick', () => {
  it('camelCase(payload)를 우선하고 snake_case(raw row)로 폴백한다', () => {
    expect(pick({ skinType: 'dry', skin_type: 'oily' }, 'skinType', 'skin_type')).toBe('dry');
    expect(pick({ skin_type: 'oily' }, 'skinType', 'skin_type')).toBe('oily');
  });

  it('camel이 placeholder면 snake로 폴백하고, 데이터가 없으면 null', () => {
    expect(pick({ skinType: '-', skin_type: 'oily' }, 'skinType', 'skin_type')).toBe('oily');
    expect(pick({}, 'skinType', 'skin_type')).toBeNull();
    expect(pick(null, 'skinType', 'skin_type')).toBeNull();
  });
});

describe('nestedTone', () => {
  it('raw row의 image_analysis.tone JSONB에서 12톤을 추출한다', () => {
    expect(nestedTone({ image_analysis: { tone: 'muted-summer' } })).toBe('muted-summer');
  });

  it('image_analysis가 없거나 형태가 다르면 null', () => {
    expect(nestedTone({})).toBeNull();
    expect(nestedTone(null)).toBeNull();
    expect(nestedTone({ image_analysis: 'broken' })).toBeNull();
    expect(nestedTone({ image_analysis: { tone: '-' } })).toBeNull();
  });
});

describe('toKoLabel', () => {
  it('영문 enum을 ko 라벨로 해석한다', () => {
    expect(toKoLabel('combination', SKIN_TYPE_KO)).toBe('복합성');
    expect(toKoLabel('S', BODY_TYPE_KO)).toBe('스트레이트');
    expect(toKoLabel('oval', FACE_SHAPE_KO)).toBe('계란형');
    expect(toKoLabel('cool', UNDERTONE_KO)).toBe('쿨톤');
  });

  it('미지의 영문값은 null (원시 영문 노출 금지)', () => {
    expect(toKoLabel('mystery-type', SKIN_TYPE_KO)).toBeNull();
    expect(toKoLabel('X', BODY_TYPE_KO)).toBeNull();
  });

  it('비ASCII(이미 한글)면 그대로 통과, null 입력은 null', () => {
    expect(toKoLabel('복합성', SKIN_TYPE_KO)).toBe('복합성');
    expect(toKoLabel(null, SKIN_TYPE_KO)).toBeNull();
  });
});

describe('UNDERTONE_KO (정본 = 웹 labels.ts UNDERTONE ko)', () => {
  it('warm/cool/neutral 3값을 웹 표기 그대로 가진다', () => {
    expect(UNDERTONE_KO).toEqual({ warm: '웜톤', cool: '쿨톤', neutral: '뉴트럴' });
  });
});
