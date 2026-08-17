/**
 * DeleteAccountDialog — 삭제 확인 가드 테스트
 *
 * 회귀 방지: userEmail이 빈 문자열('' — useUser 로딩 중이거나 이메일 없는 계정)일 때
 * `'' === ''`가 참이 되어 아무것도 입력하지 않아도 삭제 버튼이 활성화되던 결함.
 * 되돌릴 수 없는 파괴적 액션이라 확인 절차 무력화는 그 자체로 상급 결함이다.
 */

import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { DeleteAccountDialog } from '@/components/settings/DeleteAccountDialog';

function renderDialog(userEmail: string): void {
  render(<DeleteAccountDialog open onOpenChange={vi.fn()} userEmail={userEmail} />);
}

function confirmButton(): HTMLButtonElement {
  return screen.getByTestId('delete-account-confirm-button') as HTMLButtonElement;
}

function typeConfirmation(value: string): void {
  fireEvent.change(screen.getByTestId('delete-confirmation-input'), { target: { value } });
}

describe('DeleteAccountDialog', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    global.fetch = vi.fn();
  });

  describe('이메일이 있는 계정', () => {
    const email = 'user@example.com';

    it('입력이 비어 있으면 삭제 버튼이 비활성이다', () => {
      renderDialog(email);
      expect(confirmButton()).toBeDisabled();
    });

    it('다른 값을 입력하면 여전히 비활성이다', () => {
      renderDialog(email);
      typeConfirmation('other@example.com');
      expect(confirmButton()).toBeDisabled();
    });

    it('이메일을 입력하면 활성화된다 (대소문자 무시)', () => {
      renderDialog(email);
      typeConfirmation('USER@Example.com');
      expect(confirmButton()).toBeEnabled();
    });
  });

  describe('이메일을 확인할 수 없는 경우 (로딩 중 · 이메일 없는 계정)', () => {
    it('빈 입력으로 삭제 버튼이 활성화되지 않는다 (확인 무력화 회귀)', () => {
      renderDialog('');
      expect(confirmButton()).toBeDisabled();
    });

    it('빈 문자열 비교로 통과하지 않는다 — 임의 입력도 비활성', () => {
      renderDialog('');
      typeConfirmation('아무거나');
      expect(confirmButton()).toBeDisabled();
    });

    it('고정 확인 문구("계정삭제")를 입력해야 활성화된다', () => {
      renderDialog('');
      typeConfirmation('계정삭제');
      expect(confirmButton()).toBeEnabled();
    });

    it('고정 문구 안내를 노출한다', () => {
      renderDialog('');
      expect(screen.getByText(/"계정삭제"를 입력하세요/)).toBeInTheDocument();
    });
  });

  it('확인 전에는 삭제 API를 호출하지 않는다', () => {
    renderDialog('user@example.com');
    fireEvent.click(confirmButton());
    expect(global.fetch).not.toHaveBeenCalled();
  });
});
