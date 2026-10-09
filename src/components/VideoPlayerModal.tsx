import React, { useEffect, useState } from 'react';
import { Modal, StyleSheet, TouchableOpacity, View } from 'react-native';
import Video from 'react-native-video';
import Svg, { Path } from 'react-native-svg';
import { scaleSizeH, scaleSizeW } from '@/utils/screenUtils';
import { useSettingStore } from '@/store/setting';

interface VideoPlayerModalProps {
  visible: boolean;
  uri: string | null;
  onClose: () => void;
}

export default function VideoPlayerModal({ visible, uri, onClose }: VideoPlayerModalProps) {
  const [paused, setPaused] = useState(false);
  const videoMuted = useSettingStore(s => s.videoMuted);

  useEffect(() => {
    if (visible) setPaused(false);
  }, [visible]);

  return (
    <Modal visible={visible} animationType="fade" onRequestClose={onClose}>
      <View style={styles.page}>
        <TouchableOpacity style={styles.touch} activeOpacity={1} onPress={() => setPaused(p => !p)}>
          {uri ? (
            <Video
              source={{ uri }}
              style={styles.video}
              paused={paused}
              muted={videoMuted}
              resizeMode="contain"
              onEnd={() => setPaused(true)}
            />
          ) : null}
          {paused && (
            <View style={styles.playBtn}>
              <Svg width={scaleSizeW(28)} height={scaleSizeW(28)} viewBox="0 0 24 24">
                <Path d="M8 5l12 7-12 7z" fill="#FFFFFF" />
              </Svg>
            </View>
          )}
        </TouchableOpacity>
        <TouchableOpacity style={styles.close} hitSlop={10} onPress={onClose}>
          <Svg width={scaleSizeW(20)} height={scaleSizeW(20)} viewBox="0 0 24 24" fill="none">
            <Path d="M15 5l-7 7 7 7" stroke="#FFFFFF" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
          </Svg>
        </TouchableOpacity>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  page: {
    flex: 1,
    backgroundColor: '#000000',
  },
  touch: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  video: {
    width: '100%',
    height: '100%',
  },
  playBtn: {
    position: 'absolute',
    alignSelf: 'center',
    top: '50%',
    marginTop: scaleSizeW(-32),
    width: scaleSizeW(64),
    height: scaleSizeW(64),
    borderRadius: scaleSizeW(32),
    backgroundColor: 'rgba(0,0,0,0.45)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  close: {
    position: 'absolute',
    top: scaleSizeH(60),
    left: scaleSizeW(16),
    width: scaleSizeW(40),
    height: scaleSizeW(40),
    justifyContent: 'center',
    alignItems: 'center',
  },
});
