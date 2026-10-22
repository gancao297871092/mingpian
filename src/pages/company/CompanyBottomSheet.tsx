import React, { useEffect, useRef } from 'react';
import { Animated, Modal, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { scaleSizeH, scaleSizeW, setSpText } from '@/utils/screenUtils';

interface CompanyBottomSheetProps {
  visible: boolean;
  title?: string;
  /** 标题与内容之间的间距（figma 工商信息 28 / 免责声明 17） */
  contentGap?: number;
  onClose: () => void;
  children?: React.ReactNode;
}

/** 底部弹层（figma 1970:6569 / 1970:6719：白底、顶部 20 圆角、34x6 拖拽条） */
export default function CompanyBottomSheet({
  visible,
  title,
  contentGap = 28,
  onClose,
  children,
}: CompanyBottomSheetProps) {
  const insets = useSafeAreaInsets();
  const anim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(anim, {
      toValue: visible ? 1 : 0,
      duration: 220,
      useNativeDriver: true,
    }).start();
  }, [anim, visible]);

  return (
    <Modal
      visible={visible}
      transparent
      animationType="none"
      statusBarTranslucent
      onRequestClose={onClose}
    >
      <View style={styles.root}>
        <Pressable style={styles.mask} onPress={onClose} />
        <Animated.View
          style={[
            styles.sheet,
            {
              paddingBottom: insets.bottom + scaleSizeH(16),
              transform: [{ translateY: anim.interpolate({ inputRange: [0, 1], outputRange: [600, 0] }) }],
            },
          ]}
        >
          <View style={styles.handle} />
          {!!title && <Text style={styles.title}>{title}</Text>}
          <ScrollView
            style={[styles.scroll, { marginTop: scaleSizeH(contentGap) }]}
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
            bounces={false}
          >
            {children}
          </ScrollView>
        </Animated.View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  mask: {
    ...StyleSheet.absoluteFill,
    backgroundColor: 'rgba(0, 0, 0, 0.25)',
  },
  sheet: {
    maxHeight: '80%',
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: scaleSizeW(20),
    borderTopRightRadius: scaleSizeW(20),
    paddingTop: scaleSizeH(10),
  },
  handle: {
    alignSelf: 'center',
    width: scaleSizeW(34),
    height: scaleSizeH(6),
    borderRadius: scaleSizeW(10),
    backgroundColor: '#A3A3A3',
  },
  title: {
    marginTop: scaleSizeH(20),
    marginHorizontal: scaleSizeW(16),
    fontSize: setSpText(17),
    fontWeight: '500',
    color: '#000000',
  },
  scroll: {
    flexShrink: 1,
  },
  scrollContent: {
    paddingHorizontal: scaleSizeW(16),
    paddingBottom: scaleSizeH(16),
  },
});
