import React, { useState, useRef, useEffect, useCallback } from 'react';
import * as tf from '@tensorflow/tfjs';
import Webcam from 'react-webcam';
import { motion, AnimatePresence } from 'framer-motion';
import {
  UploadCloud, Camera, Image as ImageIcon,
  Activity, RefreshCw, StopCircle, Play, AlertTriangle
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import './Scan.css';

// Model files served from /public root
const MODEL_JSON_URL = '/model.json';
const METADATA_URL = '/metadata.json';

const Scan = () => {
  const navigate = useNavigate();

  // ── Tab state ──────────────────────────────────────────────────────────────
  const [activeTab, setActiveTab] = useState('upload');

  // ── Model state ────────────────────────────────────────────────────────────
  const [modelReady, setModelReady] = useState(false);
  const [modelError, setModelError] = useState('');
  const tfModelRef = useRef(null);   // { model, labels }

  // ── Upload tab state ───────────────────────────────────────────────────────
  const [image, setImage] = useState(null);
  const [isScanning, setIsScanning] = useState(false);
  const [result, setResult] = useState(null);
  const [showHeatmap, setShowHeatmap] = useState(false);

  // ── Webcam tab state ───────────────────────────────────────────────────────
  const [camRunning, setCamRunning] = useState(false);
  const [camError, setCamError] = useState('');
  const [livePredictions, setLivePredictions] = useState([]);
  const webcamRef = useRef(null);
  const rafRef = useRef(null);

  // ═══════════════════════════════════════════════════════════════════════════
  //  LOAD MODEL (once on mount)
  // ═══════════════════════════════════════════════════════════════════════════
  useEffect(() => {
    const loadModel = async () => {
      try {
        const [loadedModel, metaRes] = await Promise.all([
          tf.loadLayersModel(MODEL_JSON_URL),
          fetch(METADATA_URL),
        ]);
        const meta = await metaRes.json();
        tfModelRef.current = { model: loadedModel, labels: meta.labels };
        setModelReady(true);
        console.log('✅ TF model loaded — classes:', meta.labels);
      } catch (err) {
        console.error('Model load error:', err);
        setModelError(`Failed to load model: ${err.message}`);
      }
    };
    loadModel();
  }, []);

  // ═══════════════════════════════════════════════════════════════════════════
  //  PREDICTION HELPER (shared by upload + webcam)
  // ═══════════════════════════════════════════════════════════════════════════
  const runPrediction = useCallback((inputElement) => {
    if (!tfModelRef.current) return null;
    const { model, labels } = tfModelRef.current;

    const tensor = tf.tidy(() =>
      tf.browser.fromPixels(inputElement)
        .resizeNearestNeighbor([224, 224])
        .toFloat()
        .div(255.0)
        .expandDims()
    );

    return model.predict(tensor).data().then((predictionData) => {
      tensor.dispose();
      return labels.map((className, i) => ({
        className,
        probability: predictionData[i],
      }));
    });
  }, []);

  // ═══════════════════════════════════════════════════════════════════════════
  //  UPLOAD TAB — handlers
  // ═══════════════════════════════════════════════════════════════════════════
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
    if (!image || !modelReady) return;
    setIsScanning(true);
    setResult(null);

    try {
      const imgEl = document.getElementById('preview-img-el');
      const allPredictions = await runPrediction(imgEl);
      if (!allPredictions) throw new Error('Model not loaded');

      const best = allPredictions.reduce((a, b) =>
        a.probability > b.probability ? a : b
      );

      setResult({
        disease: best.className,
        confidence: (best.probability * 100).toFixed(1),
        allPredictions,
        explanation: `AI analysis identified this as "${best.className}" with ${
          (best.probability * 100).toFixed(1)
        }% confidence. This is an AI-assisted result — please consult a certified dermatologist for a medical diagnosis.`,
      });
    } catch (err) {
      setResult({
        disease: 'Analysis Error',
        confidence: '0',
        allPredictions: [],
        explanation: `Scan failed: ${err.message}. Ensure model.json, metadata.json, and weights.bin are in /public.`,
      });
    }

    setIsScanning(false);
  };

  const resetScan = () => { setImage(null); setResult(null); setShowHeatmap(false); };

  // ═══════════════════════════════════════════════════════════════════════════
  //  WEBCAM TAB — real-time prediction loop
  // ═══════════════════════════════════════════════════════════════════════════
  const startCamera = useCallback(() => {
    if (!modelReady) { setCamError('Model not loaded yet. Please wait...'); return; }
    setCamError('');
    setCamRunning(true);
  }, [modelReady]);

  const stopCamera = useCallback(() => {
    if (rafRef.current) cancelAnimationFrame(rafRef.current);
    rafRef.current = null;
    setCamRunning(false);
    setLivePredictions([]);
  }, []);

  // Prediction loop — runs when camRunning is true
  useEffect(() => {
    if (!camRunning || !modelReady) return;

    let active = true;

    const loop = async () => {
      if (!active) return;

      const video = webcamRef.current?.video;
      if (video && video.readyState === 4) {
        try {
          const preds = await runPrediction(video);
          if (preds && active) setLivePredictions(preds);
        } catch (e) {
          console.warn('Prediction frame error:', e);
        }
      }

      if (active) rafRef.current = requestAnimationFrame(loop);
    };

    rafRef.current = requestAnimationFrame(loop);

    return () => {
      active = false;
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, [camRunning, modelReady, runPrediction]);

  // Stop camera when switching tabs
  useEffect(() => {
    if (activeTab !== 'webcam') stopCamera();
  }, [activeTab, stopCamera]);

  // Cleanup on unmount
  useEffect(() => () => stopCamera(), [stopCamera]);

  // Webcam error handler
  const handleCamError = useCallback((err) => {
    console.error('Webcam error:', err);
    setCamError(
      err?.name === 'NotAllowedError'
        ? 'Camera permission denied. Please allow camera access and try again.'
        : `Camera error: ${err?.message || 'Unknown error'}`
    );
    setCamRunning(false);
  }, []);

  // ── Top prediction for live badge ──────────────────────────────────────
  const topPred = livePredictions.length
    ? livePredictions.reduce((a, b) => a.probability > b.probability ? a : b)
    : null;

  // ═══════════════════════════════════════════════════════════════════════════
  //  RENDER
  // ═══════════════════════════════════════════════════════════════════════════
  return (
    <div className="scan-page container">
      <motion.div
        className="scan-header"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <h2>AI Skin Analysis</h2>
        <p>Upload a photo or use live camera for an instant AI assessment.</p>

        {/* Model loading status */}
        {!modelReady && !modelError && (
          <div className="model-status loading">
            <Activity size={16} className="spinner" /> Loading AI model...
          </div>
        )}
        {modelReady && (
          <div className="model-status ready">
            ✅ AI model ready — 6 skin conditions
          </div>
        )}
        {modelError && (
          <div className="model-status error">
            <AlertTriangle size={16} /> {modelError}
          </div>
        )}
      </motion.div>

      {/* ── Tab Switcher ─────────────────────────────────────────────────── */}
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

        {/* ══════════ UPLOAD TAB ═══════════════════════════════════════════ */}
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
                    <button className="btn-primary" onClick={startScan} disabled={isScanning || !modelReady}>
                      {isScanning ? 'Analyzing...' : modelReady ? 'Analyze Skin' : 'Loading model...'}
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

                      {result.allPredictions?.length > 0 && (
                        <div className="all-predictions glass-card">
                          {result.allPredictions.map((p) => (
                            <div key={p.className} className="pred-row">
                              <span className="pred-name">{p.className}</span>
                              <div className="pred-bar-wrap">
                                <div className="pred-bar" style={{ width: `${(p.probability * 100).toFixed(1)}%` }} />
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

        {/* ══════════ WEBCAM TAB ══════════════════════════════════════════ */}
        {activeTab === 'webcam' && (
          <motion.div
            className="webcam-section glass-card"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
          >
            <div className="webcam-feed-wrap">
              {camRunning ? (
                <Webcam
                  ref={webcamRef}
                  audio={false}
                  width={300}
                  height={300}
                  mirrored
                  screenshotFormat="image/jpeg"
                  videoConstraints={{ facingMode: 'user', width: 300, height: 300 }}
                  onUserMediaError={handleCamError}
                  style={{ borderRadius: 'var(--radius-md)', display: 'block' }}
                />
              ) : (
                <div className="webcam-placeholder">
                  <Camera size={56} className="text-primary" />
                  <p className="text-muted">Camera not started</p>
                </div>
              )}

              {/* Live top-prediction badge */}
              {camRunning && topPred && (
                <div className="live-badge glass">
                  🔴 Live — <strong>{topPred.className}</strong>{' '}
                  <span className="text-primary">
                    {(topPred.probability * 100).toFixed(1)}%
                  </span>
                </div>
              )}
            </div>

            {/* Live predictions bar chart */}
            {camRunning && livePredictions.length > 0 && (
              <div className="live-predictions glass-card">
                <h4>Live Predictions</h4>
                {livePredictions.map((p) => (
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

            {/* Errors */}
            {camError && (
              <div className="tm-error glass-card">
                <AlertTriangle size={16} /> {camError}
              </div>
            )}

            {/* Controls */}
            <div className="webcam-controls">
              {!camRunning ? (
                <button
                  className="btn-primary flex-center"
                  onClick={startCamera}
                  disabled={!modelReady}
                  style={{ gap: '0.5rem' }}
                >
                  <Play size={18} />
                  {modelReady ? 'Start Camera Scan' : 'Loading model...'}
                </button>
              ) : (
                <button
                  className="btn-secondary flex-center text-danger"
                  onClick={stopCamera}
                  style={{ gap: '0.5rem' }}
                >
                  <StopCircle size={18} /> Stop Camera
                </button>
              )}
            </div>

            <p className="webcam-note text-muted">
              Point your camera at the skin area. AI classifies in real-time using TensorFlow.js.<br />
              Detected conditions: Eczema, Melanoma, Atopic Dermatitis, BCC, Melanoma Nevi, BKL
            </p>
          </motion.div>
        )}
      </div>
    </div>
  );
};

export default Scan;
