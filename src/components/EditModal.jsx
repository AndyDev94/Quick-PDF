import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Image as ImageIcon, CheckCircle2, Palette, Layout, FileText, Settings2, X } from 'lucide-react';

const EditModal = ({ photo, onSave, onCancel }) => {
  const [brightness, setBrightness] = useState(photo.brightness || 100);
  const [filter, setFilter] = useState(photo.filter || 'none');

  const filters = [
    { id: 'none', name: 'Original', icon: ImageIcon },
    { id: 'vivid', name: 'Vivid', icon: Palette },
    { id: 'grayscale', name: 'B&W', icon: Layout },
    { id: 'darken', name: 'Scanner', icon: FileText },
    { id: 'negative', name: 'Invert', icon: Settings2 },
  ];

  const getFilterStyle = (f, b) => {
    let filterStr = `brightness(${b}%)`;
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
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[3000000] flex items-center justify-center p-0 md:p-10 bg-black/95 backdrop-blur-2xl overflow-hidden"
    >
      <div className="w-full h-full md:max-w-6xl md:max-h-[90vh] bg-slate-900 md:rounded-[3rem] border border-white/10 shadow-2xl flex flex-col overflow-hidden relative">
        {/* Header */}
        <div className="p-8 flex items-center justify-between bg-black/20 backdrop-blur-md border-b border-white/5">
          <div className="space-y-1">
            <span className="text-[10px] font-black text-indigo-400 uppercase tracking-widest">Editor Suite</span>
            <h3 className="text-xl font-black text-white uppercase tracking-widest">Retouch Document</h3>
          </div>
          <button 
            onClick={onCancel}
            className="h-14 w-14 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center text-white active:scale-95 transition-all"
          >
            <X className="w-7 h-7" />
          </button>
        </div>

        {/* Workspace */}
        <div className="flex-1 flex flex-col md:flex-row p-6 gap-8 overflow-hidden">
          {/* Hero Image */}
          <div className="flex-1 flex items-center justify-center bg-black/40 rounded-[2.5rem] overflow-hidden relative">
            <img 
              src={photo.src} 
              className="max-w-full max-h-full object-contain shadow-2xl transition-all duration-500" 
              style={{ filter: getFilterStyle(filter, brightness) }}
              alt="" 
            />
          </div>

          {/* Controls Panel */}
          <div className="w-full md:w-80 flex flex-col gap-8 py-4 overflow-y-auto custom-scrollbar">
            {/* Filter Grid */}
            <div className="space-y-4">
              <label className="text-[11px] font-black uppercase tracking-widest text-slate-500">Filter Presets</label>
              <div className="grid grid-cols-2 gap-3">
                {filters.map((f) => (
                  <button
                    key={f.id}
                    onClick={() => setFilter(f.id)}
                    className={`p-4 rounded-2xl border transition-all flex flex-col items-center gap-3 ${
                      filter === f.id 
                      ? 'bg-indigo-500 border-indigo-400 text-white shadow-lg shadow-indigo-500/20' 
                      : 'bg-white/5 border-white/10 text-slate-400 hover:bg-white/10'
                    }`}
                  >
                    <f.icon className="w-6 h-6" />
                    <span className="text-[9px] font-black uppercase tracking-widest">{f.name}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Brightness Slider */}
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <label className="text-[11px] font-black uppercase tracking-widest text-slate-500">Exposure</label>
                <span className="text-[11px] font-black text-indigo-400">{brightness}%</span>
              </div>
              <input 
                type="range" 
                min="50" 
                max="150" 
                value={brightness}
                onChange={(e) => setBrightness(e.target.value)}
                className="w-full h-2 bg-white/10 rounded-lg appearance-none cursor-pointer accent-indigo-500"
              />
            </div>

            {/* Save Actions */}
            <div className="mt-auto pt-8 flex flex-col gap-3">
              <button 
                onClick={() => onSave({ ...photo, brightness, filter })}
                className="w-full py-5 rounded-[2rem] bg-indigo-500 text-white font-black uppercase tracking-widest shadow-xl shadow-indigo-500/20 hover:scale-[1.02] active:scale-95 transition-all flex items-center justify-center gap-3"
              >
                <CheckCircle2 className="w-5 h-5" /> Update Page
              </button>
              <button 
                onClick={onCancel}
                className="w-full py-5 rounded-[2rem] bg-white/5 text-slate-400 font-black uppercase tracking-widest border border-white/10 hover:bg-white/10 transition-all"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
};

export default EditModal;
