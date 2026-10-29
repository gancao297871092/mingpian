import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { Image as ExpoImage } from 'expo-image';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import SafeView from '@/components/SafeView';
import { scaleSizeH, scaleSizeW, setSpText } from '@/utils/screenUtils';
import { ChevronRightIcon, FeedDocIcon, FeedRemoveIcon, VerifiedBadgeIcon } from './icons';
import { useFocusEffect, useNavigation, useRoute, type RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RootStackParamList } from '@/route/map';
import { getSelectBbsResult, type SelectedBbs } from '@/utils/selectBbsBridge';
import { useUserStore } from '@/store/user';
import { useSelectBbsStore } from '@/store/selectBbs';
import { API } from '@/api';
import { buildAbilities, setPendingIntentDraft, type SignalIntentAbility } from './signalDraft';

const PRIMARY = '#2962D4';
const TEXT_SUB = '#6C6C6C';
type Nav = NativeStackNavigationProp<RootStackParamList>;

interface CardItem {
  id: number;
  /** 选择弹层前缀：名片1 · */
  prefix: string;
  /** 对接人姓名 */
  person: string;
  /** 对接人职位 */
  title: string;
}

interface CapItem {
  id: number;
  name: string;
}

type PickerKind = 'card' | 'cap';

/** 选择弹层（figma 41.选择名片 257:2100 / 42.选择能力卡 271:2312） */
function PickerSheet({
  kind,
  visible,
  selectedId,
  cards,
  caps,
  onSelect,
  onClose,
  onConfirm,
}: {
  kind: PickerKind;
  visible: boolean;
  selectedId: number | null;
  cards: CardItem[];
  caps: CapItem[];
  onSelect: (id: number) => void;
  onClose: () => void;
  onConfirm: () => void;
}) {
  const insets = useSafeAreaInsets();
  const isCard = kind === 'card';
  const items: { id: number; prefix?: string; name: string }[] = isCard
    ? cards.map(c => ({ id: c.id, prefix: c.prefix, name: c.title || c.person }))
    : caps.map(c => ({ id: c.id, name: c.name }));
  const navigation = useNavigation<Nav>();

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <Pressable style={styles.sheetMask} onPress={onClose}>
        <Pressable style={[styles.sheet, { paddingBottom: insets.bottom + scaleSizeH(16) }]} onPress={() => {}}>
          <View style={styles.sheetHandle} />
          <View style={styles.sheetHeader}>
            <Text style={styles.sheetTitle}>{isCard ? '选择个人名片' : '选择能力卡'}</Text>
            <Text style={styles.sheetNote}>仅可选择 1 张</Text>
          </View>
          <ScrollView
            style={styles.sheetListScroll}
            showsVerticalScrollIndicator={false}
            nestedScrollEnabled
          >
            <View style={styles.sheetList}>
              {items.map((item, i) => {
                const active = selectedId === item.id;
                return (
                  <React.Fragment key={item.id}>
                    {i > 0 && <View style={styles.sheetDivider} />}
                    <TouchableOpacity
                      activeOpacity={0.85}
                      style={styles.sheetRow}
                      onPress={() => onSelect(item.id)}
                    >
                      <Text style={styles.sheetRowText}>
                        {!!item.prefix && <Text style={styles.sheetRowPrefix}>{item.prefix}</Text>}
                        {item.name}
                      </Text>
                      <View style={[styles.radio, active && styles.radioActive]}>
                        {active && <View style={styles.radioDot} />}
                      </View>
                    </TouchableOpacity>
                  </React.Fragment>
                );
              })}
              {items.length === 0 && <Text style={styles.sheetEmpty}>暂无可选项</Text>}
            </View>
          </ScrollView>
          <View style={styles.sheetBtns}>
            {isCard && (
              <TouchableOpacity
                activeOpacity={0.85}
                style={styles.sheetBtnGhost}
                onPress={() => {
                  onClose();
                  navigation.navigate('editCard', {});
                }}
              >
                <Text style={styles.sheetBtnGhostText}>+新增名片</Text>
              </TouchableOpacity>
            )}
            <TouchableOpacity
              activeOpacity={0.85}
              style={[styles.sheetBtnSolid, !isCard && styles.sheetBtnFull]}
              onPress={onConfirm}
            >
              <Text style={styles.sheetBtnSolidText}>确认选择</Text>
            </TouchableOpacity>
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

/** 40.创建合作意向书-未填写（figma 251:1945；已填写态 262:2127） */
export default function CreateCooperationIntent() {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<Nav>();
  const { params } = useRoute<RouteProp<RootStackParamList, 'createCooperationIntent'>>();
  const draftMode = params?.draft === true;
  /** 编辑信号时回显已保存的意向书草稿 */
  const existingIntent = params?.intent;
  const myCpId = useUserStore(s => s.userInfo?.cpId ?? s.userInfo?.wqUser?.cpId);
  const myCompanyName = useUserStore(s => s.userInfo?.cpName ?? s.userInfo?.wqUser?.cpName ?? '');
  const myAvatar = useUserStore(s => s.userInfo?.wqUser?.avatar ?? '');
  const authed = useUserStore(s => s.userInfo?.wqUser?.authCompany === true);
  const [desc, setDesc] = useState(existingIntent?.note ?? '');
  const [picker, setPicker] = useState<PickerKind | null>(null);
  const [cards, setCards] = useState<CardItem[]>([]);
  const [caps, setCaps] = useState<CapItem[]>([]);
  const [cardId, setCardId] = useState<number | null>(existingIntent?.contactCardId ?? null);
  const [capId, setCapId] = useState<number | null>(existingIntent?.cardId ?? null);
  const [cardConfirmed, setCardConfirmed] = useState(!!existingIntent?.contactCardId);
  const [capConfirmed, setCapConfirmed] = useState(!!existingIntent?.cardId);
  const [feeds, setFeeds] = useState<SelectedBbs[]>(() =>
    (existingIntent?.relBbs ?? []).map((id, i) => ({
      id: String(id),
      title: existingIntent?.feedTitles?.[i] ?? '关联动态',
      imageUrl: existingIntent?.feedImages?.[i] ?? '',
    })),
  );
  const [submitting, setSubmitting] = useState(false);

  // 从选择动态页返回后接收选中动态
  useFocusEffect(
    useCallback(() => {
      const result = getSelectBbsResult();
      if (result !== null) {
        setFeeds(result);
      }
    }, []),
  );

  /** 名片 / 企业能力卡列表（能力卡与「企业管理-能力卡」同一数据源：ownerType=1 + cpId） */
  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const [cardRes, capRes] = await Promise.allSettled([
          API.card.list(),
          myCpId
            ? API.capability.cardList({ ownerType: 1, cpId: myCpId })
            : Promise.resolve({ data: { list: [] } }),
        ]);
        if (!alive) return;
        if (cardRes.status === 'fulfilled') {
          // /card/list 读缓存表：id=缓存行雪花ID，cardId 才是真实名片ID（wq_user_cards.id），
          // 跳名片详情/存 contactCardId 必须用 cardId；isCp=1 企业名片行为虚拟ID，不出现在个人名片选择里
          const list: CardItem[] = (cardRes.value.data.cardsList ?? [])
            .filter((c: any) => !c.isCp)
            .map((c: any, i: number) => ({
              id: Number(c.cardId ?? c.id),
              prefix: `名片${i + 1} · `,
              person: c.nameZh || c.alias || '未命名',
              title: c.position || c.alias || '',
            }));
          setCards(list);
          if (list.length) setCardId(prev => prev ?? list[0].id);
        }
        if (capRes.status === 'fulfilled') {
          const list: CapItem[] = (capRes.value.data.list ?? [])
            .map((c: any) => ({ id: Number(c.id), name: c.cardName || '未命名能力卡' }))
            .filter((c: CapItem) => !Number.isNaN(c.id));
          setCaps(list);
          if (list.length) setCapId(prev => prev ?? list[0].id);
        }
      } catch {
        // 拦截器已提示错误
      }
    })();
    return () => {
      alive = false;
    };
  }, [myCpId]);

  const selectedCard = useMemo(() => cards.find(c => c.id === cardId), [cards, cardId]);
  const selectedCap = useMemo(() => caps.find(c => c.id === capId), [caps, capId]);

  const onSubmit = useCallback(async () => {
    if (!desc.trim() || submitting) return;
    setSubmitting(true);
    try {
      if (draftMode) {
        // 信号流程：意向书作为模板随信号保存（后端 abilityContent），不单独建单
        let abilities: SignalIntentAbility[] | undefined;
        if (capId != null) {
          try {
            const detail = await API.capability.cardDetail({ id: capId });
            abilities = buildAbilities(detail.data);
          } catch {
            // 能力卡详情失败不阻断草稿保存
          }
        }
        setPendingIntentDraft({
          note: desc.trim(),
          cardId: capId ?? undefined,
          contactCardId: cardId ?? undefined,
          relBbs: feeds.map(f => Number(f.id)).filter(n => !Number.isNaN(n)),
          cardName: selectedCap?.name,
          contactName: selectedCard?.person,
          contactTitle: selectedCard?.title,
          feedTitles: feeds.map(f => f.title),
          feedImages: feeds.map(f => f.imageUrl || ''),
          abilities,
        });
        navigation.goBack();
        return;
      }
      const res = await API.intent.create({
        opportunityId: params?.opportunityId,
        receiverCpId: params?.receiverCpId,
        note: desc.trim(),
        cardId: capId ?? undefined,
        contactCardId: cardId ?? undefined,
        relBbs: feeds.map(f => Number(f.id)).filter(n => !Number.isNaN(n)),
      });
      navigation.replace('cooperationIntentView', { intentId: res.data.intentId });
    } catch {
      // 拦截器已提示错误
    } finally {
      setSubmitting(false);
    }
  }, [
    cardId,
    capId,
    desc,
    draftMode,
    feeds,
    navigation,
    params?.opportunityId,
    params?.receiverCpId,
    selectedCap?.name,
    selectedCard?.person,
    selectedCard?.title,
    submitting,
  ]);

  return (
    <SafeView backgroundColor="#F6F7FB">
      <ScrollView
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={styles.content}
      >
        {/* 合作说明 */}
        <Text style={styles.label}>合作说明</Text>
        <View style={styles.descCard}>
          <TextInput
            style={styles.descInput}
            multiline
            maxLength={100}
            placeholder="简短说明此次合作..."
            placeholderTextColor="#999999"
            value={desc}
            onChangeText={setDesc}
          />
          <Text style={styles.descCounter}>{desc.length}/100</Text>
        </View>

        {/* 展示身份 */}
        <Text style={[styles.label, styles.labelGap]}>展示身份</Text>
        <View style={styles.identityBar}>
          <ExpoImage
            source={myAvatar ? { uri: myAvatar } : require('@/assets/link/mock-avatar.png')}
            style={styles.identityAvatar}
            contentFit="cover"
          />
          <View style={styles.identityInfo}>
            <Text style={styles.identityName}>{myCompanyName || '本企业'}</Text>
            {authed && (
              <View style={styles.identityBadgeRow}>
                <VerifiedBadgeIcon />
                <Text style={styles.identityBadgeText}>企业已认证</Text>
              </View>
            )}
          </View>
        </View>
        <TouchableOpacity
          activeOpacity={0.85}
          style={[styles.rowCard, styles.rowCardOverlap, cardConfirmed && !!selectedCard && styles.rowCardTall]}
          onPress={() => setPicker('card')}
        >
          {cardConfirmed && selectedCard ? (
            <>
              <ExpoImage
                source={require('@/assets/link/mock-avatar.png')}
                style={styles.contactAvatar}
                contentFit="cover"
              />
              <View style={styles.contactInfo}>
                <Text style={styles.rowCardText}>本次对接人·{selectedCard.person}</Text>
                <Text style={styles.contactSub}>{selectedCard.title}</Text>
              </View>
              <ChevronRightIcon size={12} color={TEXT_SUB} />
            </>
          ) : (
            <>
              <Text style={styles.rowCardText}>个人名片</Text>
              <View style={styles.rowCardRight}>
                <Text style={styles.rowCardLink}>选择本次对接人</Text>
                <ChevronRightIcon size={12} color={PRIMARY} />
              </View>
            </>
          )}
        </TouchableOpacity>

        {/* 选择能力卡 */}
        <Text style={[styles.label, styles.labelGap]}>选择能力卡</Text>
        <TouchableOpacity
          activeOpacity={0.85}
          style={styles.rowCard}
          onPress={() => setPicker('cap')}
        >
          {capConfirmed && selectedCap ? (
            <>
              <Text style={styles.rowCardText}>{selectedCap.name}</Text>
              <ChevronRightIcon size={12} color={TEXT_SUB} />
            </>
          ) : (
            <>
              <Text style={styles.rowCardText}>能力卡</Text>
              <View style={styles.rowCardRight}>
                <Text style={styles.rowCardLink}>请选择</Text>
                <ChevronRightIcon size={12} color={PRIMARY} />
              </View>
            </>
          )}
        </TouchableOpacity>

        {/* 关联动态 */}
        <View style={styles.labelRow}>
          <Text style={styles.label}>关联动态</Text>
          <Text style={styles.labelOptional}>选填</Text>
        </View>
        {feeds.length === 0 ? (
          <TouchableOpacity
            activeOpacity={0.85}
            style={styles.bbsCard}
            onPress={() => {
              useSelectBbsStore.getState().init(feeds);
              navigation.navigate('selectBbs', { cpId: myCpId });
            }}
          >
            <View style={styles.bbsCardInfo}>
              <Text style={styles.rowCardText}>选择动态</Text>
              <Text style={styles.bbsCardSub}>可关联案例、产业机会或日常动态</Text>
            </View>
            <ChevronRightIcon size={14} color={TEXT_SUB} />
          </TouchableOpacity>
        ) : (
          <View style={styles.bbsCardFilled}>
            <TouchableOpacity
              activeOpacity={0.85}
              style={styles.bbsCardHead}
              onPress={() => {
                useSelectBbsStore.getState().init(feeds);
                navigation.navigate('selectBbs', { cpId: myCpId });
              }}
            >
              <View style={styles.bbsCardInfo}>
                <Text style={styles.rowCardText}>选择动态</Text>
                <Text style={styles.bbsCardSub}>可关联案例、产业机会或日常动态</Text>
              </View>
              <ChevronRightIcon size={14} color={TEXT_SUB} />
            </TouchableOpacity>
            <View style={styles.bbsDivider} />
            {feeds.map(feed => (
              <View key={feed.id} style={styles.feedRow}>
                <FeedDocIcon />
                <Text style={styles.feedTitle} numberOfLines={1}>
                  {feed.title}
                </Text>
                <TouchableOpacity
                  hitSlop={8}
                  onPress={() => setFeeds(prev => prev.filter(f => f.id !== feed.id))}
                >
                  <FeedRemoveIcon />
                </TouchableOpacity>
              </View>
            ))}
          </View>
        )}
      </ScrollView>

      {/* 底部按钮：未填写时禁用（30% 透明） */}
      <View style={[styles.footer, { paddingBottom: Math.max(insets.bottom, scaleSizeH(20)) }]}>
        <TouchableOpacity
          activeOpacity={0.85}
          disabled={!desc.trim() || submitting}
          style={[styles.submitBtn, (!desc.trim() || submitting) && styles.submitBtnDisabled]}
          onPress={onSubmit}
        >
          <Text style={styles.submitBtnText}>{existingIntent ? '保存合作意向书' : '创建合作意向书'}</Text>
        </TouchableOpacity>
      </View>
      {/* 选择名片/能力卡弹层 */}
      <PickerSheet
        kind="card"
        visible={picker === 'card'}
        selectedId={cardId}
        cards={cards}
        caps={caps}
        onSelect={setCardId}
        onClose={() => setPicker(null)}
        onConfirm={() => {
          if (cardId != null) {
            setCardConfirmed(true);
            setPicker(null);
          }
        }}
      />
      <PickerSheet
        kind="cap"
        visible={picker === 'cap'}
        selectedId={capId}
        cards={cards}
        caps={caps}
        onSelect={setCapId}
        onClose={() => setPicker(null)}
        onConfirm={() => {
          if (capId != null) {
            setCapConfirmed(true);
            setPicker(null);
          }
        }}
      />
    </SafeView>
  );
}

