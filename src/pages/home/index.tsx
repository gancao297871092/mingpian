import React, { useMemo } from 'react';
import {
  FlatList,
  StyleSheet,
  Text,
  TouchableOpacity,
  RefreshControl
} from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { CompositeScreenProps } from '@react-navigation/native';
import { BottomTabScreenProps } from '@react-navigation/bottom-tabs';
import { API } from '@/api';
import End from '@/components/End';
import Empty from '@/components/Empty';
import { usePageList } from '@/hooks';
import { useTheme } from '@/theme';
import { scaleSizeH, scaleSizeW, setSpText } from '@/utils/screenUtils';
import type { RootStackParamList, MainTabParamList } from '@/route/map';

type Props = CompositeScreenProps<
  BottomTabScreenProps<MainTabParamList, 'home'>,
  NativeStackScreenProps<RootStackParamList>
>;

export default function Home({ navigation }: Props) {
  const theme = useTheme();
  const { list, refresh, loadMore, fetching, isLastPage } = usePageList(
    API.home.postList,
    useMemo(() => ({ loading: false }), []),
    20,
    true,
  );

  return (
    <FlatList
      data={list}
      style={[styles.container, { backgroundColor: theme.background }]}
      keyExtractor={(item, index) => `${item?.id ?? index}`}
      refreshControl={
        <RefreshControl
          refreshing={fetching}
          onRefresh={refresh}
        />
      }
      onEndReached={() => {
        if (!fetching) loadMore();
      }}
      onEndReachedThreshold={0.3}
      ListEmptyComponent={<Empty />}
      ListFooterComponent={
        <End isLastPage={isLastPage} list={list} isLoading={fetching && list.length > 0} />
      }
      renderItem={({ item, index }) => (
        <TouchableOpacity
          style={[styles.card, { backgroundColor: theme.card }]}
          activeOpacity={0.85}
          onPress={() => navigation.navigate('detail', { id: item?.id ?? index })}
        >
          <Text style={[styles.cardTitle, { color: theme.text }]} numberOfLines={1}>
            {item?.title ?? `示例条目 ${index + 1}`}
          </Text>
          <Text style={[styles.cardDesc, { color: theme.subText }]} numberOfLines={2}>
            {item?.content ?? '这是模版示例卡片，接入真实接口后展示实际数据。'}
          </Text>
        </TouchableOpacity>
      )}
    />
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  card: {
    marginHorizontal: scaleSizeW(15),
    marginTop: scaleSizeH(12),
    padding: scaleSizeH(14),
    borderRadius: scaleSizeH(10),
  },
  cardTitle: {
    fontSize: setSpText(15),
    fontWeight: 'bold',
  },
  cardDesc: {
    fontSize: setSpText(12),
    marginTop: scaleSizeH(8),
    lineHeight: scaleSizeH(18),
  },
});
