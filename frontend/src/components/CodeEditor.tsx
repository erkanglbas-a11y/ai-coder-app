'use client';
import Editor from '@monaco-editor/react';
import { useStore } from '@/store/useStore';

export default function CodeEditor() {
  const { activeFile, activeProjectId, updateFileContent } = useStore();

  if (!activeFile) {
    return (
      <div className="h-full flex flex-col items-center justify-center text-gray-600 bg-[#1e1e1e]">
        <div className="mb-4 p-4 rounded-full bg-gray-800">
           <svg className="w-12 h-12 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
             <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
           </svg>
        </div>
        <p className="text-lg font-medium">Dosya Seçilmedi</p>
        <p className="text-sm mt-2">Soldaki menüden bir dosyaya tıkla veya AI ile yeni kod üret.</p>
      </div>
    );
  }

  return (
    <div className="h-full w-full bg-[#1e1e1e]">
      <Editor
        height="100%"
        theme="vs-dark"
        path={activeFile.name}
        defaultLanguage={activeFile.language || 'javascript'}
        value={activeFile.content}
        // Değişiklik olduğunda Store'daki yeni updateFileContent fonksiyonunu kullan
        onChange={(value) => {
          if (activeProjectId) {
             updateFileContent(activeProjectId, activeFile.id, value || '');
          }
        }}
        options={{
          minimap: { enabled: true }, // Minimap'i açtık, daha profesyonel dursun
          fontSize: 14,
          scrollBeyondLastLine: false,
          automaticLayout: true,
          padding: { top: 20 }
        }}
      />
    </div>
  );
}