import React, { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Animated,
  Easing,
  FlatList,
  Keyboard,
  Platform,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  type GestureResponderEvent,
  type NativeScrollEvent,
  type NativeSyntheticEvent,
} from 'react-native';
import { Image as ExpoImage } from 'expo-image';
import ViewShot from 'react-native-view-shot';
import Toast from 'react-native-toast-message';
import type { BottomSheetModal } from '@gorhom/bottom-sheet';
import { useIsFocused, useNavigation, useRoute, type RouteProp } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import SafeView from '@/components/SafeView';
import AppBottomSheet from '@/components/AppBottomSheet';
import CardPoster1 from '@/components/posters/CardPoster1';
import CardPoster2 from '@/components/posters/CardPoster2';
import CardPoster3 from '@/components/posters/CardPoster3';
import { API } from '@/api';
import { useUserStore } from '@/store/user';
import { scaleSizeH, scaleSizeW, setSpText } from '@/utils/screenUtils';
import type { RootStackParamList } from '@/route/map';

const BLUE = '#075CFF';
const INK = '#17243A';
const PAPER = '#F6F6F7';
const MUTED = '#98A1B0';

/** 留言实体（wq_user_message，后端 JSON camelCase） */
interface ChatMessage {
  id: number;
  msgNumber: number;
  userId: number;
  beUserId: number;
  content: string;
  msgTime: string;
  /** 接收方已读标记：我方消息 beMsgStatus=1 显示「已读」 */
  beMsgStatus?: number;
}

type DisplayItem =
  | { kind: 'divider'; key: string; label: string }
  | { kind: 'msg'; key: string; msg: ChatMessage };

const CUSTOM_CARD_TAG = '<custom-card>';

/** 解析 `<custom-card>{cardId}&{posterUrl}` 结构的名片留言 */
function parseCardMessage(content: string): { cardId: string; url: string } | null {
  if (!content.includes(CUSTOM_CARD_TAG)) return null;
  const payload = content.split(CUSTOM_CARD_TAG)[1] || '';
  const [cardId, url] = payload.split('&');
  if (!cardId || !url) return null;
  return { cardId, url };
}

/** 日期分割线文案：今天/昨天/YYYY/M/D */
function dayDividerLabel(msgTime: string): string {
  const date = new Date(msgTime);
  if (Number.isNaN(date.getTime())) return '';
  const startOf = (d: Date) => new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();
  const dayDiff = Math.round((startOf(new Date()) - startOf(date)) / 86400000);
  if (dayDiff === 0) return '今天';
  if (dayDiff === 1) return '昨天';
  return `${date.getFullYear()}/${date.getMonth() + 1}/${date.getDate()}`;
}

function formatHHmm(msgTime: string): string {
  const date = new Date(msgTime);
  if (Number.isNaN(date.getTime())) return '';
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

/**
 * 路由头部数据载体：native-stack 对 headerTitle 闭包只在首次渲染生效，
 * 组件身份必须稳定，因此头部组件从模块级 ref 读数，由 title 字符串变化驱动重渲染。
 */
const chatHeaderPeer: { current: { name: string; cpName: string; userType?: number } } = {
  current: { name: '', cpName: '' },
};

/** 路由头部：昵称 + 蓝色企业名两行标题（figma 32.消息详情） */
function ChatHeaderTitle() {
  const p = chatHeaderPeer.current;
  return (
    <View style={styles.headerTitle}>
      <Text style={styles.headerName} numberOfLines={1}>
        {p.name}
        {p.userType === 1 ? '（官方账号）' : ''}
      </Text>
      {!!p.cpName && (
        <Text style={styles.headerCp} numberOfLines={1}>
          {p.cpName}
        </Text>
      )}
    </View>
  );
}

/** 路由头部右侧「···」（聊天设置） */
function ChatHeaderRight({ onPress }: { onPress: () => void }) {
  return (
    <TouchableOpacity hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }} onPress={onPress}>
      <Text style={styles.headerMore}>···</Text>
    </TouchableOpacity>
  );
}

