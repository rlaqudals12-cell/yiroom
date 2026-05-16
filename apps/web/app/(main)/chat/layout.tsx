import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'AI 코치',
  description: 'AI 코치와 대화하며 퍼스널컬러·피부·체형·헤어·메이크업 맞춤 조언을 받으세요',
  keywords: ['AI코치', '뷰티상담', '퍼스널컬러', '피부상담', '스타일조언'],
  openGraph: {
    title: 'AI 코치 | 이룸',
    description: 'AI 코치와 대화하기',
  },
};

export default function ChatLayout({ children }: { children: React.ReactNode }) {
  return children;
}
