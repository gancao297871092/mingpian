import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  Animated,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  useWindowDimensions,
} from 'react-native';
import { useFocusEffect, useNavigation, useRoute, type RouteProp } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Image as ExpoImage } from 'expo-image';
import Toast from 'react-native-toast-message';
import Svg, { Path } from 'react-native-svg';
import { API } from '@/api';
import { scaleSizeH, scaleSizeW, setSpText } from '@/utils/screenUtils';
import type { RootStackParamList } from '@/route/map';
import { BackArrowIcon, BlueBadgeIcon, ChatBubbleIcon } from '../myIcons';
import CompanyPostList, { type CompanyPostListHandle } from './CompanyPostList';
import CompanyGallery from './CompanyGallery';

const PRIMARY = '#2962D4';
const GRAY = '#6C6C6C';

const TABS = ['最新动态', '可信档案'];

/** 地址定位小图标（figma 企业主页 2330:5993） */
function LocationIcon() {
  return (
    <Svg width={scaleSizeW(8)} height={scaleSizeW(10)} viewBox="0 0 8 10" fill="none">
      <Path
        d="M4 0C1.79 0 0 1.79 0 4c0 3 4 6 4 6s4-3 4-6c0-2.21-1.79-4-4-4zm0 5.5A1.5 1.5 0 1 1 4 2.5a1.5 1.5 0 0 1 0 3z"
        fill="#999999"
      />
    </Svg>
  );
}

