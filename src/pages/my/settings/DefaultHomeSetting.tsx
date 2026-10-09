import React from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import SafeView from '@/components/SafeView';
import { useSettingStore, type DefaultHome } from '@/store/setting';
import { scaleSizeH, scaleSizeW, setSpText } from '@/utils/screenUtils';
import { CheckCircleIcon } from './subIcons';

const OPTIONS: { key: DefaultHome; label: string; desc: string }[] = [
  { key: 'square', label: '广场', desc: '发现行业新动态' },
  { key: 'link', label: '链接', desc: '快速发现各种机会' },
];

/** 78/79.默认首页设置（本地持久化，MainTabs 启动时读取） */
export default function DefaultHomeSetting() {
  const defaultHome = useSettingStore(s => s.defaultHome);
  const setValue = useSettingStore(s => s.setValue);

  const onSelect = (key: DefaultHome) => {
    setValue('defaultHome', key);
  };

  return (
    <SafeView backgroundColor="#F6F7FB">
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.content}>
        <View style={styles.preview}>
          <View style={styles.phone}>
            <View style={styles.phoneNotch} />
            <Text style={styles.phoneTitle}>{defaultHome === 'square' ? '广场' : '链接'}</Text>
            <View style={styles.phoneTextWrap}>
              <Text style={styles.phoneDesc}>
                {defaultHome === 'square' ? '发现行业新动态' : '快速发现各种机会'}
              </Text>
              <Text style={styles.phoneSubDesc}>
                {defaultHome === 'square' ? '为你推荐可信的产业内容' : '为你连接可信的产业机会'}
              </Text>
            </View>
            {defaultHome === 'square' ? (
              <View style={styles.mockColumns}>
                <View style={styles.mockColumn}>
                  <View style={[styles.mockBlock, styles.mockBlockBlue]} />
                  <View style={styles.mockBlockSmall} />
                </View>
                <View style={styles.mockColumn}>
                  <View style={[styles.mockBlock, styles.mockBlockGreen]} />
                  <View style={styles.mockBlockSmall} />
                </View>
              </View>
            ) : (
              <View style={styles.mockRows}>
                <View style={[styles.mockBar, styles.mockBarBlue]} />
                <View style={[styles.mockBar, styles.mockBarGreen]} />
                <View style={[styles.mockBar, styles.mockBarOrange]} />
                <View style={[styles.mockBar, styles.mockBarRed]} />
              </View>
            )}
          </View>
        </View>

        <View style={styles.options}>
          {OPTIONS.map(opt => {
            const selected = defaultHome === opt.key;
            return (
              <TouchableOpacity
                key={opt.key}
                activeOpacity={0.8}
                style={[styles.optionCard, selected && styles.optionCardSelected]}
                onPress={() => onSelect(opt.key)}
              >
                {selected && (
                  <View style={styles.optionCheck}>
                    <CheckCircleIcon />
                  </View>
                )}
                <Text style={styles.optionLabel}>{opt.label}</Text>
                <Text style={styles.optionDesc}>{opt.desc}</Text>
              </TouchableOpacity>
            );
          })}
        </View>
      </ScrollView>
    </SafeView>
  );
}

const styles = StyleSheet.create({
  content: {
    paddingTop: scaleSizeH(20),
    paddingBottom: scaleSizeH(40),
  },
  preview: {
    marginHorizontal: scaleSizeW(16),
    height: scaleSizeH(289),
    borderRadius: scaleSizeW(10),
    backgroundColor: '#E8EBF5',
    alignItems: 'center',
    overflow: 'hidden',
  },
  phone: {
    marginTop: scaleSizeH(40),
    width: scaleSizeW(205),
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: scaleSizeW(30),
    borderTopRightRadius: scaleSizeW(30),
    borderWidth: 5,
    borderBottomWidth: 0,
    borderColor: '#000000',
    paddingHorizontal: scaleSizeW(20),
  },
  phoneNotch: {
    alignSelf: 'center',
    marginTop: scaleSizeH(12),
    width: scaleSizeW(165),
    height: scaleSizeH(7),
    borderRadius: scaleSizeH(4),
    backgroundColor: '#000000',
  },
  phoneTitle: {
    marginTop: scaleSizeH(20),
    fontSize: setSpText(12),
    fontWeight: '600',
    color: '#2962D4',
  },
  phoneTextWrap: {
    marginTop: scaleSizeH(10),
    gap: scaleSizeH(5),
  },
  phoneDesc: {
    fontSize: setSpText(12),
    color: '#000000',
  },
  phoneSubDesc: {
    fontSize: setSpText(10),
    color: '#6C6C6C',
  },
  mockColumns: {
    flexDirection: 'row',
    gap: scaleSizeW(5),
    marginTop: scaleSizeH(16),
  },
  mockColumn: {
    gap: scaleSizeH(5),
  },
  mockBlock: {
    width: scaleSizeW(78),
    height: scaleSizeH(94),
    borderRadius: scaleSizeW(5),
    opacity: 0.3,
  },
  mockBlockBlue: {
    backgroundColor: '#2962D4',
  },
  mockBlockGreen: {
    backgroundColor: '#36BE69',
  },
  mockBlockSmall: {
    width: scaleSizeW(78),
    height: scaleSizeH(37),
    borderTopLeftRadius: scaleSizeW(5),
    borderTopRightRadius: scaleSizeW(5),
    backgroundColor: '#D9D9D9',
    opacity: 0.3,
  },
  mockRows: {
    marginTop: scaleSizeH(16),
    gap: scaleSizeH(5),
  },
  mockBar: {
    width: scaleSizeW(161),
    height: scaleSizeH(26),
    borderRadius: scaleSizeW(5),
  },
  mockBarBlue: {
    backgroundColor: '#2962D4',
    opacity: 0.3,
  },
  mockBarGreen: {
    backgroundColor: '#36BE69',
    opacity: 0.3,
  },
  mockBarOrange: {
    backgroundColor: '#F2722C',
    opacity: 0.2,
  },
  mockBarRed: {
    backgroundColor: '#FE2955',
    opacity: 0.1,
  },
  options: {
    flexDirection: 'row',
    gap: scaleSizeW(10),
    marginHorizontal: scaleSizeW(16),
    marginTop: scaleSizeH(20),
  },
  optionCard: {
    flex: 1,
    height: scaleSizeH(68),
    borderRadius: scaleSizeW(10),
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    paddingHorizontal: scaleSizeW(12),
    gap: scaleSizeH(5),
  },
  optionCardSelected: {
    borderWidth: 1,
    borderColor: '#2962D4',
  },
  optionCheck: {
    position: 'absolute',
    top: scaleSizeH(14),
    right: scaleSizeW(10),
  },
  optionLabel: {
    fontSize: setSpText(14),
    fontWeight: '500',
    color: '#000000',
  },
  optionDesc: {
    fontSize: setSpText(12),
    color: 'rgba(108,108,108,0.8)',
  },
});
