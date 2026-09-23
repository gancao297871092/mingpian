import React, { useState } from 'react';
import { Alert, Image, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import Video from 'react-native-video';
import Svg, { Path } from 'react-native-svg';
import SafeView from '@/components/SafeView';
import EmptyState from '@/components/EmptyState';
import { deleteDraft, formatDraftTime, listDrafts, LocalDraft } from '@/utils/draftStore';
import { scaleSizeH, scaleSizeW } from '@/utils/screenUtils';
import type { RootStackParamList } from '@/route/map';

const PRIMARY = '#2962D4';
const TEXT_SUB = '#616161';
const INFO_BG = '#E3EDFF';

const COLUMN_W = scaleSizeW(194);
const COVER_TALL = scaleSizeW(237);
const COVER_SHORT = scaleSizeW(130);

function TipIcon() {
  return (
    <Svg width={scaleSizeW(16)} height={scaleSizeW(16)} viewBox="0 0 16 16">
      <Path
        d="M0.96 8C0.96 8.92 1.14 9.84 1.5 10.69C1.85 11.55 2.37 12.32 3.02 12.98C3.68 13.63 4.45 14.15 5.31 14.5C6.16 14.86 7.08 15.04 8 15.04C8.92 15.04 9.84 14.86 10.69 14.5C11.55 14.15 12.32 13.63 12.98 12.98C13.63 12.32 14.15 11.55 14.5 10.69C14.86 9.84 15.04 8.92 15.04 8C15.04 6.13 14.3 4.34 12.98 3.02C11.66 1.7 9.87 0.96 8 0.96C6.13 0.96 4.34 1.7 3.02 3.02C1.7 4.34 0.96 6.13 0.96 8Z"
        fill={PRIMARY}
      />
      <Path
        d="M8 11.2C8.28 11.2 8.55 11.31 8.75 11.51C8.94 11.71 9.04 11.97 9.04 12.24C9.04 12.52 8.94 12.78 8.75 12.97C8.55 13.17 8.28 13.28 8 13.28C7.72 13.28 7.46 13.17 7.26 12.97C7.06 12.78 6.96 12.52 6.96 12.24C6.96 11.97 7.06 11.71 7.26 11.51C7.46 11.31 7.72 11.2 8 11.2ZM8 3.52C8.28 3.52 8.54 3.62 8.74 3.82C8.94 4.02 9.04 4.28 9.04 4.56V9.6C9.04 9.88 8.94 10.14 8.74 10.34C8.54 10.54 8.28 10.64 8 10.64C7.72 10.64 7.46 10.54 7.26 10.34C7.06 10.14 6.96 9.88 6.96 9.6V4.56C6.96 4.28 7.06 4.02 7.26 3.82C7.46 3.62 7.72 3.52 8 3.52Z"
        fill="#FFFFFF"
      />
    </Svg>
  );
}

function TrashIcon() {
  return (
    <Svg width={scaleSizeW(16)} height={scaleSizeW(16)} viewBox="0 0 16 16" fill="none">
      <Path
        d="M13.73 4.04H13.09V14.22C13.09 14.92 12.52 15.49 11.82 15.49H4.18C3.48 15.49 2.91 14.92 2.91 14.22V4.04H2.28C1.92 4.04 1.64 3.76 1.64 3.4C1.64 3.05 1.92 2.77 2.28 2.77H6.09C6.09 2.06 6.66 1.5 7.37 1.5H8.64C9.34 1.5 9.91 2.06 9.91 2.77H13.73C14.08 2.77 14.36 3.05 14.36 3.4C14.36 3.76 14.08 4.04 13.73 4.04ZM11.82 4.04H4.18V14.22H11.82V4.04ZM6.73 5.31C7.08 5.31 7.37 5.6 7.37 5.95V12.31C7.37 12.66 7.08 12.95 6.73 12.95C6.38 12.95 6.09 12.66 6.09 12.31V5.95C6.09 5.6 6.38 5.31 6.73 5.31ZM9.27 5.31C9.63 5.31 9.91 5.6 9.91 5.95V12.31C9.91 12.66 9.63 12.95 9.27 12.95C8.92 12.95 8.64 12.66 8.64 12.31V5.95C8.64 5.6 8.92 5.31 9.27 5.31Z"
        fill="#666666"
      />
    </Svg>
  );
}

export default function DraftBox() {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const [drafts, setDrafts] = useState<LocalDraft[]>([]);

  useFocusEffect(
    React.useCallback(() => {
      setDrafts(listDrafts());
    }, []),
  );

  const onDelete = (draft: LocalDraft) => {
    Alert.alert('删除草稿', '删除后不可恢复，确认删除？', [
      { text: '取消', style: 'cancel' },
      {
        text: '删除',
        style: 'destructive',
        onPress: () => {
          deleteDraft(draft.id);
          setDrafts(listDrafts());
        },
      },
    ]);
  };

  const onOpen = (draft: LocalDraft) => {
    navigation.navigate('publish', { draft });
  };

  const renderCover = (draft: LocalDraft) => {
    if (draft.draftType === 1) {
      const height = draft.videoRatio === '16:9' ? COVER_SHORT : COVER_TALL;
      if (draft.videoCover) {
        return <Image source={{ uri: draft.videoCover }} style={[styles.cover, { height }]} resizeMode="cover" />;
      }
      const uri = draft.videoUrl || draft.videoUri;
      if (uri) {
        return (
          <View style={[styles.cover, { height }]}>
            <Video source={{ uri }} style={styles.coverMedia} paused resizeMode="cover" pointerEvents="none" />
            <View style={styles.videoBadge}>
              <Svg width={scaleSizeW(8)} height={scaleSizeW(8)} viewBox="0 0 24 24">
                <Path d="M7 4l13 8-13 8z" fill="#FFFFFF" />
              </Svg>
              <Text style={styles.videoBadgeText}>视频</Text>
            </View>
          </View>
        );
      }
      return null;
    }
    if (draft.draftType === 2) {
      if (draft.cover) {
        return <Image source={{ uri: draft.cover }} style={[styles.cover, { height: COVER_TALL }]} resizeMode="cover" />;
      }
      return null;
    }
    const first = draft.images[0];
    if (first) {
      return <Image source={{ uri: first }} style={[styles.cover, { height: COVER_TALL }]} resizeMode="cover" />;
    }
    return null;
  };

  const renderCard = (draft: LocalDraft) => (
    <TouchableOpacity key={draft.id} style={styles.card} activeOpacity={0.85} onPress={() => onOpen(draft)}>
      {renderCover(draft)}
      <View style={styles.cardBody}>
        <Text style={styles.cardTitle} numberOfLines={2}>
          {draft.title || (draft.draftType === 2 ? draft.content.replace(/<[^>]*>/g, '').trim() : draft.content) || '无内容'}
        </Text>
        <View style={styles.cardFoot}>
          <Text style={styles.cardTime}>{formatDraftTime(draft.updatedAt)}</Text>
          <TouchableOpacity hitSlop={8} onPress={() => onDelete(draft)}>
            <TrashIcon />
          </TouchableOpacity>
        </View>
      </View>
    </TouchableOpacity>
  );

  const columns: LocalDraft[][] = [[], []];
  const heights = [0, 0];
  drafts.forEach(draft => {
    const coverH =
      draft.draftType === 1
        ? draft.videoRatio === '16:9'
          ? COVER_SHORT
          : COVER_TALL
        : draft.draftType === 2
          ? draft.cover
            ? COVER_TALL
            : 0
          : draft.images.length > 0
            ? COVER_TALL
            : 0;
    const target = heights[0] <= heights[1] ? 0 : 1;
    columns[target].push(draft);
    heights[target] += coverH + scaleSizeW(88) + scaleSizeW(4);
  });

  return (
    <SafeView backgroundColor="#F6F7FB">
      <View style={styles.tipBar}>
        <TipIcon />
        <Text style={styles.tipText}>草稿在应用卸载后会被删除，请及时发布</Text>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.listContent}>
        {drafts.length === 0 ? (
          <EmptyState variant="content" title="暂无草稿" style={styles.empty} />
        ) : (
          <View style={styles.columns}>
            {columns.map((col, i) => (
              <View key={i} style={styles.column}>
                {col.map(renderCard)}
              </View>
            ))}
          </View>
        )}
      </ScrollView>
    </SafeView>
  );
}

