/**
 * 페르소나 공유 섹션 — 결과 화면에서 "자랑 카드"를 바로 보여주고 저장/공유하게 한다
 *
 * @description
 *   웹 PersonaShareSection의 모바일 대응. 카드를 인라인으로 먼저 보여주는 이유:
 *   접힌 버튼 뒤에 숨기면 발견성이 죽는다 — 한국 사용자에게 퍼컬 결과는 MBTI 같은
 *   정체성 배지 문화라, 카드 노출 자체가 공유 동기를 만든다(정서 리딩 2026-07-12).
 *
 *   이미지 공유: 카드는 캡처 기준 치수(544pt — dpr 2에서도 1088px ≥ 인스타 1080)로 렌더하고,
 *   프리뷰는 transform scale로 화면 폭에 맞춰 축소(레이아웃 크기 불변 = 캡처 화질 무영향).
 *   캡처(react-native-view-shot) → expo-sharing 공유 시트(저장/전송을 시트가 담당).
 *   실패 시 정직하게 알리고, 링크(텍스트) 공유는 별도 버튼으로 상시 제공.
 *
 *   사진은 카드에 절대 포함되지 않는다(생체정보 — PersonaShareCard 참조).
 */
import { useAuth } from '@clerk/clerk-expo';
import * as Sharing from 'expo-sharing';
import { Download, Share2 } from 'lucide-react-native';
import { useRef, useState } from 'react';
import { Pressable, Share, Text, View, type View as ViewType } from 'react-native';
import { captureRef } from 'react-native-view-shot';

import { REPORT_COLORS } from '@/components/analysis';
import {
  CARD_WIDTH,
  PersonaShareCard,
  type PersonaCardFormat,
} from '@/components/share/PersonaShareCard';
import { trackAnalysisShare, type MobileAnalysisType } from '@/lib/analytics/tracker';
import type { PersonaCardData } from '@/lib/share/card-data';

import { personaShareSectionStyles as styles } from './PersonaShareSection.styles';

interface PersonaShareSectionProps {
  data: PersonaCardData;
  /** 발급 번호(웹 API 실측 순번) — null이면 미표기(지어내지 않음) */
  serialNo?: number | null;
  /** 공유 계측 축. 기존 통합 결과 소비처 호환을 위해 integrated가 기본값이다. */
  analysisType?: MobileAnalysisType;
  heading?: string;
  dialogTitle?: string;
  inviteText?: string;
}

/**
 * 카드가 돌아다닐 때 "돌아올 길" — 이미지만 공유하면 클릭 링크가 없어
 * 공유 100건 = 유입 0건이 된다(웹 정본 패턴과 동일, ?ref=card 귀속).
 */
const SHARE_LANDING_URL = 'https://yiroom.app/?ref=card';

const FORMATS: readonly { key: PersonaCardFormat; label: string }[] = [
  { key: 'square', label: '피드 1:1' },
  { key: 'story', label: '스토리 9:16' },
];

