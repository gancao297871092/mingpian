import React, { forwardRef, useCallback } from 'react';
import { StyleSheet, View } from 'react-native';
import ReanimatedSwipeable, { type SwipeableMethods } from 'react-native-gesture-handler/ReanimatedSwipeable';

export type SwipeableRowHandle = SwipeableMethods;

interface SwipeableRowProps {
  onRowOpen?: () => void;
  onRowClose?: () => void;
  /**
   * 两个子节点，与旧 swipe-list-view SwipeRow 约定一致：
   * [0]=隐藏的操作层（按钮固定宽、总宽自适应）；[1]=可见行内容。
   */
  children: React.ReactNode;
}

/**
 * 左滑操作行：替代 react-native-swipe-list-view 的 SwipeRow（该库为纯 JS 手势，
 * iOS 上与列表滚动抢手势、需拖动很长距离才打开）。本组件基于 RNGH ReanimatedSwipeable
 * 原生手势驱动，跟手顺滑；操作层总宽由按钮内容自适应，滑开距离精确贴合。
 */
const SwipeableRow = forwardRef<SwipeableRowHandle, SwipeableRowProps>(({ onRowOpen, onRowClose, children }, ref) => {
  const [hidden, visible] = React.Children.toArray(children);

  const renderRightActions = useCallback(() => <View style={styles.actions}>{hidden}</View>, [hidden]);

  return (
    <ReanimatedSwipeable
      ref={ref}
      overshootRight={false}
      renderRightActions={renderRightActions}
      onSwipeableWillOpen={onRowOpen}
      onSwipeableWillClose={onRowClose}
    >
      {visible}
    </ReanimatedSwipeable>
  );
});

const styles = StyleSheet.create({
  actions: {
    // 按钮固定宽，总宽随内容自适应；贴行右缘
    flexDirection: 'row',
    justifyContent: 'flex-end',
  },
});

SwipeableRow.displayName = 'SwipeableRow';
export default SwipeableRow;
