import { jsPDF } from 'jspdf';
import imageCompression from 'browser-image-compression';

/**
 * Filter an image using Canvas
 */
const applyFilter = async (imgSrc, filter, quality = 0.9) => {
  if (!filter || filter === 'none') return imgSrc;

  return new Promise((resolve) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.src = imgSrc;
    img.onload = () => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      canvas.width = img.width;
      canvas.height = img.height;

      ctx.filter = getCSSFilter(filter);
      ctx.drawImage(img, 0, 0);
      resolve(canvas.toDataURL('image/jpeg', quality));
    };
  });
};

const getCSSFilter = (filter) => {
  switch (filter) {
    case 'grayscale': return 'grayscale(100%)';
    case 'sepia': return 'sepia(100%)';
    case 'negative': return 'invert(100%)';
    case 'darken': return 'brightness(0.7) contrast(1.1)';
    case 'vivid': return 'contrast(1.2) saturate(1.3)';
    default: return 'none';
  }
};

/**
 * Convert Hex/RGBA to RGB Array for jsPDF
 */
const hexToRgb = (hex) => {
  if (hex.startsWith('rgba')) {
    const parts = hex.match(/\d+/g);
    return parts ? [parseInt(parts[0]), parseInt(parts[1]), parseInt(parts[2])] : [0, 0, 0];
  }
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result ? [
    parseInt(result[1], 16),
    parseInt(result[2], 16),
    parseInt(result[3], 16)
  ] : [0, 0, 0];
};

/**
 * Physically crop the image using Canvas (Pixel bounds)
 */
export const cropImage = async (imgSrc, crop, quality = 0.95) => {
  if (!crop) return imgSrc;

  return new Promise((resolve) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.src = imgSrc;
    img.onload = () => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      
      // crop contains { x, y, width, height } in pixels
      canvas.width = crop.width;
      canvas.height = crop.height;
      
      ctx.drawImage(
        img,
        crop.x, crop.y, crop.width, crop.height, // Source
        0, 0, crop.width, crop.height         // Destination
      );
      resolve(canvas.toDataURL('image/jpeg', quality));
    };
  });
};

/**
 * Physically compress and downscale the image for PDF optimization
 */
const compressDataUrl = async (imgSrc, quality = 0.8) => {
    return new Promise((resolve) => {
        const img = new Image();
        img.crossOrigin = "anonymous";
        img.onload = () => {
            let w = img.width;
            let h = img.height;
            const maxDim = 1500; // Optimal max dimension for standard PDF viewing
            if (w > maxDim || h > maxDim) {
                const ratio = Math.min(maxDim / w, maxDim / h);
                w = Math.floor(w * ratio);
                h = Math.floor(h * ratio);
            }
            
            const canvas = document.createElement('canvas');
            canvas.width = w;
            canvas.height = h;
            const ctx = canvas.getContext('2d');
            ctx.drawImage(img, 0, 0, w, h);
            resolve(canvas.toDataURL('image/jpeg', quality));
        };
        img.src = imgSrc;
    });
};

/**
 * Generate PDF from array of photo objects
 */
/**
 * Physically crop the image using Canvas (Percentage bounds)
 */
export const cropImageByPercent = async (imgSrc, percentCrop, quality = 0.95) => {
  if (!percentCrop) return imgSrc;

  return new Promise((resolve) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.src = imgSrc;
    img.onload = () => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      // Calculate pixels natively from intrinsic size!
      const x = (percentCrop.x / 100) * img.width;
      const y = (percentCrop.y / 100) * img.height;
      const w = (percentCrop.width / 100) * img.width;
      const h = (percentCrop.height / 100) * img.height;
      
      canvas.width = w || 1; // Fallbacks
      canvas.height = h || 1;
      
      ctx.drawImage(img, x, y, w, h, 0, 0, w, h);
      resolve(canvas.toDataURL('image/jpeg', quality));
    };
  });
};

