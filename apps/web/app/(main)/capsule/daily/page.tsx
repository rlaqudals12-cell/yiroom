'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useUser } from '@clerk/nextjs';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { toast } from 'sonner';
import {
  CalendarCheck,
  Check,
  Loader2,
  AlertTriangle,
  ArrowLeft,
  Package,
  ShoppingBag,
  ChevronRight,
  Sun,
  Moon,
  Clock,
  type LucideIcon,
} from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
// 코디 색상명 → 색 견본 칩 (클라이언트 파싱 — 배럴(index) 대신 직접 import:
// index.ts가 service-role 등 서버 전용 모듈을 함께 끌고 오는 것 방지)
import { extractSolutionColors } from '@/lib/capsule/solution-colors';
// 시간대 → 활성 그룹 판정 (verdict-first '지금 블록') — 같은 이유로 직접 import
import { getTimeGroupPriority, type CapsuleTimeGroup } from '@/lib/capsule/time-of-day';

// API(/api/capsule/daily) 실제 응답 계약 — types/capsule.ts DailyItem과 동일 형태.
// 기존엔 label/domainId/completed를 기대해 아이템 이름이 전부 빈 카드로 렌더되던 버그.
interface DailyItem {
  id: string;
  moduleCode: string;
  name: string;
  reason?: string;
  isChecked?: boolean;
  timeOfDay?: 'morning' | 'evening' | 'anytime';
  /** 모듈 그룹 개인화 근거 (그룹 첫 아이템에만) — 예: "복합성 피부 맞춤 루틴" */
  groupNote?: string;
  /** 실행 솔루션 한 줄 — 내 진단 데이터 기반 "무엇으로/어떤 색으로" */
  solution?: string;
  /** 솔루션 대응 실제 제품 — 있으면 제품 칩 노출 (출처에 따라 배지/링크 분기) */
  solutionProduct?: {
    id: string;
    name: string;
    brand: string;
    priceKrw?: number;
    imageUrl?: string;
    /**
     * 제품 출처 (ADR-117) — 'shelf'는 내 제품함 보유 제품(id가 user_product_shelf UUID),
     * 'catalog'는 cosmetic_products 추천(id가 화장품 id). 없으면(구 캐시) 미표시.
     */
    source?: 'shelf' | 'catalog';
    /** source가 'shelf'일 때 user_product_shelf 아이템 ID */
    shelfItemId?: string;
  };
}

/** 제품 카탈로그가 존재하는 축 — 매칭이 없을 때 탐색 폴백을 붙인다 */
const PRODUCT_MODULES: ReadonlySet<string> = new Set(['S', 'M', 'H']);

/**
 * 체크 저장 PATCH 바디 — 단수(itemId)는 단건 토글, 복수(itemIds)는 "모두 완료" 배치.
 * 배치가 필요한 이유: 서버가 items JSONB를 통째로 다시 쓰기 때문에 단건 병렬 발사는
 * 마지막 요청만 살아남는다(체크 유실).
 */
type CheckPatchBody =
  | { itemId: string; isChecked: boolean }
  | { itemIds: string[]; isChecked: boolean };

interface DailyCapsule {
  id: string;
  date: string;
  items: DailyItem[];
  /** 전체 루틴 예상 소요 시간(분) — 진행 라인 "약 N분" 표기 */
  estimatedMinutes?: number;
}

const MODULE_NAMES: Record<string, string> = {
  S: '스킨케어',
  Fashion: '코디',
  H: '헤어',
  M: '메이크업',
  PC: '퍼스널 컬러',
  C: '체형',
};

// 시간대 그룹 — 사용자 멘탈 모델(아침 루틴/저녁 루틴)에 맞춘 표시 순서.
// 이모지 대신 라인아트 아이콘(진단지 문법 — PersonaReportCard ROW_ICONS와 동일 레이어)
const TIME_GROUPS: Array<{ key: CapsuleTimeGroup; label: string; icon: LucideIcon }> = [
  { key: 'morning', label: '아침', icon: Sun },
  { key: 'evening', label: '저녁', icon: Moon },
  { key: 'anytime', label: '언제든', icon: Clock },
];

// 시간 섹션 내 모듈 표시 순서 — 실행 순서(스킨케어→메이크업→코디, 저녁은 스킨케어→헤어)
const MODULE_ORDER = ['S', 'M', 'Fashion', 'H', 'C', 'PC'];

