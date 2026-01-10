/**
 * 접근성(a11y) 자동화 테스트
 *
 * WCAG 2.1 AA 준수 검증을 위한 axe-core 기반 테스트
 * vitest-axe를 사용하여 컴포넌트별 접근성 위반 사항 검사
 */
/// <reference types="vitest-axe/extend-expect" />
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import type { AxeResults } from 'axe-core';
import { axe } from 'vitest-axe';
import * as matchers from 'vitest-axe/matchers';

// vitest-axe matcher 확장
expect.extend(matchers);

// 타입 선언: toHaveNoViolations 매처
declare module 'vitest' {
  interface Assertion<T> {
    toHaveNoViolations(): void;
  }
}

// 테스트 대상 컴포넌트
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { SkipLink } from '@/components/common/SkipLink';

describe('접근성 테스트', () => {
  describe('Button 컴포넌트', () => {
    it('기본 버튼에 접근성 위반이 없어야 한다', async () => {
      const { container } = render(<Button>클릭</Button>);
      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });

    it('비활성화된 버튼에 aria-disabled가 있어야 한다', () => {
      render(<Button disabled>비활성화</Button>);
      const button = screen.getByRole('button');
      expect(button).toHaveAttribute('aria-disabled', 'true');
      expect(button).toBeDisabled();
    });

    it('다양한 variant에서 접근성 위반이 없어야 한다', async () => {
      const { container } = render(
        <div>
          <Button variant="default">기본</Button>
          <Button variant="destructive">삭제</Button>
          <Button variant="outline">외곽선</Button>
          <Button variant="secondary">보조</Button>
          <Button variant="ghost">고스트</Button>
          <Button variant="link">링크</Button>
        </div>
      );
      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });
  });

  describe('Input 컴포넌트', () => {
    it('기본 입력 필드에 접근성 위반이 없어야 한다', async () => {
      const { container } = render(
        <div>
          <label htmlFor="test-input">테스트 입력</label>
          <Input id="test-input" />
        </div>
      );
      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });

    it('aria-describedby로 도움말 연결이 가능해야 한다', async () => {
      const { container } = render(
        <div>
          <label htmlFor="email">이메일</label>
          <Input id="email" aria-describedby="email-hint" />
          <p id="email-hint">알림을 받을 이메일을 입력하세요</p>
        </div>
      );

      const input = screen.getByLabelText('이메일');
      expect(input).toHaveAttribute('aria-describedby', 'email-hint');

      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });

    it('aria-invalid로 오류 상태를 표시할 수 있어야 한다', () => {
      render(
        <div>
          <label htmlFor="invalid-input">오류 입력</label>
          <Input id="invalid-input" aria-invalid={true} />
        </div>
      );

      const input = screen.getByLabelText('오류 입력');
      expect(input).toHaveAttribute('aria-invalid', 'true');
    });
  });

  describe('Tabs 컴포넌트', () => {
    it('탭에 접근성 위반이 없어야 한다', async () => {
      const { container } = render(
        <Tabs defaultValue="tab1">
          <TabsList aria-label="분석 결과 탭">
            <TabsTrigger value="tab1">개요</TabsTrigger>
            <TabsTrigger value="tab2">상세</TabsTrigger>
          </TabsList>
          <TabsContent value="tab1">개요 내용</TabsContent>
          <TabsContent value="tab2">상세 내용</TabsContent>
        </Tabs>
      );
      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });

    it('TabsList에 aria-label을 전달할 수 있어야 한다', () => {
      render(
        <Tabs defaultValue="tab1">
          <TabsList aria-label="결과 탭 메뉴">
            <TabsTrigger value="tab1">탭1</TabsTrigger>
          </TabsList>
          <TabsContent value="tab1">내용</TabsContent>
        </Tabs>
      );

      const tablist = screen.getByRole('tablist');
      expect(tablist).toHaveAttribute('aria-label', '결과 탭 메뉴');
    });

    it('선택된 탭에 aria-selected가 true여야 한다', () => {
      render(
        <Tabs defaultValue="tab1">
          <TabsList>
            <TabsTrigger value="tab1">탭1</TabsTrigger>
            <TabsTrigger value="tab2">탭2</TabsTrigger>
          </TabsList>
          <TabsContent value="tab1">내용1</TabsContent>
          <TabsContent value="tab2">내용2</TabsContent>
        </Tabs>
      );

      const tabs = screen.getAllByRole('tab');
      expect(tabs[0]).toHaveAttribute('aria-selected', 'true');
      expect(tabs[1]).toHaveAttribute('aria-selected', 'false');
    });
  });

  describe('Dialog 컴포넌트', () => {
    it('Dialog에 접근성 위반이 없어야 한다', async () => {
      const { container } = render(
        <Dialog open>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>테스트 다이얼로그</DialogTitle>
              <DialogDescription>다이얼로그 설명입니다.</DialogDescription>
            </DialogHeader>
            <p>다이얼로그 내용</p>
          </DialogContent>
        </Dialog>
      );
      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });

    it('닫기 버튼에 한국어 접근성 라벨이 있어야 한다', () => {
      render(
        <Dialog open>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>제목</DialogTitle>
              <DialogDescription>설명</DialogDescription>
            </DialogHeader>
          </DialogContent>
        </Dialog>
      );

      // sr-only 텍스트로 "닫기"가 있어야 함
      expect(screen.getByText('닫기')).toBeInTheDocument();
    });
  });

  describe('SkipLink 컴포넌트', () => {
    it('SkipLink에 접근성 위반이 없어야 한다', async () => {
      const { container } = render(
        <div>
          <SkipLink />
          <main id="main-content">본문 내용</main>
        </div>
      );
      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });

    it('본문으로 건너뛰기 링크가 존재해야 한다', () => {
      render(<SkipLink />);
      const link = screen.getByTestId('skip-link');
      expect(link).toHaveAttribute('href', '#main-content');
      expect(link).toHaveTextContent('본문으로 건너뛰기');
    });

    it('기본적으로 화면에서 숨겨져 있어야 한다', () => {
      render(<SkipLink />);
      const link = screen.getByTestId('skip-link');
      // sr-only 클래스 적용 확인
      expect(link).toHaveClass('sr-only');
    });
  });

  describe('조합 테스트', () => {
    it('폼 요소 조합에서 접근성 위반이 없어야 한다', async () => {
      const { container } = render(
        <form>
          <div>
            <label htmlFor="name">이름</label>
            <Input id="name" aria-describedby="name-hint" />
            <p id="name-hint">실명을 입력해주세요</p>
          </div>
          <div>
            <label htmlFor="email">이메일</label>
            <Input id="email" type="email" aria-describedby="email-hint" />
            <p id="email-hint">알림을 받을 이메일</p>
          </div>
          <Button type="submit">제출</Button>
        </form>
      );
      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });
  });
});
