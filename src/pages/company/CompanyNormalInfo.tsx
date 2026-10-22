import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useRoute, type RouteProp } from '@react-navigation/native';
import SafeView from '@/components/SafeView';
import { scaleSizeH, setSpText } from '@/utils/screenUtils';
import type { RootStackParamList } from '@/route/map';

const GRAY = '#6C6C6C';

/** 普通版企业信息：已录入未认证企业（设计稿待补，先占位） */
export default function CompanyNormalInfo() {
  const route = useRoute<RouteProp<RootStackParamList, 'companyNormalInfo'>>();
  const name = route.params?.name;

  return (
    <SafeView backgroundColor="#FFFFFF">
      <View style={styles.wrap}>
        <Text style={styles.title}>{name || '普通版企业信息'}</Text>
        <Text style={styles.desc}>该页面设计稿待补充</Text>
      </View>
    </SafeView>
  );
}

const styles = StyleSheet.create({
  wrap: {
    flex: 1,
    alignItems: 'center',
    paddingTop: scaleSizeH(120),
  },
  title: {
    fontSize: setSpText(16),
    fontWeight: '500',
    color: '#000000',
  },
  desc: {
    marginTop: scaleSizeH(8),
    fontSize: setSpText(13),
    color: GRAY,
  },
});
