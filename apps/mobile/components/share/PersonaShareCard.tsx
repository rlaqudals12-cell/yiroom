/**
 * 페르소나 공유 카드 — 웹 E+ 에디토리얼 카드의 RN 포팅 (2026-07-23)
 *
 * 정본 = apps/web/components/share/PersonaShareCard.tsx (E+ 확정안 2026-07-15 + 다듬기 7/23).
 * 디자인 원칙(→ memory design-taste-moat): 장식 그라데이션·반짝이·글래스 = 0.
 * 위계 = ①진단명(자랑 라벨) ②은유 서브카피 ③베스트 팔레트(주인공, 풀블리드 밴드)
 * ④피해야 할 색(취소선 소밴드) ⑤서명·발급번호·초대. 블러시 크림 + 로즈 1색.
 *
 * 캡처 해상도 설계: 카드는 **캡처 기준 치수**(폭 544pt)로 렌더된다 — react-native-view-shot이
 * 레이아웃 크기 × 기기 픽셀비로 래스터하므로 dpr 2 기기에서도 1088px(인스타 권장 1080px 충족).
 * 화면 프리뷰는 섹션이 transform scale로 축소해 보여준다(레이아웃 크기 불변 = 캡처 무영향).
 * 색은 전부 고정 hex(테마 토큰 미사용) — 뷰어 테마와 무관하게 항상 같은 산출물(웹과 동일 관례).
 *
 * 웹과의 의도적 차이(캡처 산출물 무해 범위): 종이 그레인(SVG feTurbulence — RN 미지원)과
 * 포일 마감(CSS 그라데 오버레이)은 생략. 색·위계·타이포 구조는 동일.
 * 왜 사진이 없나: 생체정보(얼굴)는 공유 산출물에 절대 포함하지 않는다(BIPA/PIPA).
 */
import { forwardRef } from 'react';
import { Platform, StyleSheet, Text, View, type ViewStyle } from 'react-native';
import Svg, { Path } from 'react-native-svg';

/** 카드에 표시되는 축 뱃지 (한국어 라벨만 — 성공 축만 전달) */
export interface PersonaBadge {
  label: string;
  value: string;
}

/** 퍼스널컬러 팔레트 색 — 진단된 hex + (있으면) 색이름 */
export interface PaletteColor {
  hex: string;
  name?: string;
}

/** 카드 비율 — 'square'(1:1, 피드/저장) | 'story'(9:16, 인스타 스토리) */
export type PersonaCardFormat = 'square' | 'story';

export interface PersonaShareCardProps {
  /** 페르소나 한 줄 은유 — toneName이 있으면 서브카피로 강등 */
  oneLine: string;
  /** 진단명(ko 라벨, 예: "뮤티드 서머") — 시각적 1순위. 없으면 oneLine이 히어로 */
  toneName?: string;
  /** 퍼컬 외 성공 축의 값(피부·체형·헤어) — 서명 로우 */
  badges: PersonaBadge[];
  /** 베스트 팔레트 — 카드의 주인공 */
  palette?: PaletteColor[];
  /** 피해야 할 색 — 소밴드(재미·전문성 신호) */
  worstPalette?: { hex: string }[];
  /** 발급 번호(실제 순번) — 정직한 희소성. 없으면 미표기 */
  serialNo?: number | null;
  /** 초대 한 줄(예: "너의 계절은?") — 카드=테스트 초대장 루프 */
  inviteText?: string;
  format?: PersonaCardFormat;
  style?: ViewStyle;
}

// E+ 고정 팔레트 (웹과 동일 hex)
const CREAM = '#FBF3F1';
const INK = '#2B2320';
const ROSE = '#C56A84';
const MUTED = '#8C7F78';
const FAINT = '#B6A9A1';

const SERIF = Platform.select({ ios: 'Georgia', default: 'serif' });

// 캡처 스케일 — 웹 디자인 치수(340pt) × 1.6 = 544pt. dpr 2에서 1088px 보장.
const S = 1.6;
const sz = (n: number): number => Math.round(n * S);

/** 카드 폭(캡처 기준) — 섹션의 프리뷰 축소 계산에 사용 */
export const CARD_WIDTH = sz(340);

// 포맷별 치수 — story는 9:16(544×967). 웹 FORMAT 미러 × 캡처 스케일.
const FORMAT: Record<
  PersonaCardFormat,
  { width: number; minH: number; pad: number; heroSize: number; bandH: number; heroMt: number }
