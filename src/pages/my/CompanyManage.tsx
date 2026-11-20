import React, { useCallback, useRef, useState } from 'react';
import { Linking, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { AppAlert } from '@/components/AppAlert';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { BottomSheetModal } from '@gorhom/bottom-sheet';
import AppImage from '@/components/AppImage';
import Toast from 'react-native-toast-message';
import SafeView from '@/components/SafeView';
import AppBottomSheet from '@/components/AppBottomSheet';
import { scaleSizeH, scaleSizeW, setSpText } from '@/utils/screenUtils';
import type { RootStackParamList } from '@/route/map';
import { useCompanyStore } from '@/store/company';
import { useUserStore } from '@/store/user';
import { API } from '@/api';
import { SettingArrowIcon } from './settings/settingsIcons';
import {
  ButlerPhoneIcon,
  CompanyAuditIcon,
  CompanyBbsAuditIcon,
  CompanyButlerIcon,
  CompanyCapIcon,
  CompanyDissolveIcon,
  CompanyExitIcon,
  CompanyInfoIcon,
  CompanyJobIcon,
  CompanyManagerIcon,
  CompanyMemberIcon,
  CompanyPoolIcon,
} from './myIcons';

const DANGER = '#EF4444';
const ORANGE = '#F2722C';

interface RowItem {
  label: string;
  icon: React.ReactNode;
  danger?: boolean;
  badge?: number;
  tag?: string;
  /** tag 色调：orange=待审核类（默认），gray=已完成类（如已认证） */
  tagTone?: 'orange' | 'gray';
  /** 禁用点击并隐藏右侧箭头（如已完成实名认证） */
  disabled?: boolean;
  onPress: () => void;
}

/** 企业管家（/company/manager/getManager，对齐小程序 moreSets viewManager） */
interface Butler {
  id: number;
  realName?: string;
  mobile?: string;
  phone?: string;
  tel?: string;
  avatar?: string;
}

function ButlerSheet({ sheetRef, butlers }: { sheetRef: React.RefObject<BottomSheetModal | null>; butlers: Butler[] }) {
  return (
    <AppBottomSheet ref={sheetRef}>
      <Text style={styles.sheetTitle}>查看管家</Text>
      {butlers.length === 0 && <Text style={styles.butlerEmpty}>未设置管家</Text>}
      {butlers.map((b) => {
        const phone = b.mobile || b.phone || b.tel || '';
        return (
          <View key={b.id} style={styles.butlerCard}>
            <AppImage source={{ uri: b.avatar }} style={styles.butlerAvatar} contentFit="cover" transition={150} recyclingKey={b.avatar} />
            <View style={styles.butlerText}>
              <Text style={styles.butlerName}>{b.realName || ''}</Text>
              <Text style={styles.butlerPhone}>{phone || '未设置'}</Text>
            </View>
            {!!phone && (
              <TouchableOpacity
                activeOpacity={0.7}
                style={styles.butlerCall}
                onPress={() => Linking.openURL(`tel:${phone.replace(/[^\d+]/g, '')}`).catch(() => undefined)}
              >
                <ButlerPhoneIcon />
              </TouchableOpacity>
            )}
          </View>
        );
      })}
    </AppBottomSheet>
  );
}

/** 100.企业管理（按角色渲染：超管/管理员、普通成员、未加入企业） */
export default function CompanyManage() {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const memberAuditCount = useCompanyStore(s => s.memberAuditCount);
  const bbsAuditCount = useCompanyStore(s => s.bbsAuditCount);
  const poolCount = useCompanyStore(s => s.poolCount);
  const userInfo = useUserStore(s => s.userInfo);
  // 真实角色（对齐小程序 moreSets）：isManager=管理端；cpId 且非管理员=普通成员；无 cpId=未加入企业
  const role: 'admin' | 'member' | 'none' = !userInfo?.cpId ? 'none' : userInfo?.isManager === 1 ? 'admin' : 'member';
  /** 企业超管（解散企业/移交权限等超管专属操作入口） */
  const isSuper = userInfo?.isMaster === 1;
  /** 已完成实名认证（authStatus=1，对齐小程序 moreSets） */
  const realAuthed = userInfo?.wqUser?.authStatus === 1;
  /** 解散状态（0正常 1冷静期 2已解散；/company/dissolve/status，进入页面时拉取） */
  const [dissolveStatus, setDissolveStatus] = useState(0);
  const butlerRef = useRef<BottomSheetModal>(null);
  const [butlers, setButlers] = useState<Butler[]>([]);
  /** 加入企业申请待审核标识（/company/manager/tips 的 userAuth，对齐小程序 moreSets「待审核」角标） */
  const [joinAuthPending, setJoinAuthPending] = useState(false);

  // 每次进入刷新用户信息（移交超管/退出企业等操作后角色需同步）与审核角标（对齐小程序 getTips）
  useFocusEffect(
    useCallback(() => {
      API.user
        .info()
        .then((r) => r.data && useUserStore.getState().setUserInfo(r.data))
        .catch(() => {});
      API.company
        .managerTips()
        .then((r) => {
          if (r.code === '200' && r.data) {
            useCompanyStore.getState().setMemberAuditCount(r.data.companyUserAuthCount ?? 0);
            useCompanyStore.getState().setBbsAuditCount(r.data.bbsCount ?? 0);
            useCompanyStore.getState().setPoolCount(r.data.companyWorkCount ?? 0);
            setJoinAuthPending(!!r.data.userAuth);
          }
        })
        .catch(() => {});
      // 解散状态（冷静期态数据源；接口内会惰性处理冷静期到期）
      API.company
        .dissolveStatus()
        .then((r) => {
          if (r.code === '200' && r.data) {
            setDissolveStatus(r.data.dissolveStatus ?? 0);
          }
        })
        .catch(() => {});
    }, []),
  );

  /** 查看管家：拉取后展开弹层（对齐小程序 viewManager） */
  const onViewButler = async () => {
    try {
      const res = await API.company.managerGet();
      if (res.code === '200') {
        setButlers(res.data || []);
        butlerRef.current?.present();
      }
    } catch {
      // ignore
    }
  };

  /**
   * 创建/加入企业前置校验：未实名（authStatus≠1）弹窗引导去认证，返回 true 表示已拦截。
   * 对齐设计稿批注②文案（小程序 onTipsAuthRealCard 同款交互，文案后续由小程序对齐）
   */
  const blockIfNotRealAuthed = () => {
    if (realAuthed) return false;
    AppAlert.alert('提示', '创建或加入企业前请先完成实名认证', [
      { text: '取消', style: 'cancel' },
      { text: '去认证', onPress: () => navigation.navigate('companyRealName') },
    ]);
    return true;
  };

  /** 退出企业（对齐小程序 exitCp）：超管需先移交，普通成员确认后调 /company/user/liveOut */
  const onExit = () => {
    if (userInfo?.isMaster === 1) {
      AppAlert.alert('提示', '请先移交管理员权限，再退出企业', [
        { text: '取消', style: 'cancel' },
        { text: '去移交', onPress: () => navigation.navigate('companyMembers') },
      ]);
      return;
    }
    AppAlert.alert('提示', '确认退出企业吗？', [
      { text: '取消', style: 'cancel' },
      {
        text: '退出',
        style: 'destructive',
        onPress: async () => {
          try {
            const res = await API.company.liveOut();
            if (res.code !== '200') return;
            Toast.show({ type: 'success', text1: '已退出企业！' });
            // 刷新用户信息（cpId/isManager 等失效，角色随之变为未加入企业）
            API.user
              .info()
              .then((r) => r.data && useUserStore.getState().setUserInfo(r.data))
              .catch(() => {});
          } catch {
            Toast.show({ type: 'error', text1: '操作失败' });
          }
        },
      },
    ]);
  };

  /** 撤销解散申请（/company/dissolve/revoke：冷静期内清空冷静期标记） */
  const onRevokeDissolve = async () => {
    try {
      const res = await API.company.dissolveRevoke();
      if (res.code !== '200') return;
      setDissolveStatus(0);
      Toast.show({ type: 'success', text1: '已撤销解散申请' });
    } catch {
      // 非 200（不在解散流程等）由 request 拦截器统一弹错
    }
  };

  /** 强制直接解散（/company/dissolve/force：跳过冷静期立即生效，成功后刷新用户身份并返回） */
  const onForceDissolve = () => {
    AppAlert.alert('提示', '确认现在就解散吗？', [
      {
        text: '确认解散',
        style: 'destructive',
        onPress: async () => {
          try {
            const res = await API.company.dissolveForce();
            if (res.code !== '200') return;
            Toast.show({ type: 'success', text1: '企业已解散' });
            // 解散生效：cpId/isMaster 等失效，刷新用户信息后返回「我的」
            API.user
              .info()
              .then((r) => r.data && useUserStore.getState().setUserInfo(r.data))
              .catch(() => {});
            navigation.goBack();
          } catch {
            // 非 200 由 request 拦截器统一弹错
          }
        },
      },
      { text: '取消', style: 'cancel' },
    ]);
  };

  const groups: { title: string; rows: RowItem[] }[] =
    role === 'admin'
      ? [
          {
            title: '企业',
            rows: [
              { label: '企业信息', icon: <CompanyInfoIcon />, onPress: () => navigation.navigate('companyInfo') },
              { label: '成员管理', icon: <CompanyMemberIcon />, onPress: () => navigation.navigate('companyMembers') },
            ],
          },
          {
            title: '审核',
            rows: [
              {
                label: '成员审核',
                icon: <CompanyAuditIcon />,
                badge: memberAuditCount,
                onPress: () => navigation.navigate('companyMemberAudit'),
              },
              { label: '动态审核', icon: <CompanyBbsAuditIcon />, badge: bbsAuditCount, onPress: () => navigation.navigate('companyBbsAudit') },
            ],
          },
          {
            title: '合作',
            rows: [
              {
                label: '企业合作池',
                icon: <CompanyPoolIcon />,
                badge: poolCount,
                onPress: () => navigation.navigate('myOpportunities', { tab: 'pool' }),
              },
            ],
          },
          {
            title: '其他',
            rows: [
              { label: '能力卡管理', icon: <CompanyCapIcon />, onPress: () => navigation.navigate('companyCapCards') },
              { label: '查看管家', icon: <CompanyButlerIcon />, onPress: onViewButler },
            ],
          },
        ]
      : role === 'member'
        ? [
            {
              title: '我的企业',
              rows: [
                {
                  label: '职位变更',
                  icon: <CompanyJobIcon />,
                  onPress: () =>
                    navigation.navigate('companyApply', {
                      cpId: userInfo?.cpId ?? '',
                      type: '2',
                      position: userInfo?.position ?? '',
                    }),
                },
                {
                  label: '企业合作池',
                  icon: <CompanyPoolIcon />,
                  badge: poolCount,
                  onPress: () => navigation.navigate('myOpportunities', { tab: 'pool' }),
                },
              ],
            },
          ]
        : [
            {
              title: '企业认证',
              rows: [
                {
                  label: '创建企业',
                  icon: <CompanyInfoIcon />,
                  onPress: () => {
                    if (blockIfNotRealAuthed()) return;
                    navigation.navigate('companyCert');
                  },
                },
                {
                  label: '加入企业',
                  icon: <CompanyManagerIcon />,
                  tag: joinAuthPending ? '待审核' : undefined,
                  onPress: () => {
                    if (blockIfNotRealAuthed()) return;
                    navigation.navigate('companyJoin');
                  },
                },
              ],
            },
          ];

  const extraRows: RowItem[] =
    role === 'none'
      ? [
          {
            label: '实名认证',
            icon: <CompanyAuditIcon />,
            // 已实名：展示「已认证」标识，隐藏箭头且不可再进入认证页
            tag: realAuthed ? '已认证' : undefined,
            tagTone: 'gray',
            disabled: realAuthed,
            onPress: () => {
              if (realAuthed) return;
              navigation.navigate('companyRealName');
            },
          },
        ]
      : [];

  const renderRow = (row: RowItem) => (
    <TouchableOpacity activeOpacity={0.7} style={styles.row} onPress={row.onPress} disabled={row.disabled}>
      {row.icon}
      <Text style={[styles.rowLabel, row.danger && styles.rowLabelDanger]}>{row.label}</Text>
      <View style={styles.rowRight}>
        {!!row.badge && row.badge > 0 && (
          <View style={styles.badge}>
            <Text style={styles.badgeText}>{row.badge}</Text>
          </View>
        )}
        {!!row.tag && (
          <View style={[styles.tag, row.tagTone === 'gray' && styles.tagGray]}>
            <Text style={[styles.tagText, row.tagTone === 'gray' && styles.tagGrayText]}>{row.tag}</Text>
          </View>
        )}
        {!row.disabled && <SettingArrowIcon />}
      </View>
    </TouchableOpacity>
  );

  return (
    <SafeView backgroundColor="#F6F7FB">
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.content}>
        {groups.map(g => (
          <View key={g.title}>
            <Text style={styles.groupTitle}>{g.title}</Text>
            <View style={styles.card}>
              {g.rows.map((row, i) => (
                <React.Fragment key={row.label}>
                  {i > 0 && <View style={styles.divider} />}
                  {renderRow(row)}
                </React.Fragment>
              ))}
            </View>
          </View>
        ))}
        {extraRows.length > 0 && (
          <View style={[styles.card, styles.standaloneCard]}>{extraRows.map(renderRow)}</View>
        )}
        {role !== 'none' && (
          isSuper && dissolveStatus === 1 ? (
            <>
              {/* 解散冷静期（figma 分组11 3454:7621）：退出企业 / 撤销解散 + 强制直接解散 */}
              <View style={[styles.card, styles.standaloneCard]}>
                {renderRow({ label: '退出企业', icon: <CompanyExitIcon color={DANGER} />, danger: true, onPress: onExit })}
              </View>
              <View style={[styles.card, styles.standaloneCard]}>
                {renderRow({ label: '撤销解散', icon: <CompanyDissolveIcon />, danger: true, onPress: onRevokeDissolve })}
                <View style={styles.divider} />
                {renderRow({ label: '强制直接解散', icon: <CompanyDissolveIcon />, danger: true, onPress: onForceDissolve })}
              </View>
            </>
          ) : isSuper ? (
            /* 超管常态（figma 分组11 3454:7406）：退出企业 + 解散企业 */
            <View style={[styles.card, styles.standaloneCard]}>
              {renderRow({ label: '退出企业', icon: <CompanyExitIcon color={DANGER} />, danger: true, onPress: onExit })}
              <View style={styles.divider} />
              {renderRow({
                label: '解散企业',
                icon: <CompanyDissolveIcon />,
                danger: true,
                onPress: () => navigation.navigate('enterpriseCancelWarning'),
              })}
            </View>
          ) : (
            <View style={[styles.card, styles.standaloneCard]}>
              {renderRow({ label: '退出企业', icon: <CompanyExitIcon color={DANGER} />, danger: true, onPress: onExit })}
            </View>
          )
        )}
      </ScrollView>
      <ButlerSheet sheetRef={butlerRef} butlers={butlers} />
    </SafeView>
  );
}

