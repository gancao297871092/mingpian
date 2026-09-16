import React from 'react';
import {
  Image,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { scaleSizeH, scaleSizeW, setSpText } from '@/utils/screenUtils';
import { formatLikeCount } from '@/utils/format';

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
}

export const CARD_WIDTH = scaleSizeW(194);

interface CardProps {
  item: WaterfallItem;
  onToggleLike: (id: string) => void;
}

export default function WaterfallCard({ item, onToggleLike }: CardProps) {
  return (
    <View style={styles.card}>
      <Image source={{ uri: item.imageUrl }} style={[styles.cardImage, { height: scaleSizeH(item.imageHeight) }]} resizeMode="cover" />
      <View style={styles.cardContent}>
        <Text style={styles.cardTitle} numberOfLines={2}>
          {item.title}
        </Text>
        <View style={styles.cardMeta}>
          <Image source={{ uri: item.avatarUrl }} style={styles.avatar} />
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
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    width: CARD_WIDTH,
    backgroundColor: '#ffffff',
    marginBottom: scaleSizeH(5),
  },
  cardImage: {
    width: CARD_WIDTH,
    backgroundColor: '#f5f5f5',
  },
  cardContent: {
    paddingHorizontal: scaleSizeW(11),
    paddingTop: scaleSizeH(6),
    paddingBottom: scaleSizeH(10),
  },
  cardTitle: {
    fontSize: setSpText(15),
    fontWeight: '400',
    color: '#333333',
    lineHeight: scaleSizeH(21),
    minHeight: scaleSizeH(41),
  },
  cardMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: scaleSizeH(8),
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
    lineHeight: scaleSizeH(16),
  },
  companyName: {
    fontSize: setSpText(10),
    fontWeight: '400',
    color: '#6c6c6c',
    lineHeight: scaleSizeH(14),
    marginTop: scaleSizeH(1),
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
