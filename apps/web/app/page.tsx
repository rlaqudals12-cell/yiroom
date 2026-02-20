import { Suspense } from 'react';

import { LandingContent } from './LandingContent';

export default function Home() {
  return (
    <Suspense>
      <LandingContent />
    </Suspense>
  );
}
