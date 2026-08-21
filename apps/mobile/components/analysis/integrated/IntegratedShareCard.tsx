import { useAuth } from '@clerk/clerk-expo';
import { useEffect, useMemo, useState } from 'react';

import { PersonaShareSection } from '@/components/share';
import { fetchIssueNo } from '@/lib/api';
import type { IntegratedAnalysisResult } from '@/lib/api';
import { resolvePersonaCardData } from '@/lib/share/card-data';

export interface IntegratedShareCardProps {
  result: IntegratedAnalysisResult;
}

/** 서버가 발급한 번호만 붙이고, 조회 실패 시 번호 없이 E+ 카드를 유지한다. */
export function IntegratedShareCard({
  result,
}: IntegratedShareCardProps): React.JSX.Element | null {
  const { getToken } = useAuth();
  const cardData = useMemo(() => resolvePersonaCardData(result), [result]);
  const [serialNo, setSerialNo] = useState<number | null>(null);

  useEffect(() => {
    if (!cardData) return;
    let cancelled = false;

    void getToken()
      .catch(() => null)
      .then((token) => fetchIssueNo(token, result.sessionId))
      .then((issueNo) => {
        if (!cancelled) setSerialNo(issueNo);
      });

    return () => {
      cancelled = true;
    };
    // Clerk getToken 참조는 렌더마다 바뀔 수 있어 세션 단위로만 발급 번호를 조회한다.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cardData, result.sessionId]);

  if (!cardData) return null;

  return <PersonaShareSection analysisType="integrated" data={cardData} serialNo={serialNo} />;
}
