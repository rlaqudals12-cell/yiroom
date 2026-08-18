import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { ErrorState } from '@/components/common/ErrorState';

describe('ErrorState', () => {
  it('alert로 알리고 제목에 포커스를 옮기며 복구 동작을 제공한다', async () => {
    const onRetry = vi.fn();
    render(
      <ErrorState
        title="결과를 불러올 수 없어요"
        description="잠시 후 다시 시도해 주세요."
        onRetry={onRetry}
        backHref="/home"
        backLabel="홈으로"
        testId="sample-error"
      />
    );

    expect(screen.getByRole('alert')).toHaveAttribute('data-testid', 'sample-error');
    const heading = screen.getByRole('heading', { name: '결과를 불러올 수 없어요' });
    await waitFor(() => expect(heading).toHaveFocus());
    expect(screen.getByRole('link', { name: '홈으로' })).toHaveAttribute('href', '/home');

    fireEvent.click(screen.getByRole('button', { name: '다시 시도' }));
    expect(onRetry).toHaveBeenCalledTimes(1);
  });
});
