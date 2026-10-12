import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ScrollView,
  StyleSheet,
  Text,
  View,
  useWindowDimensions,
} from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import RenderHtml from 'react-native-render-html';
import SafeView from '@/components/SafeView';
import PersonalCard from '@/components/cards/PersonalCard';
import { normalizeCardStyle } from '@/components/cards/types';
import { API } from '@/api';
import { scaleSizeW, setSpText } from '@/utils/screenUtils';
import type { RootStackParamList } from '@/route/map';

type Props = NativeStackScreenProps<RootStackParamList, 'viewCard'>;

/** 预览主页：纯预览草稿名片效果（发布在创建第4步「完成」） */
export default function ViewCard({ route }: Props) {
  const { id } = route.params;
  const { width: screenWidth } = useWindowDimensions();

  const [userCard, setUserCard] = useState<any>(null);
  const [itemsList, setItemsList] = useState<any[]>([]);

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
});
