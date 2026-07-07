/**
 * Task 6.4: OptimizedImage 컴포넌트 테스트
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import OptimizedImage, {
  ExerciseThumbnail,
  extractYouTubeVideoId,
  getYouTubeThumbnail,
  isValidImageUrl,
} from '@/components/ui/optimized-image';

// next/image 모킹 (테스트용 - img 사용 필수)

vi.mock('next/image', () => ({
  default: vi.fn(({ src, alt, onLoad, onError, className, ...props }) => {
    return (
      <img
        src={typeof src === 'string' ? src : ''}
        alt={alt}
        className={className}
        data-testid="next-image"
        onLoad={onLoad}
        onError={onError}
        {...props}
      />
    );
  }),
}));

describe('OptimizedImage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('렌더링', () => {
    it('이미지 src가 있으면 next/image로 렌더링', () => {
      render(
        <OptimizedImage
          src="https://example.com/image.jpg"
          alt="테스트 이미지"
          width={200}
          height={100}
        />
      );

      const img = screen.getByTestId('next-image');
      expect(img).toBeInTheDocument();
      expect(img).toHaveAttribute('src', 'https://example.com/image.jpg');
      expect(img).toHaveAttribute('alt', '테스트 이미지');
    });

    it('src가 없으면 fallback 렌더링', () => {
      render(
        <OptimizedImage
          src=""
          alt="테스트 이미지"
          width={200}
          height={100}
          fallback={<span>🏋️</span>}
        />
      );

      expect(screen.getByText('🏋️')).toBeInTheDocument();
      expect(screen.queryByTestId('next-image')).not.toBeInTheDocument();
    });

    it('fallback이 URL이면 대체 이미지 렌더링', () => {
      render(
        <OptimizedImage
          src=""
          alt="테스트 이미지"
          width={200}
          height={100}
          fallback="https://example.com/fallback.jpg"
        />
      );

      const img = screen.getByTestId('next-image');
      expect(img).toHaveAttribute('src', 'https://example.com/fallback.jpg');
    });
  });

  describe('로딩 상태', () => {
    it('showLoadingState=true면 로딩 중 애니메이션 표시', () => {
      render(
        <OptimizedImage
          src="https://example.com/image.jpg"
          alt="테스트 이미지"
          width={200}
          height={100}
          showLoadingState={true}
          loadingClassName="animate-pulse"
        />
      );

      // 로딩 상태 표시 확인
      const loadingDiv = document.querySelector('.animate-pulse');
      expect(loadingDiv).toBeInTheDocument();
    });

    it('이미지 로드 완료 시 로딩 상태 제거', async () => {
      render(
        <OptimizedImage
          src="https://example.com/image.jpg"
          alt="테스트 이미지"
          width={200}
          height={100}
          showLoadingState={true}
        />
      );

      const img = screen.getByTestId('next-image');

      // 로드 이벤트 발생
      fireEvent.load(img);

      await waitFor(() => {
        expect(img).toHaveClass('opacity-100');
      });
    });
  });

  describe('에러 처리', () => {
    it('이미지 로드 실패 시 fallback 표시', async () => {
      render(
        <OptimizedImage
          src="https://example.com/broken.jpg"
          alt="테스트 이미지"
          width={200}
          height={100}
          fallback={<span>이미지 없음</span>}
        />
      );

      const img = screen.getByTestId('next-image');

      // 에러 이벤트 발생
      fireEvent.error(img);

      await waitFor(() => {
        expect(screen.getByText('이미지 없음')).toBeInTheDocument();
      });
    });
  });
});

describe('ExerciseThumbnail', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('썸네일 렌더링', () => {
    it('thumbnailUrl이 있으면 해당 이미지 표시', () => {
      render(
        <ExerciseThumbnail
          thumbnailUrl="https://example.com/thumb.jpg"
          alt="운동 썸네일"
          category="upper"
        />
      );

      const img = screen.getByTestId('next-image');
      expect(img).toHaveAttribute('src', 'https://example.com/thumb.jpg');
    });

    it('videoId가 있으면 YouTube 썸네일 URL 생성', () => {
      render(<ExerciseThumbnail videoId="dQw4w9WgXcQ" alt="운동 썸네일" category="cardio" />);

      const img = screen.getByTestId('next-image');
      expect(img.getAttribute('src')).toContain('img.youtube.com/vi/dQw4w9WgXcQ');
    });

    it('videoId와 thumbnailUrl 모두 있으면 thumbnailUrl 우선', () => {
      render(
        <ExerciseThumbnail
          videoId="dQw4w9WgXcQ"
          thumbnailUrl="https://example.com/custom.jpg"
          alt="운동 썸네일"
          category="upper"
        />
      );

      const img = screen.getByTestId('next-image');
      expect(img).toHaveAttribute('src', 'https://example.com/custom.jpg');
    });

    // 변경: 카테고리별 이모지 폴백은 이모지 정리 정책으로 제거됨
    // (CATEGORY_FALLBACK_EMOJI가 전부 빈 문자열 → 이모지 없는 폴백 컨테이너만 렌더링)
    it('이미지 없으면 이모지 없는 폴백 컨테이너 표시', () => {
      const { rerender } = render(<ExerciseThumbnail alt="상체 운동" category="upper" />);

      // role="img" 폴백 컨테이너가 렌더링되고 이모지는 표시되지 않는다
      expect(screen.getByRole('img', { name: '상체 운동' })).toHaveTextContent('');
      expect(screen.queryByText('💪')).not.toBeInTheDocument();

      rerender(<ExerciseThumbnail alt="하체 운동" category="lower" />);
      expect(screen.getByRole('img', { name: '하체 운동' })).toHaveTextContent('');
      expect(screen.queryByText('🦵')).not.toBeInTheDocument();

      rerender(<ExerciseThumbnail alt="코어 운동" category="core" />);
      expect(screen.getByRole('img', { name: '코어 운동' })).toHaveTextContent('');
      expect(screen.queryByText('🧘')).not.toBeInTheDocument();

      rerender(<ExerciseThumbnail alt="유산소 운동" category="cardio" />);
      expect(screen.getByRole('img', { name: '유산소 운동' })).toHaveTextContent('');
      expect(screen.queryByText('🏃')).not.toBeInTheDocument();
    });
  });

  describe('크기 설정', () => {
    it('기본 크기는 320x180', () => {
      render(<ExerciseThumbnail thumbnailUrl="https://example.com/thumb.jpg" alt="운동 썸네일" />);

      const img = screen.getByTestId('next-image');
      expect(img).toHaveAttribute('width', '320');
      expect(img).toHaveAttribute('height', '180');
    });

    it('커스텀 크기 지정 가능', () => {
      render(
        <ExerciseThumbnail
          thumbnailUrl="https://example.com/thumb.jpg"
          alt="운동 썸네일"
          width={160}
          height={90}
        />
      );

      const img = screen.getByTestId('next-image');
      expect(img).toHaveAttribute('width', '160');
      expect(img).toHaveAttribute('height', '90');
    });
  });
});

describe('extractYouTubeVideoId', () => {
  describe('비디오 ID 추출', () => {
    it('11자리 비디오 ID 직접 입력', () => {
      expect(extractYouTubeVideoId('dQw4w9WgXcQ')).toBe('dQw4w9WgXcQ');
    });

    it('youtube.com/watch?v= URL에서 추출', () => {
      expect(extractYouTubeVideoId('https://www.youtube.com/watch?v=dQw4w9WgXcQ')).toBe(
        'dQw4w9WgXcQ'
      );
    });

    it('youtu.be/ 단축 URL에서 추출', () => {
      expect(extractYouTubeVideoId('https://youtu.be/dQw4w9WgXcQ')).toBe('dQw4w9WgXcQ');
    });

    it('youtube.com/embed/ URL에서 추출', () => {
      expect(extractYouTubeVideoId('https://www.youtube.com/embed/dQw4w9WgXcQ')).toBe(
        'dQw4w9WgXcQ'
      );
    });

    it('쿼리 파라미터가 있어도 추출', () => {
      expect(extractYouTubeVideoId('https://www.youtube.com/watch?v=dQw4w9WgXcQ&t=30s')).toBe(
        'dQw4w9WgXcQ'
      );
    });
  });

  describe('잘못된 입력', () => {
    it('유효하지 않은 비디오 ID면 null 반환', () => {
      expect(extractYouTubeVideoId('invalid')).toBeNull();
      expect(extractYouTubeVideoId('short')).toBeNull();
      expect(extractYouTubeVideoId('')).toBeNull();
    });

    it('유효하지 않은 URL이면 null 반환', () => {
      expect(extractYouTubeVideoId('https://example.com/video')).toBeNull();
    });
  });
});

describe('getYouTubeThumbnail', () => {
  describe('비디오 ID 추출', () => {
    it('11자리 비디오 ID 직접 입력', () => {
      const result = getYouTubeThumbnail('dQw4w9WgXcQ');
      expect(result).toBe('https://img.youtube.com/vi/dQw4w9WgXcQ/hqdefault.jpg');
    });

    it('youtube.com/watch?v= URL에서 추출', () => {
      const result = getYouTubeThumbnail('https://www.youtube.com/watch?v=dQw4w9WgXcQ');
      expect(result).toBe('https://img.youtube.com/vi/dQw4w9WgXcQ/hqdefault.jpg');
    });

    it('youtu.be/ 단축 URL에서 추출', () => {
      const result = getYouTubeThumbnail('https://youtu.be/dQw4w9WgXcQ');
      expect(result).toBe('https://img.youtube.com/vi/dQw4w9WgXcQ/hqdefault.jpg');
    });

    it('youtube.com/embed/ URL에서 추출', () => {
      const result = getYouTubeThumbnail('https://www.youtube.com/embed/dQw4w9WgXcQ');
      expect(result).toBe('https://img.youtube.com/vi/dQw4w9WgXcQ/hqdefault.jpg');
    });

    it('쿼리 파라미터가 있어도 추출', () => {
      const result = getYouTubeThumbnail('https://www.youtube.com/watch?v=dQw4w9WgXcQ&t=30s');
      expect(result).toBe('https://img.youtube.com/vi/dQw4w9WgXcQ/hqdefault.jpg');
    });
  });

  describe('품질 옵션', () => {
    it('default 품질', () => {
      const result = getYouTubeThumbnail('dQw4w9WgXcQ', 'default');
      expect(result).toBe('https://img.youtube.com/vi/dQw4w9WgXcQ/default.jpg');
    });

    it('maxresdefault 품질', () => {
      const result = getYouTubeThumbnail('dQw4w9WgXcQ', 'maxresdefault');
      expect(result).toBe('https://img.youtube.com/vi/dQw4w9WgXcQ/maxresdefault.jpg');
    });

    it('mqdefault 품질', () => {
      const result = getYouTubeThumbnail('dQw4w9WgXcQ', 'mqdefault');
      expect(result).toBe('https://img.youtube.com/vi/dQw4w9WgXcQ/mqdefault.jpg');
    });
  });

  describe('잘못된 입력', () => {
    it('유효하지 않은 비디오 ID면 null 반환', () => {
      expect(getYouTubeThumbnail('invalid')).toBeNull();
      expect(getYouTubeThumbnail('short')).toBeNull();
      expect(getYouTubeThumbnail('')).toBeNull();
    });

    it('유효하지 않은 URL이면 null 반환', () => {
      expect(getYouTubeThumbnail('https://example.com/video')).toBeNull();
    });
  });
});

describe('isValidImageUrl', () => {
  it('유효한 URL이면 true', () => {
    expect(isValidImageUrl('https://example.com/image.jpg')).toBe(true);
    expect(isValidImageUrl('http://example.com/image.png')).toBe(true);
  });

  it('유효하지 않은 URL이면 false', () => {
    expect(isValidImageUrl('not-a-url')).toBe(false);
    expect(isValidImageUrl('')).toBe(false);
    expect(isValidImageUrl(undefined)).toBe(false);
    expect(isValidImageUrl(null)).toBe(false);
  });
});
