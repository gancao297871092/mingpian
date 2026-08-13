import React, { useEffect, useState } from 'react';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { API } from '@/api';
import AppWebView from '@/components/capabilities/WebView';
import { useTheme } from '@/theme';
import type { RootStackParamList } from '@/route/map';

type Props = NativeStackScreenProps<RootStackParamList, 'agreement'>;

const TITLES: Record<string, string> = {
  userSure: '用户协议',
  privates: '隐私政策',
};

export default function AgreementPage({ route, navigation }: Props) {
  const theme = useTheme();
  const { type } = route.params;
  const [html, setHtml] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    navigation.setOptions({ title: TITLES[type] ?? '' });
  }, [navigation, type]);

  useEffect(() => {
    const fetcher = type === 'userSure' ? API.common.userSure : API.common.privates;
    fetcher()
      .then(res => {
        const { code, data } = res;
        if (code === '200' && data?.htmls) {
          setHtml(data.htmls);
        } else {
          setError('内容加载失败');
        }
      })
      .catch(() => setError('网络错误，请稍后重试'))
      .finally(() => setLoading(false));
  }, [type]);

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color={theme.primary} />
        </View>
      ) : error ? (
        <View style={styles.center}>
          <Text style={[styles.errorText, { color: theme.subText }]}>{error}</Text>
        </View>
      ) : (
        <AppWebView html={html} style={styles.webview} />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  errorText: {
    fontSize: 14,
  },
  webview: {
    flex: 1,
    paddingHorizontal: 16,
  },
});
