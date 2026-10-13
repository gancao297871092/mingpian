import React, { useEffect, useRef, useState } from 'react';
import {
  Animated,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  useWindowDimensions,
} from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Image as ExpoImage } from 'expo-image';
import * as Contacts from 'expo-contacts/legacy';
import Toast from 'react-native-toast-message';
import { API } from '@/api';
import { scaleSizeH, scaleSizeW, setSpText } from '@/utils/screenUtils';
import { CardVerifiedIcon } from '@/components/cards/cardIcons';
import CardShareSheet from '@/components/cards/CardShareSheet';
import { ChevronRightIcon } from '@/pages/square/bbsDetail/sheetIcons';
import { useUserStore } from '@/store/user';
import type { RootStackParamList } from '@/route/map';
import BaseInfo from './BaseInfo';
import ItemList from './ItemList';
import PlazaList, { type PlazaListHandle } from './PlazaList';
import { AuthPositionIcon, AuthRealIcon, ContactAddIcon, FavStarIcon, ForwardIcon } from './icons';

type Props = NativeStackScreenProps<RootStackParamList, 'cardDetail'>;

const TABS = ['基本信息', '价值亮点', '广场动态'];

/** 实名脱敏：张工程师 → 张*工程师 */
function maskName(name?: string): string {
  if (!name) return '';
  if (name.length <= 1) return name;
  return name[0] + '*' + name.slice(2);
}

