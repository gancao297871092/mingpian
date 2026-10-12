import React, { forwardRef, useEffect, useImperativeHandle, useState } from 'react';
import {
  Alert,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { API } from '@/api';
import PersonalCard from '@/components/cards/PersonalCard';
import { CheckWhiteIcon } from '@/components/cards/cardIcons';
import {
  normalizeCardStyle,
  type CardStyle,
  type FashionColor,
} from '@/components/cards/types';
import { scaleSizeW, setSpText } from '@/utils/screenUtils';
import type { RootStackParamList } from '@/route/map';
import type { StepHandle } from './types';

interface StepFourProps {
  cardId: number | null;
  data: Record<string, any>;
  onNext: (step: number, data?: any) => void;
  isEdit: boolean;
}

const FALLBACK_STYLES: { styleCode: string; name: string }[] = [
  { styleCode: 'NORMAL', name: '商务' },
  { styleCode: 'TRADITIONAL', name: '时尚' },
  { styleCode: 'FASHION', name: '简约' },
];

const StepFour = forwardRef<StepHandle, StepFourProps>(function StepFourForm({ cardId, data, isEdit }, ref) {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const [styleCode, setStyleCode] = useState<string | null>(data.styleCode || null);
  const [fontColor, setFontColor] = useState<string | null>(data.fontColor || null);
  const [backColor, setBackColor] = useState<string | null>(data.backColor || null);
  const [styleList, setStyleList] = useState<any[]>([]);
  const [colorList, setColorList] = useState<FashionColor[]>([]);

  useEffect(() => {
    loadStyleList();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const loadStyleList = async () => {
    try {
      const res = await API.common.cardStyle();
      if (res.code === '200') {
        const list = res.data?.styleList || [];
        const colors: FashionColor[] = (res.data?.colorList || []).map((c: any) => ({
          name: c.name || c.colorName || '',
          fontColor: c.fontColor || '#000000',
          backColor: c.backColor || '#FFFFFF',
        }));
        setStyleList(list);
        setColorList(colors);

        // 对齐小程序：无风格或风格不在列表中（如草稿默认 style1）时默认第一个；无配色时默认第一组
        if (list[0] && !list.some((s: any) => s.styleCode === styleCode)) {
          setStyleCode(list[0].styleCode);
        }
        if (!fontColor && !backColor && colors[0]) {
          setFontColor(colors[0].fontColor || '#fff');
          setBackColor(colors[0].backColor || 'transparent');
        }
      }
    } catch {
      // ignore
    }
  };

  const styleOptions = styleList.length > 0 ? styleList : FALLBACK_STYLES;
  // 草稿默认 styleCode=style1 等不在风格列表中时，兜底选中第一个，保证有默认 tab
  const effectiveStyleCode = styleOptions.some((s: any) => s.styleCode === styleCode)
    ? (styleCode as string)
    : styleOptions[0]?.styleCode || 'NORMAL';
  const effectiveFontColor = fontColor || '#000000';
  const effectiveBackColor = backColor || '#FFFFFF';
  const currentStyle: CardStyle = normalizeCardStyle(
    effectiveStyleCode,
    styleOptions.find((s: any) => s.styleCode === effectiveStyleCode)?.name,
  );

  const cardInfo = {
    nameZh: data.nameZh || '',
    nameEn: data.nameEn || '',
    position:
      data.position ||
      (data.positionList || [])
        .filter((o: any) => o.isCheck)
        .map((o: any) => o.name)
        .join(','),
    cpName: data.cpName || '',
    phone: data.phone || '',
    email: data.email || '',
    province: data.province || '',
    city: data.city || '',
    district: data.district || '',
    address: data.address || '',
    mediaLinkList: data.mediaList || data.mediaLinkList || [],
    isAuth: data.isAuth,
  };

  const onMake = async () => {
    if (!cardId) return;
    try {
      const res = await API.card.styleCodeSave({
        id: cardId,
        styleCode: effectiveStyleCode,
        fontColor: effectiveFontColor,
        backColor: effectiveBackColor,
      });
      if (res.code === '200') {
        // 对齐小程序：保存风格后跳转预览主页，在预览页确认发布
        navigation.navigate('viewCard', { id: cardId, mode: isEdit ? 'update' : 'add' });
      }
    } catch {
      Alert.alert('保存失败');
    }
  };

  useImperativeHandle(ref, () => ({ submit: onMake }));

  return (
    <View style={styles.container}>
      {/* 风格分段选择（figma 创建名片4-1：商务/时尚/简约） */}
      <View style={styles.segmented}>
        {styleOptions.map((item: any) => {
          const active = effectiveStyleCode === item.styleCode;
          return (
            <TouchableOpacity
              key={item.styleCode}
              activeOpacity={0.8}
              style={[styles.segmentItem, active && styles.segmentItemActive]}
              onPress={() => setStyleCode(item.styleCode)}
            >
              <Text style={[styles.segmentText, active && styles.segmentTextActive]}>
                {item.name}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>

      {/* 名片预览 */}
      <View style={styles.preview}>
        <PersonalCard
          data={cardInfo}
          style={currentStyle}
          fontColor={effectiveFontColor}
          backColor={effectiveBackColor}
          placeholder
        />
      </View>

      {/* 时尚风格：选择配色（figma 创建名片4-2；对齐小程序 TRADITIONAL 才显示配色） */}
      {currentStyle === 'fashion' && colorList.length > 0 && (
        <>
          <Text style={styles.colorTitle}>选择配色</Text>
          <ScrollView
            style={styles.colorScroll}
            contentContainerStyle={styles.colorGrid}
            showsVerticalScrollIndicator={false}
          >
            {colorList.map((it, ix) => {
              const active = effectiveFontColor === it.fontColor && effectiveBackColor === it.backColor;
              return (
                <TouchableOpacity
                  key={`${it.fontColor}-${ix}`}
                  activeOpacity={0.8}
                  style={[styles.colorCard, active && styles.colorCardActive]}
                  onPress={() => {
                    setFontColor(it.fontColor);
                    setBackColor(it.backColor);
                  }}
                >
                  <View style={[styles.colorSwatch, { backgroundColor: it.fontColor }]} />
                  <View style={styles.colorTextCol}>
                    <Text style={styles.colorName}>{it.name || `配色${ix + 1}`}</Text>
                    <Text style={styles.colorHex}>{it.fontColor}</Text>
                  </View>
                  <View style={[styles.colorCheck, active && styles.colorCheckActive]}>
                    {active && <CheckWhiteIcon />}
                  </View>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        </>
      )}

      <View style={styles.btnRow}>
        <TouchableOpacity style={styles.btn} activeOpacity={0.8} onPress={onMake}>
          <Text style={styles.btnText}>预览主页</Text>
        </TouchableOpacity>
      </View>
      <View style={{ height: scaleSizeW(40) }} />
    </View>
  );
});

export default StepFour;

const styles = StyleSheet.create({
  container: {
    paddingTop: scaleSizeW(8),
  },
  segmented: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    borderRadius: scaleSizeW(100),
    padding: scaleSizeW(2),
    gap: scaleSizeW(4),
    marginBottom: scaleSizeW(20),
  },
  segmentItem: {
    flex: 1,
    height: scaleSizeW(28),
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: scaleSizeW(20),
    paddingHorizontal: scaleSizeW(6),
  },
  segmentItemActive: {
    backgroundColor: '#000000',
  },
  segmentText: {
    fontWeight: '500',
    fontSize: setSpText(13),
    color: '#000000',
    letterSpacing: -0.2,
  },
  segmentTextActive: {
    color: '#FFFFFF',
  },
  preview: {
    marginBottom: scaleSizeW(16),
  },
  colorTitle: {
    fontSize: setSpText(12),
    fontWeight: '400',
    color: '#6C6C6C',
    marginBottom: scaleSizeW(10),
  },
  colorScroll: {
    flexGrow: 0,
  },
  colorGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: scaleSizeW(10),
  },
  colorCard: {
    width: '48.6%',
    height: scaleSizeW(70),
    borderRadius: scaleSizeW(10),
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#FFFFFF',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: scaleSizeW(14),
  },
  colorCardActive: {
    borderColor: '#2962D4',
  },
  colorSwatch: {
    width: scaleSizeW(10),
    height: scaleSizeW(10),
    marginRight: scaleSizeW(10),
  },
  colorTextCol: {
    gap: scaleSizeW(6),
    flexShrink: 1,
  },
  colorName: {
    fontSize: setSpText(14),
    fontWeight: '400',
    color: '#000000',
  },
  colorHex: {
    fontSize: setSpText(12),
    fontWeight: '400',
    color: '#6C6C6C',
  },
  colorCheck: {
    position: 'absolute',
    right: scaleSizeW(10),
    top: scaleSizeW(25),
    width: scaleSizeW(20),
    height: scaleSizeW(20),
    borderRadius: scaleSizeW(10),
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#EBEBEB',
    alignItems: 'center',
    justifyContent: 'center',
  },
  colorCheckActive: {
    backgroundColor: '#2962D4',
    borderColor: '#2962D4',
  },
  btnRow: {
    marginTop: scaleSizeW(22),
  },
  btn: {
    height: scaleSizeW(48),
    backgroundColor: '#FFFFFF',
    borderRadius: scaleSizeW(24),
    justifyContent: 'center',
    alignItems: 'center',
  },
  btnText: {
    fontSize: setSpText(15),
    fontWeight: '500',
    color: '#000000',
    letterSpacing: -0.4,
  },
});
