/**
 * 富文本编辑器页面桥接工具
 * 用于 AddItem -> RichTextEdit -> AddItem 的 HTML 数据传递
 */
interface EditorBridge {
  html: string | null;
}

const bridge: EditorBridge = {
  html: null,
};

export function setEditorResult(html: string) {
  bridge.html = html;
}

export function getEditorResult(): string | null {
  const result = bridge.html;
  bridge.html = null;
  return result;
}

export function peekEditorResult(): string | null {
  return bridge.html;
}
