/**
 * 저장된 5축 분석 결과 화면의 단일 목적지 계약.
 *
 * 분석 이력과 홈 완료 카드가 서로 다른 방식으로 경로를 조립하면 완료 축이 다시
 * 분석 시작 화면으로 떨어질 수 있다. 두 진입점 모두 정확한 historyId를 같은 형태로
 * 전달하고, 목적지 화면은 stored-result-loader로 해당 행을 읽는다.
 */
import type { StoredAnalysisAxis } from './stored-result-loader';

const STORED_RESULT_PATHS: Record<StoredAnalysisAxis, string> = {
  'personal-color': '/(analysis)/personal-color/result',
  skin: '/(analysis)/skin/result',
  body: '/(analysis)/body/result',
  hair: '/(analysis)/hair/result',
  makeup: '/(analysis)/makeup/result',
};

export interface StoredResultDestination {
  pathname: string;
  params: { historyId: string };
}

export function buildStoredResultDestination(
  axis: StoredAnalysisAxis,
  historyId: string
): StoredResultDestination {
  return {
    pathname: STORED_RESULT_PATHS[axis],
    params: { historyId },
  };
}
