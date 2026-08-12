import React, { useCallback, useState } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, Image, Alert, ActivityIndicator,
} from 'react-native';
import ImagePicker from 'react-native-image-crop-picker';
import axios from 'axios';

interface UploadFile {
  uri: string;
  mime: string;
  filename?: string;
  progress: number;
  url?: string;
}

interface UploaderProps {
  onUpload?: (files: UploadFile[]) => void;
  maxFiles?: number;
}

export default function Uploader({ onUpload, maxFiles = 9 }: UploaderProps) {
  const [files, setFiles] = useState<UploadFile[]>([]);
  const [uploading, setUploading] = useState(false);

  const selectImage = useCallback(async () => {
    try {
      const result = await ImagePicker.openPicker({
        multiple: false,
        mediaType: 'photo',
      });
      const newFile: UploadFile = {
        uri: result.path,
        mime: result.mime || 'image/jpeg',
        filename: result.filename || 'photo.jpg',
        progress: 0,
      };
      const updated = [...files, newFile];
      setFiles(updated);
      handleUpload(newFile);
    } catch (e: any) {
      if (e?.code !== 'E_PICKER_CANCELLED') {
        Alert.alert('选择失败', e?.message);
      }
    }
  }, [files]);

  const takePhoto = useCallback(async () => {
    try {
      const result = await ImagePicker.openCamera({
        mediaType: 'photo',
      });
      const newFile: UploadFile = {
        uri: result.path,
        mime: result.mime || 'image/jpeg',
        filename: result.filename || 'camera.jpg',
        progress: 0,
      };
      const updated = [...files, newFile];
      setFiles(updated);
    } catch (e: any) {
      if (e?.code !== 'E_PICKER_CANCELLED') {
        Alert.alert('拍照失败', e?.message);
      }
    }
  }, [files]);

  const handleUpload = async (file: UploadFile) => {
    setUploading(true);
    const formData = new FormData();
    formData.append('file', {
      uri: file.uri,
      type: file.mime,
      name: file.filename,
    } as any);
    try {
      await axios.post('https://httpbin.org/post', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
        onUploadProgress: (e) => {
          const progress = e.total ? Math.round((e.loaded / e.total) * 100) : 0;
          setFiles(prev =>
            prev.map(f => f.uri === file.uri ? { ...f, progress } : f),
          );
        },
      });
      setFiles(prev =>
        prev.map(f => f.uri === file.uri ? { ...f, progress: 100, url: file.uri } : f),
      );
    } catch {
      Alert.alert('上传失败');
    } finally {
      setUploading(false);
    }
  };

  const removeFile = (uri: string) => {
    setFiles(prev => prev.filter(f => f.uri !== uri));
  };

  return (
    <View style={styles.container}>
      <View style={styles.grid}>
        {files.map((file, index) => (
          <View key={index} style={styles.thumbWrap}>
            <Image source={{ uri: file.uri }} style={styles.thumb} />
            {file.progress > 0 && file.progress < 100 && (
              <View style={styles.progressOverlay}>
                <ActivityIndicator color="#fff" />
                <Text style={styles.progressText}>{file.progress}%</Text>
              </View>
            )}
            <TouchableOpacity style={styles.removeBtn} onPress={() => removeFile(file.uri)}>
              <Text style={styles.removeText}>×</Text>
            </TouchableOpacity>
          </View>
        ))}
        {files.length < maxFiles && (
          <TouchableOpacity style={styles.addBtn} onPress={selectImage}>
            <Text style={styles.addText}>+</Text>
            <Text style={styles.addLabel}>选择图片</Text>
          </TouchableOpacity>
        )}
      </View>
      {files.length === 0 && (
        <TouchableOpacity style={styles.cameraBtn} onPress={takePhoto}>
          <Text style={styles.cameraBtnText}>拍照上传</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

const SIZE = 80;

const styles = StyleSheet.create({
  container: { padding: 16 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  thumbWrap: { width: SIZE, height: SIZE, borderRadius: 8, overflow: 'hidden' },
  thumb: { width: SIZE, height: SIZE, borderRadius: 8 },
  progressOverlay: {
    ...StyleSheet.absoluteFill,
    backgroundColor: 'rgba(0,0,0,0.5)', borderRadius: 8,
    justifyContent: 'center', alignItems: 'center',
  },
  progressText: { color: '#fff', fontSize: 11 },
  removeBtn: {
    position: 'absolute', top: -6, right: -6, width: 20, height: 20,
    borderRadius: 10, backgroundColor: '#FF4757', justifyContent: 'center', alignItems: 'center',
  },
  removeText: { color: '#fff', fontSize: 14, fontWeight: 'bold', lineHeight: 16 },
  addBtn: {
    width: SIZE, height: SIZE, borderRadius: 8,
    borderWidth: 2, borderColor: '#ddd', borderStyle: 'dashed',
    justifyContent: 'center', alignItems: 'center',
  },
  addText: { fontSize: 28, color: '#ccc', lineHeight: 32 },
  addLabel: { fontSize: 10, color: '#ccc' },
  cameraBtn: {
    marginTop: 12, paddingVertical: 12, alignItems: 'center',
    backgroundColor: '#f5f5f5', borderRadius: 8,
  },
  cameraBtnText: { color: '#666', fontSize: 14 },
});
