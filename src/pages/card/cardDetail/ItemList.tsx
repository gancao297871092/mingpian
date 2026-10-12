import React, { useState } from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Image as ExpoImage } from 'expo-image';
import { scaleSizeW, setSpText } from '@/utils/screenUtils';
import EmptyState from '@/components/EmptyState';
import { ChevronRightIcon } from '@/pages/square/bbsDetail/sheetIcons';

interface ItemListProps {
  project: any;
}

function stripHtml(html?: string): string {
  return (html || '')
    .replace(/<[^>]*>/g, '')
    .replace(/&nbsp;/g, ' ')
    .trim();
}

/** 价值亮点 tab（figma 预览2）：板块卡片，首个默认展开，其余点击展开 */
export default function ItemList({ project }: ItemListProps) {
  const items: any[] = project?.itemsList || [];
  const [expandedId, setExpandedId] = useState<number | string | null>(items[0]?.id ?? null);

  if (!items.length) {
    return <EmptyState variant="content" title="暂无内容" />;
  }

  return (
    <View style={styles.container}>
      {items.map((item, index) => {
        const expanded = (item.id ?? index) === expandedId;
        const images = (item.mediaLinkList || [])
          .map((o: any) => o?.media?.mdUrl || o?.mdUrl)
          .filter(Boolean);
        const contentText = stripHtml(item.itContent);
        return (
          <View key={item.id ?? index} style={styles.card}>
            <TouchableOpacity
              style={styles.cardHeader}
              activeOpacity={0.8}
              onPress={() => setExpandedId(expanded ? null : (item.id ?? index))}
            >
              <View style={styles.titleRow}>
                <View style={styles.titleSquare} />
                <Text style={styles.cardTitle} numberOfLines={1}>
                  {item.itTitle || '板块'}
                </Text>
              </View>
              <View style={expanded ? styles.chevronUp : styles.chevronDown}>
                <ChevronRightIcon />
              </View>
            </TouchableOpacity>
            {expanded && (
              <>
                <View style={styles.divider} />
                {!!contentText && <Text style={styles.content}>{contentText}</Text>}
                {images.length > 0 && (
                  <View style={styles.imgGrid}>
                    {images.map((url: string, ix: number) => (
                      <ExpoImage key={ix} source={{ uri: url }} style={styles.img} contentFit="cover" transition={150} />
                    ))}
                  </View>
                )}
              </>
            )}
          </View>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: scaleSizeW(16),
    paddingTop: scaleSizeW(20),
    gap: scaleSizeW(10),
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#EEEEEE',
    borderRadius: scaleSizeW(10),
    paddingHorizontal: scaleSizeW(14),
  },
  cardHeader: {
    height: scaleSizeW(55),
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: scaleSizeW(3),
    flex: 1,
  },
  titleSquare: {
    width: scaleSizeW(11),
    height: scaleSizeW(11),
    backgroundColor: '#2962D4',
  },
  cardTitle: {
    fontSize: setSpText(14),
    fontWeight: '500',
    color: '#000000',
    flexShrink: 1,
  },
  chevronUp: {
    transform: [{ rotate: '-90deg' }],
  },
  chevronDown: {
    transform: [{ rotate: '90deg' }],
  },
  divider: {
    height: 1,
    backgroundColor: 'rgba(238,238,238,0.93)',
  },
  content: {
    fontSize: setSpText(14),
    fontWeight: '400',
    color: '#000000',
    lineHeight: scaleSizeW(20),
    marginTop: scaleSizeW(10),
  },
  imgGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: scaleSizeW(11),
    marginTop: scaleSizeW(12),
    marginBottom: scaleSizeW(14),
  },
  img: {
    width: scaleSizeW(107),
    height: scaleSizeW(107),
    borderRadius: scaleSizeW(10),
    backgroundColor: '#F5F5F5',
  },
});