const styles = StyleSheet.create({
  content: {
    padding: scaleSizeW(16),
    paddingBottom: scaleSizeH(40),
  },
  groupTitle: {
    fontSize: setSpText(12),
    lineHeight: setSpText(14),
    color: '#6C6C6C',
    marginTop: scaleSizeH(14),
    marginBottom: scaleSizeH(10),
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: scaleSizeW(10),
    overflow: 'hidden',
  },
  standaloneCard: {
    marginTop: scaleSizeH(14),
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: scaleSizeW(10),
    paddingHorizontal: scaleSizeW(16),
    height: scaleSizeH(55),
  },
  rowLabel: {
    fontSize: setSpText(14),
    lineHeight: setSpText(14),
    color: '#000000',
  },
  rowLabelDanger: {
    color: DANGER,
  },
  badge: {
    height: scaleSizeH(14),
    minWidth: scaleSizeW(14),
    paddingHorizontal: scaleSizeW(5),
    borderRadius: scaleSizeW(90),
    backgroundColor: DANGER,
    alignItems: 'center',
    justifyContent: 'center',
  },
  badgeText: {
    fontSize: setSpText(10),
    fontWeight: '600',
    lineHeight: setSpText(12),
    color: '#FFFFFF',
  },
  tag: {
    height: scaleSizeH(26),
    paddingHorizontal: scaleSizeW(10),
    borderRadius: scaleSizeW(90),
    backgroundColor: ORANGE,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tagText: {
    fontSize: setSpText(12),
    fontWeight: '600',
    lineHeight: setSpText(14),
    color: '#FFFFFF',
  },
  // 已完成类标识（如已认证）：灰底灰字
  tagGray: {
    backgroundColor: '#F5F5F5',
  },
  tagGrayText: {
    color: '#999999',
  },
  rowRight: {
    marginLeft: 'auto',
    flexDirection: 'row',
    alignItems: 'center',
    gap: scaleSizeW(12),
  },
  divider: {
    height: 1,
    backgroundColor: '#EDECEC',
    marginLeft: scaleSizeW(46),
  },
  sheetTitle: {
    fontSize: setSpText(17),
    fontWeight: '500',
    lineHeight: setSpText(20),
    color: '#000000',
    textAlign: 'center',
    marginTop: scaleSizeH(4),
    marginBottom: scaleSizeH(16),
  },
  butlerCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: scaleSizeW(10),
    padding: scaleSizeW(14),
    marginBottom: scaleSizeH(10),
  },
  butlerEmpty: {
    fontSize: setSpText(13),
    lineHeight: setSpText(18),
    color: '#BBBBBB',
    textAlign: 'center',
    paddingVertical: scaleSizeH(20),
  },
  butlerAvatar: {
    width: scaleSizeW(48),
    height: scaleSizeW(48),
    borderRadius: scaleSizeW(24),
    borderWidth: 1,
    borderColor: '#D9D9D9',
    backgroundColor: '#F5F5F5',
  },
  butlerText: {
    marginLeft: scaleSizeW(10),
    gap: scaleSizeH(10),
  },
  butlerName: {
    fontSize: setSpText(14),
    fontWeight: '500',
    lineHeight: setSpText(14),
    color: '#000000',
  },
  butlerPhone: {
    fontSize: setSpText(14),
    fontWeight: '500',
    lineHeight: setSpText(14),
    color: '#000000',
  },
  butlerCall: {
    marginLeft: 'auto',
    padding: scaleSizeW(6),
  },
});
