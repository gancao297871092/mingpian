import React, { useState } from 'react';
import {
  View, Text, StyleSheet, TextInput, SafeAreaView, TouchableOpacity,
} from 'react-native';
import { VideoPlayer } from '@/components/capabilities';

export default function VideoDemo() {
  const [url, setUrl] = useState('');
  const [playUrl, setPlayUrl] = useState('');

  const sampleUrls = [
    { label: 'Big Buck Bunny', url: 'https://test-videos.co.uk/vids/bigbuckbunny/mp4/h264/720/Big_Buck_Bunny_720_10s_1MB.mp4' },
    { label: 'Elephant Dream', url: 'https://storage.googleapis.com/exoplayer-test-media-0/BigBuckBunny_320x180.mp4' },
    { label: 'HLS 流 (Apple)', url: 'https://devstreaming-cdn.apple.com/videos/streaming/examples/img_bipbop_adv_example_fmp4/master.m3u8' },
  ];

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.label}>输入视频地址</Text>
        <TextInput
          style={styles.input}
          placeholder="https://example.com/video.mp4"
          placeholderTextColor="#999"
          value={url}
          onChangeText={setUrl}
          autoCapitalize="none"
          autoCorrect={false}
        />
        <TouchableOpacity
          style={[styles.btn, !url && styles.btnDisabled]}
          onPress={() => url && setPlayUrl(url)}
          disabled={!url}
        >
          <Text style={styles.btnText}>播放</Text>
        </TouchableOpacity>

        <Text style={styles.sampleLabel}>或选择示例视频：</Text>
        <View style={styles.sampleList}>
          {sampleUrls.map((item, index) => (
            <TouchableOpacity
              key={index}
              style={styles.sampleBtn}
              onPress={() => { setUrl(item.url); setPlayUrl(item.url); }}
            >
              <Text style={styles.sampleText}>{item.label}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {playUrl ? (
          <View style={styles.playerWrap}>
            <Text style={styles.playingText}>正在播放</Text>
            <VideoPlayer uri={playUrl} />
          </View>
        ) : null}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f5f5' },
  content: { padding: 16 },
  label: { fontSize: 15, fontWeight: '600', color: '#333', marginBottom: 8 },
  input: {
    backgroundColor: '#fff', borderRadius: 10, padding: 14, fontSize: 14,
    color: '#333', borderWidth: 1, borderColor: '#e0e0e0', marginBottom: 10,
  },
  btn: {
    backgroundColor: '#1EA3B5', paddingVertical: 12, borderRadius: 10,
    alignItems: 'center', marginBottom: 20,
  },
  btnDisabled: { opacity: 0.5 },
  btnText: { color: '#fff', fontSize: 16, fontWeight: '600' },
  sampleLabel: { fontSize: 14, color: '#666', marginBottom: 8 },
  sampleList: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 20 },
  sampleBtn: {
    paddingHorizontal: 16, paddingVertical: 8, backgroundColor: '#e8f4f8',
    borderRadius: 20,
  },
  sampleText: { fontSize: 13, color: '#1EA3B5' },
  playerWrap: { marginTop: 8 },
  playingText: { fontSize: 13, color: '#999', marginBottom: 8, textAlign: 'center' },
});
