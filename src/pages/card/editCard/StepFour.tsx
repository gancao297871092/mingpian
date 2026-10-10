import React, { useEffect, useState } from 'react';
import {
  Alert,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { API } from '@/api';
import PersonalCard from '@/components/cards/PersonalCard';
import { CheckWhiteIcon } from '@/components/cards/cardIcons';
import {
  FASHION_COLOR_PRESETS,
  normalizeCardStyle,
  type CardStyle,
  type FashionColor,
} from '@/components/cards/types';
import { scaleSizeW, setSpText } from '@/utils/screenUtils';

interface StepFourProps {
  cardId: number | null;
  data: Record<string, any>;
  onNext: (step: number, data?: any) => void;
  onPublish: () => void;
}

const FALLBACK_STYLES: { styleCode: string; name: string }[] = [
  { styleCode: 'NORMAL', name: '商务' },
  { styleCode: 'TRADITIONAL', name: '时尚' },
  { styleCode: 'FASHION', name: '简约' },
];

export default function StepFour({ cardId, data, onNext, onPublish }: StepFourProps) {
  const [styleCode, setStyleCode] = useState(data.styleCode || 'NORMAL');
  const [fontColor, setFontColor] = useState(data.fontColor || '#000000');
  const [backColor, setBackColor] = useState(data.backColor || '#FFFFFF');
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
        setColorList(colors.length > 0 ? colors : FASHION_COLOR_PRESETS);

        const hasMatch = list.some((s: any) => s.styleCode === styleCode);
        if (list[0] && !hasMatch) {
          setStyleCode(list[0].styleCode);
        }

        const effectiveColors = colors.length > 0 ? colors : FASHION_COLOR_PRESETS;
        const hasColorMatch = effectiveColors.some(
          c => c.fontColor === fontColor && c.backColor === backColor,
        );
        if (!hasColorMatch) {
          setFontColor(effectiveColors[0].fontColor);
          setBackColor(effectiveColors[0].backColor);
        }
      } else {
        setColorList(FASHION_COLOR_PRESETS);
      }
    } catch {
      setColorList(FASHION_COLOR_PRESETS);
    }
  };

  const styleOptions = styleList.length > 0 ? styleList : FALLBACK_STYLES;
  const currentStyle: CardStyle = normalizeCardStyle(
    styleCode,
    styleOptions.find((s: any) => s.styleCode === styleCode)?.name,
  );

  const cardInfo = {
    nameZh: data.nameZh || '',
    nameEn: data.nameEn || '',
    position: data.position || '',
    cpName: data.cpName || '',
    phone: data.phone || '',
    email: data.email || '',
    province: data.province || '',
    city: data.city || '',
    district: data.district || '',
    address: data.address || '',
    mediaLinkList: data.mediaLinkList || [],
    isAuth: data.isAuth,
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
    } catch {
      Alert.alert('保存失败');
    }
  };

  return (
    <View style={styles.container}>
      {/* 风格分段选择（figma 创建名片4-1：商务/时尚/简约） */}
      <View style={styles.segmented}>
        {styleOptions.map((item: any) => {
          const active = styleCode === item.styleCode;
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
          fontColor={fontColor}
          backColor={backColor}
          qrValue={cardId ? `mingpian://cardDetail?id=${cardId}` : ''}
          placeholder
        />
      </View>

      {/* 时尚风格：选择配色（figma 创建名片4-2） */}
      {currentStyle === 'fashion' && (
        <>
          <Text style={styles.colorTitle}>选择配色</Text>
          <ScrollView
            style={styles.colorScroll}
            contentContainerStyle={styles.colorGrid}
            showsVerticalScrollIndicator={false}
          >
            {colorList.map((it, ix) => {
              const active = fontColor === it.fontColor && backColor === it.backColor;
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
    flexDirection: 'row',
    marginTop: scaleSizeW(22),
    gap: scaleSizeW(11),
  },
  btnBorder: {
    flex: 1,
    height: scaleSizeW(48),
    borderRadius: scaleSizeW(24),
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  btnBorderText: {
    fontSize: setSpText(15),
    fontWeight: '500',
    color: '#000000',
  },
  btn: {
    flex: 1,
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
  },
});
