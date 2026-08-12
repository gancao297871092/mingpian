import React, { useRef, useState } from 'react';
import {
  View, StyleSheet, TouchableOpacity, Text,
  Dimensions, StatusBar,
} from 'react-native';
import Video, { VideoRef } from 'react-native-video';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

interface VideoPlayerProps {
  uri: string;
  style?: any;
  paused?: boolean;
  onClose?: () => void;
  showControls?: boolean;
}

export default function VideoPlayer({
  uri, style, paused: externalPaused, onClose, showControls = true,
}: VideoPlayerProps) {
  const ref = useRef<VideoRef>(null);
  const [paused, setPaused] = useState(externalPaused ?? false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);

  const formatTime = (s: number) => {
    const m = Math.floor(s / 60);
    const sec = Math.floor(s % 60);
    return `${m}:${sec.toString().padStart(2, '0')}`;
  };

  return (
    <View style={[styles.container, style]}>
      <StatusBar hidden />
      <Video
        ref={ref}
        source={{ uri }}
        style={StyleSheet.absoluteFill}
        paused={paused}
        resizeMode="contain"
        repeat
        onProgress={e => setCurrentTime(e.currentTime)}
        onLoad={e => setDuration(e.duration)}
        onError={e => console.warn('[VideoPlayer] error:', JSON.stringify(e))}
      />
      {showControls && (
        <>
          <TouchableOpacity
            style={StyleSheet.absoluteFill}
            activeOpacity={1}
            onPress={() => setPaused(!paused)}
          />
          <View style={styles.controls}>
            <TouchableOpacity onPress={onClose}>
              <Text style={styles.btnText}>关闭</Text>
            </TouchableOpacity>
            <Text style={styles.timeText}>
              {formatTime(currentTime)} / {formatTime(duration)}
            </Text>
          </View>
          {paused && (
            <View style={styles.playIcon}>
              <Text style={styles.playText}>▶</Text>
            </View>
          )}
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: SCREEN_WIDTH, height: SCREEN_WIDTH * 0.5625,
    backgroundColor: '#000', justifyContent: 'center', alignItems: 'center',
  },
  controls: {
    position: 'absolute', top: 12, left: 16, right: 16,
    flexDirection: 'row', justifyContent: 'space-between',
  },
  btnText: { color: '#fff', fontSize: 16 },
  timeText: { color: '#fff', fontSize: 12 },
  playIcon: {
    position: 'absolute', width: 60, height: 60, borderRadius: 30,
    backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'center', alignItems: 'center',
  },
  playText: { color: '#fff', fontSize: 24 },
});
