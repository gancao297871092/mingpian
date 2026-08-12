import React from 'react';
import { RefreshControl } from 'react-native';

export interface RefreshHeaderProps {
  refreshing: boolean;
  onRefresh?: () => void;
  source?: any;
}

export default function RefreshHeader({ refreshing, onRefresh }: RefreshHeaderProps) {
  
  return (
    <RefreshControl
      refreshing={refreshing}
      onRefresh={onRefresh}
    />
  );
}
