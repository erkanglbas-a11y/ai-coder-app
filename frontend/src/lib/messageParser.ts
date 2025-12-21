export interface MessagePart {
  type: 'text' | 'code';
  content?: string;
  fileName?: string;
  code?: string;
  language?: string;
}

export const parseMessage = (text: string): MessagePart[] => {
  const parts: MessagePart[] = [];
  
  // Regex: [FILE: ...] bloğunu ve sonrasındaki kod bloğunu yakalar
  const regex = /\[FILE:\s*(.+?)\]\s*```(?:(\w+)\n)?([\s\S]*?)```/g;
  
  let lastIndex = 0;
  let match;

  while ((match = regex.exec(text)) !== null) {
    const textContent = text.substring(lastIndex, match.index).trim();
    if (textContent) {
      parts.push({ type: 'text', content: textContent });
    }

    const fileName = match[1].trim();
    const language = match[2] || 'javascript';
    const code = match[3].trim();

    parts.push({
      type: 'code',
      fileName: fileName,
      code: code,
      language: language
    });

    lastIndex = regex.lastIndex;
  }

  const remainingText = text.substring(lastIndex).trim();
  if (remainingText) {
    parts.push({ type: 'text', content: remainingText });
  }

  if (parts.length === 0) {
    return [{ type: 'text', content: text }];
  }

  return parts;
};