import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Animated } from 'react-native';
import { SwipeListView } from 'react-native-swipe-list-view';

interface Item {
  key: string;
  text: string;
}

interface SwipeableRowProps {
  data?: Item[];
  onDelete?: (key: string) => void;
}

const defaultData: Item[] = [
  { key: '1', text: '向左滑动删除' },
  { key: '2', text: '尝试滑动我' },
  { key: '3', text: '我也支持滑动' },
  { key: '4', text: '删除示例项目' },
  { key: '5', text: '最后一个项目' },
];

export default function SwipeableRow({ data = defaultData, onDelete }: SwipeableRowProps) {
  const [listData, setListData] = React.useState(data);

  const deleteItem = (key: string) => {
    setListData(prev => prev.filter(item => item.key !== key));
    onDelete?.(key);
  };

  return (
    <SwipeListView
      data={listData}
      keyExtractor={item => item.key}
      renderItem={({ item }) => (
        <View style={styles.row}>
          <Text style={styles.text}>{item.text}</Text>
        </View>
      )}
      renderHiddenItem={({ item }) => (
        <View style={styles.hiddenRow}>
          <TouchableOpacity
            style={styles.deleteBtn}
            onPress={() => deleteItem(item.key)}
          >
            <Text style={styles.deleteText}>删除</Text>
          </TouchableOpacity>
        </View>
      )}
      rightOpenValue={-80}
      disableRightSwipe
    />
  );
}

const styles = StyleSheet.create({
  row: {
    backgroundColor: '#fff', padding: 20, marginHorizontal: 16,
    borderBottomWidth: StyleSheet.hairlineWidth, borderColor: '#eee',
  },
  text: { fontSize: 16, color: '#333' },
  hiddenRow: {
    flex: 1, flexDirection: 'row', justifyContent: 'flex-end',
    alignItems: 'center', marginHorizontal: 16,
  },
  deleteBtn: {
    backgroundColor: '#FF4757', justifyContent: 'center', alignItems: 'center',
    width: 80, height: '100%',
  },
  deleteText: { color: '#fff', fontSize: 16, fontWeight: '600' },
});
