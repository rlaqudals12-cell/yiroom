import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: '퍼스널 컬러 진단',
  description: 'AI 기반 퍼스널 컬러 진단 - 나에게 어울리는 봄/여름/가을/겨울 컬러를 찾아보세요',
  keywords: ['퍼스널컬러', '봄웜', '여름쿨', '가을웜', '겨울쿨', 'AI진단'],
  openGraph: {
    title: '퍼스널 컬러 진단 | 이룸',
    description: 'AI로 나만의 퍼스널 컬러를 찾아보세요',
  },
};

export default function PersonalColorLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
