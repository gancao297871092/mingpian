import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import SafeView from '@/components/SafeView';
import { scaleSizeW, setSpText } from '@/utils/screenUtils';

/** 企业主页（占位页，对齐小程序 pages/home/companyPage，待实现） */
export default function CompanyPage() {
  return (
    <SafeView backgroundColor="#F6F7FB">
      <View style={styles.box}>
        <Text style={styles.text}>企业主页建设中</Text>
      </View>
    </SafeView>
  );
}

const styles = StyleSheet.create({
  box: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  text: {
    fontSize: setSpText(14),
    color: '#999999',
    marginBottom: scaleSizeW(80),
  },
});
