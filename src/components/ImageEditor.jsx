import React, { useState, useRef, useEffect } from 'react';
import ReactCrop from 'react-image-crop';
import 'react-image-crop/dist/ReactCrop.css';
import { motion, AnimatePresence } from 'framer-motion';
import Draggable from 'react-draggable';
import { 
  X, Check, Undo2, Redo2, Sliders, Type, Pencil, Palette, 
  Trash2, ChevronDown, ChevronUp, ZoomIn, ZoomOut, Move, Eye,
  RotateCcw, RotateCw, Crop
} from 'lucide-react';

const DraggableLabel = ({ label, onUpdatePos, onEdit, onRemove, containerRef, tab, isPanelMaximized }) => {
  const nodeRef = useRef(null);
  const [isInteracting, setIsInteracting] = useState(false);
  const longPressTimer = useRef(null);
  const isLongPress = useRef(false);

  const handlePointerDown = (e) => {
    isLongPress.current = false;
    longPressTimer.current = setTimeout(() => {
        isLongPress.current = true;
        onEdit(label);
    }, 600); // 600ms for long press
  };

  const handlePointerUp = (e) => {
    if (longPressTimer.current) {
        clearTimeout(longPressTimer.current);
    }
  };
  
  return (
    <Draggable 
      nodeRef={nodeRef}
      disabled={!(tab === 'text' && isPanelMaximized)}
      onDrag={(e, data) => {
        e.stopPropagation();
        if (!containerRef.current) return;
        const { width, height } = containerRef.current.getBoundingClientRect();
        onUpdatePos(label.id, {
          x: (data.x / width) * 100,
          y: (data.y / height) * 100
        });
      }}
      onStart={(e) => {
          e.stopPropagation();
          setIsInteracting(true);
      }}
      onStop={(e) => {
          e.stopPropagation();
          setIsInteracting(false);
      }}
      bounds="parent"
      position={(containerRef.current && label.textPos) ? {
        x: (label.textPos.x / 100) * containerRef.current.clientWidth,
        y: (label.textPos.y / 100) * containerRef.current.clientHeight
      } : { x: 0, y: 0 }}
    >
      <div 
        ref={nodeRef}
        className="absolute z-[200] group cursor-default"
        style={{ left: 0, top: 0, touchAction: 'none' }}
        onPointerDown={(e) => {
            if (!(tab === 'text' && isPanelMaximized)) return;
            e.stopPropagation();
            handlePointerDown(e);
        }}
        onPointerUp={(e) => {
            if (!(tab === 'text' && isPanelMaximized)) return;
            e.stopPropagation();
            handlePointerUp(e);
        }}
      >
        <div className="relative">
            <div 
              className="relative px-6 py-3 rounded-2xl backdrop-blur-md border border-white/20 shadow-2xl transition-all active:scale-95 cursor-pointer flex items-center gap-3 group select-none"
              style={{ 
                backgroundColor: label.textBg || 'rgba(0,0,0,0.5)',
                color: label.textColor || 'white',
                fontSize: `${label.fontSize || 16}px`
              }}
            >
               <div className="h-8 w-8 rounded-lg bg-white/10 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
                  {!(tab === 'text' && isPanelMaximized) ? <Eye className="w-4 h-4" /> : <Move className="w-4 h-4" />}
               </div>
               <span className="font-black uppercase tracking-widest pointer-events-none">{label.text}</span>
            </div>
            
            {/* 🚀 Quick Delete Button */}
            <button 
                onClick={(e) => {
                    e.stopPropagation();
                    onRemove(); 
                }}
                className="absolute -top-3 -right-3 w-8 h-8 rounded-full bg-red-500 text-white flex items-center justify-center shadow-lg hover:scale-110 active:scale-90 transition-all opacity-0 group-hover:opacity-100 z-[210] border-2 border-white"
            >
                <X className="w-4 h-4" />
            </button>
        </div>
      </div>
    </Draggable>
  );
};

