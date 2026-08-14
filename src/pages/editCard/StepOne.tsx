import React, { useCallback, useEffect, useState } from 'react';
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
import { scaleSizeW } from '@/utils/screenUtils';

interface StepOneProps {
  cardId: number | null;
  data: Record<string, any>;
  onNext: (step: number, data?: any) => void;
}

const validatePhone = (phone: string) => {
  if (!phone) return true;
  return /^(\+86)?1[3-9]\d{9}$/.test(phone.trim());
};
const validateEmail = (email: string) => {
  if (!email) return true;
  return /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/.test(email.trim());
};
const validateFax = (fax: string) => {
  if (!fax) return true;
  return /^(\d{3,4}-)?\d{7,8}$|^\d{11}$/.test(fax.trim());
};
const validateTel = (tel: string) => {
  if (!tel) return true;
  return /^(\d{3,4}-)?\d{7,8}$/.test(tel.trim());
};

export default function StepOne({ cardId, data, onNext }: StepOneProps) {
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
  const [isLoading, setIsLoading] = useState(false);
  const [positionModalVisible, setPositionModalVisible] = useState(false);
  const [positionOptions, setPositionOptions] = useState<any[]>(data.positionList || []);
  const [selectedPositions, setSelectedPositions] = useState<number[]>([]);

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
    if (form.fax && !validateFax(form.fax)) {
      Alert.alert('提示', '请输入正确的传真号码');
      return;
    }
    if (form.telNumber && !validateTel(form.telNumber)) {
      Alert.alert('提示', '请输入正确的座机号码');
      return;
    }
    if (form.email && !validateEmail(form.email)) {
      Alert.alert('提示', '请输入正确的邮箱地址');
      return;
    }
    if (form.profile && form.profile.length > 100) {
      Alert.alert('提示', '个性签名字符不能超过100');
      return;
    }

    setIsLoading(true);
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
        const newCardId = res.data?.cardId || cardId;
        onNext(2, { cardId: newCardId, ...form, positionList: payload.positionList });
      }
    } catch (e: any) {
      Alert.alert('保存失败', e?.msg || '请稍后重试');
    } finally {
      setIsLoading(false);
    }
  };

  const renderInput = (
    label: string,
    key: string,
    placeholder: string,
    options?: {
      keyboardType?: any;
      required?: boolean;
      disabled?: boolean;
      maxLength?: number;
      multiline?: boolean;
    },
  ) => {
    const { keyboardType, required, disabled, maxLength, multiline } = options || {};
    return (
      <View style={styles.box}>
        <Text style={styles.boxLabel}>
          {label}
          {required && <Text style={{ color: '#ff0000' }}>*</Text>}
        </Text>
        <TextInput
          style={[styles.boxInput, multiline && styles.boxTextarea]}
          placeholder={placeholder}
          placeholderTextColor="#a3a3a3"
          value={form[key] || ''}
          onChangeText={(text) => updateField(key, text)}
          keyboardType={keyboardType}
          editable={!disabled}
          maxLength={maxLength}
          multiline={multiline}
          textAlignVertical={multiline ? 'top' : 'center'}
        />
        {multiline && (
          <Text style={styles.charCount}>
            {(form[key] || '').length}/100
          </Text>
        )}
      </View>
    );
  };

  return (
    <View style={styles.container}>
      {renderInput('名片别名', 'alias', '输入名片别名，方便您对名片进行区分')}
      <View style={styles.row}>
        <View style={[styles.box, styles.flex1]}>
          <Text style={styles.boxLabel}>
            姓名<Text style={{ color: '#ff0000' }}>*</Text>
          </Text>
          <TextInput
            style={[styles.boxInput, form.isAuth && { color: '#6c6c6c' }]}
            placeholder="请输入姓名"
            placeholderTextColor="#a3a3a3"
            value={form.nameZh || ''}
            onChangeText={(text) => updateField('nameZh', text)}
            editable={!form.isAuth}
          />
        </View>
        <View style={[styles.box, styles.flex1, { marginLeft: scaleSizeW(10) }]}>
          <Text style={styles.boxLabel}>其他名称</Text>
          <TextInput
            style={styles.boxInput}
            placeholder="请输入其他名称"
            placeholderTextColor="#a3a3a3"
            value={form.nameEn || ''}
            onChangeText={(text) => updateField('nameEn', text)}
          />
        </View>
      </View>

      {/* 职位选择 */}
      {positionOptions.length > 0 && (
        <TouchableOpacity style={styles.box} onPress={() => setPositionModalVisible(true)}>
          <Text style={styles.boxLabel}>职位</Text>
          <View style={styles.selectRow}>
            <Text style={positionText ? styles.selectValue : styles.selectPlaceholder}>
              {positionText || '选择'}
            </Text>
            <Image source={require('@/assets/ming/right.png')} style={styles.arrow} />
          </View>
        </TouchableOpacity>
      )}

      {renderInput('电话', 'phone', '请输入联系电话', { keyboardType: 'phone-pad' })}
      {renderInput('传真', 'fax', '请输入传真')}
      {renderInput('座机', 'telNumber', '请输入座机')}
      {renderInput('邮箱', 'email', '请输入邮箱', { keyboardType: 'email-address' })}

      {/* 地址 */}
      <View style={styles.box}>
        <Text style={styles.boxLabel}>地址</Text>
        <View style={styles.addrRow}>
          <TextInput
            style={[styles.boxInput, styles.addrInput]}
            placeholder="省"
            placeholderTextColor="#a3a3a3"
            value={form.province || ''}
            onChangeText={(text) => updateField('province', text)}
          />
          <TextInput
            style={[styles.boxInput, styles.addrInput]}
            placeholder="市"
            placeholderTextColor="#a3a3a3"
            value={form.city || ''}
            onChangeText={(text) => updateField('city', text)}
          />
          <TextInput
            style={[styles.boxInput, styles.addrInput]}
            placeholder="区"
            placeholderTextColor="#a3a3a3"
            value={form.district || ''}
            onChangeText={(text) => updateField('district', text)}
          />
        </View>
      </View>
      {renderInput('详细地址', 'address', '街道、门牌号等')}
      {renderInput('个性签名', 'profile', '请输入个性签名', { multiline: true, maxLength: 100 })}

      <TouchableOpacity
        style={[styles.btn, isLoading && { opacity: 0.6 }]}
        onPress={onSubmit}
        disabled={isLoading}
      >
        <Text style={styles.btnText}>下一步</Text>
      </TouchableOpacity>
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
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingTop: scaleSizeW(8),
  },
  row: {
    flexDirection: 'row',
  },
  flex1: {
    flex: 1,
  },
  box: {
    backgroundColor: '#f9f9f9',
    borderRadius: scaleSizeW(11),
    marginTop: scaleSizeW(11),
    paddingHorizontal: scaleSizeW(16),
    paddingVertical: scaleSizeW(12),
    minHeight: scaleSizeW(70),
  },
  boxLabel: {
    fontWeight: '500',
    fontSize: scaleSizeW(13),
    color: '#6c6c6c',
  },
  boxInput: {
    fontWeight: 'bold',
    fontSize: scaleSizeW(15),
    color: '#000000',
    marginTop: scaleSizeW(4),
    padding: 0,
    minHeight: scaleSizeW(24),
  },
  boxTextarea: {
    height: scaleSizeW(90),
    marginBottom: scaleSizeW(20),
  },
  charCount: {
    position: 'absolute',
    bottom: scaleSizeW(10),
    right: scaleSizeW(16),
    fontSize: scaleSizeW(11),
    color: '#b4b4b9',
  },
  selectRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: scaleSizeW(4),
  },
  selectValue: {
    fontWeight: 'bold',
    fontSize: scaleSizeW(15),
    color: '#000000',
    flex: 1,
  },
  selectPlaceholder: {
    fontWeight: 'bold',
    fontSize: scaleSizeW(15),
    color: '#a3a3a3',
    flex: 1,
  },
  arrow: {
    width: scaleSizeW(16),
    height: scaleSizeW(16),
  },
  addrRow: {
    flexDirection: 'row',
    marginTop: scaleSizeW(4),
    gap: scaleSizeW(8),
  },
  addrInput: {
    flex: 1,
    minHeight: scaleSizeW(24),
  },
  btn: {
    height: scaleSizeW(42),
    backgroundColor: '#000000',
    borderRadius: scaleSizeW(21),
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: scaleSizeW(22),
  },
  btnText: {
    fontSize: scaleSizeW(15),
    fontWeight: 'bold',
    color: '#ffffff',
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
