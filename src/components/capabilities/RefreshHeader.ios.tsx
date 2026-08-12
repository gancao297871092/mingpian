import React from 'react';
import LottieRefreshHeader from 'react-native-lottie-refresh-header';

export interface RefreshHeaderProps {
  refreshing: boolean;
  onRefresh?: () => void;
  source?: any;
}

export default function RefreshHeader({ refreshing, onRefresh, source }: RefreshHeaderProps) {
  return (
    <LottieRefreshHeader
      refreshing={refreshing}
      onRefresh={onRefresh}
      source={source}
    />
  );
}
