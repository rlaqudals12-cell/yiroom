/**
 * DailyBriefing 렌더 테스트 (ADR-114)
 * 브리핑 레터 + 오늘의 실행 3개 + 물어보기 인풋을 렌더하고,
 * 질문 제출 시 /coach?q= 로 이동한다.
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';

const pushMock = vi.fn();
// "기억한다" 화법 입력은 fetch(제품함·캡슐 API)로 로드 — 기본은 빈 응답(미주입)
const fetchMock = vi.fn();

vi.mock('@clerk/nextjs', () => ({
  useUser: () => ({ user: { id: 'u1', firstName: '지민', username: null } }),
}));
vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: pushMock }),
}));
// 날씨/인사이트는 부작용 훅 — 기본은 비어있는 결과로 stub (레터 문장은 분석 데이터로 생성)
const weatherMocks = vi.hoisted(() => ({
  getCurrentWeather: vi.fn(),
  getWeatherWithGeolocation: vi.fn(),
  generateEnvironmentAdvice: vi.fn(),
}));
vi.mock('@/lib/weather', () => weatherMocks);
vi.mock('@/lib/insights', () => ({
  generateInsights: () => ({ insights: [] }),
  analysisToDataBundle: () => ({}),
}));
vi.mock('@/app/(main)/home/_components/HomeDailyCapsuleWidget', () => ({
  default: () => <div data-testid="home-daily-capsule" />,
}));
vi.mock('@/app/(main)/home/_components/IntegratedSessionPromptCard', () => ({
  IntegratedSessionPromptCard: () => <div data-testid="integrated-session-prompt-card" />,
}));

import DailyBriefing from '@/app/(main)/home/_components/DailyBriefing';
import type { AnalysisSummary } from '@/hooks/useAnalysisStatus';

const analyses = [
  {
    id: '1',
    type: 'skin',
    createdAt: new Date(),
    summary: '80점',
    skinScore: 80,
    skinDelta: 2,
    skinTrend: 'up',
  },
  { id: '2', type: 'personal-color', createdAt: new Date(), summary: '봄 웜톤' },
] as AnalysisSummary[];

// 베스트 컬러가 있는 PC 분석(나의 컬러/오늘의 배색 시각화용)
const analysesWithColors = [
  {
    id: 'pc-9',
    type: 'personal-color',
    createdAt: new Date(),
    summary: '봄 웜톤',
    bestColors: [
      { name: '코랄', hex: '#FF7F50' },
      { name: '골드', hex: '#FFD700' },
      { name: '오렌지', hex: '#FFA500' },
    ],
  },
] as AnalysisSummary[];

/** 날씨 응답 팩토리 — lib/weather의 WeatherData 형태(강수는 mm, 좌표 출처 포함) */
function createWeather(overrides: Record<string, unknown> = {}) {
  return {
    temp: 22,
    precipitationMm: 0,
    precipitation: 0,
    condition: '맑음',
    uvIndex: 3,
    humidity: 50,
    locationSource: 'default',
    ...overrides,
  };
}

