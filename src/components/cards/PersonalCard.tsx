import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Image as ExpoImage } from 'expo-image';
import LinearGradient from 'react-native-linear-gradient';
import { BlurView } from '@react-native-community/blur';
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
  /** 编辑预览模式：空字段显示占位文案 */
  placeholder?: boolean;
  /** 分享海报模式：底部直角，与黑色扫码条衔接 */
  squareBottom?: boolean;
}

function fullAddress(data: CardData): string {
  return `${data.province || ''}${data.city || ''}${data.district || ''}${data.address || ''}`;
}

/** 商务风格：白底 + 右侧装饰条；右上角企业 logo，名片未关联企业或无 logo 时不渲染（避免遮挡姓名） */
function BusinessCard({ data, placeholder, squareBottom }: PersonalCardProps) {
  const company = data.cpName || (placeholder ? '企业名称' : '');
  const email = data.email || (placeholder ? 'example@mail.com' : '');
  const address = fullAddress(data) || (placeholder ? '省市区 详细地址' : '');
  return (
    <View style={[styles.container, styles.businessBox, squareBottom && styles.squareBottom]}>
      <View style={styles.decoBox} pointerEvents="none">
        <View style={[styles.decoBar, styles.decoBarBlue]} />
        <View style={[styles.decoBar, styles.decoBarGreen]} />
      </View>
      {/* 名片无企业（无 cpName/cpId）时不显示 LOGO，分享海报同规则（同一渲染链路） */}
      {!!(data.cpLogo && (data.cpName || data.cpId)) && (
        <View style={styles.cpLogo}>
          {/* 磨砂玻璃底（figma 我的名片 image 17：backdrop blur 5px + 白色0.8） */}
          <BlurView
            style={StyleSheet.absoluteFill}
            blurType="light"
            blurAmount={5}
            reducedTransparencyFallbackColor="rgba(255,255,255,0.5)"
          />
          <View style={[StyleSheet.absoluteFill, styles.cpLogoFrost]} pointerEvents="none" />
          <ExpoImage source={{ uri: data.cpLogo }} style={styles.cpLogoImg} contentFit="cover" transition={150} />
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
              {/* 企业名右侧认证 icon（figma 我的名片/创建名片4-1） */}
              <CardVerifiedIcon />
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
function FashionCard({ data, fontColor = '#000000', backColor = '#FFFFFF', placeholder, squareBottom }: PersonalCardProps) {
  const photo = getCardPhoto(data);
  return (
    <View style={[styles.container, styles.fashionBox, squareBottom && styles.squareBottom]}>
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
          <View style={styles.fashionCompanyRow}>
            <Text style={[styles.fashionCompany, { color: fontColor }]} numberOfLines={2}>
              {data.cpName || '企业名称'}
            </Text>
            {/* 企业名右侧认证 icon */}
            <CardVerifiedIcon />
          </View>
        )}
      </View>
    </View>
  );
}

/** 简约风格：整图 + 底部渐变信息（figma 创建名片4-3） */
function SimpleCard({ data, placeholder, squareBottom }: PersonalCardProps) {
  const photo = getCardPhoto(data);
  const company = data.cpName || (placeholder ? '企业名称' : '');
  const position = data.position || (placeholder ? '职位名称' : '');
  return (
    <View style={[styles.container, styles.simpleBox, squareBottom && styles.squareBottom]}>
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
        {(!!company || !!position) && (
          <View style={styles.simpleSubRow}>
            {!!company && (
              <>
                <Text style={styles.simpleSub} numberOfLines={1}>
                  {company}
                </Text>
                {/* 企业名右侧认证 icon */}
                <CardVerifiedIcon />
              </>
            )}
            {!!company && !!position && <Text style={styles.simpleSub}>·</Text>}
            {!!position && (
              <Text style={styles.simpleSub} numberOfLines={1}>
                {position}
              </Text>
            )}
          </View>
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
  squareBottom: {
    borderBottomLeftRadius: 0,
    borderBottomRightRadius: 0,
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
  cpLogo: {
    position: 'absolute',
    right: scaleSizeW(14),
    top: scaleSizeW(21),
    width: scaleSizeW(114),
    height: scaleSizeW(114),
    borderRadius: scaleSizeW(10),
    overflow: 'hidden',
    backgroundColor: 'rgba(255,255,255,0.5)',
  },
  cpLogoFrost: {
    backgroundColor: 'rgba(255,255,255,0.5)',
  },
  cpLogoImg: {
    width: '100%',
    height: '100%',
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
    flexShrink: 1,
  },
  fashionCompanyRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: scaleSizeW(4),
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
    flexShrink: 1,
  },
  simpleSubRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: scaleSizeW(4),
  },
});
