import React, { useEffect, useMemo, useState } from 'react';
import {
  FlatList,
  Modal,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { scaleSizeW } from '@/utils/screenUtils';
import areaData from '@/data/area.json';

interface AreaNode {
  code: string;
  name: string;
  children?: AreaNode[];
}

interface AreaPickerProps {
  visible: boolean;
  onClose: () => void;
  onConfirm: (
    province: string,
    city: string,
    district: string,
    provinceCode: string,
    cityCode: string,
    districtCode: string,
  ) => void;
  defaultProvince?: string;
  defaultCity?: string;
  defaultDistrict?: string;
}

export default function AreaPicker({
  visible,
  onClose,
  onConfirm,
  defaultProvince,
  defaultCity,
  defaultDistrict,
}: AreaPickerProps) {
  const [step, setStep] = useState<0 | 1 | 2>(0); // 0=省, 1=市, 2=区
  const [province, setProvince] = useState<AreaNode | null>(null);
  const [city, setCity] = useState<AreaNode | null>(null);

  useEffect(() => {
    if (!visible) return;
    // 尝试根据默认值回显
    if (defaultProvince) {
      const p = areaData.find((a: AreaNode) => a.name === defaultProvince);
      if (p) {
        setProvince(p);
        if (defaultCity && p.children) {
          const c = p.children.find((a: AreaNode) => a.name === defaultCity);
          if (c) {
            setCity(c);
            if (defaultDistrict && c.children) {
              setStep(2);
              return;
            }
            setStep(1);
            return;
          }
        }
        setStep(1);
        return;
      }
    }
    setStep(0);
    setProvince(null);
    setCity(null);
  }, [visible, defaultProvince, defaultCity, defaultDistrict]);

  const listData = useMemo(() => {
    if (step === 0) return areaData;
    if (step === 1) return province?.children || [];
    return city?.children || [];
  }, [step, province, city]);

  const onSelect = (item: AreaNode) => {
    if (step === 0) {
      setProvince(item);
      if (item.children?.length) {
        setCity(null);
        setStep(1);
      } else {
        onConfirm(item.name, '', '', item.code, '', '');
        onClose();
      }
    } else if (step === 1) {
      setCity(item);
      if (item.children?.length) {
        setStep(2);
      } else {
        onConfirm(province!.name, item.name, '', province!.code, item.code, '');
        onClose();
      }
    } else {
      onConfirm(province!.name, city!.name, item.name, province!.code, city!.code, item.code);
      onClose();
    }
  };

  const renderItem = ({ item }: { item: AreaNode }) => {
    const isActive =
      (step === 0 && province?.name === item.name) ||
      (step === 1 && city?.name === item.name);
    return (
      <TouchableOpacity style={styles.item} onPress={() => onSelect(item)}>
        <Text style={[styles.itemText, isActive && styles.itemTextActive]}>
          {item.name}
        </Text>
        {isActive && <View style={styles.dot} />}
      </TouchableOpacity>
    );
  };

  const stepLabel = step === 0 ? '选择省份/地区' : step === 1 ? '选择城市' : '选择区/县';

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <TouchableOpacity style={styles.backdrop} onPress={onClose} />
        <View style={styles.content}>
          <View style={styles.header}>
            <TouchableOpacity onPress={onClose}>
              <Text style={styles.cancel}>取消</Text>
            </TouchableOpacity>
            <Text style={styles.title}>{stepLabel}</Text>
            <View style={{ width: scaleSizeW(40) }} />
          </View>

          {/* 面包屑 */}
          <View style={styles.breadcrumb}>
            <TouchableOpacity
              style={[styles.crumb, step === 0 && styles.crumbActive]}
              onPress={() => { setStep(0); setProvince(null); setCity(null); }}
            >
              <Text style={[styles.crumbText, step === 0 && styles.crumbTextActive]}>
                {province?.name || '请选择'}
              </Text>
            </TouchableOpacity>
            {province && (
              <>
                <Text style={styles.crumbArrow}>›</Text>
                <TouchableOpacity
                  style={[styles.crumb, step === 1 && styles.crumbActive]}
                  onPress={() => { setStep(1); setCity(null); }}
                >
                  <Text style={[styles.crumbText, step === 1 && styles.crumbTextActive]}>
                    {city?.name || '请选择'}
                  </Text>
                </TouchableOpacity>
              </>
            )}
            {city && city.children?.length ? (
              <>
                <Text style={styles.crumbArrow}>›</Text>
                <View style={[styles.crumb, step === 2 && styles.crumbActive]}>
                  <Text style={[styles.crumbText, step === 2 && styles.crumbTextActive]}>
                    请选择
                  </Text>
                </View>
              </>
            ) : null}
          </View>

          <FlatList
            data={listData}
            keyExtractor={(item) => item.code}
            renderItem={renderItem}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.list}
          />
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  backdrop: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.4)',
  },
  content: {
    backgroundColor: '#ffffff',
    borderTopLeftRadius: scaleSizeW(16),
    borderTopRightRadius: scaleSizeW(16),
    maxHeight: '70%',
    paddingBottom: scaleSizeW(20),
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: scaleSizeW(16),
    paddingVertical: scaleSizeW(14),
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#eeeeee',
  },
  cancel: {
    fontSize: scaleSizeW(15),
    color: '#999999',
    width: scaleSizeW(40),
  },
  title: {
    fontSize: scaleSizeW(16),
    fontWeight: 'bold',
    color: '#000000',
  },
  breadcrumb: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: scaleSizeW(16),
    paddingVertical: scaleSizeW(12),
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#eeeeee',
  },
  crumb: {
    paddingVertical: scaleSizeW(4),
    paddingHorizontal: scaleSizeW(6),
    borderRadius: scaleSizeW(4),
  },
  crumbActive: {
    backgroundColor: '#f6f6f6',
  },
  crumbText: {
    fontSize: scaleSizeW(14),
    color: '#666666',
  },
  crumbTextActive: {
    color: '#000000',
    fontWeight: 'bold',
  },
  crumbArrow: {
    fontSize: scaleSizeW(16),
    color: '#cccccc',
    marginHorizontal: scaleSizeW(4),
  },
  list: {
    paddingHorizontal: scaleSizeW(16),
    paddingTop: scaleSizeW(8),
  },
  item: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: scaleSizeW(14),
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#f5f5f5',
  },
  itemText: {
    fontSize: scaleSizeW(15),
    color: '#333333',
  },
  itemTextActive: {
    color: '#000000',
    fontWeight: 'bold',
  },
  dot: {
    width: scaleSizeW(8),
    height: scaleSizeW(8),
    borderRadius: scaleSizeW(4),
    backgroundColor: '#000000',
  },
});
