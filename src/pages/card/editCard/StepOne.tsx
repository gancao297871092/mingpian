import React, { forwardRef, useCallback, useEffect, useImperativeHandle, useRef, useState } from 'react';
import {
  Alert,
  Image,
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { API } from '@/api';
import { scaleSizeW, setSpText } from '@/utils/screenUtils';
import AreaPicker from '@/components/AreaPicker';
import { ChevronRightIcon } from '@/pages/square/bbsDetail/sheetIcons';
import type { StepHandle } from './types';

interface StepOneProps {
  cardId: number | null;
  data: Record<string, any>;
  onNext: (step: number, data?: any) => void;
}

const validatePhone = (phone: string) => {
  if (!phone) return true;
  return /^(\+86)?1[3-9]\d{9}$/.test(phone.trim());
};

const StepOne = forwardRef<StepHandle, StepOneProps>(function StepOneForm({ cardId, data, onNext }, ref) {
  const [form, setForm] = useState<Record<string, any>>({
    alias: '',
    nameZh: '',
    nameEn: '',
    phone: '',
    fax: '',
    telNumber: '',
    email: '',
    province: '',
    city: '',
    district: '',
    address: '',
    profile: '',
    provinceCode: '',
    cityCode: '',
    districtCode: '',
    positionList: [],
    ...data,
  });
  const [positionModalVisible, setPositionModalVisible] = useState(false);
  const [areaPickerVisible, setAreaPickerVisible] = useState(false);
  const [positionOptions, setPositionOptions] = useState<any[]>(data.positionList || []);
  const [selectedPositions, setSelectedPositions] = useState<number[]>([]);
  const dataSynced = useRef(false);

  useEffect(() => {
    if (dataSynced.current) return;
    if (data && Object.keys(data).length > 0) {
      dataSynced.current = true;
      setForm((prev) => ({ ...prev, ...data }));
    }
  }, [data]);

  useEffect(() => {
    if (data.positionList?.length) {
      setPositionOptions(data.positionList);
      const checked = data.positionList
        .filter((o: any) => o.isCheck)
        .map((o: any) => o.id);
      setSelectedPositions(checked);
    }
  }, [data.positionList]);

  const updateField = useCallback((key: string, value: any) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  }, []);

  const positionText = selectedPositions.length > 0
    ? positionOptions
        .filter((o) => selectedPositions.includes(o.id))
        .map((o) => o.name)
        .join(',')
    : '';

  const togglePosition = (id: number) => {
    setSelectedPositions((prev) =>
      prev.includes(id) ? prev.filter((p) => p !== id) : [...prev, id]
    );
  };

  const onSubmit = async () => {
    if (!form.nameZh) {
      Alert.alert('提示', '请输入姓名');
      return;
    }
    if (form.phone && !validatePhone(form.phone)) {
      Alert.alert('提示', '请输入正确的手机号码');
      return;
    }
    if (form.profile && form.profile.length > 100) {
      Alert.alert('提示', '个性签名字符不能超过100');
      return;
    }

    try {
      const payload = {
        id: cardId,
        ...form,
        positionList: positionOptions.map((o: any) => ({
          ...o,
          isCheck: selectedPositions.includes(o.id) ? 1 : 0,
        })),
      };
      const res = await API.card.save(payload);
      if (res.code === '200') {
        const newCardId = res.data?.preId || res.data?.cardId || cardId;
        onNext(2, {
          ...res.data,
          ...form,
          cardId: newCardId,
          preId: newCardId,
          positionList: payload.positionList,
        });
      }
    } catch (e: any) {
      Alert.alert('保存失败', e?.msg || '请稍后重试');
    }
  };

  useImperativeHandle(ref, () => ({ submit: onSubmit }));

  /** 输入行：左 label，右输入框（figma 创建名片1） */
  const renderInputRow = (
    label: string,
    key: string,
    options?: {
      required?: boolean;
      disabled?: boolean;
      keyboardType?: any;
      maxLength?: number;
      last?: boolean;
    },
  ) => {
    const { required, disabled, keyboardType, maxLength, last } = options || {};
    return (
      <View>
        <View style={styles.formRow}>
          <Text style={styles.formLabel}>
            {label}
            {required && <Text style={styles.requiredMark}>*</Text>}
          </Text>
          <TextInput
            style={styles.formInput}
            placeholder="请输入"
            placeholderTextColor="#999999"
            value={form[key] || ''}
            onChangeText={(text) => updateField(key, text)}
            keyboardType={keyboardType}
            editable={!disabled}
            maxLength={maxLength}
            textAlign="right"
          />
        </View>
        {!last && <View style={styles.formDivider} />}
      </View>
    );
  };

  /** 选择行：左 label，右值 + 箭头 */
  const renderSelectRow = (
    label: string,
    value: string,
    onPress: () => void,
    options?: { last?: boolean },
  ) => (
    <View>
      <TouchableOpacity style={styles.formRow} activeOpacity={0.7} onPress={onPress}>
        <Text style={styles.formLabel}>{label}</Text>
        <View style={styles.selectValueRow}>
          <Text style={value ? styles.selectValue : styles.selectPlaceholder} numberOfLines={1}>
            {value || '请选择'}
          </Text>
          <ChevronRightIcon />
        </View>
      </TouchableOpacity>
      {!options?.last && <View style={styles.formDivider} />}
    </View>
  );

  return (
    <View style={styles.container}>
      <View style={styles.formCard}>
        {renderInputRow('名片别名', 'alias', { last: true })}
      </View>

      <View style={styles.formCard}>
        {renderInputRow('姓名', 'nameZh', { required: true, disabled: !!form.isAuth })}
        {renderInputRow('其他名称', 'nameEn')}
        {renderSelectRow('职位', positionText, () => setPositionModalVisible(true), { last: true })}
      </View>

      <View style={styles.formCard}>
        {renderInputRow('电话', 'phone', { keyboardType: 'phone-pad' })}
        {renderInputRow('传真', 'fax')}
        {renderInputRow('座机', 'telNumber')}
        {renderInputRow('邮箱', 'email', { keyboardType: 'email-address', last: true })}
      </View>

      <View style={styles.formCard}>
        {renderSelectRow(
          '地址',
          form.province
            ? `${form.province}${form.city ? ` ${form.city}` : ''}${form.district ? ` ${form.district}` : ''}`
            : '',
          () => setAreaPickerVisible(true),
        )}
        {renderInputRow('详细地址', 'address', { last: true })}
      </View>

      <View style={styles.formCard}>
        {renderInputRow('个性签名', 'profile', { maxLength: 100, last: true })}
      </View>

      <View style={{ height: scaleSizeW(40) }} />

      {/* 职位选择 Modal */}
      <Modal
        visible={positionModalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setPositionModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>选择职位</Text>
            <ScrollView style={styles.modalScroll}>
              {positionOptions.map((item) => (
                <TouchableOpacity
                  key={item.id}
                  style={styles.positionItem}
                  onPress={() => togglePosition(item.id)}
                >
                  <Text style={styles.positionName}>{item.name}</Text>
                  <View style={[styles.checkbox, selectedPositions.includes(item.id) && styles.checkboxActive]}>
                    {selectedPositions.includes(item.id) && (
                      <Image source={require('@/assets/ming/gou_blue.png')} style={styles.checkIcon} />
                    )}
                  </View>
                </TouchableOpacity>
              ))}
            </ScrollView>
            <TouchableOpacity
              style={styles.modalBtn}
              onPress={() => setPositionModalVisible(false)}
            >
              <Text style={styles.modalBtnText}>确定</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* 省市区选择 */}
      <AreaPicker
        visible={areaPickerVisible}
        onClose={() => setAreaPickerVisible(false)}
        defaultProvince={form.province}
        defaultCity={form.city}
        defaultDistrict={form.district}
        onConfirm={(province, city, district, provinceCode, cityCode, districtCode) => {
          setForm((prev) => ({
            ...prev,
            province,
            city,
            district,
            provinceCode,
            cityCode,
            districtCode,
          }));
        }}
      />
    </View>
  );
});

