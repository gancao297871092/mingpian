import React, { useCallback, useState } from 'react';
import {
  Image,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import PagerView from 'react-native-pager-view';
import SafeView from '@/components/SafeView';
import PermissionButton from '@/components/PermissionButton';
import { API } from '@/api';
import { useUserStore } from '@/store/user';
import { scaleSizeH, scaleSizeW } from '@/utils/screenUtils';
import type { RootStackParamList } from '@/route/map';

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

  const wqUser = (userInfo?.wqUser || {}) as Record<string, any>;

  console.log(userInfo, 'userInfo')

  const getList = useCallback(async () => {
    if (!isLogin) return;
    try {
      const res = await API.card.list();
      if (res.data.code !== '200') return;
      const cardsList = res.data.data?.cardsList || [];
      setIsFirst(false);

      const ids = swiperList.map((o) => o.id);
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
  }, [isLogin, swiperList]);

  const getUserInfo = useCallback(async () => {
    if (!isLogin) return;
    try {
      const res = await API.user.info();
      if (res.data.code === '200') {
        setUserInfo(res.data.data);
      }
    } catch (e) {
      // ignore
    }
  }, [isLogin, setUserInfo]);

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
    try {
      const res = await API.card.del({ cardId: item.cardId || item.id });
      if (res.data.code === '200') {
        getList();
      }
    } catch (e) {
      // ignore
    }
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

  const renderCardActions = (item: any) => (
    <View style={styles.actionsRow}>
      <PermissionButton mode="direct" style={styles.actionBtn} onPress={() => {}}>
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

  const renderPersonalCard = (item: any) => {
    return (
      <View style={styles.pageContainer}>
        <PermissionButton
          mode="direct"
          activeOpacity={0.9}
          onPress={() => navigation.navigate('cardDetail', { id: item.cardId || item.id })}
          style={styles.cardWrapper}
        >
          <View style={[styles.cardPlaceholder, { backgroundColor: '#f6f6f6' }]}>
            <Image source={{ uri: item.cardPoster }} style={styles.cardPoster} resizeMode="cover" />
            <View style={styles.cardInfo}>
              <Text style={styles.cardName}>{item.nameZh || item.alias || '名片'}</Text>
              <Text style={styles.cardPosition}>{item.position || ''}</Text>
              <Text style={styles.cardCompany}>{item.cpName || ''}</Text>
            </View>
          </View>
        </PermissionButton>
        {renderCardActions(item)}
        <PermissionButton mode="direct" style={styles.createBtn} onPress={onCreateCard}>
          <Text style={styles.createBtnText}>创建新名片</Text>
        </PermissionButton>
      </View>
    );
  };

  const renderCpCard = (item: any) => (
    <View style={styles.pageContainer}>
      <PermissionButton
        mode="direct"
        activeOpacity={0.9}
        onPress={() => navigation.navigate('companyPage', { id: item.cpId, userId: item.userId })}
        style={styles.cpCardWrapper}
      >
        <Image source={{ uri: item.cardPoster }} style={styles.cpPoster} resizeMode="cover" />
        <PermissionButton mode="direct" style={styles.cpShareBtn} onPress={() => {}}>
          <Image source={require('@/assets/ming/share_new.png')} style={styles.cpShareIcon} />
        </PermissionButton>
        <View style={styles.cpFooter}>
          <View style={styles.cpFooterBlur} />
          <View style={styles.cpFooterContent}>
            <View>
              <Text style={styles.cpLabel}>企业名片</Text>
              <Text style={styles.cpName}>{item.posterTitle || item.cpName}</Text>
            </View>
            <View style={styles.cpStats}>
              <Image source={require('@/assets/ming/17.png')} style={styles.cpStatIcon} />
              <Text style={styles.cpStatText}>{item.countBrowse || 0}</Text>
            </View>
          </View>
        </View>
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
            <PermissionButton mode="tip" style={styles.userLeft} onPress={() => {}}>
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
            style={styles.pager}
            initialPage={0}
            pageMargin={scaleSizeW(12)}
            onPageSelected={onPageChange}
          >
            {navList.map((nav, idx) => {
              const item = swiperList[idx];
              if (!item) return <View key={`page-${nav.id}`} />;
              if (item.isCp) {
                return (
                  <View key={`page-${nav.id}`} style={styles.page}>
                    {renderCpCard(item)}
                  </View>
                );
              }
              return (
                <View key={`page-${nav.id}`} style={styles.page}>
                  {renderPersonalCard(item)}
                </View>
              );
            })}
          </PagerView>
        )}
      </ScrollView>
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
    height: scaleSizeH(520),
    marginTop: scaleSizeH(8),
  },
  page: {
    flex: 1,
    paddingHorizontal: scaleSizeW(24),
  },
  pageContainer: {
    flex: 1,
  },
  cardWrapper: {
    borderRadius: scaleSizeW(10),
    overflow: 'hidden',
  },
  cardPlaceholder: {
    height: scaleSizeH(300),
    borderRadius: scaleSizeW(10),
    overflow: 'hidden',
    position: 'relative',
  },
  cardPoster: {
    width: '100%',
    height: '100%',
  },
  cardInfo: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: scaleSizeW(16),
    backgroundColor: 'rgba(0,0,0,0.3)',
  },
  cardName: {
    fontSize: scaleSizeW(18),
    fontWeight: 'bold',
    color: '#fff',
  },
  cardPosition: {
    fontSize: scaleSizeW(12),
    color: 'rgba(255,255,255,0.8)',
    marginTop: scaleSizeH(4),
  },
  cardCompany: {
    fontSize: scaleSizeW(12),
    color: 'rgba(255,255,255,0.8)',
    marginTop: scaleSizeH(2),
  },
  actionsRow: {
    flexDirection: 'row',
    marginTop: scaleSizeH(15),
    gap: scaleSizeW(10),
  },
  actionBtn: {
    flex: 1,
    height: scaleSizeH(75),
    backgroundColor: '#ffffff',
    borderRadius: scaleSizeW(10),
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: '#eeeeee',
    padding: scaleSizeW(12),
    justifyContent: 'space-between',
  },
  actionIcon: {
    width: scaleSizeW(20),
    height: scaleSizeW(20),
  },
  actionLabel: {
    fontWeight: 'bold',
    fontSize: scaleSizeW(12),
    color: '#000000',
  },
  createBtn: {
    width: scaleSizeW(182),
    height: scaleSizeH(39),
    backgroundColor: '#000000',
    borderRadius: scaleSizeW(20),
    alignSelf: 'center',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: scaleSizeH(23),
  },
  createBtnText: {
    fontSize: scaleSizeW(14),
    fontWeight: 'bold',
    color: '#ffffff',
  },
  emptyContainer: {
    paddingHorizontal: scaleSizeW(24),
    marginTop: scaleSizeH(15),
  },
  emptyCard: {
    height: scaleSizeH(200),
    backgroundColor: '#f6f6f6',
    borderRadius: scaleSizeW(10),
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyImg: {
    width: scaleSizeW(176),
    height: scaleSizeW(176),
  },
  cpCardWrapper: {
    borderRadius: scaleSizeW(10),
    overflow: 'hidden',
    position: 'relative',
    height: scaleSizeH(350),
  },
  cpPoster: {
    width: '100%',
    height: '100%',
  },
  cpShareBtn: {
    position: 'absolute',
    right: scaleSizeW(18),
    top: scaleSizeH(12),
    width: scaleSizeW(30),
    height: scaleSizeW(30),
    borderRadius: scaleSizeW(15),
    backgroundColor: '#fff',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.15,
    shadowRadius: 6,
    elevation: 4,
  },
  cpShareIcon: {
    width: scaleSizeW(18),
    height: scaleSizeW(18),
  },
  cpFooter: {
    position: 'absolute',
    bottom: scaleSizeH(20),
    left: scaleSizeW(15),
    right: scaleSizeW(15),
    height: scaleSizeH(70),
    borderRadius: scaleSizeW(10),
    overflow: 'hidden',
    justifyContent: 'center',
  },
  cpFooterBlur: {
    ...StyleSheet.absoluteFill,
    backgroundColor: '#000000',
    opacity: 0.38,
  },
  cpFooterContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: scaleSizeW(14),
  },
  cpLabel: {
    fontSize: scaleSizeW(11),
    fontWeight: '500',
    color: '#ffffff',
  },
  cpName: {
    fontSize: scaleSizeW(17),
    fontWeight: '600',
    color: '#ffffff',
    marginTop: scaleSizeH(6),
  },
  cpStats: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  cpStatIcon: {
    width: scaleSizeW(20),
    height: scaleSizeW(20),
  },
  cpStatText: {
    fontSize: scaleSizeW(12),
    fontWeight: '500',
    color: '#ffffff',
    marginLeft: scaleSizeW(4),
  },
});
