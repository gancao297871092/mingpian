import Toast from 'react-native-toast-message';

/** 话题最大长度（话题 = # 起、到空白符或下一个 # 止，与 RichText / LongHtmlView 的解析口径一致） */
export const TOPIC_LIMIT = 20;

let topicTipLastAt = 0;

/** 话题超长提示（2 秒内不重复弹） */
export function tipTopicOverLimit() {
  const now = Date.now();
  if (now - topicTipLastAt < 2000) return;
  topicTipLastAt = now;
  Toast.show({ type: 'info', text1: `话题不能超过${TOPIC_LIMIT}个字` });
}

/**
 * 话题输入拦截（纯文本正文用）：超长话题截断到 TOPIC_LIMIT 字
 * （按码点计数，与字数统计口径一致）；clamped = 是否发生了截断（用于触发提示）
 */
export function clampTopics(input: string): { text: string; clamped: boolean } {
  let clamped = false;
  const text = input.replace(/#([^\s#]+)#?/g, (raw, topic: string) => {
    const chars = [...topic];
    if (chars.length <= TOPIC_LIMIT) return raw;
    clamped = true;
    // 保留闭合 #（若有）
    const closed = raw.endsWith('#') ? '#' : '';
    return `#${chars.slice(0, TOPIC_LIMIT).join('')}${closed}`;
  });
  return { text, clamped };
}

/** 是否含超长话题（富文本 onHtmlChange 侧检测用：WebView 截断前的瞬时内容会带上来） */
export function hasOverlongTopic(text: string): boolean {
  const re = /#([^\s#]+)#?/g;
  let m: RegExpExecArray | null;
  while ((m = re.exec(text)) !== null) {
    if ([...m[1]].length > TOPIC_LIMIT) return true;
  }
  return false;
}
