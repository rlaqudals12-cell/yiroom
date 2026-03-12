'use client';

import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import type { DiaryEntry, VitalityGrade } from '@/lib/skin-diary';

interface DiaryEntryCardProps {
  entry: DiaryEntry;
}

const GRADE_BADGE_VARIANT: Record<VitalityGrade, string> = {
  S: 'bg-emerald-100 text-emerald-800',
  A: 'bg-blue-100 text-blue-800',
  B: 'bg-yellow-100 text-yellow-800',
  C: 'bg-orange-100 text-orange-800',
  D: 'bg-red-100 text-red-800',
};

export function DiaryEntryCard({ entry }: DiaryEntryCardProps) {
  const dateObj = new Date(entry.date);
  const dateLabel = `${dateObj.getMonth() + 1}/${dateObj.getDate()}`;
  const dayLabel = ['일', '월', '화', '수', '목', '금', '토'][dateObj.getDay()];

  return (
    <Card data-testid="diary-entry-card">
      <CardContent className="p-3">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium">{dateLabel}</span>
            <span className="text-xs text-muted-foreground">({dayLabel})</span>
            {entry.note?.conditionEmoji && (
              <span className="text-sm">{entry.note.conditionEmoji}</span>
            )}
          </div>
          <div className="flex items-center gap-2">
            <span className="text-lg font-bold">{entry.vitalityScore}</span>
            <Badge variant="outline" className={GRADE_BADGE_VARIANT[entry.vitalityGrade]}>
              {entry.vitalityGrade}
            </Badge>
          </div>
        </div>

        {/* 카테고리 점수 바 */}
        <div className="grid grid-cols-4 gap-2 text-xs">
          {(
            [
              { key: 'hydration', label: '수분' },
              { key: 'elasticity', label: '탄력' },
              { key: 'clarity', label: '투명도' },
              { key: 'tone', label: '톤' },
            ] as const
          ).map(({ key, label }) => (
            <div key={key} className="text-center">
              <p className="text-muted-foreground">{label}</p>
              <p className="font-medium">{entry.scoreBreakdown[key]}</p>
            </div>
          ))}
        </div>

        {/* 메모 */}
        {entry.note?.text && (
          <p className="text-xs text-muted-foreground mt-2 pt-2 border-t">{entry.note.text}</p>
        )}

        {/* 존 변화 */}
        {entry.zoneHighlights && (
          <div className="flex gap-2 mt-2 pt-2 border-t text-xs">
            {entry.zoneHighlights.improved.length > 0 && (
              <span className="text-emerald-600">
                개선: {entry.zoneHighlights.improved.join(', ')}
              </span>
            )}
            {entry.zoneHighlights.worsened.length > 0 && (
              <span className="text-red-600">주의: {entry.zoneHighlights.worsened.join(', ')}</span>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
