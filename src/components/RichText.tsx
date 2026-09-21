import React, { useMemo } from 'react';
import { StyleSheet, Text, type TextStyle } from 'react-native';

const TAG_RE = /#(\S+)/g;

interface TextPart {
  type: 'text' | 'tag';
  value: string;
  raw?: string;
}

function parseTags(text: string): TextPart[] {
  const parts: TextPart[] = [];
  let lastIndex = 0;
  let match: RegExpExecArray | null;

  while ((match = TAG_RE.exec(text)) !== null) {
    if (match.index > lastIndex) {
      parts.push({ type: 'text', value: text.slice(lastIndex, match.index) });
    }
    parts.push({ type: 'tag', value: match[1], raw: match[0] });
    lastIndex = match.index + match[0].length;
  }

  if (lastIndex < text.length) {
    parts.push({ type: 'text', value: text.slice(lastIndex) });
  }

  return parts;
}

interface RichTextProps {
  content: string;
  style?: TextStyle;
  tagStyle?: TextStyle;
  onTagPress?: (tagName: string) => void;
}

export default function RichText({ content, style, tagStyle, onTagPress }: RichTextProps) {
  const parts = useMemo(() => parseTags(content), [content]);

  if (parts.length === 0) {
    return <Text style={style}>{content}</Text>;
  }

  return (
    <Text style={style}>
      {parts.map((part, index) => {
        if (part.type === 'tag') {
          return (
            <Text
              key={index}
              style={[styles.tag, tagStyle]}
              onPress={onTagPress ? () => onTagPress(part.value) : undefined}
            >
              {part.raw}
            </Text>
          );
        }
        return <Text key={index}>{part.value}</Text>;
      })}
    </Text>
  );
}

const styles = StyleSheet.create({
  tag: {
    color: '#2962D4',
  },
});
