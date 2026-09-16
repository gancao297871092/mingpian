import React, { useMemo } from 'react';
import { StyleSheet, View } from 'react-native';
import WaterfallCard, { WaterfallItem, CARD_WIDTH } from '@/components/WaterfallCard';
import { scaleSizeH, scaleSizeW } from '@/utils/screenUtils';

export const COLUMN_GAP = scaleSizeW(4);
const CONTENT_PADDING = scaleSizeW(5);
const CARD_MARGIN_BOTTOM = scaleSizeH(5);

interface ListProps {
  data: WaterfallItem[];
  onToggleLike: (id: string) => void;
}

export default function WaterfallList({ data, onToggleLike }: ListProps) {
  const { leftColumn, rightColumn } = useMemo(() => {
    const left: WaterfallItem[] = [];
    const right: WaterfallItem[] = [];
    let leftH = 0;
    let rightH = 0;

    for (const item of data) {
      const h = item.imageHeight + 98;
      if (leftH <= rightH) {
        left.push(item);
        leftH += h + CARD_MARGIN_BOTTOM;
      } else {
        right.push(item);
        rightH += h + CARD_MARGIN_BOTTOM;
      }
    }
    return { leftColumn: left, rightColumn: right };
  }, [data]);

  return (
    <View style={styles.waterfall}>
      <View style={styles.column}>
        {leftColumn.map((item) => (
          <WaterfallCard key={item.id} item={item} onToggleLike={onToggleLike} />
        ))}
      </View>
      <View style={styles.column}>
        {rightColumn.map((item) => (
          <WaterfallCard key={item.id} item={item} onToggleLike={onToggleLike} />
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  waterfall: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: COLUMN_GAP,
    paddingHorizontal: CONTENT_PADDING,
    paddingTop: scaleSizeH(5),
  },
  column: {
    width: CARD_WIDTH,
  },
});
