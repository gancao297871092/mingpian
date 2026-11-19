import React from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import SafeView from '@/components/SafeView';
import { scaleSizeH, scaleSizeW, setSpText } from '@/utils/screenUtils';
import { DissolveTopIcon } from './settings/cancelIcons';
import type { RootStackParamList } from '@/route/map';

const RED = '#EF4444';

/** 解散影响说明（figma 分组11 解散企业页 4 条） */
const DISSOLVE_NOTES = [
  '企业主页、企业认证与企业资料将失效，无法再作为有效企业访问',
  '企业动态、能力卡、企业合作池等内容将下架或按规则清理',
  '动态、关系、名片及分享链等将删除、解除或失效',
  '解散不豁免企业解散前已产生的法律责任；未结纠纷时平台可中止解散',
];

/** 解散企业-重要提醒（figma 分组11「解散企业」3454:7514） */
export default function EnterpriseCancelWarning() {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();

  return (
    <SafeView backgroundColor="#FFFFFF">
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.content}>
        <View style={styles.topIcon}>
          <DissolveTopIcon size={70} />
        </View>
        <Text style={styles.title}>解散企业前请认真阅读</Text>
        <Text style={styles.subtitle}>企业解散后不可恢复，包括但不限于：</Text>
        {/* 解散影响说明卡 */}
        <View style={styles.noteCard}>
          {DISSOLVE_NOTES.map((note, i) => (
            <View key={i} style={[styles.noteRow, i > 0 && styles.noteRowGap]}>
              <View style={styles.noteDot} />
              <Text style={styles.noteText}>{note}</Text>
            </View>
          ))}
        </View>
        <TouchableOpacity
          style={styles.nextBtn}
          activeOpacity={0.85}
          onPress={() => navigation.navigate('enterpriseCancelVerify')}
        >
          <Text style={styles.nextBtnText}>下一步</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeView>
  );
}

const styles = StyleSheet.create({
  content: {
    paddingHorizontal: scaleSizeW(16),
    paddingTop: scaleSizeH(16),
    paddingBottom: scaleSizeH(40),
  },
  topIcon: {
    alignItems: 'center',
  },
  title: {
    marginTop: scaleSizeH(2),
    fontSize: setSpText(15),
    fontWeight: '500',
    color: '#000000',
    lineHeight: scaleSizeH(23),
    textAlign: 'center',
  },
  subtitle: {
    marginTop: scaleSizeH(5),
    fontSize: setSpText(14),
    color: '#6C6C6C',
    lineHeight: scaleSizeH(23),
    textAlign: 'center',
  },
  noteCard: {
    marginTop: scaleSizeH(20),
    backgroundColor: '#FAFAFA',
    borderRadius: scaleSizeW(10),
    padding: scaleSizeW(20),
  },
  noteRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  noteRowGap: {
    marginTop: scaleSizeH(30),
  },
  noteDot: {
    width: scaleSizeW(8),
    height: scaleSizeW(8),
    borderRadius: scaleSizeW(4),
    backgroundColor: '#D9D9D9',
  },
  noteText: {
    flex: 1,
    marginLeft: scaleSizeW(10),
    fontSize: setSpText(14),
    color: '#000000',
    lineHeight: scaleSizeH(20),
  },
  nextBtn: {
    marginTop: scaleSizeH(20),
    height: scaleSizeH(48),
    borderRadius: scaleSizeH(24),
    backgroundColor: RED,
    alignItems: 'center',
    justifyContent: 'center',
  },
  nextBtnText: {
    fontSize: setSpText(15),
    fontWeight: '500',
    color: '#FFFFFF',
  },
});
