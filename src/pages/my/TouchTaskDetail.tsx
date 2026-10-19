import React from 'react';
import { Image, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import Clipboard from '@react-native-clipboard/clipboard';
import Toast from 'react-native-toast-message';
import { Image as ExpoImage } from 'expo-image';
import SafeView from '@/components/SafeView';
import LongHtmlView from '@/components/LongHtmlView';
import { scaleSizeH, scaleSizeW, setSpText, SCREEN_WIDTH } from '@/utils/screenUtils';
import { BlueBadgeIcon, CapPuzzleIcon } from './myIcons';

const PRIMARY = '#2962D4';
const GREEN = '#0CC160';
const TEXT_SUB = '#6C6C6C';
const CARD_BG = 'rgba(255, 255, 255, 0.8)';

interface TaskDetail {
  avatar: string;
  company: string;
  verified: boolean;
  companyTags: string;
  analysis: string;
  capCompany: string;
  capBbsCount: number;
  capContent: string;
  script: string;
}

/** 静态 mock（接口待联调） */
const MOCK_DETAIL: TaskDetail = {
  avatar: '',
  company: '鄂尔多斯市巨鼎煤机制造有限公司',
  verified: true,
  companyTags: '煤矿装备制造 · 鄂尔多斯',
  analysis:
    '该企业主营编织袋生产及包装制品加工，其产品形态、原料使用场景与「寻找华东编织袋生产企业」的需求直接对应；\n同时企业具备持续采购与合作落地的业务基础。建议优先核实其 PVC 颗粒的现用规格、月度需求量和交付区域，再以样品、供货稳定性和定制能力为重点安排首轮微信沟通或线下拜访。',
  capCompany: '重庆渝达精密制造有限公司',
  capBbsCount: 2,
  capContent: '稳定供应 PVC 颗粒，支持稳定批次、规格定制与持续交付',
  script:
    '张总，平台最近匹配到一家 PVC 颗粒供应企业，正在寻找编织袋生产企业合作，有相关供货案例和交付能力，你可以看看是否适合。',
};

/** 96.任务详情 */
export default function TouchTaskDetail() {
  const detail = MOCK_DETAIL;

  const onCopy = () => {
    Clipboard.setString(detail.script);
    Toast.show({ type: 'success', text1: '已复制' });
  };

  return (
    <SafeView backgroundColor="#E8EFFF">
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.content}>
        <Image source={require('@/assets/my/workbench/detail-bg.png')} style={styles.bgDeco} resizeMode="cover" />
        <Image source={require('@/assets/my/settings/cert-glow.png')} style={styles.glow} resizeMode="contain" />

        <View style={styles.companyCard}>
          {detail?.avatar ? (
            <ExpoImage source={{ uri: detail.avatar }} style={styles.avatar} contentFit="cover" transition={150} />
          ) : (
            <View style={[styles.avatar, styles.avatarPlaceholder]} />
          )}
          <View style={styles.companyText}>
            <View style={styles.companyRow}>
              <Text style={styles.company} numberOfLines={1}>{detail?.company || ''}</Text>
              {detail?.verified && <BlueBadgeIcon />}
            </View>
            {!!detail?.companyTags && <Text style={styles.companyTags} numberOfLines={1}>{detail.companyTags}</Text>}
          </View>
        </View>

        <View style={styles.analysisSection}>
          <Image source={require('@/assets/my/workbench/exec.png')} style={styles.execImg} resizeMode="contain" />
          <View style={styles.analysisBanner}>
            <Text style={styles.analysisBannerText}>匹配分析 · 为什么找他</Text>
          </View>
          <View style={styles.analysisCard}>
            <Text style={styles.analysisText}>{detail?.analysis || ''}</Text>
          </View>
        </View>

        <View style={styles.card}>
          <View style={styles.sectionTitleRow}>
            <View style={[styles.sectionBar, styles.sectionBarBlue]} />
            <Text style={styles.sectionTitle}>推荐给客户的合作内容</Text>
          </View>
          <View style={styles.capCard}>
            <LinearGradient
              colors={['#2962D4', '#8EB4FF']}
              start={{ x: 0.13, y: 0.77 }}
              end={{ x: 1, y: 0 }}
              style={styles.capHead}
            >
              <View style={styles.capHeadRow}>
                <CapPuzzleIcon />
                <Text style={styles.capLabel}>能力卡</Text>
              </View>
              <Text style={styles.capCompany} numberOfLines={1}>{detail?.capCompany || ''}</Text>
            </LinearGradient>
            <View style={styles.capBody}>
              <Text style={styles.capBbsCount}>关联动态 {detail?.capBbsCount ?? 0} 条</Text>
              {!!detail?.capContent && (
                <View style={styles.capContentBox}>
                  <LongHtmlView
                    html={detail.capContent}
                    contentWidth={SCREEN_WIDTH - scaleSizeW(92)}
                    baseStyle={styles.capContent}
                  />
                </View>
              )}
              <View style={styles.capBtns}>
                <TouchableOpacity activeOpacity={0.8} style={styles.capBtn}>
                  <Text style={styles.capBtnText}>能力卡详情</Text>
                </TouchableOpacity>
                <TouchableOpacity activeOpacity={0.8} style={styles.capBtn}>
                  <Text style={[styles.capBtnText, { color: PRIMARY }]}>微信转发</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </View>

        <View style={styles.card}>
          <View style={styles.sectionTitleRow}>
            <View style={[styles.sectionBar, styles.sectionBarGreen]} />
            <Text style={styles.sectionTitle}>微信推荐话术</Text>
          </View>
          <View style={styles.scriptBox}>
            <Text style={styles.scriptText}>{detail?.script || ''}</Text>
            <TouchableOpacity activeOpacity={0.8} style={styles.copyBtn} onPress={onCopy}>
              <Text style={styles.copyBtnText}>点击复制</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </SafeView>
  );
}

