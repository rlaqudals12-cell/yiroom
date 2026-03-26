'use client';

import dynamic from 'next/dynamic';

// sonner Toaster를 dynamic import하여 초기 번들에서 ~15KB 제거
const Toaster = dynamic(() => import('sonner').then((mod) => ({ default: mod.Toaster })), {
  ssr: false,
});

export function DynamicToaster(): React.JSX.Element {
  return (
    <Toaster
      position="top-center"
      theme="system"
      toastOptions={{
        classNames: {
          toast: 'bg-card border border-border text-foreground shadow-lg',
          title: 'text-foreground font-medium',
          description: 'text-muted-foreground',
          success: '!bg-status-success/10 !border-status-success/30 !text-status-success',
          error: '!bg-status-error/10 !border-status-error/30 !text-status-error',
          warning: '!bg-status-warning/10 !border-status-warning/30 !text-status-warning',
          info: '!bg-primary/10 !border-primary/30 !text-primary',
        },
      }}
    />
  );
}
