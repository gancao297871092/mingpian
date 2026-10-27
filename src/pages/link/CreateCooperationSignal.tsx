import React, { useState } from 'react';
import {
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import SafeView from '@/components/SafeView';
import { scaleSizeH, scaleSizeW, setSpText } from '@/utils/screenUtils';
import type { RootStackParamList } from '@/route/map';
import { ChevronRightIcon, InfoIcon } from './icons';

const PRIMARY = '#2962D4';
const TEXT_SUB = '#6C6C6C';

/** 静态 mock（接口待联调）：信号发出主体企业名 */
const MOCK_COMPANY_NAME = '深圳联诚采信科技有限公司';

/** 51.创建合作信号（figma 2793:6959，分组10最新稿） */
export default function CreateCooperationSignal() {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const [demand, setDemand] = useState('');

  return (
    <SafeView backgroundColor="#F6F7FB">
      <ScrollView
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={styles.content}
      >
        {/* 名义提示 */}
        <View style={styles.notice}>
          <InfoIcon />
          <Text style={styles.noticeText}>
            本次信号将以[{MOCK_COMPANY_NAME}]名义发出，由你负责后续跟进；同事可在企业管理「企业合作池」查看被触达的企业。
          </Text>
        </View>

        {/* 你想连接哪类用户 */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>你想连接哪类用户？</Text>
          <Text style={styles.sectionSub}>描述你想连接的行业、产品或应用场景。</Text>
        </View>
        <View style={styles.inputCard}>
          <TextInput
            style={styles.input}
            multiline
            placeholder="例如：帮我连接华东的编织袋生产企业..."
            placeholderTextColor="#999999"
            value={demand}
            onChangeText={setDemand}
          />
          <View style={styles.inputFooter}>
            <Text style={styles.inputFooterText}>填写越具体，匹配越准</Text>
            <TouchableOpacity
              activeOpacity={0.7}
              style={styles.inputFooterLink}
              onPress={() => console.log('go: 填写说明')}
            >
              <Text style={styles.inputFooterText}>查看填写说明</Text>
              <ChevronRightIcon size={12} color="#FFFFFF" />
            </TouchableOpacity>
          </View>
        </View>

        {/* 合作意向书 */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>合作意向书</Text>
          <Text style={styles.sectionSub}>匹配到客户时自动发送</Text>
        </View>
        <TouchableOpacity
          activeOpacity={0.85}
          style={styles.intentCard}
          onPress={() => navigation.navigate('createCooperationIntent')}
        >
          <Text style={styles.intentState}>未创建</Text>
          <View style={styles.intentLink}>
            <Text style={styles.intentLinkText}>立即创建</Text>
            <ChevronRightIcon size={12} color={PRIMARY} />
          </View>
        </TouchableOpacity>
      </ScrollView>

      {/* 底部按钮：无内容时禁用（30% 透明） */}
      <View style={[styles.footer, { paddingBottom: Math.max(insets.bottom, scaleSizeH(20)) }]}>
        <TouchableOpacity
          activeOpacity={0.85}
          disabled={!demand.trim()}
          style={[styles.submitBtn, !demand.trim() && styles.submitBtnDisabled]}
          onPress={() => navigation.navigate('cooperationSignalPreview')}
        >
          <Text style={styles.submitBtnText}>预览合作信号</Text>
        </TouchableOpacity>
      </View>
    </SafeView>
  );
}

const styles = StyleSheet.create({
  content: {
    paddingHorizontal: scaleSizeW(16),
    paddingTop: scaleSizeH(30),
    paddingBottom: scaleSizeH(20),
  },
  notice: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: scaleSizeW(4),
    backgroundColor: '#E3EDFF',
    borderRadius: scaleSizeW(10),
    paddingHorizontal: scaleSizeW(12),
    paddingVertical: scaleSizeH(10),
  },
  noticeText: {
    flex: 1,
    fontSize: setSpText(12),
    lineHeight: setSpText(18),
    color: PRIMARY,
  },
  section: {
    marginTop: scaleSizeH(20),
    gap: scaleSizeH(5),
  },
  sectionTitle: {
    fontSize: setSpText(15),
    fontWeight: '500',
    color: '#000000',
  },
  sectionSub: {
    fontSize: setSpText(12),
    color: TEXT_SUB,
  },
  inputCard: {
    marginTop: scaleSizeH(13),
    borderRadius: scaleSizeW(10),
    overflow: 'hidden',
  },
  input: {
    backgroundColor: '#FFFFFF',
    minHeight: scaleSizeH(87),
    paddingHorizontal: scaleSizeW(14),
    paddingTop: scaleSizeH(17),
    paddingBottom: scaleSizeH(10),
    fontSize: setSpText(14),
    lineHeight: setSpText(20),
    color: '#000000',
    textAlignVertical: 'top',
  },
  inputFooter: {
    height: scaleSizeH(57),
    backgroundColor: PRIMARY,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: scaleSizeW(14),
  },
  inputFooterText: {
    fontSize: setSpText(12),
    color: '#FFFFFF',
  },
  inputFooterLink: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: scaleSizeW(5),
  },
  intentCard: {
    marginTop: scaleSizeH(13),
    height: scaleSizeH(55),
    backgroundColor: '#FFFFFF',
    borderRadius: scaleSizeW(10),
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: scaleSizeW(14),
  },
  intentState: {
    fontSize: setSpText(14),
    color: TEXT_SUB,
  },
  intentLink: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: scaleSizeW(4),
  },
  intentLinkText: {
    fontSize: setSpText(14),
    color: PRIMARY,
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
});