const styles = StyleSheet.create({
  content: {
    paddingHorizontal: scaleSizeW(16),
    paddingTop: scaleSizeH(30),
    paddingBottom: scaleSizeH(20),
  },
  label: {
    fontSize: setSpText(14),
    fontWeight: '500',
    color: '#000000',
  },
  labelGap: {
    marginTop: scaleSizeH(20),
  },
  labelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: scaleSizeW(10),
    marginTop: scaleSizeH(20),
  },
  labelOptional: {
    fontSize: setSpText(14),
    color: '#999999',
  },
  descCard: {
    marginTop: scaleSizeH(10),
    height: scaleSizeH(100),
    backgroundColor: '#FFFFFF',
    borderRadius: scaleSizeW(10),
  },
  descInput: {
    flex: 1,
    paddingHorizontal: scaleSizeW(14),
    paddingTop: scaleSizeH(17),
    paddingBottom: scaleSizeH(26),
    fontSize: setSpText(14),
    lineHeight: setSpText(24),
    color: '#000000',
    textAlignVertical: 'top',
  },
  descCounter: {
    position: 'absolute',
    right: scaleSizeW(14),
    bottom: scaleSizeH(15),
    fontSize: setSpText(12),
    color: '#999999',
  },
  identityBar: {
    marginTop: scaleSizeH(10),
    height: scaleSizeH(72),
    backgroundColor: '#E7E8EA',
    borderRadius: scaleSizeW(10),
    flexDirection: 'row',
    alignItems: 'center',
    gap: scaleSizeW(5),
    paddingHorizontal: scaleSizeW(14),
    paddingBottom: scaleSizeH(12),
  },
  identityAvatar: {
    width: scaleSizeW(36),
    height: scaleSizeW(36),
    borderRadius: scaleSizeW(18),
    borderWidth: 1,
    borderColor: '#EAEAEA',
  },
  identityInfo: {
    gap: scaleSizeH(4),
  },
  identityName: {
    fontSize: setSpText(12),
    color: '#000000',
  },
  identityBadgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: scaleSizeW(3),
  },
  identityBadgeText: {
    fontSize: setSpText(12),
    lineHeight: setSpText(12),
    color: PRIMARY,
  },
  rowCard: {
    marginTop: scaleSizeH(12),
    height: scaleSizeH(55),
    backgroundColor: '#FFFFFF',
    borderRadius: scaleSizeW(10),
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: scaleSizeW(14),
  },
  rowCardOverlap: {
    marginTop: -scaleSizeH(12),
  },
  rowCardText: {
    fontSize: setSpText(14),
    color: '#000000',
  },
  rowCardRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: scaleSizeW(4),
  },
  rowCardLink: {
    fontSize: setSpText(14),
    color: PRIMARY,
  },
  bbsCard: {
    marginTop: scaleSizeH(12),
    height: scaleSizeH(73),
    backgroundColor: '#FFFFFF',
    borderRadius: scaleSizeW(10),
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: scaleSizeW(14),
  },
  bbsCardInfo: {
    gap: scaleSizeH(5),
  },
  bbsCardSub: {
    fontSize: setSpText(12),
    color: TEXT_SUB,
  },
  rowCardTall: {
    height: scaleSizeH(73),
  },
  contactAvatar: {
    width: scaleSizeW(36),
    height: scaleSizeW(36),
    borderRadius: scaleSizeW(18),
    borderWidth: 1,
    borderColor: '#EAEAEA',
  },
  contactInfo: {
    flex: 1,
    gap: scaleSizeH(5),
  },
  contactSub: {
    fontSize: setSpText(12),
    color: TEXT_SUB,
  },
  bbsCardFilled: {
    marginTop: scaleSizeH(12),
    backgroundColor: '#FFFFFF',
    borderRadius: scaleSizeW(10),
    paddingVertical: scaleSizeH(14),
  },
  bbsCardHead: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: scaleSizeW(14),
    paddingBottom: scaleSizeH(14),
  },
  bbsDivider: {
    height: 1,
    backgroundColor: '#EBEBEB',
    marginHorizontal: scaleSizeW(14),
  },
  feedRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: scaleSizeW(5),
    paddingHorizontal: scaleSizeW(14),
    marginTop: scaleSizeH(14),
  },
  feedTitle: {
    flex: 1,
    fontSize: setSpText(12),
    lineHeight: setSpText(14),
    color: '#000000',
  },
  footer: {
    paddingHorizontal: scaleSizeW(16),
    paddingTop: scaleSizeH(8),
  },
  submitBtn: {
    height: scaleSizeH(48),
    borderRadius: 90,
    backgroundColor: PRIMARY,
    alignItems: 'center',
    justifyContent: 'center',
  },
  submitBtnDisabled: {
    opacity: 0.3,
  },
  submitBtnText: {
    fontSize: setSpText(15),
    lineHeight: setSpText(24),
    fontWeight: '500',
    color: '#FFFFFF',
  },
  sheetMask: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  sheet: {
    backgroundColor: '#F6F7FB',
    borderTopLeftRadius: scaleSizeW(20),
    borderTopRightRadius: scaleSizeW(20),
    paddingHorizontal: scaleSizeW(16),
  },
  sheetHandle: {
    alignSelf: 'center',
    marginTop: scaleSizeH(10),
    width: scaleSizeW(34),
    height: scaleSizeH(6),
    borderRadius: 3,
    backgroundColor: '#A3A3A3',
  },
  sheetHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: scaleSizeH(20),
  },
  sheetTitle: {
    fontSize: setSpText(17),
    fontWeight: '600',
    color: '#000000',
  },
  sheetNote: {
    fontSize: setSpText(12),
    color: TEXT_SUB,
  },
  sheetListScroll: {
    marginTop: scaleSizeH(14),
    maxHeight: scaleSizeH(330),
    borderRadius: scaleSizeW(10),
  },
  sheetList: {
    backgroundColor: '#FFFFFF',
    borderRadius: scaleSizeW(10),
    paddingHorizontal: scaleSizeW(14),
  },
  sheetRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: scaleSizeH(20),
  },
  sheetRowText: {
    fontSize: setSpText(14),
    fontWeight: '500',
    lineHeight: setSpText(14),
    color: '#000000',
  },
  sheetEmpty: {
    paddingVertical: scaleSizeH(20),
    fontSize: setSpText(14),
    color: TEXT_SUB,
  },
  sheetRowPrefix: {
    color: TEXT_SUB,
  },
  sheetDivider: {
    height: 1,
    backgroundColor: '#F6F7FB',
  },
  radio: {
    width: scaleSizeW(18),
    height: scaleSizeW(18),
    borderRadius: scaleSizeW(9),
    borderWidth: 1,
    borderColor: '#D9D9D9',
    alignItems: 'center',
    justifyContent: 'center',
  },
  radioActive: {
    borderColor: PRIMARY,
    backgroundColor: PRIMARY,
  },
  radioDot: {
    width: scaleSizeW(6),
    height: scaleSizeW(6),
    borderRadius: scaleSizeW(3),
    backgroundColor: '#FFFFFF',
  },
  sheetBtns: {
    flexDirection: 'row',
    gap: scaleSizeW(10),
    marginTop: scaleSizeH(21),
  },
  sheetBtnGhost: {
    flex: 1,
    height: scaleSizeH(48),
    borderRadius: 90,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  sheetBtnGhostText: {
    fontSize: setSpText(15),
    fontWeight: '500',
    lineHeight: setSpText(24),
    color: '#000000',
  },
  sheetBtnSolid: {
    flex: 1,
    height: scaleSizeH(48),
    borderRadius: 90,
    backgroundColor: PRIMARY,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sheetBtnFull: {
    flex: 1,
  },
  sheetBtnSolidText: {
    fontSize: setSpText(15),
    fontWeight: '500',
    lineHeight: setSpText(24),
    color: '#FFFFFF',
  },
});
