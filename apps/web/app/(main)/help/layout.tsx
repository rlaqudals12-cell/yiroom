import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: '도움말',
  description: '이룸 사용 가이드와 자주 묻는 질문을 확인하세요',
  keywords: ['도움말', 'FAQ', '사용가이드', '문의'],
  openGraph: {
    title: '도움말 | 이룸',
    description: '이룸 도움말 센터',
  },
};

export default function HelpLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
