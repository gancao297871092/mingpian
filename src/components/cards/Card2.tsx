import React from 'react';
import { Image, StyleSheet, Text, View } from 'react-native';
import { numTokw } from '@/utils/format';
import { scaleSizeW } from '@/utils/screenUtils';

interface Card2Props {
  cardInfo: any;
  colorConfig?: { backColor?: string; fontColor?: string };
  from?: 'edit' | 'show';
}

export default function Card2({ cardInfo, colorConfig, from = 'show' }: Card2Props) {
  if (!cardInfo) return null;
  const isEdit = from === 'edit';
  const backColor = colorConfig?.backColor || 'transparent';
  const fontColor = colorConfig?.fontColor || '#ffffff';

  const poster =
    from === 'show'
      ? cardInfo?.cardPoster || ''
      : cardInfo?.mediaLinkList?.length > 0
        ? (cardInfo.mediaLinkList.find((o: any) => o.isIndex)?.media?.mdUrl ||
           cardInfo.mediaLinkList[0]?.media?.mdUrl)
        : '';

  return (
    <View style={styles.container}>
      {/* 左侧装饰图 */}
      <Image source={require('@/assets/ming/card_bg2.png')} style={styles.leftBg} />

      {/* 左侧海报图 */}
      <View style={styles.left}>
        {poster ? (
          <Image source={{ uri: poster }} style={styles.poster} resizeMode="cover" />
        ) : null}
      </View>

      {/* 右侧信息 */}
      <View style={[styles.right, { backgroundColor: backColor }]}>
        <View>
          <Text style={[styles.name, { color: fontColor }]}>{cardInfo.nameZh}</Text>
          <Text style={[styles.enName, { color: fontColor }]}>
            {isEdit
              ? `${cardInfo.nameEn?.trimStart() || '英文名'}`
              : cardInfo.nameEn?.trimStart()
                ? cardInfo.nameEn
                : ' '}
          </Text>
        </View>

        <View>
          <Text style={[styles.position, { color: fontColor }]}>
            {cardInfo.position || (isEdit ? '职位名称' : '')}
          </Text>
          <Text style={[styles.cpName, { color: fontColor }]}>
            {isEdit
              ? `@${cardInfo.cpName || '企业名称'}`
              : cardInfo.cpName
                ? '@' + cardInfo.cpName
                : ''}
          </Text>
        </View>

        {!isEdit && (
          <View style={styles.statsRow}>
            <View style={styles.statItem}>
              <Image source={require('@/assets/ming/like_new.png')} style={styles.statIcon} />
              <Text style={[styles.statText, { color: fontColor }]}>
                {numTokw(cardInfo.countFavorite)}
              </Text>
            </View>
            <View style={styles.statItem}>
              <Image source={require('@/assets/ming/eyes_new.png')} style={styles.statIcon} />
              <Text style={[styles.statText, { color: fontColor }]}>
                {numTokw(cardInfo.countBrowse)}
              </Text>
            </View>
          </View>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    height: scaleSizeW(214),
    borderRadius: scaleSizeW(11),
    overflow: 'hidden',
    backgroundColor: '#000000',
    flexDirection: 'row',
    width: '100%',
  },
  leftBg: {
    width: scaleSizeW(214),
    height: scaleSizeW(214),
    position: 'absolute',
    left: 0,
    top: 0,
    zIndex: 1,
  },
  left: {
    width: scaleSizeW(214),
    height: scaleSizeW(214),
    zIndex: 2,
  },
  poster: {
    width: '100%',
    height: '100%',
  },
  right: {
    flex: 1,
    paddingHorizontal: scaleSizeW(16),
    paddingTop: scaleSizeW(21),
    paddingBottom: scaleSizeW(12),
    justifyContent: 'space-between',
    zIndex: 2,
  },
  name: {
    fontWeight: '600',
    fontSize: scaleSizeW(26),
    lineHeight: scaleSizeW(32),
  },
  enName: {
    marginTop: scaleSizeW(6),
    fontWeight: '500',
    fontSize: scaleSizeW(11),
    minHeight: scaleSizeW(11),
    opacity: 0.5,
  },
  position: {
    marginTop: scaleSizeW(19),
    fontWeight: '500',
    fontSize: scaleSizeW(11),
    minHeight: scaleSizeW(11),
    opacity: 0.5,
  },
  cpName: {
    marginTop: scaleSizeW(10),
    fontWeight: '500',
    fontSize: scaleSizeW(11),
    minHeight: scaleSizeW(11),
    opacity: 0.5,
  },
  statsRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: scaleSizeW(11),
  },
  statIcon: {
    width: scaleSizeW(16),
    height: scaleSizeW(16),
  },
  statText: {
    fontWeight: '500',
    fontSize: scaleSizeW(11),
    marginLeft: scaleSizeW(2),
    opacity: 0.5,
  },
});