describe('DailyBriefing', () => {
  beforeEach(() => {
    pushMock.mockClear();
    fetchMock.mockReset();
    // 기본: 제품함/캡슐 비어 있음 → 화법 미주입(기존 렌더 단언에 영향 없음)
    fetchMock.mockResolvedValue({ ok: true, json: async () => ({}) });
    vi.stubGlobal('fetch', fetchMock);
    // 날씨 기본값: 조회 실패(null) → 팁 미주입
    weatherMocks.getCurrentWeather.mockReset().mockResolvedValue(null);
    weatherMocks.getWeatherWithGeolocation.mockReset().mockResolvedValue(null);
    weatherMocks.generateEnvironmentAdvice.mockReset().mockReturnValue({ skin: [], fashion: [] });
    // 위치 동의 플래그·30분 날씨 캐시는 테스트 간 누수 금지
    localStorage.clear();
    sessionStorage.clear();
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('브리핑 레터와 인사말을 렌더한다', () => {
    render(<DailyBriefing analyses={analyses} />);
    expect(screen.getByTestId('home-daily-briefing')).toBeInTheDocument();
    expect(screen.getByTestId('briefing-letter')).toBeInTheDocument();
    expect(screen.getByText(/지민님/)).toBeInTheDocument();
  });

  it('오늘의 실행 3개(루틴·스타일·내 상태)를 렌더한다', () => {
    render(<DailyBriefing analyses={analyses} />);
    expect(screen.getByTestId('briefing-routine')).toBeInTheDocument();
    expect(screen.getByTestId('briefing-style')).toBeInTheDocument();
    expect(screen.getByTestId('briefing-status')).toBeInTheDocument();
    expect(screen.getByTestId('home-daily-capsule')).toBeInTheDocument();
  });

  it('피부 추이 칩을 표시한다', () => {
    render(<DailyBriefing analyses={analyses} />);
    expect(screen.getByTestId('skin-trend-chip')).toBeInTheDocument();
  });

  it('질문을 입력해 제출하면 /coach?q= 로 이동한다', () => {
    render(<DailyBriefing analyses={analyses} />);
    const input = screen.getByTestId('briefing-ask-input');
    fireEvent.change(input, { target: { value: '뭐 입지?' } });
    fireEvent.submit(input.closest('form')!);
    expect(pushMock).toHaveBeenCalledWith(`/coach?q=${encodeURIComponent('뭐 입지?')}`);
  });

  it('빈 질문이면 /coach 로 이동한다', () => {
    render(<DailyBriefing analyses={analyses} />);
    fireEvent.submit(screen.getByTestId('briefing-ask-input').closest('form')!);
    expect(pushMock).toHaveBeenCalledWith('/coach');
  });

  it('최신 통합 결과 링크(IntegratedSessionPromptCard)를 렌더한다', () => {
    render(<DailyBriefing analyses={analyses} />);
    expect(screen.getByTestId('integrated-session-prompt-card')).toBeInTheDocument();
  });

  // 다이어리 추적 IA 진입 — 피부 분석이 있으면 홈 브리핑에서 피부 일기로 유도(재측정 링크)
  it('피부 분석이 있으면 "내 상태"에 피부 일기 진입 링크를 렌더한다', () => {
    render(<DailyBriefing analyses={analyses} />);
    const link = screen.getByTestId('briefing-skin-diary-link');
    expect(link).toHaveAttribute('href', '/analysis/skin/diary');
  });

  it('피부 분석이 없으면 피부 일기 진입 링크를 렌더하지 않는다', () => {
    // analysesWithColors: PC만 있고 skin 없음 → 링크 미노출(빈 상태 유도는 다이어리 페이지가 담당)
    render(<DailyBriefing analyses={analysesWithColors} />);
    expect(screen.queryByTestId('briefing-skin-diary-link')).not.toBeInTheDocument();
  });

  it('PC 베스트 컬러가 있으면 "나의 컬러" 스와치 행을 렌더하고 PC 결과로 링크한다', () => {
    render(<DailyBriefing analyses={analysesWithColors} />);
    const section = screen.getByTestId('briefing-my-colors');
    expect(section).toBeInTheDocument();
    // 스와치 개수 = 팔레트 색 수, 각 스와치 title=색이름
    // 표시 순서는 명도(L*) 내림차순 — 골드(L*86.9)가 맨 앞
    const swatches = screen.getAllByTestId('briefing-color-swatch');
    expect(swatches).toHaveLength(3);
    expect(swatches[0]).toHaveAttribute('title', '골드');
    // 행 전체가 PC 결과 페이지로 링크
    expect(section.querySelector('a')).toHaveAttribute(
      'href',
      '/analysis/personal-color/result/pc-9'
    );
  });

  it('PC 베스트 컬러가 없으면 "나의 컬러" 스와치 행을 렌더하지 않는다', () => {
    render(<DailyBriefing analyses={analyses} />);
    expect(screen.queryByTestId('briefing-my-colors')).not.toBeInTheDocument();
  });

  it('베스트 컬러가 있으면 오늘의 스타일에 배색 블록(상의·하의·신발·가방·포인트) 5개를 렌더한다', () => {
    render(<DailyBriefing analyses={analysesWithColors} />);
    expect(screen.getByTestId('briefing-outfit-palette')).toBeInTheDocument();
    expect(screen.getAllByTestId('briefing-outfit-block')).toHaveLength(5);
  });

  // 범례 정렬 수리: 좁은 세그먼트(13%)는 역할만 — 색 이름은 폭이 넉넉한 3칸에만 붙는다
  it('범례 색 이름은 폭 15% 이상 세그먼트에만 표시한다(상의·하의·가방)', () => {
    render(<DailyBriefing analyses={analysesWithColors} />);
    const names = screen.getAllByTestId('briefing-outfit-name');
    expect(names).toHaveLength(3);
    // 상의는 진단된 원본 이름 중 하나(코랄/골드/오렌지), 파생 블록엔 '계열' 표기가 존재
    expect(names.some((n) => /계열/.test(n.textContent ?? ''))).toBe(true);
  });

  // 범례는 세그먼트 폭에 맞춰 배치(wrap 나열이면 어느 색의 이름인지 못 읽음)
  it('범례 셀 폭이 대응 세그먼트 폭과 같다', () => {
    render(<DailyBriefing analyses={analysesWithColors} />);
    const blockWidths = (screen.getAllByTestId('briefing-outfit-block') as HTMLElement[]).map(
      (el) => parseFloat(el.style.width)
    );
    const legendCells = Array.from(
      screen.getByTestId('briefing-outfit-palette').querySelectorAll('div[aria-hidden] > span')
    ) as HTMLElement[];
    expect(legendCells.map((el) => parseFloat(el.style.width))).toEqual(blockWidths);
  });

  // 접근성: 밴드는 그림 1개(role=img) + 라벨 1개 — 색면마다 aria-label을 걸면 소음이 된다
  it('배색 밴드를 role="img" + 단일 aria-label로 읽어준다(색 이름 5개 모두 포함)', () => {
    render(<DailyBriefing analyses={analysesWithColors} />);
    const band = screen.getByRole('img', { name: /오늘의 배색/ });
    const label = band.getAttribute('aria-label') ?? '';
    for (const role of ['상의', '하의', '가방', '포인트', '신발']) {
      expect(label).toContain(role);
    }
    // 색면(세그먼트)에는 개별 aria-label이 남아 있지 않다
    const blocks = screen.getAllByTestId('briefing-outfit-block');
    expect(blocks.every((el) => !el.hasAttribute('aria-label'))).toBe(true);
    // 경계 링 — 흰 카드에서 밝은 색면이 배경에 녹지 않게
    expect(band.className).toContain('ring-1');
  });

  // 퍼스널컬러 밴드도 같은 계약(경계 링 + 그림 1개)
  it('퍼스널컬러 밴드도 role="img" + 경계 링을 갖는다', () => {
    render(<DailyBriefing analyses={analysesWithColors} />);
    const band = screen.getByRole('img', { name: /나의 퍼스널컬러 팔레트/ });
    expect(band.className).toContain('ring-1');
    expect(
      screen.getAllByTestId('briefing-color-swatch').every((el) => !el.hasAttribute('aria-label'))
    ).toBe(true);
  });

  // 포인트 6%→13% 상향(지각 한계 미만 수리) — 합 100% 유지
  it('배색 바 폭 합은 100%이고 포인트 블록은 13%다', () => {
    render(<DailyBriefing analyses={analysesWithColors} />);
    const blocks = screen.getAllByTestId('briefing-outfit-block') as HTMLElement[];
    const widths = blocks.map((el) => parseFloat(el.style.width));
    expect(widths.reduce((sum, w) => sum + w, 0)).toBe(100);
    const point = blocks.find((el) => el.getAttribute('title')?.startsWith('포인트'))!;
    expect(parseFloat(point.style.width)).toBe(13);
  });

  it('베스트 컬러가 없으면 배색 블록 없이 오늘의 스타일 카드만 렌더한다', () => {
    render(<DailyBriefing analyses={analyses} />);
    expect(screen.getByTestId('briefing-style')).toBeInTheDocument();
    expect(screen.queryByTestId('briefing-outfit-palette')).not.toBeInTheDocument();
  });

  // ADR-117 수리: 라벨 정정 + 색 이름 표시
  it('"나의 퍼스널컬러" 라벨을 렌더한다', () => {
    render(<DailyBriefing analyses={analysesWithColors} />);
    expect(screen.getByText('나의 퍼스널컬러')).toBeInTheDocument();
  });

  it('베스트 컬러 이름을 스와치 아래에 표시한다(표시 순서=명도 내림차순)', () => {
    render(<DailyBriefing analyses={analysesWithColors} />);
    const names = screen.getAllByTestId('briefing-color-name');
    expect(names).toHaveLength(3);
    expect(names[0]).toHaveTextContent('골드');
  });

  // 회청 일색 수리 — 밴드를 명도 그라데이션으로 표시(진단 hex·데이터는 불변, 표시 순서만)
  it('스와치 밴드를 명도(L*) 내림차순으로 정렬해 표시한다', () => {
    render(<DailyBriefing analyses={analysesWithColors} />);
    const titles = screen
      .getAllByTestId('briefing-color-swatch')
      .map((el) => el.getAttribute('title'));
    // 골드 L*86.9 > 오렌지 L*74.9 > 코랄 L*67.3 (원본 배열 순서: 코랄·골드·오렌지)
    expect(titles).toEqual(['골드', '오렌지', '코랄']);
    // 이름 행도 같은 정렬을 따른다(스와치와 1:1 정합)
    const nameOrder = screen
      .getAllByTestId('briefing-color-name')
      .map((el) => el.textContent?.trim());
    expect(nameOrder).toEqual(['골드', '오렌지', '코랄']);
  });

  it('스와치 이름은 잘림(truncate)이 아니라 온전히 읽히게 렌더한다', () => {
    render(<DailyBriefing analyses={analysesWithColors} />);
    const name = screen.getAllByTestId('briefing-color-name')[0];
    // truncate(한 줄 말줄임) 대신 2줄 허용(line-clamp-2)로 가독 확보
    expect(name.className).not.toContain('truncate');
    expect(name.className).toContain('line-clamp-2');
  });

  // ADR-114 화법 4요소 "기억한다" — 제품함 후속·오늘 캡슐 우선을 브리핑에 반영(모바일 정합)
  it('제품함·오늘 캡슐 데이터가 있으면 "기억한다" 화법을 반영한다', async () => {
    fetchMock.mockImplementation((url: string) => {
      const u = String(url);
      if (u.includes('/api/scan/shelf')) {
        return Promise.resolve({
          ok: true,
          json: async () => ({
            items: [{ productName: '수분 앰플', scannedAt: new Date().toISOString() }],
          }),
        });
      }
      if (u.includes('/api/capsule/daily')) {
        return Promise.resolve({
          ok: true,
          json: async () => ({
            data: { items: [{ name: '약산성 클렌저', reason: '장벽 회복 중' }] },
          }),
        });
      }
      return Promise.resolve({ ok: true, json: async () => ({}) });
    });

    // 피부 추이 없는 분석(관찰 우선순위상 제품함 후속이 관찰로 노출)
    render(<DailyBriefing analyses={analysesWithColors} />);

    // 제품함 후속(관찰) + 캡슐 우선(조언)이 화법에 등장
    expect(await screen.findByText(/수분 앰플/)).toBeInTheDocument();
    expect(await screen.findByText(/약산성 클렌저/)).toBeInTheDocument();
  });

  // 폐루프 v1(고객 노트) — 미응답 후속 질문에 응답 버튼을 달고, 답하면 rating을 저장한다
  it('제품함 후속(미응답)이면 응답 버튼을 렌더하고, "잘 맞아요"면 rating을 저장한다', async () => {
    const putCalls: Array<{ url: string; body: { rating?: number } }> = [];
    fetchMock.mockImplementation((url: string, init?: RequestInit) => {
      const u = String(url);
      if (u.includes('/api/scan/shelf/') && init?.method === 'PUT') {
        putCalls.push({ url: u, body: JSON.parse(String(init.body)) });
        return Promise.resolve({ ok: true, json: async () => ({}) });
      }
      if (u.includes('/api/scan/shelf')) {
        return Promise.resolve({
          ok: true,
          json: async () => ({
            items: [
              { id: 'shelf-77', productName: '수분 앰플', scannedAt: new Date().toISOString() },
            ],
          }),
        });
      }
      return Promise.resolve({ ok: true, json: async () => ({}) });
    });

    render(<DailyBriefing analyses={analysesWithColors} />);

    // 후속 질문 + 응답 버튼 등장
    expect(await screen.findByTestId('shelf-feedback-actions')).toBeInTheDocument();
    fireEvent.click(screen.getByTestId('shelf-feedback-positive'));

    // 낙관적 "기억해둘게요" 확인 + 버튼 사라짐
    expect(await screen.findByTestId('shelf-feedback-ack')).toBeInTheDocument();
    expect(screen.queryByTestId('shelf-feedback-actions')).not.toBeInTheDocument();

    // 기존 rating 경로(PUT)로 긍정 값 저장
    await waitFor(() => expect(putCalls).toHaveLength(1));
    expect(putCalls[0].url).toContain('/api/scan/shelf/shelf-77');
    expect(putCalls[0].body.rating).toBe(5);
  });

  it('"글쎄요"면 부정 rating을 저장한다', async () => {
    const putCalls: Array<{ body: { rating?: number } }> = [];
    fetchMock.mockImplementation((url: string, init?: RequestInit) => {
      const u = String(url);
      if (u.includes('/api/scan/shelf/') && init?.method === 'PUT') {
        putCalls.push({ body: JSON.parse(String(init.body)) });
        return Promise.resolve({ ok: true, json: async () => ({}) });
      }
      if (u.includes('/api/scan/shelf')) {
        return Promise.resolve({
          ok: true,
          json: async () => ({
            items: [
              { id: 'shelf-88', productName: '수분 앰플', scannedAt: new Date().toISOString() },
            ],
          }),
        });
      }
      return Promise.resolve({ ok: true, json: async () => ({}) });
    });

    render(<DailyBriefing analyses={analysesWithColors} />);
    fireEvent.click(await screen.findByTestId('shelf-feedback-negative'));
    await waitFor(() => expect(putCalls).toHaveLength(1));
    expect(putCalls[0].body.rating).toBe(2);
  });

  it('제품함 후속에 이전 응답(rating)이 있으면 회고만 하고 버튼을 렌더하지 않는다', async () => {
    fetchMock.mockImplementation((url: string) => {
      const u = String(url);
      if (u.includes('/api/scan/shelf')) {
        return Promise.resolve({
          ok: true,
          json: async () => ({
            items: [
              {
                id: 'shelf-9',
                productName: '수분 앰플',
                rating: 5,
                scannedAt: new Date().toISOString(),
                updatedAt: new Date().toISOString(),
              },
            ],
          }),
        });
      }
      return Promise.resolve({ ok: true, json: async () => ({}) });
    });

    render(<DailyBriefing analyses={analysesWithColors} />);
    // 회고 문장(긍정)만 노출, 응답 버튼은 없음
    expect(await screen.findByText(/잘 맞는다고/)).toBeInTheDocument();
    expect(screen.queryByTestId('shelf-feedback-actions')).not.toBeInTheDocument();
  });

  // ── 명칭 통일: 목적지(/closet/recommend h1)와 같은 말을 쓴다 ──
  it('섹션 제목은 "오늘의 코디"다(목적지 h1과 일치)', () => {
    render(<DailyBriefing analyses={analysesWithColors} />);
    expect(screen.getByRole('heading', { name: '오늘의 코디' })).toBeInTheDocument();
    expect(screen.queryByText('오늘의 스타일')).not.toBeInTheDocument();
  });

  // ── 캡션 병렬화: 날씨 팁이 배색 설명을 덮어쓰지 않는다(이전엔 fashionTip ?? 배색설명) ──
  it('날씨 팁이 있어도 배색 캡션을 함께 보여준다(2줄 병렬)', async () => {
    weatherMocks.getCurrentWeather.mockResolvedValue(createWeather({ precipitationMm: 1 }));
    weatherMocks.generateEnvironmentAdvice.mockReturnValue({
      skin: ['보습 강화 필요'],
      fashion: ['지금 비가 내리고 있어요 — 우산을 챙기세요'],
    });

    render(<DailyBriefing analyses={analysesWithColors} />);

    // 날씨 팁(아이콘 행)
    expect(await screen.findByTestId('briefing-weather-tip')).toHaveTextContent('우산');
    // 배색 캡션(밴드 소속) — 면적 비율 의도를 말로 전달
    const caption = screen.getByTestId('briefing-outfit-caption');
    expect(caption).toHaveTextContent('착장 면적 비율');
    // 개수는 실제 렌더 세그먼트에서 센다(뉴트럴=신발 1칸)
    expect(caption).toHaveTextContent('4색');
    expect(caption).toHaveTextContent('뉴트럴 1색');
  });

  // ── 위치 정직화: 동의 전에는 서울 기본 좌표 + "서울 기준" 고지 ──
  it('위치 동의가 없으면 서울 기본 좌표로 조회하고 "서울 기준"을 밝힌다', async () => {
    weatherMocks.getCurrentWeather.mockResolvedValue(createWeather());
    weatherMocks.generateEnvironmentAdvice.mockReturnValue({
      skin: [],
      fashion: ['쾌적한 날씨 — 자유로운 스타일링 가능'],
    });

    render(<DailyBriefing analyses={analysesWithColors} />);

    expect(await screen.findByTestId('briefing-weather-location')).toHaveTextContent('서울 기준');
    expect(weatherMocks.getCurrentWeather).toHaveBeenCalled();
    // 동의 없이 브라우저 위치 권한을 요청하지 않는다(홈에 새 동의 UI도 만들지 않는다)
    expect(weatherMocks.getWeatherWithGeolocation).not.toHaveBeenCalled();
  });

  it('코디 페이지에서 이미 위치에 동의했으면 실제 위치로 조회하고 "서울 기준"을 붙이지 않는다', async () => {
    localStorage.setItem('location_consent', 'granted');
    weatherMocks.getWeatherWithGeolocation.mockResolvedValue(
      createWeather({ locationSource: 'geolocation' })
    );
    weatherMocks.generateEnvironmentAdvice.mockReturnValue({
      skin: [],
      fashion: ['쾌적한 날씨 — 자유로운 스타일링 가능'],
    });

    render(<DailyBriefing analyses={analysesWithColors} />);

    await waitFor(() => expect(weatherMocks.getWeatherWithGeolocation).toHaveBeenCalledTimes(1));
    expect(weatherMocks.getCurrentWeather).not.toHaveBeenCalled();
    await waitFor(() =>
      expect(screen.getByTestId('briefing-weather-tip')).toHaveTextContent('쾌적한 날씨')
    );
    expect(screen.queryByTestId('briefing-weather-location')).not.toBeInTheDocument();
  });

  it('날씨를 못 받으면 위치 고지 없이 기본 안내만 보여준다', async () => {
    render(<DailyBriefing analyses={analysesWithColors} />);

    await waitFor(() => expect(weatherMocks.getCurrentWeather).toHaveBeenCalled());
    expect(screen.getByTestId('briefing-weather-tip')).toHaveTextContent(
      '오늘 날씨와 내 체형에 맞는 코디를 골라줄게요'
    );
    expect(screen.queryByTestId('briefing-weather-location')).not.toBeInTheDocument();
  });
});
