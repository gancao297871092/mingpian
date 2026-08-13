import React from 'react';
import { Image, ImageBackground, StyleSheet, Text, View } from 'react-native';
import { scaleSizeW } from '@/utils/screenUtils';

interface Card1Props {
  cardInfo: any;
  from?: 'edit' | 'show';
}

export default function Card1({ cardInfo, from = 'show' }: Card1Props) {
  if (!cardInfo) return null;
  const isEdit = from === 'edit';

  return (
    <ImageBackground
      source={require('@/assets/ming/card_bg1.png')}
      style={styles.container}
      imageStyle={styles.bgImage}
    >
      <View style={styles.content}>
        <View style={styles.topRow}>
          <View style={styles.flex1}>
            <View style={styles.nameRow}>
              <Text style={styles.name}>{cardInfo.nameZh}</Text>
              <Text style={styles.enName}>
                {isEdit ? `/ ${cardInfo.nameEn || '英文名'}` : cardInfo.nameEn}
              </Text>
            </View>
            <Text style={styles.position}>
              {isEdit ? `${cardInfo.position || '职位名称'}` : cardInfo.position}
            </Text>
          </View>
        </View>

        <Text style={styles.company} numberOfLines={2}>
          {cardInfo.cpName || (isEdit ? '企业名称' : '')}
        </Text>

        <View style={styles.bottomRow}>
          <View>
            {cardInfo.email ? (
              <View style={styles.infoRow}>
                <Image source={require('@/assets/ming/45.png')} style={styles.icon} />
                <Text style={styles.infoText}>{cardInfo.email}</Text>
              </View>
            ) : null}
            {cardInfo.province ? (
              <View style={styles.infoRow}>
                <Image source={require('@/assets/ming/46.png')} style={styles.icon} />
                <Text style={styles.infoText} numberOfLines={2}>
                  {cardInfo.province + cardInfo.city + cardInfo.district + (cardInfo.address || '')}
                </Text>
              </View>
            ) : null}
          </View>
          {cardInfo.cpLogo ? (
            <Image source={{ uri: cardInfo.cpLogo }} style={styles.logo} />
          ) : isEdit ? (
            <View style={styles.logoPlaceholder}>
              <Text style={styles.logoText}>LOGO</Text>
            </View>
          ) : null}
        </View>
      </View>
    </ImageBackground>
  );
}

const styles = StyleSheet.create({
  container: {
    height: scaleSizeW(214),
    borderRadius: scaleSizeW(11),
    overflow: 'hidden',
    width: '100%',
  },
  bgImage: {
    borderRadius: scaleSizeW(11),
  },
  content: {
    flex: 1,
    paddingTop: scaleSizeW(31),
    paddingRight: scaleSizeW(23),
    paddingBottom: scaleSizeW(21),
    paddingLeft: scaleSizeW(28),
    justifyContent: 'space-between',
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  flex1: {
    flex: 1,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
  },
  name: {
    fontWeight: '600',
    fontSize: scaleSizeW(26),
    color: '#000000',
  },
  enName: {
    fontWeight: '500',
    fontSize: scaleSizeW(13),
    color: '#000000',
    marginLeft: scaleSizeW(5),
  },
  position: {
    fontWeight: '500',
    fontSize: scaleSizeW(11),
    color: 'rgba(0,0,0,0.5)',
    marginTop: scaleSizeW(2),
  },
  company: {
    fontWeight: 'bold',
    fontSize: scaleSizeW(13),
    color: '#000000',
    maxWidth: '90%',
    marginBottom: scaleSizeW(11),
  },
  bottomRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: scaleSizeW(5),
  },
  icon: {
    width: scaleSizeW(13),
    height: scaleSizeW(13),
    marginRight: scaleSizeW(3),
    transform: [{ translateY: scaleSizeW(2) }],
  },
  infoText: {
    fontWeight: '500',
    fontSize: scaleSizeW(11),
    color: '#666666',
    flex: 1,
  },
  logo: {
    width: scaleSizeW(43),
    height: scaleSizeW(43),
    borderRadius: scaleSizeW(5),
    flexShrink: 0,
  },
  logoPlaceholder: {
    width: scaleSizeW(43),
    height: scaleSizeW(43),
    backgroundColor: '#292929',
    borderRadius: scaleSizeW(5),
    justifyContent: 'center',
    alignItems: 'center',
    flexShrink: 0,
  },
  logoText: {
    fontWeight: '600',
    fontSize: scaleSizeW(11),
    color: '#ffffff',
  },
});
