import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import SafeView from '@/components/SafeView';
import type { RootStackParamList } from '@/route/map';

type Props = NativeStackScreenProps<RootStackParamList, 'editCard'>;

export default function EditCard({ route }: Props) {
  const { id } = route.params || {};

  return (
    <SafeView backgroundColor="#fff">
      <View style={styles.container}>
        <Text style={styles.title}>{id ? '编辑名片' : '创建名片'}</Text>
        <Text style={styles.tip}>名片编辑功能开发中…</Text>
      </View>
    </SafeView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#000',
  },
  tip: {
    marginTop: 12,
    fontSize: 14,
    color: '#999',
  },
});
