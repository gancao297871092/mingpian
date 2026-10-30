import React, { useCallback, useRef, useState } from 'react';
import { Animated, Share, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { Image as ExpoImage } from 'expo-image';
import LinearGradient from 'react-native-linear-gradient';
import { useFocusEffect, useNavigation, useRoute, type RouteProp } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Svg, { Path } from 'react-native-svg';
import type { BottomSheetModal } from '@gorhom/bottom-sheet';
import SafeView from '@/components/SafeView';
import AppBottomSheet from '@/components/AppBottomSheet';
import { API } from '@/api';
import { useUserStore } from '@/store/user';
import { SCREEN_WIDTH, scaleSizeH, scaleSizeW, setSpText } from '@/utils/screenUtils';
import type { RootStackParamList } from '@/route/map';
import { buildAbilities, parseAbilityContent, type SignalIntentAbility } from './signalDraft';
import { ChevronLeftIcon, ChevronRightIcon, ShareIntentIcon, VerifiedBadgeIcon } from './icons';

const PRIMARY = '#2962D4';
const TEXT_SUB = '#6C6C6C';
const GREEN = '#36BE69';

/** 「暂不考虑的原因」选项（对齐原型：单选 + 其他补充说明） */
const DECLINE_REASONS = ['暂时没有合作需求', '已有稳定合作方', '与当前业务不匹配', '其他'];

/** 收起/展开箭头 */
function ChevronVerticalIcon({ up }: { up?: boolean }) {
  const s = scaleSizeW(10);
  return (
    <Svg width={s} height={s} viewBox="0 0 10 10" fill="none">
      <Path
        d={up ? 'M1.5 6.5L5 3L8.5 6.5' : 'M1.5 3.5L5 7L8.5 3.5'}
        stroke="#999999"
        strokeWidth={1.2}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

interface IntentFeed {
  id: string;
  title: string;
  sub: string;
  /** 封面图（无图回退占位） */
  cover?: string;
}

interface IntentViewData {
  quote: string;
  companyName: string;
  companySub: string;
  companyId?: number;
  companyLogo?: string;
  abilities: SignalIntentAbility[];
  feeds: IntentFeed[];
  contact: { name: string; title: string };
  contactCardId?: number;
  canResponse: boolean;
  /** 回应状态：0待回应 1愿意沟通 2暂不考虑（决定底部条形态） */
  response: number;
  /** 意向书状态：0有效 -1已撤回（撤回后不展示底部条） */
  status: number;
  intentId?: number;
}

const EMPTY: IntentViewData = {
  quote: '',
  companyName: '',
  companySub: '',
  abilities: [],
  feeds: [],
  contact: { name: '', title: '' },
  canResponse: false,
  response: 0,
  status: 0,
};

/**
 * 企业能力兜底：快照为空（历史数据——信号在意向书快照带 abilities 之前创建，
 * 或意向书 cardSnapshot 无 content 且五段未抽取）时按 cardId 实时取卡重建；
 * 快照有内容时直接用，不额外请求。
 */
async function resolveAbilities(
  cardId: number | undefined,
  snapshot: SignalIntentAbility[],
): Promise<SignalIntentAbility[]> {
  if (snapshot.length > 0 || cardId == null) return snapshot;
  try {
    const res = await API.capability.cardDetail({ id: cardId });
    return buildAbilities(res.data);
  } catch {
    return snapshot;
  }
}

/** 37.合作意向书（figma 222:1542）：浅蓝底玻璃头 + 意向书正文 + 底部操作条 */
export default function CooperationIntentView() {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const route = useRoute<RouteProp<RootStackParamList, 'cooperationIntentView'>>();
  const intentId = route.params?.intentId;
  const signalId = route.params?.signalId;
  const myCompanyName = useUserStore(s => s.userInfo?.cpName ?? s.userInfo?.wqUser?.cpName ?? '');
  const [data, setData] = useState<IntentViewData>(EMPTY);
  const [expanded, setExpanded] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [declineReason, setDeclineReason] = useState('');
  const [declineOther, setDeclineOther] = useState('');
  const declineRef = useRef<BottomSheetModal>(null);
  const scrollY = useRef(new Animated.Value(0)).current;

console.log(route.params, 'route.params')

  const load = useCallback(async () => {
    if (intentId) {
      try {
        const res = await API.intent.detail({ intentId });

console.log(res, 'route.params')

        const detail = res.data;
        const intent = detail.intent;
        const card = detail.cardSnapshot ?? {};
        let contact = { name: '', title: '' };
        if (intent.contactCardId) {
          try {
            const cardRes = await API.card.detail({ cardId: intent.contactCardId });
            contact = {
              name: cardRes.data.nameZh || cardRes.data.alias || '',
              title: cardRes.data.positionList?.[0]?.position || '',
            };
          } catch {
            // 名片信息失败不影响正文
          }
        }
        // 关联动态由后端 relBbsList 下发（含标题/封面），不再逐条调 /my/bbs/detail
        const feeds: IntentFeed[] = (detail.relBbsList ?? []).map(item => ({
          id: String(item.id),
          title: item.title || '关联动态',
          sub: '',
          cover: item.cover || undefined,
        }));
        const snapshotAbilities = buildAbilities(card);
        // 兜底取卡仅发送方视角可用（/capability/card/detail 限本人/本企业管理员；接收方待后端快照带 content，见 F-6）
        const abilities =
          detail.role === 'receiver'
            ? snapshotAbilities
            : await resolveAbilities(intent.cardId, snapshotAbilities);
        setData({
          quote: intent.note || '',
          companyName: detail.senderCompany?.name || '',
          companySub: detail.senderCompany?.types || '企业认证 · 信息已核验',
          companyId: detail.senderCompany?.id,
          companyLogo: detail.senderCompany?.avatar || undefined,
          abilities,
          feeds,
          contact,
          contactCardId: intent.contactCardId,
          canResponse: !!detail.canResponse,
          response: intent.response ?? 0,
          status: intent.status ?? 0,
          intentId: intent.id,
        });
      } catch {
        // 拦截器已提示错误
      }
      return;
    }
    if (signalId) {
      try {
        const res = await API.signal.detail({ signalId });
        const draft = parseAbilityContent(res.data.signal?.abilityContent);
        console.log(res, 'res')
        if (!draft) return;
        setData({
          quote: draft.note,
          companyName: res.data.company?.name || myCompanyName,
          companySub: res.data.company?.types || '企业认证 · 信息已核验',
          companyId: res.data.company?.id,
          companyLogo: res.data.company?.avatar || undefined,
          abilities: await resolveAbilities(draft.cardId, draft.abilities ?? []),
          feeds: (draft.feedTitles ?? []).map((title, i) => ({
            id: String(draft.relBbs?.[i] ?? i),
            title,
            sub: '',
            cover: draft.feedImages?.[i] || undefined,
          })),
          contact: { name: draft.contactName || '', title: draft.contactTitle || '' },
          contactCardId: draft.contactCardId,
          canResponse: false,
          response: 0,
          status: 0,
        });
      } catch {
        // 拦截器已提示错误
      }
    }
  }, [intentId, myCompanyName, signalId]);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load]),
  );

  const onRespond = useCallback(
    async (responseType: 1 | 2, responseMsg?: string) => {
      if (!data.intentId || submitting) return;
      setSubmitting(true);
      try {
        await API.intent.response({ intentId: data.intentId, responseType, responseMsg });
        await load();
      } catch {
        // 拦截器已提示错误
      } finally {
        setSubmitting(false);
      }
    },
    [data.intentId, load, submitting],
  );

  /** 确认拒绝：选中项直接传给 responseMsg；「其他」优先补充说明，未填则传「其他」本身 */
  const onDeclineConfirm = useCallback(() => {
    const msg =
      declineReason === '其他'
        ? declineOther.trim() || '其他'
        : declineReason || undefined;
    declineRef.current?.dismiss();
    onRespond(2, msg);
  }, [declineOther, declineReason, onRespond]);

  const onShare = useCallback(async () => {
    const text = [data.companyName, data.quote].filter(Boolean).join('\n');
    if (!text) return;
    try {
      await Share.share({ message: text });
    } catch {
      // 用户取消或系统不支持，静默
    }
  }, [data.companyName, data.quote]);

  const visibleSections = expanded ? data.abilities : data.abilities.slice(0, 2);
  /** 头部底色：滚动 0~60px 内渐变为纯白 */
  const navbarBgOpacity = scrollY.interpolate({
    inputRange: [0, 60],
    outputRange: [0, 1],
    extrapolate: 'clamp',
  });

  return (
    <SafeView backgroundColor="#E8EFFF">
      <ExpoImage
        source={require('@/assets/link/hero-bg.png')}
        style={styles.headerBg}
        contentFit="cover"
      />
      {/* 自定义头部（滚动时底色渐变为纯白） */}
      <View style={[styles.navbar, { paddingTop: insets.top + scaleSizeH(10) }]}>
        <Animated.View style={[StyleSheet.absoluteFill, styles.navbarBg, { opacity: navbarBgOpacity }]} />
        <TouchableOpacity activeOpacity={0.85} style={styles.glassBtn} onPress={() => navigation.goBack()}>
          <ChevronLeftIcon size={18} />
        </TouchableOpacity>
        <Text style={styles.navTitle}>合作意向书</Text>
        <TouchableOpacity
          activeOpacity={0.85}
          style={styles.glassBtn}
          onPress={onShare}
        >
          <ShareIntentIcon />
        </TouchableOpacity>
      </View>

      <Animated.ScrollView
        showsVerticalScrollIndicator={false}
        onScroll={Animated.event([{ nativeEvent: { contentOffset: { y: scrollY } } }], {
          useNativeDriver: true,
        })}
        scrollEventThrottle={16}
        contentContainerStyle={[
          styles.content,
          { paddingTop: insets.top + scaleSizeH(58), paddingBottom: scaleSizeH(90) + insets.bottom },
        ]}
      >

        {/* <View style={styles.heroWrap}>
          <LinearGradient
            colors={['#C6D9FF', '#FFFFFF', '#FFFFFF']}
            locations={[0, 0.46, 1]}
            style={styles.heroCard}
          >
            <View style={{
              paddingTop: scaleSizeH(55),
            }}>
              <Text style={styles.heroTitle}>告诉平台，您想找到谁</Text>
              <Text style={styles.heroSub}>基于企业动态与企业画像，识别值得连接的合作线索</Text>
            </View>
            <TouchableOpacity
              activeOpacity={0.85}
              style={styles.heroCta}
              onPress={() => navigation.navigate('createCooperationSignal')}
            >
              <Text style={styles.heroCtaText}>下达合作匹配指令</Text>
              <View style={styles.heroCtaArrow}>
                <ArrowCtaIcon />
              </View>
            </TouchableOpacity>

          </LinearGradient>
          <View style={styles.heroBadge}>
            <Text style={styles.heroBadgeText}>发合作信号</Text>
          </View>
          <ExpoImage source={require('@/assets/link/hero-mascot.png')} style={styles.heroMascot} contentFit="cover" />
        </View> */}
        {/* 吉祥物 + 气泡 */}
        <View style={styles.mascotRow}>
          <ExpoImage
            source={require('@/assets/link/intent-mascot.png')}
            style={[styles.mascot, styles.mascotLayer]}
            contentFit="cover"
          />
          <View style={styles.bubble}>
            <Text style={styles.bubbleText}>本次合作说明</Text>
          </View>
        </View>

        {/* 合作说明（蓝渐变卡，顶部被吉祥物区压住） */}
        <LinearGradient colors={['#2962D4', '#5D8CE9']} style={styles.quoteCard}>
          <View style={{
            paddingHorizontal: scaleSizeW(14),
            paddingVertical: scaleSizeH(16),
          }}>
            <Text style={styles.quoteText}>{data.quote}</Text>
          </View>
        </LinearGradient>

        {/* 发布企业 */}
        <TouchableOpacity
          activeOpacity={0.85}
          style={styles.companyCard}
          onPress={() => {
            if (data.companyId) navigation.navigate('companyPage', { id: data.companyId });
          }}
        >
          <ExpoImage
            source={data.companyLogo ? { uri: data.companyLogo } : require('@/assets/link/mock-avatar.png')}
            style={styles.companyAvatar}
            contentFit="cover"
          />
          <View style={styles.companyInfo}>
            <View style={styles.companyNameRow}>
              <Text style={styles.companyName} numberOfLines={1}>{data.companyName}</Text>
              <VerifiedBadgeIcon size={14} />
            </View>
            <Text style={styles.companySub}>{data.companySub}</Text>
          </View>
          <ChevronRightIcon size={12} />
        </TouchableOpacity>

        {/* 企业能力正文（有内容才展示；超过 2 节才显示展开/收起） */}
        {data.abilities.length > 0 && (
          <View style={styles.letterCard}>
            <Text style={styles.sectionCardTitle}>企业能力</Text>
            <Text style={styles.letterText}>
              {visibleSections.map((sec, i) => (
                <Text key={sec.title}>
                  {i > 0 && '\n\n'}
                  {sec.title}
                  {'\n'}
                  <Text style={styles.letterTextBody}>{sec.body}</Text>
                </Text>
              ))}
            </Text>
            {data.abilities.length > 2 && (
              <TouchableOpacity
                activeOpacity={0.85}
                style={styles.collapseBtn}
                onPress={() => setExpanded(e => !e)}
              >
                <Text style={styles.collapseText}>{expanded ? '收起' : '展开'}</Text>
                <ChevronVerticalIcon up={expanded} />
              </TouchableOpacity>
            )}
          </View>
        )}

        {/* 关联动态（有才展示） */}
        {data.feeds.length > 0 && (
          <View style={styles.plainCard}>
            <Text style={styles.sectionCardTitle}>关联动态</Text>
            <View style={styles.feedList}>
              {data.feeds.map(item => (
                <TouchableOpacity
                  key={item.id}
                  activeOpacity={0.85}
                  style={styles.feedRow}
                  onPress={() => navigation.navigate('bbsDetail', { id: item.id })}
                >
                  <ExpoImage
                    source={item.cover ? { uri: item.cover } : require('@/assets/link/mock-avatar.png')}
                    style={styles.feedAvatar}
                    contentFit="cover"
                  />
                  <View style={styles.feedInfo}>
                    <Text style={styles.feedTitle} numberOfLines={1}>{item.title}</Text>
                    <Text style={styles.feedSub} numberOfLines={1}>{item.sub}</Text>
                  </View>
                  <ChevronRightIcon size={12} />
                </TouchableOpacity>
              ))}
            </View>
          </View>
        )}

        {/* 本次对接人（有才展示） */}
        {!!data.contact.name && (
          <TouchableOpacity
            activeOpacity={0.85}
            style={styles.plainCard}
            onPress={() => {
              if (data.contactCardId) navigation.navigate('cardDetail', { id: data.contactCardId });
            }}
          >
            <Text style={styles.sectionCardTitle}>本次对接人</Text>
            <View style={styles.contactRow}>
              <ExpoImage
                source={require('@/assets/link/mock-avatar.png')}
                style={styles.contactAvatar}
                contentFit="cover"
              />
              <View style={styles.contactInfo}>
                <Text style={styles.contactName}>{data.contact.name}</Text>
                <Text style={styles.contactRole}>{data.contact.title}</Text>
              </View>
              <ChevronRightIcon size={12} />
            </View>
          </TouchableOpacity>
        )}
      </Animated.ScrollView>

      {/* 底部操作条（接收方视角）：待回应=双按钮；已同意且有效=仅「继续沟通」（跳私信，不调回应接口）；其余（已拒绝/已撤回/发送方）=不展示 */}
      {(data.canResponse || (data.response === 1 && data.status === 0)) && (
        <View style={[styles.bottomBar, { paddingBottom: insets.bottom + scaleSizeH(10) }]}>
          {data.canResponse ? (
            <>
              <TouchableOpacity
                activeOpacity={0.85}
                style={styles.btnDecline}
                disabled={submitting}
                onPress={() => declineRef.current?.present()}
              >
                <Text style={styles.btnDeclineText}>暂不考虑</Text>
              </TouchableOpacity>
              <TouchableOpacity
                activeOpacity={0.85}
                style={styles.btnAccept}
                disabled={submitting}
                onPress={() => onRespond(1)}
              >
                <Text style={styles.btnAcceptText}>愿意进一步沟通</Text>
              </TouchableOpacity>
            </>
          ) : (
            <TouchableOpacity
              activeOpacity={0.85}
              style={styles.btnAccept}
              onPress={() => navigation.navigate('MainTabs', { screen: 'message' })}
            >
              <Text style={styles.btnAcceptText}>继续沟通</Text>
            </TouchableOpacity>
          )}
        </View>
      )}

      {/* 暂不考虑的原因（原型：底部弹层，单选 + 其他补充说明） */}
      <AppBottomSheet ref={declineRef} backgroundColor="#FFFFFF" backdropOpacity={0.42}>
        <Text style={styles.declineTitle}>暂不考虑的原因</Text>
        <Text style={styles.declineSub}>可选填，帮助平台优化匹配</Text>
        <View style={styles.declineOptions}>
          {DECLINE_REASONS.map(reason => {
            const active = declineReason === reason;
            return (
              <TouchableOpacity
                key={reason}
                activeOpacity={0.85}
                style={[styles.declineOption, active && styles.declineOptionActive]}
                onPress={() => setDeclineReason(active ? '' : reason)}
              >
                <Text style={[styles.declineOptionText, active && styles.declineOptionTextActive]}>
                  {reason}
                </Text>
                <View style={[styles.radio, active && styles.radioActive]} />
              </TouchableOpacity>
            );
          })}
        </View>
        {declineReason === '其他' && (
          <TextInput
            style={styles.declineInput}
            value={declineOther}
            onChangeText={setDeclineOther}
            placeholder="补充说明"
            placeholderTextColor="#9AA3B2"
            maxLength={100}
            multiline
          />
        )}
        <View style={styles.declineActions}>
          <TouchableOpacity
            activeOpacity={0.85}
            style={styles.declineCancel}
            onPress={() => declineRef.current?.dismiss()}
          >
            <Text style={styles.declineCancelText}>取消</Text>
          </TouchableOpacity>
          <TouchableOpacity
            activeOpacity={0.85}
            style={[styles.declineConfirm, submitting && styles.declineConfirmDisabled]}
            disabled={submitting}
            onPress={onDeclineConfirm}
          >
            <Text style={styles.declineConfirmText}>
              {declineReason ? '确认拒绝' : '跳过原因，直接拒绝'}
            </Text>
          </TouchableOpacity>
        </View>
      </AppBottomSheet>
    </SafeView>
  );
}

