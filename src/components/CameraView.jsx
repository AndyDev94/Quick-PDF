import React, { useRef, useState, useEffect } from 'react';
import { RefreshCw, Camera, ChevronLeft, Image as ImageIcon, Zap, ZapOff, ArrowRight, Trash2, X, Crop } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const CameraView = ({ onCapture, onCancel, onSaveAndExport }) => {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const [stream, setStream] = useState(null);
  const [facingMode, setFacingMode] = useState('environment');
  const [isFlash, setIsFlash] = useState(false);
  const [error, setError] = useState(null);
  const [zoom, setZoom] = useState(1);
  const [capabilities, setCapabilities] = useState({});
  const [flashMode, setFlashMode] = useState('off'); // 'off', 'auto', 'on'
  const [isBatchMode, setIsBatchMode] = useState(false);
  const [batchCount, setBatchCount] = useState(0);
  const [showModeConfirm, setShowModeConfirm] = useState(false);
  const [focusPoint, setFocusPoint] = useState(null);
  const lastTouchDistance = useRef(0);
  const streamRef = useRef(null);
  const tiltRef = useRef(0);
  const [isAutoCrop, setIsAutoCrop] = useState(false);
  const [detectedQuad, setDetectedQuad] = useState(null);
  const detectionCanvasRef = useRef(null);
  const detectionInterval = useRef(null);
  const [isCapturing, setIsCapturing] = useState(false);
  const [showGuidance, setShowGuidance] = useState(true);

  useEffect(() => {
    startCamera();
    const timer = setTimeout(() => setShowGuidance(false), 4000);
    return () => {
      if (streamRef.current) streamRef.current.getTracks().forEach(track => track.stop());
      if (detectionInterval.current) clearInterval(detectionInterval.current);
      clearTimeout(timer);
    };
  }, [facingMode]);

  useEffect(() => {
    if (stream) {
      const track = stream.getVideoTracks()[0];
      const caps = track.getCapabilities?.() || {};
      setCapabilities(caps);
      
      const constraints = { advanced: [] };
      if (caps.zoom) constraints.advanced.push({ zoom: zoom });
      if (caps.torch) constraints.advanced.push({ torch: flashMode === 'on' });
      
      if (constraints.advanced.length > 0) {
          track.applyConstraints(constraints).catch(err => console.error("Constraints apply failed", err));
      }
    }
  }, [zoom, flashMode, stream]);

  const startCamera = async () => {
    try {
      if (streamRef.current) streamRef.current.getTracks().forEach(track => track.stop());
      const newStream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: facingMode,
          width: { ideal: 1920 },
          height: { ideal: 1080 }
        }
      });
      streamRef.current = newStream;
      setStream(newStream);
      if (videoRef.current) videoRef.current.srcObject = newStream;
      setError(null);
    } catch (err) {
      setError("Camera Access Denied");
    }
  };

  useEffect(() => {
    if (detectionInterval.current) clearInterval(detectionInterval.current);
    
    if (isAutoCrop && stream && !isCapturing) {
        detectionInterval.current = setInterval(() => {
            detectDocument();
        }, 100);
    } else {
        setDetectedQuad(null);
    }
    
    return () => {
        if (detectionInterval.current) clearInterval(detectionInterval.current);
    };
  }, [isAutoCrop, isCapturing, stream]);

  const detectDocument = () => {
    if (!videoRef.current || !detectionCanvasRef.current) return;
    const video = videoRef.current;
    const canvas = detectionCanvasRef.current;
    const ctx = canvas.getContext('2d', { willReadFrequently: true });
    
    const w = 300;
    const h = Math.floor((video.videoHeight / video.videoWidth) * w) || 150;
    
    canvas.width = w;
    canvas.height = h;
    ctx.drawImage(video, 0, 0, w, h);
    const data = ctx.getImageData(0, 0, w, h).data;
    
    const getB = (x, y) => {
        const i = (Math.floor(y) * w + Math.floor(x)) * 4;
        return (data[i] + data[i+1] + data[i+2]) / 3;
    };

    const cx = Math.floor(w / 2);
    const cy = Math.floor(h / 2);

    const getAvgB = (x, y) => {
        return (getB(x, y) + getB(x-2, y) + getB(x+2, y) + getB(x, y-2) + getB(x, y+2)) / 5;
    };

    // 🚀 POINT CLOUD QUADRILATERAL DETECTION: Supports tilted documents
    const points = [];
    const step = 8;
    const thresh = 20;

    // Scan from Left and Right edges inward
    for (let y = 10; y < h - 10; y += step) {
        let prevL = getAvgB(5, y);
        for (let x = 5; x < cx; x += 2) {
            const b = getAvgB(x, y);
            if (Math.abs(b - prevL) > thresh) { points.push({x, y}); break; }
            prevL = b;
        }
        let prevR = getAvgB(w - 5, y);
        for (let x = w - 5; x > cx; x -= 2) {
            const b = getAvgB(x, y);
            if (Math.abs(b - prevR) > thresh) { points.push({x, y}); break; }
            prevR = b;
        }
    }

    // Scan from Top and Bottom edges inward
    for (let x = 10; x < w - 10; x += step) {
        let prevT = getAvgB(x, 5);
        for (let y = 5; y < cy; y += 2) {
            const b = getAvgB(x, y);
            if (Math.abs(b - prevT) > thresh) { points.push({x, y}); break; }
            prevT = b;
        }
        let prevB = getAvgB(x, h - 5);
        for (let y = h - 5; y > cy; y -= 2) {
            const b = getAvgB(x, y);
            if (Math.abs(b - prevB) > thresh) { points.push({x, y}); break; }
            prevB = b;
        }
    }

    if (points.length < 10) return; // Not enough edge points found

    // Extract the 4 extreme corners (Convex Hull Approximation)
    let tl = points[0], tr = points[0], br = points[0], bl = points[0];
    let minTL = Infinity, maxTR = -Infinity, maxBR = -Infinity, minBL = Infinity;
    
    points.forEach(p => {
        const sum = p.x + p.y;
        const diff = p.x - p.y;
        
        if (sum < minTL) { minTL = sum; tl = p; }
        if (diff > maxTR) { maxTR = diff; tr = p; }
        if (sum > maxBR) { maxBR = sum; br = p; }
        if (diff < minBL) { minBL = diff; bl = p; }
    });

    // Calculate document tilt (angle of top edge)
    let angleRad = Math.atan2(tr.y - tl.y, tr.x - tl.x);
    let angleDeg = angleRad * (180 / Math.PI);
    
    // Normalize to standard small tilt range (-45 to 45)
    if (angleDeg > 45) angleDeg -= 90;
    if (angleDeg < -45) angleDeg += 90;
    angleRad = angleDeg * (Math.PI / 180);

    // Rotate points to straighten them, find bounding box, then rotate back
    // This guarantees a PERFECT rotated rectangle instead of a messy quad
    let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity;
    points.forEach(p => {
        const rx = p.x * Math.cos(-angleRad) - p.y * Math.sin(-angleRad);
        const ry = p.x * Math.sin(-angleRad) + p.y * Math.cos(-angleRad);
        if (rx < minX) minX = rx;
        if (rx > maxX) maxX = rx;
        if (ry < minY) minY = ry;
        if (ry > maxY) maxY = ry;
    });

    const getRotated = (rx, ry) => ({
        x: rx * Math.cos(angleRad) - ry * Math.sin(angleRad),
        y: rx * Math.sin(angleRad) + ry * Math.cos(angleRad)
    });

    const finalTL = getRotated(minX, minY);
    const finalTR = getRotated(maxX, minY);
    const finalBR = getRotated(maxX, maxY);
    const finalBL = getRotated(minX, maxY);

    // Store the correction tilt needed to straighten the document in the editor
    tiltRef.current = -angleDeg;

    setDetectedQuad(prev => {
        const next = [
            { x: (finalTL.x / w) * 100, y: (finalTL.y / h) * 100 },
            { x: (finalTR.x / w) * 100, y: (finalTR.y / h) * 100 },
            { x: (finalBR.x / w) * 100, y: (finalBR.y / h) * 100 },
            { x: (finalBL.x / w) * 100, y: (finalBL.y / h) * 100 }
        ];
        if (!prev) return next;
        return next.map((p, i) => ({
            x: prev[i].x * 0.15 + p.x * 0.85,
            y: prev[i].y * 0.15 + p.y * 0.85
        }));
    });
  };

  const capturePhoto = async (e) => {
    if (e) e.stopPropagation();
    if (!videoRef.current || !canvasRef.current || isCapturing) return;
    setIsCapturing(true);

    let track = null;
    if (flashMode === 'auto' && capabilities.torch && streamRef.current) {
        track = streamRef.current.getVideoTracks()[0];
        try {
            await track.applyConstraints({ advanced: [{ torch: true }] });
            // Wait for exposure to adjust to the new light
            await new Promise(resolve => setTimeout(resolve, 400));
        } catch (err) {}
    }

    setIsFlash(true);
    setTimeout(() => setIsFlash(false), 150);
    const video = videoRef.current;
    const canvas = canvasRef.current;
    const context = canvas.getContext('2d');
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    context.drawImage(video, 0, 0, canvas.width, canvas.height);
    const dataUrl = canvas.toDataURL('image/jpeg', 0.9);

    if (track && flashMode === 'auto') {
        track.applyConstraints({ advanced: [{ torch: false }] }).catch(()=>{});
    }
    
    const autoCropData = (isAutoCrop && detectedQuad) ? {
        points: detectedQuad,
        originalWidth: canvas.width,
        originalHeight: canvas.height,
        tilt: tiltRef.current
    } : null;

    if (isBatchMode) {
        setBatchCount(prev => prev + 1);
        onCapture(dataUrl, true, autoCropData);
        setTimeout(() => setIsCapturing(false), 800);
    } else {
        onCapture(dataUrl, false, autoCropData);
    }
  };

  const toggleBatchMode = (e) => {
    if (e) e.stopPropagation();
    if (isBatchMode && batchCount > 0) {
      setShowModeConfirm(true);
    } else {
      setIsBatchMode(!isBatchMode);
      setBatchCount(0);
    }
  };

  const confirmModeSwitch = () => {
    setIsBatchMode(false);
    setBatchCount(0);
    setShowModeConfirm(false);
  };

  const handleTouchFocus = (e) => {
    if (e.target.closest('button')) return;
    
    const clientX = e.touches && e.touches.length > 0 ? e.touches[0].clientX : e.clientX;
    const clientY = e.touches && e.touches.length > 0 ? e.touches[0].clientY : e.clientY;
    
    if (clientX === undefined) return;

    const rect = e.currentTarget.getBoundingClientRect();
    const x = clientX - rect.left;
    const y = clientY - rect.top;
    
    setFocusPoint({ x, y });
    setTimeout(() => setFocusPoint(null), 1200);

    if (streamRef.current) {
        const track = streamRef.current.getVideoTracks()[0];
        const point = { x: x / rect.width, y: y / rect.height };
        
        // Attempt native camera focus constraints via various supported signatures
        const applyNativeFocus = async () => {
            try {
                // Method 1: Android Chrome "single-shot"
                await track.applyConstraints({
                    advanced: [{ pointsOfInterest: [point], focusMode: 'single-shot' }]
                });
            } catch (e1) {
                try {
                    // Method 2: iOS Safari "continuous" with points
                    await track.applyConstraints({
                        advanced: [{ pointsOfInterest: [point], focusMode: 'continuous' }]
                    });
                } catch (e2) {
                    try {
                        // Method 3: Just pointsOfInterest
                        await track.applyConstraints({
                            advanced: [{ pointsOfInterest: [point] }]
                        });
                    } catch (e3) {
                        // Focus not supported on this device/browser
                    }
                }
            }
        };
        applyNativeFocus();
    }
  };

  const handleTouchStart = (e) => {
    if (e.touches.length === 2) {
      lastTouchDistance.current = Math.hypot(
        e.touches[0].pageX - e.touches[1].pageX,
        e.touches[0].pageY - e.touches[1].pageY
      );
    }
  };

  const handleTouchMove = (e) => {
    if (e.touches.length === 2) {
      const currentDistance = Math.hypot(
        e.touches[0].pageX - e.touches[1].pageX,
        e.touches[0].pageY - e.touches[1].pageY
      );
      const delta = (currentDistance - lastTouchDistance.current) * 0.01;
      const min = capabilities.zoom?.min || 1;
      const max = capabilities.zoom?.max || 3;
      setZoom(prev => Math.min(max, Math.max(min, prev + delta)));
      lastTouchDistance.current = currentDistance;
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[500] bg-black flex flex-col w-full h-full font-outfit overflow-hidden select-none touch-none"
    >
      {/* 📸 VIDEO VIEWPORT & INTERACTION */}
      <div 
        onClick={handleTouchFocus}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        className="absolute inset-0 z-0 bg-slate-950 flex items-center justify-center pointer-events-auto"
      >
        <AnimatePresence>
          {isFlash && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 bg-white z-[600]" />
          )}
        </AnimatePresence>

        <div className="absolute inset-0 flex items-center justify-center overflow-hidden">
          <div 
            className="relative"
            style={{ 
              aspectRatio: videoRef.current?.videoWidth ? `${videoRef.current.videoWidth}/${videoRef.current.videoHeight}` : 'auto',
              maxWidth: '100%',
              maxHeight: '100%'
            }}
          >
            {stream ? (
              <video
                ref={videoRef}
                autoPlay
                playsInline
                muted
                className={`w-full h-full object-contain ${facingMode === 'user' ? 'scale-x-[-1]' : ''}`}
                style={{ 
                  transform: capabilities.zoom ? (facingMode === 'user' ? 'scale-x(-1)' : 'none') : `scale(${zoom}) ${facingMode === 'user' ? 'scale-x(-1)' : ''}`,
                  transition: capabilities.zoom ? 'none' : 'transform 0.1s linear'
                }}
              />
            ) : (
              <div className="flex flex-col items-center gap-6 text-slate-500">
                <RefreshCw className="w-10 h-10 animate-spin text-indigo-500" />
                <span className="text-[10px] font-black uppercase tracking-[0.3em]">{error || 'Initializing...'}</span>
              </div>
            )}

            {/* 🎯 SMART CROP OVERLAY (High Visibility) */}
            <div className="absolute inset-0 z-[500] pointer-events-none">
               <AnimatePresence>
                  {isAutoCrop && detectedQuad && (
                      <motion.svg 
                        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} 
                        viewBox="0 0 100 100" className="w-full h-full overflow-visible" preserveAspectRatio="none"
                      >
                          <defs>
                              <filter id="glow">
                                  <feGaussianBlur stdDeviation="1.5" result="coloredBlur"/>
                                  <feMerge>
                                      <feMergeNode in="coloredBlur"/><feMergeNode in="SourceGraphic"/>
                                  </feMerge>
                              </filter>
                          </defs>
                          <motion.polygon 
                            points={detectedQuad.map(p => `${p.x},${p.y}`).join(' ')}
                            fill="rgba(129, 140, 248, 0.15)" stroke="#818cf8" strokeWidth="3" strokeLinejoin="round"
                            filter="url(#glow)"
                          />
                          {detectedQuad.map((p, i) => (
                              <circle key={i} cx={p.x} cy={p.y} r="3.5" fill="white" stroke="#818cf8" strokeWidth="1.2" />
                          ))}
                      </motion.svg>
                  )}
               </AnimatePresence>
            </div>
          </div>
        </div>

        {/* 🎯 FOCUS RING */}
        <AnimatePresence>
            {focusPoint && (
              <motion.div 
                initial={{ scale: 2, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.5, opacity: 0 }}
                className="absolute z-[1000] rounded-full border-2 border-indigo-400 pointer-events-none"
                style={{ left: focusPoint.x - 50, top: focusPoint.y - 50, width: '100px', height: '100px' }}
              >
                 <motion.div animate={{ scale: [1, 1.3, 1], opacity: [0.6, 1, 0.6] }} transition={{ repeat: Infinity, duration: 0.7 }} className="absolute inset-0 border border-white/40 rounded-full scale-95" />
                 <div className="absolute inset-0 flex items-center justify-center">
                    <div className="w-2 h-2 bg-indigo-400 rounded-full shadow-[0_0_15px_rgba(129,140,248,1)]" />
                 </div>
              </motion.div>
            )}
        </AnimatePresence>
      </div>

      {/* 🚀 UI LAYER */}
      <div className="absolute inset-0 z-[5000] pointer-events-none flex flex-col justify-between safe-area-inset">
          <header className="flex items-center justify-between w-full pointer-events-auto p-6 mt-4">
            <button 
                onClick={(e) => { e.stopPropagation(); onCancel(); }} 
                onTouchStart={(e) => e.stopPropagation()}
                className="flex items-center gap-2 px-5 py-3.5 rounded-2xl bg-black/40 backdrop-blur-xl border border-white/10 text-white active:scale-95 transition-all shadow-2xl"
            >
              <ChevronLeft className="w-5 h-5 text-indigo-400" />
              <span className="text-[10px] font-black uppercase tracking-widest">Exit</span>
            </button>
            <div className="flex items-center gap-3">
              <button 
                onClick={(e) => { e.stopPropagation(); setIsAutoCrop(!isAutoCrop); }} 
                onTouchStart={(e) => e.stopPropagation()}
                className={`h-12 px-5 flex items-center justify-center gap-3 rounded-2xl backdrop-blur-xl border transition-all ${isAutoCrop ? 'bg-indigo-500 border-indigo-400 text-white shadow-[0_0_20px_rgba(99,102,241,0.5)]' : 'bg-black/40 border-white/10 text-white'}`}
              >
                  <Crop className={`w-4 h-4 ${isAutoCrop ? 'animate-pulse' : ''}`} />
                  <span className="text-[10px] font-black uppercase tracking-widest">{isAutoCrop ? 'Smart Crop' : 'Manual'}</span>
              </button>
              {capabilities.torch && (
                <button 
                    onClick={(e) => { 
                        e.stopPropagation(); 
                        setFlashMode(prev => prev === 'off' ? 'auto' : prev === 'auto' ? 'on' : 'off'); 
                    }} 
                    onTouchStart={(e) => e.stopPropagation()}
                    className={`h-12 w-12 flex items-center justify-center rounded-2xl backdrop-blur-xl border transition-all relative ${flashMode !== 'off' ? 'bg-indigo-500 border-indigo-400 text-white shadow-[0_0_20px_rgba(99,102,241,0.5)]' : 'bg-black/40 border-white/10 text-white'}`}
                >
                  {flashMode === 'on' && <Zap className="w-5 h-5 fill-current" />}
                  {flashMode === 'auto' && (
                      <>
                        <Zap className="w-5 h-5" />
                        <span className="absolute bottom-1 right-1 text-[8px] font-black bg-white text-indigo-500 rounded-full w-3.5 h-3.5 flex items-center justify-center">A</span>
                      </>
                  )}
                  {flashMode === 'off' && <ZapOff className="w-5 h-5 opacity-40" />}
                </button>
              )}
            </div>
          </header>

          <footer className="w-full pb-16 flex flex-col items-center gap-10">
             {/* 📄 MODE TOGGLE */}
             <div className="flex justify-center pointer-events-auto">
                 <button 
                   onClick={(e) => { e.stopPropagation(); toggleBatchMode(e); }} 
                   onTouchStart={(e) => e.stopPropagation()}
                   className="px-10 py-3 rounded-full bg-black/40 border border-white/10 text-white font-black text-[10px] uppercase tracking-[0.4em] active:scale-95 transition-all shadow-2xl backdrop-blur-md"
                 >
                     <span className={`inline-block w-2.5 h-2.5 rounded-full mr-3 ${isBatchMode ? 'bg-indigo-400 animate-pulse shadow-[0_0_10px_rgba(129,140,248,1)]' : 'bg-white/20'}`} />
                     {isBatchMode ? `Batch: ${batchCount}` : 'Single Mode'}
                 </button>
             </div>

             {/* 📸 PRIMARY CONTROLS (Perfect Flex Row) */}
             <div className="flex items-center justify-center gap-20 w-full px-12 pointer-events-auto min-h-[120px]">
                 {/* FLIP CAMERA */}
                 <button 
                   onClick={(e) => { e.stopPropagation(); setFacingMode(prev => prev === 'environment' ? 'user' : 'environment'); }} 
                   onTouchStart={(e) => e.stopPropagation()}
                   className="h-16 w-16 rounded-[1.8rem] bg-black/40 flex items-center justify-center text-white border border-white/10 active:scale-90 transition-all shadow-xl backdrop-blur-md"
                 >
                     <RefreshCw className="w-6 h-6" />
                 </button>
                 
                 {/* SHUTTER (110px) */}
                 <button
                   onClick={(e) => { e.stopPropagation(); capturePhoto(e); }}
                   onTouchStart={(e) => e.stopPropagation()}
                   disabled={isCapturing}
                   style={{ width: '110px', height: '110px' }}
                   className={`rounded-full bg-white p-2.5 shadow-[0_0_60px_rgba(255,255,255,0.4)] active:scale-95 transition-all cursor-pointer flex items-center justify-center relative ${isCapturing ? 'opacity-50' : ''}`}
                 >
                     <div className="w-full h-full rounded-full border-[8px] border-black/5 flex items-center justify-center relative z-10 overflow-hidden">
                        <Camera className="w-10 h-10 text-black/10" />
                     </div>
                     <div className="absolute inset-0 rounded-full border-2 border-white/30 scale-105" />
                 </button>

                 {/* DONE / NEXT (Only shows after first photo) */}
                 <div className="w-16 h-16 flex items-center justify-center">
                    <AnimatePresence mode="wait">
                       {batchCount > 0 && (
                           <motion.button 
                             initial={{ scale: 0, opacity: 0, x: 20 }} animate={{ scale: 1, opacity: 1, x: 0 }} exit={{ scale: 0, opacity: 0, x: 20 }} 
                             onClick={(e) => { e.stopPropagation(); onSaveAndExport(); }} 
                             onTouchStart={(e) => e.stopPropagation()}
                             className="h-16 w-16 rounded-full bg-indigo-500 text-white flex items-center justify-center shadow-[0_15px_40px_rgba(99,102,241,0.5)] active:scale-90 transition-all border border-indigo-400/40"
                           >
                               <ArrowRight className="w-8 h-8" />
                           </motion.button>
                       )}
                    </AnimatePresence>
                 </div>
             </div>

             <div className="h-4 flex items-center justify-center">
                <AnimatePresence mode="wait">
                   {showGuidance && (
                       <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="text-[10px] font-black uppercase tracking-[0.4em] text-white/30 text-center">
                           Focus & Capture
                       </motion.p>
                   )}
                </AnimatePresence>
             </div>
          </footer>
      </div>

      <AnimatePresence>
        {showModeConfirm && (
            <div className="fixed inset-0 z-[6000] flex items-center justify-center p-6 pointer-events-auto">
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 bg-slate-950/90 backdrop-blur-xl" onClick={() => setShowModeConfirm(false)} />
                <motion.div initial={{ scale: 0.9, opacity: 0, y: 20 }} animate={{ scale: 1, opacity: 1, y: 0 }} exit={{ scale: 0.9, opacity: 0, y: 20 }} className="relative bg-slate-900 border border-white/10 rounded-[3rem] p-10 max-w-sm w-full text-center space-y-8 shadow-2xl">
                    <div className="h-20 w-20 bg-red-500/10 border border-red-500/20 rounded-full flex items-center justify-center mx-auto text-red-500">
                        <Trash2 className="w-10 h-10" />
                    </div>
                    <div className="space-y-2">
                        <h4 className="text-white font-black text-xl uppercase tracking-widest">Save Progress?</h4>
                        <p className="text-slate-500 text-[11px] font-bold uppercase tracking-widest leading-relaxed">You have unsaved scans. Save them now?</p>
                    </div>
                    <div className="flex flex-col gap-3">
                        <button onClick={(e) => { e.stopPropagation(); onSaveAndExport(); }} className="w-full py-5 rounded-2xl bg-green-500 text-white font-black text-[11px] uppercase tracking-widest active:scale-95 transition-all shadow-lg shadow-green-500/20">Save & Export</button>
                        <button onClick={(e) => { e.stopPropagation(); confirmModeSwitch(); }} className="w-full py-5 rounded-2xl bg-red-500 text-white font-black text-[11px] uppercase tracking-widest active:scale-95 transition-all shadow-lg shadow-red-500/20">Discard & Switch</button>
                        <button onClick={(e) => { e.stopPropagation(); setShowModeConfirm(false); }} className="w-full py-5 rounded-2xl bg-white/5 text-slate-400 font-black text-[11px] uppercase tracking-widest active:scale-95 transition-all">Cancel</button>
                    </div>
                </motion.div>
            </div>
        )}
      </AnimatePresence>

      <canvas ref={canvasRef} className="hidden" />
      <canvas ref={detectionCanvasRef} className="hidden" />
    </motion.div>
  );
};

export default CameraView;
