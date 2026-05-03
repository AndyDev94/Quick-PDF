import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Download, Trash2, Zap, Image as ImageIcon, MoreVertical, LayoutTemplate, FileText, Smartphone, Ruler, Hash, Maximize, FileImage, Layout, Minimize2, Check, Monitor, Ban, ArrowDown, CornerRightUp, CornerRightDown, Wand2 } from 'lucide-react';

const ExportModal = ({ 
  isOpen, 
  onClose, 
  filename, 
  setFilename, 
  pageSize, 
  setPageSize, 
  pageOrientation, 
  setPageOrientation, 
  pdfMargin, 
  setPdfMargin, 
  fillSpace, 
  setFillSpace,
  numPos, 
  setNumPos, 
  isCompressed,
  setIsCompressed,
  compressionLevel,
  setCompressionLevel,
  onResetSession,
  onSaveImagesClick,
  onExport 
}) => {
  const [showResetConfirm, setShowResetConfirm] = React.useState(false);
  const [showMenu, setShowMenu] = React.useState(false);

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0" style={{ zIndex: 999999 }}>
        <motion.div 
          initial={{ opacity: 0 }} 
          animate={{ opacity: 1 }} 
          exit={{ opacity: 0 }} 
          onClick={onClose}
          className="absolute inset-0 bg-slate-950/95 backdrop-blur-2xl" 
        />
        
        <motion.div 
          initial={{ opacity: 0, scale: 0.95, y: 20 }} 
          animate={{ opacity: 1, scale: 1, y: 0 }} 
          exit={{ opacity: 0, scale: 0.95, y: 20 }} 
          className="relative w-full h-full md:h-auto md:max-w-2xl bg-slate-900 border border-white/10 md:rounded-[3rem] shadow-2xl flex flex-col md:max-h-[90vh] mx-auto my-auto"
        >
          {/* Header */}
          <div className="px-8 py-6 border-b border-white/5 flex items-center justify-between shrink-0 bg-black/20 md:rounded-t-[3rem]">
            <div className="space-y-1">
              <h3 className="text-xl font-black text-white uppercase tracking-widest flex items-center gap-3">
                  PDF Settings
              </h3>
            </div>
            <div className="flex items-center gap-2">
              <div className="relative">
                <button onClick={() => setShowMenu(!showMenu)} className="h-10 w-10 rounded-xl bg-white/5 flex items-center justify-center text-slate-400 hover:text-white transition-all border border-white/5">
                  <MoreVertical className="w-5 h-5" />
                </button>
                <AnimatePresence>
                  {showMenu && (
                    <motion.div 
                      initial={{ opacity: 0, scale: 0.95, y: -10 }} 
                      animate={{ opacity: 1, scale: 1, y: 0 }} 
                      exit={{ opacity: 0, scale: 0.95, y: -10 }} 
                      className="absolute right-0 top-full mt-2 w-max min-w-[12rem] bg-slate-800 border border-white/10 rounded-xl shadow-2xl z-[9999] origin-top-right"
                    >
                      <button 
                        onClick={() => { setShowMenu(false); onSaveImagesClick(); }} 
                        className="w-full px-5 py-4 flex items-center gap-3 text-left hover:bg-white/5 text-white text-[10px] font-black uppercase tracking-[0.1em] transition-all whitespace-nowrap rounded-xl"
                      >
                        <ImageIcon className="w-4 h-4 text-indigo-400 shrink-0" /> Save as JPGs
                      </button>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
              <button onClick={onClose} className="h-10 w-10 rounded-xl bg-white/5 flex items-center justify-center text-slate-400 hover:text-white transition-all border border-white/5">
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Scrollable Options */}
          <div className="flex-1 overflow-y-auto px-6 py-8 flex flex-col gap-8 custom-scrollbar">
              
              {/* Document Filename Section */}
              <div className="bg-white/[0.02] border border-white/5 rounded-[2rem] p-6 space-y-4">
                  <label className="text-[10px] font-black uppercase tracking-[0.2em] text-indigo-400 flex items-center gap-2">
                      <FileText className="w-4 h-4" /> Document Name
                  </label>
                  <div className="relative group">
                      <input 
                        type="text" 
                        value={filename}
                        onChange={(e) => setFilename(e.target.value)}
                        className="w-full bg-black/40 border border-white/10 rounded-2xl pl-5 pr-14 py-4 text-sm font-bold text-white focus:border-indigo-500 transition-all outline-none"
                      />
                      <div className="absolute right-4 top-1/2 -translate-y-1/2 text-[10px] font-black text-slate-500 uppercase tracking-widest">.pdf</div>
                  </div>
              </div>

              {/* Page Size */}
              <div className="bg-white/[0.02] border border-white/5 rounded-[2rem] p-6 space-y-5">
                  <label className="text-[10px] font-black uppercase tracking-[0.2em] text-indigo-400 flex items-center gap-2">
                      <LayoutTemplate className="w-4 h-4" /> Paper Size
                  </label>
                  <div className="grid grid-cols-3 gap-3">
                    {[
                        { id: 'a4', label: 'A4', icon: <FileImage className="w-6 h-6 mb-2 opacity-80" /> },
                        { id: 'letter', label: 'Letter', icon: <Layout className="w-6 h-6 mb-2 opacity-80" /> },
                        { id: 'free', label: 'Free', icon: <Maximize className="w-6 h-6 mb-2 opacity-80" /> }
                    ].map(s => (
                      <button key={s.id} onClick={() => setPageSize(s.id)} className={`aspect-square flex flex-col items-center justify-center rounded-2xl border text-[11px] font-black uppercase tracking-widest transition-all ${pageSize === s.id ? 'bg-indigo-500 border-indigo-500 text-white shadow-lg' : 'bg-black/20 border-white/5 text-slate-400 hover:bg-white/5'}`}>
                        {s.icon}
                        {s.label}
                      </button>
                    ))}
                  </div>
              </div>

              {/* Orientation */}
              <div className="bg-white/[0.02] border border-white/5 rounded-[2rem] p-6 space-y-5">
                  <label className="text-[10px] font-black uppercase tracking-[0.2em] text-indigo-400 flex items-center gap-2">
                      <Smartphone className="w-4 h-4" /> Orientation
                  </label>
                  <div className="grid grid-cols-3 gap-2">
                    {[
                        { id: 'portrait', label: 'Portrait', icon: <Smartphone className="w-5 h-5 mb-2 opacity-80" /> },
                        { id: 'landscape', label: 'Landscape', icon: <Monitor className="w-5 h-5 mb-2 opacity-80" /> },
                        { id: 'auto', label: 'Auto', icon: <Wand2 className="w-5 h-5 mb-2 opacity-80" /> }
                    ].map(o => (
                      <button key={o.id} onClick={() => setPageOrientation(o.id)} className={`aspect-square flex flex-col items-center justify-center rounded-2xl border text-[10px] font-black uppercase tracking-widest transition-all ${pageOrientation === o.id ? 'bg-indigo-500 border-indigo-500 text-white shadow-lg' : 'bg-black/20 border-white/5 text-slate-400 hover:bg-white/5'}`}>
                        {o.icon}
                        {o.label}
                      </button>
                    ))}
                  </div>
              </div>

              {/* Margins */}
              <div className="bg-white/[0.02] border border-white/5 rounded-[2rem] p-6 space-y-5">
                  <label className="text-[10px] font-black uppercase tracking-[0.2em] text-indigo-400 flex items-center gap-2">
                      <Ruler className="w-4 h-4" /> Page Margins
                  </label>
                  <div className="grid grid-cols-4 gap-3">
                    {[0, 5, 10, 20].map(m => (
                      <button key={m} onClick={() => setPdfMargin(m)} className={`aspect-square flex flex-col items-center justify-center rounded-2xl border text-[12px] font-black uppercase tracking-widest transition-all ${pdfMargin === m ? 'bg-indigo-500 border-indigo-500 text-white shadow-lg' : 'bg-black/20 border-white/5 text-slate-400 hover:bg-white/5'}`}>
                        <span className="text-[16px] font-black mb-1 opacity-90">{m}</span>
                        <span className="text-[8px] opacity-60">px</span>
                      </button>
                    ))}
                  </div>
              </div>

              {/* Scaling Mode */}
              <div className="bg-white/[0.02] border border-white/5 rounded-[2rem] p-6 space-y-5">
                  <label className="text-[10px] font-black uppercase tracking-[0.2em] text-indigo-400 flex items-center gap-2">
                      <Maximize className="w-4 h-4" /> Scaling Mode
                  </label>
                  <div className="grid grid-cols-2 gap-3">
                    <button onClick={() => setFillSpace(false)} className={`aspect-[4/3] flex flex-col items-center justify-center rounded-2xl border text-[11px] font-black uppercase tracking-widest transition-all ${!fillSpace ? 'bg-indigo-500 border-indigo-500 text-white shadow-lg' : 'bg-black/20 border-white/5 text-slate-400 hover:bg-white/5'}`}>
                      <Minimize2 className="w-6 h-6 mb-2 opacity-80" />
                      Fit Entirely
                    </button>
                    <button onClick={() => setFillSpace(true)} className={`aspect-[4/3] flex flex-col items-center justify-center rounded-2xl border text-[11px] font-black uppercase tracking-widest transition-all ${fillSpace ? 'bg-indigo-500 border-indigo-500 text-white shadow-lg' : 'bg-black/20 border-white/5 text-slate-400 hover:bg-white/5'}`}>
                      <Maximize className="w-6 h-6 mb-2 opacity-80" />
                      Fill Space
                    </button>
                  </div>
              </div>
              
              {/* Page Numbers */}
              <div className="bg-white/[0.02] border border-white/5 rounded-[2rem] p-6 space-y-5">
                  <label className="text-[10px] font-black uppercase tracking-[0.2em] text-indigo-400 flex items-center gap-2">
                      <Hash className="w-4 h-4" /> Page Numbers
                  </label>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    {[
                      { id: 'bottom-center', label: 'Bottom Center', icon: <ArrowDown className="w-5 h-5 mb-2 opacity-80" /> },
                      { id: 'top-right', label: 'Top Right', icon: <CornerRightUp className="w-5 h-5 mb-2 opacity-80" /> },
                      { id: 'bottom-right', label: 'Bottom Right', icon: <CornerRightDown className="w-5 h-5 mb-2 opacity-80" /> },
                      { id: 'none', label: 'None', icon: <Ban className="w-5 h-5 mb-2 opacity-80" /> }
                    ].map(p => (
                      <button key={p.id} onClick={() => setNumPos(p.id)} className={`aspect-square flex flex-col items-center justify-center rounded-2xl border text-[9px] font-black uppercase tracking-[0.1em] transition-all px-2 ${numPos === p.id ? 'bg-indigo-500 border-indigo-500 text-white shadow-lg' : 'bg-black/20 border-white/5 text-slate-400 hover:bg-white/5'}`}>
                        {p.icon}
                        <span className="text-center leading-tight">{p.label}</span>
                      </button>
                    ))}
                  </div>
              </div>

            {/* COMPRESSION SETTINGS */}
            <div className="p-6 rounded-[2rem] bg-indigo-500/5 border border-white/10 space-y-6 shadow-2xl relative group">
                <div className="absolute -right-10 -top-10 w-40 h-40 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none group-hover:bg-indigo-500/20 transition-colors" />

                <div className="flex items-center justify-between gap-6 relative z-10">
                    <div className="flex-1 space-y-1">
                        <label className="text-[12px] font-black uppercase tracking-[0.2em] text-white flex items-center gap-2">
                            <Zap className="w-4 h-4 text-indigo-400" /> Compress PDF
                        </label>
                        <p className="text-[9px] text-slate-500 font-bold uppercase tracking-widest leading-relaxed">Reduce file size for sharing</p>
                    </div>
                    <button 
                        onClick={() => setIsCompressed(!isCompressed)}
                        className={`w-14 h-8 rounded-full relative transition-all duration-500 shadow-inner overflow-hidden shrink-0 ${isCompressed ? 'bg-indigo-600' : 'bg-slate-800'}`}
                    >
                        <div className={`absolute inset-0 transition-opacity duration-500 ${isCompressed ? 'opacity-100 bg-gradient-to-r from-indigo-500 to-violet-500' : 'opacity-0'}`} />
                        <motion.div 
                            layout
                            transition={{ type: "spring", stiffness: 500, damping: 30 }}
                            className={`absolute top-1 w-6 h-6 rounded-full shadow-2xl flex items-center justify-center z-10 ${isCompressed ? 'right-1 bg-white text-indigo-600' : 'left-1 bg-slate-400 text-slate-800'}`}
                        >
                            <Zap className={`w-3 h-3 transition-transform duration-500 ${isCompressed ? 'rotate-0 scale-110' : 'rotate-12 scale-90'}`} />
                        </motion.div>
                    </button>
                </div>

                <AnimatePresence>
                    {isCompressed && (
                        <motion.div 
                            initial={{ height: 0, opacity: 0, marginTop: 0 }}
                            animate={{ height: 'auto', opacity: 1, marginTop: 16 }}
                            exit={{ height: 0, opacity: 0, marginTop: 0 }}
                            className="overflow-hidden space-y-4 pt-6 pb-2 border-t border-white/5"
                        >
                            <div className="flex justify-between items-center text-[9px] font-black uppercase tracking-widest">
                                <span className="text-slate-500">Optimization Level</span>
                                <span className="text-indigo-400">{compressionLevel}%</span>
                            </div>
                            <div className="relative group px-1 pb-2">
                                <input 
                                    type="range" 
                                    min="10" 
                                    max="95" 
                                    value={compressionLevel} 
                                    onChange={(e) => setCompressionLevel(parseInt(e.target.value))} 
                                    className="w-full h-1.5 bg-white/10 rounded-full appearance-none accent-indigo-500 cursor-pointer"
                                />
                                <div className="flex justify-between mt-3 text-[8px] font-black text-slate-600 uppercase tracking-[0.3em]">
                                    <span>Extreme Compress</span>
                                    <span>Best Quality</span>
                                </div>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>

            {/* SESSION MANAGEMENT */}
            <div className="flex justify-center pt-4 pb-8">
                <button 
                  onClick={() => setShowResetConfirm(true)}
                  className="px-8 py-4 rounded-2xl bg-white/[0.02] border border-white/5 text-slate-400 text-[11px] font-black uppercase tracking-widest hover:bg-white/5 hover:text-white transition-all flex items-center gap-3 active:scale-95"
                >
                    <Trash2 className="w-4 h-4 opacity-80" /> Reset Session
                </button>
            </div>
          </div>

          {/* Action Footer */}
          <div className="p-6 border-t border-white/5 bg-black/40 shrink-0 md:rounded-b-[3rem]">
            <button 
              onClick={onExport}
              className="w-full py-5 rounded-full bg-indigo-500 text-white flex items-center justify-center gap-3 shadow-[0_20px_50px_rgba(99,102,241,0.4)] active:scale-95 transition-all group"
            >
              <Download className="w-6 h-6 group-hover:translate-y-1 transition-transform" />
              <span className="text-[14px] font-black uppercase tracking-[0.1em]">Generate PDF</span>
            </button>
          </div>
        </motion.div>

        {/* 🚀 RESET CONFIRMATION OVERLAY */}
        <AnimatePresence>
          {showResetConfirm && (
            <motion.div 
              initial={{ opacity: 0 }} 
              animate={{ opacity: 1 }} 
              exit={{ opacity: 0 }}
              className="absolute inset-0 flex items-center justify-center p-8"
              style={{ zIndex: 9999999 }}
            >
               <div className="absolute inset-0 bg-slate-950/90 backdrop-blur-xl" onClick={() => setShowResetConfirm(false)} />
               <motion.div 
                 initial={{ scale: 0.9, opacity: 0, y: 20 }}
                 animate={{ scale: 1, opacity: 1, y: 0 }}
                 exit={{ scale: 0.9, opacity: 0, y: 20 }}
                 className="relative bg-slate-900 border border-white/10 rounded-[2.5rem] p-8 max-w-sm w-full text-center space-y-6 shadow-2xl"
               >
                  <div className="h-16 w-16 bg-red-500/10 border border-red-500/20 rounded-full flex items-center justify-center mx-auto text-red-500">
                      <Trash2 className="w-8 h-8" />
                  </div>
                  <div className="space-y-2">
                      <h4 className="text-white font-black text-lg uppercase tracking-widest">Start Fresh?</h4>
                      <p className="text-slate-500 text-[10px] font-bold uppercase tracking-widest leading-relaxed">This will delete all photos in your current session. This action cannot be undone.</p>
                  </div>
                  <div className="grid grid-cols-1 gap-3">
                      <button 
                        onClick={() => {
                          onResetSession();
                          setShowResetConfirm(false);
                        }} 
                        className="w-full py-5 rounded-2xl bg-red-500 text-white text-[11px] font-black uppercase tracking-widest shadow-xl shadow-red-500/20 active:scale-95 transition-all"
                      >
                        Confirm Reset
                      </button>
                      <button onClick={() => setShowResetConfirm(false)} className="w-full py-5 rounded-2xl bg-white/5 border border-white/10 text-slate-400 text-[11px] font-black uppercase tracking-widest hover:text-white transition-all">Cancel</button>
                  </div>
               </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </AnimatePresence>
  );
};

export default ExportModal;
