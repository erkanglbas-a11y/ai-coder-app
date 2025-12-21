import React from 'react';
import { useStore } from '../store/useStore';

export default function CodeEditor() {
  const { activeFile, updateFileContent } = useStore();

  if (!activeFile) {
    return (
      <div className="flex h-full items-center justify-center text-gray-500 text-sm">
        Düzenlemek için soldan bir dosya seçin.
      </div>
    );
  }

  return (
    <textarea
      className="w-full h-full bg-[#1e1e1e] text-gray-300 p-4 font-mono text-sm outline-none resize-none"
      value={activeFile.content}
      onChange={(e) => updateFileContent(activeFile.id, e.target.value)}
      spellCheck={false}
    />
  );
}