import React, { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Image as ImageIcon, Home, Download, Plus, Settings2, Camera, FileText, X, Trash2, Layout, Info } from 'lucide-react';

// Modular Components
import PhotoItem from './PhotoItem';
import EditModal from './EditModal';
import Lightbox from './Lightbox';
import ExportModal from './ExportModal';
import RearrangeModal from './RearrangeModal';

const PhotoGallery = ({ photos, scans = [], setPhotos, onAddMore, onEdit, onHome, onDeleteScan, onOpenScan, onGenerate, onUpload, autoOpenExport, onExportOpened }) => {
  // UI State
  const [showExportModal, setShowExportModal] = useState(false);
  const [showInfoModal, setShowInfoModal] = useState(false);

  // Auto-open Export Modal if requested
  React.useEffect(() => {
    if (autoOpenExport) {
      setShowExportModal(true);
      onExportOpened();
    }
  }, [autoOpenExport]);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showRearrangeModal, setShowRearrangeModal] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState(null);
  const [deleteScanConfirm, setDeleteScanConfirm] = useState(null);
  const [showingAllScans, setShowingAllScans] = useState(false);
  const [showPrivacyNotice, setShowPrivacyNotice] = useState(true);
  const fileInputRef = useRef(null);

  // PDF Config State
  const [globalFilter, setGlobalFilter] = useState('none');
  const [pageOrientation, setPageOrientation] = useState('portrait');
  const [pageSize, setPageSize] = useState('a4');
  const [numPos, setNumPos] = useState('none');
  const [pdfMargin, setPdfMargin] = useState(10);
  const [fillSpace, setFillSpace] = useState(false);
  const [isCompressed, setIsCompressed] = useState(false);
  const [compressionLevel, setCompressionLevel] = useState(80);
  const [filename, setFilename] = useState(() => {
    const d = new Date();
    const day = String(d.getDate()).padStart(2, '0');
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const year = d.getFullYear();
    return `Scan_${day}-${month}-${year}`;
  });

  // Lightbox State
  const [previewIndex, setPreviewIndex] = useState(null);
  const [zoom, setZoom] = useState(1);
  const [lastTap, setLastTap] = useState(0);
  const [zoomOrigin, setZoomOrigin] = useState("center");

  const handleExport = () => {
    onGenerate({
      filename: filename,
      filter: globalFilter,
      orientation: pageOrientation,
      pageSize,
      numPos,
      showPageNumbers: numPos !== 'none',
      margin: pdfMargin,
      fillSpace: fillSpace,
      isCompressed: isCompressed,
      compressionLevel: compressionLevel
    });
    setShowExportModal(false);
  };

  const [showExitConfirm, setShowExitConfirm] = useState(false);
  const [showSaveImagesConfirm, setShowSaveImagesConfirm] = useState(false);

  const handleHomeClick = (e) => {
    if (e) e.stopPropagation();
    if (photos.length > 0) {
      setShowExitConfirm(true);
    } else {
      onHome();
    }
  };

  const handleSaveAsImages = () => {
    photos.forEach((photo, index) => {
        const link = document.createElement('a');
        link.download = `Scan_${index + 1}.jpg`;
        link.href = photo.src;
        link.click();
    });
    setShowSaveImagesConfirm(false);
  };

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files.length > 0) {
      onUpload(e.target.files);
      setShowAddModal(false);
    }
  };

  return (
    <div className="flex flex-col min-h-screen bg-slate-950 font-outfit text-slate-200">
      {/* 🚀 HEADER */}
      <header className="h-20 px-6 grid grid-cols-[1fr_2fr_1fr] items-center bg-black/40 backdrop-blur-3xl border-b border-white/5 z-[100] safe-top shrink-0">
        <div className="flex items-center">
            {photos.length > 0 && (
                <button 
                    onClick={handleHomeClick}
                    className="p-2.5 bg-indigo-500/10 rounded-xl border border-indigo-500/20 text-indigo-400 hover:bg-indigo-500/20 active:scale-90 transition-all shadow-lg shadow-indigo-500/10"
                >
                    <Home className="w-5 h-5" />
                </button>
            )}
        </div>

        <div className="flex flex-col items-center justify-center text-center overflow-hidden">
          <h1 className="text-sm font-black tracking-[0.2em] text-white uppercase truncate">QuickPDF</h1>
          <p className="text-[7px] uppercase tracking-[0.3em] text-indigo-400 font-black mt-1 opacity-80">Mobile Scanner</p>
        </div>
        
        <div className="flex items-center justify-end gap-3">
            {photos.length > 0 ? (
                <>
                  <button
                      onClick={() => setShowExportModal(!showExportModal)}
                      className={`h-11 w-11 flex items-center justify-center rounded-2xl transition-all border ${showExportModal ? 'border-indigo-500/50 bg-indigo-500/10 text-indigo-400' : 'border-white/5 bg-white/5 text-slate-400'}`}
                  >
                      <Settings2 className="w-5 h-5" />
                  </button>
                </>
            ) : (
                <button
                    onClick={() => setShowInfoModal(true)}
                    className="h-11 w-11 flex items-center justify-center rounded-2xl transition-all border border-white/5 bg-white/5 text-slate-400 hover:bg-white/10 hover:text-white"
                >
                    <Info className="w-5 h-5" />
                </button>
            )}
        </div>
      </header>


      {/* 🖼️ MAIN CONTENT */}
      <main className="flex-1 relative">
        <div className="max-w-lg mx-auto w-full flex flex-col p-6 pb-40">
            {photos.some(p => p.croppedAreaPercentages || p.filter !== 'none' || p.labels?.length > 0 || p.paths?.length > 0) && (
              <motion.div 
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                className="mb-8 p-6 rounded-[2rem] bg-indigo-500/10 border border-indigo-500/20 flex flex-col gap-2 relative overflow-hidden"
              >
                <div className="absolute top-0 left-0 w-1 h-full bg-indigo-500" />
                <div className="flex items-center gap-3">
                    <FileText className="w-5 h-5 text-indigo-400" />
                    <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-white">Quick Note</h4>
                </div>
                <p className="text-[10px] text-slate-400 font-medium leading-relaxed tracking-wide">
                    Your edits might not appear or look a bit different in this preview, but they will be perfectly clear and properly framed in your final PDF.
                </p>
              </motion.div>
            )}

            {photos.length === 0 ? (
              <div className="flex-1 flex flex-col items-center justify-center w-full space-y-20">
                {/* HUB: Empty State */}
                <div className="flex flex-col items-center justify-center space-y-16 text-center w-full">
                  <div className="relative">
                    <div className="absolute inset-0 bg-indigo-500/40 blur-[140px] animate-pulse" />
                    <motion.div 
                        initial={{ scale: 0.8, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        className="relative h-44 w-44 bg-white/5 rounded-full border-8 border-white/10 flex items-center justify-center shadow-2xl backdrop-blur-3xl overflow-hidden group"
                    >
                        <img src="/logo_custom.png" className="w-full h-full object-contain p-6" alt="Scanner Hub Logo" />
                        <div className="absolute inset-0 bg-indigo-500/10 opacity-0 group-hover:opacity-100 transition-opacity" />
                    </motion.div>
                  </div>
                  <div className="w-full px-4 text-center">
                    <h3 
                      className="text-xl md:text-2xl font-black text-slate-300 uppercase tracking-[0.2em] leading-relaxed max-w-[320px] mx-auto block"
                      style={{ textAlign: 'center', width: '100%' }}
                    >
                      Turn Photos into Clean PDFs in Seconds
                    </h3>
                  </div>
                  <motion.button 
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => setShowAddModal(true)}
                    className="group relative flex items-center justify-center gap-8 px-24 py-12 rounded-full bg-indigo-500 text-white shadow-[0_40px_100px_rgba(99,102,241,0.6)] border-b-4 border-indigo-700 transition-all overflow-hidden w-full max-w-[450px] mx-auto"
                  >
                     <div className="absolute inset-0 bg-gradient-to-tr from-white/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                     <Camera className="w-10 h-10" />
                     <span className="text-[20px] font-black uppercase tracking-[0.4em] leading-none">Let's Start</span>
                  </motion.button>
                </div>

                {/* RECENT SCANS LIST */}
                {scans.length > 0 && (
                  <div className="w-full flex flex-col w-full mt-10">
                      <div className="w-full max-w-xs mx-auto mb-20 h-px bg-gradient-to-r from-transparent via-white/10 to-transparent" />
                      <section className="w-full space-y-8">
                        <div className="flex items-center justify-between px-4">
                          <div className="flex flex-col items-start gap-1">
                            <h2 className="text-[12px] font-black uppercase tracking-[0.4em] text-indigo-400">Scan History</h2>
                            <p className="text-[9px] font-bold text-slate-500 uppercase tracking-widest">Your local archives</p>
                          </div>
                          {scans.length > 3 && (
                            <button 
                              onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            setShowingAllScans(!showingAllScans);
                          }}
                          className="px-5 py-2.5 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 text-[10px] font-black uppercase tracking-widest active:scale-95 transition-all hover:bg-indigo-500/20 relative z-[100]"
                        >
                          {showingAllScans ? 'Show Less' : `View All (${scans.length})`}
                        </button>
                      )}
                    </div>
                    
                    <div className="flex flex-col gap-8 px-4 pb-10">
                      {scans.slice(0, showingAllScans ? scans.length : 3).map(scan => (
                        <motion.div 
                          key={scan.id}
                          initial={{ opacity: 0, y: 30 }}
                          whileInView={{ opacity: 1, y: 0 }}
                          viewport={{ once: true }}
                          className="relative flex flex-col bg-white/[0.03] border border-white/10 rounded-[3rem] p-6 shadow-2xl active:scale-[0.98] transition-all group overflow-hidden"
                          onClick={() => onOpenScan(scan)}
                        >
                           <div className="absolute bottom-6 right-6 z-[110]">
                             <button 
                                onClick={(e) => { e.preventDefault(); e.stopPropagation(); setDeleteScanConfirm(scan); }}
                                className="text-slate-500 hover:text-red-500 active:scale-90 transition-colors"
                                style={{ background: 'transparent', padding: 0, border: 'none' }}
                             >
                                <Trash2 className="w-5 h-5" />
                             </button>
                           </div>

                           <div className="flex gap-8 items-center relative z-10">
                              <div className="h-32 w-24 rounded-2xl overflow-hidden shrink-0 shadow-[0_10px_30px_rgba(0,0,0,0.5)] border border-white/10 relative bg-slate-900">
                                  <img src={scan.thumbnail} className="w-full h-full object-contain p-1 group-hover:scale-105 transition-transform duration-700" alt="" />
                                  <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent pointer-events-none" />
                              </div>
                              
                              <div className="flex-1 flex flex-col items-start gap-3 min-w-0 pr-14">
                                  <h4 className="text-[14px] font-black text-white uppercase tracking-widest truncate w-full leading-tight">{scan.name}</h4>
                                  <div className="flex flex-wrap gap-2">
                                      <span className="text-[9px] font-black text-indigo-400 bg-indigo-500/10 px-3 py-1.5 rounded-full uppercase tracking-widest border border-indigo-500/20">{scan.count} Pages</span>
                                      <span className="text-[9px] font-bold text-slate-500 bg-white/5 px-3 py-1.5 rounded-full uppercase tracking-widest border border-white/5">
                                          {(() => {
                                              try {
                                                  const d = new Date(scan.date);
                                                  if (isNaN(d.getTime())) return scan.date?.split(',')[0];
                                                  return `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}/${d.getFullYear()}`;
                                              } catch(e) {
                                                  return scan.date?.split(',')[0];
                                              }
                                          })()}
                                      </span>
                                  </div>
                                  <div className="flex items-center gap-2 mt-1">
                                      <div className="h-1.5 w-1.5 rounded-full bg-green-500 animate-pulse" />
                                      <p className="text-[8px] font-black text-slate-500 uppercase tracking-[0.2em]">Stored Locally</p>
                                  </div>
                              </div>
                           </div>
                        </motion.div>
                      ))}
                    </div>
                  </section>
                  </div>
                )}
              </div>
            ) : (
                <div className="space-y-8">
                    <div className="flex items-center justify-between px-2 pt-4 pb-6">
                        <div className="flex items-center gap-3">
                            <div className="text-[11px] font-black text-white bg-indigo-500 px-5 py-2 rounded-full uppercase tracking-widest shadow-lg shadow-indigo-500/20"> {photos.length} Pages </div>
                        </div>
                        <div className="flex items-center gap-3">
                            <button 
                              onClick={() => setShowRearrangeModal(true)}
                              className="text-[10px] font-black text-indigo-400 bg-indigo-500/10 px-4 py-2 rounded-xl uppercase tracking-widest border border-indigo-500/20 hover:bg-indigo-500/20 transition-all flex items-center gap-2"
                            >
                                <Layout className="w-3 h-3" /> Rearrange
                            </button>
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-8 px-2" style={{ marginBottom: "220px" }}>
                      {photos.map((photo, index) => (
                        <PhotoItem 
                          key={photo.id} 
                          photo={photo} 
                          index={index} 
                          onEdit={() => onEdit(photo)} 
                          onDelete={() => setDeleteConfirm(photo)}
                          onPreview={() => setPreviewIndex(index)}
                        />
                      ))}
                      <button 
                        onClick={() => setShowAddModal(true)}
                        className="aspect-[3/4] border-2 border-dashed border-white/10 rounded-[2.5rem] flex flex-col items-center justify-center gap-4 text-slate-500 hover:text-indigo-400 hover:border-indigo-400/50 transition-all group bg-white/5"
                      >
                         <div className="h-14 w-14 rounded-full border-2 border-dashed border-current flex items-center justify-center group-hover:scale-110 transition-transform">
                           <Plus className="w-8 h-8" />
                         </div>
                         <span className="text-[11px] font-black uppercase tracking-widest">New Page</span>
                      </button>
                    </div>
                </div>
            )}
        </div>
      </main>

      {/* 🚀 FLOATING PDF ACTION */}
      <AnimatePresence>
        {photos.length > 0 && (
          <motion.div initial={{ y: 100, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 100, opacity: 0 }} className="fixed bottom-0 inset-x-0 p-8 z-[120] safe-bottom bg-gradient-to-t from-slate-950 via-slate-950 to-transparent">
            <div className="max-w-lg mx-auto">
              <button 
                onClick={() => setShowExportModal(true)}
                className="w-full h-18 py-5 rounded-[2.5rem] bg-indigo-500 text-white flex items-center justify-center gap-5 shadow-[0_30px_70px_rgba(99,102,241,0.5)] active:scale-95 transition-all group"
              >
                <div className="flex flex-col items-start leading-none">
                   <span className="text-[11px] font-black uppercase tracking-[0.2em]">Generate PDF</span>
                   <span className="text-[8px] font-black uppercase tracking-widest opacity-60 mt-1">Configure & Export</span>
                </div>
                <div className="h-10 w-10 rounded-full bg-white/20 flex items-center justify-center group-hover:rotate-12 transition-transform">
                    <Download className="w-5 h-5" />
                </div>
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 🚀 MODULAR MODALS */}
      <ExportModal 
        isOpen={showExportModal}
        onClose={() => setShowExportModal(false)}
        filename={filename}
        setFilename={setFilename}
        pageSize={pageSize}
        setPageSize={setPageSize}
        pageOrientation={pageOrientation}
        setPageOrientation={setPageOrientation}
        pdfMargin={pdfMargin}
        setPdfMargin={setPdfMargin}
        fillSpace={fillSpace}
        setFillSpace={setFillSpace}
        numPos={numPos}
        setNumPos={setNumPos}
        isCompressed={isCompressed}
        setIsCompressed={setIsCompressed}
        compressionLevel={compressionLevel}
        setCompressionLevel={setCompressionLevel}
        onResetSession={() => {
          setPhotos([]);
          setShowExportModal(false);
        }}
        onSaveImagesClick={() => {
            setShowExportModal(false);
            setShowSaveImagesConfirm(true);
        }}
        onExport={handleExport}
      />

      <RearrangeModal 
        isOpen={showRearrangeModal}
        onClose={() => setShowRearrangeModal(false)}
        photos={photos}
        setPhotos={setPhotos}
        setPreviewIndex={setPreviewIndex}
      />

      <Lightbox 
        photos={photos}
        previewIndex={previewIndex}
        setPreviewIndex={setPreviewIndex}
        zoom={zoom}
        setZoom={setZoom}
        lastTap={lastTap}
        setLastTap={setLastTap}
        zoomOrigin={zoomOrigin}
        setZoomOrigin={setZoomOrigin}
      />

      {/* 🚀 ADD PHOTOS MODAL */}
      <AnimatePresence>
        {showAddModal && (
          <div className="fixed inset-0 flex items-center justify-center px-6" style={{ zIndex: 999999 }}>
            <motion.div 
              initial={{ opacity: 0 }} 
              animate={{ opacity: 1 }} 
              exit={{ opacity: 0 }} 
              onClick={() => setShowAddModal(false)}
              className="absolute inset-0 bg-slate-950/90 backdrop-blur-3xl" 
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 40 }} 
              animate={{ opacity: 1, scale: 1, y: 0 }} 
              exit={{ opacity: 0, scale: 0.95, y: 40 }} 
              className="relative w-full max-w-lg bg-slate-900 border border-white/10 rounded-[3rem] p-10 md:p-16 shadow-[0_50px_100px_rgba(0,0,0,0.8)]"
            >
              {/* Definitive Corner Close Button */}
              <button 
                onClick={() => setShowAddModal(false)}
                className="absolute top-6 right-6 h-14 w-14 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center text-slate-400 active:scale-90 transition-all hover:bg-white/10 hover:text-white z-[100] shadow-lg"
              >
                <X className="w-8 h-8" />
              </button>

              <div className="space-y-12 pt-10">
                <div className="text-left space-y-3 px-2">
                  <h3 className="text-4xl font-black text-white uppercase tracking-[0.1em]">Add Content</h3>
                  <p className="text-[11px] text-indigo-400 font-black uppercase tracking-[0.3em] opacity-80">Select Capture Method</p>
                  <div className="h-1.5 w-12 bg-indigo-500 rounded-full" />
                </div>

                <div className="grid grid-cols-1 gap-6">
                  <button 
                    onClick={() => { onAddMore(); setShowAddModal(false); }}
                    className="flex items-center gap-8 p-8 rounded-[2.5rem] bg-indigo-500 text-white shadow-[0_25px_60px_rgba(99,102,241,0.4)] active:scale-95 transition-all group overflow-hidden relative"
                  >
                    <div className="absolute inset-0 bg-white/10 opacity-0 group-hover:opacity-100 transition-opacity" />
                    <div className="h-20 w-20 rounded-[1.5rem] bg-white/20 flex items-center justify-center group-hover:rotate-6 transition-transform relative z-10 shrink-0">
                      <Camera className="w-10 h-10" />
                    </div>
                    <div className="flex flex-col items-start text-left relative z-10">
                      <span className="text-[20px] font-black uppercase tracking-widest leading-none">Camera</span>
                      <span className="text-[10px] font-black uppercase opacity-60 tracking-[0.1em] mt-3">Scan Live Document</span>
                    </div>
                  </button>

                  <button 
                    onClick={() => fileInputRef.current?.click()}
                    className="flex items-center gap-8 p-8 rounded-[2.5rem] bg-white/5 border border-white/10 text-white active:scale-95 transition-all group overflow-hidden relative"
                  >
                    <div className="absolute inset-0 bg-white/5 opacity-0 group-hover:opacity-100 transition-opacity" />
                    <div className="h-20 w-20 rounded-[1.5rem] bg-white/5 border border-white/10 flex items-center justify-center group-hover:rotate-6 transition-transform relative z-10 shrink-0">
                      <FileText className="w-10 h-10 text-indigo-400" />
                    </div>
                    <div className="flex flex-col items-start text-left relative z-10">
                      <span className="text-[20px] font-black uppercase tracking-widest leading-none">Import Files</span>
                      <span className="text-[10px] font-black uppercase opacity-60 tracking-[0.1em] mt-3">Browse from Device</span>
                    </div>
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* 🚀 DELETE CONFIRMATION */}
      <AnimatePresence>
        {deleteConfirm && (
          <div className="fixed inset-0 flex items-center justify-center p-8" style={{ zIndex: 9999999 }}>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 bg-slate-950/90 backdrop-blur-xl" onClick={() => setDeleteConfirm(null)} />
            <motion.div 
                initial={{ opacity: 0, scale: 0.9, y: 20 }} 
                animate={{ opacity: 1, scale: 1, y: 0 }} 
                exit={{ opacity: 0, scale: 0.9, y: 20 }} 
                className="relative w-full max-w-sm bg-slate-900 border border-white/10 rounded-[3rem] p-10 text-center space-y-8 shadow-2xl"
            >
                <div className="h-20 w-20 rounded-full bg-red-500/10 border border-red-500/20 text-red-500 flex items-center justify-center mx-auto">
                    <Trash2 className="w-10 h-10" />
                </div>
                <div className="space-y-2">
                    <h3 className="text-xl font-black text-white uppercase tracking-widest">Delete Page?</h3>
                    <p className="text-[11px] text-slate-500 font-bold uppercase tracking-widest leading-relaxed">This action cannot be undone. This page will be permanently removed from your session.</p>
                </div>
                <div className="grid grid-cols-1 gap-3">
                    <button 
                        onClick={() => {
                            setPhotos(prev => prev.filter(p => p.id !== deleteConfirm.id));
                            setDeleteConfirm(null);
                        }}
                        className="w-full py-5 rounded-2xl bg-red-500 text-white text-[11px] font-black uppercase tracking-widest shadow-xl shadow-red-500/20 active:scale-95 transition-all"
                    >
                        Confirm Delete
                    </button>
                    <button onClick={() => setDeleteConfirm(null)} className="w-full py-5 rounded-2xl bg-white/5 border border-white/10 text-slate-400 text-[11px] font-black uppercase tracking-widest hover:text-white transition-all">Cancel</button>
                </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* 🚀 SCAN HISTORY DELETE CONFIRMATION */}
      <AnimatePresence>
        {deleteScanConfirm && (
          <div className="fixed inset-0 flex items-center justify-center p-8" style={{ zIndex: 9999999 }}>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 bg-slate-950/90 backdrop-blur-xl" onClick={() => setDeleteScanConfirm(null)} />
            <motion.div 
                initial={{ opacity: 0, scale: 0.9, y: 20 }} 
                animate={{ opacity: 1, scale: 1, y: 0 }} 
                exit={{ opacity: 0, scale: 0.9, y: 20 }} 
                className="relative w-full max-w-sm bg-slate-900 border border-white/10 rounded-[3rem] p-10 text-center space-y-8 shadow-2xl"
            >
                <div className="h-20 w-20 rounded-full bg-red-500/10 border border-red-500/20 text-red-500 flex items-center justify-center mx-auto shadow-inner">
                    <Trash2 className="w-10 h-10" />
                </div>
                <div className="space-y-2">
                    <h3 className="text-xl font-black text-white uppercase tracking-widest">Delete Scan?</h3>
                    <p className="text-[11px] text-slate-500 font-bold uppercase tracking-widest leading-relaxed">Permanently remove "{deleteScanConfirm.name}" from your local archives? This cannot be undone.</p>
                </div>
                <div className="grid grid-cols-1 gap-3">
                    <button 
                        onClick={() => {
                            onDeleteScan(deleteScanConfirm.id);
                            setDeleteScanConfirm(null);
                        }}
                        className="w-full py-5 rounded-2xl bg-red-500 text-white text-[11px] font-black uppercase tracking-widest shadow-xl shadow-red-500/20 active:scale-95 transition-all"
                    >
                        Confirm Delete
                    </button>
                    <button onClick={() => setDeleteScanConfirm(null)} className="w-full py-5 rounded-2xl bg-white/5 border border-white/10 text-slate-400 text-[11px] font-black uppercase tracking-widest hover:text-white transition-all">Cancel</button>
                </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* 🚀 PRIVACY FOOTER */}
      <AnimatePresence>
        {showPrivacyNotice && photos.length === 0 && (
          <motion.div 
            initial={{ y: 50, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 50, opacity: 0 }}
            className="fixed bottom-6 inset-x-0 z-[5000] flex justify-center px-4"
          >
            <div className="bg-slate-900 border border-white/10 rounded-full px-6 py-4 shadow-2xl flex items-center justify-center gap-4 overflow-hidden relative max-w-full">
                <div className="absolute inset-0 bg-indigo-500/5 animate-pulse pointer-events-none" />
                <div className="flex items-center gap-3 relative z-10 text-center">
                    <div className="h-2 w-2 rounded-full bg-green-500 animate-pulse shrink-0 hidden sm:block" />
                    <p className="text-[10px] font-black uppercase tracking-[0.1em] text-white/90 leading-tight">
                        <span className="text-red-500">Data Safety:</span> We do not store your data. Everything is local to this device.
                    </p>
                </div>
                <button 
                    onClick={() => setShowPrivacyNotice(false)}
                    className="h-8 w-8 rounded-full bg-red-500/10 border border-red-500/20 text-red-500 flex items-center justify-center active:scale-90 transition-all shrink-0 relative z-10"
                >
                    <X className="w-4 h-4" />
                </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* INFO MODAL */}
      <AnimatePresence>
        {showInfoModal && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[5000] flex items-center justify-center p-6 bg-black/80 backdrop-blur-sm"
            onClick={() => setShowInfoModal(false)}
          >
            <motion.div 
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-sm bg-slate-900 border border-white/10 rounded-[2rem] p-8 shadow-2xl relative flex flex-col"
            >
              <button 
                onClick={() => setShowInfoModal(false)}
                className="absolute top-6 right-6 z-[6000] p-3 bg-white/5 border border-white/10 rounded-full text-slate-400 hover:text-white hover:bg-white/10 shadow-lg active:scale-90 transition-all"
              >
                <X className="w-5 h-5" />
              </button>
              <div className="flex items-center gap-4 mb-6">
                <div className="w-12 h-12 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400">
                    <Info className="w-6 h-6" />
                </div>
                <div>
                    <h3 className="text-sm font-black uppercase tracking-widest text-white">Scanner Guide</h3>
                    <p className="text-[10px] uppercase tracking-wider text-slate-500 font-bold">App Info & Usage</p>
                </div>
              </div>

              <div className="space-y-6 text-sm text-slate-400 leading-relaxed max-h-[60vh] overflow-y-auto pr-2 custom-scrollbar">
                <div>
                  <h4 className="text-white font-bold mb-2">How to Use</h4>
                  <ul className="list-disc pl-4 space-y-2">
                    <li>Tap <strong>"Let's Start"</strong> to open the camera or seamlessly import existing photos from your device.</li>
                    <li>In camera's <strong>Manual Mode</strong>, enjoy precise, hands-on edge control, or let <strong>Smart Crop</strong> automatically detect and straighten skewed paper.</li>
                    <li>Edit colors, brightness, and manually crop each scan if needed.</li>
                    <li>Reorder, annotate, and compile all scans into a single, high-quality PDF.</li>
                  </ul>
                </div>

                <div>
                  <h4 className="text-white font-bold mb-2">Supported File Formats</h4>
                  <ul className="list-disc pl-4 space-y-2">
                    <li><strong>Inputs:</strong> JPG, PNG, WEBP from camera or gallery.</li>
                    <li><strong>Outputs:</strong> Compiled PDF document and individually saved JPGs.</li>
                  </ul>
                </div>

                <div className="pt-6 border-t border-white/10 text-center flex flex-col items-center gap-2">
                  <p className="text-[11px] font-black uppercase tracking-[0.2em] text-slate-300 flex items-center gap-2">
                    Made with <span className="text-red-500 text-lg">❤️</span> by Aneesh
                  </p>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <input 
        type="file" 
        ref={fileInputRef} 
        style={{ display: 'none' }}
        accept="image/*" 
        multiple 
        onChange={handleFileChange} 
      />

      {/* 🚀 EXIT CONFIRM MODAL */}
      <AnimatePresence>
        {showExitConfirm && (
          <div className="fixed inset-0 z-[9999999] flex items-center justify-center p-6">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setShowExitConfirm(false)} className="absolute inset-0 bg-slate-950/90 backdrop-blur-xl" />
            <motion.div initial={{ scale: 0.9, opacity: 0, y: 20 }} animate={{ scale: 1, opacity: 1, y: 0 }} exit={{ scale: 0.9, opacity: 0, y: 20 }} className="relative bg-slate-900 border border-white/10 rounded-[3rem] p-10 max-w-sm w-full text-center space-y-8 shadow-2xl">
                <div className="h-20 w-20 bg-red-500/10 border border-red-500/20 rounded-full flex items-center justify-center mx-auto text-red-500">
                    <Trash2 className="w-10 h-10" />
                </div>
                <div className="space-y-2">
                    <h4 className="text-white font-black text-xl uppercase tracking-widest">Discard Session?</h4>
                    <p className="text-slate-500 text-[11px] font-bold uppercase tracking-widest leading-relaxed">Returning home will delete all current scans. Continue?</p>
                </div>
                <div className="flex flex-col gap-3">
                    <button onClick={() => { onHome(true); setShowExitConfirm(false); }} className="w-full py-5 rounded-2xl bg-red-500 text-white font-black text-[11px] uppercase tracking-widest active:scale-95 transition-all shadow-lg shadow-red-500/20">Yes, Discard All</button>
                    <button onClick={() => setShowExitConfirm(false)} className="w-full py-5 rounded-2xl bg-white/5 text-slate-400 font-black text-[11px] uppercase tracking-widest active:scale-95 transition-all">Cancel</button>
                </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* 🚀 SAVE AS IMAGES CONFIRM MODAL */}
      <AnimatePresence>
        {showSaveImagesConfirm && (
          <div className="fixed inset-0 z-[9999999] flex items-center justify-center p-6">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setShowSaveImagesConfirm(false)} className="absolute inset-0 bg-slate-950/90 backdrop-blur-xl" />
            <motion.div initial={{ scale: 0.9, opacity: 0, y: 20 }} animate={{ scale: 1, opacity: 1, y: 0 }} exit={{ scale: 0.9, opacity: 0, y: 20 }} className="relative bg-slate-900 border border-white/10 rounded-[3rem] p-10 max-w-sm w-full text-center space-y-8 shadow-2xl">
                <div className="h-20 w-20 bg-indigo-500/10 border border-indigo-500/20 rounded-full flex items-center justify-center mx-auto text-indigo-400">
                    <Download className="w-10 h-10" />
                </div>
                <div className="space-y-2">
                    <h4 className="text-white font-black text-xl uppercase tracking-widest">Download Images?</h4>
                    <p className="text-slate-500 text-[11px] font-bold uppercase tracking-widest leading-relaxed">Each scan will be downloaded as a high-quality JPEG.</p>
                </div>
                <div className="flex flex-col gap-3">
                    <button onClick={handleSaveAsImages} className="w-full py-5 rounded-2xl bg-indigo-500 text-white font-black text-[11px] uppercase tracking-widest active:scale-95 transition-all shadow-lg shadow-indigo-500/20">Download Now</button>
                    <button onClick={() => setShowSaveImagesConfirm(false)} className="w-full py-5 rounded-2xl bg-white/5 text-slate-400 font-black text-[11px] uppercase tracking-widest active:scale-95 transition-all">Cancel</button>
                </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default PhotoGallery;
