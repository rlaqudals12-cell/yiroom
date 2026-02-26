/**
 * 통합 검색 화면
 *
 * 전체 모듈에 걸친 통합 검색.
 * - 분석 이력 검색
 * - 제품 검색
 * - 운동/영양 기록 검색
 * - 옷장 아이템 검색
 * - 피드 검색
 */
import * as Haptics from 'expo-haptics';
import { router } from 'expo-router';
import {
  Search,
  X,
  Sparkles,
  Shirt,
  Dumbbell,
  Apple,
  Package,
  MessageSquare,
} from 'lucide-react-native';
import { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  FlatList,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import Animated, { FadeInUp } from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';

import { useTheme } from '@/lib/theme';
import { TIMING } from '@/lib/animations';
import { useClerkSupabaseClient } from '@/lib/supabase';

interface SearchResult {
  id: string;
  type: 'analysis' | 'product' | 'closet' | 'workout' | 'nutrition' | 'feed';
  title: string;
  subtitle: string;
  route: string;
}

const CATEGORY_CONFIG: Record<
  SearchResult['type'],
  { label: string; icon: typeof Sparkles; color: string }
> = {
  analysis: { label: '분석', icon: Sparkles, color: '#8b5cf6' },
  product: { label: '제품', icon: Package, color: '#ec4899' },
  closet: { label: '옷장', icon: Shirt, color: '#f59e0b' },
  workout: { label: '운동', icon: Dumbbell, color: '#10b981' },
  nutrition: { label: '영양', icon: Apple, color: '#ef4444' },
  feed: { label: '피드', icon: MessageSquare, color: '#3b82f6' },
};

const QUICK_SEARCHES = [
  '퍼스널컬러',
  '피부 분석',
  '운동 기록',
  '스킨케어',
  '코디 추천',
  '영양 분석',
];

export default function UnifiedSearchScreen(): React.JSX.Element {
  const { colors, spacing, radii, typography, brand, shadows } = useTheme();
  const supabase = useClerkSupabaseClient();

  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);

  const handleSearch = useCallback(
    async (searchQuery: string) => {
      const trimmed = searchQuery.trim();
      if (!trimmed || trimmed.length < 2) return;

      setIsSearching(true);
      setHasSearched(true);
      Haptics.selectionAsync();

      const allResults: SearchResult[] = [];

      try {
        // 분석 이력 검색
        const { data: analyses } = await supabase
          .from('user_analyses')
          .select('id, analysis_type, created_at')
          .ilike('analysis_type', `%${trimmed}%`)
          .limit(5);

        if (analyses) {
          analyses.forEach((a) => {
            allResults.push({
              id: `analysis-${a.id}`,
              type: 'analysis',
              title: getAnalysisLabel(a.analysis_type),
              subtitle: new Date(a.created_at).toLocaleDateString('ko-KR'),
              route: `/(analysis)/history`,
            });
          });
        }

        // 제품 검색
        const { data: products } = await supabase
          .from('affiliate_products')
          .select('id, name, brand, category')
          .or(`name.ilike.%${trimmed}%,brand.ilike.%${trimmed}%`)
          .limit(5);

        if (products) {
          products.forEach((p) => {
            allResults.push({
              id: `product-${p.id}`,
              type: 'product',
              title: p.name,
              subtitle: p.brand ?? p.category ?? '',
              route: `/products/${p.id}`,
            });
          });
        }

        // 옷장 아이템 검색
        const { data: closetItems } = await supabase
          .from('inventory_items')
          .select('id, name, brand, sub_category')
          .eq('category', 'closet')
          .or(`name.ilike.%${trimmed}%,brand.ilike.%${trimmed}%`)
          .limit(5);

        if (closetItems) {
          closetItems.forEach((c) => {
            allResults.push({
              id: `closet-${c.id}`,
              type: 'closet',
              title: c.name,
              subtitle: c.brand ?? c.sub_category ?? '',
              route: `/(closet)/${c.id}`,
            });
          });
        }

        // 운동 기록 검색
        const { data: workouts } = await supabase
          .from('workout_logs')
          .select('id, workout_date, notes')
          .ilike('notes', `%${trimmed}%`)
          .limit(5);

        if (workouts) {
          workouts.forEach((w) => {
            allResults.push({
              id: `workout-${w.id}`,
              type: 'workout',
              title: `운동 기록`,
              subtitle: new Date(w.workout_date).toLocaleDateString('ko-KR'),
              route: `/(workout)/detail?id=${w.id}`,
            });
          });
        }

        // 피드 검색
        const { data: posts } = await supabase
          .from('feed_posts')
          .select('id, content, created_at')
          .ilike('content', `%${trimmed}%`)
          .limit(5);

        if (posts) {
          posts.forEach((p) => {
            allResults.push({
              id: `feed-${p.id}`,
              type: 'feed',
              title: p.content.substring(0, 40) + (p.content.length > 40 ? '...' : ''),
              subtitle: new Date(p.created_at).toLocaleDateString('ko-KR'),
              route: `/(social)/feed`,
            });
          });
        }

        setResults(allResults);
      } catch {
        setResults([]);
      } finally {
        setIsSearching(false);
      }
    },
    [supabase]
  );

  const handleResultPress = useCallback((result: SearchResult) => {
    Haptics.selectionAsync();
    router.push(result.route as never);
  }, []);

  const handleClear = useCallback(() => {
    setQuery('');
    setResults([]);
    setHasSearched(false);
  }, []);

  const renderResultItem = useCallback(
    ({ item }: { item: SearchResult }) => {
      const config = CATEGORY_CONFIG[item.type];
      const IconComponent = config.icon;

      return (
        <TouchableOpacity
          style={[
            shadows.card,
            {
              backgroundColor: colors.card,
              borderRadius: radii.lg,
              padding: spacing.md,
              marginBottom: spacing.sm,
              flexDirection: 'row',
              alignItems: 'center',
            },
          ]}
          onPress={() => handleResultPress(item)}
          activeOpacity={0.7}
        >
          <View
            style={[
              styles.resultIcon,
              { backgroundColor: config.color + '15', borderRadius: radii.md },
            ]}
          >
            <IconComponent size={18} color={config.color} />
          </View>
          <View style={{ flex: 1, marginLeft: spacing.sm }}>
            <Text
              numberOfLines={1}
              style={{ fontSize: typography.size.sm, fontWeight: '600', color: colors.foreground }}
            >
              {item.title}
            </Text>
            <Text
              numberOfLines={1}
              style={{ fontSize: typography.size.xs, color: colors.mutedForeground, marginTop: 2 }}
            >
              {item.subtitle}
            </Text>
          </View>
          <View
            style={[
              styles.typeBadge,
              { backgroundColor: config.color + '15', borderRadius: radii.sm },
            ]}
          >
            <Text style={{ fontSize: 10, color: config.color, fontWeight: '600' }}>
              {config.label}
            </Text>
          </View>
        </TouchableOpacity>
      );
    },
    [colors, radii, spacing, typography, shadows, handleResultPress]
  );

  return (
    <SafeAreaView
      testID="unified-search-screen"
      style={{ flex: 1, backgroundColor: colors.background }}
      edges={['bottom']}
    >
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        {/* 검색바 */}
        <Animated.View
          entering={FadeInUp.duration(TIMING.normal)}
          style={{ paddingHorizontal: spacing.md, paddingTop: spacing.sm }}
        >
          <View
            style={[
              styles.searchBar,
              {
                backgroundColor: colors.secondary,
                borderRadius: radii.xl,
                paddingHorizontal: spacing.md,
              },
            ]}
          >
            <Search size={18} color={colors.mutedForeground} />
            <TextInput
              style={[styles.searchInput, { color: colors.foreground, fontSize: typography.size.base }]}
              placeholder="검색어를 입력하세요"
              placeholderTextColor={colors.mutedForeground}
              value={query}
              onChangeText={setQuery}
              returnKeyType="search"
              onSubmitEditing={() => handleSearch(query)}
              autoFocus
            />
            {query.length > 0 && (
              <TouchableOpacity onPress={handleClear}>
                <X size={18} color={colors.mutedForeground} />
              </TouchableOpacity>
            )}
          </View>
        </Animated.View>

        {/* 빠른 검색 */}
        {!hasSearched && (
          <Animated.View
            entering={FadeInUp.delay(80).duration(TIMING.normal)}
            style={{ padding: spacing.md }}
          >
            <Text
              style={{
                fontSize: typography.size.sm,
                fontWeight: typography.weight.semibold,
                color: colors.foreground,
                marginBottom: spacing.sm,
              }}
            >
              빠른 검색
            </Text>
            <View style={[styles.quickGrid, { gap: spacing.xs }]}>
              {QUICK_SEARCHES.map((term) => (
                <TouchableOpacity
                  key={term}
                  style={[
                    styles.quickChip,
                    {
                      backgroundColor: colors.secondary,
                      borderRadius: radii.full,
                      paddingHorizontal: spacing.md,
                      paddingVertical: spacing.xs,
                    },
                  ]}
                  onPress={() => {
                    setQuery(term);
                    handleSearch(term);
                  }}
                >
                  <Text style={{ fontSize: typography.size.xs, color: colors.foreground }}>
                    {term}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </Animated.View>
        )}

        {/* 검색 중 */}
        {isSearching && (
          <View style={styles.centerFull}>
            <ActivityIndicator size="large" color={brand.primary} />
            <Text
              style={{
                marginTop: spacing.sm,
                fontSize: typography.size.sm,
                color: colors.mutedForeground,
              }}
            >
              검색 중...
            </Text>
          </View>
        )}

        {/* 검색 결과 */}
        {!isSearching && hasSearched && (
          <View style={{ flex: 1, paddingHorizontal: spacing.md }}>
            <Text
              style={{
                fontSize: typography.size.sm,
                color: colors.mutedForeground,
                marginBottom: spacing.sm,
              }}
            >
              {results.length}개 결과
            </Text>
            {results.length === 0 ? (
              <View style={styles.centerFull}>
                <Search size={48} color={colors.mutedForeground} />
                <Text
                  style={{
                    fontSize: typography.size.base,
                    fontWeight: '600',
                    color: colors.foreground,
                    marginTop: spacing.md,
                  }}
                >
                  검색 결과가 없어요
                </Text>
                <Text
                  style={{
                    fontSize: typography.size.sm,
                    color: colors.mutedForeground,
                    marginTop: spacing.xs,
                    textAlign: 'center',
                  }}
                >
                  다른 검색어를 시도해보세요
                </Text>
              </View>
            ) : (
              <FlatList
                data={results}
                keyExtractor={(item) => item.id}
                renderItem={renderResultItem}
                contentContainerStyle={{ paddingBottom: spacing.xxl }}
                showsVerticalScrollIndicator={false}
              />
            )}
          </View>
        )}
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

function getAnalysisLabel(type: string): string {
  const labels: Record<string, string> = {
    'personal-color': '퍼스널컬러 분석',
    skin: '피부 분석',
    body: '체형 분석',
    hair: '헤어 분석',
    makeup: '메이크업 분석',
    'oral-health': '구강건강 분석',
    posture: '자세 분석',
  };
  return labels[type] ?? `${type} 분석`;
}

const styles = StyleSheet.create({
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 48,
  },
  searchInput: {
    flex: 1,
    marginLeft: 8,
    marginRight: 8,
    height: 48,
  },
  quickGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  quickChip: {},
  centerFull: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  resultIcon: {
    width: 36,
    height: 36,
    justifyContent: 'center',
    alignItems: 'center',
  },
  typeBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
});
