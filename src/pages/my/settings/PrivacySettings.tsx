import React from 'react';
import { ScrollView, StyleSheet, Switch, Text, View } from 'react-native';
import SafeView from '@/components/SafeView';
import { API } from '@/api';
import { useSettingStore } from '@/store/setting';
import { scaleSizeH, scaleSizeW, setSpText } from '@/utils/screenUtils';
import { BLUE, SectionTitle, SettingCard, SettingDivider, SettingRow } from './components';
import { AiConnectIcon, AiInfoIcon } from './subIcons';

type PrivacyKey = 'publicBbs' | 'publicLike' | 'publicFavorite' | 'publicFollow' | 'publicFans' | 'aiConnect' | 'analyzeBbs' | 'recommendCompany';

/** 80/81.隐私与权限 */
export default function PrivacySettings() {
  const store = useSettingStore();

  const onChange = (key: PrivacyKey, v: boolean) => {
    store.setValue(key, v);
    API.setting.preferenceSave({ [key]: v }).catch(() => {
      // TODO 联调后处理失败回滚
    });
  };

  return (
    <SafeView backgroundColor="#F6F7FB">
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.content}>
        <SectionTitle title="资料公开范围" right="关闭后仅自己可见" />
        <SettingCard>
          <SettingRow label="我的动态" switchValue={store.publicBbs} onSwitchChange={v => onChange('publicBbs', v)} />
          <SettingDivider />
          <SettingRow label="我的点赞" switchValue={store.publicLike} onSwitchChange={v => onChange('publicLike', v)} />
          <SettingDivider />
          <SettingRow label="我的收藏" switchValue={store.publicFavorite} onSwitchChange={v => onChange('publicFavorite', v)} />
          <SettingDivider />
          <SettingRow label="我的关注" switchValue={store.publicFollow} onSwitchChange={v => onChange('publicFollow', v)} />
          <SettingDivider />
          <SettingRow label="我的粉丝" switchValue={store.publicFans} onSwitchChange={v => onChange('publicFans', v)} />
        </SettingCard>

        <SectionTitle title="AI 产业连接" right="默认策略" />
        <View style={[styles.aiCard, store.aiConnect && styles.aiCardOn]}>
          <View style={styles.aiHeader}>
            <AiConnectIcon />
            <Text style={styles.aiTitle}>AI 产业连接</Text>
            <Switch
              value={store.aiConnect}
              onValueChange={v => onChange('aiConnect', v)}
              trackColor={{ false: '#E9E9EA', true: BLUE }}
              thumbColor="#FFFFFF"
              style={styles.aiSwitch}
            />
          </View>
          <View style={[styles.aiStatus, store.aiConnect ? styles.aiStatusOn : styles.aiStatusOff]}>
            <AiInfoIcon />
            <Text style={[styles.aiStatusText, store.aiConnect ? styles.aiStatusTextOn : styles.aiStatusTextOff]}>
              {store.aiConnect
                ? '已开启：新发动态默认参与分析；单条仍可在发布时单独关闭。'
                : '已关闭：新内容默认不参与产业连接。'}
            </Text>
          </View>
          <Text style={styles.aiDesc}>{'控制新发动态的默认开关；\n单条可在发布时单独调整，不会改这里的默认值'}</Text>
        </View>

        <View style={styles.gap} />
        <SettingCard>
          <View style={styles.switchRow}>
            <View style={styles.switchTextWrap}>
              <Text style={styles.switchLabel}>分析我的公开动态</Text>
              <Text style={styles.switchDesc}>识别明确的企业需求、能力、人才与服务</Text>
            </View>
            <Switch
              value={store.analyzeBbs}
              onValueChange={v => onChange('analyzeBbs', v)}
              trackColor={{ false: '#E9E9EA', true: BLUE }}
              thumbColor="#FFFFFF"
            />
          </View>
          <SettingDivider />
          <View style={styles.switchRow}>
            <View style={styles.switchTextWrap}>
              <Text style={styles.switchLabel}>为我推荐企业与机会</Text>
              <Text style={styles.switchDesc}>根据公开内容匹配可能相关的企业</Text>
            </View>
            <Switch
              value={store.recommendCompany}
              onValueChange={v => onChange('recommendCompany', v)}
              trackColor={{ false: '#E9E9EA', true: BLUE }}
              thumbColor="#FFFFFF"
            />
          </View>
        </SettingCard>
      </ScrollView>
    </SafeView>
  );
}

const styles = StyleSheet.create({
  content: {
    paddingBottom: scaleSizeH(40),
  },
  gap: {
    height: scaleSizeH(20),
  },
  aiCard: {
    marginHorizontal: scaleSizeW(16),
    borderRadius: scaleSizeW(10),
    backgroundColor: '#FFFFFF',
    padding: scaleSizeW(14),
  },
  aiCardOn: {
    backgroundColor: '#F2F6FF',
    borderWidth: 1,
    borderColor: BLUE,
  },
  aiHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: scaleSizeW(4),
  },
  aiTitle: {
    fontSize: setSpText(14),
    fontWeight: '500',
    color: '#000000',
  },
  aiSwitch: {
    marginLeft: 'auto',
  },
  aiStatus: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: scaleSizeW(5),
    borderRadius: scaleSizeW(10),
    paddingHorizontal: scaleSizeW(12),
    paddingVertical: scaleSizeH(9),
    marginTop: scaleSizeH(12),
  },
  aiStatusOn: {
    backgroundColor: BLUE,
  },
  aiStatusOff: {
    backgroundColor: '#F2F6FF',
  },
  aiStatusText: {
    flex: 1,
    fontSize: setSpText(12),
    lineHeight: scaleSizeH(16),
  },
  aiStatusTextOn: {
    color: '#FFFFFF',
  },
  aiStatusTextOff: {
    color: BLUE,
  },
  aiDesc: {
    fontSize: setSpText(12),
    color: '#6C6C6C',
    lineHeight: scaleSizeH(20),
    marginTop: scaleSizeH(12),
  },
  switchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: scaleSizeW(14),
    paddingVertical: scaleSizeH(10),
    gap: scaleSizeW(10),
  },
  switchTextWrap: {
    flex: 1,
    gap: scaleSizeH(10),
  },
  switchLabel: {
    fontSize: setSpText(14),
    color: '#000000',
    lineHeight: scaleSizeH(14),
  },
  switchDesc: {
    fontSize: setSpText(12),
    color: '#6C6C6C',
    lineHeight: scaleSizeH(14),
  },
});
