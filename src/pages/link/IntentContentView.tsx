import React, { useState } from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import AppImage from '@/components/AppImage';
import LinearGradient from 'react-native-linear-gradient';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import Svg, { Path } from 'react-native-svg';
import { scaleSizeH, scaleSizeW, setSpText } from '@/utils/screenUtils';
import type { RootStackParamList } from '@/route/map';
import type { SignalIntentAbility } from './signalDraft';
import { ChevronRightIcon, VerifiedBadgeIcon } from './icons';

const PRIMARY = '#2962D4';
const TEXT_SUB = '#6C6C6C';
/** 企业能力折叠行数（原型 lc-capability-richtext：默认展示约 5 行，14px/24px 行高） */
const ABILITY_MAX_LINES = 5;

/** 收起/展开箭头 */
function ChevronVerticalIcon({ up }: { up?: boolean }) {
  const s = scaleSizeW(10);
  return (
    <Svg width={s} height={s} viewBox="0 0 10 10" fill="none">
      <Path
        d={up ? 'M1.5 6.5L5 3L8.5 6.5' : 'M1.5 3.5L5 7L8.5 3.5'}
        stroke="#999999"
        strokeWidth={1.2}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

export interface IntentFeedItem {
  id: string;
  title: string;
  sub: string;
  /** 封面图（无图回退占位） */
  cover?: string;
}

export interface IntentContentViewProps {
  /** 合作说明（蓝渐变卡正文） */
  quote: string;
  companyName: string;
  companySub: string;
  companyId?: number;
  companyLogo?: string;
  abilities: SignalIntentAbility[];
  feeds: IntentFeedItem[];
  contact: { name: string; title: string };
  contactCardId?: number;
}

/**
 * 合作意向书正文（客户看到的 UI）：吉祥物气泡 + 蓝渐变说明卡 → 发送企业 → 企业能力 → 关联动态 → 本次对接人。
 * CooperationIntentView（意向书详情）与合作信号预览「客户看到的」tab 共用，保证两处观感一致。
 */
export default function IntentContentView({
  quote,
  companyName,
  companySub,
  companyId,
  companyLogo,
  abilities,
  feeds,
  contact,
  contactCardId,
}: IntentContentViewProps) {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const [expanded, setExpanded] = useState(false);
  /** 未折叠时的总行数（onTextLayout 首次测量得到；折叠态被 numberOfLines 截断的行数不会覆盖它） */
  const [lineCount, setLineCount] = useState(0);
  const needsToggle = lineCount > ABILITY_MAX_LINES;
  const collapsed = needsToggle && !expanded;

  return (
    <>
      {/* 吉祥物 + 气泡 */}
      <View style={styles.mascotRow}>
        <AppImage
          source={require('@/assets/link/intent-mascot.png')}
          style={[styles.mascot, styles.mascotLayer]}
          contentFit="cover"
        />
        <View style={styles.bubble}>
          <Text style={styles.bubbleText}>本次合作说明</Text>
        </View>
      </View>

      {/* 合作说明（蓝渐变卡，顶部被吉祥物区压住） */}
      <LinearGradient colors={['#2962D4', '#5D8CE9']} style={styles.quoteCard}>
        <View style={styles.quoteInner}>
          <Text style={styles.quoteText}>{quote}</Text>
        </View>
      </LinearGradient>

      {/* 发送企业 */}
      <TouchableOpacity
        activeOpacity={0.85}
        style={styles.companyCard}
        onPress={() => {
          if (companyId) navigation.navigate('companyPage', { id: companyId });
        }}
      >
        <AppImage
          source={companyLogo ? { uri: companyLogo } : require('@/assets/link/mock-avatar.png')}
          style={styles.companyAvatar}
          contentFit="cover"
        />
        <View style={styles.companyInfo}>
          <View style={styles.companyNameRow}>
            <Text style={styles.companyName} numberOfLines={1}>{companyName}</Text>
            <VerifiedBadgeIcon size={14} />
          </View>
          <Text style={styles.companySub}>{companySub}</Text>
        </View>
        <ChevronRightIcon size={12} />
      </TouchableOpacity>

      {/* 企业能力正文（有内容才展示；超过 2 节才显示展开/收起） */}
      {abilities.length > 0 && (
        <View style={styles.letterCard}>
          <Text style={styles.sectionCardTitle}>企业能力</Text>
          <Text
            style={styles.letterText}
            numberOfLines={collapsed ? ABILITY_MAX_LINES : undefined}
            onTextLayout={e => {
              // 仅采纳未限行的完整测量结果（限行后回调的行数是截断值）
              if (lineCount === 0) setLineCount(e.nativeEvent.lines.length);
            }}
          >
            {abilities.map((sec, i) => (
              <Text key={sec.title}>
                {i > 0 && '\n\n'}
                {sec.title}
                {'\n'}
                <Text style={styles.letterTextBody}>{sec.body}</Text>
              </Text>
            ))}
          </Text>
          {needsToggle && (
            <TouchableOpacity
              activeOpacity={0.85}
              style={styles.collapseBtn}
              onPress={() => setExpanded(e => !e)}
            >
              <Text style={styles.collapseText}>{expanded ? '收起' : '展开'}</Text>
              <ChevronVerticalIcon up={expanded} />
            </TouchableOpacity>
          )}
        </View>
      )}

      {/* 关联动态（有才展示） */}
      {feeds.length > 0 && (
        <View style={styles.plainCard}>
          <Text style={styles.sectionCardTitle}>关联动态</Text>
          <View style={styles.feedList}>
            {feeds.map(item => (
              <TouchableOpacity
                key={item.id}
                activeOpacity={0.85}
                style={styles.feedRow}
                onPress={() => navigation.navigate('bbsDetail', { id: item.id })}
              >
                <AppImage
                  source={item.cover ? { uri: item.cover } : require('@/assets/link/mock-avatar.png')}
                  style={styles.feedAvatar}
                  contentFit="cover"
                />
                <View style={styles.feedInfo}>
                  <Text style={styles.feedTitle} numberOfLines={1}>{item.title}</Text>
                  {!!item.sub && <Text style={styles.feedSub} numberOfLines={1}>{item.sub}</Text>}
                </View>
                <ChevronRightIcon size={12} />
              </TouchableOpacity>
            ))}
          </View>
        </View>
      )}

      {/* 本次对接人（有才展示） */}
      {!!contact.name && (
        <TouchableOpacity
          activeOpacity={0.85}
          style={styles.plainCard}
          onPress={() => {
            if (contactCardId) navigation.navigate('cardDetail', { id: contactCardId });
          }}
        >
          <Text style={styles.sectionCardTitle}>本次对接人</Text>
          <View style={styles.contactRow}>
            <AppImage
              source={require('@/assets/link/mock-avatar.png')}
              style={styles.contactAvatar}
              contentFit="cover"
            />
            <View style={styles.contactInfo}>
              <Text style={styles.contactName}>{contact.name}</Text>
              <Text style={styles.contactRole}>{contact.title}</Text>
            </View>
            <ChevronRightIcon size={12} />
          </View>
        </TouchableOpacity>
      )}
    </>
  );
}

const styles = StyleSheet.create({
  mascotRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    height: scaleSizeW(46),
    marginLeft: scaleSizeW(12),
    zIndex: -1,
    transform: [{ translateY: scaleSizeH(17) }],
  },
  mascot: {
    width: scaleSizeW(63),
    height: scaleSizeW(63),
    marginTop: scaleSizeH(-17),
    transform: [{ scaleX: -1 }],
  },
  mascotLayer: {
    position: 'relative',
    zIndex: 1,
  },
  bubble: {
    marginLeft: scaleSizeW(-15),
    marginTop: scaleSizeH(9),
    backgroundColor: '#36BE69',
    borderTopLeftRadius: scaleSizeW(10),
    borderTopRightRadius: 90,
    borderBottomRightRadius: 90,
    paddingHorizontal: scaleSizeW(18),
    paddingVertical: scaleSizeH(3),
    transform: [{ translateY: scaleSizeH(-16) }],
  },
  bubbleText: {
    fontSize: setSpText(12),
    fontWeight: '600',
    lineHeight: setSpText(20),
    color: '#FFFFFF',
  },
  quoteCard: {
    borderRadius: scaleSizeW(10),
    paddingHorizontal: scaleSizeW(14),
  },
  quoteInner: {
    paddingHorizontal: scaleSizeW(14),
    paddingVertical: scaleSizeH(16),
  },
  quoteText: {
    fontSize: setSpText(15),
    fontWeight: '500',
    lineHeight: setSpText(24),
    color: '#FFFFFF',
  },
  companyCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: scaleSizeW(5),
    marginHorizontal: scaleSizeW(16),
    marginTop: scaleSizeH(10),
    backgroundColor: 'rgba(255,255,255,0.7)',
    borderWidth: 1,
    borderColor: '#FFFFFF',
    borderRadius: scaleSizeW(10),
    paddingHorizontal: scaleSizeW(14),
    paddingVertical: scaleSizeH(18),
  },
  companyAvatar: {
    width: scaleSizeW(36),
    height: scaleSizeW(36),
    borderRadius: scaleSizeW(18),
    borderWidth: 1,
    borderColor: '#EAEAEA',
  },
  companyInfo: {
    flex: 1,
    gap: scaleSizeH(5),
  },
  companyNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: scaleSizeW(2),
  },
  companyName: {
    fontSize: setSpText(14),
    fontWeight: '500',
    color: '#000000',
  },
  companySub: {
    fontSize: setSpText(12),
    lineHeight: setSpText(12),
    color: TEXT_SUB,
  },
  letterCard: {
    marginHorizontal: scaleSizeW(16),
    marginTop: scaleSizeH(10),
    backgroundColor: 'rgba(255,255,255,0.8)',
    borderWidth: 1,
    borderColor: '#FFFFFF',
    borderRadius: scaleSizeW(10),
    paddingHorizontal: scaleSizeW(14),
    paddingTop: scaleSizeH(14),
    paddingBottom: scaleSizeH(20),
  },
  sectionCardTitle: {
    fontSize: setSpText(14),
    fontWeight: '500',
    lineHeight: setSpText(24),
    color: '#000000',
  },
  letterText: {
    marginTop: scaleSizeH(13),
    fontSize: setSpText(14),
    fontWeight: '500',
    lineHeight: setSpText(24),
    color: '#000000',
  },
  letterTextBody: {
    fontWeight: '400',
    color: TEXT_SUB,
  },
  collapseBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: scaleSizeW(5),
    marginTop: scaleSizeH(14),
  },
  collapseText: {
    fontSize: setSpText(14),
    fontWeight: '500',
    color: PRIMARY,
  },
  plainCard: {
    marginHorizontal: scaleSizeW(16),
    marginTop: scaleSizeH(10),
    backgroundColor: 'rgba(255,255,255,0.8)',
    borderWidth: 1,
    borderColor: '#FFFFFF',
    borderRadius: scaleSizeW(10),
    paddingHorizontal: scaleSizeW(14),
    paddingTop: scaleSizeH(14),
    paddingBottom: scaleSizeH(18),
  },
  feedList: {
    marginTop: scaleSizeH(14),
    gap: scaleSizeH(26),
  },
  feedRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: scaleSizeW(10),
  },
  feedAvatar: {
    width: scaleSizeW(34),
    height: scaleSizeW(34),
    borderRadius: scaleSizeW(17),
    borderWidth: 1,
    borderColor: '#EEEEEE',
  },
  feedInfo: {
    flex: 1,
    gap: scaleSizeH(5),
  },
  feedTitle: {
    fontSize: setSpText(14),
    fontWeight: '500',
    color: '#000000',
  },
  feedSub: {
    fontSize: setSpText(12),
    color: TEXT_SUB,
  },
  contactRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: scaleSizeW(10),
    marginTop: scaleSizeH(10),
  },
  contactAvatar: {
    width: scaleSizeW(40),
    height: scaleSizeW(40),
    borderRadius: scaleSizeW(20),
  },
  contactInfo: {
    flex: 1,
    gap: scaleSizeH(5),
  },
  contactName: {
    fontSize: setSpText(14),
    fontWeight: '500',
    color: '#000000',
  },
  contactRole: {
    fontSize: setSpText(12),
    color: 'rgba(108,108,108,0.8)',
  },
});
