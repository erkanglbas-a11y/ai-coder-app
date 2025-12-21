'use client';

import { FileCode, Trash2 } from 'lucide-react';
import { useStore } from '@/store/useStore';

export default function FileTree() {
  // Proje ID'sini kaldırdık, sadece dosya listesi ve silme fonksiyonu kaldı
  const { files, activeFile, setActiveFile, deleteFile } = useStore();

  if (files.length === 0) {
    return <div className="text-gray-500 text-xs text-center mt-4">Dosya yok.</div>;
  }

  return (
    <div className="space-y-1">
      {files
        .sort((a, b) => a.name.localeCompare(b.name))
        .map((file) => (
        <div
          key={file.id}
          onClick={() => setActiveFile(file)}
          className={`group flex items-center justify-between px-3 py-2 cursor-pointer rounded text-xs transition-colors ${
            activeFile?.id === file.id
              ? 'bg-[#27272a] text-blue-400 border-l-2 border-blue-500'
              : 'text-gray-400 hover:text-white hover:bg-[#27272a] border-l-2 border-transparent'
          }`}
        >
          <div className="flex items-center gap-2 truncate">
            <FileCode size={14} className="shrink-0" />
            <span className="truncate">{file.name}</span>
          </div>
          
          <button
            onClick={(e) => {
              e.stopPropagation(); // Tıklama editörü açmasın diye engelliyoruz
              if (confirm('Bu dosyayı silmek istediğine emin misin?')) {
                deleteFile(file.id); // <--- DÜZELTİLEN YER: Sadece file.id gönderiyoruz
              }
            }}
            className="opacity-0 group-hover:opacity-100 hover:text-red-400 transition-opacity p-1"
            title="Dosyayı Sil"
          >
            <Trash2 size={12} />
          </button>
        </div>
      ))}
    </div>
  );
}