import React, { useCallback, useState } from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Image as ExpoImage } from 'expo-image';
import { useFocusEffect, useNavigation, useRoute, type RouteProp } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import SafeView from '@/components/SafeView';
import { API } from '@/api';
import { useUserStore } from '@/store/user';
import { scaleSizeH, scaleSizeW, setSpText } from '@/utils/screenUtils';
import type { RootStackParamList } from '@/route/map';
import {
  stringifyAbilityContent,
  takePendingTouchSummary,
  type SignalIntentDraft,
} from './signalDraft';
import { ChevronRightIcon, NoteDotIcon } from './icons';

const PRIMARY = '#2962D4';
const GREEN = '#36BE69';
const ORANGE = '#F2722C';
const TEXT_SUB = '#6C6C6C';

type PreviewTab = 'customer' | 'reach';

/** 触达摘要（订单：目标客户 / 合作目的 / 能力内容 / 触达身份） */
interface SummaryRow {
  label: string;
  value: string;
}

/** 标题圆点：彩色圆 + 便签 glyph */
function SectionDot({ color }: { color: string }) {
  return (
    <View style={[styles.dot, { backgroundColor: color }]}>
      <NoteDotIcon />
    </View>
  );
}

/** 触达设置 tab（figma 53.合作信号预览2 2793:7116 当前稿） */
function ReachContent({
  summary,
  onEditSummary,
}: {
  summary: SummaryRow[];
  onEditSummary: () => void;
}) {
  return (
    <>
      <View style={styles.card}>
        <View style={styles.cardTitleRow}>
          <SectionDot color={PRIMARY} />
          <Text style={styles.cardTitle}>触达摘要</Text>
        </View>
        <View style={styles.summaryRows}>
          {summary.map(row => (
            <View key={row.label} style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>{row.label}</Text>
              <Text style={styles.summaryValue}>{row.value}</Text>
            </View>
          ))}
        </View>
        <TouchableOpacity activeOpacity={0.85} style={styles.editSummaryBtn} onPress={onEditSummary}>
          <Text style={styles.editSummaryText}>修改摘要</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.card}>
        <View style={styles.cardTitleRow}>
          <SectionDot color={GREEN} />
          <Text style={styles.cardTitle}>平台如何触达</Text>
        </View>
        <View style={styles.reachItem}>
          <Text style={styles.reachItemTitle}>广场定向曝光</Text>
          <Text style={styles.reachItemDesc}>提高已有优质内容在目标客户的曝光率</Text>
        </View>
        <View style={styles.reachItem}>
          <Text style={styles.reachItemTitle}>合作能力卡触达</Text>
          <Text style={styles.reachItemDesc}>
            {'提高平台用户与被精准触达到的匹配客户\n频次：同一目标企业每周最多 2 次，不重复推送已回复的'}
          </Text>
        </View>
      </View>

      <View style={styles.card}>
        <View style={styles.cardTitleRow}>
          <SectionDot color={ORANGE} />
          <Text style={styles.cardTitle}>先使用，有效后计费</Text>
        </View>
        <View style={styles.tipPill}>
          <Text style={styles.tipPillText}>赠送额度内免费，经验证企业通过「愿聊」才计为有效触达。</Text>
        </View>
        <View style={styles.reachItem}>
          <Text style={styles.reachItemTitle}>预付金额</Text>
          <Text style={styles.reachItemDesc}>有效触达后，按触达企业数量扣费</Text>
        </View>
      </View>
    </>
  );
}

