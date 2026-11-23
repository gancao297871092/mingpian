import React, { useEffect, useMemo, useState } from 'react';
import { Image, InteractionManager, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import RenderHtml, { type MixedStyleDeclaration } from 'react-native-render-html';
import Svg, { Path } from 'react-native-svg';
import Video from 'react-native-video';
import { scaleSizeH, scaleSizeW } from '@/utils/screenUtils';

/** video 标签替换为 OSS 截帧 img（render-html 不支持 video 标签）；img 统一加 OSS 缩放参数避免加载原图 */
export function normalizeLongHtmlForPreview(html: string): string {
  return html
    .replace(/<video\b[^>]*>/gi, tag => {
      const m = tag.match(/src=["']([^"']+)["']/i);
      if (!m) return '';
      const poster = `${m[1]}?x-oss-process=video/snapshot,t_0,f_jpg,w_750,h_1000,m_fast`;
      return `<img class="ql-video-preview" src="${poster}" />`;
    })
    .replace(/<\/video>/gi, '')
    .replace(/(<img\b[^>]*src=["'])([^"']+)(["'][^>]*>)/gi, (match, prefix, src, suffix) => {
      // 视频截帧图已带处理参数；其余图片按屏宽缩放+压缩，不加载原图
      if (/x-oss-process=/.test(src)) return match;
      if (!/^https?:\/\//.test(src)) return match;
      const sep = src.includes('?') ? '&' : '?';
      return `${prefix}${src}${sep}x-oss-process=image/resize,w_1080/quality,q_80${suffix}`;
    });
}

/** 视频截帧图 → 点击内联播放 */
function RichVideoBox({ poster }: { poster: string }) {
  const [playing, setPlaying] = useState(false);
  const videoSrc = poster.replace(/\?x-oss-process=.*$/, '');
  if (playing) {
    return (
      <Video
        source={{ uri: videoSrc }}
        style={styles.videoBox}
        controls
        paused={false}
        resizeMode="contain"
      />
    );
  }
  return (
    <TouchableOpacity activeOpacity={0.9} onPress={() => setPlaying(true)}>
      <View style={styles.videoBox}>
        <Image source={{ uri: poster }} style={styles.videoImg} resizeMode="cover" />
        <View style={styles.playBtn}>
          <Svg width={scaleSizeW(22)} height={scaleSizeW(22)} viewBox="0 0 24 24">
            <Path
              d="M9.5 6.8v10.4c0 .8.9 1.3 1.6.9l8.2-5.2c.6-.4.6-1.4 0-1.8l-8.2-5.2c-.7-.4-1.6.1-1.6.9z"
              fill="#1A1A1A"
            />
          </Svg>
        </View>
      </View>
    </TouchableOpacity>
  );
}

interface LongHtmlViewProps {
  html: string;
  contentWidth: number;
  baseStyle?: MixedStyleDeclaration;
  /** 标签样式（会合并到内置默认值之上，可覆盖） */
  tagsStyles?: Record<string, MixedStyleDeclaration>;
  /** 点击富文本图片（查看大图） */
  onImagePress?: (urls: string[], index: number) => void;
}

/**
 * 与 Quill 编辑器（LongTextEdit）对齐：块级元素不带上下外边距。
 * render-html 默认按浏览器 UA 样式给 p 等加 1em 上下 margin，而 Quill 每行一个 <p>，
 * 会导致预览间距远大于编辑器内所见；统一归零后间距完全由 baseStyle 的 lineHeight 决定。
 */
const DEFAULT_TAGS_STYLES: Record<string, MixedStyleDeclaration> = {
  p: { marginTop: 0, marginBottom: 0 },
  div: { marginTop: 0, marginBottom: 0 },
  blockquote: { marginTop: 0, marginBottom: 0 },
  h1: { marginTop: 0, marginBottom: 0 },
  h2: { marginTop: 0, marginBottom: 0 },
  h3: { marginTop: 0, marginBottom: 0 },
  h4: { marginTop: 0, marginBottom: 0 },
  h5: { marginTop: 0, marginBottom: 0 },
  h6: { marginTop: 0, marginBottom: 0 },
  ul: { marginTop: 0, marginBottom: 0 },
  ol: { marginTop: 0, marginBottom: 0 },
  li: { marginTop: 0, marginBottom: 0 },
  pre: { marginTop: 0, marginBottom: 0 },
};

function LongHtmlView({ html, contentWidth, baseStyle, tagsStyles, onImagePress }: LongHtmlViewProps) {
  // 富文本构建整棵文档树会阻塞 JS 线程：先出纯文本轮廓，转场结束后再挂载完整渲染
  const [ready, setReady] = useState(false);
  const normalized = useMemo(() => normalizeLongHtmlForPreview(html), [html]);
  const plainPreview = useMemo(
    () => html.replace(/<[^>]*>/g, '').replace(/&nbsp;/g, ' ').trim(),
    [html],
  );
  const imageUrls = useMemo(() => {
    const urls: string[] = [];
    const regex = /<img\b[^>]*src=["']([^"']+)["'][^>]*>/gi;
    let m: RegExpExecArray | null;
    while ((m = regex.exec(normalized)) !== null) {
      if (!/ql-video-preview/.test(m[0])) urls.push(m[1]);
    }
    return urls;
  }, [normalized]);
  const mergedTagsStyles = useMemo(
    () => (tagsStyles ? { ...DEFAULT_TAGS_STYLES, ...tagsStyles } : DEFAULT_TAGS_STYLES),
    [tagsStyles],
  );

  const renderers = useMemo(
    () => ({
      img: ({ tnode, InternalRenderer, ...props }: any) => {
        const cls = tnode?.attributes?.class || '';
        if (cls.includes('ql-video-preview')) {
          const src = tnode?.attributes?.src;
          if (!src) return null;
          return <RichVideoBox poster={src} />;
        }
        const src = tnode?.attributes?.src;
        return (
          <TouchableOpacity
            activeOpacity={0.9}
            onPress={() => {
              if (!src || !onImagePress) return;
              const index = imageUrls.indexOf(src);
              onImagePress(imageUrls, index >= 0 ? index : 0);
            }}
          >
            <InternalRenderer tnode={tnode} {...props} />
          </TouchableOpacity>
        );
      },
    }),
    [imageUrls, onImagePress],
  );

  useEffect(() => {
    const task = InteractionManager.runAfterInteractions(() => setReady(true));
    return () => task.cancel();
  }, []);

  if (!ready) {
    return (
      <Text style={[baseStyle as any, styles.previewText]} numberOfLines={8}>
        {plainPreview}
      </Text>
    );
  }

  return (
    <RenderHtml
      contentWidth={contentWidth}
      source={{ html: normalized }}
      baseStyle={baseStyle}
      tagsStyles={mergedTagsStyles}
      renderers={renderers as any}
      renderersProps={{
        img: {
          initialDimensions: { width: contentWidth, height: Math.round(contentWidth * 0.75) },
        },
      }}
    />
  );
}

export default React.memo(LongHtmlView);

const styles = StyleSheet.create({
  previewText: {
    lineHeight: scaleSizeH(24),
  },
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
