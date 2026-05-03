import React, { useState, useEffect, useRef } from 'react';
import CameraView from './components/CameraView';
import PhotoGallery from './components/PhotoGallery';
import ImageEditor from './components/ImageEditor';
import { generatePDF } from './utils/pdfGenerator';
import { AnimatePresence } from 'framer-motion';
import { saveToDB, getFromDB } from './utils/storage';


function App() {
  const [photos, setPhotos] = useState([]);
  const [scans, setScans] = useState([]); // List of past document metadata
  const [view, setView] = useState('gallery'); // 'gallery', 'camera', 'editor'
  const [editingPhoto, setEditingPhoto] = useState(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [autoOpenExport, setAutoOpenExport] = useState(false);

  // Load from IndexedDB
  useEffect(() => {
    const loadData = async () => {
      const savedPhotos = await getFromDB('photos', 'current_session');
      const savedScans = await getFromDB('scans', 'history');
      if (savedPhotos) setPhotos(savedPhotos);
      if (savedScans) setScans(savedScans);
    };
    loadData();
  }, []);

  // Save to IndexedDB
  useEffect(() => {
    saveToDB('photos', 'current_session', photos);
  }, [photos]);

  useEffect(() => {
    saveToDB('scans', 'history', scans);
  }, [scans]);

  // 🚀 NAVIGATION & HARDWARE BACK BUTTON TRAP
  const viewRef = useRef(view);
  const photosRef = useRef(photos);

  useEffect(() => {
    viewRef.current = view;
    photosRef.current = photos;
  }, [view, photos]);

  useEffect(() => {
    // 1. Trap page refresh / tab close
    const handleBeforeUnload = (e) => {
      if (photosRef.current.length > 0) {
        e.preventDefault();
        e.returnValue = ''; // Triggers browser's generic "Discard changes?" prompt
      }
    };
    window.addEventListener('beforeunload', handleBeforeUnload);

    // 2. Trap Android/Hardware Back Button
    // Push an initial state so the first back-press is trapped
    window.history.pushState({ trapped: true }, '');

    const handlePopState = (e) => {
      const currentView = viewRef.current;
      const currentPhotos = photosRef.current;

      if (currentView === 'camera' || currentView === 'editor') {
        // If inside a sub-screen, go back to gallery instead of exiting
        setView('gallery');
        // Restore the trap
        window.history.pushState({ trapped: true }, '');
      } else if (currentView === 'gallery' && currentPhotos.length > 0) {
        // If in gallery with unsaved work, confirm exit
        if (window.confirm("You have unsaved photos. Are you sure you want to exit?")) {
           // Allow exit by going back again (since the trap was already popped)
           window.history.back();
        } else {
           // Restore the trap
           window.history.pushState({ trapped: true }, '');
        }
      } else {
        // Empty gallery, allow normal exit
        window.history.back();
      }
    };

    window.addEventListener('popstate', handlePopState);

    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
      window.removeEventListener('popstate', handlePopState);
    };
  }, []);



  const handleCapture = (dataUrl, stayInCamera = false, autoCropData = null) => {
    const newPhoto = {
      id: Date.now().toString(),
      src: dataUrl,
      filter: 'none',
      text: '',
      brightness: 100,
      fontSize: 14,
      crop: null,
      autoCrop: autoCropData, // 🚀 Store detection data
      tilt: autoCropData ? Math.round(autoCropData.tilt) : 0, // Set initial rotation correction
      timestamp: new Date().toISOString()
    };
    setPhotos(prev => [...prev, newPhoto]);
    if (!stayInCamera) setView('gallery');
  };

  const handleUpload = (files) => {
    const newPhotos = Array.from(files).map((file, index) => {
      return new Promise((resolve) => {
        const reader = new FileReader();
        reader.onload = (e) => {
          resolve({
            id: (Date.now() + index).toString(),
            src: e.target.result,
            filter: 'none',
            text: '',
            brightness: 100,
            fontSize: 14,
            crop: null,
            timestamp: new Date().toISOString()
          });
        };
        reader.readAsDataURL(file);
      });
    });

    Promise.all(newPhotos).then(processedPhotos => {
      setPhotos(prev => [...prev, ...processedPhotos]);
      setView('gallery');
    });
  };

  const handleEdit = (photo) => {
    setEditingPhoto(photo);
    setView('editor');
  };

  const handleSaveEdit = (updatedPhoto, applyToAll = false, stayOpen = false) => {
    if (applyToAll) {
      setPhotos(prev => prev.map(p => ({
        ...p,
        filter: updatedPhoto.filter,
        // Only update the actual edited photo with full changes, 
        // others only get the filter copied
        ...(p.id === updatedPhoto.id ? updatedPhoto : {})
      })));
    } else {
      setPhotos(prev => prev.map(p => p.id === updatedPhoto.id ? updatedPhoto : p));
    }
    
    if (!stayOpen) {
      setView('gallery');
      setEditingPhoto(null);
    }
  };

  const handleDeletePhoto = (id) => {
    setPhotos(prev => prev.filter(p => p.id !== id));
    setView('gallery');
    setEditingPhoto(null);
  };

  const handleDeleteScan = (id) => {
    setScans(prev => prev.filter(s => s.id !== id));
  };

  const handleOpenScan = (scan) => {
    if (photos.length > 0) {
      if (!window.confirm("Open this scan? Your current unsaved photos will be cleared.")) return;
    }
    
    if (scan.photos && Array.isArray(scan.photos)) {
      setPhotos([...scan.photos]);
    } else if (scan.thumbnail) {
      // Fallback for legacy scans saved before full trace persistence
      setPhotos([{
        id: scan.id || Date.now().toString(),
        src: scan.thumbnail,
        filter: 'none',
        brightness: 100,
        fontSize: 14,
        timestamp: new Date().toISOString()
      }]);
    }
    setView('gallery');
  };

  const handleGeneratePDF = async (options = {}) => {
    if (photos.length === 0) return;
    
    setIsGenerating(true);
    try {
      await generatePDF(photos, options);
      
      // Save to History (Including full photo data for reopening)
      const newScan = {
        id: Date.now().toString(),
        name: options.filename || `Scan_${new Date().toLocaleDateString()}`,
        date: new Date().toLocaleString(),
        count: photos.length,
        thumbnail: photos[0].src,
        photos: [...photos] // Deep copy photos
      };
      setScans(prev => [newScan, ...prev]);
      
      // Clear current photos for a fresh start
      setPhotos([]); 
    } catch (err) {
      console.error("PDF generation failed:", err);
      alert("Failed to generate PDF. Please try again.");
    } finally {
      setIsGenerating(false);
    }
  };

  const handleHome = (force = false) => {
    if (force) {
      setPhotos([]);
      setView('gallery');
      return;
    }

    if (photos.length > 0) {
      // Legacy fallback (should be handled by UI custom modal now)
      setPhotos([]);
      setView('gallery');
    } else {
      setView('gallery');
    }
  };

  return (
    <div className="flex flex-col min-h-screen bg-slate-950 font-outfit">
      <AnimatePresence mode="wait">
        {view === 'gallery' && (
          <PhotoGallery
            key="gallery"
            photos={photos}
            scans={scans}
            setPhotos={setPhotos}
            onAddMore={() => setView('camera')}
            onEdit={handleEdit}
            onHome={handleHome}
            onDeleteScan={handleDeleteScan}
            onOpenScan={handleOpenScan}
            onGenerate={handleGeneratePDF}
            onUpload={handleUpload}
            autoOpenExport={autoOpenExport}
            onExportOpened={() => setAutoOpenExport(false)}
          />
        )}

        {view === 'camera' && (
          <CameraView
            key="camera"
            onCapture={handleCapture}
            onCancel={() => setView('gallery')}
            onSaveAndExport={() => {
                setView('gallery');
                setAutoOpenExport(true);
            }}
          />
        )}

        {view === 'editor' && editingPhoto && (
          <ImageEditor
            key="editor"
            photo={editingPhoto}
            onSave={handleSaveEdit}
            onCancel={() => setView('gallery')}
            onRemove={handleDeletePhoto}
          />
        )}
      </AnimatePresence>

      {/* Generation Overlay */}
      <AnimatePresence>
        {isGenerating && (
          <div className="fixed inset-0 z-[100] flex flex-col items-center justify-center bg-black/80 backdrop-blur-md">
            <div className="w-16 h-16 border-4 border-t-indigo-500 border-indigo-500/20 rounded-full animate-spin mb-6" />
            <h3 className="text-xl font-bold text-white mb-2">Generating PDF...</h3>
            <p className="text-slate-400">Applying filters and optimizing layout</p>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default App;
