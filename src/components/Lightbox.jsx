import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Eye, ChevronLeft, ChevronRight } from 'lucide-react';

const Lightbox = ({ 
  photos, 
  previewIndex, 
  setPreviewIndex, 
  zoom, 
  setZoom, 
  lastTap, 
  setLastTap, 
  zoomOrigin, 
  setZoomOrigin 
}) => {
  if (previewIndex === null) return null;

  const currentPhoto = photos[previewIndex];

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

  const handleTap = (e, info) => {
    const now = Date.now();
    if (now - lastTap < 300) {
      if (zoom === 1) {
        const rect = e.target.getBoundingClientRect();
        const x = ((info.point.x - rect.left) / rect.width) * 100;
        const y = ((info.point.y - rect.top) / rect.height) * 100;
        setZoomOrigin(`${x}% ${y}%`);
        setZoom(3);
      } else {
        setZoom(1);
        setZoomOrigin("center");
      }
    }
    setLastTap(now);
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0" style={{ zIndex: 2000000 }}>
         {/* 🌑 BACKDROP */}
         <motion.div 
            initial={{ opacity: 0 }} 
            animate={{ opacity: 1 }} 
            exit={{ opacity: 0 }} 
            className="fixed inset-0 bg-black/98 backdrop-blur-3xl cursor-pointer" 
            onClick={() => setPreviewIndex(null)} 
         />
         
         {/* 🖼️ IMAGE WORKSPACE */}
         <div className="fixed inset-0 flex flex-col pointer-events-none">
            {/* Header */}
            <div className="absolute top-0 inset-x-0 p-10 flex items-start justify-between z-50 pointer-events-auto">
                <div className="px-8 py-5 rounded-[2.5rem] bg-white/5 backdrop-blur-[40px] border border-white/5 shadow-2xl flex flex-col gap-1.5">
                    <span className="text-[10px] font-black text-indigo-400 uppercase tracking-[0.4em] opacity-80">Inspecting Document</span>
                    <h3 className="text-2xl font-black text-white uppercase tracking-widest leading-none">Page {previewIndex + 1} <span className="opacity-20 font-light mx-2">/</span> {photos.length}</h3>
                </div>
                
                <button 
                    onClick={() => { setZoom(1); setZoomOrigin("center"); setPreviewIndex(null); }}
                    className="h-16 w-16 rounded-full bg-white/5 backdrop-blur-[40px] border border-white/10 flex items-center justify-center text-white active:scale-95 transition-all shadow-2xl hover:bg-white/10"
                >
                    <X className="w-8 h-8" />
                </button>
            </div>

            {/* Main Content */}
            <div className="flex-1 flex items-center justify-center p-6 overflow-hidden">
                <motion.div 
                    key={previewIndex}
                    initial={{ opacity: 0, scale: 0.9, x: 20 }}
                    animate={{ 
                        opacity: 1, 
                        scale: zoom, 
                        x: zoom === 1 ? 0 : undefined,
                        y: zoom === 1 ? 0 : undefined,
                        transformOrigin: zoomOrigin
                    }}
                    transition={{ type: "spring", stiffness: 500, damping: 45 }}
                    exit={{ opacity: 0, scale: 0.9, x: -20 }}
                    drag={zoom > 1}
                    dragConstraints={{ left: -500, right: 500, top: -500, bottom: 500 }}
                    onTap={handleTap}
                    className="relative max-w-4xl max-h-[75vh] shadow-2xl rounded-2xl overflow-hidden border border-white/10 pointer-events-auto cursor-zoom-in"
                >
                    <img 
                        src={currentPhoto.src} 
                        className="w-full h-full object-contain pointer-events-none" 
                        style={{ filter: getFilterStyle(currentPhoto.filter, currentPhoto.brightness) }}
                        alt="" 
                    />
                </motion.div>
            </div>
         </div>

         {/* ↔️ NAVIGATION ARROWS */}
         <button 
            onClick={(e) => { 
                e.stopPropagation(); 
                setZoom(1);
                setZoomOrigin("center");
                setPreviewIndex(prev => (prev - 1 + photos.length) % photos.length); 
            }}
            className="fixed h-16 w-16 rounded-full bg-white/5 text-white flex items-center justify-center shadow-2xl border border-white/20 cursor-pointer pointer-events-auto active:scale-90 transition-all hover:bg-white/10"
            style={{ top: '50%', left: '1.5rem', transform: 'translateY(-50%)' }}
         >
            <ChevronLeft className="w-10 h-10" />
         </button>
         <button 
            onClick={(e) => { 
                e.stopPropagation(); 
                setZoom(1);
                setZoomOrigin("center");
                setPreviewIndex(prev => (prev + 1) % photos.length); 
            }}
            className="fixed h-16 w-16 rounded-full bg-white/5 text-white flex items-center justify-center shadow-2xl border border-white/20 cursor-pointer pointer-events-auto active:scale-90 transition-all hover:bg-white/10"
            style={{ top: '50%', right: '1.5rem', transform: 'translateY(-50%)' }}
         >
            <ChevronRight className="w-10 h-10" />
         </button>
      </div>
    </AnimatePresence>
  );
};

export default Lightbox;
