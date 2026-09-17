import React from 'react';
import {
  Image,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { Image as ExpoImage } from 'expo-image';
import { scaleSizeH, scaleSizeW, setSpText } from '@/utils/screenUtils';
import { formatLikeCount } from '@/utils/format';
import Svg, { Path } from 'react-native-svg';

export interface WaterfallItem {
  id: string;
  imageUrl: string;
  imageHeight: number;
  title: string;
  avatarUrl: string;
  userName: string;
  companyName: string;
  likeCount: number;
  isLiked: boolean;
  hasVideo?: boolean;
}

export const CARD_WIDTH = scaleSizeW(194);

interface CardProps {
  item: WaterfallItem;
  onToggleLike: (id: string) => void;
  onPress?: (id: string) => void;
}

export default function WaterfallCard({ item, onToggleLike, onPress }: CardProps) {
  return (
    <TouchableOpacity activeOpacity={0.9} style={styles.card} onPress={() => onPress?.(item.id)}>
      {!!item.imageUrl && (
        <ExpoImage
          source={{ uri: item.imageUrl }}
          style={[styles.cardImage, { height: scaleSizeH(item.imageHeight) }]}
          contentFit="cover"
          transition={200}
          cachePolicy="memory-disk"
          recyclingKey={item.imageUrl}
          priority="low"
        />
      )}
      {item.hasVideo && !!item.imageUrl && (
        <View style={styles.videoBadge}>
          <Svg width={scaleSizeW(10)} height={scaleSizeW(10)} viewBox="0 0 10 10">
            <Path d="M2.5 1.5L8 5L2.5 8.5Z" fill="#FFFFFF" />
          </Svg>
          <Text style={styles.videoBadgeText}>含视频</Text>
        </View>
      )}
      <View style={styles.cardContent}>
        {!!item.title
          ? <Text style={styles.cardTitle} numberOfLines={2}>
            {item.title}
          </Text>
          : null}
        <View style={styles.cardMeta}>
          <ExpoImage
            source={{ uri: item.avatarUrl }}
            style={styles.avatar}
            contentFit="cover"
            transition={150}
            cachePolicy="memory-disk"
            recyclingKey={item.avatarUrl}
          />
          <View style={styles.metaText}>
            <Text style={styles.userName} numberOfLines={1}>
              {item.userName}
            </Text>
            <Text style={styles.companyName} numberOfLines={1}>
              {item.companyName}
            </Text>
          </View>
          <TouchableOpacity activeOpacity={0.7} style={styles.likeBtn} onPress={() => onToggleLike(item.id)}>
            <Image
              source={require('@/assets/tab-icons/like-heart.png')}
              style={[styles.likeIcon, item.isLiked && styles.likeIconActive]}
              resizeMode="contain"
            />
            <Text style={[styles.likeCount, item.isLiked && styles.likeCountActive]}>{formatLikeCount(item.likeCount)}</Text>
          </TouchableOpacity>
        </View>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: scaleSizeW(4),
    overflow: 'hidden',
    marginHorizontal: scaleSizeW(2),
    marginBottom: scaleSizeH(5),
  },
  cardImage: {
    width: '100%',
    backgroundColor: '#f5f5f5',
  },
  videoBadge: {
    position: 'absolute',
    top: scaleSizeH(10),
    right: scaleSizeW(5),
    flexDirection: 'row',
    alignItems: 'center',
    gap: scaleSizeW(3),
    height: scaleSizeH(20),
    paddingHorizontal: scaleSizeW(5),
    borderRadius: scaleSizeW(10),
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  videoBadgeText: {
    fontSize: setSpText(10),
    fontWeight: '500',
    lineHeight: scaleSizeH(10),
    color: '#FFFFFF',
  },
  cardContent: {
    paddingHorizontal: scaleSizeW(11),
    paddingTop: scaleSizeH(6),
    paddingBottom: scaleSizeH(12),
  },
  cardTitle: {
    fontSize: setSpText(15),
    fontWeight: '500',
    color: '#333333',
    lineHeight: scaleSizeH(21),
  },
  cardMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: scaleSizeH(12),
  },
  avatar: {
    width: scaleSizeW(27),
    height: scaleSizeW(27),
    borderRadius: scaleSizeW(14),
    backgroundColor: '#f5f5f5',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: '#f5f5f5',
  },
  metaText: {
    flex: 1,
    marginLeft: scaleSizeW(5),
    justifyContent: 'center',
  },
  userName: {
    fontSize: setSpText(12),
    fontWeight: '400',
    color: '#333333',
    lineHeight: scaleSizeH(12),
  },
  companyName: {
    fontSize: setSpText(10),
    fontWeight: '400',
    color: '#6c6c6c',
    lineHeight: scaleSizeH(12),
    marginTop: scaleSizeH(5),
  },
  likeBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    marginLeft: scaleSizeW(8),
  },
  likeIcon: {
    width: scaleSizeW(16),
    height: scaleSizeW(16),
    tintColor: '#666666',
  },
  likeIconActive: {
    tintColor: '#FE2B55',
  },
  likeCount: {
    fontSize: setSpText(12),
    fontWeight: '400',
    color: '#616161',
    marginLeft: scaleSizeW(2),
    lineHeight: scaleSizeH(21),
  },
  likeCountActive: {
    color: '#FE2B55',
  },
});