/** 企业主页（figma 2330:5857 / 企业主页2 1205:4838；交互对齐名片详情 cardDetail：单个 FlatList + 头部轮播下拉拉伸 + tab 状态切换 + 悬浮返回） */
export default function CompanyPage() {
  const route = useRoute<RouteProp<RootStackParamList, 'companyPage'>>();
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const insets = useSafeAreaInsets();
  const { width: screenWidth } = useWindowDimensions();
  const cpId = route.params.id;

  const [data, setData] = useState<any>(null);
  const [groups, setGroups] = useState<any[]>([]);
  const [groupsLoaded, setGroupsLoaded] = useState(false);
  const [tab, setTab] = useState(0);
  const [current, setCurrent] = useState(0);
  const postRef = useRef<CompanyPostListHandle>(null);
  const scrollY = useRef(new Animated.Value(0)).current;

  const bannerH = scaleSizeW(302);
  // iOS 下拉回弹时 banner 拉伸（对齐名片详情）
  const headerScale = scrollY.interpolate({
    inputRange: [-bannerH, 0],
    outputRange: [2, 1],
    extrapolate: 'clamp',
  });
  const headerTranslateY = scrollY.interpolate({
    inputRange: [-bannerH, 0],
    outputRange: [-bannerH / 2, 0],
    extrapolate: 'clamp',
  });

  // 状态栏：封面上白色图标，离开恢复黑色
  useFocusEffect(
    useCallback(() => {
      StatusBar.setBarStyle('light-content');
      return () => StatusBar.setBarStyle('dark-content');
    }, []),
  );

  useEffect(() => {
    API.company
      .main({ cpId })
      .then((res) => {
        if (res.code === '200' && res.data) setData(res.data);
      })
      .catch(() => {});
    // 可信档案图片分组随主页一并请求，切 tab 不再等待
    API.company
      .gallery({ cpId })
      .then((res) => {
        if (res.code === '200') setGroups(res.data?.groups || []);
      })
      .catch(() => {})
      .finally(() => setGroupsLoaded(true));
  }, [cpId]);

  const medias: string[] = (data?.mediaLinkList || [])
    .map((o: any) => o?.media?.mdUrl || o?.mdUrl)
    .filter(Boolean);
  const tags: string[] = (data?.propertyTags || '').split(',').filter(Boolean);
  const browseCount = data?.countBrowse ?? data?.viewCount ?? 0;
  const intro = (data?.desTxt || (data?.des || '').replace(/<[^>]*>/g, '').replace(/&nbsp;/g, ' ').trim()) ?? '';

  const todo = () => Toast.show({ type: 'info', text1: '功能开发中' });

  return (
    <View style={styles.container}>
      <Animated.FlatList
        style={[styles.flex, tab === 0 && styles.scrollGray]}
        showsVerticalScrollIndicator={false}
        scrollEventThrottle={16}
        data={['content']}
        keyExtractor={(item: string) => item}
        extraData={tab}
        onScroll={Animated.event([{ nativeEvent: { contentOffset: { y: scrollY } } }], {
          useNativeDriver: true,
        })}
        onEndReachedThreshold={0.3}
        onEndReached={() => {
          if (tab === 0) postRef.current?.loadMore();
        }}
        ListHeaderComponent={
          <>
            {/* 顶部 banner 轮播（mediaLinkList）；下拉回弹时向上拉伸 */}
            <View style={{ height: bannerH }}>
              <Animated.View
                style={[
                  StyleSheet.absoluteFill,
                  { transform: [{ translateY: headerTranslateY }, { scale: headerScale }] },
                ]}
              >
                {medias.length > 0 ? (
                  <ScrollView
                    horizontal
                    pagingEnabled
                    showsHorizontalScrollIndicator={false}
                    onMomentumScrollEnd={(e) =>
                      setCurrent(Math.round(e.nativeEvent.contentOffset.x / screenWidth))
                    }
                  >
                    {medias.map((url, ix) => (
                      <ExpoImage
                        key={ix}
                        source={{ uri: url }}
                        recyclingKey={url}
                        style={{ width: screenWidth, height: bannerH }}
                        contentFit="cover"
                        transition={150}
                        cachePolicy="memory-disk"
                      />
                    ))}
                  </ScrollView>
                ) : (
                  <View style={[styles.swiperEmpty, { width: screenWidth, height: bannerH }]} />
                )}
              </Animated.View>
              {medias.length > 1 && (
                <View style={styles.dots} pointerEvents="none">
                  {medias.map((_, ix) => (
                    <View key={ix} style={[styles.dot, ix === current && styles.dotActive]} />
                  ))}
                </View>
              )}
            </View>

            {/* 白色企业信息面板（上叠 banner） */}
            <View style={styles.panel}>
              <View style={styles.logoRow}>
                {data?.avatar ? (
                  <ExpoImage
                    source={{ uri: data.avatar }}
                    recyclingKey={data.avatar}
                    style={styles.logo}
                    contentFit="cover"
                    transition={150}
                  />
                ) : (
                  <View style={[styles.logo, styles.logoEmpty]} />
                )}
                <View style={styles.nameRow}>
                  <Text style={styles.name} numberOfLines={1}>
                    {data?.name || ''}
                  </Text>
                  <BlueBadgeIcon size={16} />
                </View>
              </View>
              {!!intro && (
                <Text style={styles.intro} numberOfLines={2}>
                  {intro}
                </Text>
              )}
              {tags.length > 0 && (
                <View style={styles.tagsRow}>
                  {tags.map((t) => (
                    <View key={t} style={styles.tagChip}>
                      <Text style={styles.tagChipText}>{t}</Text>
                    </View>
                  ))}
                </View>
              )}
              <View style={styles.metaRow}>
                {!!data?.address && (
                  <View style={styles.metaChip}>
                    <LocationIcon />
                    <Text style={styles.metaChipText} numberOfLines={1}>
                      {data.address}
                    </Text>
                  </View>
                )}
                <View style={styles.metaChip}>
                  <Text style={styles.metaChipText}>
                    浏览 <Text style={styles.metaChipNum}>{Number(browseCount).toLocaleString()}</Text>
                  </Text>
                </View>
              </View>
              <View style={styles.btnRow}>
                <TouchableOpacity activeOpacity={0.8} style={styles.siteBtn} onPress={todo}>
                  <Text style={styles.siteBtnText}>企业官网</Text>
                </TouchableOpacity>
                <TouchableOpacity activeOpacity={0.8} style={styles.chatBtn} onPress={todo}>
                  <ChatBubbleIcon size={18} color="#000000" />
                  <Text style={styles.chatBtnText}>发私信</Text>
                </TouchableOpacity>
              </View>

              {/* tab 栏（对齐名片详情：文字下方指示条） */}
              <View style={styles.tabRow}>
                {TABS.map((t, ix) => (
                  <TouchableOpacity key={t} style={styles.tabItem} activeOpacity={0.8} onPress={() => setTab(ix)}>
                    <Text style={[styles.tabText, tab === ix && styles.tabTextActive]}>{t}</Text>
                    <View style={[styles.tabBar, tab === ix && styles.tabBarActive]} />
                  </TouchableOpacity>
                ))}
              </View>
            </View>
            <View style={styles.tabDivider} />
          </>
        }
        renderItem={() =>
          tab === 0 ? (
            <CompanyPostList ref={postRef} cpId={cpId} />
          ) : (
            <CompanyGallery main={data} groups={groups} groupsLoaded={groupsLoaded} />
          )
        }
        ListFooterComponent={<View style={styles.bottomGap} />}
      />

      {/* 悬浮返回按钮（figma 毛玻璃圆形） */}
      <TouchableOpacity
        style={[styles.backBtn, { top: insets.top + scaleSizeW(10) }]}
        activeOpacity={0.8}
        onPress={() => navigation.goBack()}
      >
        <BackArrowIcon size={20} color="#1A1A1A" />
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  flex: {
    flex: 1,
  },
  scrollGray: {
    backgroundColor: '#F6F7FB',
  },
  swiperEmpty: {
    backgroundColor: '#E5E5E5',
  },
  dots: {
    position: 'absolute',
    bottom: scaleSizeW(30),
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'center',
    gap: scaleSizeW(5),
  },
  dot: {
    width: scaleSizeW(4),
    height: scaleSizeW(4),
    borderRadius: scaleSizeW(2),
    backgroundColor: 'rgba(255,255,255,0.5)',
  },
  dotActive: {
    width: scaleSizeW(15),
    backgroundColor: '#FFFFFF',
  },
  panel: {
    marginTop: scaleSizeW(-20),
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: scaleSizeW(20),
    borderTopRightRadius: scaleSizeW(20),
    paddingHorizontal: scaleSizeW(16),
    paddingTop: scaleSizeW(20),
  },
  logoRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  logo: {
    width: scaleSizeW(70),
    height: scaleSizeW(70),
    borderRadius: scaleSizeW(35),
    borderWidth: 2,
    borderColor: '#EEEEEE',
    backgroundColor: '#FFFFFF',
  },
  logoEmpty: {
    backgroundColor: '#F5F5F5',
  },
  nameRow: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: scaleSizeW(6),
    marginLeft: scaleSizeW(10),
  },
  name: {
    fontSize: setSpText(20),
    fontWeight: '500',
    color: '#000000',
    flexShrink: 1,
  },
  intro: {
    fontSize: setSpText(14),
    lineHeight: setSpText(24),
    letterSpacing: -0.4,
    color: '#000000',
    marginTop: scaleSizeH(10),
  },
  tagsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: scaleSizeW(5),
    marginTop: scaleSizeH(10),
  },
  tagChip: {
    backgroundColor: '#F2F6FF',
    borderRadius: scaleSizeW(5),
    paddingHorizontal: scaleSizeW(5),
    height: scaleSizeH(20),
    justifyContent: 'center',
  },
  tagChipText: {
    fontSize: setSpText(12),
    lineHeight: setSpText(19),
    color: PRIMARY,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: scaleSizeW(5),
    marginTop: scaleSizeH(10),
  },
  metaChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: scaleSizeW(3),
    backgroundColor: '#F3F3F1',
    borderRadius: scaleSizeW(5),
    paddingHorizontal: scaleSizeW(5),
    height: scaleSizeH(20),
  },
  metaChipText: {
    fontSize: setSpText(12),
    lineHeight: setSpText(20),
    color: GRAY,
  },
  metaChipNum: {
    color: '#000000',
  },
  btnRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: scaleSizeH(20),
  },
  siteBtn: {
    width: scaleSizeW(180),
    height: scaleSizeH(40),
    borderRadius: scaleSizeW(5),
    backgroundColor: PRIMARY,
    alignItems: 'center',
    justifyContent: 'center',
  },
  siteBtnText: {
    fontSize: setSpText(14),
    color: '#FFFFFF',
  },
  chatBtn: {
    width: scaleSizeW(180),
    height: scaleSizeH(40),
    borderRadius: scaleSizeW(5),
    backgroundColor: '#F3F3F1',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: scaleSizeW(5),
  },
  chatBtnText: {
    fontSize: setSpText(14),
    color: '#000000',
  },
  tabRow: {
    flexDirection: 'row',
    gap: scaleSizeW(34),
    marginTop: scaleSizeH(20),
  },
  tabItem: {
    alignItems: 'center',
  },
  tabText: {
    fontSize: setSpText(15),
    fontWeight: '400',
    color: GRAY,
    letterSpacing: -0.4,
  },
  tabTextActive: {
    fontWeight: '500',
    color: '#000000',
  },
  tabBar: {
    width: scaleSizeW(24),
    height: scaleSizeW(2),
    borderRadius: scaleSizeW(90),
    backgroundColor: 'transparent',
    marginTop: scaleSizeW(5),
  },
  tabBarActive: {
    backgroundColor: PRIMARY,
  },
  tabDivider: {
    height: 1,
    backgroundColor: '#EBEBEB',
  },
  bottomGap: {
    height: scaleSizeW(40),
  },
  backBtn: {
    position: 'absolute',
    left: scaleSizeW(16),
    width: scaleSizeW(44),
    height: scaleSizeW(44),
    borderRadius: scaleSizeW(22),
    backgroundColor: 'rgba(255,255,255,0.85)',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000000',
    shadowOpacity: 0.12,
    shadowRadius: 20,
    shadowOffset: { width: 0, height: 4 },
    elevation: 4,
  },
});
