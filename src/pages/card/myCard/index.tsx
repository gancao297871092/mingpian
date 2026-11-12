import React, { useCallback, useLayoutEffect, useRef, useState } from 'react';
import {
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { AppAlert } from '@/components/AppAlert';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import SafeView from '@/components/SafeView';
import EmptyState from '@/components/EmptyState';
import PersonalCard from '@/components/cards/PersonalCard';
import CompanyCard from '@/components/cards/CompanyCard';
import CardShareSheet from '@/components/cards/CardShareSheet';
import { normalizeCardStyle, type CardData } from '@/components/cards/types';
import { API } from '@/api';
import { scaleSizeW, setSpText } from '@/utils/screenUtils';
import type { RootStackParamList } from '@/route/map';
import { CardCheckIcon, CardDeleteIcon, CardEditIcon, CardShareIcon, TriangleDownIcon } from './icons';

type Nav = NativeStackNavigationProp<RootStackParamList>;
type TabKey = 'personal' | 'company';

const TABS: { key: TabKey; label: string }[] = [
  { key: 'personal', label: '个人名片' },
  { key: 'company', label: '企业名片' },
];

/** 头部标题：个人名片/企业名片 切换（figma 二选一，1025:4588） */
function HeaderTabs({ active, onChange }: { active: TabKey; onChange: (t: TabKey) => void }) {
  return (
    <View style={styles.headerTabs}>
      {TABS.map(t => (
        <TouchableOpacity key={t.key} activeOpacity={0.7} onPress={() => onChange(t.key)}>
          <View style={styles.headerTabItem}>
            <Text style={[styles.headerTabText, active === t.key ? styles.headerTabActive : styles.headerTabInactive]}>
              {t.label}
            </Text>
            <View style={[styles.headerTabIndicator, active === t.key && styles.headerTabIndicatorActive]} />
          </View>
        </TouchableOpacity>
      ))}
    </View>
  );
}

export default function MyCard() {
  const navigation = useNavigation<Nav>();
  const insets = useSafeAreaInsets();

  const [tab, setTab] = useState<TabKey>('personal');
  const [cards, setCards] = useState<CardData[]>([]);
  const [companyCard, setCompanyCard] = useState<CardData | null>(null);
  const [selectedId, setSelectedId] = useState<number | string | null>(null);
  const [selectorVisible, setSelectorVisible] = useState(false);
  const [pillLayout, setPillLayout] = useState({ x: 0, y: 0, w: 0, h: 0 });
  const [shareTarget, setShareTarget] = useState<TabKey>('personal');
  const [shareVisible, setShareVisible] = useState(false);
  const pillRef = useRef<View>(null);

  useLayoutEffect(() => {
    navigation.setOptions({
      headerTitle: () => <HeaderTabs active={tab} onChange={setTab} />,
    });
  }, [navigation, tab]);

  const loadCards = useCallback(async () => {
    try {
      const res = await API.card.list();
      if (res.code === '200') {
        const rawList: any[] = res.data?.cardsList || [];
        // card/list 含企业名片（isCp=1）：个人名片页只展示个人名片，企业名片单独取 isCp=1 项（对齐小程序字段）
        const list: CardData[] = rawList
          .filter((c: any) => !c.isCp)
          .map((c: any) => ({ ...c, id: c.cardId ?? c.id }));
        setCards(list);
        setSelectedId(prev => (list.some(c => c.id === prev) ? prev : (list[0]?.id ?? null)));
        const cp = rawList.find((c: any) => c.isCp);
        setCompanyCard(cp ? { ...cp, id: cp.cardId ?? cp.id } : null);
      }
    } catch {
      // ignore
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadCards();
    }, [loadCards]),
  );

  const currentCard = cards.find(c => c.id === selectedId) || null;

  const openSelector = () => {
    pillRef.current?.measureInWindow((x, y, w, h) => {
      setPillLayout({ x, y, w, h });
      setSelectorVisible(true);
    });
  };

  const onDelete = useCallback(() => {
    if (!currentCard?.id) return;
    AppAlert.alert('删除名片', '确定删除该名片吗？', [
      { text: '取消', style: 'cancel' },
      {
        text: '删除',
        style: 'destructive',
        onPress: async () => {
          try {
            const res = await API.card.del({ cardId: currentCard.id! });
            if (res.code === '200') loadCards();
          } catch {
            // ignore
          }
        },
      },
    ]);
  }, [currentCard, loadCards]);

  const onEdit = useCallback(() => {
    navigation.navigate('editCard', currentCard?.id ? { id: currentCard.id } : {});
  }, [navigation, currentCard]);

  const onSharePersonal = useCallback(() => {
    if (!currentCard?.id) return;
    setShareTarget('personal');
    setShareVisible(true);
  }, [currentCard]);

  const onShareCompany = useCallback(() => {
    setShareTarget('company');
    setShareVisible(true);
  }, []);

  const renderPersonal = () => {
    if (!currentCard) {
      return <EmptyState variant="content" title="暂无名片" description="点击下方按钮创建你的专属名片" style={styles.emptyState} />;
    }
    return (
      <>
        <View style={styles.pillRow}>
          <TouchableOpacity activeOpacity={0.8} onPress={openSelector}>
            <View ref={pillRef} style={styles.pill} collapsable={false}>
              <Text style={styles.pillText}>{currentCard.alias || `${currentCard.nameZh || ''}的名片`}</Text>
              <TriangleDownIcon />
            </View>
          </TouchableOpacity>
        </View>
        <TouchableOpacity
          style={styles.cardBox}
          activeOpacity={0.9}
          onPress={() => navigation.navigate('cardDetail', { id: currentCard.id! })}
        >
          <PersonalCard
            data={currentCard}
            style={normalizeCardStyle(currentCard.styleCode)}
            fontColor={currentCard.fontColor}
            backColor={currentCard.backColor}
          />
        </TouchableOpacity>
        <View style={styles.actionRow}>
          <TouchableOpacity activeOpacity={0.8} style={styles.actionBtn} onPress={onDelete}>
            <CardDeleteIcon />
            <Text style={styles.actionText}>删除</Text>
          </TouchableOpacity>
          <TouchableOpacity activeOpacity={0.8} style={styles.actionBtn} onPress={onEdit}>
            <CardEditIcon />
            <Text style={styles.actionText}>编辑</Text>
          </TouchableOpacity>
          <TouchableOpacity activeOpacity={0.8} style={styles.actionBtn} onPress={onSharePersonal}>
            <CardShareIcon />
            <Text style={styles.actionText}>分享</Text>
          </TouchableOpacity>
        </View>
      </>
    );
  };

  const renderCompany = () => {
    if (!companyCard) {
      return (
        <EmptyState
          variant="content"
          title="暂无企业名片"
          description="加入或创建企业后，自动生成企业名片"
          style={styles.emptyState}
        />
      );
    }
    return (
      <>
        <TouchableOpacity
          style={styles.companyCardBox}
          activeOpacity={0.9}
          onPress={() =>
            navigation.navigate('companyPage', { id: companyCard.cpId!, userId: companyCard.userId })
          }
        >
          <CompanyCard
            data={{
              cpId: companyCard.cpId,
              // 对齐小程序：名称优先 posterTitle，整图取 cardPoster
              cpName: companyCard.posterTitle || companyCard.cpName,
              poster: companyCard.cardPoster,
              countBrowse: companyCard.countBrowse,
              isAuth: companyCard.isAuth,
            }}
          />
        </TouchableOpacity>
        <TouchableOpacity activeOpacity={0.8} style={styles.companyShareBtn} onPress={onShareCompany}>
          <CardShareIcon />
          <Text style={styles.actionText}>分享</Text>
        </TouchableOpacity>
      </>
    );
  };

  return (
    <SafeView backgroundColor="#F6F7FB">
      <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {tab === 'personal' ? renderPersonal() : renderCompany()}
      </ScrollView>
      {tab === 'personal' && (
        <View style={[styles.footer, { paddingBottom: insets.bottom + scaleSizeW(12) }]}>
          <TouchableOpacity
            activeOpacity={0.8}
            style={styles.createBtn}
            onPress={() => navigation.navigate('editCard', {})}
          >
            <Text style={styles.createBtnText}>创建新名片 {cards.length}/5</Text>
          </TouchableOpacity>
        </View>
      )}

      <Modal visible={selectorVisible} transparent animationType="fade" onRequestClose={() => setSelectorVisible(false)}>
        <TouchableOpacity style={styles.modalMask} activeOpacity={1} onPress={() => setSelectorVisible(false)}>
          <View
            style={[
              styles.selectorBox,
              {
                top: pillLayout.y + pillLayout.h + scaleSizeW(6),
                left: pillLayout.x + pillLayout.w / 2 - scaleSizeW(100),
              },
            ]}
          >
            {cards.map(c => {
              const selected = c.id === selectedId;
              return (
                <TouchableOpacity
                  key={c.id}
                  activeOpacity={0.7}
                  style={styles.selectorItem}
                  onPress={() => {
                    setSelectedId(c.id ?? null);
                    setSelectorVisible(false);
                  }}
                >
                  <Text style={[styles.selectorText, selected && styles.selectorTextActive]} numberOfLines={1}>
                    {c.alias || `${c.nameZh || ''}的名片`}
                  </Text>
                  {selected && <CardCheckIcon />}
                </TouchableOpacity>
              );
            })}
          </View>
        </TouchableOpacity>
      </Modal>

      <CardShareSheet
        visible={shareVisible}
        onClose={() => setShareVisible(false)}
        card={shareTarget === 'personal' ? currentCard : undefined}
        company={
          shareTarget === 'company'
            ? {
                cpId: companyCard?.cpId,
                cpName: companyCard?.posterTitle || companyCard?.cpName,
                poster: companyCard?.cardPoster,
                sunCode: companyCard?.sunCode,
                isAuth: companyCard?.isAuth,
              }
            : undefined
        }
      />
    </SafeView>
  );
}

const styles = StyleSheet.create({
  headerTabs: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: scaleSizeW(34),
  },
  headerTabItem: {
    alignItems: 'center',
  },
  headerTabText: {
    fontSize: setSpText(17),
    letterSpacing: -0.4,
  },
  headerTabActive: {
    fontWeight: '500',
    color: '#000000',
  },
  headerTabInactive: {
    fontWeight: '400',
    color: '#6C6C6C',
  },
  headerTabIndicator: {
    width: scaleSizeW(24),
    height: scaleSizeW(2),
    borderRadius: scaleSizeW(90),
    backgroundColor: 'transparent',
    marginTop: scaleSizeW(4),
  },
  headerTabIndicatorActive: {
    backgroundColor: '#2962D4',
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: scaleSizeW(16),
    paddingTop: scaleSizeW(20),
    paddingBottom: scaleSizeW(24),
  },
  pillRow: {
    alignItems: 'center',
    marginBottom: scaleSizeW(20),
  },
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: scaleSizeW(10),
    width: scaleSizeW(200),
    paddingVertical: scaleSizeW(8),
    paddingHorizontal: scaleSizeW(10),
    backgroundColor: '#FFFFFF',
    borderRadius: scaleSizeW(90),
  },
  pillText: {
    fontSize: setSpText(15),
    fontWeight: '500',
    color: '#000000',
    letterSpacing: -0.4,
  },
  emptyState: {
    paddingVertical: scaleSizeW(80),
  },
  cardBox: {
    width: '100%',
  },
  actionRow: {
    flexDirection: 'row',
    gap: scaleSizeW(11),
    marginTop: scaleSizeW(10),
  },
  actionBtn: {
    flex: 1,
    height: scaleSizeW(50),
    borderRadius: scaleSizeW(10),
    backgroundColor: '#FFFFFF',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: scaleSizeW(5),
  },
  actionText: {
    fontSize: setSpText(14),
    fontWeight: '400',
    color: '#6C6C6C',
    letterSpacing: -0.4,
  },
  companyCardBox: {
    width: '100%',
  },
  companyShareBtn: {
    height: scaleSizeW(50),
    borderRadius: scaleSizeW(10),
    backgroundColor: '#FFFFFF',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: scaleSizeW(5),
    marginTop: scaleSizeW(10),
  },
  footer: {
    paddingHorizontal: scaleSizeW(16),
    paddingTop: scaleSizeW(12),
    backgroundColor: '#F6F7FB',
  },
  createBtn: {
    height: scaleSizeW(48),
    borderRadius: scaleSizeW(24),
    backgroundColor: '#2962D4',
    alignItems: 'center',
    justifyContent: 'center',
  },
  createBtnText: {
    fontSize: setSpText(15),
    fontWeight: '500',
    color: '#FFFFFF',
    letterSpacing: -0.4,
  },
  modalMask: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.2)',
  },
  selectorBox: {
    position: 'absolute',
    width: scaleSizeW(200),
    backgroundColor: '#FFFFFF',
    borderRadius: scaleSizeW(10),
    paddingVertical: scaleSizeW(14),
    paddingLeft: scaleSizeW(14),
    paddingRight: scaleSizeW(14),
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 10,
    elevation: 6,
  },
  selectorItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: scaleSizeW(10),
    gap: scaleSizeW(8),
  },
  selectorText: {
    fontSize: setSpText(14),
    fontWeight: '400',
    color: '#000000',
    flexShrink: 1,
  },
  selectorTextActive: {
    color: '#2962D4',
  },
});
