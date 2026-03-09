import type { Metadata } from 'next';
import { generateAnalysisMetadata, ORAL_HEALTH_META } from '@/lib/analysis/metadata';

interface LayoutProps {
  children: React.ReactNode;
  params: Promise<{ id: string }>;
}

export async function generateMetadata({ params }: LayoutProps): Promise<Metadata> {
  const { id } = await params;
  return generateAnalysisMetadata(id, ORAL_HEALTH_META);
}

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