const styles = StyleSheet.create({
  headerBg: {
    position: 'absolute',
    top: 0,
    left: 0,
    width: SCREEN_WIDTH,
    height: (SCREEN_WIDTH * 218) / 402,
    opacity: 0.3,
  },
  navbar: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 10,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: scaleSizeW(16),
    paddingBottom: scaleSizeH(10),
  },
  navbarBg: {
    backgroundColor: '#FFFFFF',
  },
  glassBtn: {
    width: scaleSizeW(44),
    height: scaleSizeW(44),
    borderRadius: scaleSizeW(22),
    backgroundColor: 'rgba(255,255,255,0.65)',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000000',
    shadowOpacity: 0.12,
    shadowRadius: 20,
    shadowOffset: { width: 0, height: 8 },
    elevation: 3,
  },
  navTitle: {
    fontSize: setSpText(17),
    fontWeight: '600',
    color: '#000000',
  },
  content: {},
  mascotRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    height: scaleSizeW(46),
    marginLeft: scaleSizeW(12),
    zIndex: -1,
    transform: [{ translateY: scaleSizeH(17) }],
  },
  mascot: {
    width: scaleSizeW(63),
    height: scaleSizeW(63),
    marginTop: scaleSizeH(-17),
    transform: [{ scaleX: -1 }],
  },
  mascotLayer: {
    position: 'relative',
    zIndex: 1,
  },
  bubble: {
    marginLeft: scaleSizeW(-15),
    marginTop: scaleSizeH(9),
    backgroundColor: '#36BE69',
    borderTopLeftRadius: scaleSizeW(10),
    borderTopRightRadius: 90,
    borderBottomRightRadius: 90,
    paddingHorizontal: scaleSizeW(18),
    paddingVertical: scaleSizeH(3),
    transform: [{ translateY: scaleSizeH(-16) }],
  },
  bubbleText: {
    fontSize: setSpText(12),
    fontWeight: '600',
    lineHeight: setSpText(20),
    color: '#FFFFFF',
  },
  quoteCard: {
    // marginHorizontal: scaleSizeW(16),
    borderRadius: scaleSizeW(10),
    paddingHorizontal: scaleSizeW(14),
    // paddingVertical: scaleSizeH(14),
  },
  quoteText: {
    fontSize: setSpText(15),
    fontWeight: '500',
    lineHeight: setSpText(24),
    color: '#FFFFFF',
  },
  companyCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: scaleSizeW(5),
    marginHorizontal: scaleSizeW(16),
    marginTop: scaleSizeH(10),
    backgroundColor: 'rgba(255,255,255,0.7)',
    borderWidth: 1,
    borderColor: '#FFFFFF',
    borderRadius: scaleSizeW(10),
    paddingHorizontal: scaleSizeW(14),
    paddingVertical: scaleSizeH(18),
  },
  companyAvatar: {
    width: scaleSizeW(36),
    height: scaleSizeW(36),
    borderRadius: scaleSizeW(18),
    borderWidth: 1,
    borderColor: '#EAEAEA',
  },
  companyInfo: {
    flex: 1,
    gap: scaleSizeH(5),
  },
  companyNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: scaleSizeW(2),
  },
  companyName: {
    fontSize: setSpText(14),
    fontWeight: '500',
    color: '#000000',
  },
  companySub: {
    fontSize: setSpText(12),
    lineHeight: setSpText(12),
    color: TEXT_SUB,
  },
  heroWrap: {
    marginHorizontal: scaleSizeW(16),
    position: 'relative',
  },
  heroCard: {
    borderRadius: scaleSizeW(20),
    alignItems: 'center',
  },
  heroBadge: {
    position: 'absolute',
    left: scaleSizeW(37),
    top: scaleSizeH(15),
    width: scaleSizeW(98),
    flexDirection: 'row',
    justifyContent: 'flex-end',
    backgroundColor: GREEN,
    borderRadius: 90,
    paddingHorizontal: scaleSizeW(8),
  },
  heroCta: {
    marginTop: scaleSizeH(20),
    marginBottom: scaleSizeH(27),
    width: scaleSizeW(262),
    height: scaleSizeH(40),
    borderRadius: 90,
    backgroundColor: PRIMARY,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#CADBFF',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 1,
    shadowRadius: 4,
    elevation: 4,
  },
  heroCtaArrow: {
    position: 'absolute',
    right: scaleSizeW(10),
  },
  heroMascot: {
    position: 'absolute',
    left: -scaleSizeW(16),
    top: -scaleSizeH(26),
    width: scaleSizeW(101),
    height: scaleSizeW(101),
    transform: [{ scaleX: -1 }],
  },
  heroBadgeText: {
    fontSize: setSpText(12),
    lineHeight: setSpText(20),
    fontWeight: '700',
    color: '#FFFFFF',
  },
  heroTitle: {
    fontSize: setSpText(22),
    lineHeight: setSpText(26),
    fontWeight: '700',
    color: '#000000',
  },
  heroCtaText: {
    fontSize: setSpText(14),
    lineHeight: setSpText(20),
    fontWeight: '500',
    color: '#FFFFFF',
  },
  heroSub: {
    marginTop: scaleSizeH(4),
    fontSize: setSpText(12),
    lineHeight: setSpText(20),
    color: TEXT_SUB,
  },
  letterCard: {
    marginHorizontal: scaleSizeW(16),
    marginTop: scaleSizeH(10),
    backgroundColor: 'rgba(255,255,255,0.8)',
    borderWidth: 1,
    borderColor: '#FFFFFF',
    borderRadius: scaleSizeW(10),
    paddingHorizontal: scaleSizeW(14),
    paddingTop: scaleSizeH(14),
    paddingBottom: scaleSizeH(20),
  },
  sectionCardTitle: {
    fontSize: setSpText(14),
    fontWeight: '500',
    lineHeight: setSpText(24),
    color: '#000000',
  },
  letterText: {
    marginTop: scaleSizeH(13),
    fontSize: setSpText(14),
    fontWeight: '500',
    lineHeight: setSpText(24),
    color: '#000000',
  },
  letterTextBody: {
    fontWeight: '400',
    color: TEXT_SUB,
  },
  collapseBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: scaleSizeW(5),
    marginTop: scaleSizeH(14),
  },
  collapseText: {
    fontSize: setSpText(14),
    fontWeight: '500',
    color: PRIMARY,
  },
  plainCard: {
    marginHorizontal: scaleSizeW(16),
    marginTop: scaleSizeH(10),
    backgroundColor: 'rgba(255,255,255,0.8)',
    borderWidth: 1,
    borderColor: '#FFFFFF',
    borderRadius: scaleSizeW(10),
    paddingHorizontal: scaleSizeW(14),
    paddingTop: scaleSizeH(14),
    paddingBottom: scaleSizeH(18),
  },
  feedList: {
    marginTop: scaleSizeH(14),
    gap: scaleSizeH(26),
  },
  feedRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: scaleSizeW(10),
  },
  feedAvatar: {
    width: scaleSizeW(34),
    height: scaleSizeW(34),
    borderRadius: scaleSizeW(17),
    borderWidth: 1,
    borderColor: '#EEEEEE',
  },
  feedInfo: {
    flex: 1,
    gap: scaleSizeH(5),
  },
  feedTitle: {
    fontSize: setSpText(14),
    fontWeight: '500',
    color: '#000000',
  },
  feedSub: {
    fontSize: setSpText(12),
    color: TEXT_SUB,
  },
  contactRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: scaleSizeW(10),
    marginTop: scaleSizeH(10),
  },
  contactAvatar: {
    width: scaleSizeW(40),
    height: scaleSizeW(40),
    borderRadius: scaleSizeW(20),
  },
  contactInfo: {
    flex: 1,
    gap: scaleSizeH(5),
  },
  contactName: {
    fontSize: setSpText(14),
    fontWeight: '500',
    color: '#000000',
  },
  contactRole: {
    fontSize: setSpText(12),
    color: 'rgba(108,108,108,0.8)',
  },
  bottomBar: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    flexDirection: 'row',
    gap: scaleSizeW(10),
    paddingHorizontal: scaleSizeW(16),
    paddingTop: scaleSizeH(14),
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#FFFFFF',
  },
  btnDecline: {
    flex: 1,
    height: scaleSizeH(48),
    borderRadius: 90,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#D9D9D9',
    alignItems: 'center',
    justifyContent: 'center',
  },
  btnDeclineText: {
    fontSize: setSpText(15),
    fontWeight: '500',
    color: '#000000',
  },
  btnAccept: {
    flex: 1,
    height: scaleSizeH(48),
    borderRadius: 90,
    backgroundColor: PRIMARY,
    alignItems: 'center',
    justifyContent: 'center',
  },
  btnAcceptText: {
    fontSize: setSpText(15),
    fontWeight: '500',
    color: '#FFFFFF',
  },
  declineTitle: {
    fontSize: setSpText(16),
    fontWeight: '700',
    color: '#1A2433',
    textAlign: 'center',
  },
  declineSub: {
    marginTop: scaleSizeH(4),
    marginBottom: scaleSizeH(14),
    fontSize: setSpText(12),
    color: '#8A93A1',
    textAlign: 'center',
  },
  declineOptions: {
    gap: scaleSizeH(8),
    marginBottom: scaleSizeH(14),
  },
  declineOption: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    minHeight: scaleSizeH(46),
    paddingHorizontal: scaleSizeW(14),
    borderWidth: 1,
    borderColor: '#E5EBF3',
    borderRadius: scaleSizeW(12),
    backgroundColor: '#FFFFFF',
  },
  declineOptionActive: {
    borderColor: '#9EC0F8',
    backgroundColor: '#F3F8FF',
  },
  declineOptionText: {
    fontSize: setSpText(14),
    fontWeight: '600',
    color: '#1A2433',
  },
  declineOptionTextActive: {
    color: PRIMARY,
  },
  radio: {
    width: scaleSizeW(18),
    height: scaleSizeW(18),
    borderRadius: scaleSizeW(9),
    borderWidth: 1.5,
    borderColor: '#C5CEDB',
  },
  radioActive: {
    borderColor: PRIMARY,
    backgroundColor: PRIMARY,
    borderWidth: scaleSizeW(4.5),
  },
  declineInput: {
    minHeight: scaleSizeH(76),
    padding: scaleSizeW(12),
    marginBottom: scaleSizeH(14),
    borderWidth: 1,
    borderColor: '#E5EBF3',
    borderRadius: scaleSizeW(12),
    backgroundColor: '#F7F9FC',
    fontSize: setSpText(13),
    lineHeight: setSpText(20),
    color: '#1A2433',
    textAlignVertical: 'top',
  },
  declineActions: {
    flexDirection: 'row',
    gap: scaleSizeW(10),
  },
  declineCancel: {
    flex: 1,
    minHeight: scaleSizeH(44),
    borderRadius: scaleSizeW(12),
    borderWidth: 1,
    borderColor: '#D5DDE8',
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  declineCancelText: {
    fontSize: setSpText(14),
    fontWeight: '700',
    color: '#4A5C72',
  },
  declineConfirm: {
    flex: 1.2,
    minHeight: scaleSizeH(44),
    borderRadius: scaleSizeW(12),
    backgroundColor: PRIMARY,
    alignItems: 'center',
    justifyContent: 'center',
  },
  declineConfirmDisabled: {
    opacity: 0.6,
  },
  declineConfirmText: {
    fontSize: setSpText(14),
    fontWeight: '700',
    color: '#FFFFFF',
  },
});
