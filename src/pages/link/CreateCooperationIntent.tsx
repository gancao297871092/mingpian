import React, { useCallback, useState } from 'react';
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
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RootStackParamList } from '@/route/map';
import { getSelectBbsResult, type SelectedBbs } from '@/utils/selectBbsBridge';
import { useUserStore } from '@/store/user';
import { useSelectBbsStore } from '@/store/selectBbs';

const PRIMARY = '#2962D4';
const TEXT_SUB = '#6C6C6C';
type Nav = NativeStackNavigationProp<RootStackParamList>;

/** 静态 mock（接口待联调）：展示身份企业信息 */
const MOCK_IDENTITY = { company: '深圳联诚采信科技有限公司', verified: true };

/** 静态 mock（接口待联调） */
const MOCK_CARDS = [
  { id: 'c1', prefix: '名片1 · ', person: '王磊', title: '智能制造解决方案顾问' },
  { id: 'c2', prefix: '名片2 · ', person: '王磊', title: '供应链合作负责人、采购代表' },
  { id: 'c3', prefix: '名片3 · ', person: '王磊', title: '项目交付经理、技术顾问' },
  { id: 'c4', prefix: '名片4 · ', person: '王磊', title: '海外市场拓展经理' },
  { id: 'c5', prefix: '名片5 · ', person: '王磊', title: '大客户销售总监' },
  { id: 'c6', prefix: '名片6 · ', person: '王磊', title: '工业品采购专家' },
  { id: 'c7', prefix: '名片7 · ', person: '王磊', title: '仓储物流规划师' },
  { id: 'c8', prefix: '名片8 · ', person: '王磊', title: '质量管理与体系认证顾问' },
  { id: 'c9', prefix: '名片9 · ', person: '王磊', title: '数字化转型咨询顾问' },
  { id: 'c10', prefix: '名片10 · ', person: '王磊', title: '新能源项目合作负责人' },
  { id: 'c11', prefix: '名片11 · ', person: '王磊', title: '精密制造工艺工程师' },
  { id: 'c12', prefix: '名片12 · ', person: '王磊', title: '品牌与渠道合作经理' },
];

/** 静态 mock（接口待联调） */
const MOCK_CAPS = [
  { id: 'k1', name: '包装材料供应与协同交付' },
  { id: 'k2', name: '工业物流仓配解决方案' },
  { id: 'k3', name: '智能制造产线集成' },
  { id: 'k4', name: '供应链金融服务' },
  { id: 'k5', name: '工业质检与溯源体系' },
  { id: 'k6', name: '跨境贸易清关代理' },
  { id: 'k7', name: '企业数字化中台搭建' },
  { id: 'k8', name: '新能源设备安装运维' },
  { id: 'k9', name: '精密零部件定制加工' },
  { id: 'k10', name: '工业品电商代运营' },
  { id: 'k11', name: '工厂节能改造方案' },
  { id: 'k12', name: '品牌包装设计与打样' },
];

type PickerKind = 'card' | 'cap';

/** 选择弹层（figma 41.选择名片 257:2100 / 42.选择能力卡 271:2312） */
function PickerSheet({
  kind,
  visible,
  selectedId,
  onSelect,
  onClose,
  onConfirm,
}: {
  kind: PickerKind;
  visible: boolean;
  selectedId: string;
  onSelect: (id: string) => void;
  onClose: () => void;
  onConfirm: () => void;
}) {
  const insets = useSafeAreaInsets();
  const isCard = kind === 'card';
  const items: { id: string; prefix?: string; name: string }[] = isCard
    ? MOCK_CARDS.map(c => ({ id: c.id, prefix: c.prefix, name: c.title }))
    : MOCK_CAPS;
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
  const myCpId = useUserStore(s => s.userInfo?.cpId ?? s.userInfo?.wqUser?.cpId);
  const [desc, setDesc] = useState('');
  const [picker, setPicker] = useState<PickerKind | null>(null);
  const [cardId, setCardId] = useState('c3');
  const [capId, setCapId] = useState('k2');
  const [cardConfirmed, setCardConfirmed] = useState(false);
  const [capConfirmed, setCapConfirmed] = useState(false);
  const [feeds, setFeeds] = useState<SelectedBbs[]>([]);

  // 从选择动态页返回后接收选中动态
  useFocusEffect(
    useCallback(() => {
      const result = getSelectBbsResult();
      if (result !== null) {
        setFeeds(result);
      }
    }, []),
  );

  const selectedCard = MOCK_CARDS.find(c => c.id === cardId);
  const selectedCap = MOCK_CAPS.find(c => c.id === capId);

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
          <ExpoImage source={require('@/assets/link/mock-avatar.png')} style={styles.identityAvatar} contentFit="cover" />
          <View style={styles.identityInfo}>
            <Text style={styles.identityName}>{MOCK_IDENTITY.company}</Text>
            {MOCK_IDENTITY.verified && (
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
          disabled={!desc.trim()}
          style={[styles.submitBtn, !desc.trim() && styles.submitBtnDisabled]}
          onPress={() => console.log('submit: 创建合作意向书')}
        >
          <Text style={styles.submitBtnText}>创建合作意向书</Text>
        </TouchableOpacity>
      </View>
      {/* 选择名片/能力卡弹层 */}
      <PickerSheet
        kind="card"
        visible={picker === 'card'}
        selectedId={cardId}
        onSelect={setCardId}
        onClose={() => setPicker(null)}
        onConfirm={() => {
          setCardConfirmed(true);
          setPicker(null);
        }}
      />
      <PickerSheet
        kind="cap"
        visible={picker === 'cap'}
        selectedId={capId}
        onSelect={setCapId}
        onClose={() => setPicker(null)}
        onConfirm={() => {
          setCapConfirmed(true);
          setPicker(null);
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
