import React, { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Animated,
  Easing,
  FlatList,
  Image as RNImage,
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
import PersonalPoster from '@/components/posters/PersonalPoster';
import { normalizeCardStyle } from '@/components/cards/types';
import { API } from '@/api';
import { useUserStore } from '@/store/user';
import { scaleSizeH, scaleSizeW, setSpText, SCREEN_WIDTH } from '@/utils/screenUtils';
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

/** 名片消息图片默认宽高比（商务/时尚海报 370:268 ≈ 1.38，onLoad 后替换为真实比例） */
const DEFAULT_CARD_ASPECT = 1.38;

/** 解析 `<custom-card>{cardId}&{posterUrl}` 结构的名片留言 */
function parseCardMessage(content: string): { cardId: string; url: string } | null {
  if (!content.includes(CUSTOM_CARD_TAG)) return null;
  const payload = content.split(CUSTOM_CARD_TAG)[1] || '';
  const [cardId, url] = payload.split('&');
  if (!cardId || !url) return null;
  return { cardId, url };
}

/** 拉取图片真实宽高比：名片图在渲染前解析高度，避免 onLoad 后二次撑高列表、滚动落点被顶偏 */
function getImageAspect(url: string): Promise<number | null> {
  return new Promise(resolve => {
    RNImage.getSize(
      url,
      (w, h) => resolve(w > 0 && h > 0 ? w / h : null),
      () => resolve(null),
    );
  });
}

/** 批量解析一页留言中名片图片的宽高比（url → w/h） */
async function resolveCardAspects(list: ChatMessage[]): Promise<Record<string, number>> {
  const urls = list.map(m => parseCardMessage(m.content || '')?.url).filter((u): u is string => !!u);
  if (urls.length === 0) return {};
  const ratios = await Promise.all(urls.map(getImageAspect));
  const aspects: Record<string, number> = {};
  urls.forEach((u, i) => {
    const r = ratios[i];
    if (r) aspects[u] = r;
  });
  return aspects;
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
  /** 海报挂载回调：onLayout 时触发截图，替代固定时延 */
  const posterReadyRef = useRef<(() => void) | null>(null);
  /** 离屏海报的实际布局尺寸（发送前写入消息图片宽高比，保证 scrollToEnd 落点准确） */
  const posterLayoutRef = useRef<{ w: number; h: number } | null>(null);
  /** 名片消息图片的宽高比（按 url 记忆，onLoad 后按真实比例展示） */
  const [cardAspects, setCardAspects] = useState<Record<string, number>>({});

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
  /**
   * 吸附底部标记：为 true 时内容任何增长（新消息/图片加载出真实高度）都保持贴底；
   * 用户上滑离开底部解除，回到底部附近恢复（微信式行为）
   */
  const stickToBottomRef = useRef(true);
  /** 初始贴底定位完成后才允许翻页：防止首屏滚动被钳制在 offset=0 时误触加载历史、把页面锚在中部 */
  const initialScrollDoneRef = useRef(false);

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
      // 不看 isFocused：跳转/被压栈时失焦可能早于 keyboardWillHide，
      // 守卫会把 translateY 卡在键盘高度（返回后输入区悬空）
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

  // ===== 参数守卫：缺 userId 会话不可用，提示后返回 =====
  useEffect(() => {
    if (!peerUserId) {
      Toast.show({ type: 'error', text1: '会话参数缺失' });
      if (navigation.canGoBack()) navigation.goBack();
    }
  }, [peerUserId, navigation]);

  // ===== 加载对方信息 =====
  useEffect(() => {
    if (!peerUserId) return;
    (async () => {
      try {
        const res = await API.common.userBaseInfo({ userId: peerUserId });
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
      // 先解析本页名片图的真实宽高比，再连同消息一起渲染：内容首帧即最终高度，贴底滚动落点精确
      const aspects = await resolveCardAspects(list);
      if (Object.keys(aspects).length > 0) {
        setCardAspects(prev => ({ ...aspects, ...prev }));
      }
      if (!lastId) {
        // 最新一页：升序存入，并锁定会话号（吸附底部默认开启，由 onContentSizeChange 贴底）
        if (list[0]?.msgNumber) setMsgNumber(list[0].msgNumber);
        setMessages(list.slice().reverse());
        setHasMore(list.length >= 10);
        setInitialLoaded(true);
        // 兜底：分批渲染/图片尺寸全部落定后再贴一次底，保证进入会话必见最新一条
        setTimeout(() => {
          if (stickToBottomRef.current) listRef.current?.scrollToEnd({ animated: false });
        }, 250);
      } else {
        // prepend 历史：视图连贯性由 maintainVisibleContentPosition 原生锚定保证
        setMessages(prev => {
          // 按 id 去重防御：服务端边界若返回重复留言不至于炸 key
          const incoming = list.slice().reverse().filter(m => !prev.some(p => p.id === m.id));
          return [...incoming, ...prev];
        });
        setHasMore(list.length >= 10);
      }
    },
    [peerUserId, msgNumber],
  );

  useEffect(() => {
    if (!peerUserId) {
      setInitialLoaded(true);
      return;
    }
    fetchMessages().catch(() => setInitialLoaded(true));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [peerUserId]);

  /** 滚动到顶部（视觉最上方=最早的消息）时加载更早的留言 */
  const onLoadMore = useCallback(() => {
    if (!initialLoaded || !initialScrollDoneRef.current || loadingMoreRef.current || !hasMore || messages.length === 0) return;
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
      const { contentOffset, contentSize, layoutMeasurement } = e.nativeEvent;
      // 距底 <60 视为停在底部：恢复吸附；上滑离开则解除
      stickToBottomRef.current = contentSize.height - layoutMeasurement.height - contentOffset.y < 60;
      if (contentOffset.y < 30) onLoadMore();
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
    async (content: string): Promise<boolean> => {
      if (!peerUserId || sending || !content.trim()) return false;
      setSending(true);
      try {
        const res = await API.message.send({ beUserId: peerUserId, content, msgNumber });
        const saved: ChatMessage = res.data;
        if (saved?.msgNumber) setMsgNumber(saved.msgNumber);
        if (saved?.id) {
          // 自己发送的消息：强制吸附底部（即使用户此前上滑看历史）
          stickToBottomRef.current = true;
          setMessages(prev => (prev.some(m => m.id === saved.id) ? prev : [...prev, saved]));
        }
        return true;
      } catch {
        // 拦截器已提示错误
        return false;
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
    doSend(text).then(ok => {
      // 发送失败恢复草稿，避免已输入内容丢失
      if (!ok) setInput(text);
    });
  }, [input, doSend]);

  // ===== 发送名片（生成海报 → 上传 → 以 `<custom-card>cardId&url` 留言发送，对齐小程序）=====
  /** 名片列表懒加载：点「发送名片」时才拉取，失败允许重试 */
  const cardsLoadedRef = useRef(false);

  const openCardSheet = useCallback(async () => {
    Keyboard.dismiss();
    let cards = myCards;
    if (!cardsLoadedRef.current) {
      cardsLoadedRef.current = true;
      try {
        const res = await API.card.list();
        const raw: any[] = res.data?.cardsList || [];
        cards = raw.filter(c => !c.isCp).map(c => ({ ...c, id: c.cardId ?? c.id }));
        setMyCards(cards);
      } catch {
        cardsLoadedRef.current = false;
        return;
      }
    }
    if (cards.length === 0) {
      Toast.show({ type: 'info', text1: '暂无个人名片，请先创建' });
      return;
    }
    // 等 setMyCards 提交后再弹层，避免首帧空列表闪烁
    requestAnimationFrame(() => cardSheetRef.current?.present());
  }, [myCards]);

  const sendCard = useCallback(
    async (card: any) => {
      cardSheetRef.current?.dismiss();
      Toast.show({ type: 'info', text1: '名片生成中…' });
      try {
        // 1. 取完整名片数据（海报需要 cpLogo/mediaLinkList/cardPoster 等，对齐名片夹分享）
        const res = await API.card.aggregate({ cardId: card.id });
        const userCard = res.data?.userCard;
        if (!userCard) throw new Error('card detail failed');
        const fullCard = { ...userCard, id: userCard.id ?? card.id };
        // 2. 离屏渲染分享海报（与「我的名片-分享名片」同一组件 PersonalPoster，带企业 logo + 扫码条），
        //    等 onLayout 确认挂载布局完成后再截图
        setPosterCard(fullCard);
        await new Promise<void>(resolve => {
          posterReadyRef.current = () => resolve();
          // 兜底：极端情况下未触发 onLayout 也不阻塞发送
          setTimeout(resolve, 1500);
        });
        posterReadyRef.current = null;
        const uri = await shotRef.current?.capture?.();
        if (!uri) throw new Error('capture failed');
        // 3. 上传海报（png，与分享名片一致）
        const formData = new FormData();
        formData.append('file', {
          uri,
          type: 'image/png',
          name: `card_${fullCard.id}.png`,
        } as any);
        const up = await API.file.upload(formData);
        const url = up.data?.mdUrl || up.data?.url;
        if (!url) throw new Error('upload failed');
        // 4. 提前写入海报真实宽高比：消息渲染即按最终高度占位，
        //    避免图片加载后高度变化把底部顶出可视区
        const pl = posterLayoutRef.current;
        if (pl?.w && pl?.h) {
          const ratio = pl.w / pl.h;
          setCardAspects(prev => ({ ...prev, [url]: ratio }));
        }
        // 5. 发送名片留言（接收方点击跳转名片详情）
        await doSend(`${CUSTOM_CARD_TAG}${fullCard.id}&${url}`);
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
                <ExpoImage
                  source={{ uri: card.url }}
                  style={[styles.cardImage, { aspectRatio: cardAspects[card.url] ?? DEFAULT_CARD_ASPECT }]}
                  contentFit="cover"
                  transition={200}
                  onLoad={e => {
                    const w = e.source?.width;
                    const h = e.source?.height;
                    if (w && h && !cardAspects[card.url]) {
                      // 高度变化后是否贴底由 onContentSizeChange 的吸附逻辑统一处理
                      setCardAspects(prev => ({ ...prev, [card.url]: w / h }));
                    }
                  }}
                />
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
    [myId, myAvatar, peer.avatar, peer.name, peer.cpName, navigation, cardAspects],
  );

  return (
    <SafeView backgroundColor={PAPER}>
      <View style={styles.container} onTouchStart={hideTools}>
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
              // 吸附底部：首屏/新消息/内容变化保持贴底（延迟一帧，等原生滚动范围生效；
              // 与 maintainVisibleContentPosition 不冲突：锚定只在内容从上方插入时修正 offset，
              // 贴底滚动在内容变化落定后执行）
              requestAnimationFrame(() => {
                if (stickToBottomRef.current) listRef.current?.scrollToEnd({ animated: false });
                initialScrollDoneRef.current = true;
              });
            }}
          />
          {/* 加载指示放浮层：不占内容高度，避免污染翻页的净增量锚定 */}
          {(loadingMore || !initialLoaded) && (
            <ActivityIndicator
              style={styles.loadingOverlay}
              size="small"
              color={loadingMore ? MUTED : BLUE}
            />
          )}
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
            <TouchableOpacity activeOpacity={0.8} style={styles.chip} onPress={openCardSheet}>
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
            <TouchableOpacity
              activeOpacity={0.85}
              style={[styles.sendBtn, sending && styles.sendBtnDisabled]}
              onPress={onSendText}
              disabled={sending}
            >
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

      {/* 离屏名片分享海报（与「我的名片-分享名片」同一组件 PersonalPoster：名片 + 企业 logo + 黑色扫码条） */}
      {posterCard ? (
        <ViewShot ref={shotRef} options={{ format: 'png', quality: 1 }} style={styles.offscreen}>
          <View
            style={{ width: SCREEN_WIDTH - scaleSizeW(32) }}
            onLayout={e => {
              const { width, height } = e.nativeEvent.layout;
              if (width && height) posterLayoutRef.current = { w: width, h: height };
              posterReadyRef.current?.();
              posterReadyRef.current = null;
            }}
          >
            <PersonalPoster
              data={posterCard}
              style={normalizeCardStyle(posterCard.styleCode)}
              fontColor={posterCard.fontColor}
              backColor={posterCard.backColor}
              qrValue={`mingpian://cardDetail?id=${posterCard.id}`}
            />
          </View>
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
    lineHeight: setSpText(19),
    color: '#17243A',
    maxWidth: scaleSizeW(220),
  },
  headerCp: {
    marginTop: scaleSizeH(3),
    fontSize: setSpText(11),
    lineHeight: setSpText(14),
    fontWeight: '400',
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
  loadingOverlay: {
    position: 'absolute',
    top: scaleSizeH(8),
    alignSelf: 'center',
    zIndex: 1,
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
    // 高度由 aspectRatio 推导（商务/时尚海报与简约海报比例不同，onLoad 后按真实比例）
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
  sendBtnDisabled: {
    opacity: 0.5,
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
