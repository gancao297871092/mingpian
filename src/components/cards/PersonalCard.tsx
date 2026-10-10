import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Image as ExpoImage } from 'expo-image';
import LinearGradient from 'react-native-linear-gradient';
import QRCode from 'react-native-qrcode-svg';
import { scaleSizeW, setSpText } from '@/utils/screenUtils';
import { CardCompanyIcon, CardEmailIcon, CardLocationIcon, CardVerifiedIcon } from './cardIcons';
import { getCardPhoto, normalizeCardStyle, type CardData, type CardStyle } from './types';

interface PersonalCardProps {
  data: CardData;
  /** 不传则按 data.styleCode 推断 */
  style?: CardStyle;
  /** 仅时尚风格生效 */
  fontColor?: string;
  backColor?: string;
  /** 商务风格右下角二维码内容，传空不渲染 */
  qrValue?: string;
  /** 编辑预览模式：空字段显示占位文案 */
  placeholder?: boolean;
}

function fullAddress(data: CardData): string {
  return `${data.province || ''}${data.city || ''}${data.district || ''}${data.address || ''}`;
}

/** 商务风格：白底 + 右侧装饰条 + 二维码（figma 二选一 / 创建名片4-1） */
function BusinessCard({ data, qrValue, placeholder }: PersonalCardProps) {
  const company = data.cpName || (placeholder ? '企业名称' : '');
  const email = data.email || (placeholder ? 'example@mail.com' : '');
  const address = fullAddress(data) || (placeholder ? '省市区 详细地址' : '');
  return (
    <View style={[styles.container, styles.businessBox]}>
      <View style={styles.decoBox} pointerEvents="none">
        <View style={[styles.decoBar, styles.decoBarBlue]} />
        <View style={[styles.decoBar, styles.decoBarGreen]} />
      </View>
      {!!qrValue && (
        <View style={styles.qrBox}>
          <QRCode value={qrValue} size={scaleSizeW(98)} color="#000000" backgroundColor="#FFFFFF" />
        </View>
      )}
      <View style={styles.businessContent}>
        <View>
          <View style={styles.nameRow}>
            <Text style={styles.businessName}>{data.nameZh || (placeholder ? '姓名' : '')}</Text>
            {!!(data.nameEn || placeholder) && (
              <Text style={styles.businessNameEn}>{data.nameEn || '英文名'}</Text>
            )}
          </View>
          {!!(data.position || placeholder) && (
            <Text style={styles.positionText}>{data.position || '职位名称'}</Text>
          )}
        </View>
        <View style={styles.contactCol}>
          {!!company && (
            <View style={styles.contactRow}>
              <View style={styles.contactIconBox}>
                <CardCompanyIcon />
              </View>
              <Text style={styles.contactText} numberOfLines={1}>
                {company}
              </Text>
              {!!data.isAuth && <CardVerifiedIcon />}
            </View>
          )}
          {!!email && (
            <View style={styles.contactRow}>
              <CardEmailIcon />
              <Text style={styles.contactText} numberOfLines={1}>
                {email}
              </Text>
            </View>
          )}
          {!!address && (
            <View style={styles.contactRow}>
              <View style={styles.contactIconBox}>
                <CardLocationIcon />
              </View>
              <Text style={styles.contactText} numberOfLines={1}>
                {address}
              </Text>
            </View>
          )}
        </View>
      </View>
    </View>
  );
}

/** 时尚风格：左图右文，支持文字/背景配色（figma 创建名片4-2） */
function FashionCard({ data, fontColor = '#000000', backColor = '#FFFFFF', placeholder }: PersonalCardProps) {
  const photo = getCardPhoto(data);
  return (
    <View style={[styles.container, styles.fashionBox]}>
      <View style={styles.fashionPhotoBox}>
        {photo ? (
          <ExpoImage source={{ uri: photo }} style={styles.fashionPhoto} contentFit="cover" transition={150} />
        ) : (
          <View style={styles.fashionPhotoEmpty} />
        )}
      </View>
      <View style={[styles.fashionRight, { backgroundColor: backColor }]}>
        <View>
          <Text style={[styles.fashionName, { color: fontColor }]}>
            {data.nameZh || (placeholder ? '姓名' : '')}
          </Text>
          {!!(data.nameEn || placeholder) && (
            <Text style={[styles.fashionNameEn, { color: fontColor }]}>{data.nameEn || '英文名'}</Text>
          )}
          {!!(data.position || placeholder) && (
            <Text style={[styles.fashionPosition, { color: fontColor }]}>
              {data.position || '职位名称'}
            </Text>
          )}
        </View>
        {!!(data.cpName || placeholder) && (
          <Text style={[styles.fashionCompany, { color: fontColor }]} numberOfLines={2}>
            {data.cpName || '企业名称'}
          </Text>
        )}
      </View>
    </View>
  );
}

/** 简约风格：整图 + 底部渐变信息（figma 创建名片4-3） */
function SimpleCard({ data, placeholder }: PersonalCardProps) {
  const photo = getCardPhoto(data);
  const sub = [data.cpName || (placeholder ? '企业名称' : ''), data.position || (placeholder ? '职位名称' : '')]
    .filter(Boolean)
    .join('·');
  return (
    <View style={[styles.container, styles.simpleBox]}>
      {photo ? (
        <ExpoImage source={{ uri: photo }} style={StyleSheet.absoluteFill} contentFit="cover" transition={150} />
      ) : (
        <View style={[StyleSheet.absoluteFill, styles.simplePhotoEmpty]} />
      )}
      <LinearGradient
        colors={['rgba(0,0,0,0)', 'rgba(0,0,0,1)']}
        style={styles.simpleGradient}
        pointerEvents="none"
      />
      <View style={styles.simpleInfo}>
        <View style={styles.nameRow}>
          <Text style={styles.simpleName}>{data.nameZh || (placeholder ? '姓名' : '')}</Text>
          {!!(data.nameEn || placeholder) && (
            <Text style={styles.simpleNameEn}>{data.nameEn || '英文名'}</Text>
          )}
        </View>
        {!!sub && (
          <Text style={styles.simpleSub} numberOfLines={2}>
            {sub}
          </Text>
        )}
      </View>
    </View>
  );
}