const styles = StyleSheet.create({
  tipBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: scaleSizeW(6),
    paddingHorizontal: scaleSizeW(16),
    paddingVertical: scaleSizeH(10),
    backgroundColor: INFO_BG,
  },
  tipText: {
    flex: 1,
    fontSize: scaleSizeW(12),
    color: PRIMARY,
  },
  listContent: {
    flexGrow: 1,
    paddingHorizontal: scaleSizeW(5),
    paddingTop: scaleSizeH(12),
    paddingBottom: scaleSizeH(30),
  },
  empty: {
    marginTop: scaleSizeH(80),
  },
  columns: {
    flexDirection: 'row',
    gap: scaleSizeW(4),
  },
  column: {
    width: COLUMN_W,
    gap: scaleSizeW(4),
  },
  card: {
    width: COLUMN_W,
    borderRadius: scaleSizeW(4),
    overflow: 'hidden',
    backgroundColor: '#FFFFFF',
  },
  cover: {
    width: COLUMN_W,
    overflow: 'hidden',
    backgroundColor: '#F5F5F5',
  },
  coverMedia: {
    width: '100%',
    height: '100%',
  },
  videoBadge: {
    position: 'absolute',
    top: scaleSizeW(10),
    right: scaleSizeW(6),
    flexDirection: 'row',
    alignItems: 'center',
    gap: scaleSizeW(3),
    height: scaleSizeW(20),
    paddingHorizontal: scaleSizeW(5),
    borderRadius: scaleSizeW(10),
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  videoBadgeText: {
    fontSize: scaleSizeW(10),
    fontWeight: '500',
    color: '#FFFFFF',
  },
  cardBody: {
    padding: scaleSizeW(11),
    gap: scaleSizeH(8),
    backgroundColor: '#FFFFFF',
  },
  cardTitle: {
    fontSize: scaleSizeW(15),
    lineHeight: scaleSizeH(21),
    color: '#333333',
  },
  cardFoot: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  cardTime: {
    fontSize: scaleSizeW(12),
    color: TEXT_SUB,
  },
});
