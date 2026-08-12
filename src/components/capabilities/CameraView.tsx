import React, { useRef, useState, useEffect, useCallback } from 'react';
import { View, StyleSheet, TouchableOpacity, Text, Alert } from 'react-native';
import { Camera, useCameraDevice } from 'react-native-vision-camera';
import {
  checkPermission,
  requestPermission,
  openAppSettings,
} from '@/utils/permission';

interface CameraViewProps {
  onCapture?: (path: string) => void;
  onClose?: () => void;
}

export default function CameraView({ onCapture, onClose }: CameraViewProps) {
  const [hasPermission, setHasPermission] = useState(false);
  const device = useCameraDevice('back');
  const cameraRef = useRef<Camera>(null);

  useEffect(() => {
    let mounted = true;
    checkPermission('camera').then(state => {
      if (mounted) setHasPermission(state.granted);
    });
    return () => {
      mounted = false;
    };
  }, []);

  const handleRequestPermission = useCallback(async () => {
    const state = await requestPermission('camera');
    if (state.granted) {
      setHasPermission(true);
      return;
    }
    if (state.status === 'blocked' || state.status === 'restricted') {
      Alert.alert('相机权限已关闭', '请在系统设置中开启相机权限', [
        { text: '取消', style: 'cancel' },
        { text: '去设置', onPress: () => openAppSettings() },
      ]);
    }
  }, []);

  const takePhoto = useCallback(async () => {
    if (!cameraRef.current) return;
    const photo = await cameraRef.current.takePhoto();
    onCapture?.(photo.path);
  }, [onCapture]);

  if (!hasPermission) {
    return (
      <View style={styles.container}>
        <TouchableOpacity style={styles.permissionBtn} onPress={handleRequestPermission}>
          <Text style={styles.permissionText}>授予相机权限</Text>
        </TouchableOpacity>
      </View>
    );
  }

  if (!device) {
    return (
      <View style={styles.container}>
        <Text style={styles.permissionText}>未找到相机设备</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Camera
        ref={cameraRef}
        style={StyleSheet.absoluteFill}
        device={device}
        isActive
        photo
      />
      <View style={styles.bottomBar}>
        <TouchableOpacity style={styles.closeBtn} onPress={onClose}>
          <Text style={styles.btnText}>关闭</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.captureBtn} onPress={takePhoto} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000' },
  bottomBar: {
    position: 'absolute', bottom: 60, left: 0, right: 0,
    flexDirection: 'row', justifyContent: 'space-around', alignItems: 'center',
    paddingHorizontal: 40,
  },
  captureBtn: {
    width: 72, height: 72, borderRadius: 36,
    borderWidth: 4, borderColor: '#fff', backgroundColor: 'transparent',
  },
  closeBtn: { padding: 12 },
  btnText: { color: '#fff', fontSize: 16 },
  permissionBtn: {
    flex: 1, justifyContent: 'center', alignItems: 'center',
  },
  permissionText: { color: '#fff', fontSize: 18 },
});
