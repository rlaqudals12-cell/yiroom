/**
 * 접근성 유틸리티 테스트
 */

import {
  buttonA11y,
  linkA11y,
  imageA11y,
  headerA11y,
  checkboxA11y,
  switchA11y,
  sliderA11y,
  progressA11y,
  tabA11y,
  listItemA11y,
  getContrastRatio,
  meetsWcagAA,
  meetsWcagAAA,
} from '../../lib/a11y';

describe('buttonA11y', () => {
  it('버튼 접근성 속성을 반환해야 함', () => {
    const props = buttonA11y('제출하기', '양식을 제출합니다');

    expect(props).toEqual({
      accessible: true,
      accessibilityLabel: '제출하기',
      accessibilityHint: '양식을 제출합니다',
      accessibilityRole: 'button',
      accessibilityState: { disabled: undefined },
    });
  });

  it('비활성화 상태를 포함해야 함', () => {
    const props = buttonA11y('제출하기', undefined, true);

    expect(props.accessibilityState).toEqual({ disabled: true });
  });
});

describe('linkA11y', () => {
  it('링크 접근성 속성을 반환해야 함', () => {
    const props = linkA11y('홈으로 이동');

    expect(props).toEqual({
      accessible: true,
      accessibilityLabel: '홈으로 이동',
      accessibilityHint: '탭하여 이동',
      accessibilityRole: 'link',
    });
  });

  it('커스텀 힌트를 적용해야 함', () => {
    const props = linkA11y('외부 링크', '새 창에서 열림');

    expect(props.accessibilityHint).toBe('새 창에서 열림');
  });
});

describe('imageA11y', () => {
  it('이미지 접근성 속성을 반환해야 함', () => {
    const props = imageA11y('프로필 사진');

    expect(props).toEqual({
      accessible: true,
      accessibilityLabel: '프로필 사진',
      accessibilityRole: 'image',
    });
  });
});

describe('headerA11y', () => {
  it('헤더 접근성 속성을 반환해야 함', () => {
    const props = headerA11y('설정');

    expect(props).toEqual({
      accessible: true,
      accessibilityLabel: '설정',
      accessibilityRole: 'header',
    });
  });
});

describe('checkboxA11y', () => {
  it('체크박스 접근성 속성을 반환해야 함 (선택됨)', () => {
    const props = checkboxA11y('알림 수신', true);

    expect(props).toEqual({
      accessible: true,
      accessibilityLabel: '알림 수신',
      accessibilityHint: '선택됨, 탭하여 해제',
      accessibilityRole: 'checkbox',
      accessibilityState: { checked: true },
    });
  });

  it('체크박스 접근성 속성을 반환해야 함 (선택 안됨)', () => {
    const props = checkboxA11y('알림 수신', false);

    expect(props.accessibilityHint).toBe('선택 안됨, 탭하여 선택');
    expect(props.accessibilityState).toEqual({ checked: false });
  });
});

describe('switchA11y', () => {
  it('스위치 접근성 속성을 반환해야 함', () => {
    const propsOn = switchA11y('다크 모드', true);
    const propsOff = switchA11y('다크 모드', false);

    expect(propsOn.accessibilityHint).toBe('켜짐, 탭하여 끄기');
    expect(propsOff.accessibilityHint).toBe('꺼짐, 탭하여 켜기');
    expect(propsOn.accessibilityRole).toBe('switch');
  });
});

describe('sliderA11y', () => {
  it('슬라이더 접근성 속성을 반환해야 함', () => {
    const props = sliderA11y('볼륨', 50, 0, 100, '%');

    expect(props).toEqual({
      accessible: true,
      accessibilityLabel: '볼륨',
      accessibilityRole: 'adjustable',
      accessibilityValue: {
        min: 0,
        max: 100,
        now: 50,
        text: '50%',
      },
    });
  });

  it('단위 없이도 동작해야 함', () => {
    const props = sliderA11y('밝기', 75, 0, 100);

    expect(props.accessibilityValue?.text).toBe('75');
  });
});

