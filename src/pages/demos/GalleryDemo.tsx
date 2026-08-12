import React, { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, FlatList, Image, Alert, TouchableOpacity,
  SafeAreaView, ActivityIndicator,
} from 'react-native';
import { getGalleryPhotos } from '@/components/capabilities';

interface Photo {
  uri: string;
  width: number;
  height: number;
}

export default function GalleryDemo() {
  const [photos, setPhotos] = useState<Photo[]>([]);
  const [loading, setLoading] = useState(false);
  const [hasLoaded, setHasLoaded] = useState(false);

  const loadPhotos = async () => {
    setLoading(true);
    try {
      const result = await getGalleryPhotos();
      if (result) {
        const mapped = result.edges.map(e => ({
          uri: e.node.image.uri,
          width: e.node.image.width,
          height: e.node.image.height,
        }));
        setPhotos(mapped);
      }
    } catch {
      Alert.alert('加载失败', '无法读取相册');
    } finally {
      setLoading(false);
      setHasLoaded(true);
    }
  };

  useEffect(() => { loadPhotos(); }, []);

  const renderPhoto = ({ item }: { item: Photo }) => (
    <View style={styles.photoWrap}>
      <Image source={{ uri: item.uri }} style={styles.photo} />
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>相册预览</Text>
        <Text style={styles.count}>{photos.length} 张照片</Text>
      </View>
      {loading ? (
        <ActivityIndicator style={styles.loading} size="large" color="#1EA3B5" />
      ) : (
        <FlatList
          data={photos}
          renderItem={renderPhoto}
          keyExtractor={(_, index) => String(index)}
          numColumns={3}
          contentContainerStyle={styles.list}
          ListEmptyComponent={
            hasLoaded ? (
              <View style={styles.empty}>
                <Text style={styles.emptyText}>未读取到照片</Text>
                <TouchableOpacity style={styles.btn} onPress={loadPhotos}>
                  <Text style={styles.btnText}>重新读取</Text>
                </TouchableOpacity>
              </View>
            ) : null
          }
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  header: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingHorizontal: 16, paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth, borderColor: '#e0e0e0',
  },
  title: { fontSize: 17, fontWeight: '600', color: '#333' },
  count: { fontSize: 13, color: '#999' },
  loading: { flex: 1, justifyContent: 'center' },
  list: { padding: 2 },
  photoWrap: { flex: 1, margin: 2, aspectRatio: 1 },
  photo: { flex: 1, borderRadius: 4 },
  empty: { alignItems: 'center', marginTop: 80 },
  emptyText: { fontSize: 16, color: '#999', marginBottom: 16 },
  btn: { paddingHorizontal: 24, paddingVertical: 10, backgroundColor: '#1EA3B5', borderRadius: 8 },
  btnText: { color: '#fff', fontSize: 15, fontWeight: '600' },
});
