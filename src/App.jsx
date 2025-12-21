import React, { useState } from 'react';
import { useStore } from './store/useStore';
import ChatPanel from './components/ChatPanel';
import CodeEditor from './components/CodeEditor';
import { FileCode, Trash2, PanelLeftClose, PanelLeftOpen } from 'lucide-react';

export default function App() {
  const store = useStore();
  const [showEditor, setShowEditor] = useState(true);

  return (
    <div className="h-screen w-full bg-[#09090b] text-white flex overflow-hidden font-sans">
      
      {/* SOL MENÜ */}
      <div className="w-[250px] border-r border-gray-800 flex flex-col bg-[#18181b] shrink-0">
        <div className="p-4 border-b border-gray-800 flex justify-between items-center">
          <span className="font-bold text-gray-400 text-xs">DOSYALAR</span>
          <button onClick={() => store.resetWorkspace()} className="text-red-400 text-[10px] flex items-center gap-1"><Trash2 size={12}/> SİL</button>
        </div>
        <div className="flex-1 overflow-y-auto p-2">
          {store.files.map(file => (
            <div 
              key={file.id} 
              onClick={() => { store.setActiveFile(file); setShowEditor(true); }}
              className={`p-2 text-xs cursor-pointer flex items-center gap-2 rounded ${store.activeFile?.id === file.id ? 'bg-[#27272a] text-blue-400' : 'text-gray-400 hover:text-white'}`}
            >
              <FileCode size={14}/> {file.name}
            </div>
          ))}
          {store.files.length === 0 && <div className="text-gray-600 text-xs text-center mt-10">Dosya yok.</div>}
        </div>
      </div>

      {/* ORTA: CHAT */}
      <div className={`flex flex-col bg-[#1e1e1e] border-r border-gray-800 h-full ${showEditor ? 'w-[400px] shrink-0' : 'flex-1'}`}>
        <div className="h-12 border-b border-gray-800 flex items-center px-4 justify-between">
          <span className="text-xs font-bold text-gray-300">AI ASİSTAN</span>
          <button onClick={() => setShowEditor(!showEditor)} className="text-gray-500 hover:text-white">
            {showEditor ? <PanelLeftClose size={16}/> : <PanelLeftOpen size={16}/>}
          </button>
        </div>
        <div className="flex-1 overflow-hidden relative"><ChatPanel /></div>
      </div>

      {/* SAĞ: EDİTÖR */}
      {showEditor && (
        <div className="flex-1 bg-[#1e1e1e] flex flex-col h-full">
           <div className="h-12 bg-[#1e1e1e] border-b border-gray-800 flex items-center px-4 text-xs">
              {store.activeFile ? <span className="text-blue-400">{store.activeFile.name}</span> : <span className="text-gray-600">Dosya seçilmedi</span>}
           </div>
           <div className="flex-1 overflow-hidden"><CodeEditor /></div>
        </div>
      )}
    </div>
  );
}