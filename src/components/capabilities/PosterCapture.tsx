import React, { useRef, useCallback } from 'react';
import {
  View, StyleSheet, TouchableOpacity, Text,
} from 'react-native';
import { AppAlert } from '@/components/AppAlert';
import ViewShot from 'react-native-view-shot';
import { saveToGallery } from './Gallery';

interface PosterCaptureProps {
  children: React.ReactNode;
  filename?: string;
}

export default function PosterCapture({ children, filename: _filename }: PosterCaptureProps) {
  const ref = useRef<any>(null);

  const handleCapture = useCallback(async () => {
    try {
      const uri = await ref.current?.capture?.();
      if (!uri) return;
      const saved = await saveToGallery(uri, 'photo');
      if (saved) {
        AppAlert.alert('保存成功', '海报已保存到相册');
      }
    } catch {
      AppAlert.alert('保存失败');
    }
  }, []);

  return (
    <View style={styles.container}>
      <ViewShot ref={ref} options={{ format: 'png', quality: 1 }}>
        {children}
      </ViewShot>
      <TouchableOpacity style={styles.saveBtn} onPress={handleCapture}>
        <Text style={styles.saveText}>保存海报</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { alignItems: 'center' },
  saveBtn: {
    marginTop: 16, paddingHorizontal: 32, paddingVertical: 12,
    backgroundColor: '#1EA3B5', borderRadius: 8,
  },
  saveText: { color: '#fff', fontSize: 16, fontWeight: '600' },
});