/** 客户看到的 tab：用信号里保存的意向书草稿渲染（未创建意向书时仅展示发送企业） */
function CustomerContent({
  note,
  companyName,
  companyLogo,
  intent,
}: {
  note: string;
  companyName: string;
  companyLogo?: string;
  intent?: SignalIntentDraft;
}) {
  const abilities = intent?.abilities ?? [];
  const feeds = (intent?.feedTitles ?? []).map((title, i) => ({
    id: String(intent?.relBbs?.[i] ?? i),
    title,
    image: intent?.feedImages?.[i] || '',
  }));
  const contactName = intent?.contactName || '';
  const contactTitle = intent?.contactTitle || '';
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();

  return (
    <>
      <View style={styles.card}>
        <Text style={styles.cardTitle}>本次合作说明</Text>
        <Text style={styles.customerDesc}>{note || '暂无合作说明'}</Text>
      </View>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>发送企业</Text>
        <TouchableOpacity activeOpacity={0.85} style={styles.customerRow}>
          {companyLogo ? (
            <ExpoImage source={{ uri: companyLogo }} style={styles.companyLogo} contentFit="cover" />
          ) : (
            <View style={styles.companyLogo}>
              <Text style={styles.companyLogoText}>{(companyName || '企').slice(0, 1)}</Text>
            </View>
          )}
          <View style={styles.customerRowInfo}>
            <Text style={styles.customerRowTitle} numberOfLines={1}>{companyName || '本企业'}</Text>
            <Text style={styles.customerRowSub} numberOfLines={1}>企业认证 · 信息已核验</Text>
          </View>
          <ChevronRightIcon size={14} />
        </TouchableOpacity>
      </View>

      {abilities.length > 0 && (
        <View style={styles.card}>
          <Text style={styles.cardTitle}>企业能力</Text>
          <View style={styles.abilityList}>
            {abilities.map(item => (
              <View key={item.title} style={styles.abilityItem}>
                <Text style={styles.abilityTitle}>{item.title}</Text>
                <Text style={styles.abilityContent}>{item.body}</Text>
              </View>
            ))}
          </View>
        </View>
      )}

      {feeds.length > 0 && (
        <View style={styles.card}>
          <Text style={styles.cardTitle}>关联动态</Text>
          {feeds.map((item, index) => (
            <TouchableOpacity
              key={item.id}
              activeOpacity={0.85}
              style={[styles.feedRow, index > 0 && styles.feedRowGap]}
              onPress={() => navigation.navigate('bbsDetail', { id: item.id })}
            >
              {item.image ? (
                <ExpoImage source={{ uri: item.image }} style={styles.feedCover} contentFit="cover" />
              ) : (
                <View style={styles.feedCover} />
              )}
              <View style={styles.customerRowInfo}>
                <Text style={styles.customerRowTitle} numberOfLines={1}>{item.title}</Text>
              </View>
              <ChevronRightIcon size={14} />
            </TouchableOpacity>
          ))}
        </View>
      )}

      {!!contactName && (
        <View style={styles.card}>
          <Text style={styles.cardTitle}>本次对接人</Text>
          <TouchableOpacity activeOpacity={0.85} style={styles.customerRow}>
            <ExpoImage source={require('@/assets/link/mock-avatar.png')} style={styles.contactAvatar} contentFit="cover" />
            <View style={styles.customerRowInfo}>
              <Text style={styles.customerRowTitle}>{contactName}</Text>
              <Text style={styles.customerRowSub}>{contactTitle}</Text>
            </View>
            <ChevronRightIcon size={14} />
          </TouchableOpacity>
        </View>
      )}
    </>
  );
}

