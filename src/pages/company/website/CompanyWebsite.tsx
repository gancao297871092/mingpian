import React, { useEffect, useState } from 'react';
import { ActivityIndicator, StyleSheet, View } from 'react-native';
import { useRoute, type RouteProp } from '@react-navigation/native';
import SafeView from '@/components/SafeView';
import { API } from '@/api';
import type { RootStackParamList } from '@/route/map';
import WebsiteFree from './WebsiteFree';
import WebsitePro from './WebsitePro';

/** 企业官网入口：按企业类型渲染（mainType 0 免费版官网2 / 其他 升级版，对齐小程序 companyPage） */
export default function CompanyWebsite() {
  const route = useRoute<RouteProp<RootStackParamList, 'companyWebsite'>>();
  const { id, fromShare } = route.params;
  const [mainType, setMainType] = useState<number | null>(null);

  useEffect(() => {
    if (!id) return;
    API.company
      .mainType({ cpId: id })
      .then((res) => {
        // setMainType(1)
        if (res.code === '200' && res.data) setMainType(Number(res.data.mainType ?? 0));
      })
      .catch(() => setMainType(0));
  }, [id]);

  
  if (mainType === null) {
    return (
      <SafeView backgroundColor="#F6F7FB">
        <View style={styles.loading}>
          <ActivityIndicator color="#2962D4" />
        </View>
      </SafeView>
    );
  }
  if (mainType === 0) {
    return <WebsiteFree cpId={id} fromShare={fromShare} />;
  }
  return <WebsitePro cpId={id} fromShare={fromShare} />;
}

const styles = StyleSheet.create({
  loading: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
