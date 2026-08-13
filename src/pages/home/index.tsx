import React, { useCallback, useRef, useState } from 'react';
import {
  Alert,
  Dimensions,
  Image,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import PagerView from 'react-native-pager-view';
import ViewShot from 'react-native-view-shot';
import SafeView from '@/components/SafeView';
import PermissionButton from '@/components/PermissionButton';
import Card1 from '@/components/cards/Card1';
import Card2 from '@/components/cards/Card2';
import Card3 from '@/components/cards/Card3';
import CpCard from '@/components/cards/CpCard';
import CardPoster1 from '@/components/posters/CardPoster1';
import CardPoster2 from '@/components/posters/CardPoster2';
import CardPoster3 from '@/components/posters/CardPoster3';
import CpPoster from '@/components/posters/CpPoster';
import { API } from '@/api';
import { useUserStore } from '@/store/user';
import { scaleSizeH, scaleSizeW } from '@/utils/screenUtils';
import type { RootStackParamList } from '@/route/map';
import { saveToGallery } from '@/components/capabilities/Gallery';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

const AUTH_ITEMS = [
  { key: 'authRealCard', label: '实名认证', iconOn: require('@/assets/ming/5.png'), iconOff: require('@/assets/ming/11.png'), openIndex: 1 },
  { key: 'authCompany', label: '企业认证', iconOn: require('@/assets/ming/6.png'), iconOff: require('@/assets/ming/12.png'), openIndex: 3 },
  { key: 'authPosition', label: '职位认证', iconOn: require('@/assets/ming/7.png'), iconOff: require('@/assets/ming/13.png'), openIndex: 2 },
];

export default function Home() {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const { token, userInfo, setUserInfo } = useUserStore();
  const isLogin = !!token;

  const [swiperList, setSwiperList] = useState<any[]>([]);
  const [navList, setNavList] = useState<{ id: string | number; name: string }[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectId, setSelectId] = useState<string | number>('');
  const [isFirst, setIsFirst] = useState(true);

  // 分享海报弹窗
  const [shareVisible, setShareVisible] = useState(false);
  const [shareItem, setShareItem] = useState<any>(null);
  const shareShotRef = useRef<any>(null);

  const swiperListRef = useRef(swiperList);
  const isFirstRef = useRef(isFirst);
  const pagerRef = useRef<PagerView>(null);
  swiperListRef.current = swiperList;
  isFirstRef.current = isFirst;

  const wqUser = (userInfo?.wqUser || {}) as Record<string, any>;

  const getList = useCallback(async () => {
    if (!isLogin) return;
    try {
      const res = await API.card.list(!isFirstRef.current ? { t: Date.now() } : undefined);
      if (res.code !== '200') return;
      const cardsList = res.data?.cardsList || [];

      setIsFirst(false);

      const ids = swiperListRef.current.map((o) => o.id);
      const allSame =
        cardsList.length === ids.length && cardsList.every((p: any) => ids.includes(p.id));

      if (allSame) {
        setSwiperList((prev) =>
          prev.map((o) => cardsList.find((p: any) => p.id === o.id) || o),
        );
      } else {
        setSwiperList(cardsList);
        if (cardsList[0]) {
          const hasPersonal = cardsList.some((o: any) => !o.isCp);
          if (!hasPersonal) {
            setNavList([
              { name: '未创建名片', id: -1 },
              ...cardsList.map((o: any) => ({
                name: o.isCp ? o.cpName : o.alias,
                id: o.isCp ? `${o.cpId}_cp` : o.id,
              })),
            ]);
            setSelectId(-1);
            setCurrentIndex(0);
          } else {
            setNavList(
              cardsList.map((o: any) => ({
                name: o.isCp ? o.cpName : o.alias,
                id: o.isCp ? `${o.cpId}_cp` : o.id,
              })),
            );
            setSelectId(cardsList[0].id);
            setCurrentIndex(0);
          }
        } else {
          setNavList([{ name: '未创建名片', id: -1 }]);
          setSelectId(-1);
          setCurrentIndex(0);
        }
      }
    } catch (e) {
      // ignore
    }
  }, [isLogin]);

  const getUserInfo = useCallback(async () => {
    if (!isLogin) return;
    try {
      const res = await API.user.info();
      if (res.code === '200') {
        setUserInfo(res.data);
      }
    } catch (e) {
      // ignore
    }
  }, [isLogin]);

  useFocusEffect(
    useCallback(() => {
      getUserInfo();
      getList();
    }, [getUserInfo, getList]),
  );

  const onNav = (id: string | number) => {
    setSelectId(id);
    const idx = navList.findIndex((o) => o.id === id);
    if (idx >= 0) {
      setCurrentIndex(idx);
      pagerRef.current?.setPage(idx);
    }
  };

  const onPageChange = (e: any) => {
    const idx = e.nativeEvent.position;
    setCurrentIndex(idx);
    if (navList[idx]) {
      setSelectId(navList[idx].id);
    }
  };

  const onCreateCard = () => {
    navigation.navigate('editCard', {});
  };

  const onDelCard = async (item: any) => {
    Alert.alert('提示', '确认删除名片吗？', [
      { text: '取消', style: 'cancel' },
      {
        text: '删除',
        style: 'destructive',
        onPress: async () => {
          try {
            const res = await API.card.del({ cardId: item.cardId || item.id });
            if (res.code === '200') {
              getList();
            }
          } catch (e) {
            // ignore
          }
        },
      },
    ]);
  };

  const onShareCard = (item: any) => {
    setShareItem(item);
    setShareVisible(true);
  };

  const onSavePoster = async () => {
    const ref = shareShotRef.current;
    if (!ref) return;
    try {
      const uri = await (ref as any).capture?.({ format: 'png', quality: 1 });
      if (!uri) return;
      const saved = await saveToGallery(uri, 'photo');
      if (saved) {
        Alert.alert('保存成功', '名片海报已保存到相册');
        setShareVisible(false);
      } else {
        Alert.alert('保存失败', '请检查相册权限');
      }
    } catch {
      Alert.alert('保存失败');
    }
  };

  const getPagerHeight = () => {
    const item = swiperList[currentIndex];
    if (!item) return scaleSizeW(375);
    if (item.isCp) {
      return SCREEN_WIDTH - scaleSizeW(31);
    }
    if (item.styleCode === 'FASHION') {
      // 卡片高度 + 创建按钮 + 间距
      return SCREEN_WIDTH - scaleSizeW(31) + scaleSizeW(25) + scaleSizeW(42);
    }
    // NORMAL / TRADITIONAL: 卡片 + 操作栏 + 创建按钮
    return scaleSizeW(375);
  };

  const renderShareModal = () => {
    if (!shareVisible || !shareItem) return null;
    const item = shareItem;
    return (
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <ViewShot ref={shareShotRef} options={{ format: 'png', quality: 1 }}>
            {item.isCp ? (
              <CpPoster data={item} />
            ) : (
              <>
                {item.styleCode === 'NORMAL' && <CardPoster1 data={item} />}
                {item.styleCode === 'TRADITIONAL' && <CardPoster2 data={item} />}
                {item.styleCode === 'FASHION' && <CardPoster3 data={item} />}
              </>
            )}
          </ViewShot>
          <View style={styles.modalActions}>
            <PermissionButton
              mode="direct"
              style={styles.modalBtn}
              onPress={() => setShareVisible(false)}
            >
              <Text style={styles.modalBtnText}>关闭</Text>
            </PermissionButton>
            <PermissionButton
              mode="direct"
              style={[styles.modalBtn, styles.modalBtnPrimary]}
              onPress={onSavePoster}
            >
              <Text style={[styles.modalBtnText, styles.modalBtnTextPrimary]}>保存到相册</Text>
            </PermissionButton>
          </View>
        </View>
      </View>
    );
  };

  const renderAuthItem = (auth: typeof AUTH_ITEMS[0]) => {
    const active = isLogin && !!wqUser[auth.key as keyof typeof wqUser];
    return (
      <PermissionButton
        key={auth.key}
        mode="direct"
        style={styles.authItem}
        onPress={() => navigation.navigate('certification', { openIndex: auth.openIndex })}
      >
        <Image source={active ? auth.iconOn : auth.iconOff} style={styles.authIcon} />
        <Text style={[styles.authText, { color: active ? '#040719' : '#999999' }]}>{auth.label}</Text>
      </PermissionButton>
    );
  };

  const renderNav = () => (
    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.navScroll}>
      {navList.map((it) => (
        <PermissionButton key={`nav-${it.id}`} mode="direct" style={styles.navItem} onPress={() => onNav(it.id)}>
          <Text style={[styles.navText, it.id === selectId && styles.navTextActive]}>{it.name}</Text>
          {it.id === selectId && <View style={styles.navIndicator} />}
        </PermissionButton>
      ))}
    </ScrollView>
  );

  const renderCardActions = (item: any, idx: number) => (
    <View style={styles.actionsRow}>
      <PermissionButton mode="direct" style={styles.actionBtn} onPress={() => onShareCard(item)}>
        <Image source={require('@/assets/ming/share_new1.png')} style={styles.actionIcon} />
        <Text style={styles.actionLabel}>分享</Text>
      </PermissionButton>
      <PermissionButton
        mode="direct"
        style={styles.actionBtn}
        onPress={() => navigation.navigate('editCard', { id: item.cardId || item.id })}
      >
        <Image source={require('@/assets/ming/edit_new.png')} style={styles.actionIcon} />
        <Text style={styles.actionLabel}>编辑</Text>
      </PermissionButton>
      <PermissionButton mode="direct" style={styles.actionBtn} onPress={() => onDelCard(item)}>
        <Image source={require('@/assets/ming/del_2.png')} style={[styles.actionIcon, { width: scaleSizeW(15), height: scaleSizeW(15) }]} />
        <Text style={styles.actionLabel}>删除</Text>
      </PermissionButton>
    </View>
  );

  const renderEmpty = () => (
    <View style={styles.emptyContainer}>
      <View style={styles.emptyCard}>
        <Image source={require('@/assets/ming/14.png')} style={styles.emptyImg} />
      </View>
      <PermissionButton mode="direct" style={styles.createBtn} onPress={onCreateCard}>
        <Text style={styles.createBtnText}>创建新名片</Text>
      </PermissionButton>
    </View>
  );

  const renderPersonalCard = (item: any, idx: number) => {
    const isFashion = item.styleCode === 'FASHION';
    return (
      <View style={styles.pageContainer}>
        <PermissionButton
          mode="direct"
          activeOpacity={0.9}
          onPress={() => navigation.navigate('cardDetail', { id: item.cardId || item.id })}
          style={styles.cardWrapper}
        >
          {item.styleCode === 'NORMAL' && <Card1 cardInfo={item} from="show" />}
          {item.styleCode === 'TRADITIONAL' && (
            <Card2 cardInfo={item} colorConfig={item} from="show" />
          )}
          {item.styleCode === 'FASHION' && (
            <Card3
              cardInfo={item}
              from="show"
              onShare={() => onShareCard(item)}
              onDel={() => onDelCard(item)}
              onEdit={() => navigation.navigate('editCard', { id: item.cardId || item.id })}
            />
          )}
        </PermissionButton>
        {!isFashion && renderCardActions(item, idx)}
        <PermissionButton mode="direct" style={styles.createBtn} onPress={onCreateCard}>
          <Text style={styles.createBtnText}>创建新名片</Text>
        </PermissionButton>
      </View>
    );
  };

  const renderCpCard = (item: any, idx: number) => (
    <View style={styles.pageContainer}>
      <PermissionButton
        mode="direct"
        activeOpacity={0.9}
        onPress={() => navigation.navigate('companyPage', { id: item.cpId, userId: item.userId })}
        style={styles.cpCardWrapper}
      >
        <CpCard cardInfo={item} onShare={() => onShareCard(item)} />
      </PermissionButton>
    </View>
  );

  return (
    <SafeView backgroundColor="#fff">
      <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={[styles.header, { paddingHorizontal: scaleSizeW(24) }]}>
          <View style={styles.logoRow}>
            <Image source={require('@/assets/ming/wanqi_logo.png')} style={styles.logo} />
            <Text style={styles.logoText}>联诚采信</Text>
          </View>

          <View style={styles.userRow}>
            <PermissionButton mode="tip" style={styles.userLeft} onPress={() => { }}>
              <View style={{ overflow: 'hidden', height: scaleSizeH(65) }}>
                <Image source={require('@/assets/ming/hello.png')} style={styles.helloImg} />
              </View>
              <View style={styles.greetingRow}>
                <Text style={styles.greetingText}>
                  {isLogin ? wqUser.username || '' : '请点击登录'}
                </Text>
                <Image source={require('@/assets/ming/hands.png')} style={styles.handsImg} />
              </View>
            </PermissionButton>
            <PermissionButton
              mode="direct"
              onPress={() => navigation.navigate('cardDetail', { id: wqUser.id })}
            >
              <Image
                source={isLogin && wqUser.avatar ? { uri: wqUser.avatar } : require('@/assets/ming/user.png')}
                style={styles.avatar}
              />
            </PermissionButton>
          </View>

          {/* Auth bar */}
          <View style={styles.authBar}>
            {AUTH_ITEMS.map(renderAuthItem)}
          </View>
        </View>

        {/* Card Swiper Nav */}
        {swiperList.length > 0 && (
          <View style={styles.navBar}>
            {renderNav()}
          </View>
        )}

        {/* Card Swiper Content */}
        {swiperList.length === 0 ? (
          renderEmpty()
        ) : (
          <PagerView
            ref={pagerRef}
            style={[styles.pager, { height: getPagerHeight() }]}
            initialPage={currentIndex}
            pageMargin={scaleSizeW(12)}
            onPageSelected={onPageChange}
          >
            {navList.map((nav, idx) => {
              const item = swiperList[idx];
              if (!item) return <View key={`page-${nav.id}`} />;
              if (item.isCp) {
                return (
                  <View key={`page-${nav.id}`} style={styles.page}>
                    {renderCpCard(item, idx)}
                  </View>
                );
              }
              return (
                <View key={`page-${nav.id}`} style={styles.page}>
                  {renderPersonalCard(item, idx)}
                </View>
              );
            })}
          </PagerView>
        )}
      </ScrollView>
      {renderShareModal()}
    </SafeView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    paddingTop: scaleSizeH(10),
  },
  logoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    height: scaleSizeH(40),
  },
  logo: {
    width: scaleSizeW(20),
    height: scaleSizeW(20),
  },
  logoText: {
    marginLeft: scaleSizeW(6),
    fontSize: scaleSizeW(15),
    fontWeight: '600',
    color: '#040719',
    lineHeight: scaleSizeH(20),
  },
  userRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    marginTop: scaleSizeH(15),
  },
  userLeft: {
    justifyContent: 'flex-end',
  },
  helloImg: {
    width: scaleSizeW(75),
    height: scaleSizeW(75),
  },
  greetingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: scaleSizeH(4),
  },
  greetingText: {
    fontSize: scaleSizeW(24),
    fontWeight: '600',
    color: '#040719',
    lineHeight: scaleSizeH(32),
  },
  handsImg: {
    width: scaleSizeW(25),
    height: scaleSizeW(25),
    marginLeft: scaleSizeW(5),
  },
  avatar: {
    width: scaleSizeW(64),
    height: scaleSizeW(64),
    borderRadius: scaleSizeW(32),
  },
  authBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    height: scaleSizeH(32),
    backgroundColor: '#f6f6f6',
    borderRadius: scaleSizeW(10),
    paddingHorizontal: scaleSizeW(25),
    marginTop: scaleSizeH(25),
    marginBottom: scaleSizeH(10),
  },
  authItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  authIcon: {
    width: scaleSizeW(20),
    height: scaleSizeW(20),
  },
  authText: {
    marginLeft: scaleSizeW(3),
    fontSize: scaleSizeW(10),
    fontWeight: 'bold',
    color: '#040719',
  },
  navBar: {
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#eeeeee',
    marginBottom: scaleSizeH(8),
    paddingLeft: scaleSizeW(24),
  },
  navScroll: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingRight: scaleSizeW(24),
  },
  navItem: {
    height: scaleSizeH(35),
    justifyContent: 'center',
    marginRight: scaleSizeW(45),
    position: 'relative',
  },
  navText: {
    fontSize: scaleSizeW(12),
    fontWeight: 'bold',
    color: '#999999',
  },
  navTextActive: {
    color: '#000000',
  },
  navIndicator: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: scaleSizeH(3),
    backgroundColor: '#000000',
    borderRadius: scaleSizeH(1.5),
  },
  pager: {
    marginTop: scaleSizeW(4),
  },
  page: {
    flex: 1,
    paddingHorizontal: scaleSizeW(15),
  },
  pageContainer: {
    flex: 1,
  },
  cardWrapper: {
    borderRadius: scaleSizeW(11),
    overflow: 'hidden',
    alignItems: 'center',
  },
  actionsRow: {
    flexDirection: 'row',
    marginTop: scaleSizeW(16),
    gap: scaleSizeW(11),
  },
  actionBtn: {
    flex: 1,
    height: scaleSizeW(80),
    backgroundColor: '#ffffff',
    borderRadius: scaleSizeW(11),
    borderWidth: 1,
    borderColor: '#eeeeee',
    padding: scaleSizeW(13),
    justifyContent: 'space-between',
  },
  actionIcon: {
    width: scaleSizeW(21),
    height: scaleSizeW(21),
  },
  actionLabel: {
    fontWeight: 'bold',
    fontSize: scaleSizeW(13),
    color: '#000000',
  },
  createBtn: {
    width: scaleSizeW(195),
    height: scaleSizeW(42),
    backgroundColor: '#000000',
    borderRadius: scaleSizeW(21),
    alignSelf: 'center',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: scaleSizeW(25),
  },
  createBtnText: {
    fontSize: scaleSizeW(15),
    fontWeight: 'bold',
    color: '#ffffff',
  },
  emptyContainer: {
    paddingHorizontal: scaleSizeW(15),
    marginTop: scaleSizeW(8),
  },
  emptyCard: {
    height: scaleSizeW(214),
    backgroundColor: '#f6f6f6',
    borderRadius: scaleSizeW(11),
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyImg: {
    width: scaleSizeW(235),
    height: scaleSizeW(235),
  },
  cpCardWrapper: {
    borderRadius: scaleSizeW(11),
    overflow: 'hidden',
    position: 'relative',
  },
  modalOverlay: {
    ...StyleSheet.absoluteFill,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 999,
  },
  modalContent: {
    backgroundColor: '#ffffff',
    borderRadius: scaleSizeW(16),
    padding: scaleSizeW(20),
    alignItems: 'center',
  },
  modalActions: {
    flexDirection: 'row',
    marginTop: scaleSizeH(20),
    gap: scaleSizeW(12),
  },
  modalBtn: {
    paddingHorizontal: scaleSizeW(24),
    paddingVertical: scaleSizeH(10),
    borderRadius: scaleSizeW(20),
    borderWidth: 1,
    borderColor: '#dcdcdc',
  },
  modalBtnPrimary: {
    backgroundColor: '#000000',
    borderColor: '#000000',
  },
  modalBtnText: {
    fontSize: scaleSizeW(14),
    fontWeight: 'bold',
    color: '#000000',
  },
  modalBtnTextPrimary: {
    color: '#ffffff',
  },
});
