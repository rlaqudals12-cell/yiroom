import { describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';

import { QuestionnaireForm } from '@/app/(main)/analysis/integrated/_components/QuestionnaireForm';

describe('QuestionnaireForm', () => {
  it('전신 사진 없이 신체 정보만 입력할 때 예시 결과와 낮은 신뢰도를 제출 전에 고지한다', () => {
    render(<QuestionnaireForm onChange={vi.fn()} showBodyFields />);

    const notice = screen.getByTestId('body-example-notice');
    expect(notice).toHaveTextContent('재현 가능한 낮은 신뢰도의 샘플(예시) 결과');
    expect(notice).toHaveTextContent('실제 분석 결과가 아니므로 참고용으로만 봐주세요');
    expect(screen.queryByText(/키만 입력해도 분석 가능/)).not.toBeInTheDocument();
  });

  it('전신 사진이 있으면 예시 결과 고지 대신 사진 기반 자동 분석 안내를 표시한다', () => {
    render(<QuestionnaireForm onChange={vi.fn()} showBodyFields={false} />);

    expect(screen.queryByTestId('body-example-notice')).not.toBeInTheDocument();
    expect(
      screen.getByText('전신 사진으로 체형을 자동 분석해요. 수동 입력은 필요 없어요.')
    ).toBeInTheDocument();
  });

  it('원본 저장은 선택·기본 OFF이며 미동의 분석과 1년 파기 계약을 고지한다', async () => {
    const onChange = vi.fn();
    render(<QuestionnaireForm onChange={onChange} showBodyFields />);

    const checkbox = screen.getByTestId('image-storage-consent-checkbox');
    expect(checkbox).not.toBeChecked();
    expect(screen.getByTestId('integrated-image-storage-consent')).toHaveTextContent(
      '동의하지 않아도 분석은 진행돼요'
    );
    expect(screen.getByTestId('integrated-image-storage-consent')).toHaveTextContent(
      '보관 1년이 되면 일일 파기 작업으로 삭제를 시작'
    );
    await waitFor(() =>
      expect(onChange).toHaveBeenLastCalledWith(
        expect.objectContaining({ imageStorageConsent: false })
      )
    );

    fireEvent.click(checkbox);

    await waitFor(() =>
      expect(onChange).toHaveBeenLastCalledWith(
        expect.objectContaining({ imageStorageConsent: true })
      )
    );
  });
});
