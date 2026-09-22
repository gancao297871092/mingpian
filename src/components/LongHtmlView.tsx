import React from 'react';
import { Image, StyleSheet, View } from 'react-native';
import RenderHtml, { type MixedStyleDeclaration } from 'react-native-render-html';
import Svg, { Path } from 'react-native-svg';
import { scaleSizeW } from '@/utils/screenUtils';

/** video 标签替换为 OSS 截帧 img（render-html 不支持 video 标签） */
export function normalizeLongHtmlForPreview(html: string): string {
  return html
    .replace(/<video\b[^>]*>/gi, tag => {
      const m = tag.match(/src=["']([^"']+)["']/i);
      if (!m) return '';
      const poster = `${m[1]}?x-oss-process=video/snapshot,t_0,f_jpg,w_750,h_1000,m_fast`;
      return `<img class="ql-video-preview" src="${poster}" />`;
    })
    .replace(/<\/video>/gi, '');
}

function LongImgRenderer({ tnode, InternalRenderer, ...props }: any) {
  const cls = tnode?.attributes?.class || '';
  if (cls.includes('ql-video-preview')) {
    const src = tnode?.attributes?.src;
    if (!src) return null;
    return (
      <View style={styles.videoBox}>
        <Image source={{ uri: src }} style={styles.videoImg} resizeMode="cover" />
        <View style={styles.playBtn}>
          <Svg width={scaleSizeW(22)} height={scaleSizeW(22)} viewBox="0 0 24 24">
            <Path
              d="M9.5 6.8v10.4c0 .8.9 1.3 1.6.9l8.2-5.2c.6-.4.6-1.4 0-1.8l-8.2-5.2c-.7-.4-1.6.1-1.6.9z"
              fill="#1A1A1A"
            />
          </Svg>
        </View>
      </View>
    );
  }
  return <InternalRenderer tnode={tnode} {...props} />;
}

const renderers = { img: LongImgRenderer };

interface LongHtmlViewProps {
  html: string;
  contentWidth: number;
  baseStyle?: MixedStyleDeclaration;
}

function LongHtmlView({ html, contentWidth, baseStyle }: LongHtmlViewProps) {
  return (
    <RenderHtml
      contentWidth={contentWidth}
      source={{ html: normalizeLongHtmlForPreview(html) }}
      baseStyle={baseStyle}
      renderers={renderers as any}
    />
  );
}

export default React.memo(LongHtmlView);

const styles = StyleSheet.create({
  videoBox: {
    width: '100%',
    height: scaleSizeW(200),
    backgroundColor: '#000000',
    justifyContent: 'center',
    alignItems: 'center',
  },
  videoImg: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  playBtn: {
    width: scaleSizeW(46),
    height: scaleSizeW(46),
    borderRadius: scaleSizeW(23),
    backgroundColor: 'rgba(255,255,255,0.92)',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000000',
    shadowOpacity: 0.18,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 5,
  },
});
