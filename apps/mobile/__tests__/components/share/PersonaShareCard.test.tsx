/**
 * PersonaShareCard (E+ RN 포팅) 테스트 — 웹 정본 계약 미러
 */
import { render } from '@testing-library/react-native';

import { PersonaShareCard } from '../../../components/share/PersonaShareCard';

const PALETTE = [
  { hex: '#C79AA0', name: '더스티 로즈' },
  { hex: '#9A86A6', name: '소프트 라일락' },
  { hex: '#A7BACF', name: '파우더 블루' },
];

describe('PersonaShareCard (모바일 E+)', () => {
  it('진단명이 히어로, 은유는 서브카피로 렌더된다', () => {
    const { getByTestId } = render(
      <PersonaShareCard oneLine="여름 아침의 빛" toneName="뮤티드 서머" badges={[]} />
    );
    expect(getByTestId('persona-share-hero')).toHaveTextContent('뮤티드 서머');
    expect(getByTestId('persona-share-oneline')).toHaveTextContent('여름 아침의 빛');
  });

  it('퍼컬 실패 시 은유가 히어로 자리를 지킨다', () => {
    const { getByTestId, queryByTestId } = render(
      <PersonaShareCard oneLine="당신만의 색을 가진 사람" badges={[]} />
    );
    expect(getByTestId('persona-share-hero')).toHaveTextContent('당신만의 색을 가진 사람');
    expect(queryByTestId('persona-share-oneline')).toBeNull();
    expect(queryByTestId('persona-share-swatches')).toBeNull();
  });

  it('발급번호는 6자리 패딩으로, 없으면 미표기 (지어내지 않음)', () => {
    const { getByTestId, rerender, queryByTestId } = render(
      <PersonaShareCard oneLine="한 줄" badges={[]} serialNo={42} />
    );
    expect(getByTestId('persona-share-serial')).toHaveTextContent('No.000042');
    rerender(<PersonaShareCard oneLine="한 줄" badges={[]} serialNo={null} />);
    expect(queryByTestId('persona-share-serial')).toBeNull();
  });

  it('팔레트·워스트·서명 뱃지를 렌더한다', () => {
    const { getByTestId, getByText } = render(
      <PersonaShareCard
        oneLine="한 줄"
        toneName="뮤티드 서머"
        badges={[
          { label: '피부', value: '복합성' },
          { label: '체형', value: '웨이브' },
        ]}
        palette={PALETTE}
        worstPalette={[{ hex: '#E04A40' }, { hex: '#E8BE3A' }]}
        inviteText="너의 계절은?"
      />
    );
    expect(getByTestId('persona-share-swatches')).toBeTruthy();
    expect(getByText('더스티 로즈')).toBeTruthy();
    expect(getByTestId('persona-share-worst')).toBeTruthy();
    expect(getByText('복합성 · 웨이브')).toBeTruthy();
    expect(getByTestId('persona-share-invite')).toHaveTextContent('너의 계절은?');
    expect(getByText('yiroom.app')).toBeTruthy();
  });

  it('색이름이 일부만 있으면 이름을 아예 렌더하지 않는다 (컬럼 정렬 유지)', () => {
    const { queryByText } = render(
      <PersonaShareCard
        oneLine="한 줄"
        badges={[]}
        palette={[{ hex: '#C79AA0', name: '더스티 로즈' }, { hex: '#9A86A6' }]}
      />
    );
    expect(queryByText('더스티 로즈')).toBeNull();
  });

  it('긴 색이름(7자+)은 어절 단위로 개행된다 — 고아 글자 방지', () => {
    const { getByText } = render(
      <PersonaShareCard
        oneLine="한 줄"
        badges={[]}
        palette={[
          { hex: '#00A878', name: '브라이트 에메랄드' },
          { hex: '#E0218A', name: '마젠타' },
        ]}
      />
    );
    expect(getByText('브라이트\n에메랄드')).toBeTruthy();
    expect(getByText('마젠타')).toBeTruthy();
  });

  it('story 포맷은 data 없이도 렌더된다 (포맷 스위칭 안전)', () => {
    const { getByTestId } = render(
      <PersonaShareCard oneLine="한 줄" badges={[]} palette={PALETTE} format="story" />
    );
    expect(getByTestId('persona-share-card')).toBeTruthy();
  });
});
