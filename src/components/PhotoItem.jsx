import React from 'react';
import { motion } from 'framer-motion';
import { Eye, Pencil, Trash2 } from 'lucide-react';

const PhotoItem = ({ photo, index, onEdit, onDelete, onPreview }) => {
  const triggerHaptic = () => {
    if (navigator.vibrate) {
      navigator.vibrate(10); // Subtle tactile pulse
    }
  };

  const getFilterStyle = (f, b) => {
    let filterStr = `brightness(${b || 100}%)`;
    if (f && f !== 'none') {
      if (f === 'grayscale') filterStr += ' grayscale(100%)';
      else if (f === 'sepia') filterStr += ' sepia(100%)';
      else if (f === 'negative') filterStr += ' invert(100%)';
      else if (f === 'darken') filterStr += ' brightness(0.7) contrast(1.1)';
      else if (f === 'vivid') filterStr += ' contrast(1.2) saturate(1.3)';
    }
    return filterStr;
  };

  return (
    <motion.div 
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.9 }}
      className="group relative aspect-[3/4] bg-slate-900 rounded-[2.5rem] border-2 border-white/20 shadow-2xl overflow-hidden"
    >
      {/* 🖼️ IMAGE CONTENT */}
      <img 
        src={photo.src} 
        className="absolute inset-0 w-full h-full object-cover transition-opacity duration-300 group-hover:opacity-80" 
        style={{ filter: getFilterStyle(photo.filter, photo.brightness) }}
        alt="" 
      />

      {/* 🏷️ PAGE BADGE */}
      <div className="absolute top-5 left-5 z-20 px-4 py-2 rounded-xl bg-indigo-500 text-white shadow-xl flex items-center gap-2">
        <span className="text-sm font-black">#{index + 1}</span>
      </div>

      {/* 👁️ CENTER PREVIEW ICON */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
        <button 
          onClick={(e) => { 
            e.stopPropagation(); 
            triggerHaptic();
            onPreview(); 
          }}
          className="h-20 w-20 rounded-full bg-white/10 border border-white/20 flex items-center justify-center backdrop-blur-md text-white opacity-0 group-hover:opacity-100 transition-all scale-75 group-hover:scale-100 pointer-events-auto shadow-2xl"
        >
           <Eye className="w-10 h-10" />
        </button>
      </div>

      {/* 🛠️ ACTION OVERLAY (Bottom-Anchored) */}
      <div className="absolute bottom-5 left-5 right-5 z-20 flex items-center justify-between gap-3 pointer-events-auto">
        <button 
          onClick={(e) => { 
            e.stopPropagation(); 
            triggerHaptic();
            onEdit(); 
          }}
          className="flex-1 h-14 bg-indigo-500/10 border-2 border-indigo-500/20 rounded-2xl shadow-xl flex items-center justify-center gap-3 text-indigo-400 active:scale-95 transition-all hover:bg-indigo-500/20 backdrop-blur-md"
        >
          <Pencil className="w-5 h-5" />
          <span className="text-[11px] font-black uppercase tracking-widest">Edit</span>
        </button>
        <button 
          onClick={(e) => { 
            e.stopPropagation(); 
            triggerHaptic();
            onDelete(); 
          }}
          className="h-14 w-14 bg-red-500/10 border-2 border-red-500/20 rounded-2xl flex items-center justify-center text-red-500 active:scale-95 transition-all shadow-xl backdrop-blur-md"
        >
          <Trash2 className="w-6 h-6" />
        </button>
      </div>
    </motion.div>
  );
};

export default PhotoItem;
