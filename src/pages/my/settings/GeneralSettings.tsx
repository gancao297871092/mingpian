import React from 'react';
import { ScrollView, StyleSheet } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import SafeView from '@/components/SafeView';
import { API } from '@/api';
import { useSettingStore } from '@/store/setting';
import { scaleSizeH } from '@/utils/screenUtils';
import { SettingCard, SettingDivider, SettingRow } from './components';
import type { RootStackParamList } from '@/route/map';

/** 77.通用设置 */
export default function GeneralSettings() {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const videoMuted = useSettingStore(s => s.videoMuted);
  const defaultHome = useSettingStore(s => s.defaultHome);
  const setValue = useSettingStore(s => s.setValue);

  const onMuteChange = (v: boolean) => {
    setValue('videoMuted', v);
    API.setting.preferenceSave({ videoMuted: v }).catch(() => {
      // TODO 联调后处理失败回滚
    });
  };

  return (
    <SafeView backgroundColor="#F6F7FB">
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.content}>
        <SettingCard>
          <SettingRow label="打开视频时默认静音" switchValue={videoMuted} onSwitchChange={onMuteChange} />
          <SettingDivider />
          <SettingRow
            label="修改默认首页"
            value={defaultHome === 'square' ? '广场' : '链接'}
            onPress={() => navigation.navigate('defaultHomeSetting')}
          />
        </SettingCard>
      </ScrollView>
    </SafeView>
  );
}

const styles = StyleSheet.create({
  content: {
    paddingTop: scaleSizeH(20),
  },
});