/** 名片详情（figma 预览1-3）：头部轮播图 + 三个 tab，数据 /bbs/cardDetail（对齐小程序 cardDetail） */
export default function CardDetail({ navigation, route }: Props) {
  const { id } = route.params;
  // const id = 437
  // console.log('CardDetail id:', id);
  const insets = useSafeAreaInsets();
  const { width: screenWidth } = useWindowDimensions();

  const [data, setData] = useState<any>(null);
  const [tab, setTab] = useState(0);
  const [current, setCurrent] = useState(0);
  const [favored, setFavored] = useState(false);
  const [shareVisible, setShareVisible] = useState(false);
  const [savingContact, setSavingContact] = useState(false);
  const plazaRef = useRef<PlazaListHandle>(null);
  const scrollY = useRef(new Animated.Value(0)).current;
  const myId = useUserStore((s) => s.userInfo?.wqUser?.id);

  // iOS 下拉回弹时头部图片拉伸（原生驱动 transform，避免 JS 重渲染抖动）
  const headerScale = scrollY.interpolate({
    inputRange: [-screenWidth, 0],
    outputRange: [2, 1],
    extrapolate: 'clamp',
  });
  const headerTranslateY = scrollY.interpolate({
    inputRange: [-screenWidth, 0],
    outputRange: [-screenWidth / 2, 0],
    extrapolate: 'clamp',
  });

  useEffect(() => {
    (async () => {
      try {
        const res = await API.card.aggregate({ cardId: id });
        if (res.code === '200' && res.data) {
          setData(res.data);
          setFavored(Number(res.data.userCard?.userIsFavorite) === 1);
        }
      } catch {
        // ignore
      }
    })();
  }, [id]);

  const userCard = data?.userCard;
  const userInfo = data?.userInfo;
  const wqUser = userInfo?.wqUser;
  // 自己的名片不展示「收藏名片/存入通讯录」
  const isSelf = !!myId && !!wqUser?.id && Number(myId) === Number(wqUser.id);

  /** 收藏/取消收藏名片（对齐小程序 cardPanel onCollect） */
  const onToggleFav = async () => {
    if (!userCard) return;
    const next = !favored;
    setFavored(next);
    try {
      const res = await API.card.favoriteDo({ cardId: id, type: next ? 1 : 0 });
      if (res.code !== '200') throw new Error(String(res.code));
      Toast.show({ type: 'success', text1: next ? '已收藏名片' : '已取消收藏' });
    } catch {
      setFavored(!next);
      Toast.show({ type: 'error', text1: '操作失败' });
    }
  };

  /** 存入系统通讯录（expo-contacts） */
  const onSaveContact = async () => {
    if (savingContact || !userCard) return;
    setSavingContact(true);
    try {
      const { status } = await Contacts.requestPermissionsAsync();
      if (status !== 'granted') {
        Toast.show({ type: 'error', text1: '请允许访问通讯录' });
        return;
      }
      const street = `${userCard.province || ''}${userCard.city || ''}${userCard.district || ''}${userCard.address || ''}`;
      const contact = {
        contactType: Contacts.ContactTypes.Person,
        name: userCard.nameZh || '',
        firstName: userCard.nameZh || '',
        company: userInfo?.cpName || '',
        jobTitle: userCard.position || '',
        phoneNumbers: [
          ...(userCard.phone ? [{ label: 'mobile', number: String(userCard.phone) }] : []),
          ...(userCard.telNumber ? [{ label: 'work', number: String(userCard.telNumber) }] : []),
        ],
        emails: userCard.email ? [{ label: 'work', email: String(userCard.email) }] : [],
        addresses: street
          ? [{ label: 'work', street, city: userCard.city || '', region: userCard.province || '', country: '中国' }]
          : [],
      };
      const containerId = Platform.OS === 'ios' ? await Contacts.getDefaultContainerIdAsync() : undefined;
      await Contacts.addContactAsync(contact, containerId);
      Toast.show({ type: 'success', text1: '已存入通讯录' });
    } catch {
      Toast.show({ type: 'error', text1: '保存失败' });
    } finally {
      setSavingContact(false);
    }
  };
  const medias: string[] = (userCard?.mediaLinkList || [])
    .map((o: any) => o?.media?.mdUrl || o?.mdUrl)
    .filter(Boolean);

  const badges: { key: string; icon: React.ReactNode; text: string }[] = [];
  if (wqUser?.authRealCard) {
    badges.push({ key: 'real', icon: <AuthRealIcon />, text: `已实名：${maskName(wqUser.realName)}` });
  }
  if (wqUser?.authCompany && userInfo?.cpName) {
    badges.push({ key: 'company', icon: <CardVerifiedIcon size={15} />, text: `已认证：${userInfo.cpName}` });
  }
  if (wqUser?.authPosition) {
    badges.push({ key: 'position', icon: <AuthPositionIcon />, text: `已认证：${userInfo?.position || '无职位'}` });
  }

  return (
    <View style={styles.container}>
      <Animated.FlatList
        style={[styles.flex, tab === 2 && styles.scrollGray]}
        showsVerticalScrollIndicator={false}
        scrollEventThrottle={16}
        data={['content']}
        keyExtractor={(item: string) => item}
        onScroll={Animated.event([{ nativeEvent: { contentOffset: { y: scrollY } } }], {
          useNativeDriver: true,
        })}
        onEndReachedThreshold={0.3}
        onEndReached={() => plazaRef.current?.loadMore()}
        ListHeaderComponent={
          <>
            {/* 头部轮播图（mediaLinkList，对齐小程序 swiper）；下拉回弹时向上拉伸 */}
            <View style={{ height: screenWidth }}>
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
                        style={{ width: screenWidth, height: screenWidth }}
                        contentFit="cover"
                        transition={150}
                      />
                    ))}
                  </ScrollView>
                ) : (
                  <View style={[styles.swiperEmpty, { width: screenWidth, height: screenWidth }]} />
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

            {/* 白色信息面板（上叠轮播图） */}
            <View style={styles.panel}>
              <View style={styles.nameRow}>
                <Text style={styles.name}>{userCard?.nameZh || ''}</Text>
                {!!userCard?.nameEn && <Text style={styles.nameEn}>{userCard.nameEn}</Text>}
              </View>
              {!!userCard?.position && <Text style={styles.position}>{userCard.position}</Text>}
              {!!userCard?.profile && <Text style={styles.profile}>{userCard.profile}</Text>}

              {badges.length > 0 && (
                <View style={styles.badgeCol}>
                  {badges.map((b) => (
                    <View key={b.key} style={styles.badgeRow}>
                      {b.icon}
                      <Text style={styles.badgeText}>{b.text}</Text>
                    </View>
                  ))}
                </View>
              )}

              {/* 收藏名片 / 存入通讯录（figma 实际 2228:5932，自己的名片不展示） */}
              {!isSelf && !!userCard && (
                <View style={styles.actionRow}>
                  <TouchableOpacity
                    activeOpacity={0.8}
                    style={[styles.actionBtn, styles.actionBtnPrimary]}
                    onPress={onToggleFav}
                  >
                    <FavStarIcon />
                    <Text style={styles.actionTextPrimary}>{favored ? '已收藏' : '收藏名片'}</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    activeOpacity={0.8}
                    style={[styles.actionBtn, styles.actionBtnGray]}
                    onPress={onSaveContact}
                  >
                    <ContactAddIcon />
                    <Text style={styles.actionTextDark}>存入通讯录</Text>
                  </TouchableOpacity>
                </View>
              )}

              {/* tab 栏 */}
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
        renderItem={() => (
          <View style={styles.tabContent}>
            {tab === 0 && <BaseInfo userCard={userCard} userInfo={userInfo} />}
            {tab === 1 && <ItemList project={data?.projectList?.[0]} />}
            {tab === 2 && <PlazaList ref={plazaRef} userId={userCard?.userId} />}
          </View>
        )}
        ListFooterComponent={<View style={styles.bottomGap} />}
      />

      {/* 悬浮返回按钮 */}
      <TouchableOpacity
        style={[styles.backBtn, { top: insets.top + scaleSizeW(10) }]}
        activeOpacity={0.8}
        onPress={() => navigation.goBack()}
      >
        <View style={styles.backFlip}>
          <ChevronRightIcon />
        </View>
      </TouchableOpacity>

      {/* 悬浮转发按钮（figma 实际 2228:5908，自己的名片也可分享） */}
      <TouchableOpacity
        style={[styles.shareBtn, { top: insets.top + scaleSizeW(10) }]}
        activeOpacity={0.8}
        onPress={() => userCard && setShareVisible(true)}
      >
        <ForwardIcon />
      </TouchableOpacity>

      <CardShareSheet
        visible={shareVisible}
        onClose={() => setShareVisible(false)}
        card={userCard ? { ...userCard, id: userCard.id ?? id } : undefined}
      />
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
    bottom: scaleSizeW(71),
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
    marginTop: scaleSizeW(-58),
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: scaleSizeW(20),
    borderTopRightRadius: scaleSizeW(20),
    paddingHorizontal: scaleSizeW(16),
    paddingTop: scaleSizeW(20),
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: scaleSizeW(9),
  },
  name: {
    fontSize: setSpText(20),
    fontWeight: '600',
    color: '#000000',
  },
  nameEn: {
    fontSize: setSpText(12),
    fontWeight: '400',
    color: '#6C6C6C',
  },
  position: {
    fontSize: setSpText(14),
    fontWeight: '400',
    color: '#6C6C6C',
    marginTop: scaleSizeW(4),
  },
  profile: {
    fontSize: setSpText(14),
    fontWeight: '400',
    color: '#000000',
    lineHeight: scaleSizeW(24),
    letterSpacing: -0.4,
    marginTop: scaleSizeW(16),
  },
  badgeCol: {
    gap: scaleSizeW(5),
    marginTop: scaleSizeW(13),
  },
  badgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: scaleSizeW(5),
  },
  badgeText: {
    fontSize: setSpText(12),
    fontWeight: '400',
    color: '#6C6C6C',
    lineHeight: scaleSizeW(20),
    letterSpacing: -0.4,
  },
  tabRow: {
    flexDirection: 'row',
    gap: scaleSizeW(34),
    marginTop: scaleSizeW(30),
  },
  actionRow: {
    flexDirection: 'row',
    gap: scaleSizeW(10),
    marginTop: scaleSizeH(24),
  },
  actionBtn: {
    flex: 1,
    height: scaleSizeH(40),
    borderRadius: scaleSizeW(5),
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: scaleSizeW(5),
  },
  actionBtnPrimary: {
    backgroundColor: '#2962D4',
  },
  actionBtnGray: {
    backgroundColor: '#F3F3F1',
  },
  actionTextPrimary: {
    fontSize: setSpText(14),
    color: '#FFFFFF',
  },
  actionTextDark: {
    fontSize: setSpText(14),
    color: '#000000',
  },
  tabItem: {
    alignItems: 'center',
  },
  tabText: {
    fontSize: setSpText(15),
    fontWeight: '400',
    color: '#6C6C6C',
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
    backgroundColor: '#2962D4',
  },
  tabDivider: {
    height: 1,
    backgroundColor: '#EBEBEB',
  },
  tabContent: {
    paddingHorizontal: 0,
  },
  bottomGap: {
    height: scaleSizeW(40),
  },
  backBtn: {
    position: 'absolute',
    left: scaleSizeW(16),
    width: scaleSizeW(36),
    height: scaleSizeW(36),
    borderRadius: scaleSizeW(18),
    backgroundColor: 'rgba(255,255,255,0.9)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  backFlip: {
    transform: [{ scaleX: -1 }],
  },
  shareBtn: {
    position: 'absolute',
    right: scaleSizeW(16),
    width: scaleSizeW(36),
    height: scaleSizeW(36),
    borderRadius: scaleSizeW(18),
    backgroundColor: 'rgba(255,255,255,0.9)',
    alignItems: 'center',
    justifyContent: 'center',
  },
});