export default StepOne;

const styles = StyleSheet.create({
  container: {},
  formCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: scaleSizeW(10),
    paddingHorizontal: scaleSizeW(14),
    marginTop: scaleSizeW(10),
  },
  formRow: {
    height: scaleSizeW(55),
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  formLabel: {
    fontSize: setSpText(15),
    fontWeight: '400',
    color: '#000000',
  },
  requiredMark: {
    color: '#EF4444',
  },
  formInput: {
    flex: 1,
    marginLeft: scaleSizeW(16),
    fontSize: setSpText(15),
    fontWeight: '400',
    color: '#000000',
    padding: 0,
  },
  formDivider: {
    height: 1,
    backgroundColor: '#EDECEC',
  },
  selectValueRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: scaleSizeW(4),
    flexShrink: 1,
  },
  selectValue: {
    fontSize: setSpText(15),
    fontWeight: '400',
    color: '#6C6C6C',
    flexShrink: 1,
  },
  selectPlaceholder: {
    fontSize: setSpText(15),
    fontWeight: '400',
    color: '#999999',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#ffffff',
    borderTopLeftRadius: scaleSizeW(16),
    borderTopRightRadius: scaleSizeW(16),
    padding: scaleSizeW(20),
    maxHeight: '70%',
  },
  modalTitle: {
    fontWeight: 'bold',
    fontSize: scaleSizeW(18),
    color: '#000000',
    marginBottom: scaleSizeW(16),
    textAlign: 'center',
  },
  modalScroll: {
    maxHeight: scaleSizeW(300),
  },
  positionItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: scaleSizeW(14),
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#eeeeee',
  },
  positionName: {
    fontSize: scaleSizeW(15),
    color: '#000000',
  },
  checkbox: {
    width: scaleSizeW(22),
    height: scaleSizeW(22),
    borderRadius: scaleSizeW(11),
    borderWidth: 1,
    borderColor: '#eeeeee',
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkboxActive: {
    backgroundColor: '#000000',
    borderColor: '#000000',
  },
  checkIcon: {
    width: scaleSizeW(14),
    height: scaleSizeW(14),
  },
  modalBtn: {
    height: scaleSizeW(42),
    backgroundColor: '#000000',
    borderRadius: scaleSizeW(21),
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: scaleSizeW(16),
  },
  modalBtnText: {
    fontSize: scaleSizeW(15),
    fontWeight: 'bold',
    color: '#ffffff',
  },
});
