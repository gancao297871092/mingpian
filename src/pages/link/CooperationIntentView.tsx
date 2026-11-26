import React, { useCallback, useRef, useState } from 'react';
import { ActivityIndicator, Animated, Share, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import AppImage from '@/components/AppImage';
import { useFocusEffect, useNavigation, useRoute, type RouteProp } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import type { BottomSheetModal } from '@gorhom/bottom-sheet';
import SafeView from '@/components/SafeView';
import AppBottomSheet from '@/components/AppBottomSheet';
import { API } from '@/api';
import { useUserStore } from '@/store/user';
import { SCREEN_WIDTH, scaleSizeH, scaleSizeW, setSpText } from '@/utils/screenUtils';
import type { RootStackParamList } from '@/route/map';
import { buildAbilities, parseAbilityContent, type SignalIntentAbility } from './signalDraft';
import { ChevronLeftIcon, ShareIntentIcon } from './icons';
import IntentContentView, { type IntentFeedItem } from './IntentContentView';

const PRIMARY = '#2962D4';

/** 「暂不考虑的原因」选项（对齐原型：单选 + 其他补充说明） */
const DECLINE_REASONS = ['暂时没有合作需求', '已有稳定合作方', '与当前业务不匹配', '其他'];

interface IntentViewData {
  quote: string;
  companyName: string;
  companySub: string;
  companyId?: number;
  companyLogo?: string;
  abilities: SignalIntentAbility[];
  feeds: IntentFeedItem[];
  contact: { name: string; title: string };
  contactCardId?: number;
  canResponse: boolean;
  /** 回应状态：0待回应 1愿意沟通 2暂不考虑（决定底部条形态） */
  response: number;
  /** 意向书状态：0有效 -1已撤回（撤回后不展示底部条） */
  status: number;
  intentId?: number;
  /** 对方用户ID（接收方视角=发起人 senderUserId，「继续沟通」跳留言会话用） */
  peerUserId?: number;
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

/** 企业地区：城市优先；直辖市（city 与省同名/市辖区）回退省名。原型显示「鄂尔多斯」「重庆」级别 */
function companyRegion(company?: any): string {
  if (!company) return '';
  const province = company.province || '';
  const city = company.city || '';
  if (city && city !== province && city !== '市辖区') return city;
  return province || city;
}

/** 企业行副标题：类型 · 地区（原型 data-enterprise-meta，如「煤矿装备制造 · 鄂尔多斯」；无类型/地区时兜底认证文案） */
function companySubText(company?: any): string {
  return [company?.types, companyRegion(company)].filter(Boolean).join(' · ') || '企业认证 · 信息已核验';
}

/** 对接人职位：positionList 项结构为 {id, name, isCheck}（不是 .position）；已勾选优先，其次第一条 */
function firstPositionTitle(positionList?: any[]): string {
  if (!positionList?.length) return '';
  const checked = positionList.find((o: any) => o.isCheck);
  return (checked ?? positionList[0])?.name || '';
}

/** 37.合作意向书（figma 222:1542）：浅蓝底玻璃头 + 意向书正文 + 底部操作条 */
export default function CooperationIntentView() {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const route = useRoute<RouteProp<RootStackParamList, 'cooperationIntentView'>>();
  const intentId = route.params?.intentId;
  const signalId = route.params?.signalId;
  /** 分享按钮仅对两个来源开放（原型批注）：链接-合作中心-等待对方「查看申请」、链接-我的信号-查看进展 */
  const showShare = route.params?.showShare === true;
  const myCompanyName = useUserStore(s => s.userInfo?.cpName ?? s.userInfo?.wqUser?.cpName ?? '');
  const [data, setData] = useState<IntentViewData>(EMPTY);
  const [submitting, setSubmitting] = useState(false);
  /** 首次加载中：避免空壳（空白说明卡/企业卡）闪烁 */
  const [initialLoading, setInitialLoading] = useState(true);
  const [declineReason, setDeclineReason] = useState('');
  const [declineOther, setDeclineOther] = useState('');
  const declineRef = useRef<BottomSheetModal>(null);
  const scrollY = useRef(new Animated.Value(0)).current;

  const load = useCallback(async () => {
    if (intentId) {
      try {
        const res = await API.intent.detail({ intentId });


        const detail = res.data;
        const intent = detail.intent;
        const card = detail.cardSnapshot ?? {};
        let contact = { name: '', title: '' };
        if (intent.contactCardId) {
          try {
            const cardRes = await API.card.detail({ cardId: intent.contactCardId });
            contact = {
              name: cardRes.data.nameZh || cardRes.data.alias || '',
              title: firstPositionTitle(cardRes.data.positionList),
            };
          } catch {
            // 名片信息失败不影响正文
          }
        }
        // 关联动态由后端 relBbsList 下发（含标题/封面/摘要 sub——待后端补充，见后端对齐文档）
        const feeds: IntentFeedItem[] = (detail.relBbsList ?? []).map(item => ({
          id: String(item.id),
          title: item.title || '关联动态',
          sub: item.sub || '',
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
          companySub: companySubText(detail.senderCompany),
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
          peerUserId: intent.senderUserId,
        });
      } catch {
        // 拦截器已提示错误
      } finally {
        setInitialLoading(false);
      }
      return;
    }
    if (signalId) {
      try {
        const res = await API.signal.detail({ signalId });
        const draft = parseAbilityContent(res.data.signal?.abilityContent);
        if (!draft) return;
        // 关联动态优先用后端 feedList（实时组装，含 desc 正文摘要）；老数据无 feedList 时回退 abilityContent 快照
        const feedList = res.data.feedList;
        const feeds: IntentFeedItem[] = Array.isArray(feedList)
          ? feedList.map(f => ({
              id: String(f.bbsId ?? ''),
              title: f.title || '关联动态',
              sub: f.desc || '',
              cover: f.cover || undefined,
            }))
          : (draft.feedTitles ?? []).map((title, i) => ({
              id: String(draft.relBbs?.[i] ?? i),
              title,
              sub: draft.feedSubs?.[i] || '',
              cover: draft.feedImages?.[i] || undefined,
            }));
        setData({
          quote: draft.note,
          companyName: res.data.company?.name || myCompanyName,
          companySub: companySubText(res.data.company),
          companyId: res.data.company?.id,
          companyLogo: res.data.company?.avatar || undefined,
          abilities: await resolveAbilities(draft.cardId, draft.abilities ?? []),
          feeds,
          contact: { name: draft.contactName || '', title: draft.contactTitle || '' },
          contactCardId: draft.contactCardId,
          canResponse: false,
          response: 0,
          status: 0,
        });
      } catch {
        // 拦截器已提示错误
      } finally {
        setInitialLoading(false);
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
        if (responseType === 1 && data.peerUserId) {
          setData(current => ({ ...current, canResponse: false, response: 1 }));
          navigation.navigate('messageDetail', { userId: data.peerUserId });
        } else {
          await load();
        }
      } catch {
        // 拦截器已提示错误
      } finally {
        setSubmitting(false);
      }
    },
    [data.intentId, data.peerUserId, load, navigation, submitting],
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

  /** 头部底色：滚动 0~60px 内渐变为纯白 */
  const navbarBgOpacity = scrollY.interpolate({
    inputRange: [0, 60],
    outputRange: [0, 1],
    extrapolate: 'clamp',
  });

  return (
    <SafeView backgroundColor="#E8EFFF">
      <AppImage
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
        {showShare ? (
          <TouchableOpacity
            activeOpacity={0.85}
            style={styles.glassBtn}
            onPress={onShare}
          >
            <ShareIntentIcon />
          </TouchableOpacity>
        ) : (
          // 无分享时占位，保持标题居中
          <View style={styles.navPlaceholder} />
        )}
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
        {initialLoading ? (
          <ActivityIndicator style={styles.loadingPad} size="large" color={PRIMARY} />
        ) : (
          <>
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
          <AppImage source={require('@/assets/link/hero-mascot.png')} style={styles.heroMascot} contentFit="cover" />
        </View> */}
        {/* 意向书正文（与「客户看到的」预览共用的 IntentContentView） */}
        <IntentContentView
          quote={data.quote}
          companyName={data.companyName}
          companySub={data.companySub}
          companyId={data.companyId}
          companyLogo={data.companyLogo}
          abilities={data.abilities}
          feeds={data.feeds}
          contact={data.contact}
          contactCardId={data.contactCardId}
        />
          </>
        )}
      </Animated.ScrollView>

      {/* 底部操作条（接收方视角）：待回应=双按钮；已同意且有效=仅「继续沟通」（跳留言会话，不调回应接口）；其余（已拒绝/已撤回/发送方）=不展示 */}
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
              onPress={() =>
                data.peerUserId
                  ? navigation.navigate('messageDetail', { userId: data.peerUserId })
                  : navigation.navigate('MainTabs', { screen: 'message' })
              }
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
    // 不给 elevation：Android 上半透明背景 + elevation 会被阴影渗色成脏灰块；iOS 阴影走 shadow* 不受影响
  },
  navPlaceholder: {
    width: scaleSizeW(44),
    height: scaleSizeW(44),
  },
  navTitle: {
    fontSize: setSpText(17),
    fontWeight: '600',
    color: '#000000',
  },
  content: {},
  loadingPad: {
    paddingVertical: scaleSizeH(120),
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
