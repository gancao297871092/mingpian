import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Image as ExpoImage } from 'expo-image';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Toast from 'react-native-toast-message';
import Svg, { Path } from 'react-native-svg';
import { scaleSizeH, scaleSizeW, setSpText } from '@/utils/screenUtils';
import { MAX_SELECT_BBS, useSelectBbsStore } from '@/store/selectBbs';
import type { SelectedBbs } from '@/utils/selectBbsBridge';
import { PostCard, type PostCardData } from '@/pages/my/tabs/common';

const PRIMARY = '#2962D4';

/** 缩略图右上角移除角标 */
function RemoveBadge({ onPress }: { onPress: () => void }) {
  return (
    <TouchableOpacity activeOpacity={0.85} style={styles.removeBadge} onPress={onPress} hitSlop={6}>
      <Svg width={scaleSizeW(7)} height={scaleSizeW(7)} viewBox="0 0 8 8">
        <Path d="M1.5 1.5L6.5 6.5M6.5 1.5L1.5 6.5" stroke="#FFFFFF" strokeWidth={1.2} strokeLinecap="round" />
      </Svg>
    </TouchableOpacity>
  );
}

/** 瀑布流卡片 + 右上角选择角标（未选灰圈，已选蓝底顺序号） */
export function SelectablePostCard({ item }: { item: PostCardData }) {
  const selected = useSelectBbsStore(s => s.selected);
  const toggle = useSelectBbsStore(s => s.toggle);
  const order = selected.findIndex(i => i.id === item.id);

  const onPress = () => {
    const result = toggle({ id: item.id, title: item.title, imageUrl: item.imageUrl });
    if (result === 'full') {
      Toast.show({ type: 'info', text1: `最多选择 ${MAX_SELECT_BBS} 条动态` });
    }
  };

  return (
    <View>
      <PostCard item={item} onPress={onPress} />
      <View pointerEvents="none" style={[styles.checkCircle, order >= 0 && styles.checkCircleOn]}>
        {order >= 0 && <Text style={styles.checkOrder}>{order + 1}</Text>}
      </View>
    </View>
  );
}

/** 底部已选栏：缩略图（可移除）+ 确定 n/3 */
export function SelectBottomBar({ onConfirm }: { onConfirm: (selected: SelectedBbs[]) => void }) {
  const insets = useSafeAreaInsets();
  const selected = useSelectBbsStore(s => s.selected);
  const remove = useSelectBbsStore(s => s.remove);

  return (
    <View style={[styles.bottomBar, { paddingBottom: insets.bottom + scaleSizeH(12) }]}>
      <View style={styles.thumbRow}>
        {selected.map(item => (
          <View key={item.id} style={styles.thumbBox}>
            {!!item.imageUrl && (
              <ExpoImage source={{ uri: item.imageUrl }} style={styles.thumb} contentFit="cover" transition={150} />
            )}
            <RemoveBadge onPress={() => remove(item.id)} />
          </View>
        ))}
      </View>
      <View style={styles.confirmRow}>
        <TouchableOpacity
          activeOpacity={0.85}
          disabled={selected.length === 0}
          style={[styles.confirmBtn, selected.length === 0 && styles.confirmBtnDisabled]}
          onPress={() => onConfirm(selected)}
        >
          <Text style={styles.confirmText}>
            确定 {selected.length}/{MAX_SELECT_BBS}
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  checkCircle: {
    position: 'absolute',
    top: scaleSizeH(5),
    right: scaleSizeW(10),
    width: scaleSizeW(20),
    height: scaleSizeW(20),
    borderRadius: scaleSizeW(90),
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    borderWidth: 1,
    borderColor: '#EEEEEE',
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkCircleOn: {
    backgroundColor: PRIMARY,
    borderColor: PRIMARY,
  },
  checkOrder: {
    fontSize: setSpText(14),
    fontWeight: '500',
    color: '#FFFFFF',
  },
  bottomBar: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(255, 255, 255, 1)',
    borderTopLeftRadius: scaleSizeW(10),
    borderTopRightRadius: scaleSizeW(10),
    borderTopWidth: 1,
    borderTopColor: '#FFFFFF',
    paddingHorizontal: scaleSizeW(16),
    paddingTop: scaleSizeH(20),
  },
  thumbRow: {
    flexDirection: 'row',
    gap: scaleSizeW(10),
    minHeight: scaleSizeW(49),
  },
  thumbBox: {
    width: scaleSizeW(49),
    height: scaleSizeW(49),
  },
  thumb: {
    width: scaleSizeW(49),
    height: scaleSizeW(49),
    borderRadius: scaleSizeW(8),
    backgroundColor: '#F5F5F5',
  },
  removeBadge: {
    position: 'absolute',
    top: -scaleSizeH(5),
    right: -scaleSizeW(5),
    width: scaleSizeW(15),
    height: scaleSizeW(15),
    borderRadius: scaleSizeW(7.5),
    backgroundColor: '#303032',
    alignItems: 'center',
    justifyContent: 'center',
  },
  confirmRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginTop: scaleSizeH(30),
  },
  confirmBtn: {
    width: scaleSizeW(100),
    height: scaleSizeH(40),
    borderRadius: scaleSizeW(90),
    backgroundColor: PRIMARY,
    alignItems: 'center',
    justifyContent: 'center',
  },
  confirmBtnDisabled: {
    opacity: 0.3,
  },
  confirmText: {
    fontSize: setSpText(14),
    fontWeight: '500',
    color: '#FFFFFF',
  },
});
