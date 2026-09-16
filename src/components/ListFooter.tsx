import React from 'react';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';
import { scaleSizeH, setSpText } from '@/utils/screenUtils';

interface Props {
  fetching: boolean;
  isLastPage: boolean;
  listLength: number;
  noMoreText?: string;
}

export default function ListFooter({
  fetching,
  isLastPage,
  listLength,
  noMoreText = '没有更多了',
}: Props) {
  const status = fetching && listLength > 0
    ? 'loading'
    : isLastPage && listLength > 0
      ? 'noMore'
      : 'hidden';

  if (status === 'hidden') {
    return null;
  }

  return (
    <View style={styles.container}>
      {status === 'loading' && <ActivityIndicator size="small" color="#2962D4" />}
      {status === 'noMore' && <Text style={styles.noMoreText}>{noMoreText}</Text>}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingVertical: scaleSizeH(20),
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: scaleSizeH(50),
  },
  noMoreText: {
    fontSize: setSpText(12),
    color: '#999999',
    lineHeight: scaleSizeH(17),
  },
});