/** 32.消息详情：留言模式会话（无 IM；键盘交互对齐 coingetApp chatSession/index.ios.tsx） */
export default function MessageChat() {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const route = useRoute<RouteProp<RootStackParamList, 'messageDetail'>>();
  const insets = useSafeAreaInsets();
  const isFocused = useIsFocused();
  const peerUserId = route.params?.userId;
  const [msgNumber, setMsgNumber] = useState<number | undefined>(route.params?.msgNumber);

  const myUser = useUserStore(s => s.userInfo?.wqUser);
  const myId = myUser?.id;
  const myAvatar = myUser?.avatar || '';

  /** 对方信息（/common/user/base/info） */
  const [peer, setPeer] = useState<{ name: string; avatar: string; cpName: string; cpId?: number; userType?: number }>({
    name: '',
    avatar: '',
    cpName: '',
  });

  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [initialLoaded, setInitialLoaded] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [input, setInput] = useState('');
  const [sending, setSending] = useState(false);

  /** 发送名片 */
  const [myCards, setMyCards] = useState<any[]>([]);
  const cardSheetRef = useRef<BottomSheetModal>(null);
  const [posterCard, setPosterCard] = useState<any | null>(null);
  const shotRef = useRef<React.ElementRef<typeof ViewShot>>(null);

  // ===== 键盘升降（对齐 coingetApp chatSession）=====
  // translateY 直接承载键盘高度（0~endCoordinates.height）；
  // 输入区与键盘 1:1 上移（插值 [0,500]→[0,-500]）；
  // 列表仅当内容真的被键盘遮住时才上顶：内容底 > 视口底 - 键盘高，顶上移量 = 被遮住的量（封顶 500）
  const translateY = useRef(new Animated.Value(0)).current;
  const layoutHeight = useRef({ keyboard: 0, contentHieght: 0, maxContentHieght: 0 });
  /** 布局尺寸变化后强制重算列表上顶量 */
  const [, forceRender] = useState(0);
  const listRef = useRef<FlatList<DisplayItem>>(null);
  const loadingMoreRef = useRef(false);

  const visibleH = layoutHeight.current.maxContentHieght - layoutHeight.current.keyboard;
  const over = layoutHeight.current.contentHieght - visibleH;
  const listShift = over <= 0 ? 0 : over > 500 ? 500 : over;

  const animateRun = useCallback(
    (toValue: number) => {
      Animated.timing(translateY, {
        toValue,
        duration: 250,
        useNativeDriver: true,
        easing: Easing.linear,
      }).start();
    },
    [translateY],
  );

  /** 收键盘并复位（点内容区触发，对齐参考实现 hideTools） */
  const hideTools = useCallback(() => {
    Keyboard.dismiss();
    if (layoutHeight.current.keyboard !== 0) {
      layoutHeight.current.keyboard = 0;
      animateRun(0);
      forceRender(n => n + 1);
    }
  }, [animateRun]);

  useEffect(() => {
    const showEvt = Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow';
    const hideEvt = Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide';
    const onShow = (e: any) => {
      if (!isFocused) return;
      layoutHeight.current.keyboard = e?.endCoordinates?.height ?? 0;
      animateRun(layoutHeight.current.keyboard);
      forceRender(n => n + 1);
    };
    const onHide = () => {
      if (!isFocused) return;
      if (layoutHeight.current.keyboard === 0) return;
      layoutHeight.current.keyboard = 0;
      animateRun(0);
      forceRender(n => n + 1);
    };
    const showSub = Keyboard.addListener(showEvt, onShow);
    const hideSub = Keyboard.addListener(hideEvt, onHide);
    return () => {
      showSub.remove();
      hideSub.remove();
    };
  }, [isFocused, animateRun]);

  /** 输入区拦截 touch：点击输入框/按钮不收键盘（对齐参考实现 compose 的 stopPropagation） */
  const onComposeTouchStart = useCallback((e: GestureResponderEvent) => {
    e.stopPropagation();
  }, []);

  // ===== 头部：稳定组件类型 + title 字符串驱动刷新（native-stack 不认后续闭包）=====
  const onPressMore = useCallback(() => Toast.show({ type: 'info', text1: '聊天设置建设中' }), []);
  useLayoutEffect(() => {
    navigation.setOptions({
      headerTitle: ChatHeaderTitle,
      headerRight: () => <ChatHeaderRight onPress={onPressMore} />,
    });
  }, [navigation, onPressMore]);

  useEffect(() => {
    chatHeaderPeer.current = { name: peer.name, cpName: peer.cpName, userType: peer.userType };
    navigation.setOptions({ title: peer.name });
  }, [navigation, peer]);

  // ===== 加载对方信息 =====
  useEffect(() => {
    (async () => {
      try {
        const res = await API.common.userBaseInfo({ userId: peerUserId! });
        const d = res.data ?? {};
        setPeer({
          name: d.wqUser?.username || '',
          avatar: d.wqUser?.avatar || '',
          cpName: d.cpName || '',
          cpId: d.cpId,
          userType: d.wqUser?.userType,
        });
      } catch {
        // 拦截器已提示错误
      }
    })();
  }, [peerUserId]);

  // ===== 留言加载 =====
  const fetchMessages = useCallback(
    async (lastId?: number) => {
      const res = await API.message.open({ userId: peerUserId, msgNumber, lastId });
      const list: ChatMessage[] = (res.data ?? []) as ChatMessage[];
      if (!lastId) {
        // 最新一页：升序存入，并锁定会话号
        if (list[0]?.msgNumber) setMsgNumber(list[0].msgNumber);
        setMessages(list.slice().reverse());
        setHasMore(list.length >= 10);
        setInitialLoaded(true);
        setTimeout(() => listRef.current?.scrollToEnd({ animated: false }), 50);
      } else {
        setMessages(prev => [...list.slice().reverse(), ...prev]);
        setHasMore(list.length >= 10);
      }
    },
    [peerUserId, msgNumber],
  );

  useEffect(() => {
    fetchMessages().catch(() => setInitialLoaded(true));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [peerUserId]);

  /** 滚动到顶部（视觉最上方=最早的消息）时加载更早的留言 */
  const onLoadMore = useCallback(() => {
    if (!initialLoaded || loadingMoreRef.current || !hasMore || messages.length === 0) return;
    loadingMoreRef.current = true;
    setLoadingMore(true);
    const oldestId = Math.min(...messages.map(m => m.id));
    fetchMessages(oldestId)
      .catch(() => {})
      .finally(() => {
        loadingMoreRef.current = false;
        setLoadingMore(false);
      });
  }, [initialLoaded, hasMore, messages, fetchMessages]);

  const onScroll = useCallback(
    (e: NativeSyntheticEvent<NativeScrollEvent>) => {
      if (e.nativeEvent.contentOffset.y < 30) onLoadMore();
    },
    [onLoadMore],
  );

  // ===== 展示数据：按天插分割线 =====
  const displayItems = useMemo<DisplayItem[]>(() => {
    const items: DisplayItem[] = [];
    let lastDay = '';
    messages.forEach(m => {
      const label = dayDividerLabel(m.msgTime);
      const dayKey = m.msgTime ? m.msgTime.slice(0, 10) : '';
      if (label && dayKey !== lastDay) {
        lastDay = dayKey;
        items.push({ kind: 'divider', key: `divider-${m.id}`, label });
      }
      items.push({ kind: 'msg', key: `msg-${m.id}`, msg: m });
    });
    return items;
  }, [messages]);

  // ===== 发送留言 =====
  const doSend = useCallback(
    async (content: string) => {
      if (sending || !content.trim()) return;
      setSending(true);
      try {
        const res = await API.message.send({ beUserId: peerUserId!, content, msgNumber });
        const saved: ChatMessage = res.data;
        if (saved?.msgNumber) setMsgNumber(saved.msgNumber);
        if (saved?.id) {
          setMessages(prev => (prev.some(m => m.id === saved.id) ? prev : [...prev, saved]));
          setTimeout(() => listRef.current?.scrollToEnd({ animated: true }), 50);
        }
      } catch {
        // 拦截器已提示错误
      } finally {
        setSending(false);
      }
    },
    [sending, peerUserId, msgNumber],
  );

  const onSendText = useCallback(() => {
    const text = input.trim();
    if (!text) {
      Toast.show({ type: 'info', text1: '不能发送空白消息' });
      return;
    }
    setInput('');
    doSend(text);
  }, [input, doSend]);

  // ===== 发送名片（生成海报 → 上传 → 以 `<custom-card>cardId&url` 留言发送，对齐小程序）=====
  useEffect(() => {
    (async () => {
      try {
        const res = await API.card.list();
        const raw: any[] = res.data?.cardsList || [];
        setMyCards(raw.filter(c => !c.isCp).map(c => ({ ...c, id: c.cardId ?? c.id })));
      } catch {
        // ignore
      }
    })();
  }, []);

  const sendCard = useCallback(
    async (card: any) => {
      cardSheetRef.current?.dismiss();
      Toast.show({ type: 'info', text1: '名片生成中…' });
      try {
        // 1. 离屏渲染名片海报并按样式截图
        setPosterCard(card);
        await new Promise(resolve => setTimeout(() => resolve(null), 300));
        const uri = await shotRef.current?.capture?.();
        if (!uri) throw new Error('capture failed');
        // 2. 上传海报
        const formData = new FormData();
        formData.append('file', {
          uri,
          type: 'image/jpeg',
          name: `card_${card.id}.jpg`,
        } as any);
        const up = await API.file.upload(formData);
        const url = up.data?.mdUrl || up.data?.url;
        if (!url) throw new Error('upload failed');
        // 3. 发送名片留言（接收方点击跳转名片详情）
        await doSend(`${CUSTOM_CARD_TAG}${card.id}&${url}`);
      } catch {
        Toast.show({ type: 'error', text1: '名片发送失败，请重试' });
      } finally {
        setPosterCard(null);
      }
    },
    [doSend],
  );

  // ===== 渲染 =====
  const renderItem = useCallback(
    ({ item }: { item: DisplayItem }) => {
      if (item.kind === 'divider') {
        return <Text style={styles.divider}>{item.label}</Text>;
      }
      const { msg } = item;
      const isSelf = Number(msg.userId) === Number(myId);
      const card = parseCardMessage(msg.content || '');
      const avatarNode = isSelf ? (
        myAvatar ? (
          <ExpoImage source={{ uri: myAvatar }} style={styles.avatar} contentFit="cover" transition={150} />
        ) : (
          <View style={[styles.avatar, styles.avatarFallback]}>
            <Text style={styles.avatarFallbackText}>我</Text>
          </View>
        )
      ) : peer.avatar ? (
        <ExpoImage source={{ uri: peer.avatar }} style={styles.avatar} contentFit="cover" transition={150} />
      ) : (
        <View style={[styles.avatar, styles.logoAvatar]}>
          <Text style={styles.logoAvatarText}>{(peer.name || peer.cpName || '友').slice(0, 1)}</Text>
        </View>
      );
      return (
        <View style={[styles.msgRow, isSelf ? styles.msgRowMine : styles.msgRowPeer]}>
          {avatarNode}
          <View style={styles.msgCol}>
            {card ? (
              <TouchableOpacity
                activeOpacity={0.85}
                onPress={() => navigation.navigate('cardDetail', { id: card.cardId })}
              >
                <ExpoImage source={{ uri: card.url }} style={styles.cardImage} contentFit="cover" transition={200} />
              </TouchableOpacity>
            ) : (
              <View style={[styles.bubble, isSelf ? styles.bubbleMine : styles.bubblePeer]}>
                <Text style={[styles.bubbleText, isSelf ? styles.bubbleTextMine : styles.bubbleTextPeer]}>
                  {msg.content}
                </Text>
              </View>
            )}
            {isSelf && msg.beMsgStatus === 1 ? <Text style={styles.readFlag}>已读</Text> : null}
            {!isSelf ? <Text style={styles.msgTime}>{formatHHmm(msg.msgTime)}</Text> : null}
          </View>
        </View>
      );
    },
    [myId, myAvatar, peer.avatar, peer.name, peer.cpName, navigation],
  );

  return (
    <SafeView backgroundColor={PAPER}>
      <View style={styles.container} onTouchStart={hideTools}>
        {/* 对方企业入口（对齐小程序 chatUser.cpName 顶栏） */}
        {!!peer.cpName && (
          <TouchableOpacity
            activeOpacity={0.8}
            style={styles.cpBar}
            onPress={() => peer.cpId && navigation.navigate('companyPage', { id: peer.cpId, userId: peerUserId })}
          >
            <Text style={styles.cpBarText}>{peer.cpName} &gt;</Text>
          </TouchableOpacity>
        )}
        {/* 留言列表：顶部锚定；加载历史保持当前位置；随键盘按溢出量上顶 */}
        <Animated.View
          onLayout={e => {
            layoutHeight.current.maxContentHieght = e.nativeEvent.layout.height;
          }}
          style={[
            styles.listWrap,
            {
              transform: [
                {
                  translateY: translateY.interpolate({
                    inputRange: [0, 500],
                    outputRange: [0, -listShift],
                    extrapolate: 'clamp',
                  }) as Animated.Value,
                },
              ],
            },
          ]}
        >
          <FlatList
            ref={listRef}
            data={displayItems}
            renderItem={renderItem}
            keyExtractor={item => item.key}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.listContent}
            maintainVisibleContentPosition={{ minIndexForVisible: 0 }}
            onScroll={onScroll}
            scrollEventThrottle={80}
            onContentSizeChange={(_, h) => {
              layoutHeight.current.contentHieght = h;
              if (layoutHeight.current.keyboard > 0) forceRender(n => n + 1);
            }}
            ListHeaderComponent={
              loadingMore ? (
                <ActivityIndicator style={styles.loadingMore} size="small" color={MUTED} />
              ) : !initialLoaded ? (
                <ActivityIndicator style={styles.loadingMore} size="small" color={BLUE} />
              ) : null
            }
          />
        </Animated.View>
        <Text style={styles.quickHint}>发送名片，让对方更快认识你</Text>
        {/* 输入区：与键盘 1:1 上移；区内 touch 不触发收键盘 */}
        <Animated.View
          onTouchStart={onComposeTouchStart}
          style={[
            styles.compose,
            { paddingBottom: insets.bottom + scaleSizeH(8) },
            {
              transform: [
                {
                  translateY: translateY.interpolate({
                    inputRange: [0, 500],
                    outputRange: [0, -500],
                    extrapolate: 'clamp',
                  }) as Animated.Value,
                },
              ],
            },
          ]}
        >
          <View style={styles.composeTools}>
            <TouchableOpacity
              activeOpacity={0.8}
              style={styles.chip}
              onPress={() => {
                Keyboard.dismiss();
                if (myCards.length === 0) {
                  Toast.show({ type: 'info', text1: '暂无个人名片，请先创建' });
                  return;
                }
                cardSheetRef.current?.present();
              }}
            >
              <Text style={styles.chipText}>发送名片</Text>
            </TouchableOpacity>
          </View>
          <View style={styles.composeRow}>
            <TextInput
              style={styles.input}
              value={input}
              onChangeText={setInput}
              placeholder="请输入留言..."
              placeholderTextColor="#9AA3B3"
              maxLength={500}
              multiline
            />
            <TouchableOpacity activeOpacity={0.85} style={styles.sendBtn} onPress={onSendText} disabled={sending}>
              <Text style={styles.sendBtnText}>{sending ? '发送中' : '发送'}</Text>
            </TouchableOpacity>
          </View>
        </Animated.View>
      </View>

      {/* 名片选择弹层 */}
      <AppBottomSheet ref={cardSheetRef} backgroundColor="#FFFFFF" backdropOpacity={0.38}>
        <Text style={styles.sheetTitle}>选择个人名片</Text>
        <Text style={styles.sheetSub}>仅可选择 1 张</Text>
        {myCards.map(card => (
          <TouchableOpacity
            key={card.id}
            activeOpacity={0.8}
            style={styles.cardChoice}
            onPress={() => sendCard(card)}
          >
            <Text style={styles.cardChoiceText} numberOfLines={1}>
              {card.alias || card.nameZh || '个人名片'}
              {card.position ? ` · ${card.position}` : ''}
            </Text>
          </TouchableOpacity>
        ))}
      </AppBottomSheet>

      {/* 离屏名片海报（截图用，对齐小程序 z-canvas 生成海报） */}
      {posterCard ? (
        <ViewShot ref={shotRef} options={{ format: 'jpg', quality: 0.9 }} style={styles.offscreen}>
          {posterCard.styleCode === 'TRADITIONAL' ? (
            <CardPoster2 data={posterCard} />
          ) : posterCard.styleCode === 'FASHION' ? (
            <CardPoster3 data={posterCard} />
          ) : (
            <CardPoster1 data={posterCard} />
          )}
        </ViewShot>
      ) : null}
    </SafeView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: PAPER,
  },
  // 头部
  headerTitle: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerName: {
    fontSize: setSpText(15),
    fontWeight: '600',
    color: '#000000',
    maxWidth: scaleSizeW(220),
  },
  headerCp: {
    marginTop: scaleSizeH(2),
    fontSize: setSpText(11),
    color: BLUE,
    maxWidth: scaleSizeW(220),
  },
  headerMore: {
    fontSize: setSpText(18),
    fontWeight: '700',
    color: '#151D2A',
    marginRight: scaleSizeW(4),
    letterSpacing: 1,
  },
  // 对方企业顶栏（对齐小程序 cpName 栏）
  cpBar: {
    backgroundColor: '#FFFFFF',
    paddingVertical: scaleSizeH(8),
    alignItems: 'center',
  },
  cpBarText: {
    fontSize: setSpText(12),
    fontWeight: '500',
    color: '#65A8FD',
  },
  // 列表
  listWrap: {
    flex: 1,
  },
  listContent: {
    // 注意不可加 flexGrow：内容少时须让 onContentSizeChange 上报真实内容高度，
    // 键盘上顶判断（内容底是否被遮）依赖真实高度
    paddingHorizontal: scaleSizeW(14),
    paddingVertical: scaleSizeH(8),
  },
  loadingMore: {
    marginVertical: scaleSizeH(12),
  },
  divider: {
    textAlign: 'center',
    fontSize: setSpText(11),
    color: MUTED,
    marginVertical: scaleSizeH(12),
  },
  msgRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: scaleSizeH(15),
    maxWidth: '86%',
  },
  msgRowMine: {
    alignSelf: 'flex-end',
    flexDirection: 'row-reverse',
  },
  msgRowPeer: {
    alignSelf: 'flex-start',
  },
  avatar: {
    width: scaleSizeW(37),
    height: scaleSizeW(37),
    borderRadius: scaleSizeW(37),
    backgroundColor: '#DCE8FF',
  },
  avatarFallback: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarFallbackText: {
    fontSize: setSpText(12),
    color: BLUE,
    fontWeight: '600',
  },
  logoAvatar: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: '#DDE5F0',
  },
  logoAvatarText: {
    fontSize: setSpText(12),
    fontWeight: '800',
    color: '#1463E9',
  },
  msgCol: {
    marginHorizontal: scaleSizeW(8),
    maxWidth: scaleSizeW(260),
  },
  bubble: {
    borderRadius: scaleSizeW(13),
    paddingHorizontal: scaleSizeW(12),
    paddingVertical: scaleSizeH(10),
  },
  bubblePeer: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: scaleSizeW(4),
  },
  bubbleMine: {
    backgroundColor: BLUE,
    borderTopRightRadius: scaleSizeW(4),
  },
  bubbleText: {
    fontSize: setSpText(13),
    lineHeight: setSpText(20),
  },
  bubbleTextPeer: {
    color: '#26354D',
  },
  bubbleTextMine: {
    color: '#FFFFFF',
  },
  readFlag: {
    marginTop: scaleSizeH(4),
    fontSize: setSpText(10),
    color: '#A7AFBC',
    textAlign: 'right',
  },
  msgTime: {
    marginTop: scaleSizeH(4),
    fontSize: setSpText(10),
    color: '#A7AFBC',
  },
  cardImage: {
    width: scaleSizeW(200),
    height: scaleSizeH(154),
    borderRadius: scaleSizeW(8),
    backgroundColor: '#FFFFFF',
  },
  quickHint: {
    textAlign: 'center',
    fontSize: setSpText(11),
    color: '#A2AAB7',
    marginVertical: scaleSizeH(12),
  },
  // 输入区
  compose: {
    backgroundColor: '#FFFFFF',
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: '#EDEDF0',
  },
  composeTools: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: scaleSizeW(13),
    paddingTop: scaleSizeH(10),
  },
  chip: {
    height: scaleSizeH(30),
    paddingHorizontal: scaleSizeW(12),
    borderRadius: scaleSizeW(8),
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: '#E3E6EB',
    backgroundColor: '#F7F8FA',
    alignItems: 'center',
    justifyContent: 'center',
  },
  chipText: {
    fontSize: setSpText(12),
    fontWeight: '600',
    color: '#1C2433',
  },
  composeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: scaleSizeW(13),
    paddingTop: scaleSizeH(8),
    gap: scaleSizeW(7),
  },
  input: {
    flex: 1,
    minHeight: scaleSizeH(39),
    maxHeight: scaleSizeH(120),
    borderRadius: scaleSizeW(14),
    backgroundColor: '#F4F5F7',
    paddingHorizontal: scaleSizeW(13),
    paddingTop: scaleSizeH(10),
    paddingBottom: scaleSizeH(10),
    fontSize: setSpText(13),
    color: '#2D3950',
  },
  sendBtn: {
    width: scaleSizeW(58),
    height: scaleSizeH(38),
    borderRadius: scaleSizeW(12),
    backgroundColor: BLUE,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sendBtnText: {
    fontSize: setSpText(13),
    fontWeight: '700',
    color: '#FFFFFF',
  },
  // 名片弹层
  sheetTitle: {
    fontSize: setSpText(16),
    fontWeight: '600',
    color: INK,
    marginBottom: scaleSizeH(4),
    paddingHorizontal: scaleSizeW(14),
  },
  sheetSub: {
    fontSize: setSpText(12),
    color: '#8492A5',
    paddingHorizontal: scaleSizeW(14),
    marginBottom: scaleSizeH(10),
  },
  cardChoice: {
    minHeight: scaleSizeH(44),
    marginHorizontal: scaleSizeW(14),
    marginBottom: scaleSizeH(8),
    paddingHorizontal: scaleSizeW(12),
    borderRadius: scaleSizeW(11),
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: '#DFE7F0',
    justifyContent: 'center',
  },
  cardChoiceText: {
    fontSize: setSpText(13),
    fontWeight: '700',
    color: '#1D2E44',
  },
  // 离屏海报
  offscreen: {
    position: 'absolute',
    left: -9999,
    top: 0,
  },
});
