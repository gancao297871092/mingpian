import React from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Image as ExpoImage } from 'expo-image';
import LinearGradient from 'react-native-linear-gradient';
import Toast from 'react-native-toast-message';
import Svg, { Path } from 'react-native-svg';
import EmptyState from '@/components/EmptyState';
import { scaleSizeH, scaleSizeW, setSpText } from '@/utils/screenUtils';

const PRIMARY = '#2962D4';
const GRAY = '#6C6C6C';
const BROWN = '#4C3416';
const GREEN = '#36BE69';

interface CompanyGalleryProps {
  /** 企业主页详情（/company/main），用于核验条与主体信息 */
  main: any;
  /** 可信档案图片分组（/company/gallery，由主页提前请求，切 tab 不再等待） */
  groups: any[];
  groupsLoaded: boolean;
  /** 内容高度变化（外层 FlatList 统一滚动，需要撑开高度） */
  onHeight: (h: number) => void;
}

/** 核验条盾牌图标（figma 企业主页2 1722:5113） */
function ShieldIcon() {
  return (
    <Svg width={scaleSizeW(15)} height={scaleSizeW(15)} viewBox="0 0 15 15" fill="none">
      <Path
        d="M7.5 0L0 2.8v4.2c0 4.6 3.2 8.9 7.5 10 4.3-1.1 7.5-5.4 7.5-10V2.8L7.5 0z"
        fill={BROWN}
      />
      <Path d="M4.2 7.3l2.2 2.2 4.2-4.2" stroke="#FFE4C1" strokeWidth={1.4} strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

/** 「已核验」徽标：绿色圆形对勾 + 文案（figma 企业主页2 1205:4959） */
function VerifiedBadge() {
  return (
    <View style={styles.verifiedBadge}>
      <View style={styles.verifiedCircle}>
        <Svg width={scaleSizeW(6)} height={scaleSizeW(5)} viewBox="0 0 6 5" fill="none">
          <Path d="M1 2.4l1.4 1.4L5 0.6" stroke="#FFFFFF" strokeWidth={1.2} strokeLinecap="round" strokeLinejoin="round" />
        </Svg>
      </View>
      <Text style={styles.verifiedText}>已核验</Text>
    </View>
  );
}

/** 「查看地图」蓝色定位图标（figma 企业主页2 1722:5120） */
function MapPinIcon() {
  return (
    <Svg width={scaleSizeW(10)} height={scaleSizeW(12)} viewBox="0 0 10 12" fill="none">
      <Path
        d="M5 0C2.24 0 0 2.15 0 4.8 0 8.4 5 12 5 12s5-3.6 5-7.2C10 2.15 7.76 0 5 0zm0 6.6A1.8 1.8 0 1 1 5 3a1.8 1.8 0 0 1 0 3.6z"
        fill={PRIMARY}
      />
    </Svg>
  );
}

/** 可信档案 tab（figma 企业主页2）：核验条 + 主体信息工商表 + 横滑图组（公司实拍/资质证书等） */
export default function CompanyGallery({ main, groups, groupsLoaded, onHeight }: CompanyGalleryProps) {
  const verifyTime = main?.verifyTime || main?.checkTime || main?.authTime || '';
  const verified = !!main?.creditCode || main?.verifyStatus === 1;
  const bizRows = [
    { label: '证照类型', value: main?.creditCode ? '营业执照' : '' },
    { label: '登记状态', value: main?.regStatus || '' },
    { label: '企业名称', value: main?.name || '' },
    { label: '信用代码', value: main?.creditCode || '' },
    { label: '法定代表人', value: main?.legalPerson || '' },
    { label: '成立日期', value: main?.establishDate || main?.foundDate || main?.regDate || '' },
    { label: '经营地址', value: main?.businessAddress || main?.address || '' },
  ].filter((r) => !!r.value);

  return (
    <View style={styles.container} onLayout={(e) => onHeight(e.nativeEvent.layout.height)}>
      {verified && (
        <LinearGradient
          colors={['#FEF4E9', '#FFE4C1']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={styles.verifyBar}
        >
          <View style={styles.verifyLeft}>
            <ShieldIcon />
            <Text style={styles.verifyTitle}>企核·实地核查</Text>
          </View>
          {!!verifyTime && <Text style={styles.verifyTime}>核验时间：{verifyTime}</Text>}
        </LinearGradient>
      )}

      {bizRows.length > 0 && (
        <View style={styles.bizSection}>
          <View style={styles.sectionHead}>
            <Text style={styles.sectionTitle}>主体信息</Text>
            {verified && <VerifiedBadge />}
          </View>
          {bizRows.map((r) => (
            <View key={r.label} style={styles.bizRow}>
              <Text style={styles.bizLabel}>{r.label}</Text>
              <Text style={styles.bizValue}>{r.value}</Text>
            </View>
          ))}
          {!!(main?.businessAddress || main?.address) && (
            <TouchableOpacity
              activeOpacity={0.7}
              style={styles.mapLink}
              onPress={() => Toast.show({ type: 'info', text1: '功能开发中' })}
            >
              <MapPinIcon />
              <Text style={styles.mapLinkText}>查看地图</Text>
            </TouchableOpacity>
          )}
        </View>
      )}

      {groups.map((g, gi) => (
        <View key={g.groupId ?? gi} style={styles.group}>
          <View style={styles.sectionHead}>
            <Text style={styles.sectionTitle}>{g.title || ''}</Text>
            {g.verifyStatus === 1 && <VerifiedBadge />}
          </View>
          {!!g.description && <Text style={styles.groupDesc}>{g.description}</Text>}
          {(g.images || []).length > 0 && (
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.groupImages}
            >
              {(g.images || []).map((img: any, ii: number) => (
                <View key={img.imageId ?? ii}>
                  <ExpoImage
                    source={{ uri: img.imageUrl }}
                    recyclingKey={img.imageUrl}
                    style={styles.groupImg}
                    contentFit="cover"
                    transition={150}
                    cachePolicy="memory-disk"
                  />
                  {!!img.title && <Text style={styles.groupImgCaption}>{img.title}</Text>}
                </View>
              ))}
            </ScrollView>
          )}
        </View>
      ))}
      {groupsLoaded && !groups.length && <EmptyState variant="content" title="暂无档案" />}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: scaleSizeW(16),
    paddingTop: scaleSizeH(10),
  },
  verifyBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    height: scaleSizeH(40),
    borderRadius: scaleSizeW(10),
    paddingHorizontal: scaleSizeW(14),
  },
  verifyLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: scaleSizeW(6),
  },
  verifyTitle: {
    fontSize: setSpText(14),
    color: BROWN,
  },
  verifyTime: {
    fontSize: setSpText(12),
    color: BROWN,
  },
  bizSection: {
    marginTop: scaleSizeH(20),
  },
  sectionHead: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: scaleSizeW(8),
  },
  sectionTitle: {
    fontSize: setSpText(14),
    fontWeight: '500',
    color: '#000000',
  },
  verifiedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: scaleSizeW(4),
  },
  verifiedCircle: {
    width: scaleSizeW(12),
    height: scaleSizeW(12),
    borderRadius: scaleSizeW(6),
    backgroundColor: GREEN,
    alignItems: 'center',
    justifyContent: 'center',
  },
  verifiedText: {
    fontSize: setSpText(14),
    color: GREEN,
  },
  bizRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: scaleSizeH(8),
  },
  bizLabel: {
    width: scaleSizeW(90),
    fontSize: setSpText(14),
    lineHeight: setSpText(24),
    color: GRAY,
  },
  bizValue: {
    flex: 1,
    fontSize: setSpText(14),
    lineHeight: setSpText(24),
    color: '#000000',
  },
  mapLink: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-end',
    gap: scaleSizeW(4),
    marginTop: scaleSizeH(6),
  },
  mapLinkText: {
    fontSize: setSpText(12),
    color: PRIMARY,
  },
  group: {
    marginTop: scaleSizeH(24),
  },
  groupDesc: {
    fontSize: setSpText(12),
    lineHeight: setSpText(20),
    color: GRAY,
    marginTop: scaleSizeH(6),
  },
  groupImages: {
    gap: scaleSizeW(10),
    marginTop: scaleSizeH(10),
  },
  groupImg: {
    width: scaleSizeW(210),
    height: scaleSizeW(118),
    borderRadius: scaleSizeW(10),
    backgroundColor: '#F5F5F5',
  },
  groupImgCaption: {
    fontSize: setSpText(12),
    lineHeight: setSpText(20),
    color: GRAY,
    marginTop: scaleSizeH(6),
  },
});