export const generatePDF = async (photos, options = {}) => {
  const {
    filename = `Scan_${new Date().toISOString().split('T')[0]}.pdf`,
    quality = 'high',
    orientation = 'p',
    numPos = 'bottom-center',
    pageSize = 'a4',
    globalFilter = 'none',
    showPageNumbers = true,
    margin = 10,
    fillSpace = false,
    isCompressed = false,
    compressionLevel = 80
  } = options;

  const pdfQuality = isCompressed ? compressionLevel / 100 : 1.0;

  // Initialize with a dummy size if free, we will set it per page
  const initialSize = pageSize === 'free' ? 'a4' : pageSize;
  const pdf = new jsPDF('p', 'mm', initialSize);

  for (let i = 0; i < photos.length; i++) {
    const photo = photos[i];
    
    // 1. Process Image (Crop, Filter, Brightness)
    let processedSrc = photo.src;
    if (photo.croppedAreaPercentages) {
      processedSrc = await cropImageByPercent(processedSrc, photo.croppedAreaPercentages, pdfQuality);
    } else if (photo.croppedArea) {
      processedSrc = await cropImage(processedSrc, photo.croppedArea, pdfQuality);
    }

    const activeFilter = photo.filter !== 'none' ? photo.filter : globalFilter;
    processedSrc = await applyFilter(processedSrc, activeFilter, pdfQuality);

    const totalRot = (photo.rotation || 0) + (photo.tilt || 0);
    const hasBrightness = photo.brightness && photo.brightness !== 100;
    
    if (hasBrightness || totalRot !== 0) {
      processedSrc = await new Promise((resolve) => {
        const img = new Image();
        img.crossOrigin = "anonymous";
        img.src = processedSrc;
        img.onload = () => {
          const rotRad = totalRot * Math.PI / 180;
          const w = img.width;
          const h = img.height;
          
          let newW = w;
          let newH = h;
          
          if (totalRot !== 0) {
             const cos = Math.abs(Math.cos(rotRad));
             const sin = Math.abs(Math.sin(rotRad));
             newW = w * cos + h * sin;
             newH = w * sin + h * cos;
          }
          
          const canvas = document.createElement('canvas');
          // Fill background with white to avoid black corners when rotated
          canvas.width = newW;
          canvas.height = newH;
          const ctx = canvas.getContext('2d');
          ctx.fillStyle = '#ffffff';
          ctx.fillRect(0, 0, newW, newH);
          
          if (hasBrightness) {
              ctx.filter = `brightness(${photo.brightness}%)`;
          }
          
          if (totalRot !== 0) {
              ctx.translate(newW / 2, newH / 2);
              ctx.rotate(rotRad);
              ctx.drawImage(img, -w / 2, -h / 2);
          } else {
              ctx.drawImage(img, 0, 0);
          }
          
          resolve(canvas.toDataURL('image/jpeg', pdfQuality));
        };
      });
    }

    if (isCompressed) {
        processedSrc = await compressDataUrl(processedSrc, pdfQuality);
    }

    // 2. Get Initial Image Properties for Page Sizing
    let imgProps = pdf.getImageProperties(processedSrc);
    let imgRatio = imgProps.width / imgProps.height;

    // 3. Handle Page Creation
    let currentOrientation = orientation;
    if (orientation === 'auto') {
        currentOrientation = imgRatio > 1 ? 'landscape' : 'portrait';
    }
    const jsPdfOri = currentOrientation === 'portrait' ? 'p' : 'l';

    let pWidth, pHeight;
    if (pageSize === 'free') {
      // In free mode, the image defines the size. Let's make the image width ~210mm.
      const baseImgW = 210;
      const baseImgH = baseImgW / imgRatio;
      pWidth = baseImgW + (margin * 2);
      pHeight = baseImgH + (margin * 2);
      
      if (i === 0) {
        pdf.deletePage(1);
        pdf.addPage([pWidth, pHeight], jsPdfOri);
      } else {
        pdf.addPage([pWidth, pHeight], jsPdfOri);
      }
    } else {
      if (i === 0) {
         pdf.deletePage(1);
         pdf.addPage(jsPdfOri, 'mm', pageSize);
      } else {
         pdf.addPage(jsPdfOri, 'mm', pageSize);
      }
    }

    const pageWidth = pdf.internal.pageSize.getWidth();
    const pageHeight = pdf.internal.pageSize.getHeight();

    // 4. Handle Fill Space (object-fit: cover physical crop)
    const targetWidth = pageWidth - (margin * 2);
    const targetHeight = pageHeight - (margin * 2);
    const targetRatio = targetWidth / targetHeight;

    if (fillSpace) {
      let cropX = 0, cropY = 0, cropW = 100, cropH = 100;
      
      // Allow a small epsilon for floating point inaccuracies
      if (Math.abs(imgRatio - targetRatio) > 0.01) {
          if (imgRatio > targetRatio) {
            // Image is wider than target
            cropW = (targetRatio / imgRatio) * 100;
            cropX = (100 - cropW) / 2;
          } else {
            // Image is taller than target
            cropH = (imgRatio / targetRatio) * 100;
            cropY = (100 - cropH) / 2;
          }
          
          processedSrc = await cropImageByPercent(processedSrc, { x: cropX, y: cropY, width: cropW, height: cropH }, pdfQuality);
          // Update properties after crop
          imgProps = pdf.getImageProperties(processedSrc);
          imgRatio = imgProps.width / imgProps.height;
      }
    }

    // 5. Calculate Final Image Dimensions
    let finalWidth = targetWidth;
    let finalHeight = targetHeight;
    
    if (!fillSpace) {
      if (imgRatio > targetRatio) {
        finalHeight = finalWidth / imgRatio;
      } else {
        finalWidth = finalHeight * imgRatio;
      }
    }

    const x = margin + (targetWidth - finalWidth) / 2;
    const y = margin + (targetHeight - finalHeight) / 2;
    pdf.addImage(processedSrc, 'JPEG', x, y, finalWidth, finalHeight);


    // 6. Add Draggable Text with Custom Colors & Font Size
    const labelsToRender = [...(photo.labels || [])];
    if (photo.text) {
      labelsToRender.push({
        text: photo.text,
        textColor: photo.textColor,
        textBg: photo.textBg,
        textPos: photo.textPos,
        fontSize: photo.fontSize
      });
    }

    labelsToRender.forEach(label => {
      if (!label.text) return;
      
      const rgbText = hexToRgb(label.textColor || '#ffffff');
      const rgbBg = hexToRgb(label.textBg || 'rgba(0,0,0,0.5)');
      
      // Determine alpha if available
      let alpha = 0.6;
      if (label.textBg && label.textBg.includes('rgba')) {
        const parts = label.textBg.match(/[\d.]+/g);
        if (parts && parts[4]) alpha = parseFloat(parts[4]);
      }
      
      const textX = x + (label.textPos?.x / 100) * finalWidth;
      const textY = y + (label.textPos?.y / 100) * finalHeight;

      const fSize = label.fontSize || 14;
      pdf.setFontSize(fSize);
      const textWidth = pdf.getTextWidth(label.text);
      
      // --- BACKGROUND RENDER (with Transparency support) ---
      pdf.saveGraphicsState();
      // Set transparency using GState if available, otherwise just use RGB
      if (typeof pdf.setGState === 'function') {
        const gs = { opacity: alpha, 'fill-opacity': alpha };
        pdf.setGState(new pdf.GState(gs));
      }
      
      pdf.setFillColor(rgbBg[0], rgbBg[1], rgbBg[2]);
      
      const ptToMm = 0.352778; 
      const fontSizeMm = fSize * ptToMm;
      const paddingYMm = fontSizeMm * 0.7;
      const paddingXMm = fontSizeMm * 1.4;
      
      const boxWidthMm = textWidth + (paddingXMm * 2);
      const boxHeightMm = fontSizeMm + (paddingYMm * 2);

      const boxTopY = textY - fontSizeMm - paddingYMm + (fontSizeMm * 0.15); 
      const boxLeftX = textX - paddingXMm;

      pdf.roundedRect(boxLeftX, boxTopY, boxWidthMm, boxHeightMm, 2.5, 2.5, 'F');
      pdf.restoreGraphicsState();
      
      // --- TEXT RENDER ---
      pdf.setTextColor(rgbText[0], rgbText[1], rgbText[2]);
      pdf.text(label.text, textX, textY, { align: 'left' });
    });

    // 6.5 Add Freehand Drawing Annotations
    if (photo.paths && photo.paths.length > 0) {
       photo.paths.forEach(path => {
          if (!path.points || path.points.length < 2) return;
          const rgbStroke = hexToRgb(path.color || '#f43f5e');
          pdf.setDrawColor(rgbStroke[0], rgbStroke[1], rgbStroke[2]);
          // Approximate scaling for line width
          pdf.setLineWidth(1.5);
          
          for (let p = 0; p < path.points.length - 1; p++) {
             const pt1 = path.points[p];
             const pt2 = path.points[p + 1];
             const x1 = x + (pt1.x / 100) * finalWidth;
             const y1 = y + (pt1.y / 100) * finalHeight;
             const x2 = x + (pt2.x / 100) * finalWidth;
             const y2 = y + (pt2.y / 100) * finalHeight;
             
             pdf.line(x1, y1, x2, y2);
          }
       });
    }

    // 7. Add Page Number at Custom Positions
    if (showPageNumbers && numPos !== 'none') {
        pdf.setFontSize(10);
        pdf.setTextColor(150, 150, 150);
        
        let nx, ny;
        switch (numPos) {
          case 'bottom-right': nx = pageWidth - 15; ny = pageHeight - 10; break;
          case 'top-right': nx = pageWidth - 15; ny = 15; break;
          case 'bottom-center': nx = pageWidth / 2; ny = pageHeight - 10; break;
          case 'top-center': nx = pageWidth / 2; ny = 15; break;
          default: nx = pageWidth / 2; ny = pageHeight - 10;
        }
        
        pdf.text(`Page ${i + 1} of ${photos.length}`, nx, ny, { 
            align: (numPos.includes('center') ? 'center' : 'right') 
        });
    }
  }

  const finalFilename = filename.toLowerCase().endsWith('.pdf') ? filename : `${filename}.pdf`;
  pdf.save(finalFilename);
};