describe('progressA11y', () => {
  it('프로그레스 접근성 속성을 반환해야 함', () => {
    const props = progressA11y('다운로드', 50, 100);

    expect(props).toEqual({
      accessible: true,
      accessibilityLabel: '다운로드, 50% 완료',
      accessibilityRole: 'progressbar',
      accessibilityValue: {
        min: 0,
        max: 100,
        now: 50,
        text: '50%',
      },
    });
  });

  it('기본 max 값(100)을 사용해야 함', () => {
    const props = progressA11y('업로드', 25);

    expect(props.accessibilityLabel).toBe('업로드, 25% 완료');
  });
});

describe('tabA11y', () => {
  it('탭 접근성 속성을 반환해야 함', () => {
    const props = tabA11y('홈', true, 0, 4);

    expect(props).toEqual({
      accessible: true,
      accessibilityLabel: '홈, 1/4 탭',
      accessibilityHint: '현재 선택됨',
      accessibilityRole: 'tab',
      accessibilityState: { selected: true },
    });
  });

  it('선택되지 않은 탭 힌트를 제공해야 함', () => {
    const props = tabA11y('설정', false, 3, 4);

    expect(props.accessibilityLabel).toBe('설정, 4/4 탭');
    expect(props.accessibilityHint).toBe('탭하여 선택');
  });
});

describe('listItemA11y', () => {
  it('리스트 아이템 접근성 속성을 반환해야 함', () => {
    const props = listItemA11y('사과', 0, 5, '탭하여 상세 보기');

    expect(props).toEqual({
      accessible: true,
      accessibilityLabel: '사과, 1/5',
      accessibilityHint: '탭하여 상세 보기',
      accessibilityRole: 'none',
    });
  });
});

describe('getContrastRatio', () => {
  it('흑백 대비율을 계산해야 함', () => {
    const ratio = getContrastRatio('#000000', '#FFFFFF');
    expect(ratio).toBeCloseTo(21, 0); // 21:1 (최대 대비)
  });

  it('동일 색상 대비율은 1이어야 함', () => {
    const ratio = getContrastRatio('#FFFFFF', '#FFFFFF');
    expect(ratio).toBeCloseTo(1, 0);
  });

  it('유효하지 않은 색상은 0을 반환해야 함', () => {
    const ratio = getContrastRatio('invalid', '#FFFFFF');
    expect(ratio).toBe(0);
  });

  it('일반적인 색상 대비율을 계산해야 함', () => {
    // 파란색 배경에 흰색 텍스트
    const ratio = getContrastRatio('#FFFFFF', '#2E5AFA');
    expect(ratio).toBeGreaterThan(4); // AA 기준 충족
  });
});

describe('meetsWcagAA', () => {
  it('일반 텍스트 기준 (4.5:1)을 검사해야 함', () => {
    expect(meetsWcagAA('#000000', '#FFFFFF')).toBe(true); // 21:1
    expect(meetsWcagAA('#767676', '#FFFFFF')).toBe(true); // ~4.5:1
    expect(meetsWcagAA('#777777', '#FFFFFF')).toBe(false); // ~4.48:1
  });

  it('큰 텍스트 기준 (3:1)을 검사해야 함', () => {
    expect(meetsWcagAA('#767676', '#FFFFFF', true)).toBe(true); // ~4.5:1 > 3:1
    expect(meetsWcagAA('#808080', '#FFFFFF', true)).toBe(true); // ~3.9:1 > 3:1
  });
});

describe('meetsWcagAAA', () => {
  it('일반 텍스트 기준 (7:1)을 검사해야 함', () => {
    expect(meetsWcagAAA('#000000', '#FFFFFF')).toBe(true); // 21:1
    expect(meetsWcagAAA('#595959', '#FFFFFF')).toBe(true); // ~7:1
    expect(meetsWcagAAA('#767676', '#FFFFFF')).toBe(false); // ~4.5:1
  });

  it('큰 텍스트 기준 (4.5:1)을 검사해야 함', () => {
    expect(meetsWcagAAA('#767676', '#FFFFFF', true)).toBe(true); // ~4.5:1
    expect(meetsWcagAAA('#959595', '#FFFFFF', true)).toBe(false); // ~3:1
  });
});
