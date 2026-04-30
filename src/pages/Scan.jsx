import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { UploadCloud, Camera, Image as ImageIcon, Activity, RefreshCw } from 'lucide-react';
import './Scan.css';

const Scan = () => {
  const [image, setImage] = useState(null);
  const [isScanning, setIsScanning] = useState(false);
  const [result, setResult] = useState(null);
  const [showHeatmap, setShowHeatmap] = useState(false);

  // Mock Upload Handler
  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      const imageUrl = URL.createObjectURL(file);
      setImage(imageUrl);
      setResult(null); // Reset result on new image
    }
  };

  const handleDragOver = (e) => {
    e.preventDefault();
  };

  const handleDrop = (e) => {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    if (file) {
      const imageUrl = URL.createObjectURL(file);
      setImage(imageUrl);
      setResult(null);
    }
  };

  // Mock Scanning Process
  const startScan = () => {
    setIsScanning(true);
    setTimeout(() => {
      setIsScanning(false);
      setResult({
        disease: 'Benign Nevus (Mole)',
        confidence: 94.5,
        explanation: 'Based on our AI analysis, this appears to be a common benign mole. It has regular borders, uniform color, and is symmetrical. However, if you notice any changes in size, shape, or color, please consult a dermatologist.'
      });
    }, 3000);
  };

  const resetScan = () => {
    setImage(null);
    setResult(null);
    setShowHeatmap(false);
  };

  return (
    <div className="scan-page container">
      <motion.div 
        className="scan-header"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <h2>AI Skin Analysis</h2>
        <p>Upload a clear photo of your skin concern for an instant AI assessment.</p>
      </motion.div>

      <div className="scan-content">
        {/* Upload Area */}
        {!image && (
          <motion.div 
            className="upload-area glass-card"
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            onDragOver={handleDragOver}
            onDrop={handleDrop}
          >
            <div className="upload-icons">
              <UploadCloud size={48} className="text-primary" />
            </div>
            <h3>Drag & Drop your image here</h3>
            <p className="text-muted">or click to browse from your device</p>
            
            <input 
              type="file" 
              id="file-upload" 
              accept="image/*" 
              onChange={handleFileUpload} 
              style={{ display: 'none' }} 
            />
            
            <div className="upload-actions">
              <label htmlFor="file-upload" className="btn-primary">
                Browse Files
              </label>
              <button className="btn-secondary flex-center">
                <Camera size={18} style={{ marginRight: '8px' }} /> Use Camera
              </button>
            </div>
          </motion.div>
        )}

        {/* Preview & Scanning Area */}
        <AnimatePresence>
          {image && !result && (
            <motion.div 
              className="preview-area glass-card"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
            >
              <div className="image-container">
                <img src={image} alt="Skin Concern" className="preview-image" />
                
                {isScanning && (
                  <motion.div className="scanner-line"></motion.div>
                )}
                {isScanning && (
                  <div className="scanning-overlay glass">
                    <Activity size={40} className="spinner text-primary" />
                    <p>AI is analyzing the image...</p>
                  </div>
                )}
              </div>
              
              <div className="preview-actions">
                <button className="btn-secondary" onClick={resetScan} disabled={isScanning}>
                  Cancel
                </button>
                <button className="btn-primary" onClick={startScan} disabled={isScanning}>
                  {isScanning ? 'Analyzing...' : 'Analyze Skin'}
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Results Area */}
        <AnimatePresence>
          {result && (
            <motion.div 
              className="results-area glass-card"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
            >
              <div className="results-grid">
                <div className="result-image-col">
                  <div className={`result-image-container ${showHeatmap ? 'heatmap-active' : ''}`}>
                    <img src={image} alt="Analyzed" className="result-image" />
                    {showHeatmap && <div className="heatmap-overlay"></div>}
                  </div>
                  <button 
                    className="heatmap-toggle btn-secondary" 
                    onClick={() => setShowHeatmap(!showHeatmap)}
                  >
                    <ImageIcon size={16} /> Toggle Heatmap
                  </button>
                </div>
                
                <div className="result-details-col">
                  <div className="confidence-badge">
                    <span className="badge glass">Analysis Complete</span>
                  </div>
                  <h3 className="disease-name">{result.disease}</h3>
                  
                  <div className="confidence-meter">
                    <div className="confidence-circle" style={{ '--percent': `${result.confidence}%` }}>
                      <span className="confidence-value text-gradient">{result.confidence}%</span>
                      <span className="confidence-label">Confidence</span>
                    </div>
                  </div>
                  
                  <div className="chat-explanation glass">
                    <p>{result.explanation}</p>
                  </div>
                  
                  <div className="result-actions">
                    <button className="btn-secondary" onClick={resetScan}>
                      <RefreshCw size={16} /> Scan Another
                    </button>
                    <button className="btn-primary">Consult Doctor</button>
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

export default Scan;
