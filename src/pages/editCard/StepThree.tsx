import React, { useCallback, useState } from 'react';
import {
  Alert,
  Image,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { API } from '@/api';
import { scaleSizeW } from '@/utils/screenUtils';

interface StepThreeProps {
  cardId: number | null;
  data: Record<string, any>;
  onNext: (step: number, data?: any) => void;
}

export default function StepThree({ cardId, data, onNext }: StepThreeProps) {
  const [itemsList, setItemsList] = useState<any[]>(data.itemsList || []);
  const [pjId, setPjId] = useState<number | null>(data.pjId || null);

  const onAdd = async () => {
    if (!cardId) return;
    try {
      const res = await API.card.projectItemSave({
        cardId,
        userId: data.userId,
        id: pjId,
      });
      if (res.code === '200' && res.data?.[0]) {
        setItemsList(res.data[0].itemsList || []);
        setPjId(res.data[0].id);
      }
    } catch (e) {
      Alert.alert('添加失败');
    }
  };

  const onRemove = async (item: any, index: number) => {
    try {
      const res = await API.card.projectItemDel({ itemId: item.id });
      if (res.code === '200') {
        setItemsList(res.data?.itemsList || []);
      }
    } catch (e) {
      Alert.alert('删除失败');
    }
  };

  const onSubmit = async (nextStep: number) => {
    if (!cardId) return;
    if (nextStep === 4) {
      try {
        const res = await API.card.projectUpdate({
          cardId,
          userId: data.userId,
          pjName: '价值亮点',
          itemsList: [],
          id: pjId,
        });
        if (res.code === '200') {
          onNext(nextStep, { pjId: res.data?.id || pjId });
          return;
        }
      } catch (e) {
        // ignore
      }
    }
    onNext(nextStep);
  };

  return (
    <View style={styles.container}>
      <Text style={styles.panelHeader}>自由设计您想展示的内容</Text>
      {itemsList.map((item, index) => (
        <View key={item.id || index} style={styles.itemBox}>
          <Text style={styles.itemLabel}>板块</Text>
          <View style={styles.itemContent}>
            <Text style={item.itTitle ? styles.itemTitle : styles.itemPlaceholder}>
              {item.itTitle || '请填写板块名称和内容'}
            </Text>
            <Image source={require('@/assets/ming/right.png')} style={styles.arrow} />
          </View>
          <TouchableOpacity style={styles.delBtn} onPress={() => onRemove(item, index)}>
            <Image source={require('@/assets/ming/remove.png')} style={styles.delIcon} />
          </TouchableOpacity>
        </View>
      ))}
      <TouchableOpacity style={styles.addBox} onPress={onAdd}>
        <Text style={styles.addText}>+ 新增板块</Text>
      </TouchableOpacity>

      <View style={styles.btnRow}>
        <TouchableOpacity style={styles.btnBorder} onPress={() => onNext(2)}>
          <Text style={styles.btnBorderText}>上一步</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.btn} onPress={() => onSubmit(4)}>
          <Text style={styles.btnText}>下一步</Text>
        </TouchableOpacity>
      </View>
      <View style={{ height: scaleSizeW(40) }} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingTop: scaleSizeW(8),
  },
  panelHeader: {
    fontWeight: '500',
    fontSize: scaleSizeW(13),
    color: '#999999',
    marginTop: scaleSizeW(8),
  },
  itemBox: {
    backgroundColor: '#f9f9f9',
    borderRadius: scaleSizeW(11),
    marginTop: scaleSizeW(11),
    paddingHorizontal: scaleSizeW(16),
    paddingVertical: scaleSizeW(12),
    position: 'relative',
  },
  itemLabel: {
    fontWeight: '500',
    fontSize: scaleSizeW(13),
    color: '#6c6c6c',
  },
  itemContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: scaleSizeW(4),
  },
  itemTitle: {
    fontWeight: 'bold',
    fontSize: scaleSizeW(15),
    color: '#000000',
    flex: 1,
  },
  itemPlaceholder: {
    fontWeight: 'bold',
    fontSize: scaleSizeW(15),
    color: '#a3a3a3',
    flex: 1,
  },
  arrow: {
    width: scaleSizeW(16),
    height: scaleSizeW(16),
  },
  delBtn: {
    position: 'absolute',
    right: scaleSizeW(-4),
    top: scaleSizeW(-4),
    width: scaleSizeW(22),
    height: scaleSizeW(22),
  },
  delIcon: {
    width: scaleSizeW(22),
    height: scaleSizeW(22),
  },
  addBox: {
    backgroundColor: '#f9f9f9',
    borderRadius: scaleSizeW(11),
    marginTop: scaleSizeW(11),
    paddingHorizontal: scaleSizeW(16),
    paddingVertical: scaleSizeW(16),
    alignItems: 'center',
  },
  addText: {
    fontWeight: 'bold',
    fontSize: scaleSizeW(15),
    color: '#000000',
  },
  btnRow: {
    flexDirection: 'row',
    marginTop: scaleSizeW(22),
    gap: scaleSizeW(11),
  },
  btnBorder: {
    flex: 1,
    height: scaleSizeW(42),
    borderRadius: scaleSizeW(21),
    borderWidth: 1,
    borderColor: '#eeeeee',
    justifyContent: 'center',
    alignItems: 'center',
  },
  btnBorderText: {
    fontSize: scaleSizeW(15),
    fontWeight: 'bold',
    color: '#000000',
  },
  btn: {
    flex: 1,
    height: scaleSizeW(42),
    backgroundColor: '#000000',
    borderRadius: scaleSizeW(21),
    justifyContent: 'center',
    alignItems: 'center',
  },
  btnText: {
    fontSize: scaleSizeW(15),
    fontWeight: 'bold',
    color: '#ffffff',
  },
});