const styles = StyleSheet.create({
  content: {
    padding: scaleSizeW(16),
    paddingBottom: scaleSizeH(40),
  },
  bgDeco: {
    position: 'absolute',
    top: 0,
    left: 0,
    width: scaleSizeW(402),
    height: scaleSizeH(208),
    opacity: 0.2,
  },
  glow: {
    position: 'absolute',
    top: 0,
    alignSelf: 'center',
    width: scaleSizeW(302),
    height: scaleSizeW(302),
    opacity: 0.3,
  },
  companyCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: CARD_BG,
    borderWidth: 1,
    borderColor: '#FFFFFF',
    borderRadius: scaleSizeW(10),
    paddingHorizontal: scaleSizeW(14),
    paddingVertical: scaleSizeH(15),
    gap: scaleSizeW(5),
  },
  avatar: {
    width: scaleSizeW(36),
    height: scaleSizeW(36),
    borderRadius: scaleSizeW(18),
    borderWidth: 1,
    borderColor: '#EAEAEA',
  },
  avatarPlaceholder: {
    backgroundColor: '#F5F5F5',
  },
  companyText: {
    flex: 1,
    gap: scaleSizeH(5),
  },
  companyRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: scaleSizeW(2),
  },
  company: {
    fontSize: setSpText(14),
    fontWeight: '500',
    color: '#000000',
    flexShrink: 1,
  },
  companyTags: {
    fontSize: setSpText(12),
    lineHeight: setSpText(12),
    color: TEXT_SUB,
  },
  analysisSection: {
    marginTop: scaleSizeH(10),
  },
  execImg: {
    position: 'absolute',
    left: 0,
    top: 0,
    width: scaleSizeW(75),
    height: scaleSizeW(75),
    zIndex: 2,
  },
  analysisBanner: {
    alignSelf: 'flex-start',
    marginTop: scaleSizeH(20),
    marginLeft: scaleSizeW(38),
    backgroundColor: GREEN,
    borderTopRightRadius: scaleSizeW(90),
    borderBottomRightRadius: scaleSizeW(90),
    paddingLeft: scaleSizeW(30),
    paddingRight: scaleSizeW(10),
    zIndex: 1,
  },
  analysisBannerText: {
    fontSize: setSpText(14),
    fontWeight: '500',
    lineHeight: setSpText(24),
    color: '#FFFFFF',
  },
  analysisCard: {
    marginTop: scaleSizeH(10),
    backgroundColor: CARD_BG,
    borderWidth: 1,
    borderColor: '#FFFFFF',
    borderRadius: scaleSizeW(10),
    paddingHorizontal: scaleSizeW(14),
    paddingTop: scaleSizeH(20),
    paddingBottom: scaleSizeH(18),
  },
  analysisText: {
    fontSize: setSpText(14),
    lineHeight: setSpText(24),
    color: '#000000',
  },
  card: {
    marginTop: scaleSizeH(20),
    backgroundColor: CARD_BG,
    borderWidth: 1,
    borderColor: '#FFFFFF',
    borderRadius: scaleSizeW(10),
    paddingHorizontal: scaleSizeW(14),
    paddingTop: scaleSizeH(18),
    paddingBottom: scaleSizeH(18),
  },
  sectionTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: scaleSizeW(6),
  },
  sectionBar: {
    width: scaleSizeW(2),
    height: scaleSizeH(16),
    borderRadius: scaleSizeW(90),
  },
  sectionBarGreen: {
    backgroundColor: '#36BE69',
  },
  sectionBarBlue: {
    backgroundColor: PRIMARY,
  },
  sectionTitle: {
    fontSize: setSpText(15),
    fontWeight: '500',
    color: '#000000',
  },
  capCard: {
    marginTop: scaleSizeH(14),
    borderRadius: scaleSizeW(10),
    overflow: 'hidden',
  },
  capHead: {
    height: scaleSizeH(58),
    paddingHorizontal: scaleSizeW(16),
    justifyContent: 'center',
    gap: scaleSizeH(5),
  },
  capHeadRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: scaleSizeW(5),
  },
  capLabel: {
    fontSize: setSpText(12),
    color: '#FFFFFF',
  },
  capCompany: {
    fontSize: setSpText(12),
    color: '#FFFFFF',
  },
  capBody: {
    backgroundColor: '#EEF3FF',
    paddingHorizontal: scaleSizeW(16),
    paddingTop: scaleSizeH(10),
    paddingBottom: scaleSizeH(22),
  },
  capBbsCount: {
    fontSize: setSpText(10),
    color: TEXT_SUB,
  },
  capContentBox: {
    marginTop: scaleSizeH(7),
  },
  capContent: {
    fontSize: setSpText(15),
    color: '#000000',
  },
  capBtns: {
    flexDirection: 'row',
    gap: scaleSizeW(10),
    marginTop: scaleSizeH(10),
  },
  capBtn: {
    flex: 1,
    paddingVertical: scaleSizeH(10),
    borderRadius: scaleSizeW(90),
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  capBtnText: {
    fontSize: setSpText(14),
    color: '#000000',
  },
  scriptBox: {
    marginTop: scaleSizeH(14),
    backgroundColor: '#EEF3FF',
    borderRadius: scaleSizeW(10),
    paddingHorizontal: scaleSizeW(16),
    paddingTop: scaleSizeH(14),
    paddingBottom: scaleSizeH(20),
  },
  scriptText: {
    fontSize: setSpText(14),
    lineHeight: setSpText(20),
    color: TEXT_SUB,
  },
  copyBtn: {
    marginTop: scaleSizeH(8),
    height: scaleSizeH(39),
    borderRadius: scaleSizeW(90),
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  copyBtnText: {
    fontSize: setSpText(14),
    color: '#000000',
  },
});