> = {
  square: {
    width: CARD_WIDTH,
    minH: sz(357),
    pad: sz(24),
    heroSize: sz(26),
    bandH: sz(56),
    heroMt: sz(16),
  },
  story: {
    width: CARD_WIDTH,
    minH: Math.round((CARD_WIDTH * 16) / 9),
    pad: sz(24),
    heroSize: sz(30),
    bandH: sz(100),
    heroMt: sz(28),
  },
};

/**
 * 긴 색이름의 고아 줄바꿈 방지 — RN Text는 break-keep이 없어 음절 중간에서 꺾인다
 * ("브라이트 에메랄" + "드"). 7자+ 이름은 첫 공백에서 명시적 개행해 어절 단위 2줄로.
 * (웹 다듬기 7/23의 break-keep과 동일 의도)
 */
function wrapColorName(name: string): string {
  if (name.length < 7) return name;
  const idx = name.indexOf(' ');
  if (idx <= 0) return name;
  return `${name.slice(0, idx)}\n${name.slice(idx + 1)}`;
}

/** 헥사곤-Y 브랜드 마크 (인장 — 웹과 동일 패스) */
function HexagonY({ size, color }: { size: number; color: string }): React.JSX.Element {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path d="M12 2l8.5 5v10L12 22 3.5 17V7z" stroke={color} strokeWidth={1.5} />
      <Path d="M9.2 9.4l2.8 2.6 2.8-2.6M12 12v3.4" stroke={color} strokeWidth={1.5} />
    </Svg>
  );
}

export const PersonaShareCard = forwardRef<View, PersonaShareCardProps>(function PersonaShareCard(
  {
    oneLine,
    toneName,
    badges,
    palette = [],
    worstPalette = [],
    serialNo,
    inviteText,
    format = 'square',
    style,
  },
  ref
) {
  const fmt = FORMAT[format];
  const swatches = palette.slice(0, 6);
  const worst = worstPalette.slice(0, 4);
  // 이름은 전부 있을 때만 렌더 → 일부만 있으면 컬럼이 들쭉날쭉해지므로 통일(웹과 동일 계약)
  const showNames = swatches.length > 0 && swatches.every((c) => !!c.name);
  const facets = badges
    .map((b) => b.value)
    .filter(Boolean)
    .join(' · ');
  const serial =
    typeof serialNo === 'number' && serialNo > 0 ? `No.${String(serialNo).padStart(6, '0')}` : null;
  const isStory = format === 'story';

  return (
    <View
      ref={ref}
      collapsable={false}
      style={[styles.card, { width: fmt.width, minHeight: fmt.minH, padding: fmt.pad }, style]}
      testID="persona-share-card"
    >
      {/* 브랜드 로우 — 인장 + 세리프 워드마크 + 발급번호(한정판 인쇄 넘버) */}
      <View style={styles.brandRow}>
        <HexagonY size={sz(16)} color={ROSE} />
        <Text style={styles.wordmark}>Yiroom</Text>
        {serial && (
          <Text style={styles.serial} testID="persona-share-serial">
            {serial}
          </Text>
        )}
      </View>

      {/* 퍼컬 실패(팔레트 無) 시 히어로를 광학 중앙으로 — 상단 붙박이+하단 통공백이
            '깨진 렌더'로 읽히는 것을 막는다(웹 다듬기 7/23 동일). 푸터 auto와 공간 균등 분배 */}
      {swatches.length === 0 && <View style={styles.autoSpacer} />}

      {/* 진단명 히어로 — 자랑의 본체. 퍼컬 실패 시 은유가 히어로 자리를 지킨다 */}
      <Text
        style={[styles.hero, { fontSize: fmt.heroSize, marginTop: fmt.heroMt }]}
        testID="persona-share-hero"
      >
        {toneName ?? oneLine}
      </Text>

      {/* 은유 서브카피 */}
      {toneName && (
        <Text style={[styles.sub, isStory && styles.subStory]} testID="persona-share-oneline">
          {oneLine}
        </Text>
      )}

      {/* 베스트 팔레트 — 주인공. 풀블리드 밴드 + (있으면) 색이름.
            story는 marginTop auto로 포스터 3단 구도(히어로 상단/팔레트 중하단/서명 하단) */}
      {swatches.length > 0 && (
        <View style={isStory ? styles.bandWrapStory : styles.bandWrapSquare}>
          <Text style={styles.eyebrow}>Best colors</Text>
          <View
            style={[styles.band, { marginHorizontal: -fmt.pad }]}
            testID="persona-share-swatches"
          >
            {swatches.map((c, i) => (
              <View key={`${c.hex}-${i}`} style={styles.bandCol}>
                <View style={[styles.bandBlock, { height: fmt.bandH, backgroundColor: c.hex }]} />
                {showNames && c.name && (
                  <Text style={styles.colorName}>{wrapColorName(c.name)}</Text>
                )}
              </View>
            ))}
          </View>
        </View>
      )}

      {/* 피해야 할 색 — 취소선 소밴드(진단지 리포트와 동일 부정 표기, 추천색 오독 방지) */}
      {worst.length > 0 && (
        <View style={styles.worstRow} testID="persona-share-worst">
          <Text style={styles.eyebrow}>Avoid</Text>
          <View style={styles.worstChips}>
            {worst.map((c, i) => (
              <View key={`${c.hex}-${i}`} style={[styles.worstChip, { backgroundColor: c.hex }]}>
                <View style={styles.strikethrough} />
              </View>
            ))}
          </View>
        </View>
      )}

      {/* 서명 로우 — 성공 축 값(정직성) + 초대 + 도메인 */}
      <View style={styles.footer}>
        <Text style={styles.facets} numberOfLines={1}>
          {facets}
        </Text>
        <View style={styles.footerRight}>
          <HexagonY size={sz(13)} color={ROSE} />
          {inviteText && (
            <Text style={styles.invite} testID="persona-share-invite">
              {inviteText}
            </Text>
          )}
          <Text style={styles.domain}>yiroom.app</Text>
        </View>
      </View>
    </View>
  );
});