export default function PersonalCard(props: PersonalCardProps) {
  const style = props.style ?? normalizeCardStyle(props.data?.styleCode);
  if (style === 'fashion') return <FashionCard {...props} />;
  if (style === 'simple') return <SimpleCard {...props} />;
  return <BusinessCard {...props} />;
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
    borderRadius: scaleSizeW(10),
    overflow: 'hidden',
    backgroundColor: '#FFFFFF',
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: scaleSizeW(6),
  },
  // 商务
  businessBox: {
    height: scaleSizeW(208),
  },
  decoBox: {
    position: 'absolute',
    right: scaleSizeW(6),
    top: 0,
    width: scaleSizeW(122),
    height: scaleSizeW(208),
    overflow: 'hidden',
  },
  decoBar: {
    position: 'absolute',
    left: scaleSizeW(45.6),
    top: scaleSizeW(-41.5),
    width: scaleSizeW(30),
    height: scaleSizeW(275),
  },
  decoBarBlue: {
    backgroundColor: '#2962D4',
    transform: [{ rotate: '-20deg' }],
  },
  decoBarGreen: {
    backgroundColor: '#36BE69',
    transform: [{ rotate: '-5deg' }],
  },
  qrBox: {
    position: 'absolute',
    right: scaleSizeW(14),
    top: scaleSizeW(21),
    width: scaleSizeW(114),
    height: scaleSizeW(114),
    borderRadius: scaleSizeW(10),
    backgroundColor: 'rgba(255,255,255,0.8)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  businessContent: {
    flex: 1,
    paddingTop: scaleSizeW(21),
    paddingBottom: scaleSizeW(17),
    paddingHorizontal: scaleSizeW(14),
    justifyContent: 'space-between',
  },
  businessName: {
    fontSize: setSpText(30),
    fontWeight: '600',
    color: '#000000',
    letterSpacing: -0.4,
  },
  businessNameEn: {
    fontSize: setSpText(12),
    fontWeight: '300',
    color: '#000000',
    letterSpacing: -0.4,
  },
  positionText: {
    fontSize: setSpText(12),
    fontWeight: '300',
    color: '#000000',
    letterSpacing: -0.4,
    marginTop: scaleSizeW(6),
  },
  contactCol: {
    gap: scaleSizeW(5),
    maxWidth: scaleSizeW(200),
  },
  contactRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: scaleSizeW(5),
  },
  contactIconBox: {
    width: scaleSizeW(14),
    height: scaleSizeW(14),
    borderRadius: scaleSizeW(4),
    backgroundColor: '#000000',
    alignItems: 'center',
    justifyContent: 'center',
  },
  contactText: {
    fontSize: setSpText(10),
    fontWeight: '300',
    color: '#000000',
    letterSpacing: -0.4,
    flexShrink: 1,
  },
  // 时尚
  fashionBox: {
    height: scaleSizeW(208),
    flexDirection: 'row',
  },
  fashionPhotoBox: {
    width: scaleSizeW(208),
    height: scaleSizeW(208),
  },
  fashionPhoto: {
    width: '100%',
    height: '100%',
  },
  fashionPhotoEmpty: {
    flex: 1,
    backgroundColor: '#F0F0F0',
  },
  fashionRight: {
    flex: 1,
    paddingTop: scaleSizeW(21),
    paddingBottom: scaleSizeW(20),
    paddingHorizontal: scaleSizeW(14),
    justifyContent: 'space-between',
  },
  fashionName: {
    fontSize: setSpText(25),
    fontWeight: '600',
    letterSpacing: -0.4,
  },
  fashionNameEn: {
    fontSize: setSpText(12),
    fontWeight: '300',
    letterSpacing: -0.4,
    marginTop: scaleSizeW(2),
  },
  fashionPosition: {
    fontSize: setSpText(12),
    fontWeight: '300',
    letterSpacing: -0.4,
    marginTop: scaleSizeW(14),
  },
  fashionCompany: {
    fontSize: setSpText(10),
    fontWeight: '300',
    letterSpacing: -0.4,
  },
  // 简约
  simpleBox: {
    aspectRatio: 1,
  },
  simplePhotoEmpty: {
    backgroundColor: '#E5E5E5',
  },
  simpleGradient: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    height: scaleSizeW(91),
  },
  simpleInfo: {
    position: 'absolute',
    left: scaleSizeW(14),
    right: scaleSizeW(14),
    bottom: scaleSizeW(14),
    gap: scaleSizeW(7),
  },
  simpleName: {
    fontSize: setSpText(25),
    fontWeight: '600',
    color: '#FFFFFF',
    letterSpacing: -0.4,
  },
  simpleNameEn: {
    fontSize: setSpText(12),
    fontWeight: '300',
    color: '#FFFFFF',
    letterSpacing: -0.4,
  },
  simpleSub: {
    fontSize: setSpText(12),
    fontWeight: '300',
    color: '#FFFFFF',
    letterSpacing: -0.4,
  },
});
