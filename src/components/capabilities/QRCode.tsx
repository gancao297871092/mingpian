import React from 'react';
import { View, StyleSheet } from 'react-native';
import QRCode from 'react-native-qrcode-svg';

interface QRCodeViewProps {
  value: string;
  size?: number;
  color?: string;
  backgroundColor?: string;
  logo?: any;
}

export default function QRCodeView({
  value, size = 200, color = '#000', backgroundColor = '#fff', logo,
}: QRCodeViewProps) {
  return (
    <View style={styles.container}>
      <QRCode
        value={value}
        size={size}
        color={color}
        backgroundColor={backgroundColor}
        logo={logo}
        logoSize={logo ? size * 0.2 : undefined}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    justifyContent: 'center', alignItems: 'center',
    padding: 16,
  },
});