const styles = StyleSheet.create({
  card: {
    backgroundColor: CREAM,
    borderRadius: sz(24),
    overflow: 'hidden',
  },
  brandRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: sz(8),
  },
  wordmark: {
    fontFamily: SERIF,
    fontSize: sz(16),
    color: INK,
  },
  serial: {
    marginLeft: 'auto',
    fontFamily: SERIF,
    fontStyle: 'italic',
    fontSize: sz(12),
    color: ROSE,
    fontVariant: ['tabular-nums'],
  },
  autoSpacer: {
    marginTop: 'auto',
  },
  hero: {
    fontWeight: '700',
    color: INK,
    letterSpacing: -0.5,
  },
  sub: {
    marginTop: sz(8),
    fontSize: sz(13),
    lineHeight: sz(20),
    color: MUTED,
  },
  subStory: {
    fontSize: sz(14),
    lineHeight: sz(22),
  },
  bandWrapSquare: {
    marginTop: sz(18),
  },
  // story: 잉여 세로 공간을 푸터 auto와 반씩 나눠 팔레트가 중하단 앵커(포스터 구도)
  bandWrapStory: {
    marginTop: 'auto',
    paddingTop: sz(32),
  },
  eyebrow: {
    fontFamily: SERIF,
    fontStyle: 'italic',
    fontSize: sz(11),
    color: FAINT,
  },
  band: {
    marginTop: sz(8),
    flexDirection: 'row',
  },
  bandCol: {
    flex: 1,
  },
  bandBlock: {
    width: '100%',
  },
  colorName: {
    paddingTop: sz(5),
    fontSize: sz(9),
    lineHeight: sz(11),
    textAlign: 'center',
    color: MUTED,
  },
  worstRow: {
    marginTop: sz(14),
    flexDirection: 'row',
    alignItems: 'center',
    gap: sz(10),
  },
  worstChips: {
    flexDirection: 'row',
    gap: sz(6),
  },
  worstChip: {
    height: sz(15),
    width: sz(22),
    borderRadius: sz(4),
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
  },
  // 취소선 — 대각 잉크 라인(색 hex는 정직 유지, 의미만 시각화)
  strikethrough: {
    position: 'absolute',
    width: sz(30),
    height: sz(2),
    backgroundColor: 'rgba(43,35,32,0.5)',
    transform: [{ rotate: '-33deg' }],
  },
  footer: {
    marginTop: 'auto',
    paddingTop: sz(18),
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: sz(10),
  },
  facets: {
    flexShrink: 1,
    fontSize: sz(11),
    color: MUTED,
  },
  footerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: sz(5),
  },
  invite: {
    fontSize: sz(11),
    color: MUTED,
  },
  domain: {
    fontSize: sz(11),
    fontWeight: '600',
    color: INK,
  },
});
