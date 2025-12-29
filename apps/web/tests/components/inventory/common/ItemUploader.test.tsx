/**
 * ItemUploader 컴포넌트 테스트
 * JSDOM 환경에서 File.arrayBuffer() 미지원으로 UI 테스트에 집중
 */

import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { ItemUploader } from '@/components/inventory/common/ItemUploader';

// Mock image processing functions
vi.mock('@/lib/inventory', () => ({
  validateImageFile: vi.fn(() => ({ valid: true })),
  resizeImage: vi.fn((blob) => Promise.resolve(blob)),
  removeBackgroundClient: vi.fn((blob) => Promise.resolve(blob)),
  blobToDataUrl: vi.fn(() => Promise.resolve('data:image/png;base64,test')),
}));

describe('ItemUploader', () => {
  it('renders upload area', () => {
    render(<ItemUploader onUploadComplete={() => {}} />);

    expect(screen.getByTestId('item-uploader')).toBeInTheDocument();
    expect(screen.getByText(/이미지를 드래그하거나 클릭/)).toBeInTheDocument();
  });

  it('shows supported formats', () => {
    render(<ItemUploader onUploadComplete={() => {}} />);

    expect(screen.getByText(/JPG, PNG, WebP, HEIC/)).toBeInTheDocument();
    expect(screen.getByText(/최대 10MB/)).toBeInTheDocument();
  });

  it('has hidden file input with correct accept types', () => {
    render(<ItemUploader onUploadComplete={() => {}} />);

    const input = document.querySelector('input[type="file"]') as HTMLInputElement;
    expect(input).toBeInTheDocument();
    expect(input).toHaveClass('hidden');
    expect(input.accept).toBe('image/jpeg,image/png,image/webp,image/heic');
  });

  it('calls onCancel when cancel button is clicked', () => {
    const onCancel = vi.fn();
    render(<ItemUploader onUploadComplete={() => {}} onCancel={onCancel} />);

    const cancelButton = screen.getByText('취소');
    fireEvent.click(cancelButton);

    expect(onCancel).toHaveBeenCalled();
  });

  it('applies dragover styles on drag', () => {
    render(<ItemUploader onUploadComplete={() => {}} />);

    const dropZone = screen.getByTestId('item-uploader').querySelector('.border-dashed')!;

    fireEvent.dragOver(dropZone);

    // border-primary 클래스가 적용되어야 함
    expect(dropZone).toHaveClass('border-primary');
  });

  it('removes drag styles on drag leave', () => {
    render(<ItemUploader onUploadComplete={() => {}} />);

    const dropZone = screen.getByTestId('item-uploader').querySelector('.border-dashed')!;

    fireEvent.dragOver(dropZone);
    fireEvent.dragLeave(dropZone);

    expect(dropZone).not.toHaveClass('border-primary');
  });

  it('applies custom className', () => {
    render(
      <ItemUploader
        onUploadComplete={() => {}}
        className="custom-class"
      />
    );

    const container = screen.getByTestId('item-uploader');
    expect(container).toHaveClass('custom-class');
  });

  it('shows camera icon in empty state', () => {
    render(<ItemUploader onUploadComplete={() => {}} />);

    // Lucide icon이 렌더링됨
    expect(screen.getByTestId('lucide-camera')).toBeInTheDocument();
  });
});
