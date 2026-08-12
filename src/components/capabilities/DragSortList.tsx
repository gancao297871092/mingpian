import React, { useCallback, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import DraggableFlatList, {
  ScaleDecorator,
  RenderItemParams,
} from 'react-native-draggable-flatlist';

interface Item {
  key: string;
  label: string;
  color: string;
}

const initialData: Item[] = [
  { key: '1', label: '项目 1', color: '#FF6B6B' },
  { key: '2', label: '项目 2', color: '#4ECDC4' },
  { key: '3', label: '项目 3', color: '#45B7D1' },
  { key: '4', label: '项目 4', color: '#96CEB4' },
  { key: '5', label: '项目 5', color: '#DDA0DD' },
  { key: '6', label: '项目 6', color: '#F0E68C' },
];

export default function DragSortList() {
  const [data, setData] = useState(initialData);

  const renderItem = useCallback(
    ({ item, drag, isActive }: RenderItemParams<Item>) => (
      <ScaleDecorator>
        <TouchableOpacity
          onLongPress={drag}
          disabled={isActive}
          style={[
            styles.row,
            { backgroundColor: isActive ? '#f0f0f0' : '#fff' },
          ]}
        >
          <View style={[styles.colorDot, { backgroundColor: item.color }]} />
          <Text style={styles.label}>{item.label}</Text>
          <Text style={styles.dragHint}>⠿</Text>
        </TouchableOpacity>
      </ScaleDecorator>
    ),
    [],
  );

  return (
    <View style={styles.container}>
      <Text style={styles.hint}>长按拖动排序</Text>
      <DraggableFlatList
        data={data}
        onDragEnd={({ data }) => setData(data)}
        keyExtractor={item => item.key}
        renderItem={renderItem}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  hint: {
    textAlign: 'center', color: '#999', fontSize: 13, marginVertical: 8,
  },
  row: {
    flexDirection: 'row', alignItems: 'center', padding: 16,
    borderBottomWidth: StyleSheet.hairlineWidth, borderColor: '#eee',
    marginHorizontal: 16,
  },
  colorDot: {
    width: 12, height: 12, borderRadius: 6, marginRight: 12,
  },
  label: { flex: 1, fontSize: 16, color: '#333' },
  dragHint: { fontSize: 20, color: '#ccc' },
});
