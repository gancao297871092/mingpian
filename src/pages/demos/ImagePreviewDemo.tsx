import React, { useCallback, useState } from 'react';
import { View, Text, StyleSheet, SafeAreaView, ScrollView, Pressable, Modal } from 'react-native';
import { Image } from 'expo-image';
import { GestureViewer, GestureTrigger } from 'react-native-gesture-image-viewer';

const PHOTOS = [
  'https://picsum.photos/seed/gv1/800/1200',
  'https://picsum.photos/seed/gv2/1200/800',
  'https://picsum.photos/seed/gv3/800/800',
  'https://picsum.photos/seed/gv4/1200/1200',
  'https://picsum.photos/seed/gv5/800/1200',
  'https://picsum.photos/seed/gv6/1200/800',
];

const BLURHASH = 'L6PZfSi_.AyE_3t7t7R**0o#DgR4';

export default function ImagePreviewDemo() {
  const [visible, setVisible] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [debug, setDebug] = useState('idle');

  const openModal = useCallback((index: number) => {
    setSelectedIndex(index);
    setDebug(`open ${index}`);
    setVisible(true);
  }, []);

  const renderImage = useCallback((uri: string) => {
    return (
      <Image
        source={{ uri }}
        style={styles.viewerImage}
        contentFit="contain"
        placeholder={{ blurhash: BLURHASH }}
        transition={100}
      />
    );
  }, []);

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.title}>图片预览</Text>
        <Text style={styles.desc}>
          react-native-gesture-image-viewer · 点缩略图全屏预览，支持缩放/翻页/下滑关闭
        </Text>
        <Text style={styles.debug}>state: {debug}</Text>

        <View style={styles.grid}>
          {PHOTOS.map((uri, index) => (
            <GestureTrigger key={uri} onPress={() => openModal(index)}>
              <Pressable style={styles.cell}>
                <Image
                  source={{ uri }}
                  style={styles.thumb}
                  contentFit="cover"
                  placeholder={{ blurhash: BLURHASH }}
                  transition={150}
                />
              </Pressable>
            </GestureTrigger>
          ))}
        </View>
      </ScrollView>

      <Modal transparent visible={visible} onRequestClose={() => setVisible(false)}>
        <GestureViewer
          data={PHOTOS}
          initialIndex={selectedIndex}
          renderItem={renderImage}
          ListComponent={ScrollView}
          onDismiss={() => setVisible(false)}
        />
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f5f5' },
  content: { padding: 16 },
  title: { fontSize: 22, fontWeight: 'bold', color: '#333', marginBottom: 4 },
  desc: { fontSize: 13, color: '#999', marginBottom: 8, lineHeight: 18 },
  debug: { fontSize: 12, color: '#2563eb', marginBottom: 16 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  cell: { width: '31.5%', flexGrow: 1, aspectRatio: 1 },
  thumb: { flex: 1, borderRadius: 10, backgroundColor: '#e5e7eb' },
  viewerImage: { width: '100%', height: '100%' },
});
