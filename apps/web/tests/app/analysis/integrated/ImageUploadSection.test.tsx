/**
 * 통합 분석 이미지 업로드 섹션 테스트
 *
 * 회귀 방지:
 * - 압축 실패가 조용히 통과되던 결함 → 실패 원인별 인라인 에러 노출
 * - 사진·자가입력 유무에 따라 예시/미분석으로 갈리는 체형 계약의 과약속 방지
 * - 처리 중 상태 고지 부재 (aria-busy·스피너)
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
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
    expect(screen.getByTestId('body-input-guidance')).toHaveTextContent(
      '전신 사진 없이 신체 정보만 입력하면 낮은 신뢰도의 예시 결과를 표시하고, 신체 정보도 없으면 체형 분석을 건너뛰어요'
    );
    expect(screen.queryByText(/자가입력으로 체형을 추정/)).not.toBeInTheDocument();
    expect(
      screen.queryByText('전신 사진이 없으면 체형은 예시 결과로 대체돼요')
    ).not.toBeInTheDocument();
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

/**
 * 회귀 방지(2026-08, a11y): 파일 input이 `display:none`(Tailwind `hidden`)이라
 * 포커스를 받지 못해, 키보드만 쓰는 사용자가 **필수** 항목인 얼굴 사진에 도달할 수 없었다.
 * (드롭존은 label이라 그 자체로는 포커스 대상이 아니다.)
 */
describe('ImageUploadSection 키보드 접근성', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('탭 키만으로 얼굴·전신 사진 입력에 차례로 도달한다', async () => {
    const user = userEvent.setup();
    renderSection();

    const faceInput = screen.getByTestId('face-upload-input');
    const bodyInput = screen.getByTestId('body-upload-input');

    await user.tab();
    expect(faceInput).toHaveFocus();

    await user.tab();
    expect(bodyInput).toHaveFocus();
  });

  it('파일 input을 display:none으로 감추지 않는다 (sr-only로 포커스 유지)', () => {
    const { container } = renderSection();

    // jsdom에는 Tailwind CSS가 로드되지 않아 계산된 visibility로는 검증할 수 없다.
    // 포커스를 죽이는 클래스(hidden)의 부재 + sr-only 채택 여부를 클래스로 검사한다.
    for (const input of fileInputs(container)) {
      expect(input.className).not.toMatch(/(^|\s)hidden(\s|$)/);
      expect(input).toHaveClass('sr-only');
    }
  });

  it('두 파일 input 모두 접근 가능한 이름을 가진다', () => {
    renderSection();

    expect(screen.getByLabelText('얼굴 셀카 사진 선택')).toBe(
      screen.getByTestId('face-upload-input')
    );
    expect(screen.getByLabelText('전신 사진 선택')).toBe(screen.getByTestId('body-upload-input'));
  });

  it('드롭존 라벨이 htmlFor로 input과 연결돼 클릭 타깃을 유지한다', () => {
    const { container } = renderSection();

    const labels = Array.from(container.querySelectorAll('label'));
    expect(labels.map((l) => l.getAttribute('for'))).toEqual([
      'integrated-face-upload',
      'integrated-body-upload',
    ]);
    expect(screen.getByTestId('face-upload-input').id).toBe('integrated-face-upload');
    expect(screen.getByTestId('body-upload-input').id).toBe('integrated-body-upload');
  });
});