/** 그룹 내 아이템을 모듈 클러스터 표시 순서와 동일하게 평탄화 — '첫 미체크' 판정 기준 통일 */
function orderClusterItems(items: DailyItem[]): DailyItem[] {
  return MODULE_ORDER.flatMap((code) => items.filter((item) => item.moduleCode === code));
}

/** 실행 솔루션 1줄 — 코디는 색상명만으론 무슨 색인지 알 수 없어 색 견본 칩 동반 */
function SolutionLine({
  item,
  className,
}: {
  item: DailyItem;
  className?: string;
}): React.ReactElement {
  return (
    <p className={`text-primary/90 ${className ?? ''}`}>
      {item.moduleCode === 'Fashion' &&
        item.solution &&
        extractSolutionColors(item.solution).map((chip) => (
          <span
            key={chip.name}
            className="mr-1 inline-block h-3 w-3 rounded-full border border-black/10 align-[-1px] dark:border-white/20"
            style={{ backgroundColor: chip.hex }}
            title={chip.name}
            aria-label={`${chip.name} 색 견본`}
          />
        ))}
      {item.solution}
    </p>
  );
}

/**
 * 아이템에 붙은 실제 제품 칩 — 출처에 따라 분기 (ADR-117 수용기준).
 *
 * 왜 분기가 필요한가: shelf 제품의 id는 user_product_shelf UUID라 /beauty/{id}로 보내면
 * 존재하지 않는 화장품 상세로 가는 죽은 링크가 된다. 보유 제품은 링크 없는 "내 ○○" 배지로,
 * 카탈로그 제품만 화장품 상세로 잇는다. 출처가 없는 구 캐시 데이터는 표시하지 않는다.
 * 매칭이 없는 스텝은 칩 유무가 들쭉날쭉해 보이지 않도록 탐색 폴백 1줄을 둔다(홈 위젯과 동일).
 */
function SolutionProductChip({ item }: { item: DailyItem }): React.ReactElement | null {
  const product = item.solutionProduct;

  if (product?.source === 'shelf') {
    return (
      <span
        className="mb-2 ml-11 mr-1 inline-flex max-w-[calc(100%-3rem)] items-center gap-1.5 truncate rounded-lg bg-emerald-500/10 px-2.5 py-1.5 text-[11px] font-medium text-emerald-700 dark:text-emerald-300"
        data-testid={`daily-owned-chip-${item.id}`}
        title={`내 ${product.name}`}
      >
        <Package className="h-3.5 w-3.5 shrink-0" />내 {product.name}
      </span>
    );
  }

  if (product?.source === 'catalog') {
    return (
      <Link
        href={`/beauty/${product.id}`}
        className="mb-2 ml-11 mr-1 flex items-center gap-2 rounded-lg bg-slate-50 px-2.5 py-1.5 transition-colors hover:bg-slate-100 dark:bg-slate-800/60 dark:hover:bg-slate-800"
        data-testid={`daily-catalog-chip-${item.id}`}
      >
        <ShoppingBag className="h-3.5 w-3.5 shrink-0 text-emerald-600 dark:text-emerald-400" />
        <span className="min-w-0 flex-1 truncate text-[11px] text-slate-600 dark:text-slate-300">
          <span className="font-medium">{product.brand}</span> {product.name}
        </span>
        {product.priceKrw != null && (
          <span className="shrink-0 text-[11px] font-medium text-slate-500 dark:text-slate-400">
            ₩{product.priceKrw.toLocaleString('ko-KR')}
          </span>
        )}
        <ChevronRight className="h-3 w-3 shrink-0 text-slate-400" />
      </Link>
    );
  }

  if (!product && PRODUCT_MODULES.has(item.moduleCode)) {
    return (
      <Link
        href="/beauty"
        className="mb-2 ml-11 inline-block text-[11px] text-muted-foreground transition-colors hover:text-primary"
        data-testid={`daily-product-fallback-${item.id}`}
      >
        이 단계에 맞는 제품 찾기 →
      </Link>
    );
  }

  return null;
}

/**
 * 아이템 행 — 기본형은 체크+번호+이름 1줄. reason/solution은 자동 펼침(지금 블록 아이템)
 * 또는 행 탭 시 전개. 체크 타깃과 행 탭(펼침) 영역을 분리해 오탭 방지, 둘 다 44px 보장.
 */
