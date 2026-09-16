import React from 'react';
import { Text, View } from 'react-native';
import SafeView from '@/components/SafeView';

export default function LinkPage() {
  return (
    <SafeView>
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <Text style={{ fontSize: 16, color: '#999' }}>链接</Text>
      </View>
    </SafeView>
  );
}