const ImageEditor = ({ photo, onSave, onCancel, onRemove }) => {
  const [crop, setCrop] = useState({ unit: '%', width: 100, height: 100, x: 0, y: 0 });
  const [croppedAreaPixels, setCroppedAreaPixels] = useState(photo.croppedArea || null);
  const [croppedAreaPerc, setCroppedAreaPerc] = useState(photo.croppedAreaPercentages || null);
  const [aspect, setAspect] = useState(210 / 297);
  const [isCropping, setIsCropping] = useState(false);
  const [isZooming, setIsZooming] = useState(false);
  
  const [filter, setFilter] = useState(photo.filter || 'none');
  const [brightness, setBrightness] = useState(photo.brightness || 100);
  const [rotation, setRotation] = useState(photo.rotation || 0);
  const [tilt, setTilt] = useState(photo.tilt || 0);
  const [labels, setLabels] = useState(photo.labels || []);
  const [text, setText] = useState('');
  const [textColor, setTextColor] = useState('#ffffff');
  const [textBg, setTextBg] = useState('rgba(0,0,0,0.6)');
  const [fontSize, setFontSize] = useState(20);
  const [editingLabelId, setEditingLabelId] = useState(null);
  
  const [tab, setTab] = useState('adjust');
  
  const [paths, setPaths] = useState(photo.paths || []);
  const [isDrawing, setIsDrawing] = useState(false);
  const [currentPath, setCurrentPath] = useState(null);
  const [drawColor, setDrawColor] = useState('#f43f5e');
  const [brushSize, setBrushSize] = useState(photo.brushSize || 2);
  const [zoomLevel, setZoomLevel] = useState(1);
  const [isInteracting, setIsInteracting] = useState(false);
  const [panOffset, setPanOffset] = useState({ x: 0, y: 0 });
  const [lastPanPos, setLastPanPos] = useState({ x: 0, y: 0 });
  const [isPanning, setIsPanning] = useState(false);
  
  const [cropMode, setCropMode] = useState(!photo.croppedAreaPercentages);
  const [isPanelMaximized, setIsPanelMaximized] = useState(false);
  const [isDeleteConfirming, setIsDeleteConfirming] = useState(false);
  const [labelToDelete, setLabelToDelete] = useState(null);
  
  useEffect(() => {
    if (photo.autoCrop && !photo.crop && !photo.croppedAreaPercentages) {
        const pts = photo.autoCrop.points;
        const xMin = Math.min(...pts.map(p => p.x));
        const xMax = Math.max(...pts.map(p => p.x));
        const yMin = Math.min(...pts.map(p => p.y));
        const yMax = Math.max(...pts.map(p => p.y));
        
        const initialCrop = {
            unit: '%',
            x: xMin,
            y: yMin,
            width: xMax - xMin,
            height: yMax - yMin
        };
        setCrop(initialCrop);
        setCroppedAreaPerc(initialCrop);
    }
  }, [photo]);

  const containerRef = useRef(null);
  const imgRef = useRef(null);
  const zoomTrackRef = useRef(null);

  const getFilterCSS = (f) => {
    switch (f) {
      case 'grayscale': return 'grayscale(100%)';
      case 'sepia': return 'sepia(100%)';
      case 'negative': return 'invert(100%)';
      case 'darken': return 'brightness(0.7) contrast(1.1)';
      case 'vivid': return 'contrast(1.2) saturate(1.3)';
      default: return '';
    }
  };
  

  const filters = [
    { name: 'None', value: 'none' },
    { name: 'B&W', value: 'grayscale' },
    { name: 'Sepia', value: 'sepia' },
    { name: 'Negative', value: 'negative' },
    { name: 'Document', value: 'darken' },
    { name: 'Vivid', value: 'vivid' }
  ];

  const [history, setHistory] = useState([]);
  const [future, setFuture] = useState([]);

  // 🧠 Force A4 default on mount if no crop data exists
  useEffect(() => {
    if (!photo.croppedAreaPercentages) {
      setAspect(210 / 297);
    }
    setRotation(photo.rotation || 0);
    setTilt(photo.tilt || 0);
  }, [photo.id]);

  const pushToHistory = () => {
    setHistory(prev => [...prev, {
        crop, croppedAreaPerc, croppedAreaPixels, filter, brightness, labels, paths, aspect, rotation, tilt
    }]);
    setFuture([]);
  };

  const handleUndo = () => {
    if (history.length === 0) return;
    const previous = history[history.length - 1];
    setFuture(prev => [{
        crop, croppedAreaPerc, croppedAreaPixels, filter, brightness, labels, paths, aspect, rotation, tilt
    }, ...prev]);
    
    setCrop(previous.crop);
    setCroppedAreaPerc(previous.croppedAreaPerc);
    setCroppedAreaPixels(previous.croppedAreaPixels);
    setFilter(previous.filter);
    setBrightness(previous.brightness);
    setLabels(previous.labels);
    setPaths(previous.paths);
    setAspect(previous.aspect);
    setRotation(previous.rotation);
    setTilt(previous.tilt);
    
    setHistory(prev => prev.slice(0, -1));
  };

  const handleRedo = () => {
    if (future.length === 0) return;
    const next = future[0];
    setHistory(prev => [...prev, {
        crop, croppedAreaPerc, croppedAreaPixels, filter, brightness, labels, paths, aspect
    }]);
    
    setCrop(next.crop);
    setCroppedAreaPerc(next.croppedAreaPerc);
    setCroppedAreaPixels(next.croppedAreaPixels);
    setFilter(next.filter);
    setBrightness(next.brightness);
    setLabels(next.labels);
    setPaths(next.paths);
    setAspect(next.aspect);
    setRotation(next.rotation);
    setTilt(next.tilt);
    
    setFuture(prev => prev.slice(1));
  };

  const cropRatios = [
    { name: 'Free', value: null },
    { name: 'A4 Page', value: 210 / 297 },
    { name: 'Letter', value: 8.5 / 11 }
  ];

  const handleSave = (applyToAll = false) => {
    onSave({
      ...photo,
      filter,
      brightness,
      rotation,
      tilt,
      labels,
      croppedArea: croppedAreaPixels,
      croppedAreaPercentages: croppedAreaPerc,
      brushSize,
      paths,
      aspect
    }, applyToAll);
  };

  const handleAddLabel = () => {
    if (!text.trim()) return;
    pushToHistory();
    if (editingLabelId) {
        setLabels(prev => prev.map(l => l.id === editingLabelId ? { ...l, text, textColor, textBg, fontSize } : l));
        setEditingLabelId(null);
    } else {
        setLabels([...labels, {
            id: Date.now().toString(),
            text,
            textColor,
            textBg,
            fontSize,
            textPos: { x: 30, y: 30 },
            isLocked: true // 🚀 Default to locked for stability
        }]);
    }
    setText('');
    setIsPanelMaximized(false);
  };

  const handleEditLabel = (label) => {
    pushToHistory();
    setTab('text');
    setIsPanelMaximized(true);
    setEditingLabelId(label.id);
    setText(label.text);
    setTextColor(label.textColor);
    setTextBg(label.textBg);
    setFontSize(label.fontSize);
  };

  const updateLabelPos = (id, newPos) => {
    setLabels(prev => prev.map(l => l.id === id ? { ...l, textPos: newPos } : l));
  };

  const handleRemoveLabel = (id) => {
    setLabelToDelete(id);
  };

  const confirmRemoveLabel = () => {
    if (!labelToDelete) return;
    pushToHistory();
    setLabels(prev => prev.filter(l => l.id === labelToDelete ? false : true));
    if (editingLabelId === labelToDelete) {
        setEditingLabelId(null);
        setText('');
    }
    setLabelToDelete(null);
  };

  const resetPan = () => {
    setPanOffset({ x: 0, y: 0 });
    setZoomLevel(1);
  };

  const getHexFromRgba = (color) => {
    if (!color) return '#ffffff';
    if (color.startsWith('#')) return color.slice(0, 7);
    const parts = color.match(/\d+/g);
    if (!parts) return '#000000';
    const r = parseInt(parts[0]).toString(16).padStart(2,'0');
    const g = parseInt(parts[1]).toString(16).padStart(2,'0');
    const b = parseInt(parts[2]).toString(16).padStart(2,'0');
    return `#${r}${g}${b}`;
  };

  const handleBgColor = (hex) => {
    const r = parseInt(hex.slice(1, 3), 16);
    const g = parseInt(hex.slice(3, 5), 16);
    const b = parseInt(hex.slice(5, 7), 16);
    setTextBg(`rgba(${r},${g},${b},0.6)`);
  };

  const onImageLoad = (e) => {
    const { width, height } = e.currentTarget;
    const a4 = 210 / 297;
    
    // 🚀 If crop data exists, restore it; otherwise calculate A4 default
    if (photo.croppedAreaPercentages) {
        setCrop(photo.croppedAreaPercentages);
        setCroppedAreaPerc(photo.croppedAreaPercentages);
        if (photo.croppedArea) setCroppedAreaPixels(photo.croppedArea);
        setIsCropping(false);
    } else {
      let newCrop;
      const imgAspect = width / height;
      
      if (imgAspect > a4) {
          // Image is wider than A4
          const cropWidth = (a4 / imgAspect) * 100;
          newCrop = { unit: '%', height: 100, width: cropWidth, x: (100 - cropWidth) / 2, y: 0 };
      } else {
          // Image is taller than A4
          const cropHeight = (imgAspect / a4) * 100;
          newCrop = { unit: '%', width: 100, height: cropHeight, x: 0, y: (100 - cropHeight) / 2 };
      }
      
      setCrop(newCrop);
      setCroppedAreaPerc(newCrop);
      setCroppedAreaPixels({ 
          width: width * (newCrop.width / 100), 
          height: height * (newCrop.height / 100), 
          x: width * (newCrop.x / 100), 
          y: height * (newCrop.y / 100) 
      });
      setAspect(a4);
    }
  };

  const startDrawing = (e) => {
    if (tab !== 'draw' || !containerRef.current) return;
    e.currentTarget.setPointerCapture(e.pointerId);
    const { left, top, width, height } = containerRef.current.getBoundingClientRect();
    const x = ((e.clientX - left) / width) * 100;
    const y = ((e.clientY - top) / height) * 100;
    setIsDrawing(true);
    setCurrentPath({ color: drawColor, size: brushSize, points: [{ x, y }] });
  };

  const draw = (e) => {
    if (!isDrawing || tab !== 'draw' || !containerRef.current || !currentPath) return;
    const { left, top, width, height } = containerRef.current.getBoundingClientRect();
    const x = ((e.clientX - left) / width) * 100;
    const y = ((e.clientY - top) / height) * 100;
    setCurrentPath(prev => prev ? { ...prev, points: [...prev.points, { x, y }] } : null);
  };

  const endDrawing = () => {
    if (!isDrawing) return;
    setIsDrawing(false);
    if (currentPath && currentPath.points.length > 1) {
       pushToHistory();
       setPaths(prev => [...prev, currentPath]);
    }
    setCurrentPath(null);
  };

  // 🚀 Workspace movement is now handled by Draggable component for a more native feel

  return (
    <div className="fixed inset-0 z-[1000] bg-slate-950 flex flex-col overflow-hidden font-outfit touch-none">

      <div className="flex-1 min-h-0 bg-black flex flex-col relative overflow-hidden">
        <header className="absolute top-0 inset-x-0 z-50 p-6 flex items-center justify-between pointer-events-none">
          <div className="flex items-center gap-3 pointer-events-auto">
            <button onClick={onCancel} className="h-12 px-6 rounded-2xl bg-black/60 backdrop-blur-xl border border-white/10 text-white flex items-center gap-3 active:scale-95 transition-all">
                <X className="w-5 h-5 text-red-400" />
                <span className="text-[10px] font-black uppercase tracking-widest">Cancel</span>
            </button>
            <div className="flex items-center bg-black/60 backdrop-blur-xl rounded-2xl border border-white/10 p-1">
                <button 
                    onClick={handleUndo} 
                    disabled={history.length === 0}
                    className={`h-10 w-12 rounded-xl flex items-center justify-center transition-all ${history.length > 0 ? 'text-indigo-400 active:scale-90 hover:bg-white/5' : 'text-white/10 opacity-50 cursor-not-allowed'}`}
                >
                    <Undo2 className="w-5 h-5" />
                </button>
                <div className="w-px h-6 bg-white/5 mx-1" />
            </div>
          </div>
          <button onClick={() => handleSave()} className="h-12 px-6 rounded-2xl bg-indigo-500 text-white flex items-center gap-3 shadow-2xl active:scale-95 transition-all pointer-events-auto">
            <Check className="w-5 h-5" />
            <span className="text-[10px] font-black uppercase tracking-widest">Done</span>
          </button>
        </header>

        <div className="flex-1 flex items-center justify-center p-4 md:p-12 relative overflow-hidden bg-black/40">
          <Draggable 
            nodeRef={containerRef} 
            disabled={cropMode || tab === 'draw'}
            cancel=".react-crop, .label-item, button, input"
            position={panOffset}
            onDrag={(e, data) => setPanOffset({ x: data.x, y: data.y })}
            scale={zoomLevel}
          >
            <div 
                ref={containerRef}
                className="relative transition-all duration-300"
                style={{
                    width: 'auto',
                    height: 'auto',
                    maxHeight: '85%',
                    maxWidth: '90%'
                }}
            >
                <div 
                    className="relative bg-white/2 shadow-[0_40px_100px_rgba(0,0,0,0.8)] rounded-[2rem] border border-white/5 w-full h-full flex flex-col items-center justify-center origin-center"
                    style={{ transform: `scale(${zoomLevel})` }}
                >
                    <div className="relative z-[150] flex flex-col items-center justify-center w-full h-full">
                    <div 
                        className={`flex-1 relative flex items-center justify-center p-4 min-h-0 w-full h-full ${!cropMode && tab !== 'draw' ? 'cursor-move' : ''}`}
                        onPointerDown={(e) => setIsInteracting(true)}
                        onPointerUp={(e) => setIsInteracting(false)}
                    >
                    {cropMode ? (
                        <ReactCrop
                            crop={crop}
                            onChange={(c, percentCrop) => {
                                setCrop(c);
                                setAspect(null); 
                                setIsCropping(true);
                            }}
                            onComplete={(c, percentCrop) => {
                                if (percentCrop.width > 0) {
                                    setCroppedAreaPerc(percentCrop);
                                    setCroppedAreaPixels(c);
                                }
                                setTimeout(() => setIsCropping(false), 500);
                            }}
                            aspect={aspect === null ? undefined : aspect}
                            className="max-h-full max-w-full rounded-lg shadow-2xl border-4 border-indigo-500/20"
                            minHeight={10}
                            minWidth={10}
                            ruleOfThirds
                        >
                            <img 
                                src={photo.src} 
                                className="max-h-full max-w-full w-auto h-auto object-contain block" 
                                style={{ 
                                    filter: `brightness(${brightness}%) ${getFilterCSS(filter)}`, 
                                    transition: 'filter 0.3s' 
                                }} 
                                onLoad={onImageLoad}
                                alt="Crop" 
                            />
                        </ReactCrop>
                    ) : (
                        <div 
                            className="relative shadow-2xl transition-all duration-300 ease-out flex items-center justify-center pointer-events-auto overflow-hidden rounded-xl border-2 border-white/10"
                            style={{ 
                                width: 'min(80vw, 400px)', // Robust container size
                                aspectRatio: croppedAreaPerc ? `${croppedAreaPerc.width}/${croppedAreaPerc.height}` : 'auto',
                                backgroundColor: '#000'
                            }}
                        >
                            <img 
                                src={photo.src} 
                                className="absolute block max-w-none"
                                style={{ 
                                    filter: `brightness(${brightness}%) ${getFilterCSS(filter)}`,
                                    transition: 'filter 0.3s',
                                    // 🚀 Precision framing: Position and size the image to isolate the crop
                                    left: croppedAreaPerc ? `-${(croppedAreaPerc.x / croppedAreaPerc.width) * 100}%` : '0',
                                    top: croppedAreaPerc ? `-${(croppedAreaPerc.y / croppedAreaPerc.height) * 100}%` : '0',
                                    width: croppedAreaPerc ? `${(100 / croppedAreaPerc.width) * 100}%` : '100%',
                                    height: croppedAreaPerc ? `${(100 / croppedAreaPerc.height) * 100}%` : '100%',
                                    transform: `rotate(${rotation + tilt}deg)`,
                                    objectFit: 'contain'
                                }}
                                alt="Preview" 
                            />
                        </div>
                    )}

                    {labels.map(label => (
                        <DraggableLabel 
                            key={label.id} 
                            label={label} 
                            onUpdatePos={updateLabelPos} 
                            onEdit={handleEditLabel}
                            onRemove={() => handleRemoveLabel(label.id)}
                            containerRef={containerRef} 
                            tab={tab}
                            isPanelMaximized={isPanelMaximized}
                        />
                    ))}

                    <svg 
                        viewBox="0 0 100 100"
                        preserveAspectRatio="none"
                        className="absolute inset-0 w-full h-full z-[110]" 
                        onPointerDown={startDrawing}
                        onPointerMove={draw}
                        onPointerUp={endDrawing}
                        onPointerOut={endDrawing}
                        style={{ touchAction: tab === 'draw' ? 'none' : 'auto', pointerEvents: tab === 'draw' ? 'auto' : 'none' }}
                    >
                        {paths.map((p, i) => (
                            <polyline key={i} points={p.points.map(pt => `${pt.x},${pt.y}`).join(' ')} fill="none" stroke={p.color} strokeWidth={p.size || 1.5} strokeLinecap="round" strokeLinejoin="round" vectorEffect="non-scaling-stroke" />
                        ))}
                        {currentPath && (
                            <polyline points={currentPath.points.map(pt => `${pt.x},${pt.y}`).join(' ')} fill="none" stroke={currentPath.color} strokeWidth={currentPath.size || 1.5} strokeLinecap="round" strokeLinejoin="round" vectorEffect="non-scaling-stroke" />
                        )}
                    </svg>
                    </div>
                </div>
            </div>
          </div>
        </Draggable>
      </div>

        <div className="absolute bottom-10 inset-x-0 z-[6000] flex flex-col items-center px-6 gap-6 pointer-events-none">
          
          <AnimatePresence>
              {isPanelMaximized && (
                  <motion.div 
                      initial={{ opacity: 0, y: 50, scale: 0.95 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: 50, scale: 0.95 }}
                      className="w-full max-w-lg bg-slate-900 border border-white/10 rounded-[3rem] shadow-[0_40px_100px_rgba(0,0,0,0.9)] p-8 pointer-events-auto relative overflow-hidden"
                  >
                      <div className="flex items-center justify-between mb-8">
                          <div className="flex flex-col gap-1">
                            <h3 className="text-[12px] font-black text-indigo-400 uppercase tracking-[0.3em]">
                                {tab === 'adjust' ? 'Image Corrections' : 
                                 tab === 'text' ? 'Smart Labels' : 
                                 tab === 'draw' ? 'Manual Annotations' : 'Visual Styles'}
                            </h3>
                            <div className="h-1 w-12 bg-indigo-500 rounded-full" />
                          </div>
                          <button onClick={() => setIsPanelMaximized(false)} className="h-10 w-10 rounded-full bg-white/5 flex items-center justify-center text-slate-500 hover:text-white">
                              <X className="w-5 h-5" />
                          </button>
                      </div>

                      <div className="max-h-[25vh] overflow-y-auto custom-scrollbar pr-2">
                        {tab === 'adjust' && (
                            <div className="space-y-8 pb-4">
                                <div className="space-y-4">
                                    <div className="flex justify-between text-[10px] font-bold text-slate-500 uppercase tracking-widest">
                                        <span>Crop Presets</span>
                                        <span className="text-indigo-400">Fixed Ratios</span>
                                    </div>
                                    <div className="grid grid-cols-3 gap-3">
                                        {cropRatios.map(r => (
                                            <button 
                                                key={r.name}
                                                onClick={() => {
                                                    setAspect(r.value);
                                                    if (r.value) {
                                                        const targetAspect = r.value;
                                                        const img = containerRef.current.querySelector('img');
                                                        if (img) {
                                                            const imgAspect = img.naturalWidth / img.naturalHeight;
                                                            let newCrop;
                                                            if (imgAspect > targetAspect) {
                                                                newCrop = { unit: '%', height: 100, width: (targetAspect / imgAspect) * 100, x: (1 - (targetAspect / imgAspect)) * 50, y: 0 };
                                                            } else {
                                                                newCrop = { unit: '%', width: 100, height: (imgAspect / targetAspect) * 100, x: 0, y: (1 - (imgAspect / targetAspect)) * 50 };
                                                            }
                                                            setCrop(newCrop);
                                                            setCroppedAreaPerc(newCrop);
                                                        }
                                                    }
                                                    setCropMode(true);
                                                }}
                                                className={`py-4 rounded-2xl border transition-all text-[10px] font-black uppercase tracking-widest ${aspect === r.value ? 'bg-indigo-500 border-indigo-400 text-white shadow-lg' : 'bg-white/5 border-white/10 text-slate-400 hover:border-white/20'}`}
                                            >
                                                {r.name}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                                <div className="space-y-6 pt-6 border-t border-white/5">
                                    <div className="flex justify-between text-[10px] font-bold text-slate-500 uppercase tracking-widest">
                                        <span>Exposure</span>
                                        <span className="text-indigo-400">{brightness}%</span>
                                    </div>
                                    <input type="range" min="50" max="150" value={brightness} onChange={(e) => setBrightness(parseInt(e.target.value))} className="w-full h-2 bg-white/10 rounded-full appearance-none accent-indigo-500 cursor-pointer" />
                                </div>

                                {/* 📷 GEOMETRIC CORRECTIONS */}
                                <div className="space-y-8 pt-8 border-t border-white/5">
                                    <div className="flex items-center justify-between">
                                        <div className="flex flex-col gap-1">
                                            <h4 className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Geometric Correction</h4>
                                            <span className="text-[9px] text-slate-600 font-medium">Rotation & Perspective</span>
                                        </div>
                                        <div className="flex gap-2">
                                            <button 
                                                onClick={() => setRotation(prev => (prev - 90))}
                                                className="h-12 w-12 flex items-center justify-center rounded-2xl bg-white/5 border border-white/10 text-white active:scale-95 transition-all hover:bg-white/10"
                                            >
                                                <RotateCcw className="w-5 h-5" />
                                            </button>
                                            <button 
                                                onClick={() => setRotation(prev => (prev + 90))}
                                                className="h-12 w-12 flex items-center justify-center rounded-2xl bg-white/5 border border-white/10 text-white active:scale-95 transition-all hover:bg-white/10"
                                            >
                                                <RotateCw className="w-5 h-5" />
                                            </button>
                                        </div>
                                    </div>

                                    <div className="space-y-6">
                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center gap-3">
                                                <div className="w-1.5 h-1.5 rounded-full bg-indigo-500" />
                                                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Fine Tilt</span>
                                            </div>
                                            <div className="flex items-center gap-3">
                                                <span className="text-[10px] font-mono text-indigo-400 font-black">{tilt}°</span>
                                                <button onClick={() => setTilt(0)} className="text-[9px] font-black text-slate-600 hover:text-white uppercase tracking-widest transition-colors">Reset</button>
                                            </div>
                                        </div>
                                        <input 
                                            type="range" min="-45" max="45" value={tilt} 
                                            onChange={(e) => setTilt(parseInt(e.target.value))}
                                            className="w-full h-2 bg-white/10 rounded-full appearance-none accent-indigo-500 cursor-pointer" 
                                        />
                                    </div>

                                    {/* ✂️ REFINE CROP QUICK ACCESS */}
                                    <div className="pt-8 border-t border-white/5">
                                        <button 
                                            onClick={() => {
                                                setZoomLevel(1);
                                                setPanOffset({ x: 0, y: 0 });
                                                setCropMode(true);
                                                setIsPanelMaximized(false);
                                                if (!crop) {
                                                    setCrop({ unit: '%', width: 90, height: 90, x: 5, y: 5 });
                                                }
                                            }}
                                            className="w-full py-5 rounded-[2.5rem] bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 flex items-center justify-center gap-4 active:scale-95 transition-all hover:bg-indigo-500/20 group"
                                        >
                                            <Crop className="w-5 h-5 group-hover:rotate-12 transition-transform" />
                                            <div className="flex flex-col items-start leading-tight">
                                                <span className="text-[11px] font-black uppercase tracking-widest">Refine Crop</span>
                                                <span className="text-[8px] font-black uppercase tracking-widest opacity-60">Adjust Document Boundaries</span>
                                            </div>
                                        </button>
                                    </div>
                                </div>
                            </div>
                        )}

                        {tab === 'text' && (
                            <div className="space-y-8 pb-4">
                                <div className="flex gap-3">
                                    <input type="text" value={text} onChange={(e) => setText(e.target.value)} placeholder="Type label text..." className="flex-1 bg-white/5 border border-white/10 rounded-2xl px-6 py-4 text-white text-sm outline-none focus:border-indigo-500 transition-all font-medium" />
                                    <button onClick={handleAddLabel} className="bg-indigo-500 text-white px-8 rounded-2xl font-black uppercase tracking-widest text-[10px] active:scale-95 transition-all shadow-lg">
                                        {editingLabelId ? 'Update Label' : 'Add Label'}
                                    </button>
                                </div>
                                <div className="space-y-6">
                                    <div className="flex justify-between text-[10px] font-bold text-slate-500 uppercase tracking-widest">
                                        <span>Label Size</span>
                                        <span className="text-indigo-400">{fontSize}px</span>
                                    </div>
                                    <input type="range" min="6" max="100" value={fontSize} onChange={(e) => setFontSize(parseInt(e.target.value))} className="w-full h-2 bg-white/10 rounded-full appearance-none accent-indigo-500 cursor-pointer" />
                                </div>
                                <div className="grid grid-cols-2 gap-8">
                                    <div className="space-y-4">
                                        <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest block">Text Color</span>
                                        <div className="flex flex-wrap gap-2">
                                            {['#ffffff', '#000000', '#f43f5e', '#3b82f6', '#10b981', '#f59e0b'].map(c => (
                                                <button key={c} onClick={() => setTextColor(c)} className={`h-8 w-8 rounded-full border-2 transition-all ${textColor === c ? 'border-white scale-110 shadow-lg' : 'border-transparent opacity-60'}`} style={{ backgroundColor: c }} />
                                            ))}
                                            <div className="h-8 w-8 rounded-full border-2 border-white/20 overflow-hidden relative shadow-inner cursor-pointer hover:scale-110 transition-all" style={{ background: 'conic-gradient(red, yellow, lime, aqua, blue, magenta, red)' }}>
                                                <input type="color" value={textColor} onChange={(e) => setTextColor(e.target.value)} className="absolute -inset-2 w-12 h-12 cursor-pointer opacity-0" />
                                            </div>
                                        </div>
                                    </div>
                                    <div className="space-y-4">
                                        <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest block">Background</span>
                                        <div className="flex items-center gap-3">
                                            <input type="color" value={getHexFromRgba(textBg)} onChange={(e) => handleBgColor(e.target.value)} className="h-10 w-10 rounded-lg bg-transparent cursor-pointer" />
                                            <span className="text-[10px] font-medium text-slate-400">Choose Shade</span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}

                        {tab === 'draw' && (
                            <div className="space-y-8 pb-4">
                                <div className="grid grid-cols-2 gap-8">
                                    <div className="space-y-4">
                                        <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest block">Brush Color</span>
                                        <div className="flex flex-wrap gap-2">
                                            {['#f43f5e', '#3b82f6', '#10b981', '#f59e0b', '#ffffff', '#000000'].map(c => (
                                                <button key={c} onClick={() => setDrawColor(c)} className={`h-8 w-8 rounded-full border-2 transition-all ${drawColor === c ? 'border-white scale-110 shadow-lg' : 'border-transparent opacity-60'}`} style={{ backgroundColor: c }} />
                                            ))}
                                            <div className="h-8 w-8 rounded-full border-2 border-white/20 overflow-hidden relative shadow-inner cursor-pointer hover:scale-110 transition-all" style={{ background: 'conic-gradient(red, yellow, lime, aqua, blue, magenta, red)' }}>
                                                <input type="color" value={drawColor} onChange={(e) => setDrawColor(e.target.value)} className="absolute -inset-2 w-12 h-12 cursor-pointer opacity-0" />
                                            </div>
                                        </div>
                                    </div>
                                    <div className="space-y-6">
                                        <div className="flex justify-between text-[10px] font-bold text-slate-500 uppercase tracking-widest">
                                            <span>Thickness</span>
                                            <span className="text-indigo-400">{brushSize}px</span>
                                        </div>
                                        <input type="range" min="1" max="10" value={brushSize} onChange={(e) => setBrushSize(parseInt(e.target.value))} className="w-full h-2 bg-white/10 rounded-full appearance-none accent-indigo-500 cursor-pointer" />
                                    </div>
                                </div>
                                <button onClick={() => { pushToHistory(); setPaths([]); }} className="w-full py-4 rounded-2xl bg-white/5 border border-white/10 text-red-400 text-[10px] font-black uppercase tracking-[0.2em] hover:bg-red-500/10 active:scale-95 transition-all">Clear All Drawings</button>
                            </div>
                        )}

                        {tab === 'filter' && (
                            <div className="space-y-6 pb-4">
                                <div className="flex overflow-x-auto gap-4 pb-4 custom-scrollbar snap-x">
                                    {filters.map(f => (
                                        <button key={f.value} onClick={() => setFilter(f.value)} className={`snap-center shrink-0 flex flex-col items-center gap-3 p-4 rounded-3xl border transition-all ${filter === f.value ? 'bg-indigo-500 border-indigo-400 text-white shadow-lg' : 'bg-white/5 border-white/10 text-slate-400 hover:border-white/20'}`}>
                                            <div className={`h-16 w-16 rounded-2xl bg-slate-800 flex items-center justify-center overflow-hidden border border-white/10 ${f.value === 'grayscale' ? 'grayscale' : f.value === 'sepia' ? 'sepia' : ''}`}>
                                                <img src={photo.src} className="w-full h-full object-cover opacity-50" alt="" />
                                            </div>
                                            <span className="text-[10px] font-black uppercase tracking-widest">{f.name}</span>
                                        </button>
                                    ))}
                                </div>
                                <div className="flex gap-3">
                                    <button onClick={() => { setIsPanelMaximized(false); setTab(null); }} className="flex-1 py-4 rounded-2xl bg-white/5 border border-white/10 text-white text-[10px] font-black uppercase tracking-widest hover:bg-white/10 active:scale-95 transition-all">Apply to This Page</button>
                                    <button onClick={() => onSave({ ...photo, filter, tilt, rotation, brightness, croppedAreaPercentages: croppedAreaPerc, labels, paths }, true, true)} className="flex-1 py-4 rounded-2xl bg-indigo-500 text-white text-[10px] font-black uppercase tracking-widest shadow-lg shadow-indigo-500/30 active:scale-95 transition-all">Apply to All Pages</button>
                                </div>
                            </div>
                        )}
                      </div>
                  </motion.div>
              )}
          </AnimatePresence>

          <AnimatePresence>
              {isDeleteConfirming && (
                  <motion.div 
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="fixed inset-0 z-[9000] bg-slate-950/90 backdrop-blur-xl flex items-center justify-center px-6 pointer-events-auto"
                  >
                      <motion.div 
                        initial={{ opacity: 0, scale: 0.9, y: 30 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.9, y: 30 }}
                        className="w-full max-w-sm bg-slate-900 border border-white/10 rounded-[3rem] p-10 shadow-[0_60px_120px_rgba(0,0,0,1)] text-center"
                      >
                        <div className="h-20 w-20 bg-red-500/20 rounded-full flex items-center justify-center mx-auto mb-8 shadow-inner">
                            <Trash2 className="w-10 h-10 text-red-500" />
                        </div>
                        <h4 className="text-white font-black mb-3 text-lg uppercase tracking-[0.2em]">Discard Page?</h4>
                        <p className="text-slate-500 text-xs mb-10 leading-relaxed font-medium">This action cannot be undone. This page will be permanently removed from your scan sequence.</p>
                        <div className="flex flex-col gap-4">
                            <button onClick={() => onRemove(photo.id)} className="w-full py-6 rounded-3xl bg-red-500 text-white font-black text-[12px] uppercase tracking-widest shadow-[0_15px_40px_rgba(239,68,68,0.4)] active:scale-95 transition-all">Yes, Discard It</button>
                            <button onClick={() => setIsDeleteConfirming(false)} className="w-full py-6 rounded-3xl bg-white/5 text-white font-black text-[12px] uppercase tracking-widest active:scale-95 transition-all border border-white/10">No, Keep Page</button>
                        </div>
                      </motion.div>
                  </motion.div>
              )}
          </AnimatePresence>

          <AnimatePresence>
              {labelToDelete && (
                  <motion.div 
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="fixed inset-0 z-[1000000] bg-slate-950/90 backdrop-blur-xl flex items-center justify-center px-6 pointer-events-auto"
                  >
                      <motion.div 
                        initial={{ opacity: 0, scale: 0.9, y: 30 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.9, y: 30 }}
                        className="w-full max-w-sm bg-slate-900 border border-white/10 rounded-[3rem] p-10 shadow-[0_60px_120px_rgba(0,0,0,1)] text-center"
                      >
                        <div className="h-20 w-20 bg-red-500/20 rounded-full flex items-center justify-center mx-auto mb-8 shadow-inner">
                            <Type className="w-10 h-10 text-red-500" />
                        </div>
                        <h4 className="text-white font-black mb-3 text-lg uppercase tracking-[0.2em]">Remove Label?</h4>
                        <p className="text-slate-500 text-xs mb-10 leading-relaxed font-medium">This annotation will be permanently removed from your document.</p>
                        <div className="flex flex-col gap-4">
                            <button onClick={confirmRemoveLabel} className="w-full py-6 rounded-3xl bg-red-500 text-white font-black text-[12px] uppercase tracking-widest shadow-[0_15px_40px_rgba(239,68,68,0.4)] active:scale-95 transition-all">Yes, Remove It</button>
                            <button onClick={() => setLabelToDelete(null)} className="w-full py-6 rounded-3xl bg-white/5 text-white font-black text-[12px] uppercase tracking-widest active:scale-95 transition-all border border-white/10">Cancel</button>
                        </div>
                      </motion.div>
                  </motion.div>
              )}
          </AnimatePresence>

          <div className="flex flex-col items-center gap-4 w-full safe-bottom">
            {cropMode && (
                <button 
                    onClick={() => {
                        pushToHistory();
                        setCropMode(false);
                    }}
                    className="w-full bg-indigo-500 text-white rounded-[2.5rem] py-6 font-black uppercase tracking-[0.3em] text-[14px] shadow-2xl active:scale-95 transition-all pointer-events-auto"
                >
                    Confirm Crop Area
                </button>
            )}

            <div className="bg-slate-900/90 backdrop-blur-3xl rounded-full px-6 py-4 flex items-center gap-3 border border-white/20 shadow-[0_30px_100px_rgba(0,0,0,0.8)] pointer-events-auto">
                <button 
                    onClick={() => setIsPanelMaximized(!isPanelMaximized)}
                    className={`h-12 w-12 rounded-full flex items-center justify-center transition-all ${isPanelMaximized ? 'bg-white/10 text-white rotate-180' : 'bg-indigo-500 text-white shadow-lg'}`}
                >
                    {isPanelMaximized ? <ChevronDown className="w-5 h-5" /> : <ChevronUp className="w-5 h-5" />}
                </button>
                <div className="w-px h-8 bg-white/10 mx-1" />
                {[
                    { id: 'adjust', icon: Sliders },
                    { id: 'text', icon: Type },
                    { id: 'draw', icon: Pencil },
                    { id: 'filter', icon: Palette }
                ].map(t => (
                    <button 
                        key={t.id} 
                        onClick={() => { 
                            setTab(t.id); 
                            setIsPanelMaximized(true); 
                            // 🚀 Reset label editing state when switching manually
                            if (t.id === 'text') {
                                setEditingLabelId(null);
                                setText('');
                            }
                        }}
                        className={`h-12 w-12 rounded-full flex items-center justify-center transition-all ${tab === t.id && isPanelMaximized ? 'bg-indigo-500 text-white shadow-xl scale-110' : 'text-slate-400 hover:text-white hover:bg-white/5'}`}
                    >
                        <t.icon className="w-5 h-5" />
                    </button>
                ))}
                <div className="w-px h-8 bg-white/10 mx-1" />
                <button 
                    onClick={() => setIsDeleteConfirming(true)}
                    className="h-12 w-12 rounded-full flex items-center justify-center text-red-500 hover:bg-red-500/10 transition-all"
                >
                    <Trash2 className="w-5 h-5" />
                </button>
              </div>
            </div>
          </div>
    
          <AnimatePresence>
            {!isCropping && !isInteracting && (
              <motion.div 
                initial={{ opacity: 0, scale: 0.8, x: 20 }}
                animate={{ opacity: 1, scale: 1, x: 0 }}
                exit={{ opacity: 0, scale: 0.8, x: 20 }}
                className="fixed z-[1000001] flex flex-col items-center gap-6 bg-slate-900/80 backdrop-blur-3xl p-5 rounded-full border border-white/20 shadow-[0_30px_100px_rgba(0,0,0,1)] pointer-events-auto"
                style={{ right: '24px', bottom: '160px' }}
              >
                <button 
                  onClick={resetPan}
                  className="h-12 w-12 flex items-center justify-center bg-white/10 text-indigo-400 rounded-full transition-all active:scale-75 hover:bg-white/20 border border-white/10"
                  title="Center View"
                >
                  <Eye className="w-6 h-6" />
                </button>
    
                <div className="w-8 h-px bg-white/10" />
    
                <button 
                  onClick={() => setZoomLevel(prev => Math.min(prev + 0.1, 5))} 
                  className="h-12 w-12 flex items-center justify-center bg-indigo-500 text-white rounded-full transition-all active:scale-75 shadow-xl"
                >
                  <ZoomIn className="w-6 h-6" />
                </button>
                
                <div 
                  ref={zoomTrackRef}
                  className="h-40 w-12 flex flex-col items-center justify-center relative touch-none"
                  onTouchStart={(e) => {
                      const updateZoom = (clientY) => {
                          if (!zoomTrackRef.current) return;
                          const rect = zoomTrackRef.current.getBoundingClientRect();
                          const relativeY = Math.max(0, Math.min(rect.height, clientY - rect.top));
                          const percent = 1 - (relativeY / rect.height);
                          setZoomLevel(0.5 + percent * 4.5);
                      };
                      updateZoom(e.touches[0].clientY);
                      
                      const onMove = (moveEvent) => updateZoom(moveEvent.touches[0].clientY);
                      const onUp = () => {
                          document.removeEventListener('touchmove', onMove);
                          document.removeEventListener('touchend', onUp);
                      };
                      document.addEventListener('touchmove', onMove, { passive: false });
                      document.addEventListener('touchend', onUp);
                  }}
                  onMouseDown={(e) => {
                      const updateZoom = (clientY) => {
                          if (!zoomTrackRef.current) return;
                          const rect = zoomTrackRef.current.getBoundingClientRect();
                          const relativeY = Math.max(0, Math.min(rect.height, clientY - rect.top));
                          const percent = 1 - (relativeY / rect.height);
                          setZoomLevel(0.5 + percent * 4.5);
                      };
                      updateZoom(e.clientY);
                      
                      const onMove = (moveEvent) => updateZoom(moveEvent.clientY);
                      const onUp = () => {
                          document.removeEventListener('mousemove', onMove);
                          document.removeEventListener('mouseup', onUp);
                      };
                      document.addEventListener('mousemove', onMove);
                      document.addEventListener('mouseup', onUp);
                  }}
                >
                  <div className="h-full w-2 bg-white/10 rounded-full relative overflow-hidden pointer-events-none">
                    <div 
                      className="absolute bottom-0 left-0 right-0 bg-indigo-500 transition-all duration-75"
                      style={{ height: `${((zoomLevel - 0.5) / 4.5) * 100}%` }}
                    />
                  </div>
                  
                  <motion.div 
                    className="absolute w-8 h-8 bg-white rounded-full shadow-2xl border-2 border-indigo-500 z-10 cursor-grab active:cursor-grabbing pointer-events-none"
                    style={{ 
                      y: (1 - (zoomLevel - 0.5) / 4.5) * 160 - 80, // 160 is height, -80 to center
                    }}
                  />
                </div>
    
                <button 
                  onClick={() => setZoomLevel(prev => Math.max(prev - 0.1, 0.5))} 
                  className="h-12 w-12 flex items-center justify-center bg-white/10 text-white rounded-full transition-all active:scale-75 hover:bg-white/20"
                >
                  <ZoomOut className="w-6 h-6" />
                </button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    );
};

export default ImageEditor;
