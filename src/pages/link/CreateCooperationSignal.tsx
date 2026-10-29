import React, { useCallback, useState } from 'react';
import {
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { useFocusEffect, useNavigation, useRoute, type RouteProp } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import SafeView from '@/components/SafeView';
import { API } from '@/api';
import { useUserStore } from '@/store/user';
import { scaleSizeH, scaleSizeW, setSpText } from '@/utils/screenUtils';
import type { RootStackParamList } from '@/route/map';
import { parseAbilityContent, takePendingIntentDraft, type SignalIntentDraft } from './signalDraft';
import { ChevronRightIcon, InfoIcon } from './icons';

const PRIMARY = '#2962D4';
const TEXT_SUB = '#6C6C6C';

/** 51.创建合作信号（figma 2793:6959，分组10最新稿；route.params.id 存在时为编辑模式，标题由路由配置切换） */
export default function CreateCooperationSignal() {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const { params } = useRoute<RouteProp<RootStackParamList, 'createCooperationSignal'>>();
  const editId = params?.id;
  const companyName = useUserStore(s => s.userInfo?.cpName ?? s.userInfo?.wqUser?.cpName ?? '');
  const [demand, setDemand] = useState('');
  const [intent, setIntent] = useState<SignalIntentDraft | null>(null);
  const [loaded, setLoaded] = useState(false);

  /** 编辑模式回显；同时接收「创建合作意向书」返回的草稿 */
  useFocusEffect(
    useCallback(() => {
      const draft = takePendingIntentDraft();
      if (draft) setIntent(draft);
      if (!editId) {
        setLoaded(true);
        return;
      }
      let alive = true;
      (async () => {
        try {
          const res = await API.signal.detail({ signalId: editId });
          const signal = res.data.signal;
          if (!alive || !signal) return;
          setDemand(prev => prev || signal.targetDesc || '');
          if (!draft) setIntent(parseAbilityContent(signal.abilityContent));
        } catch {
          // 拦截器已提示错误
        } finally {
          if (alive) setLoaded(true);
        }
      })();
      return () => {
        alive = false;
      };
    }, [editId]),
  );

  const intentCreated = !!intent?.note?.trim();
  const canPreview = !!demand.trim();

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
            本次信号将以[{companyName || '本企业'}]名义发出，由你负责后续跟进；同事可在企业管理「企业合作池」查看被触达的企业。
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
            maxLength={512}
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
              onPress={() => navigation.navigate('fillGuide')}
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
          onPress={() => navigation.navigate('createCooperationIntent', { draft: true, intent: intent ?? undefined })}
        >
          <Text style={[styles.intentState, intentCreated && styles.intentStateDone]}>
            {intentCreated ? '已创建' : '未创建'}
          </Text>
          <View style={styles.intentLink}>
            <Text style={styles.intentLinkText}>{intentCreated ? '查看/编辑' : '立即创建'}</Text>
            <ChevronRightIcon size={12} color={PRIMARY} />
          </View>
        </TouchableOpacity>
      </ScrollView>

      {/* 底部按钮：无内容时禁用（30% 透明） */}
      <View style={[styles.footer, { paddingBottom: Math.max(insets.bottom, scaleSizeH(20)) }]}>
        <TouchableOpacity
          activeOpacity={0.85}
          disabled={!canPreview || !loaded}
          style={[styles.submitBtn, (!canPreview || !loaded) && styles.submitBtnDisabled]}
          onPress={() =>
            navigation.navigate('cooperationSignalPreview', {
              id: editId,
              targetDesc: demand.trim(),
              intent: intent ?? undefined,
            })
          }
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
    backgroundColor: PRIMARY
  },
  input: {
    backgroundColor: '#FFFFFF',
    minHeight: scaleSizeH(107),
    paddingHorizontal: scaleSizeW(14),
    paddingTop: scaleSizeH(17),
    paddingBottom: scaleSizeH(10),
    fontSize: setSpText(14),
    lineHeight: setSpText(20),
    color: '#000000',
    textAlignVertical: 'top',
    borderBottomLeftRadius: scaleSizeH(10), 
    borderBottomRightRadius: scaleSizeH(10), 
  },
  inputFooter: {
    height: scaleSizeH(47),
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
  intentStateDone: {
    color: '#000000',
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
