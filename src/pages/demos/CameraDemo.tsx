import React, { useState, useCallback } from 'react';
import {
  View, Text, StyleSheet, Image, TouchableOpacity, Modal, SafeAreaView,
} from 'react-native';
import { CameraView } from '@/components/capabilities';

export default function CameraDemo() {
  const [showCamera, setShowCamera] = useState(false);
  const [photoPath, setPhotoPath] = useState<string | null>(null);

  const handleCapture = useCallback((path: string) => {
    setPhotoPath(path);
    setShowCamera(false);
  }, []);

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        {photoPath ? (
          <View style={styles.result}>
            <Image source={{ uri: photoPath }} style={styles.preview} />
            <Text style={styles.label}>拍照成功！</Text>
            <TouchableOpacity style={styles.btn} onPress={() => setPhotoPath(null)}>
              <Text style={styles.btnText}>重新拍照</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <View style={styles.empty}>
            <Text style={styles.emptyIcon}>📷</Text>
            <Text style={styles.emptyText}>点击下方按钮打开相机</Text>
            <TouchableOpacity
              style={styles.btn}
              onPress={() => setShowCamera(true)}
            >
              <Text style={styles.btnText}>打开相机</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>

      <Modal visible={showCamera} animationType="slide">
        <CameraView
          onCapture={handleCapture}
          onClose={() => setShowCamera(false)}
        />
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f5f5' },
  content: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  result: { alignItems: 'center' },
  preview: { width: 250, height: 350, borderRadius: 12, marginBottom: 16 },
  empty: { alignItems: 'center' },
  emptyIcon: { fontSize: 64, marginBottom: 12 },
  emptyText: { fontSize: 16, color: '#666', marginBottom: 20 },
  btn: {
    paddingHorizontal: 32, paddingVertical: 14,
    backgroundColor: '#1EA3B5', borderRadius: 10,
  },
  btnText: { color: '#fff', fontSize: 16, fontWeight: '600' },
  label: { fontSize: 18, fontWeight: '600', color: '#333', marginBottom: 12 },
});
