import type { Metadata } from 'next';
import { generateAnalysisMetadata, POSTURE_META } from '@/lib/analysis/metadata';

interface LayoutProps {
  children: React.ReactNode;
  params: Promise<{ id: string }>;
}

export async function generateMetadata({ params }: LayoutProps): Promise<Metadata> {
  const { id } = await params;
  return generateAnalysisMetadata(id, POSTURE_META);
}

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
