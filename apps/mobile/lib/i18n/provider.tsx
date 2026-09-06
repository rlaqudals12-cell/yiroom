import { type ReactNode, useEffect, useState } from 'react';
import { I18nextProvider } from 'react-i18next';

import { i18n, initI18n } from './index';

interface MobileI18nProviderProps {
  children: ReactNode;
}

/** 저장된 locale을 확정한 뒤에만 화면 트리를 열어 첫 프레임 언어 튐을 막는다. */
export function MobileI18nProvider({ children }: MobileI18nProviderProps) {
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    let isMounted = true;

    void initI18n().finally(() => {
      if (isMounted) setIsReady(true);
    });

    return () => {
      isMounted = false;
    };
  }, []);

  if (!isReady) return null;

  return <I18nextProvider i18n={i18n}>{children}</I18nextProvider>;
}
