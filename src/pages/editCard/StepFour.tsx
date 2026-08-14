import React, { useCallback, useEffect, useState } from 'react';
import {
  Alert,
  Image,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { API } from '@/api';
import { scaleSizeW } from '@/utils/screenUtils';
import Card1 from '@/components/cards/Card1';
import Card2 from '@/components/cards/Card2';
import Card3 from '@/components/cards/Card3';

interface StepFourProps {
  cardId: number | null;
  data: Record<string, any>;
  onNext: (step: number, data?: any) => void;
  onPublish: () => void;
}

export default function StepFour({ cardId, data, onNext, onPublish }: StepFourProps) {
  const [styleCode, setStyleCode] = useState(data.styleCode || 'NORMAL');
  const [fontColor, setFontColor] = useState(data.fontColor || '#ffffff');
  const [backColor, setBackColor] = useState(data.backColor || 'transparent');
  const [styleList, setStyleList] = useState<any[]>([]);
  const [colorList, setColorList] = useState<any[]>([]);

  useEffect(() => {
    loadStyleList();
  }, []);

  const loadStyleList = async () => {
    try {
      const res = await API.common.cardStyle();
      if (res.code === '200') {
        const list = res.data?.styleList || [];
        const colors = res.data?.colorList || [];
        setStyleList(list);
        setColorList(colors);

        // 如果当前 styleCode 不在列表中，默认选中第一个
        const hasMatch = list.some((s: any) => s.styleCode === styleCode);
        if (list[0] && !hasMatch) {
          setStyleCode(list[0].styleCode);
        }

        // 如果当前颜色不在列表中，默认选中第一个配色
        const hasColorMatch = colors.some(
          (c: any) => c.fontColor === fontColor && c.backColor === backColor
        );
        if (colors[0] && !hasColorMatch) {
          setFontColor(colors[0].fontColor || '#ffffff');
          setBackColor(colors[0].backColor || 'transparent');
        }
      }
    } catch (e) {
      // ignore
    }
  };

  const cardInfo = {
    nameZh: data.nameZh || '姓名',
    nameEn: data.nameEn || '',
    position: data.position || '',
    cpName: data.cpName || '企业名称',
    phone: data.phone || '',
    email: data.email || '',
    province: data.province || '',
    city: data.city || '',
    district: data.district || '',
    address: data.address || '',
  };

  const onMake = async () => {
    if (!cardId) return;
    try {
      const res = await API.card.styleCodeSave({
        id: cardId,
        styleCode,
        fontColor,
        backColor,
      });
      if (res.code === '200') {
        onPublish();
      }
    } catch (e) {
      Alert.alert('保存失败');
    }
  };

  return (
    <View style={styles.container}>
      {/* 样式切换 Tab */}
      <View style={styles.navRow}>
        {styleList.map((item) => (
          <TouchableOpacity
            key={item.styleCode}
            style={[styles.navItem, styleCode === item.styleCode && styles.navActive]}
            onPress={() => setStyleCode(item.styleCode)}
          >
            <Text style={[styles.navText, styleCode === item.styleCode && styles.navTextActive]}>
              {item.name}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* 预览区域 */}
      <View style={styles.preview}>
        {styleCode === 'NORMAL' && <Card1 cardInfo={cardInfo} from="edit" />}
        {styleCode === 'TRADITIONAL' && (
          <Card2 cardInfo={cardInfo} colorConfig={{ backColor, fontColor }} from="edit" />
        )}
        {styleCode === 'FASHION' && <Card3 cardInfo={cardInfo} from="edit" />}
      </View>

      {/* TRADITIONAL 配色选择 */}
      {styleCode === 'TRADITIONAL' && (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.colorScroll}
          contentContainerStyle={styles.colorScrollContent}
        >
          {colorList.map((it, ix) => (
            <TouchableOpacity
              key={ix}
              style={[styles.colorBox, { backgroundColor: it.fontColor }]}
              onPress={() => {
                setFontColor(it.fontColor);
                setBackColor(it.backColor);
              }}
            >
              <View
                style={[
                  styles.colorInner,
                  { backgroundColor: it.backColor },
                ]}
              />
              {fontColor === it.fontColor && backColor === it.backColor && (
                <Image source={require('@/assets/ming/gou_blue.png')} style={styles.checkIcon} />
              )}
              {!(fontColor === it.fontColor && backColor === it.backColor) && (
                <View style={styles.colorIndex}>
                  <Text style={styles.colorIndexText}>{ix + 1}</Text>
                </View>
              )}
            </TouchableOpacity>
          ))}
        </ScrollView>
      )}

      <View style={styles.btnRow}>
        <TouchableOpacity style={styles.btnBorder} onPress={() => onNext(3)}>
          <Text style={styles.btnBorderText}>上一步</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.btn} onPress={onMake}>
          <Text style={styles.btnText}>预览主页</Text>
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
  navRow: {
    flexDirection: 'row',
    backgroundColor: '#f6f6f6',
    borderRadius: scaleSizeW(11),
    padding: scaleSizeW(3),
    marginBottom: scaleSizeW(11),
  },
  navItem: {
    flex: 1,
    height: scaleSizeW(28),
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: scaleSizeW(11),
  },
  navActive: {
    backgroundColor: '#000000',
  },
  navText: {
    fontWeight: '500',
    fontSize: scaleSizeW(13),
    color: '#000000',
  },
  navTextActive: {
    color: '#ffffff',
  },
  preview: {
    marginBottom: scaleSizeW(11),
  },
  colorScroll: {
    marginTop: scaleSizeW(11),
    marginBottom: scaleSizeW(11),
  },
  colorScrollContent: {
    paddingRight: scaleSizeW(15),
    gap: scaleSizeW(10),
  },
  colorBox: {
    width: scaleSizeW(60),
    height: scaleSizeW(60),
    borderRadius: scaleSizeW(11),
    overflow: 'hidden',
    position: 'relative',
    borderWidth: 1,
    borderColor: '#f5f5f5',
    justifyContent: 'center',
    alignItems: 'center',
  },
  colorInner: {
    width: scaleSizeW(100),
    height: scaleSizeW(100),
    position: 'absolute',
    transform: [{ rotate: '45deg' }],
  },
  checkIcon: {
    width: scaleSizeW(21),
    height: scaleSizeW(21),
    zIndex: 2,
  },
  colorIndex: {
    width: scaleSizeW(21),
    height: scaleSizeW(21),
    borderRadius: scaleSizeW(11),
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#eeeeee',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 2,
  },
  colorIndexText: {
    fontWeight: '600',
    fontSize: scaleSizeW(11),
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
