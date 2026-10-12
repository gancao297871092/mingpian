import React, { forwardRef, useCallback, useImperativeHandle, useRef, useState } from 'react';
import {
  Alert,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { API } from '@/api';
import { scaleSizeW, setSpText } from '@/utils/screenUtils';
import { ChevronRightIcon } from '@/pages/square/bbsDetail/sheetIcons';
import { CardDeleteIcon, CardEditIcon } from '@/pages/card/myCard/icons';
import { DragIcon } from './stepIcons';
import type { StepHandle } from './types';

interface StepThreeProps {
  cardId: number | null;
  data: Record<string, any>;
  onNext: (step: number, data?: any) => void;
}

const StepThree = forwardRef<StepHandle, StepThreeProps>(function StepThreeForm({ cardId, data, onNext }, ref) {
  const navigation = useNavigation<any>();
  const [itemsList, setItemsList] = useState<any[]>(data.itemsList || []);
  const [pjId, setPjId] = useState<number | null>(data.pjId || null);
  const isFirstFocus = useRef(true);

  // 从板块编辑页返回后刷新；首次进入时 StepTwo 已预加载 itemsList，跳过（对齐小程序只调一次）
  useFocusEffect(
    useCallback(() => {
      if (isFirstFocus.current) {
        isFirstFocus.current = false;
        return;
      }
      if (cardId) {
        loadProjectPre();
      }
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [cardId])
  );

  const loadProjectPre = async () => {
    if (!cardId) return;
    try {
      const res = await API.card.projectPre({ cardId });
      if (res.code === '200' && res.data?.[0]) {
        setItemsList(res.data[0].itemsList || []);
        setPjId(res.data[0].id);
      }
    } catch {
      // ignore
    }
  };

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
    } catch {
      Alert.alert('添加失败');
    }
  };

  const onRemove = async (item: any) => {
    try {
      const res = await API.card.projectItemDel({ itemId: item.id });
      if (res.code === '200') {
        setItemsList(res.data?.itemsList || []);
      }
    } catch {
      Alert.alert('删除失败');
    }
  };

  const goEdit = (item: any) => {
    navigation.navigate('addItem', {
      itemId: item.id,
      cardId,
      userId: data.userId,
      pjId,
    });
  };

  const onSubmit = async () => {
    if (!cardId) return;
    try {
      const res = await API.card.projectUpdate({
        cardId,
        userId: data.userId,
        pjName: '价值亮点',
        itemsList: [],
        id: pjId,
      });
      if (res.code === '200') {
        // 对齐小程序：project/update 返回完整 cardInfo（含 styleCode/fontColor/backColor），传给第四步
        onNext(4, { ...(res.data || {}), pjId: res.data?.id || pjId, itemsList });
        return;
      }
    } catch {
      // ignore
    }
    onNext(4, { pjId, itemsList });
  };

  useImperativeHandle(ref, () => ({ submit: onSubmit }));

  return (
    <View style={styles.container}>
      {itemsList.map((item, index) => (
        <View key={item.id || index} style={styles.itemCard}>
          <DragIcon />
          <Text style={styles.itemTitle} numberOfLines={1}>
            {item.itTitle || '板块'}
          </Text>
          <View style={styles.itemActions}>
            <TouchableOpacity activeOpacity={0.7} hitSlop={8} onPress={() => goEdit(item)}>
              <CardEditIcon />
            </TouchableOpacity>
            <TouchableOpacity activeOpacity={0.7} hitSlop={8} onPress={() => onRemove(item)}>
              <CardDeleteIcon />
            </TouchableOpacity>
          </View>
          <ChevronRightIcon />
        </View>
      ))}

      <TouchableOpacity style={styles.addCard} activeOpacity={0.8} onPress={onAdd}>
        <Text style={styles.addText}>+ 新增板块</Text>
      </TouchableOpacity>
      <View style={{ height: scaleSizeW(40) }} />
    </View>
  );
});

export default StepThree;

const styles = StyleSheet.create({
  container: {},
  itemCard: {
    height: scaleSizeW(55),
    backgroundColor: '#FFFFFF',
    borderRadius: scaleSizeW(10),
    flexDirection: 'row',
    alignItems: 'center',
    paddingLeft: scaleSizeW(9),
    paddingRight: scaleSizeW(14),
    marginTop: scaleSizeW(10),
  },
  itemTitle: {
    fontSize: setSpText(15),
    fontWeight: '400',
    color: '#000000',
    marginLeft: scaleSizeW(10),
    flex: 1,
  },
  itemActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: scaleSizeW(20),
    marginRight: scaleSizeW(8),
  },
  addCard: {
    height: scaleSizeW(55),
    backgroundColor: '#FFFFFF',
    borderRadius: scaleSizeW(10),
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: scaleSizeW(10),
  },
  addText: {
    fontSize: setSpText(15),
    fontWeight: '400',
    color: '#2962D4',
  },
});
