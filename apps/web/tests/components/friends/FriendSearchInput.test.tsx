import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { FriendSearchInput } from '@/components/friends/FriendSearchInput';

describe('FriendSearchInput', () => {
  it('컴포넌트 렌더링', () => {
    render(<FriendSearchInput value="" onChange={() => {}} />);
    expect(screen.getByTestId('friend-search-input')).toBeInTheDocument();
  });

  it('입력 필드 렌더링', () => {
    render(<FriendSearchInput value="" onChange={() => {}} />);
    expect(screen.getByTestId('friend-search-input-field')).toBeInTheDocument();
  });

  it('기본 placeholder 표시', () => {
    render(<FriendSearchInput value="" onChange={() => {}} />);
    expect(screen.getByPlaceholderText('이름으로 검색...')).toBeInTheDocument();
  });

  it('커스텀 placeholder 표시', () => {
    render(<FriendSearchInput value="" onChange={() => {}} placeholder="친구 찾기" />);
    expect(screen.getByPlaceholderText('친구 찾기')).toBeInTheDocument();
  });

  it('입력 시 onChange 호출', () => {
    const onChange = vi.fn();
    render(<FriendSearchInput value="" onChange={onChange} />);

    const input = screen.getByTestId('friend-search-input-field');
    fireEvent.change(input, { target: { value: '홍길동' } });

    expect(onChange).toHaveBeenCalledWith('홍길동');
  });

  it('value가 있으면 클리어 버튼 표시', () => {
    render(<FriendSearchInput value="검색어" onChange={() => {}} />);
    expect(screen.getByTestId('friend-search-clear-button')).toBeInTheDocument();
  });

  it('value가 비어있으면 클리어 버튼 숨김', () => {
    render(<FriendSearchInput value="" onChange={() => {}} />);
    expect(screen.queryByTestId('friend-search-clear-button')).not.toBeInTheDocument();
  });

  it('클리어 버튼 클릭 시 onChange 빈 문자열 호출', () => {
    const onChange = vi.fn();
    render(<FriendSearchInput value="검색어" onChange={onChange} />);

    const clearButton = screen.getByTestId('friend-search-clear-button');
    fireEvent.click(clearButton);

    expect(onChange).toHaveBeenCalledWith('');
  });

  it('클리어 버튼 클릭 시 onClear 호출', () => {
    const onClear = vi.fn();
    render(<FriendSearchInput value="검색어" onChange={() => {}} onClear={onClear} />);

    const clearButton = screen.getByTestId('friend-search-clear-button');
    fireEvent.click(clearButton);

    expect(onClear).toHaveBeenCalled();
  });

  it('로딩 상태에서 로딩 아이콘 표시', () => {
    const { container } = render(<FriendSearchInput value="" onChange={() => {}} isLoading />);
    // animate-spin 클래스가 있는 요소 확인
    const spinner = container.querySelector('.animate-spin');
    expect(spinner).toBeInTheDocument();
  });

  it('클리어 버튼 aria-label 확인', () => {
    render(<FriendSearchInput value="검색어" onChange={() => {}} />);
    const clearButton = screen.getByRole('button', { name: '검색어 지우기' });
    expect(clearButton).toBeInTheDocument();
  });
});
