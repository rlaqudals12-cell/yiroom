/**
 * 통합 분석 이미지 업로드 섹션 테스트
 *
 * 회귀 방지:
 * - 압축 실패가 조용히 통과되던 결함 → 실패 원인별 인라인 에러 노출
 * - 자가입력으로 체형을 "추정"해준다는 과약속 문구 (실제로는 예시 결과 대체)
 * - 처리 중 상태 고지 부재 (aria-busy·스피너)
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { ImageProcessingError } from '@/lib/utils/image-compression';
import { ImageUploadSection } from '@/app/(main)/analysis/integrated/_components/ImageUploadSection';

const compressMock = vi.fn();

vi.mock('@/lib/utils/image-compression', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/lib/utils/image-compression')>();
  return {
    ...actual,
    compressFileToBase64: (file: File) => compressMock(file),
  };
});

// next/image는 data URL 프리뷰만 확인하면 되므로 단순 img로 대체
vi.mock('next/image', () => ({
  default: ({ src, alt }: { src: string; alt: string }) => <img src={src} alt={alt} />,
}));

function fileInputs(container: HTMLElement): HTMLInputElement[] {
  return Array.from(container.querySelectorAll<HTMLInputElement>('input[type="file"]'));
}

function selectFile(input: HTMLInputElement, name = 'photo.jpg'): void {
  const file = new File(['x'], name, { type: 'image/jpeg' });
  fireEvent.change(input, { target: { files: [file] } });
}

function renderSection() {
  const onFace = vi.fn();
  const onBody = vi.fn();
  const view = render(<ImageUploadSection onFaceImageChange={onFace} onBodyImageChange={onBody} />);
  return { ...view, onFace, onBody };
}

describe('ImageUploadSection', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('전신 사진 안내는 자가입력 추정을 약속하지 않는다 (정직 문구)', () => {
    renderSection();
    expect(screen.getByText('전신 사진이 없으면 체형은 예시 결과로 대체돼요')).toBeInTheDocument();
    expect(screen.queryByText(/자가입력으로 체형을 추정/)).not.toBeInTheDocument();
  });

  it('압축 실패 사유(용량 초과 등)를 그대로 인라인 에러로 보여준다', async () => {
    compressMock.mockRejectedValue(
      new ImageProcessingError('사진 용량이 너무 커요. 10MB 이하 사진을 선택해주세요.')
    );
    const { container, onFace } = renderSection();

    selectFile(fileInputs(container)[0]);

    await waitFor(() => {
      expect(screen.getByTestId('face-upload-error')).toHaveTextContent(
        '사진 용량이 너무 커요. 10MB 이하 사진을 선택해주세요.'
      );
    });
    // 실패한 업로드는 부모에 이미지를 넘기지 않는다
    expect(onFace).not.toHaveBeenCalledWith(expect.stringContaining('data:image'));
  });

  it('예상 못 한 오류는 기본 안내 문구로 대체한다', async () => {
    compressMock.mockRejectedValue(new Error('boom'));
    const { container } = renderSection();

    selectFile(fileInputs(container)[1]);

    await waitFor(() => {
      expect(screen.getByTestId('body-upload-error')).toHaveTextContent(
        '이미지 처리에 실패했어요. 다른 사진을 선택해주세요.'
      );
    });
  });

  it('처리 중에는 aria-busy와 스피너를 노출한다', async () => {
    compressMock.mockImplementation(() => new Promise(() => {}));
    const { container } = renderSection();

    selectFile(fileInputs(container)[0]);

    await waitFor(() => {
      expect(screen.getByTestId('face-upload-spinner')).toBeInTheDocument();
    });
    expect(screen.getByText('처리 중...').closest('label')).toHaveAttribute('aria-busy', 'true');
  });

  it('실패 후 다시 올려 성공하면 에러가 사라지고 이미지가 전달된다', async () => {
    compressMock.mockRejectedValueOnce(new ImageProcessingError('이미지를 읽을 수 없어요.'));
    const { container, onFace } = renderSection();

    selectFile(fileInputs(container)[0]);
    await waitFor(() => expect(screen.getByTestId('face-upload-error')).toBeInTheDocument());

    compressMock.mockResolvedValueOnce('data:image/jpeg;base64,ok');
    selectFile(fileInputs(container)[0], 'retry.jpg');

    await waitFor(() => {
      expect(screen.queryByTestId('face-upload-error')).not.toBeInTheDocument();
    });
    expect(onFace).toHaveBeenCalledWith('data:image/jpeg;base64,ok');
  });

  it('사진 제거 시 해당 슬롯 상태만 초기화하고 다른 슬롯 에러는 유지한다', async () => {
    compressMock.mockResolvedValueOnce('data:image/jpeg;base64,face');
    const { container, onFace } = renderSection();

    selectFile(fileInputs(container)[0]);
    await waitFor(() => expect(screen.getByAltText('얼굴 미리보기')).toBeInTheDocument());

    // 전신 슬롯 실패 → 전신 에러만 존재
    compressMock.mockRejectedValueOnce(new ImageProcessingError('이미지를 읽을 수 없어요.'));
    selectFile(fileInputs(container)[0]); // 얼굴은 프리뷰 상태라 input이 하나뿐 → 전신 input
    await waitFor(() => expect(screen.getByTestId('body-upload-error')).toBeInTheDocument());

    fireEvent.click(screen.getByLabelText('얼굴 사진 제거'));

    expect(onFace).toHaveBeenLastCalledWith(null);
    expect(screen.getByTestId('body-upload-error')).toBeInTheDocument();
  });
});
