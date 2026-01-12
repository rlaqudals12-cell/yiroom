import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@clerk/nextjs';
import AddPantryItemPage from '@/app/(main)/inventory/pantry/add/page';

// Mock lucide-react icons
vi.mock('lucide-react', () => ({
  Loader2: ({ className, ...props }: { className?: string }) => (
    <span className={className} data-testid="lucide-loader2" {...props}>
      Loader2
    </span>
  ),
  Refrigerator: ({ className, ...props }: { className?: string }) => (
    <span className={className} data-testid="lucide-refrigerator" {...props}>
      Refrigerator
    </span>
  ),
  ArrowRight: ({ className, ...props }: { className?: string }) => (
    <span className={className} data-testid="lucide-arrow-right" {...props}>
      ArrowRight
    </span>
  ),
  Package: ({ className, ...props }: { className?: string }) => (
    <span className={className} data-testid="lucide-package" {...props}>
      Package
    </span>
  ),
  Calendar: ({ className, ...props }: { className?: string }) => (
    <span className={className} data-testid="lucide-calendar" {...props}>
      Calendar
    </span>
  ),
  ChevronDownIcon: ({ className, ...props }: { className?: string }) => (
    <span className={className} data-testid="lucide-chevron-down" {...props}>
      ChevronDown
    </span>
  ),
  ChevronUpIcon: ({ className, ...props }: { className?: string }) => (
    <span className={className} data-testid="lucide-chevron-up" {...props}>
      ChevronUp
    </span>
  ),
  Check: ({ className, ...props }: { className?: string }) => (
    <span className={className} data-testid="lucide-check" {...props}>
      Check
    </span>
  ),
  CheckIcon: ({ className, ...props }: { className?: string }) => (
    <span className={className} data-testid="lucide-check-icon" {...props}>
      CheckIcon
    </span>
  ),
}));

// Mock dependencies
vi.mock('next/navigation', () => ({
  useRouter: vi.fn(),
}));

vi.mock('@clerk/nextjs', () => ({
  useAuth: vi.fn(),
}));

vi.mock('sonner', () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
  },
}));

// Mock fetch
global.fetch = vi.fn();

describe('AddPantryItemPage', () => {
  const mockPush = vi.fn();
  const mockReplace = vi.fn();
  const mockBack = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    (useRouter as ReturnType<typeof vi.fn>).mockReturnValue({
      push: mockPush,
      replace: mockReplace,
      back: mockBack,
    });
    (useAuth as ReturnType<typeof vi.fn>).mockReturnValue({
      isSignedIn: true,
      isLoaded: true,
    });
  });

  it('재료 추가 페이지가 렌더링된다', () => {
    render(<AddPantryItemPage />);

    expect(screen.getByTestId('add-pantry-page')).toBeInTheDocument();
    expect(screen.getByText('재료 추가')).toBeInTheDocument();
  });

  it('필수 입력 필드가 표시된다', () => {
    render(<AddPantryItemPage />);

    expect(screen.getByTestId('name-input')).toBeInTheDocument();
    expect(screen.getByTestId('quantity-input')).toBeInTheDocument();
    expect(screen.getByTestId('unit-select')).toBeInTheDocument();
  });

  it('보관 위치 옵션이 표시된다', () => {
    render(<AddPantryItemPage />);

    expect(screen.getByTestId('storage-refrigerator')).toBeInTheDocument();
    expect(screen.getByTestId('storage-freezer')).toBeInTheDocument();
    expect(screen.getByTestId('storage-room')).toBeInTheDocument();
  });

  it('재료명을 입력하지 않으면 저장 버튼이 비활성화된다', () => {
    render(<AddPantryItemPage />);

    const submitButton = screen.getByTestId('submit-button');
    expect(submitButton).toBeDisabled();
  });

  it('재료명과 수량을 입력하면 저장 버튼이 활성화된다', async () => {
    render(<AddPantryItemPage />);

    const nameInput = screen.getByTestId('name-input');
    const quantityInput = screen.getByTestId('quantity-input');

    fireEvent.change(nameInput, { target: { value: '닭가슴살' } });
    fireEvent.change(quantityInput, { target: { value: '500' } });

    await waitFor(() => {
      const submitButton = screen.getByTestId('submit-button');
      expect(submitButton).not.toBeDisabled();
    });
  });

  it('보관 위치를 선택할 수 있다', () => {
    render(<AddPantryItemPage />);

    const freezerButton = screen.getByTestId('storage-freezer');
    fireEvent.click(freezerButton);

    // 선택된 버튼에 primary 스타일이 적용되는지 확인
    expect(freezerButton).toHaveClass('border-primary');
  });

  it('취소 버튼을 클릭하면 뒤로 간다', () => {
    render(<AddPantryItemPage />);

    const cancelButton = screen.getByText('취소');
    fireEvent.click(cancelButton);

    expect(mockBack).toHaveBeenCalled();
  });

  it('미로그인 시 리다이렉트된다', () => {
    (useAuth as ReturnType<typeof vi.fn>).mockReturnValue({
      isSignedIn: false,
      isLoaded: true,
    });

    render(<AddPantryItemPage />);

    expect(mockReplace).toHaveBeenCalledWith('/');
  });

  it('로딩 중일 때 로더가 표시된다', () => {
    (useAuth as ReturnType<typeof vi.fn>).mockReturnValue({
      isSignedIn: true,
      isLoaded: false,
    });

    render(<AddPantryItemPage />);

    expect(screen.getByTestId('lucide-loader2')).toBeInTheDocument();
  });
});