function RoutineItemRow({
  item,
  stepNumber,
  isChecked,
  isAutoExpanded,
  expandedOverride,
  onToggleCheck,
  onToggleExpanded,
}: {
  item: DailyItem;
  stepNumber: number | null;
  isChecked: boolean;
  isAutoExpanded: boolean;
  expandedOverride: boolean | undefined;
  onToggleCheck: (itemId: string) => void;
  onToggleExpanded: (itemId: string, autoExpanded: boolean) => void;
}): React.ReactElement {
  const isExpanded = expandedOverride ?? isAutoExpanded;
  const hasDetail = Boolean(item.reason || item.solution);

  return (
    <div className="border-b border-slate-100 dark:border-slate-800 last:border-0">
      <div className="flex items-center">
        {/* 체크 타깃 — 행 탭(펼침)과 분리, 44px 보장 */}
        <button
          type="button"
          onClick={() => onToggleCheck(item.id)}
          aria-label={`${item.name} 완료 체크`}
          // 체크 상태를 보조기술에 전달 — 시각적 체크 표시만으로는 상태를 알 수 없다
          aria-pressed={isChecked}
          className="flex min-h-[44px] w-11 shrink-0 items-center justify-center"
          data-testid={`daily-check-${item.id}`}
        >
          <span
            className={`flex h-5 w-5 items-center justify-center rounded-full border-2 transition-colors ${
              isChecked
                ? 'border-emerald-500 bg-emerald-500'
                : 'border-slate-300 dark:border-slate-600'
            }`}
          >
            {isChecked && <Check className="h-3 w-3 text-white" />}
          </span>
        </button>
        <button
          type="button"
          onClick={() => hasDetail && onToggleExpanded(item.id, isAutoExpanded)}
          className="flex min-h-[44px] min-w-0 flex-1 items-center gap-2 py-2 text-left"
          data-testid={`daily-row-${item.id}`}
        >
          <span className="w-4 shrink-0 text-[11px] text-muted-foreground">{stepNumber ?? ''}</span>
          <p
            className={`min-w-0 flex-1 truncate text-sm ${
              isChecked ? 'line-through text-muted-foreground' : 'font-medium'
            }`}
          >
            {item.name}
          </p>
        </button>
      </div>
      {isExpanded && hasDetail && (
        <div className="pb-2 pl-11 pr-2" data-testid={`daily-detail-${item.id}`}>
          {item.reason && <p className="text-[11px] text-muted-foreground">{item.reason}</p>}
          {item.solution && <SolutionLine item={item} className="text-[11px]" />}
        </div>
      )}
      {/* 솔루션 대응 실제 제품 — 체크 토글(button)과 분리 (보유 배지 / 카탈로그 링크 / 폴백) */}
      <SolutionProductChip item={item} />
    </div>
  );
}

/**
 * Daily Capsule 상세 페이지
 *
 * verdict-first '지금 블록'(활성 시간대의 첫 미체크 히어로) + 접힌 체크리스트 + 완주 상태.
 * 캡슐 엔진·API 계약은 불변 — 프레젠테이션만 재편 (2026-07-25 구세대 섬 전환 Phase 3).
 */
