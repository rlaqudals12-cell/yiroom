/**
 * 본문 건너뛰기 링크 컴포넌트
 *
 * 키보드 사용자가 반복적인 네비게이션 요소를 건너뛰고
 * 바로 본문 콘텐츠로 이동할 수 있도록 합니다.
 * WCAG 2.1 AA 2.4.1 (블록 건너뛰기) 준수
 */
export function SkipLink() {
  return (
    <a
      href="#main-content"
      className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-50 focus:px-4 focus:py-2 focus:bg-background focus:text-foreground focus:rounded-md focus:shadow-lg focus:outline-none focus:ring-2 focus:ring-ring"
      data-testid="skip-link"
    >
      본문으로 건너뛰기
    </a>
  );
}
