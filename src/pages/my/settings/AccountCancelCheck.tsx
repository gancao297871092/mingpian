import React from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { useRoute } from '@react-navigation/native';
import type { RouteProp } from '@react-navigation/native';
import SafeView from '@/components/SafeView';
import { scaleSizeH, scaleSizeW, setSpText } from '@/utils/screenUtils';
import { CancelFailIcon, CancelTopIcon } from './cancelIcons';
import type { RootStackParamList } from '@/route/map';

const RED = '#EF4444';
const GRAY = '#6C6C6C';

interface CheckItem {
  /** 对应 cancel/check 返回的字段，0=未通过时展示该卡 */
  key: 'punishPassed' | 'superAdminPassed' | 'onlyMemberPassed';
  /** 条件名（通过时显示的描述） */
  condition: string;
  /** 未通过原因 */
  problem: string;
  /** 处理措施（每行一条） */
  actions: string[];
}

/** 三项检测与 figma 分组11「注销条件检测」3465:6854 三张卡一一对应 */
const CHECK_ITEMS: CheckItem[] = [
  {
    key: 'punishPassed',
    condition: '账号状态正常',
    problem: '账号存在处罚限制',
    actions: ['  - 等待处罚解除'],
  },
  {
    key: 'superAdminPassed',
    condition: '非企业超级管理员',
    problem: '当前为企业超级管理员',
    actions: ['  - 先移交企业超级管理员权限后，再注销帐号', '  - 或先解散企业（企业管理 → 解散企业）'],
  },
  {
    key: 'onlyMemberPassed',
    condition: '非企业唯一人员',
    problem: '你是企业内唯一人员，暂不可注销',
    actions: ['  - 请先解散企业'],
  },
];

/** 注销条件检测-存在未通过项（figma 分组11「注销条件检测」3465:6854；由 cancel/check 结果驱动） */
export default function AccountCancelCheck() {
  const route = useRoute<RouteProp<RootStackParamList, 'accountCancelCheck'>>();
  const params = route.params;
  // 无参数（直进页面兜底）时展示全部三项；有参数时只展示 passed=0 的项
  const failedItems = CHECK_ITEMS.filter(item => !params || params[item.key] === 0);

  return (
    <SafeView backgroundColor="#FFFFFF">
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.content}>
        <View style={styles.topIcon}>
          <CancelTopIcon size={70} />
        </View>
        <Text style={styles.title}>存在未通过项，暂无法注销</Text>
        <Text style={styles.subtitle}>请处理以后再注销帐号</Text>

        <Text style={styles.sectionTitle}>需处理的问题</Text>
        {failedItems.map((item, i) => (
          <View key={item.key} style={[styles.card, i > 0 && styles.cardGap]}>
            <View style={styles.cardHeader}>
              <View style={styles.cardHeaderIcon}>
                <CancelFailIcon size={16} />
              </View>
              <View style={styles.cardHeaderTexts}>
                <Text style={styles.conditionText}>{item.condition}</Text>
                <Text style={styles.problemText}>{item.problem}</Text>
              </View>
            </View>
            <View style={styles.actionCard}>
              <Text style={styles.actionTitle}>处理措施</Text>
              {item.actions.map((action, j) => (
                <Text key={j} style={styles.actionText}>
                  {action}
                </Text>
              ))}
            </View>
          </View>
        ))}
      </ScrollView>
    </SafeView>
  );
}

const styles = StyleSheet.create({
  content: {
    paddingBottom: scaleSizeH(40),
  },
  topIcon: {
    alignItems: 'center',
    marginTop: scaleSizeH(15),
  },
  title: {
    marginTop: scaleSizeH(3),
    fontSize: setSpText(15),
    fontWeight: '500',
    color: '#000000',
    lineHeight: scaleSizeH(23),
    textAlign: 'center',
  },
  subtitle: {
    marginTop: scaleSizeH(5),
    fontSize: setSpText(14),
    color: GRAY,
    lineHeight: scaleSizeH(23),
    textAlign: 'center',
  },
  sectionTitle: {
    marginTop: scaleSizeH(24),
    marginBottom: scaleSizeH(10),
    marginLeft: scaleSizeW(22),
    fontSize: setSpText(12),
    color: GRAY,
    lineHeight: scaleSizeH(23),
  },
  card: {
    marginHorizontal: scaleSizeW(16),
    backgroundColor: '#FAFAFA',
    borderRadius: scaleSizeW(10),
    padding: scaleSizeW(14),
  },
  cardGap: {
    marginTop: scaleSizeH(10),
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  cardHeaderIcon: {
    marginTop: scaleSizeH(4),
  },
  cardHeaderTexts: {
    flex: 1,
    marginLeft: scaleSizeW(7),
  },
  conditionText: {
    fontSize: setSpText(14),
    color: '#000000',
    lineHeight: scaleSizeH(23),
  },
  problemText: {
    fontSize: setSpText(14),
    color: RED,
    lineHeight: scaleSizeH(23),
  },
  actionCard: {
    marginTop: scaleSizeH(10),
    backgroundColor: '#FFFFFF',
    borderRadius: scaleSizeW(10),
    padding: scaleSizeW(10),
  },
  actionTitle: {
    fontSize: setSpText(12),
    color: GRAY,
  },
  actionText: {
    marginTop: scaleSizeH(10),
    fontSize: setSpText(14),
    color: '#000000',
    lineHeight: scaleSizeH(23),
  },
});
