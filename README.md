# 📸 Photos to PDF: Professional Mobile Scanner

[![React](https://img.shields.io/badge/React-20232A?style=for-the-badge&logo=react&logoColor=61DAFB)](https://reactjs.org/)
[![Vite](https://img.shields.io/badge/Vite-646CFF?style=for-the-badge&logo=vite&logoColor=white)](https://vitejs.dev/)
[![Framer Motion](https://img.shields.io/badge/Framer_Motion-0055FF?style=for-the-badge&logo=framer&logoColor=white)](https://www.framer.com/motion/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-38B2AC?style=for-the-badge&logo=tailwind-css&logoColor=white)](https://tailwindcss.com/)

A state-of-the-art, high-fidelity mobile scanner application built for precision, speed, and a premium native-app experience. Convert physical documents into professional-grade PDFs with surgical accuracy.

---

## ✨ Key Features

### 🎯 Smart Auto-Crop & Detection
*   **36-Ray Quadrant Snap**: Advanced detection engine that segments 36 radial boundary points into four geometric quadrants for guaranteed 4-point frame stability.
*   **Perspective Correction**: Automatically identifies corners and morphs the detection outline to match document perspective in real-time.
*   **High-Speed Tracking**: Powered by EMA smoothing for a "magnetic" lock-on feel that eliminates jitter.

### 🎨 Professional Image Correction Suite
*   **Geometric Precision**: Integrated 90-degree snap rotation and fine-tune tilt slider (-45° to +45°).
*   **Visual Enhancements**: Professional-grade brightness control and high-fidelity filters (Grayscale, Sepia, Enhanced).
*   **Smart Annotations**: Add custom text labels and manual drawings with a native-feeling brush tool.

### 🚀 High-Fidelity UX & Workflow
*   **Native Ergonomics**: Symmetric, one-handed UI with centered shutter and interactive status indicators.
*   **Scan History & Hub**: Local archive management with professional delete confirmation modals and "View All" functionality.
*   **Batch Processing**: Fluidly scan multiple pages, rearrange them, and configure export options (A4, Letter, Portrait/Landscape).

---

## 🛠️ Tech Stack

- **Frontend**: React 18, Vite
- **Styling**: Vanilla CSS + Tailwind Utility Layer
- **Animations**: Framer Motion
- **Icons**: Lucide React
- **PDF Generation**: jsPDF
- **Image Processing**: High-frequency Canvas2D readbacks (`willReadFrequently: true`)

---

## 📦 Installation & Setup

1. **Clone the repository**:
   ```bash
   git clone [repository-url]
   ```

2. **Install dependencies**:
   ```bash
   npm install
   ```

3. **Run the development server**:
   ```bash
   npm run dev -- --host
   ```

---

## 🛡️ Privacy & Performance
- **Zero Cloud Storage**: All processing happens locally. Your documents never leave your device.
- **Offline First**: Fully functional without an internet connection.
- **Optimized for Mobile**: Low-latency detection loops and optimized memory management for high-res images.

---

Developed with ❤️ for professional document digitizing.