/** 53.合作信号预览2（figma 2793:7116，分组10最新稿） */
export default function CooperationSignalPreview() {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const route = useRoute<RouteProp<RootStackParamList, 'cooperationSignalPreview'>>();
  const id = route.params?.id;
  const targetDesc = route.params?.targetDesc ?? '';
  const intent = route.params?.intent;
  const companyName = useUserStore(s => s.userInfo?.cpName ?? s.userInfo?.wqUser?.cpName ?? '');
  /** 本企业 Logo（/my/info 返回 cpAvatar，后端未加字段前回退首字占位；不为单字段多调接口） */
  const companyLogo = useUserStore(s => s.userInfo?.cpAvatar ?? s.userInfo?.wqUser?.cpAvatar ?? '');
  const [tab, setTab] = useState<PreviewTab>('customer');
  const [summaryOverride, setSummaryOverride] = useState<SummaryRow[] | null>(null);
  const [submitting, setSubmitting] = useState(false);

  /** 修改摘要页返回后覆盖摘要 */
  useFocusEffect(
    useCallback(() => {
      const next = takePendingTouchSummary();
      if (next) {
        setSummaryOverride([
          { label: '目标客户', value: next.target },
          { label: '合作目的', value: next.purpose },
          { label: '能力内容', value: next.capability },
          { label: '触达身份', value: next.identity },
        ]);
      }
    }, []),
  );

  const defaultSummary: SummaryRow[] = [
    { label: '目标客户', value: targetDesc },
    { label: '合作目的', value: intent?.note || '拓展合作机会' },
    {
      label: '能力内容',
      value: intent ? `${intent.feedTitles?.length ?? 0} 篇真实动态 + 能力阐述` : '未创建合作意向书',
    },
    {
      label: '触达身份',
      value: [intent?.contactName, intent?.contactTitle].filter(Boolean).join(' · ') || companyName || '本企业',
    },
  ];
  const summary = summaryOverride ?? defaultSummary;

  const onSubmit = useCallback(async () => {
    if (submitting) return;
    setSubmitting(true);
    try {
      const abilityContent = stringifyAbilityContent(intent);
      if (id) {
        await API.signal.update({
          signalId: id,
          targetDesc,
          abilityContent,
          identityCardId: intent?.contactCardId,
          reachConfig: '{"cycle_days":7,"max_per_target":2}',
        });
      } else {
        await API.signal.create({
          targetDesc,
          abilityContent,
          identityCardId: intent?.contactCardId,
          reachConfig: '{"cycle_days":7,"max_per_target":2}',
        });
      }
      const hasMySignals = navigation.getState().routes.some(r => r.name === 'mySignals');
      if (hasMySignals) navigation.popTo('mySignals');
      else navigation.replace('mySignals');
    } catch {
      // 拦截器已提示错误
    } finally {
      setSubmitting(false);
    }
  }, [id, intent, navigation, submitting, targetDesc]);

  return (
    <SafeView backgroundColor="#F6F7FB">
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.content}
      >
        {/* 分段切换：客户看到的 / 触达设置 */}
        <View style={styles.segment}>
          <TouchableOpacity
            activeOpacity={0.85}
            style={[styles.segmentBtn, tab === 'customer' && styles.segmentBtnActive]}
            onPress={() => setTab('customer')}
          >
            <Text style={[styles.segmentText, tab === 'customer' && styles.segmentTextActive]}>客户看到的</Text>
          </TouchableOpacity>
          <TouchableOpacity
            activeOpacity={0.85}
            style={[styles.segmentBtn, tab === 'reach' && styles.segmentBtnActive]}
            onPress={() => setTab('reach')}
          >
            <Text style={[styles.segmentText, tab === 'reach' && styles.segmentTextActive]}>触达设置</Text>
          </TouchableOpacity>
        </View>

        {tab === 'reach' ? (
          <ReachContent
            summary={summary}
            onEditSummary={() =>
              navigation.navigate('editTouchSummary', {
                summary: {
                  target: summary[0].value,
                  purpose: summary[1].value,
                  capability: summary[2].value,
                  identity: summary[3].value,
                },
              })
            }
          />
        ) : (
          <CustomerContent
            note={intent?.note || targetDesc}
            companyName={companyName}
            companyLogo={companyLogo || undefined}
            intent={intent}
          />
        )}
      </ScrollView>

      {/* 底部操作条 */}
      <View style={[styles.footer, { paddingBottom: Math.max(insets.bottom, scaleSizeH(14)) }]}>
        <TouchableOpacity
          activeOpacity={0.85}
          style={[styles.footerBtn, styles.footerBtnBack]}
          onPress={() => navigation.goBack()}
        >
          <Text style={styles.footerBtnBackText}>返回修改</Text>
        </TouchableOpacity>
        <TouchableOpacity
          activeOpacity={0.85}
          disabled={submitting}
          style={[styles.footerBtn, styles.footerBtnConfirm, submitting && styles.footerBtnDisabled]}
          onPress={onSubmit}
        >
          <Text style={styles.footerBtnConfirmText}>{id ? '确认修改' : '确认创建信号'}</Text>
        </TouchableOpacity>
      </View>
    </SafeView>
  );
}

