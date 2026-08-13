import React, { useCallback, useState } from 'react';
import {
  Alert,
  Image,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { API } from '@/api';
import { scaleSizeW } from '@/utils/screenUtils';

interface StepTwoProps {
  cardId: number | null;
  data: Record<string, any>;
  onNext: (step: number, data?: any) => void;
}

export default function StepTwo({ cardId, data, onNext }: StepTwoProps) {
  const [mediaList, setMediaList] = useState<any[]>(data.mediaLinkList || []);
  const [indexId, setIndexId] = useState<number | null>(
    data.mediaLinkList?.find((o: any) => o.isIndex)?.mdId || null
  );

  const uploadImg = async () => {
    if (mediaList.length >= 9) {
      Alert.alert('提示', '最多上传9张图片');
      return;
    }
    // TODO: 接入图片选择器（react-native-image-picker）
    Alert.alert('提示', '图片上传功能需要安装 react-native-image-picker');
  };

  const onDelete = async (item: any, index: number) => {
    try {
      if (item.mdId) {
        await API.common.mediaDel({ mediaId: item.mdId });
      }
      const newList = [...mediaList];
      newList.splice(index, 1);
      setMediaList(newList);
      if (indexId === item.mdId) {
        setIndexId(null);
      }
    } catch (e) {
      Alert.alert('删除失败');
    }
  };

  const onSetIndex = async (item: any) => {
    try {
      if (indexId && indexId !== item.mdId) {
        await API.common.mediaLinkUpdate({ mdId: indexId, isIndex: 0 });
      }
      await API.common.mediaLinkUpdate({ mdId: item.mdId, isIndex: 1 });
      setIndexId(item.mdId);
    } catch (e) {
      Alert.alert('设置失败');
    }
  };

  const onSubmit = async (nextStep: number) => {
    if (nextStep === 3 && mediaList.length <= 0) {
      Alert.alert('提示', '请上传名片照片');
      return;
    }
    if (nextStep === 3 && !indexId && mediaList[0]) {
      // 自动设置第一张为封面
      try {
        await API.common.mediaLinkUpdate({ mdId: mediaList[0].mdId, isIndex: 1 });
        setIndexId(mediaList[0].mdId);
      } catch (e) {
        // ignore
      }
    }
    try {
      const res = await API.card.projectPre({ cardId: cardId! });
      if (res.code === '200') {
        onNext(nextStep, {
          mediaLinkList: mediaList,
          itemsList: res.data?.[0]?.itemsList || [],
        });
      }
    } catch (e) {
      onNext(nextStep, { mediaLinkList: mediaList });
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.tip}>*图片建议尺寸(w-1;h-1)</Text>
      <View style={styles.grid}>
        {mediaList.map((item, index) => (
          <View key={item.mdId || index} style={styles.imgBox}>
            {item.mdId === indexId && (
              <View style={styles.coverBadge}>
                <Text style={styles.coverText}>封面</Text>
              </View>
            )}
            <View style={styles.imgActions}>
              {item.mdId !== indexId && (
                <TouchableOpacity style={styles.badge} onPress={() => onSetIndex(item)}>
                  <Text style={styles.badgeText}>设为封面</Text>
                </TouchableOpacity>
              )}
              <TouchableOpacity style={styles.delBtn} onPress={() => onDelete(item, index)}>
                <Image source={require('@/assets/ming/del_1.png')} style={styles.delIcon} />
              </TouchableOpacity>
            </View>
            <Image
              source={{ uri: item.media?.mdUrl || item.mdUrl }}
              style={styles.img}
              resizeMode="cover"
            />
          </View>
        ))}
        {mediaList.length < 9 && (
          <TouchableOpacity style={styles.uploadBox} onPress={uploadImg}>
            <Image source={require('@/assets/ming/upload.png')} style={styles.uploadIcon} />
            <Text style={styles.uploadText}>上传图片（{mediaList.length}/9）</Text>
          </TouchableOpacity>
        )}
      </View>

      <View style={styles.btnRow}>
        <TouchableOpacity style={styles.btnBorder} onPress={() => onNext(1)}>
          <Text style={styles.btnBorderText}>上一步</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.btn} onPress={() => onSubmit(3)}>
          <Text style={styles.btnText}>下一步</Text>
        </TouchableOpacity>
      </View>
      <View style={{ height: scaleSizeW(40) }} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingTop: scaleSizeW(8),
  },
  tip: {
    fontSize: scaleSizeW(11),
    color: '#faad13',
    fontWeight: 'bold',
    marginTop: scaleSizeW(8),
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: scaleSizeW(11),
  },
  imgBox: {
    width: '48%',
    aspectRatio: 1,
    borderRadius: scaleSizeW(18),
    overflow: 'hidden',
    marginRight: '4%',
    marginBottom: scaleSizeW(10),
    position: 'relative',
    backgroundColor: '#f9f9f9',
  },
  img: {
    width: '100%',
    height: '100%',
  },
  imgActions: {
    position: 'absolute',
    right: scaleSizeW(10),
    bottom: scaleSizeW(10),
    flexDirection: 'row',
    zIndex: 2,
  },
  coverBadge: {
    position: 'absolute',
    left: scaleSizeW(10),
    top: scaleSizeW(10),
    backgroundColor: 'rgba(0,0,0,0.5)',
    borderRadius: scaleSizeW(8),
    paddingHorizontal: scaleSizeW(8),
    paddingVertical: scaleSizeW(3),
    zIndex: 2,
  },
  coverText: {
    color: '#ffffff',
    fontSize: scaleSizeW(11),
    fontWeight: 'bold',
  },
  badge: {
    backgroundColor: 'rgba(0,0,0,0.5)',
    borderRadius: scaleSizeW(8),
    paddingHorizontal: scaleSizeW(8),
    paddingVertical: scaleSizeW(3),
    marginRight: scaleSizeW(6),
  },
  badgeText: {
    color: '#ffffff',
    fontSize: scaleSizeW(11),
    fontWeight: 'bold',
  },
  delBtn: {
    width: scaleSizeW(26),
    height: scaleSizeW(26),
    borderRadius: scaleSizeW(13),
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  delIcon: {
    width: scaleSizeW(16),
    height: scaleSizeW(16),
  },
  uploadBox: {
    width: '48%',
    aspectRatio: 1,
    borderRadius: scaleSizeW(18),
    backgroundColor: '#f9f9f9',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: scaleSizeW(10),
  },
  uploadIcon: {
    width: scaleSizeW(24),
    height: scaleSizeW(22),
  },
  uploadText: {
    fontWeight: '500',
    fontSize: scaleSizeW(13),
    color: '#999999',
    marginTop: scaleSizeW(11),
  },
  btnRow: {
    flexDirection: 'row',
    marginTop: scaleSizeW(22),
    gap: scaleSizeW(11),
  },
  btnBorder: {
    flex: 1,
    height: scaleSizeW(42),
    borderRadius: scaleSizeW(21),
    borderWidth: 1,
    borderColor: '#eeeeee',
    justifyContent: 'center',
    alignItems: 'center',
  },
  btnBorderText: {
    fontSize: scaleSizeW(15),
    fontWeight: 'bold',
    color: '#000000',
  },
  btn: {
    flex: 1,
    height: scaleSizeW(42),
    backgroundColor: '#000000',
    borderRadius: scaleSizeW(21),
    justifyContent: 'center',
    alignItems: 'center',
  },
  btnText: {
    fontSize: scaleSizeW(15),
    fontWeight: 'bold',
    color: '#ffffff',
  },
});
