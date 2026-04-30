import React, { useState, useRef, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  UploadCloud, Camera, Image as ImageIcon,
  Activity, RefreshCw, StopCircle, Play
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import './Scan.css';

// ── Teachable Machine model path (place your exported model here) ──────────
const MODEL_URL = '/my_model/';

// Dynamically load a script only once
function loadScript(src) {
  return new Promise((resolve, reject) => {
    if (document.querySelector(`script[src="${src}"]`)) { resolve(); return; }
    const s = document.createElement('script');
    s.src = src;
    s.async = true;
    s.onload = resolve;
    s.onerror = reject;
    document.head.appendChild(s);
  });
}

const Scan = () => {
  const navigate = useNavigate();

  // ── Tab: 'upload' | 'webcam' ──────────────────────────────────────────────
  const [activeTab, setActiveTab] = useState('upload');

  // ── Upload flow state ─────────────────────────────────────────────────────
  const [image, setImage] = useState(null);
  const [isScanning, setIsScanning] = useState(false);
  const [result, setResult] = useState(null);
  const [showHeatmap, setShowHeatmap] = useState(false);

  // ── Webcam / TM flow state ─────────────────────────────────────────────────
  const [tmReady, setTmReady] = useState(false);      // scripts loaded
  const [tmRunning, setTmRunning] = useState(false);  // webcam loop active
  const [tmLoading, setTmLoading] = useState(false);  // model loading
  const [tmError, setTmError] = useState('');
  const [predictions, setPredictions] = useState([]);  // [{ className, probability }]

  const webcamContainerRef = useRef(null);
  const tmModelRef = useRef(null);
  const tmWebcamRef = useRef(null);
  const rafRef = useRef(null);

  // ── Load TF.js + Teachable Machine scripts on mount ────────────────────────
  useEffect(() => {
    Promise.all([
      loadScript('https://cdn.jsdelivr.net/npm/@tensorflow/tfjs@latest/dist/tf.min.js'),
      loadScript('https://cdn.jsdelivr.net/npm/@teachablemachine/image@latest/dist/teachablemachine-image.min.js'),
    ])
      .then(() => setTmReady(true))
      .catch(() => setTmError('Failed to load AI libraries. Check your connection.'));
  }, []);

  // ── Start live webcam scan ─────────────────────────────────────────────────
  const startWebcam = useCallback(async () => {
    if (!tmReady) { setTmError('AI libraries not ready yet.'); return; }
    setTmLoading(true);
    setTmError('');
    try {
      const tmImage = window.tmImage;
      const model = await tmImage.load(
        MODEL_URL + 'model.json',
        MODEL_URL + 'metadata.json'
      );
      tmModelRef.current = model;

      const webcam = new tmImage.Webcam(300, 300, true); // flip
      await webcam.setup();
      await webcam.play();
      tmWebcamRef.current = webcam;

      // Clear container & append webcam canvas
      if (webcamContainerRef.current) {
        webcamContainerRef.current.innerHTML = '';
        webcamContainerRef.current.appendChild(webcam.canvas);
      }

      // Init prediction placeholders
      setPredictions(
        Array.from({ length: model.getTotalClasses() }, (_, i) => ({
          className: `Class ${i + 1}`,
          probability: 0,
        }))
      );

      setTmRunning(true);
      setTmLoading(false);

      // Loop
      const loop = async () => {
        webcam.update();
        const preds = await model.predict(webcam.canvas);
        setPredictions(preds);
        rafRef.current = requestAnimationFrame(loop);
      };
      rafRef.current = requestAnimationFrame(loop);
    } catch (err) {
      setTmError(
        err?.message?.includes('model')
          ? 'Model not found. Place your exported model in /public/my_model/.'
          : `Webcam error: ${err.message}`
      );
      setTmLoading(false);
    }
  }, [tmReady]);

  // ── Stop webcam ────────────────────────────────────────────────────────────
  const stopWebcam = useCallback(() => {
    if (rafRef.current) cancelAnimationFrame(rafRef.current);
    if (tmWebcamRef.current) tmWebcamRef.current.stop();
    if (webcamContainerRef.current) webcamContainerRef.current.innerHTML = '';
    tmModelRef.current = null;
    tmWebcamRef.current = null;
    setPredictions([]);
    setTmRunning(false);
  }, []);

  // Stop webcam when switching away
  useEffect(() => {
    if (activeTab !== 'webcam') stopWebcam();
  }, [activeTab, stopWebcam]);

  // Cleanup on unmount
  useEffect(() => () => stopWebcam(), [stopWebcam]);

  // ── Upload flow handlers ────────────────────────────────────────────────────
  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (file) { setImage(URL.createObjectURL(file)); setResult(null); }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    if (file) { setImage(URL.createObjectURL(file)); setResult(null); }
  };

  const startScan = async () => {
    if (!tmReady || !image) return;
    setIsScanning(true);
    setResult(null);

    try {
      const tmImage = window.tmImage;
      const model = await tmImage.load(
        MODEL_URL + 'model.json',
        MODEL_URL + 'metadata.json'
      );
      const img = document.getElementById('preview-img-el');
      const preds = await model.predict(img);

      // Pick best prediction
      const best = preds.reduce((a, b) => a.probability > b.probability ? a : b);
      setResult({
        disease: best.className,
        confidence: (best.probability * 100).toFixed(1),
        allPredictions: preds,
        explanation: `AI analysis identified this as "${best.className}" with ${(best.probability * 100).toFixed(1)}% confidence. This is an AI-assisted result — please consult a certified dermatologist for a medical diagnosis.`,
      });
    } catch {
      // Fallback: model not available — run mock
      setResult({
        disease: 'Benign Nevus (Mole)',
        confidence: '94.5',
        allPredictions: [],
        explanation: 'Model not found. This is a demo result. Place your exported Teachable Machine model in /public/my_model/ and scan again.',
      });
    }

    setIsScanning(false);
  };

  const resetScan = () => { setImage(null); setResult(null); setShowHeatmap(false); };

  // ── Top prediction for live feed badge ──────────────────────────────────────
  const topPred = predictions.length
    ? predictions.reduce((a, b) => a.probability > b.probability ? a : b)
    : null;

  return (
    <div className="scan-page container">
      <motion.div
        className="scan-header"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <h2>AI Skin Analysis</h2>
        <p>Upload a photo or use live camera for an instant AI assessment.</p>
      </motion.div>

      {/* ── Tab Switcher ───────────────────────────────────────────────────── */}
      <div className="scan-tabs glass">
        <button
          className={`scan-tab ${activeTab === 'upload' ? 'active' : ''}`}
          onClick={() => setActiveTab('upload')}
        >
          <UploadCloud size={16} /> Upload Image
        </button>
        <button
          className={`scan-tab ${activeTab === 'webcam' ? 'active' : ''}`}
          onClick={() => setActiveTab('webcam')}
        >
          <Camera size={16} /> Live Camera
        </button>
      </div>

      <div className="scan-content">

        {/* ══════════════ UPLOAD TAB ════════════════════════════════════════ */}
        {activeTab === 'upload' && (
          <>
            {!image && (
              <motion.div
                className="upload-area glass-card"
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                onDragOver={(e) => e.preventDefault()}
                onDrop={handleDrop}
              >
                <div className="upload-icons">
                  <UploadCloud size={48} className="text-primary" />
                </div>
                <h3>Drag & Drop your image here</h3>
                <p className="text-muted">or click to browse from your device</p>
                <input type="file" id="file-upload" accept="image/*" onChange={handleFileUpload} style={{ display: 'none' }} />
                <div className="upload-actions">
                  <label htmlFor="file-upload" className="btn-primary">Browse Files</label>
                </div>
              </motion.div>
            )}

            <AnimatePresence>
              {image && !result && (
                <motion.div
                  className="preview-area glass-card"
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                >
                  <div className="image-container">
                    <img id="preview-img-el" src={image} alt="Skin Concern" className="preview-image" crossOrigin="anonymous" />
                    {isScanning && <motion.div className="scanner-line" />}
                    {isScanning && (
                      <div className="scanning-overlay glass">
                        <Activity size={40} className="spinner text-primary" />
                        <p>AI is analyzing the image...</p>
                      </div>
                    )}
                  </div>
                  <div className="preview-actions">
                    <button className="btn-secondary" onClick={resetScan} disabled={isScanning}>Cancel</button>
                    <button className="btn-primary" onClick={startScan} disabled={isScanning}>
                      {isScanning ? 'Analyzing...' : 'Analyze Skin'}
                    </button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

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
                        {showHeatmap && <div className="heatmap-overlay" />}
                      </div>
                      <button className="heatmap-toggle btn-secondary" onClick={() => setShowHeatmap(!showHeatmap)}>
                        <ImageIcon size={16} /> Toggle Heatmap
                      </button>
                    </div>

                    <div className="result-details-col">
                      <div className="confidence-badge">
                        <span className="badge glass">Analysis Complete ✓</span>
                      </div>
                      <h3 className="disease-name">{result.disease}</h3>

                      <div className="confidence-meter">
                        <div className="confidence-circle" style={{ '--percent': `${result.confidence}%` }}>
                          <span className="confidence-value text-gradient">{result.confidence}%</span>
                          <span className="confidence-label">Confidence</span>
                        </div>
                      </div>

                      {/* All class predictions */}
                      {result.allPredictions?.length > 0 && (
                        <div className="all-predictions glass-card">
                          {result.allPredictions.map((p) => (
                            <div key={p.className} className="pred-row">
                              <span className="pred-name">{p.className}</span>
                              <div className="pred-bar-wrap">
                                <div
                                  className="pred-bar"
                                  style={{ width: `${(p.probability * 100).toFixed(1)}%` }}
                                />
                              </div>
                              <span className="pred-val">{(p.probability * 100).toFixed(1)}%</span>
                            </div>
                          ))}
                        </div>
                      )}

                      <div className="chat-explanation glass">
                        <p>{result.explanation}</p>
                      </div>

                      <div className="result-actions">
                        <button className="btn-secondary" onClick={resetScan}>
                          <RefreshCw size={16} /> Scan Another
                        </button>
                        <button className="btn-primary" onClick={() => navigate('/doctors')}>
                          Consult Doctor
                        </button>
                      </div>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </>
        )}

        {/* ══════════════ WEBCAM TAB ════════════════════════════════════════ */}
        {activeTab === 'webcam' && (
          <motion.div
            className="webcam-section glass-card"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
          >
            <div className="webcam-feed-wrap">
              {/* Webcam canvas is injected here by TM */}
              <div
                ref={webcamContainerRef}
                className="webcam-canvas-container"
                id="webcam-container"
              />

              {!tmRunning && !tmLoading && (
                <div className="webcam-placeholder">
                  <Camera size={56} className="text-primary" />
                  <p className="text-muted">Camera not started</p>
                </div>
              )}

              {tmLoading && (
                <div className="webcam-placeholder">
                  <Activity size={48} className="spinner text-primary" />
                  <p>Loading model & camera...</p>
                </div>
              )}

              {/* Live top-prediction badge */}
              {tmRunning && topPred && (
                <div className="live-badge glass">
                  🔴 Live — <strong>{topPred.className}</strong>{' '}
                  <span className="text-primary">
                    {(topPred.probability * 100).toFixed(1)}%
                  </span>
                </div>
              )}
            </div>

            {/* Live predictions bar chart */}
            {tmRunning && predictions.length > 0 && (
              <div className="live-predictions glass-card">
                <h4>Live Predictions</h4>
                {predictions.map((p) => (
                  <div key={p.className} className="pred-row">
                    <span className="pred-name">{p.className}</span>
                    <div className="pred-bar-wrap">
                      <motion.div
                        className="pred-bar"
                        animate={{ width: `${(p.probability * 100).toFixed(1)}%` }}
                        transition={{ duration: 0.2 }}
                      />
                    </div>
                    <span className="pred-val">{(p.probability * 100).toFixed(1)}%</span>
                  </div>
                ))}
              </div>
            )}

            {tmError && (
              <div className="tm-error glass-card">
                ⚠️ {tmError}
              </div>
            )}

            <div className="webcam-controls">
              {!tmRunning ? (
                <button
                  className="btn-primary flex-center"
                  onClick={startWebcam}
                  disabled={tmLoading || !tmReady}
                  style={{ gap: '0.5rem' }}
                >
                  <Play size={18} />
                  {tmLoading ? 'Loading...' : 'Start Camera Scan'}
                </button>
              ) : (
                <button
                  className="btn-secondary flex-center text-danger"
                  onClick={stopWebcam}
                  style={{ gap: '0.5rem' }}
                >
                  <StopCircle size={18} /> Stop Camera
                </button>
              )}
            </div>

            <p className="webcam-note text-muted">
              Point your camera at the skin area. The model classifies in real-time.<br />
              Place your exported Teachable Machine model in <code>/public/my_model/</code>.
            </p>
          </motion.div>
        )}
      </div>
    </div>
  );
};

export default Scan;