const styles = StyleSheet.create({
  content: {
    paddingHorizontal: scaleSizeW(16),
    paddingTop: scaleSizeH(20),
    paddingBottom: scaleSizeH(20),
  },
  segment: {
    flexDirection: 'row',
    height: scaleSizeH(32),
    backgroundColor: '#FFFFFF',
    borderRadius: 100,
    padding: 2,
    gap: scaleSizeW(4),
    marginBottom: scaleSizeH(20),
  },
  segmentBtn: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 20,
  },
  segmentBtnActive: {
    backgroundColor: '#000000',
  },
  segmentText: {
    fontSize: setSpText(13),
    lineHeight: setSpText(18),
    fontWeight: '500',
    color: '#000000',
  },
  segmentTextActive: {
    color: '#FFFFFF',
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: scaleSizeW(10),
    padding: scaleSizeW(14),
    marginBottom: scaleSizeH(10),
  },
  cardTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: scaleSizeW(5),
  },
  dot: {
    width: scaleSizeW(18),
    height: scaleSizeW(18),
    borderRadius: scaleSizeW(9),
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardTitle: {
    fontSize: setSpText(15),
    lineHeight: setSpText(18),
    fontWeight: '500',
    color: '#000000',
  },
  summaryRows: {
    marginTop: scaleSizeH(20),
    gap: scaleSizeH(10),
  },
  summaryRow: {
    flexDirection: 'row',
    gap: scaleSizeW(35),
  },
  summaryLabel: {
    fontSize: setSpText(14),
    lineHeight: setSpText(18),
    color: TEXT_SUB,
  },
  summaryValue: {
    flex: 1,
    fontSize: setSpText(14),
    lineHeight: setSpText(18),
    color: '#000000',
  },
  editSummaryBtn: {
    marginTop: scaleSizeH(20),
    height: scaleSizeH(35),
    borderRadius: 90,
    backgroundColor: '#F2F6FF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  editSummaryText: {
    fontSize: setSpText(14),
    fontWeight: '500',
    color: PRIMARY,
  },
  reachItem: {
    marginTop: scaleSizeH(10),
    backgroundColor: '#F6F7FB',
    borderRadius: scaleSizeW(10),
    padding: scaleSizeW(14),
    gap: scaleSizeH(5),
  },
  reachItemTitle: {
    fontSize: setSpText(14),
    lineHeight: setSpText(18),
    color: '#000000',
  },
  reachItemDesc: {
    fontSize: setSpText(12),
    lineHeight: setSpText(18),
    color: TEXT_SUB,
  },
  tipPill: {
    marginTop: scaleSizeH(10),
    alignSelf: 'flex-start',
    backgroundColor: '#FFF5EF',
    borderRadius: 90,
    paddingHorizontal: scaleSizeW(10),
    paddingVertical: scaleSizeH(5),
  },
  tipPillText: {
    fontSize: setSpText(12),
    lineHeight: setSpText(18),
    color: ORANGE,
  },
  customerDesc: {
    marginTop: scaleSizeH(10),
    fontSize: setSpText(14),
    lineHeight: setSpText(22),
    color: '#000000',
  },
  customerRow: {
    marginTop: scaleSizeH(12),
    flexDirection: 'row',
    alignItems: 'center',
    gap: scaleSizeW(10),
  },
  companyLogo: {
    width: scaleSizeW(40),
    height: scaleSizeW(40),
    borderRadius: scaleSizeW(8),
    backgroundColor: '#F6F7FB',
    alignItems: 'center',
    justifyContent: 'center',
  },
  companyLogoText: {
    fontSize: setSpText(13),
    fontWeight: '600',
    color: PRIMARY,
  },
  customerRowInfo: {
    flex: 1,
    gap: scaleSizeH(3),
  },
  customerRowTitle: {
    fontSize: setSpText(14),
    fontWeight: '500',
    color: '#000000',
  },
  customerRowSub: {
    fontSize: setSpText(12),
    color: TEXT_SUB,
  },
  abilityList: {
    marginTop: scaleSizeH(10),
    gap: scaleSizeH(12),
  },
  abilityItem: {
    gap: scaleSizeH(4),
  },
  abilityTitle: {
    fontSize: setSpText(14),
    fontWeight: '500',
    color: '#000000',
  },
  abilityContent: {
    fontSize: setSpText(12),
    lineHeight: setSpText(18),
    color: TEXT_SUB,
  },
  expandRow: {
    marginTop: scaleSizeH(12),
    flexDirection: 'row',
    alignItems: 'center',
    gap: scaleSizeW(2),
  },
  expandText: {
    fontSize: setSpText(13),
    color: PRIMARY,
  },
  feedRow: {
    marginTop: scaleSizeH(12),
    flexDirection: 'row',
    alignItems: 'center',
    gap: scaleSizeW(10),
  },
  feedRowGap: {
    marginTop: scaleSizeH(10),
  },
  feedCover: {
    width: scaleSizeW(56),
    height: scaleSizeW(56),
    borderRadius: scaleSizeW(8),
    backgroundColor: '#F6F7FB',
  },
  contactAvatar: {
    width: scaleSizeW(40),
    height: scaleSizeW(40),
    borderRadius: scaleSizeW(20),
  },
  footer: {
    flexDirection: 'row',
    gap: scaleSizeW(10),
    paddingHorizontal: scaleSizeW(16),
    paddingTop: scaleSizeH(14),
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: '#EBEBEB',
  },
  footerBtn: {
    flex: 1,
    height: scaleSizeH(48),
    borderRadius: 90,
    alignItems: 'center',
    justifyContent: 'center',
  },
  footerBtnBack: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#D9D9D9',
  },
  footerBtnBackText: {
    fontSize: setSpText(15),
    lineHeight: setSpText(24),
    fontWeight: '500',
    color: '#000000',
  },
  footerBtnConfirm: {
    backgroundColor: PRIMARY,
  },
  footerBtnDisabled: {
    opacity: 0.6,
  },
  footerBtnConfirmText: {
    fontSize: setSpText(15),
    lineHeight: setSpText(24),
    fontWeight: '500',
    color: '#FFFFFF',
  },
});
