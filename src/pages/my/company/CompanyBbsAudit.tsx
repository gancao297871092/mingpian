import React, { useCallback, useRef, useState } from 'react';
import { ActivityIndicator, FlatList, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Image as ExpoImage } from 'expo-image';
import Svg, { Path } from 'react-native-svg';
import SafeView from '@/components/SafeView';
import EmptyState from '@/components/EmptyState';
import { API } from '@/api';
import { scaleSizeH, scaleSizeW, setSpText } from '@/utils/screenUtils';
import { ossVideoSnapshot } from '@/pages/square/bbsDetail/detailTransform';
import type { RootStackParamList } from '@/route/map';

const GRAY = '#6C6C6C';
const PAGE_SIZE = 10;

/** 视频播放角标 */
function PlayBadge() {
  return (
    <View style={styles.playBadge}>
      <Svg width={scaleSizeW(10)} height={scaleSizeW(10)} viewBox="0 0 24 24">
        <Path d="M8 5.5v13c0 .8.9 1.3 1.6.9l10.2-6.5c.6-.4.6-1.4 0-1.8L9.6 4.6c-.7-.4-1.6.1-1.6.9z" fill="#FFFFFF" />
      </Svg>
    </View>
  );
}

/** 动态审核（企业成员动态内容审核，对齐小程序 dynamicsEx；点卡片进 bbsDetail 审核模式） */
export default function CompanyBbsAudit() {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const [list, setList] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const pageRef = useRef(1);
  const pagesRef = useRef(1);
  const loadingMoreRef = useRef(false);

  const fetchList = useCallback(async (page: number, replace: boolean) => {
    try {
      const res = await API.company.bbsCheckList({ pageNum: page, pageSize: PAGE_SIZE });
      if (res.code !== '200') return;
      const d = res.data;
      const items: any[] = Array.isArray(d) ? d : d?.list || d?.records || d?.rows || [];
      pageRef.current = page;
      pagesRef.current = d?.pages || 1;
      setList((prev) => (replace ? items : [...prev, ...items]));
    } catch {
      // ignore
    }
  }, []);

  // 每次进入/从审核详情返回都刷新第一页（审核操作后列表需移除已审项）
  useFocusEffect(
    useCallback(() => {
      setLoading(true);
      fetchList(1, true).finally(() => setLoading(false));
    }, [fetchList]),
  );

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchList(1, true).finally(() => setRefreshing(false));
  }, [fetchList]);

  const onEndReached = useCallback(() => {
    if (loadingMoreRef.current || pageRef.current >= pagesRef.current) return;
    loadingMoreRef.current = true;
    fetchList(pageRef.current + 1, false).finally(() => {
      loadingMoreRef.current = false;
    });
  }, [fetchList]);

  const renderItem = ({ item }: { item: any }) => {
    const media = item.mediaLinkList?.[0]?.media;
    const isVideo = media?.fileType === 'video';
    const thumb = isVideo
      ? item.posterUrl || ossVideoSnapshot(media?.mdUrl || '')
      : media?.mdUrl
        ? `${media.mdUrl}?x-oss-process=image/resize,m_lfit,w_300`
        : '';
    const author = item.userInfoVo?.realName || item.userInfoVo?.username || '';
    const time = (item.pushTime || '').slice(5, 16);
    return (
      <TouchableOpacity
        activeOpacity={0.8}
        style={styles.card}
        onPress={() => navigation.navigate('bbsDetail', { id: String(item.id || item.bbsId), audit: true })}
      >
        <View style={styles.textCol}>
          <Text style={styles.postText} numberOfLines={2}>{item.title || item.content || ''}</Text>
          <View style={styles.authorRow}>
            {!!item.userInfoVo?.avatar && (
              <ExpoImage
                source={{ uri: item.userInfoVo.avatar }}
                recyclingKey={item.userInfoVo.avatar}
                style={styles.avatar}
                contentFit="cover"
                transition={150}
              />
            )}
            <Text style={styles.authorText}>{author}{time ? `·发布于${time}` : ''}</Text>
          </View>
        </View>
        {!!thumb && (
          <View>
            <ExpoImage source={{ uri: thumb }} recyclingKey={thumb} style={styles.postImage} contentFit="cover" transition={150} />
            {isVideo && <PlayBadge />}
          </View>
        )}
      </TouchableOpacity>
    );
  };

  return (
    <SafeView backgroundColor="#F6F7FB">
      <FlatList
        data={list}
        keyExtractor={(item, index) => String(item.id ?? item.bbsId ?? index)}
        renderItem={renderItem}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        refreshing={refreshing}
        onRefresh={onRefresh}
        onEndReached={onEndReached}
        onEndReachedThreshold={0.3}
        ListEmptyComponent={
          loading ? (
            <ActivityIndicator style={styles.loading} color={GRAY} />
          ) : (
            <EmptyState variant="content" title="暂无待审核动态" />
          )
        }
      />
    </SafeView>
  );
}

const styles = StyleSheet.create({
  content: {
    padding: scaleSizeW(16),
    paddingTop: scaleSizeH(6),
    paddingBottom: scaleSizeH(40),
    flexGrow: 1,
  },
  loading: {
    marginTop: scaleSizeH(60),
  },
  card: {
    flexDirection: 'row',
    gap: scaleSizeW(10),
    backgroundColor: '#FFFFFF',
    borderRadius: scaleSizeW(10),
    padding: scaleSizeW(14),
    marginTop: scaleSizeH(10),
  },
  textCol: {
    flex: 1,
    justifyContent: 'space-between',
    gap: scaleSizeH(20),
  },
  postText: {
    fontSize: setSpText(15),
    lineHeight: setSpText(24),
    color: '#000000',
  },
  authorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: scaleSizeW(5),
  },
  avatar: {
    width: scaleSizeW(20),
    height: scaleSizeW(20),
    borderRadius: scaleSizeW(10),
    borderWidth: 1,
    borderColor: '#D9D9D9',
    backgroundColor: '#F5F5F5',
  },
  authorText: {
    fontSize: setSpText(14),
    lineHeight: setSpText(19),
    color: GRAY,
  },
  postImage: {
    width: scaleSizeW(67),
    height: scaleSizeH(90),
    borderRadius: scaleSizeW(4),
    borderWidth: 1,
    borderColor: '#D9D9D9',
    backgroundColor: '#F5F5F5',
  },
  playBadge: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
