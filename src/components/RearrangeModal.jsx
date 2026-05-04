import React from 'react';
import { motion, AnimatePresence, Reorder } from 'framer-motion';
import Draggable from 'react-draggable';
import { Layout, Eye, Move, ChevronLeft, ChevronUp, ChevronDown } from 'lucide-react';

const RearrangeModal = ({ isOpen, onClose, photos, setPhotos, setPreviewIndex }) => {
  const [localPhotos, setLocalPhotos] = React.useState(photos);
  const [hasChanged, setHasChanged] = React.useState(false);
  const [showCloseConfirm, setShowCloseConfirm] = React.useState(false);
  
  const handleRef = React.useRef(null);
  const scrollAreaRef = React.useRef(null);
  const [handlePos, setHandlePos] = React.useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = React.useState(false);

  React.useEffect(() => {
    if (isOpen) {
      setLocalPhotos([...photos]);
      setHasChanged(false);
      setShowCloseConfirm(false);
      if (scrollAreaRef.current) {
        scrollAreaRef.current.scrollTop = 0;
      }
      setHandlePos({ x: 0, y: 0 });
    }
  }, [isOpen, photos]);

  React.useEffect(() => {
    if (!isOpen) return;
    const scrollArea = scrollAreaRef.current;
    if (!scrollArea) return;

    const handleScroll = () => {
      const scrollArea = scrollAreaRef.current;
      if (!scrollArea || isDragging) return;
      const trackHeight = scrollArea.clientHeight;
      const scrollHeight = scrollArea.scrollHeight - trackHeight;
      if (scrollHeight <= 0) {
        setHandlePos({ x: 0, y: 0 });
        return;
      }
      const percent = scrollArea.scrollTop / scrollHeight;
      setHandlePos({ x: 0, y: percent * (trackHeight - 96) }); 
    };

    scrollArea.addEventListener('scroll', handleScroll);
    return () => scrollArea.removeEventListener('scroll', handleScroll);
  }, [isOpen, isDragging]);

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0" style={{ zIndex: 1000000 }}>
        <motion.div 
          initial={{ opacity: 0 }} 
          animate={{ opacity: 1 }} 
          exit={{ opacity: 0 }} 
          className="absolute inset-0 bg-slate-950" 
        />
        <div className="relative h-full flex flex-col">
          {/* Header */}
          <div className="px-8 py-8 border-b border-white/5 flex items-center justify-between bg-black/40">
            <div className="flex items-center gap-4">
              <button 
                  onClick={() => {
                      if (hasChanged) setShowCloseConfirm(true);
                      else onClose();
                  }} 
                  className="h-12 w-12 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center text-slate-400 active:scale-90 transition-all"
              >
                  <ChevronLeft className="w-6 h-6" />
              </button>
              <div className="space-y-1">
                <h3 className="text-2xl font-black text-white uppercase tracking-widest">Arrange Sequence</h3>
                <p className="text-[10px] text-indigo-400 font-bold uppercase tracking-widest">Drag cards to reorder your document</p>
              </div>
            </div>
            <button 
                onClick={() => {
                    setPhotos(localPhotos);
                    onClose();
                }} 
                className="h-12 px-8 rounded-2xl bg-indigo-500 text-white text-[11px] font-black uppercase tracking-widest shadow-xl shadow-indigo-500/20 active:scale-95 transition-all mr-4"
            >
              Save Order
            </button>
          </div>

          {/* Vertical Workspace */}
          <div className="relative flex-1 flex overflow-hidden">
            <div ref={scrollAreaRef} className="flex-1 overflow-y-auto p-8 pt-12 custom-scrollbar rearrange-scroll">
              <Reorder.Group 
                values={localPhotos} 
                onReorder={(newOrder) => {
                    setLocalPhotos(newOrder);
                    setHasChanged(true);
                }}
                axis="y"
                className="flex flex-col gap-6 max-w-xl mx-auto pb-60"
              >
                {localPhotos.map((photo, index) => (
                  <Reorder.Item 
                    key={photo.id} 
                    value={photo}
                    className="relative w-full aspect-[16/9] bg-slate-900 rounded-[2rem] border-2 border-white/20 shadow-2xl overflow-hidden cursor-grab active:cursor-grabbing flex items-center group"
                  >
                      <div className="w-1/3 h-full overflow-hidden border-r border-white/10 relative">
                          <img src={photo.src} className="w-full h-full object-cover opacity-80" alt="" />
                          <div 
                              onClick={(e) => { e.stopPropagation(); setPreviewIndex(index); }}
                              className="absolute inset-0 flex items-center justify-center bg-black/20 opacity-20 hover:opacity-100 transition-all cursor-pointer"
                          >
                              <Eye className="w-6 h-6 text-white" />
                          </div>
                      </div>
                      <div className="flex-1 px-10 flex items-center justify-between">
                          <div className="space-y-1">
                              <h4 className="text-xl font-black text-white uppercase tracking-widest">Page {index + 1}</h4>
                              <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">Hold to drag & reorder</p>
                          </div>
                          <div className="h-14 w-14 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center text-indigo-400 group-hover:bg-indigo-500 group-hover:text-white transition-all">
                              <Move className="w-6 h-6" />
                          </div>
                      </div>
                  </Reorder.Item>
                ))}
              </Reorder.Group>
            </div>

            {/* 🚀 HIGH-END DRAGGABLE SCROLL HANDLE (Tactile Navigation) */}
            <div className="w-16 h-full border-l border-white/5 bg-black/20 relative">
                <div 
                    className="absolute inset-x-0 top-0 bottom-0 bg-gradient-to-b from-transparent via-white/5 to-transparent pointer-events-none" 
                    style={{ height: '100%' }} 
                />
                <div className="absolute inset-0 flex flex-col pt-2 pb-2">
                    <div className="relative flex-1">
                        <Draggable
                            nodeRef={handleRef}
                            axis="y"
                            bounds="parent"
                            position={handlePos}
                            onStart={() => setIsDragging(true)}
                            onDrag={(e, data) => {
                                setHandlePos({ x: 0, y: data.y });
                                const scrollArea = scrollAreaRef.current;
                                if (scrollArea) {
                                    const trackHeight = scrollArea.clientHeight;
                                    const scrollHeight = scrollArea.scrollHeight - trackHeight;
                                    const percent = data.y / (trackHeight - 96); 
                                    scrollArea.scrollTop = percent * scrollHeight;
                                }
                            }}
                            onStop={() => setIsDragging(false)}
                        >
                            <div ref={handleRef} className="absolute left-1/2 -translate-x-1/2 h-24 w-12 bg-indigo-500 rounded-full flex flex-col items-center justify-center gap-1 shadow-[0_0_30px_rgba(99,102,241,0.6)] cursor-grab active:cursor-grabbing border-2 border-indigo-400 z-[60]">
                                <div className="w-4 h-1.5 bg-white/40 rounded-full" />
                                <div className="w-4 h-1.5 bg-white/40 rounded-full" />
                                <div className="w-4 h-1.5 bg-white/40 rounded-full" />
                            </div>
                        </Draggable>
                    </div>
                </div>
            </div>
          </div>
        </div>

        {/* 🚀 UNSAVED CHANGES CONFIRMATION */}
        <AnimatePresence>
            {showCloseConfirm && (
                <div className="absolute inset-0 z-[10001] flex items-center justify-center p-8 pointer-events-auto">
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 bg-slate-950/90 backdrop-blur-xl" onClick={() => setShowCloseConfirm(false)} />
                    <motion.div initial={{ scale: 0.9, opacity: 0, y: 20 }} animate={{ scale: 1, opacity: 1, y: 0 }} exit={{ scale: 0.9, opacity: 0, y: 20 }} className="relative bg-slate-900 border border-white/10 rounded-[3rem] p-10 max-w-sm w-full text-center space-y-8 shadow-2xl">
                        <div className="h-20 w-20 bg-indigo-500/10 border border-indigo-500/20 rounded-full flex items-center justify-center mx-auto text-indigo-400">
                            <Layout className="w-10 h-10" />
                        </div>
                        <div className="space-y-2">
                            <h4 className="text-white font-black text-xl uppercase tracking-widest">Save Changes?</h4>
                            <p className="text-slate-500 text-[11px] font-bold uppercase tracking-widest leading-relaxed">You have unsaved sequence changes. Would you like to save them before exiting?</p>
                        </div>
                        <div className="flex flex-col gap-3">
                            <button 
                                onClick={() => {
                                    setPhotos(localPhotos);
                                    onClose();
                                }} 
                                className="w-full py-5 rounded-2xl bg-green-500 text-white font-black text-[11px] uppercase tracking-widest active:scale-95 transition-all shadow-xl shadow-green-500/20"
                            >
                                Yes, Save & Exit
                            </button>
                            <button 
                                onClick={onClose} 
                                className="w-full py-5 rounded-2xl bg-red-500 text-white font-black text-[11px] uppercase tracking-widest active:scale-95 transition-all shadow-xl shadow-red-500/20"
                            >
                                No, Discard Changes
                            </button>
                            <button onClick={() => setShowCloseConfirm(false)} className="w-full py-5 rounded-2xl bg-white/5 border border-white/10 text-slate-400 font-black text-[11px] uppercase tracking-widest active:scale-95 transition-all">Cancel</button>
                        </div>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
      </div>
    </AnimatePresence>
  );
};

export default RearrangeModal;
