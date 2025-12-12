/**
 * N-1 FoodPhotoCapture 컴포넌트 테스트
 * Task 2.4: 카메라 촬영 UI
 */

import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import FoodPhotoCapture from '@/components/nutrition/FoodPhotoCapture';

describe('FoodPhotoCapture', () => {
  it('카메라 촬영 버튼을 렌더링한다', () => {
    const onPhotoSelect = vi.fn();
    render(<FoodPhotoCapture onPhotoSelect={onPhotoSelect} />);

    const cameraButton = screen.getByRole('button', { name: /카메라로 사진 촬영하기/i });
    expect(cameraButton).toBeInTheDocument();
  });

  it('갤러리 선택 버튼을 렌더링한다', () => {
    const onPhotoSelect = vi.fn();
    render(<FoodPhotoCapture onPhotoSelect={onPhotoSelect} />);

    const galleryButton = screen.getByRole('button', { name: /갤러리에서 사진 선택하기/i });
    expect(galleryButton).toBeInTheDocument();
  });

  it('음식 촬영 가이드 텍스트를 표시한다', () => {
    const onPhotoSelect = vi.fn();
    render(<FoodPhotoCapture onPhotoSelect={onPhotoSelect} />);

    expect(screen.getByText('음식이 잘 보이게')).toBeInTheDocument();
    expect(screen.getByText('촬영해주세요')).toBeInTheDocument();
  });

  it('촬영 팁을 표시한다', () => {
    const onPhotoSelect = vi.fn();
    render(<FoodPhotoCapture onPhotoSelect={onPhotoSelect} />);

    expect(screen.getByText('촬영 팁')).toBeInTheDocument();
    expect(screen.getByText(/음식 전체가 보이게 촬영해주세요/)).toBeInTheDocument();
    expect(screen.getByText(/밝은 곳에서 촬영하면 더 정확해요/)).toBeInTheDocument();
  });

  it('파일 선택 시 onPhotoSelect 콜백을 호출한다', async () => {
    const onPhotoSelect = vi.fn();
    render(<FoodPhotoCapture onPhotoSelect={onPhotoSelect} />);

    // 갤러리 input 찾기
    const fileInput = screen.getByLabelText('갤러리에서 사진 선택');
    expect(fileInput).toBeInTheDocument();

    // 파일 선택 시뮬레이션
    const file = new File(['test'], 'test.jpg', { type: 'image/jpeg' });
    fireEvent.change(fileInput, { target: { files: [file] } });

    expect(onPhotoSelect).toHaveBeenCalledWith(file);
  });

  it('잘못된 파일 타입은 거부한다', () => {
    const onPhotoSelect = vi.fn();
    const alertSpy = vi.spyOn(window, 'alert').mockImplementation(() => {});

    render(<FoodPhotoCapture onPhotoSelect={onPhotoSelect} />);

    const fileInput = screen.getByLabelText('갤러리에서 사진 선택');

    // 잘못된 파일 타입
    const file = new File(['test'], 'test.txt', { type: 'text/plain' });
    fireEvent.change(fileInput, { target: { files: [file] } });

    expect(onPhotoSelect).not.toHaveBeenCalled();
    expect(alertSpy).toHaveBeenCalledWith('JPG, PNG, WebP 파일만 업로드 가능해요');

    alertSpy.mockRestore();
  });
});
