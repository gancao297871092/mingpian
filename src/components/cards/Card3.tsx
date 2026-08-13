import React from 'react';
import { Dimensions, Image, ImageBackground, StyleSheet, Text, View } from 'react-native';
import { numTokw } from '@/utils/format';
import { scaleSizeW } from '@/utils/screenUtils';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

interface Card3Props {
  cardInfo: any;
  from?: 'edit' | 'show';
  onShare?: () => void;
  onDel?: () => void;
  onEdit?: () => void;
}

export default function Card3({ cardInfo, from = 'show', onShare, onDel, onEdit }: Card3Props) {
  if (!cardInfo) return null;
  const isEdit = from === 'edit';

  const poster =
    from === 'show'
      ? cardInfo?.cardPoster || ''
      : cardInfo?.mediaLinkList?.length > 0
        ? (cardInfo.mediaLinkList.find((o: any) => o.isIndex)?.media?.mdUrl ||
           cardInfo.mediaLinkList[0]?.media?.mdUrl)
        : '';

  // 小程序：height: calc(100vw - 58rpx)
  const cardHeight = SCREEN_WIDTH - scaleSizeW(31);

  return (
    <View style={[styles.container, { height: cardHeight }]}>
      <ImageBackground
        source={poster ? { uri: poster } : require('@/assets/ming/card_bg3.png')}
        style={styles.bg}
        imageStyle={styles.bgImage}
      >
        {!isEdit && (
          <View style={styles.actions}>
            {onDel && (
              <Image source={require('@/assets/ming/del_3.png')} style={styles.actionIcon} />
            )}
            {onShare && (
              <Image source={require('@/assets/ming/share_new.png')} style={styles.actionIcon} />
            )}
            {onEdit && (
              <Image source={require('@/assets/ming/10.png')} style={styles.actionIcon} />
            )}
          </View>
        )}

        <View style={styles.footer}>
          <Image
            source={require('@/assets/ming/card_b.png')}
            style={styles.footerBg}
            resizeMode="stretch"
          />
          <View style={styles.footerContent}>
            <View>
              <Text style={styles.subTitle}>
                {cardInfo.cpName || (isEdit ? '企业名称' : '')}
                {isEdit
                  ? `.${cardInfo.position || '职位名称'}`
                  : cardInfo.position
                    ? `.${cardInfo.position}`
                    : ''}
              </Text>
              <Text style={styles.name}>{cardInfo.nameZh}</Text>
            </View>
            {!isEdit && (
              <View style={styles.stats}>
                <View style={styles.statItem}>
                  <Image source={require('@/assets/ming/16.png')} style={styles.statIcon} />
                  <Text style={styles.statText}>{numTokw(cardInfo.countFavorite)}</Text>
                </View>
                <View style={styles.statItem}>
                  <Image source={require('@/assets/ming/17.png')} style={styles.statIcon} />
                  <Text style={styles.statText}>{numTokw(cardInfo.countBrowse)}</Text>
                </View>
              </View>
            )}
          </View>
        </View>
      </ImageBackground>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    borderRadius: scaleSizeW(11),
    overflow: 'hidden',
    width: '100%',
  },
  bg: {
    flex: 1,
    borderRadius: scaleSizeW(11),
    overflow: 'hidden',
  },
  bgImage: {
    borderRadius: scaleSizeW(11),
  },
  actions: {
    position: 'absolute',
    top: 0,
    right: 0,
    padding: scaleSizeW(10),
    flexDirection: 'row',
    justifyContent: 'flex-end',
    zIndex: 3,
    width: '100%',
  },
  actionIcon: {
    width: scaleSizeW(32),
    height: scaleSizeW(32),
    marginRight: scaleSizeW(10),
  },
  footer: {
    height: scaleSizeW(128),
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    zIndex: 3,
  },
  footerBg: {
    width: '100%',
    height: '100%',
    position: 'absolute',
  },
  footerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    paddingHorizontal: scaleSizeW(15),
    paddingBottom: scaleSizeW(10),
    flex: 1,
  },
  subTitle: {
    fontWeight: '500',
    fontSize: scaleSizeW(12),
    color: 'rgba(255,255,255,0.5)',
  },
  name: {
    fontWeight: '600',
    fontSize: scaleSizeW(18),
    color: '#ffffff',
    marginBottom: scaleSizeW(10),
  },
  stats: {
    flexDirection: 'row',
  },
  statItem: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: scaleSizeW(15),
    height: scaleSizeW(64),
  },
  statIcon: {
    width: scaleSizeW(21),
    height: scaleSizeW(21),
  },
  statText: {
    fontWeight: '500',
    fontSize: scaleSizeW(13),
    color: '#ffffff',
    marginTop: scaleSizeW(5),
  },
});
