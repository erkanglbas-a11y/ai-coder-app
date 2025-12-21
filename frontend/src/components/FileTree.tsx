'use client';

import React, { useState } from 'react';
import { 
  Folder, FolderOpen, FileCode, ChevronRight, ChevronDown, Trash2, File 
} from 'lucide-react';
import { useStore, File as FileType } from '@/store/useStore';

// Yardımcı Fonksiyon: Dosya listesini Ağaç Yapısına çevirir
const buildTree = (files: FileType[]) => {
  const root: any = {};

  files.forEach(file => {
    const parts = file.name.split('/'); // "frontend/src/App.js" -> ["frontend", "src", "App.js"]
    let current = root;

    parts.forEach((part, index) => {
      if (!current[part]) {
        // Eğer bu son parçaysa (dosya ise)
        if (index === parts.length - 1) {
          current[part] = { __file: file }; // Dosya objesini sakla
        } else {
          current[part] = {}; // Klasör oluştur
        }
      }
      current = current[part];
    });
  });

  return root;
};

// Recursive Klasör Bileşeni
const TreeNode = ({ name, node, depth, projectId }: any) => {
  const [isOpen, setIsOpen] = useState(true); // Klasörler varsayılan açık gelsin
  const { activeFile, setActiveFile, deleteFile } = useStore();
  const isFile = node.__file !== undefined;

  // İkon Belirleme
  const getIcon = () => {
    if (isFile) {
      if (name.endsWith('js') || name.endsWith('jsx') || name.endsWith('ts')) return <span className="text-yellow-400 font-bold text-[10px] w-4 text-center">JS</span>;
      if (name.endsWith('css')) return <span className="text-blue-400 font-bold text-[10px] w-4 text-center">#</span>;
      if (name.endsWith('html')) return <span className="text-orange-500 font-bold text-[10px] w-4 text-center">&lt;&gt;</span>;
      if (name.endsWith('json')) return <span className="text-yellow-200 font-bold text-[10px] w-4 text-center">{'{}'}</span>;
      return <FileCode size={14} className="text-gray-400" />;
    }
    return isOpen ? <FolderOpen size={14} className="text-blue-400" /> : <Folder size={14} className="text-blue-400" />;
  };

  if (isFile) {
    const file = node.__file;
    return (
      <div 
        onClick={() => setActiveFile(file)}
        className={`group flex items-center justify-between py-1 px-2 cursor-pointer transition-colors border-l-2 ${
          activeFile?.id === file.id 
            ? 'bg-[#37373d] border-blue-500 text-white' 
            : 'border-transparent text-gray-400 hover:bg-[#2a2d2e] hover:text-gray-200'
        }`}
        style={{ paddingLeft: `${depth * 12 + 10}px` }}
      >
        <div className="flex items-center gap-1.5 overflow-hidden">
          {getIcon()}
          <span className="truncate text-[13px]">{name}</span>
        </div>
        <button 
          onClick={(e) => { e.stopPropagation(); if(confirm('Sil?')) deleteFile(projectId, file.id); }}
          className="opacity-0 group-hover:opacity-100 text-gray-500 hover:text-red-400"
        >
          <Trash2 size={12} />
        </button>
      </div>
    );
  }

  // Klasör ise
  return (
    <div>
      <div 
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-1.5 py-1 px-2 cursor-pointer text-gray-300 hover:bg-[#2a2d2e] select-none"
        style={{ paddingLeft: `${depth * 10}px` }}
      >
        <span className="text-gray-500">
          {isOpen ? <ChevronDown size={12} /> : <ChevronRight size={12} />}
        </span>
        {getIcon()}
        <span className="text-[13px] font-medium">{name}</span>
      </div>
      
      {isOpen && (
        <div>
          {Object.keys(node).sort().map((childName) => (
            <TreeNode 
              key={childName} 
              name={childName} 
              node={node[childName]} 
              depth={depth + 1} 
              projectId={projectId}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default function FileTree({ files, projectId }: { files: FileType[], projectId: string }) {
  const tree = buildTree(files);

  if (files.length === 0) {
    return <div className="text-[11px] text-gray-600 pl-4 py-2 italic">Klasör boş.</div>;
  }

  return (
    <div className="mt-1 select-none">
      {Object.keys(tree).sort().map((name) => (
        <TreeNode 
          key={name} 
          name={name} 
          node={tree[name]} 
          depth={0} 
          projectId={projectId}
        />
      ))}
    </div>
  );
}