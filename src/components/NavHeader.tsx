import React from 'react';
import { StyleSheet, TouchableOpacity, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Svg, { Path } from 'react-native-svg';
import { scaleSizeH, scaleSizeW } from '@/utils/screenUtils';

const BACK_PATH =
  'M9.33391 14.6398C9.47676 14.7854 9.55859 14.9801 9.56267 15.184C9.56675 15.3879 9.49278 15.5857 9.35587 15.7369C9.21896 15.8882 9.02946 15.9814 8.82612 15.9975C8.62278 16.0136 8.42096 15.9515 8.26191 15.8238L0.261914 8.62377C0.179419 8.54878 0.113507 8.45739 0.0684029 8.35544C0.023299 8.25349 0 8.14325 0 8.03177C0 7.92029 0.023299 7.81004 0.0684029 7.70809C0.113507 7.60614 0.179419 7.51475 0.261914 7.43977L8.26191 0.239766C8.33828 0.161924 8.42975 0.100516 8.53071 0.059312C8.63166 0.018108 8.73998 -0.00202137 8.849 0.000160119C8.95803 0.00234161 9.06545 0.0267877 9.16468 0.0719974C9.26391 0.117207 9.35285 0.182226 9.42604 0.26306C9.49922 0.343893 9.55512 0.438836 9.59027 0.542056C9.62543 0.645276 9.63912 0.754594 9.63049 0.863296C9.62186 0.971997 9.5911 1.07779 9.5401 1.17417C9.4891 1.27055 9.41894 1.35549 9.33391 1.42377L1.98991 8.03177L9.33391 14.6398Z';

interface NavBackButtonProps {
  onPress?: () => void;
  color?: string;
}

export function NavBackButton({ onPress, color = '#000000' }: NavBackButtonProps) {
  return (
    <TouchableOpacity activeOpacity={0.7} hitSlop={8} style={styles.backBtn} onPress={onPress}>
      <Svg width={scaleSizeW(10)} height={scaleSizeW(16)} viewBox="0 0 10 16">
        <Path d={BACK_PATH} fill={color} />
      </Svg>
    </TouchableOpacity>
  );
}

interface NavHeaderProps {
  left?: React.ReactNode;
  center?: React.ReactNode;
  right?: React.ReactNode;
  onBack?: () => void;
  backgroundColor?: string;
  showDivider?: boolean;
}

export default function NavHeader({
  left,
  center,
  right,
  onBack,
  backgroundColor = '#FFFFFF',
  showDivider = true,
}: NavHeaderProps) {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation();

  return (
    <View style={{ paddingTop: insets.top, backgroundColor }}>
      <View style={styles.bar}>
        <View style={styles.left}>{left ?? <NavBackButton onPress={onBack ?? (() => navigation.goBack())} />}</View>
        <View style={styles.center}>{center}</View>
        <View style={styles.right}>{right}</View>
      </View>
      {showDivider && <View style={styles.divider} />}
    </View>
  );
}

const styles = StyleSheet.create({
  bar: {
    height: scaleSizeH(46),
    flexDirection: 'row',
    alignItems: 'center',
    paddingLeft: scaleSizeW(8),
    paddingRight: scaleSizeW(11),
  },
  left: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  center: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  right: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  backBtn: {
    width: scaleSizeW(25),
    height: scaleSizeW(25),
    alignItems: 'center',
    justifyContent: 'center',
  },
  divider: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: '#E6E6E6',
  },
});
