import React, { useEffect, useState } from 'react';
import {
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
import { API } from '@/api';
import { scaleSizeW, setSpText } from '@/utils/screenUtils';
import { CardVerifiedIcon } from '@/components/cards/cardIcons';
import { ChevronRightIcon } from '@/pages/square/bbsDetail/sheetIcons';
import type { RootStackParamList } from '@/route/map';
import BaseInfo from './BaseInfo';
import ItemList from './ItemList';
import PlazaList from './PlazaList';
import { AuthPositionIcon, AuthRealIcon } from './icons';

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
  const insets = useSafeAreaInsets();
  const { width: screenWidth } = useWindowDimensions();

  const [data, setData] = useState<any>(null);
  const [tab, setTab] = useState(0);
  const [current, setCurrent] = useState(0);

  useEffect(() => {
    (async () => {
      try {
        const res = await API.card.aggregate({ cardId: id });
        if (res.code === '200' && res.data) {
          setData(res.data);
        }
      } catch {
        // ignore
      }
    })();
  }, [id]);

  const userCard = data?.userCard;
  const userInfo = data?.userInfo;
  const wqUser = userInfo?.wqUser;
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
      <ScrollView style={styles.flex} showsVerticalScrollIndicator={false}>
        {/* 头部轮播图（mediaLinkList，对齐小程序 swiper） */}
        <View style={{ height: screenWidth }}>
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

          {/* tab 栏 */}
          <View style={styles.tabRow}>
            {TABS.map((t, ix) => (
              <TouchableOpacity key={t} activeOpacity={0.8} onPress={() => setTab(ix)}>
                <Text style={[styles.tabText, tab === ix && styles.tabTextActive]}>{t}</Text>
                <View style={[styles.tabBar, tab === ix && styles.tabBarActive]} />
              </TouchableOpacity>
            ))}
          </View>
        </View>
        <View style={styles.tabDivider} />

        {/* tab 内容 */}
        <View style={styles.tabContent}>
          {tab === 0 && <BaseInfo userCard={userCard} userInfo={userInfo} />}
          {tab === 1 && <ItemList project={data?.projectList?.[0]} />}
          {tab === 2 && <PlazaList userId={userCard?.userId} />}
        </View>

        <View style={styles.bottomGap} />
      </ScrollView>

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
  swiperEmpty: {
    backgroundColor: '#E5E5E5',
  },
  dots: {
    position: 'absolute',
    bottom: scaleSizeW(69),
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
    marginTop: scaleSizeW(20),
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
});
