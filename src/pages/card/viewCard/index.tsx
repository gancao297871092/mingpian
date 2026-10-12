import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Alert,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  useWindowDimensions,
} from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import RenderHtml from 'react-native-render-html';
import SafeView from '@/components/SafeView';
import PersonalCard from '@/components/cards/PersonalCard';
import { normalizeCardStyle } from '@/components/cards/types';
import { API } from '@/api';
import { scaleSizeW, setSpText } from '@/utils/screenUtils';
import type { RootStackParamList } from '@/route/map';

type Props = NativeStackScreenProps<RootStackParamList, 'viewCard'>;

/** 预览主页（对齐小程序 viewCard）：展示草稿名片主页，确认后发布 */
export default function ViewCard({ navigation, route }: Props) {
  const { id, mode = 'update' } = route.params;
  const isUpdate = mode === 'update';
  const insets = useSafeAreaInsets();
  const { width: screenWidth } = useWindowDimensions();

  const [userCard, setUserCard] = useState<any>(null);
  const [itemsList, setItemsList] = useState<any[]>([]);
  const [pushing, setPushing] = useState(false);

  const loadDetail = useCallback(async () => {
    try {
      // AppCardController：名片信息 /card/detail，价值亮点 /card/create/project/pre
      const res = await API.card.detail({ cardId: id });
      if (res.code === '200' && res.data) {
        setUserCard(res.data);
      }
      const pj = await API.card.projectPre({ cardId: id });
      if (pj.code === '200' && Array.isArray(pj.data)) {
        setItemsList(pj.data[0]?.itemsList || []);
      }
    } catch {
      // ignore
    }
  }, [id]);

  useEffect(() => {
    loadDetail();
  }, [loadDetail]);

  const contentWidth = screenWidth - scaleSizeW(32);

  const cardData = useMemo(
    () => ({
      ...(userCard || {}),
      mediaLinkList: (userCard?.mediaLinkList || userCard?.mediaList || []).filter(
        (o: any) => !!o.media || !!o.mdUrl,
      ),
    }),
    [userCard],
  );

  const onGenerate = () => {
    Alert.alert('提示', isUpdate ? '确认保存名片？' : '确认创建名片？', [
      { text: '取消', style: 'cancel' },
      {
        text: '确定',
        onPress: async () => {
          if (pushing) return;
          setPushing(true);
          try {
            const res = await API.card.push({ cardId: id });
            if (res.code === '200') {
              Alert.alert('提示', isUpdate ? '名片保存成功！' : '名片创建成功！', [
                // 对齐小程序 goBack(2)：预览页 → 编辑页 → 我的名片
                { text: '确定', onPress: () => navigation.pop(2) },
              ]);
            }
          } catch {
            // ignore（拦截器已提示）
          } finally {
            setPushing(false);
          }
        },
      },
    ]);
  };

  return (
    <SafeView backgroundColor="#FFFFFF" disableTop>
      <ScrollView style={styles.scroll} showsVerticalScrollIndicator={false}>
        {userCard && (
          <View style={styles.cardBox}>
            <PersonalCard
              data={cardData}
              style={normalizeCardStyle(userCard.styleCode)}
              fontColor={userCard.fontColor}
              backColor={userCard.backColor}
            />
          </View>
        )}

        {!!userCard?.profile && <Text style={styles.profile}>{userCard.profile}</Text>}

        {itemsList.length > 0 && (
          <View style={styles.itemsBox}>
            <Text style={styles.itemsTitle}>价值亮点</Text>
            {itemsList.map((item, index) => (
              <View key={item.id || index} style={styles.itemCard}>
                <Text style={styles.itemTitle}>{item.itTitle || '板块'}</Text>
                {!!item.itContent && (
                  <RenderHtml
                    contentWidth={contentWidth}
                    source={{ html: item.itContent }}
                    tagsStyles={{
                      p: {
                        marginVertical: scaleSizeW(4),
                        fontSize: scaleSizeW(14),
                        color: '#333333',
                        lineHeight: scaleSizeW(22),
                      },
                      img: { marginVertical: scaleSizeW(8), borderRadius: scaleSizeW(8) },
                    }}
                  />
                )}
              </View>
            ))}
          </View>
        )}
        <View style={{ height: scaleSizeW(40) }} />
      </ScrollView>

      <View style={[styles.footer, { paddingBottom: insets.bottom + scaleSizeW(12) }]}>
        <TouchableOpacity
          activeOpacity={0.8}
          style={[styles.generateBtn, pushing && { opacity: 0.6 }]}
          onPress={onGenerate}
          disabled={pushing}
        >
          <Text style={styles.generateBtnText}>{isUpdate ? '保存更改' : '创建名片'}</Text>
        </TouchableOpacity>
      </View>
    </SafeView>
  );
}

const styles = StyleSheet.create({
  scroll: {
    flex: 1,
    paddingHorizontal: scaleSizeW(16),
  },
  cardBox: {
    marginTop: scaleSizeW(16),
  },
  profile: {
    fontSize: setSpText(13),
    fontWeight: '400',
    color: '#6C6C6C',
    marginTop: scaleSizeW(16),
  },
  itemsBox: {
    marginTop: scaleSizeW(20),
  },
  itemsTitle: {
    fontSize: setSpText(17),
    fontWeight: '600',
    color: '#000000',
    marginBottom: scaleSizeW(10),
  },
  itemCard: {
    backgroundColor: '#F6F7FB',
    borderRadius: scaleSizeW(10),
    paddingHorizontal: scaleSizeW(14),
    paddingVertical: scaleSizeW(12),
    marginTop: scaleSizeW(10),
  },
  itemTitle: {
    fontSize: setSpText(15),
    fontWeight: '500',
    color: '#000000',
  },
  footer: {
    paddingHorizontal: scaleSizeW(16),
    paddingTop: scaleSizeW(12),
    backgroundColor: '#FFFFFF',
  },
  generateBtn: {
    height: scaleSizeW(48),
    borderRadius: scaleSizeW(24),
    backgroundColor: '#2962D4',
    alignItems: 'center',
    justifyContent: 'center',
  },
  generateBtnText: {
    fontSize: setSpText(15),
    fontWeight: '500',
    color: '#FFFFFF',
    letterSpacing: -0.4,
  },
});
