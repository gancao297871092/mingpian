import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import i18n from '@/language';
import { useTheme } from '@/theme';
import { scaleSizeH, setSpText } from '@/utils/screenUtils';

interface EmptyProps {
  label?: string;
}

export default function Empty({ label }: EmptyProps) {
  const theme = useTheme();
  return (
    <View style={styles.container}>
      <Text style={[styles.text, { color: theme.placeholder }]}>{label ?? i18n.t('暂无消息')}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: scaleSizeH(60),
  },
  text: {
    fontSize: setSpText(13),
  },
});