export default function DailyCapsulePage(): React.ReactElement {
  const { isSignedIn, isLoaded } = useUser();
  const router = useRouter();

  const [daily, setDaily] = useState<DailyCapsule | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  // 체크 상태를 로컬로 관리 (낙관적 UI)
  const [checkedItems, setCheckedItems] = useState<Set<string>>(new Set());
  // 행 펼침 수동 오버라이드 — 자동 펼침(활성 그룹 첫 미체크)과 별개로 사용자가 탭한 상태
  const [expandedOverrides, setExpandedOverrides] = useState<Record<string, boolean>>({});
  // 체크 저장 요청 직렬화 큐 — 서버가 items JSONB를 통째로 read-modify-write 하므로
  // 요청이 겹치면 나중 응답이 옛 스냅샷을 덮어써 앞선 체크가 유실된다(빠른 연속 탭).
  // 한 줄로 세워 보내면 각 요청이 직전 저장 결과를 읽는다.
  const patchQueueRef = useRef<Promise<void>>(Promise.resolve());

  /** 체크 저장 PATCH — 큐에 이어 붙여 순차 전송. 성공 여부만 반환(실패 시 호출자가 롤백) */
  const patchChecks = useCallback((capsuleId: string, body: CheckPatchBody): Promise<boolean> => {
    const run = patchQueueRef.current.then(async (): Promise<boolean> => {
      try {
        const res = await fetch(`/api/capsule/daily/${capsuleId}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(body),
        });
        return res.ok;
      } catch {
        return false;
      }
    });
    // 실패해도 큐는 이어져야 한다 (한 번 실패가 이후 저장을 막지 않도록)
    patchQueueRef.current = run.then(
      () => undefined,
      () => undefined
    );
    return run;
  }, []);

  const fetchDaily = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const res = await fetch('/api/capsule/daily');
      if (!res.ok) throw new Error('Failed to fetch');

      const json = await res.json();
      if (json.success && json.data) {
        setDaily(json.data);
        // 이미 완료된 아이템 반영 (API 필드명 = isChecked)
        const completed = new Set<string>();
        for (const item of json.data.items ?? []) {
          if (item.isChecked) completed.add(item.id);
        }
        setCheckedItems(completed);
      } else {
        // 오늘 캡슐이 없으면 null
        setDaily(null);
      }
    } catch {
      setError('오늘의 루틴을 불러올 수 없어요.');
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Daily Capsule 생성
  const generateDaily = useCallback(async () => {
    setIsGenerating(true);
    setError(null);

    try {
      const res = await fetch('/api/capsule/daily', { method: 'POST' });
      if (!res.ok) throw new Error('Failed to generate');

      const json = await res.json();
      if (json.success && json.data) {
        setDaily(json.data);
        setCheckedItems(new Set());
      }
    } catch {
      setError('루틴을 만들지 못했어요. 잠시 후 다시 시도해주세요.');
    } finally {
      setIsGenerating(false);
    }
  }, []);

  // 아이템 체크 토글 — 낙관적 UI + 저장 실패 시 롤백
  const toggleItem = useCallback(
    async (itemId: string) => {
      if (!daily) return;

      const nextChecked = !checkedItems.has(itemId);
      setCheckedItems((prev) => {
        const next = new Set(prev);
        if (nextChecked) {
          next.add(itemId);
        } else {
          next.delete(itemId);
        }
        return next;
      });

      // API 스키마 = { itemId, isChecked } — 기존 completed 키는 400으로 조용히 실패했음
      const ok = await patchChecks(daily.id, { itemId, isChecked: nextChecked });
      if (!ok) {
        // 저장 실패 → 낙관적 체크 롤백 + 안내 (기존: res.ok 미검사로 무음 실패하던 결함 수리)
        setCheckedItems((prev) => {
          const next = new Set(prev);
          if (nextChecked) {
            next.delete(itemId);
          } else {
            next.add(itemId);
          }
          return next;
        });
        toast.error('체크를 저장하지 못했어요. 잠시 후 다시 시도해주세요.');
      }
    },
    [daily, checkedItems, patchChecks]
  );

  // 모듈 클러스터 일괄 완료 — 배치 PATCH 1회 (마찰 축소)
  //
  // 왜 순회가 아니라 배치인가: 서버는 items JSONB를 통째로 read-modify-write 하므로
  // 단건 PATCH를 병렬 발사하면 마지막 응답만 살아남아 나머지 체크가 유실됐다
  // (화면은 4/4인데 새로고침하면 1/4). 한 요청으로 보내 경합 자체를 없앤다.
  const completeCluster = useCallback(
    async (items: DailyItem[]) => {
      if (!daily) return;

      const targetIds = items.filter((item) => !checkedItems.has(item.id)).map((item) => item.id);
      if (targetIds.length === 0) return;

      // 낙관적 반영
      setCheckedItems((prev) => {
        const next = new Set(prev);
        for (const id of targetIds) next.add(id);
        return next;
      });

      const ok = await patchChecks(daily.id, { itemIds: targetIds, isChecked: true });
      if (!ok) {
        // 저장 실패 → 이번에 켠 체크만 되돌림 (미반영을 정직하게 표시)
        setCheckedItems((prev) => {
          const next = new Set(prev);
          for (const id of targetIds) next.delete(id);
          return next;
        });
        toast.error('체크를 저장하지 못했어요. 잠시 후 다시 시도해주세요.');
      }
    },
    [daily, checkedItems, patchChecks]
  );

  const toggleExpanded = useCallback((itemId: string, autoExpanded: boolean) => {
    setExpandedOverrides((prev) => ({ ...prev, [itemId]: !(prev[itemId] ?? autoExpanded) }));
  }, []);

  useEffect(() => {
    if (isLoaded && isSignedIn) {
      fetchDaily();
    }
  }, [isLoaded, isSignedIn, fetchDaily]);

  const completedCount = checkedItems.size;
  const totalCount = daily?.items.length ?? 0;
  const isAllDone = totalCount > 0 && completedCount === totalCount;

  // verdict-first '지금 블록' — 활성 시간대(아침/저녁/언제든)의 첫 미체크 아이템.
  // 활성 그룹이 전부 완료면 다음 그룹에서 승계 (신규 fetch 없음, 기존 상태만 사용)
  const groupsWithItems = daily
    ? TIME_GROUPS.map((group) => ({
        ...group,
        items: orderClusterItems(
          daily.items.filter((item) => (item.timeOfDay ?? 'anytime') === group.key)
        ),
      })).filter((group) => group.items.length > 0)
    : [];

  // 시간대 우선순위 — 히어로 탐색과 시각 무게 차등(활성 그룹 판정)에 공용
  const timePriority = getTimeGroupPriority(new Date().getHours());

  let foundGroup: (typeof groupsWithItems)[number] | undefined;
  let foundItem: DailyItem | undefined;
  for (const key of timePriority) {
    const group = groupsWithItems.find((g) => g.key === key);
    const firstUnchecked = group?.items.find((item) => !checkedItems.has(item.id));
    if (group && firstUnchecked) {
      foundGroup = group;
      foundItem = firstUnchecked;
      break;
    }
  }
  // const 별칭 — 클로저(onClick 등) 안에서도 내로잉 유지 (non-null 단언 회피)
  const heroGroup = foundGroup;
  const heroItem = foundItem;

  // 균일 카드 벽 완화 — 히어로가 속한 그룹(전부 완료면 현재 시간대 우선 그룹)만
  // 카드 무게, 나머지 시간대 그룹은 경량 표시. 데이터·체크 로직·testid는 동일.
  const activeGroupKey = heroGroup?.key ?? timePriority[0];

  // 인증 로딩
  if (!isLoaded) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]" data-testid="capsule-daily">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  // 미로그인
  if (!isSignedIn) {
    return (
      <div className="container mx-auto px-4 py-12 text-center" data-testid="capsule-daily">
        <Package className="h-12 w-12 mx-auto mb-4 text-slate-400" />
        <h2 className="text-xl font-bold mb-2">로그인이 필요해요</h2>
        <p className="text-muted-foreground mb-4">오늘의 루틴을 확인하려면 먼저 로그인해주세요.</p>
        <Button onClick={() => router.push('/sign-in')}>로그인하기</Button>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-6 pb-24" data-testid="capsule-daily">
      {/* 뒤로 가기 + 헤더 */}
      <div className="mb-6">
        <button
          onClick={() => router.push('/capsule')}
          className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground mb-3 transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          나만의 플랜
        </button>
        {/* "새로 만들기" 버튼 제거 (2026-07-06, P0): 캡슐은 (사용자,날짜) 캐시라
            눌러도 같은 캡슐이 반환되던 거짓 버튼 — 루틴의 가치는 일관성이라 재생성 개념 자체가 불필요 */}
        {/* "캡슐" 용어는 사용자 표면에서 제거 (2026-07-08 피드백: 초보자가 모르는 내부 용어)
            — 라우트/타입/코드 개념은 capsule 유지 */}
        <div>
          <h1 className="text-2xl font-bold">오늘의 루틴</h1>
          <p className="mt-1 text-muted-foreground text-sm">
            {daily?.date
              ? new Date(daily.date).toLocaleDateString('ko-KR', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric',
                })
              : new Date().toLocaleDateString('ko-KR', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric',
                })}
          </p>
        </div>
      </div>

      {/* 로딩 */}
      {isLoading && (
        <div className="space-y-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="h-16 bg-muted rounded-xl animate-pulse" />
          ))}
        </div>
      )}

      {/* 에러 */}
      {error && (
        <div className="text-center py-12">
          <AlertTriangle className="h-10 w-10 mx-auto mb-3 text-amber-500" />
          <p className="text-muted-foreground mb-4">{error}</p>
          <Button onClick={fetchDaily} variant="outline" size="sm">
            다시 시도하기
          </Button>
        </div>
      )}

      {/* 빈 상태: 오늘 캡슐이 없거나, 있어도 아이템이 0개(본문 조건과 통일 — 헤더만 남는 백지 방지) */}
      {!isLoading && !error && (!daily || totalCount === 0) && (
        <div className="text-center py-12" data-testid="daily-empty">
          <CalendarCheck className="h-12 w-12 mx-auto mb-4 text-slate-400" />
          <h3 className="font-semibold mb-2">아직 오늘의 루틴이 없어요</h3>
          {daily ? (
            // 캡슐은 만들어졌는데 아이템이 0개 = 재료(분석)가 없는 상태.
            // 여기서 '만들기'를 다시 눌러도 같은 빈 캡슐이라 분석으로 안내한다.
            <>
              <p className="text-sm text-muted-foreground mb-4">
                분석을 완료하면 내게 맞는 루틴을 만들어드려요.
              </p>
              <Button asChild>
                <Link href="/analysis/integrated">분석 시작하기</Link>
              </Button>
            </>
          ) : (
            <>
              <p className="text-sm text-muted-foreground mb-4">
                버튼을 눌러 오늘의 뷰티·스타일 루틴을 만들어보세요.
              </p>
              <Button onClick={generateDaily} disabled={isGenerating}>
                {isGenerating ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                    만드는 중...
                  </>
                ) : (
                  '오늘의 루틴 만들기'
                )}
              </Button>
            </>
          )}
        </div>
      )}

      {!isLoading && daily && totalCount > 0 && (
        <>
          {/* 완주 상태 — 진행 카드가 완료 인장으로 전환 (폭죽·이모지 없음) */}
          {isAllDone && (
            <Card className="mb-5 p-6 text-center" data-testid="daily-complete-card">
              <div className="mx-auto mb-3 flex h-12 w-12 rotate-3 items-center justify-center rounded-full border-[1.5px] border-primary/60">
                <Check className="h-5 w-5 text-primary" strokeWidth={1.75} />
              </div>
              <p className="font-serif text-lg italic">오늘 루틴 완료</p>
              <p className="mt-1 text-sm text-muted-foreground">내일 아침 브리핑에서 만나요</p>
              <Link
                href="/home"
                className="mt-3 inline-flex min-h-[44px] items-center justify-center gap-1 text-sm font-medium text-primary hover:text-primary/80 transition-colors"
              >
                홈으로 가기
                <ChevronRight className="h-4 w-4" />
              </Link>
            </Card>
          )}

          {/* verdict-first '지금 블록' — 활성 시간대의 첫 미체크를 세리프 히어로로 */}
          {!isAllDone && heroGroup && heroItem && (
            <Card className="mb-5 p-5" data-testid="daily-now-block">
              <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                <heroGroup.icon size={14} strokeWidth={1.75} />
                <span>지금 · {heroGroup.label} 루틴</span>
              </div>
              <p className="mt-2 font-serif text-2xl leading-snug">{heroItem.name}</p>
              {heroItem.solution && <SolutionLine item={heroItem} className="mt-1.5 text-sm" />}
              <Button
                onClick={() => toggleItem(heroItem.id)}
                className="mt-4 min-h-[44px] w-full"
                data-testid="daily-now-check"
              >
                <Check className="mr-1.5 h-4 w-4" />
                완료했어요
              </Button>
              {/* 진행률 게이지 대신 텍스트 1줄 — 점수·게이지 문법 소거 */}
              <p
                className="mt-3 border-t border-border pt-2.5 text-xs text-muted-foreground"
                data-testid="daily-progress-line"
              >
                {heroGroup.label} {heroGroup.items.length}단계 중{' '}
                {heroGroup.items.filter((item) => checkedItems.has(item.id)).length} 완료
                {typeof daily.estimatedMinutes === 'number'
                  ? ` · 약 ${daily.estimatedMinutes}분`
                  : ''}
              </p>
            </Card>
          )}

          {/* 아이템 목록 — 아침/저녁/언제든 시간대 그룹 (18개 평면 목록의 부담 해소) */}
          <div className="space-y-6">
            {groupsWithItems.map((group, groupIndex) => {
              const GroupIcon = group.icon;
              const groupDone = group.items.filter((item) => checkedItems.has(item.id)).length;
              // 시각 무게 차등 — 활성 그룹만 카드, 비활성 시간대 그룹은 경량 블록
              const isActiveGroup = group.key === activeGroupKey;

              // 시간 섹션 안에서 모듈(스킨케어/메이크업/…)별로 다시 묶음 — "아침 8개"가 아니라
              // "아침 스킨케어 4단계 + 메이크업 3단계 + 코디"라는 덩어리로 읽히게 (인지 부담 축소)
              const moduleClusters = MODULE_ORDER.map((code) => ({
                code,
                items: group.items.filter((item) => item.moduleCode === code),
              })).filter((cluster) => cluster.items.length > 0);

              return (
                <section key={group.key} aria-label={group.label}>
                  {/* 세리프 이탤릭 러닝넘버 + 라인아트 아이콘 + 헤어라인 (진단지 섹션 문법) */}
                  <div className="mb-2 flex items-center gap-2 border-b border-border px-1 pb-1.5">
                    <span className="font-serif text-[12px] italic tabular-nums text-muted-foreground">
                      {String(groupIndex + 1).padStart(2, '0')}
                    </span>
                    <GroupIcon size={14} strokeWidth={1.75} className="text-muted-foreground" />
                    <h2 className="text-sm font-semibold">{group.label}</h2>
                    <span className="ml-auto text-xs text-muted-foreground">
                      {groupDone}/{group.items.length}
                    </span>
                  </div>
                  <div className={isActiveGroup ? 'space-y-3' : 'space-y-1'}>
                    {moduleClusters.map((cluster) => {
                      const moduleName = MODULE_NAMES[cluster.code] ?? cluster.code;
                      const clusterDone = cluster.items.filter((i) =>
                        checkedItems.has(i.id)
                      ).length;

                      // 개인화 근거 (그룹 첫 아이템에 실림) — "내 분석이 반영됐다" 가시화
                      const groupNote = cluster.items.find((i) => i.groupNote)?.groupNote;

                      // 클러스터 내용은 동일, 활성 그룹만 카드 크롬(테두리·지면)을 얹는다
                      const clusterBody = (
                        <>
                          {/* 모듈 헤더 — 중립 배지 + 일괄 완료 */}
                          <div className="flex items-center justify-between mb-1.5">
                            <span className="rounded-full bg-muted px-2 py-0.5 text-xs font-semibold text-muted-foreground">
                              {moduleName}
                            </span>
                            <div className="flex items-center gap-1.5">
                              <span className="text-[11px] text-muted-foreground">
                                {clusterDone}/{cluster.items.length}
                              </span>
                              {clusterDone < cluster.items.length && (
                                <button
                                  type="button"
                                  onClick={() => void completeCluster(cluster.items)}
                                  className="min-h-[44px] px-2 text-[11px] font-medium text-primary hover:text-primary/80 transition-colors"
                                  data-testid={`daily-cluster-complete-${cluster.code}`}
                                >
                                  모두 완료
                                </button>
                              )}
                            </div>
                          </div>
                          {groupNote && (
                            <p className="mb-1.5 text-[11px] text-muted-foreground">{groupNote}</p>
                          )}

                          {/* 번호식 컴팩트 스텝 — 기본형은 체크+번호+이름 1줄, 상세는 탭 전개 */}
                          <div>
                            {cluster.items.map((item, stepIndex) => (
                              <RoutineItemRow
                                key={item.id}
                                item={item}
                                stepNumber={cluster.items.length > 1 ? stepIndex + 1 : null}
                                isChecked={checkedItems.has(item.id)}
                                // 활성 그룹 첫 미체크('지금 블록' 아이템)만 자동 펼침
                                isAutoExpanded={item.id === heroItem?.id}
                                expandedOverride={expandedOverrides[item.id]}
                                onToggleCheck={toggleItem}
                                onToggleExpanded={toggleExpanded}
                              />
                            ))}
                          </div>
                        </>
                      );

                      return isActiveGroup ? (
                        <Card key={cluster.code} className="p-3">
                          {clusterBody}
                        </Card>
                      ) : (
                        <div key={cluster.code} className="px-3 py-1.5">
                          {clusterBody}
                        </div>
                      );
                    })}
                  </div>
                </section>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}
