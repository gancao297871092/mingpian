import React from 'react';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';
import i18n from '@/language';
import { useTheme } from '@/theme';
import { scaleSizeH, setSpText } from '@/utils/screenUtils';

interface EndProps {
  isLastPage: boolean;
  list: any[];
  isLoading?: boolean;
  color?: string;
  paddingBottom?: number;
}

export default function End({
  isLastPage = true,
  list = [],
  isLoading = false,
  color,
  paddingBottom = scaleSizeH(20),
}: EndProps) {
  const theme = useTheme();
  const resolvedColor = color ?? theme.placeholder;
  if (isLoading) {
    return (
      <View style={styles.loadingWrap}>
        <ActivityIndicator size="small" color={resolvedColor} />
      </View>
    );
  }
  if (isLastPage && list.length > 0) {
    return (
      <View style={[styles.endWrap, { paddingBottom }]}>
        <Text style={[styles.text, { color: resolvedColor }]}>
          --- {i18n.t('內容已加載完畢')} ---
        </Text>
      </View>
    );
  }
  return null;
}

const styles = StyleSheet.create({
  loadingWrap: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: scaleSizeH(20),
  },
  endWrap: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: scaleSizeH(20),
  },
  text: {
    fontSize: setSpText(12),
  },
});
