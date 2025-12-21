import { create } from 'zustand';

export const useStore = create((set) => ({
  files: [],
  activeFile: null,

  addFile: (file) => set((state) => {
    const exists = state.files.find(f => f.name === file.name);
    if (exists) {
      return {
        files: state.files.map(f => f.name === file.name ? { ...f, content: file.content } : f),
        activeFile: exists 
      };
    }
    return { 
      files: [...state.files, file],
      activeFile: file 
    };
  }),

  updateFileContent: (fileId, content) => set((state) => ({
    files: state.files.map(f => f.id === fileId ? { ...f, content } : f),
    activeFile: state.activeFile?.id === fileId ? { ...state.activeFile, content } : state.activeFile
  })),

  deleteFile: (fileId) => set((state) => ({
    files: state.files.filter(f => f.id !== fileId),
    activeFile: state.activeFile?.id === fileId ? null : state.activeFile
  })),

  setActiveFile: (file) => set({ activeFile: file }),
  
  resetWorkspace: () => set({ files: [], activeFile: null })
}));