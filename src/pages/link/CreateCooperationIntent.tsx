import React, { useState } from 'react';
import {
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
import { ChevronRightIcon, VerifiedBadgeIcon } from './icons';

const PRIMARY = '#2962D4';
const TEXT_SUB = '#6C6C6C';

/** 静态 mock（接口待联调）：展示身份企业信息 */
const MOCK_IDENTITY = { company: '深圳联诚采信科技有限公司', verified: true };

/** 40.创建合作意向书-未填写（figma 251:1945；已填写态 262:2127） */
export default function CreateCooperationIntent() {
  const insets = useSafeAreaInsets();
  const [desc, setDesc] = useState('');

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
          style={[styles.rowCard, styles.rowCardOverlap]}
          onPress={() => console.log('go: select-contact')}
        >
          <Text style={styles.rowCardText}>个人名片</Text>
          <View style={styles.rowCardRight}>
            <Text style={styles.rowCardLink}>选择本次对接人</Text>
            <ChevronRightIcon size={12} color={PRIMARY} />
          </View>
        </TouchableOpacity>

        {/* 选择能力卡 */}
        <Text style={[styles.label, styles.labelGap]}>选择能力卡</Text>
        <TouchableOpacity
          activeOpacity={0.85}
          style={styles.rowCard}
          onPress={() => console.log('go: select-cap-card')}
        >
          <Text style={styles.rowCardText}>能力卡</Text>
          <View style={styles.rowCardRight}>
            <Text style={styles.rowCardLink}>请选择</Text>
            <ChevronRightIcon size={12} color={PRIMARY} />
          </View>
        </TouchableOpacity>

        {/* 关联动态 */}
        <View style={styles.labelRow}>
          <Text style={styles.label}>关联动态</Text>
          <Text style={styles.labelOptional}>选填</Text>
        </View>
        <TouchableOpacity
          activeOpacity={0.85}
          style={styles.bbsCard}
          onPress={() => console.log('go: select-bbs')}
        >
          <View style={styles.bbsCardInfo}>
            <Text style={styles.rowCardText}>选择动态</Text>
            <Text style={styles.bbsCardSub}>可关联案例、产业机会或日常动态</Text>
          </View>
          <ChevronRightIcon size={14} color={TEXT_SUB} />
        </TouchableOpacity>
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
    borderBottomLeftRadius: scaleSizeW(10),
    borderBottomRightRadius: scaleSizeW(10),
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