export function PersonaShareSection({
  data,
  serialNo,
  analysisType = 'integrated',
  heading = '내 컬러 카드',
  dialogTitle = '내 컬러 카드 공유',
  inviteText = '너의 계절은?',
}: PersonaShareSectionProps): React.JSX.Element {
  const { getToken } = useAuth();
  const cardRef = useRef<ViewType>(null);
  const [format, setFormat] = useState<PersonaCardFormat>('square');
  const [isBusy, setIsBusy] = useState(false);
  // 실패는 정직하게 알린다 — 조용한 무반응 금지
  const [message, setMessage] = useState<string | null>(null);
  // 프리뷰 축소 계산 — 카드는 캡처 치수(544pt)로 렌더되므로 화면 폭에 맞춰 scale
  const [availW, setAvailW] = useState(0);
  const [cardH, setCardH] = useState(0);
  // onLayout 전 첫 프레임은 scale 1(테스트 환경 포함) — 실기기에선 즉시 실측값으로 보정
  const previewScale = availW > 0 ? Math.min(1, availW / CARD_WIDTH) : 1;

  const handleImageShare = async (): Promise<void> => {
    setIsBusy(true);
    setMessage(null);
    try {
      // 캡처 해상도 = 카드 340pt × 기기 픽셀비(2~3x) — 인스타 권장 1080px 근사
      const uri = await captureRef(cardRef, {
        format: 'png',
        quality: 1,
        result: 'tmpfile',
      });
      if (!(await Sharing.isAvailableAsync())) {
        setMessage('이 기기에서는 이미지 공유를 사용할 수 없어요.');
        return;
      }
      await Sharing.shareAsync(uri, {
        mimeType: 'image/png',
        dialogTitle,
      });
      void getToken()
        .catch(() => null)
        .then((token) => trackAnalysisShare(analysisType, 'image', token));
    } catch {
      setMessage('카드 이미지를 만들지 못했어요. 다시 시도해주세요.');
    } finally {
      setIsBusy(false);
    }
  };

  const handleTextShare = async (): Promise<void> => {
    try {
      // 텍스트 공유엔 링크가 실린다 — 이미지 시트가 링크를 버리는 타깃 대비 보조 경로
      const result = await Share.share({
        message: `${data.toneName ? `${data.toneName} — ` : ''}${data.oneLine}\n${SHARE_LANDING_URL}`,
      });
      if (result.action === Share.sharedAction) {
        void getToken()
          .catch(() => null)
          .then((token) => trackAnalysisShare(analysisType, 'link', token));
      }
    } catch {
      // 사용자가 시트를 닫은 경우 — 실패 아님
    }
  };

  return (
    <View style={styles.wrap} testID="persona-share-section">
      <Text style={styles.heading}>{heading}</Text>
      <Text style={styles.subtitle}>저장하거나 스토리에 올려보세요</Text>

      {/* 포맷 토글 — 피드(1:1) / 스토리(9:16) */}
      <View style={styles.toggleRow} testID="persona-share-format-toggle">
        {FORMATS.map((f) => {
          const active = format === f.key;
          return (
            <Pressable
              key={f.key}
              onPress={() => setFormat(f.key)}
              accessibilityRole="button"
              accessibilityState={{ selected: active }}
              style={[
                styles.toggle,
                { borderColor: active ? REPORT_COLORS.ink : REPORT_COLORS.rule },
                active && { backgroundColor: REPORT_COLORS.wash },
              ]}
              testID={`persona-share-format-${f.key}`}
            >
              <Text
                style={[
                  styles.toggleLabel,
                  { color: active ? REPORT_COLORS.ink : REPORT_COLORS.mutedInk },
                ]}
              >
                {f.label}
              </Text>
            </Pressable>
          );
        })}
      </View>

      {/* 카드 미리보기 — 캡처 치수(544pt) 카드를 화면 폭에 맞춰 transform scale로 축소.
          scale은 레이아웃 크기를 바꾸지 않으므로 captureRef 화질에 무영향 */}
      <View style={styles.cardWrap} onLayout={(e) => setAvailW(e.nativeEvent.layout.width)}>
        <View
          style={{
            width: CARD_WIDTH * previewScale,
            height: cardH > 0 ? cardH * previewScale : undefined,
          }}
        >
          <View
            style={{ transform: [{ scale: previewScale }], transformOrigin: 'top left' }}
            onLayout={(e) => setCardH(e.nativeEvent.layout.height)}
          >
            <PersonaShareCard
              ref={cardRef}
              oneLine={data.oneLine}
              toneName={data.toneName}
              badges={data.badges}
              palette={data.palette}
              worstPalette={data.worstPalette}
              serialNo={serialNo}
              inviteText={inviteText}
              format={format}
            />
          </View>
        </View>
      </View>

      <View style={styles.buttonRow}>
        <Pressable
          onPress={handleImageShare}
          disabled={isBusy}
          accessibilityRole="button"
          style={[styles.primaryButton, isBusy && styles.dim]}
          testID="persona-share-image"
        >
          <Download size={16} color="#FFFFFF" />
          <Text style={styles.primaryLabel}>{isBusy ? '만드는 중…' : '이미지로 공유'}</Text>
        </Pressable>
        <Pressable
          onPress={handleTextShare}
          accessibilityRole="button"
          style={styles.secondaryButton}
          testID="persona-share-text"
        >
          <Share2 size={16} color={REPORT_COLORS.ink} />
          <Text style={styles.secondaryLabel}>링크 공유</Text>
        </Pressable>
      </View>

      {message && (
        <Text style={styles.message} testID="persona-share-message">
          {message}
        </Text>
      )}
    </View>
  );
}
