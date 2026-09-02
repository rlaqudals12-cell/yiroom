import { ProgressiveDisclosure } from '@/components/common/ProgressiveDisclosure';
import { AttrRow, RowTable } from '@/components/analysis/report';
import type { ProductProgressReplay as ProductProgressReplayData } from '@/lib/product-tracking';

export interface ProductProgressReplayItem {
  id: string;
  brand?: string;
  openedAt: string;
  reactionLabel: string;
  replay: ProductProgressReplayData;
}

interface ProductProgressReplayProps {
  items: ProductProgressReplayItem[];
  loading?: boolean;
  error?: boolean;
}

function formatRecordedDate(value: string): string {
  const date = new Date(value);
  if (!Number.isFinite(date.getTime())) return '날짜 미확인';
  return new Intl.DateTimeFormat('ko-KR', {
    year: 'numeric',
    month: 'numeric',
    day: 'numeric',
  }).format(date);
}

/** 제품 개봉 기록과 피부 분석 기록을 인과 해석 없이 시간순으로 되짚는다. */
export default function ProductProgressReplay({
  items,
  loading = false,
  error = false,
}: ProductProgressReplayProps): React.JSX.Element {
  let content: React.ReactNode;
  if (loading) {
    content = <p className="mt-4 text-sm text-muted-foreground">기록을 불러오는 중이에요.</p>;
  } else if (error) {
    content = (
      <p className="mt-4 text-sm text-muted-foreground" role="alert">
        제품 경과 기록을 불러오지 못했어요. 잠시 후 다시 확인해 주세요.
      </p>
    );
  } else if (items.length === 0) {
    content = (
      <p className="mt-4 text-sm text-muted-foreground">
        개봉일이 기록된 제품과 전후 피부 분석이 함께 있어야 경과를 되짚을 수 있어요.
      </p>
    );
  } else {
    content = (
      <div className="mt-4 space-y-3">
        {items.map((item) => (
          <ProgressiveDisclosure
            key={item.id}
            title={item.replay.product.productName}
            summary={`${formatRecordedDate(item.openedAt)} 개봉 · ${item.reactionLabel}${
              item.replay.includesFallback ? ' · 예시 결과 포함·낮은 신뢰도' : ''
            }`}
          >
            <RowTable testId={`product-progress-${item.id}`}>
              <AttrRow
                label="기록 구간"
                value={`${formatRecordedDate(item.replay.beforeSnapshot.date)} → ${formatRecordedDate(item.replay.afterSnapshot.date)}`}
              />
              {item.brand ? <AttrRow label="브랜드" value={item.brand} /> : null}
              <AttrRow label="내 반응" value={item.reactionLabel} />
              {item.replay.includesFallback ? (
                <AttrRow label="기록 출처" value="예시 결과 포함·낮은 신뢰도" />
              ) : null}
              {item.replay.analysis.changes.map((change) => (
                <AttrRow
                  key={change.metricId}
                  label={change.metricName}
                  value={`${change.before} → ${change.after}`}
                />
              ))}
            </RowTable>
            <p className="mt-3 text-xs leading-relaxed text-muted-foreground">
              개봉일 전후 저장 기록을 비교한 것이며, 그 사이 계속 사용했는지는 확인할 수 없어요.
              촬영 환경·생활 습관·함께 쓴 제품의 영향도 있어 이 기록만으로 인과관계를 판단하지
              않아요.
            </p>
          </ProgressiveDisclosure>
        ))}
      </div>
    );
  }

  return (
    <section
      className="rounded-xl border border-border bg-card p-5"
      data-testid="product-progress-replay"
    >
      <h2 className="font-serif text-lg font-semibold text-foreground">
        제품과 함께 기록된 피부 경과
      </h2>
      <p className="mt-2 break-keep text-sm leading-relaxed text-muted-foreground">
        제품 개봉일 전후에 저장된 피부 기록을 나란히 보여드려요. 계속 사용했는지는 확인할 수 없으며,
        제품의 효과나 변화의 원인으로 단정하지 않아요.
      </p>

      {content}
    </section>
  );
}
