import React, { useState, useRef, useCallback } from 'react';
import Webcam from 'react-webcam';
import { motion, AnimatePresence } from 'framer-motion';
import {
  UploadCloud, Camera, Activity, RefreshCw, StopCircle, Play, AlertTriangle, Download
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../config/supabaseClient';
import './Scan.css';

const Scan = () => {
  const navigate = useNavigate();
  const { t, i18n } = useTranslation();
  const { profile } = useAuth();

  const getSeverity = (conf) => {
    if (conf >= 80) return 'high';
    if (conf >= 50) return 'medium';
    return 'low';
  };

  // ── Tab state ──────────────────────────────────────────────────────────────
  const [activeTab, setActiveTab] = useState('upload');

  // ── Upload tab state ───────────────────────────────────────────────────────
  const [image,       setImage]       = useState(null);  // object URL for preview
  const [imageFile,   setImageFile]   = useState(null);  // raw File → sent to Flask
  const [isScanning,  setIsScanning]  = useState(false);
  const [result,      setResult]      = useState(null);

  // ── Webcam tab state ───────────────────────────────────────────────────────
  const [camRunning, setCamRunning] = useState(false);
  const [camError, setCamError] = useState('');
  const webcamRef = useRef(null);

  // ═══════════════════════════════════════════════════════════════════════════
  //  UPLOAD TAB — file handlers
  // ═══════════════════════════════════════════════════════════════════════════
  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      setImage(URL.createObjectURL(file));
      setImageFile(file);   
      setResult(null);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    if (file) {
      setImage(URL.createObjectURL(file));
      setImageFile(file);
      setResult(null);
    }
  };

  // ═══════════════════════════════════════════════════════════════════════════
  //  startScan()
  //  PRIMARY  : POST image to Flask /predict → get class + confidence + Grad-CAM + Report
  // ═══════════════════════════════════════════════════════════════════════════
  const startScan = async () => {
    if (!imageFile) return;
    setIsScanning(true);
    setResult(null);

    try {
      // [API CALL EXPLANATION]
      // We use fetch API to send the image to our Flask backend running on localhost:5000.
      // The image is packed into a FormData object under the key "file".
      // The backend processes this image and returns a JSON response containing the prediction and Grad-CAM image.
      const formData = new FormData();
      formData.append('file', imageFile);  // key: "file"
      formData.append('language', i18n.language);

      // Get current session token for protected backend route
      const { data: { session } } = await supabase.auth.getSession();
      const token = session?.access_token || '';

      const response = await fetch('http://localhost:5000/predict', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: formData,
        // Do NOT set Content-Type manually — browser sets boundary automatically
      });

      const data = await response.json();

      if (response.status === 422) {
        // Skin pixel validation failed or low confidence — show rejection card
        setResult({
          isRejected: true,
          rejectionMessage: data.message || 'This image does not appear to contain skin. Please upload a clear, close-up photo of the affected skin area.',
          rejectionType: data.error === 'low_confidence' ? 'low_confidence' : 'not_skin',
        });
        setIsScanning(false);
        return;
      }

      if (response.ok && !data.error) {
        const translatedDisease = t(
          `ai_labels.${data.class.toLowerCase()}`,
          { defaultValue: data.class }
        );
        const finalResult = {
          disease: translatedDisease,
          confidence: data.confidence,
          allPredictions: (data.all_predictions || []).map(p => ({
            className: p.className,
            probability: p.probability,
          })),
          explanation: t('scan.analysisExplanation', {
            disease: translatedDisease,
            confidence: data.confidence,
            defaultValue: `AI identified "${translatedDisease}" with ${data.confidence}% confidence. Please consult a certified dermatologist.`,
          }),
          heatmapBase64: data.heatmap_image || null,
          report: data.report || null,
          pdfBase64: data.pdf_base64 || null,
        };
        setResult(finalResult);
        
        // Auto-save to history
        if (profile) {
          supabase.from('scan_history').insert([{
            user_id: profile.id,
            image_url: 'https://images.unsplash.com/photo-1612456225451-bb8d10d0131d?w=300&h=300&fit=crop',
            prediction: finalResult.disease,
            confidence: finalResult.confidence,
            severity: getSeverity(finalResult.confidence),
            created_at: new Date().toISOString()
          }]).then(({ error }) => {
             if (error) console.error("Error saving scan to history:", error);
          });
        }

        setIsScanning(false);
        return;  // done
      } else {
        throw new Error(data.error || 'Failed to process image');
      }
    } catch (flaskErr) {
      // [ERROR HANDLING]
      // Show message if API fails, as requested.
      console.error('[Scan] API Error:', flaskErr.message);
      setResult({
        disease: t('scan.analysisError', { defaultValue: 'Analysis Error' }),
        confidence: '0',
        allPredictions: [],
        explanation: `API Error: ${flaskErr.message}. Please make sure the Flask backend is running on port 5000.`,
        heatmapBase64: null,
      });
      setIsScanning(false);
    }
  };

  const resetScan = () => {
    setImage(null);
    setImageFile(null);
    setResult(null);
  };

  const downloadPDF = () => {
    if (!result?.pdfBase64) return;
    const link = document.createElement('a');
    link.href = `data:application/pdf;base64,${result.pdfBase64}`;
    link.download = `Twacha_Report_${result.disease.replace(/\s+/g, '_')}.pdf`;
    link.click();
  };

  // ═══════════════════════════════════════════════════════════════════════════
  //  WEBCAM TAB — Send captured frame to backend
  // ═══════════════════════════════════════════════════════════════════════════
  const startCamera = useCallback(() => {
    setCamError('');
    setCamRunning(true);
  }, []);

  const stopCamera = useCallback(() => {
    setCamRunning(false);
  }, []);

  const handleCamError = useCallback((err) => {
    console.error('Webcam error:', err);
    setCamError(
      err?.name === 'NotAllowedError'
        ? 'Camera permission denied. Please allow camera access and try again.'
        : `Camera error: ${err?.message || 'Unknown error'}`
    );
    setCamRunning(false);
  }, []);

  // Capture frame from webcam and send to Flask API
  const captureImageAndAnalyze = async () => {
    if (!webcamRef.current) return;
    
    // Get base64 string from webcam
    const imageSrc = webcamRef.current.getScreenshot();
    if (!imageSrc) return;

    // Convert base64 to Blob to File
    const res = await fetch(imageSrc);
    const blob = await res.blob();
    const file = new File([blob], "camera_capture.jpg", { type: "image/jpeg" });

    // Set as upload image and automatically start scan
    setImage(imageSrc);
    setImageFile(file);
    setResult(null);
    stopCamera();
    setActiveTab('upload');
    
    // We can't call startScan directly because state update is async, 
    // but React 18 batches them. We will just wait for the user to click "Analyze" 
    // or trigger it immediately (we'll just let the user click Analyze for better UX).
  };

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
        <h2>{t('scan.title')}</h2>
        <p>{t('scan.subtitle')}</p>
      </motion.div>

      {/* ── Tab Switcher ─────────────────────────────────────────────────── */}
      <div className="scan-tabs glass">
        <button
          className={`scan-tab ${activeTab === 'upload' ? 'active' : ''}`}
          onClick={() => setActiveTab('upload')}
        >
          <UploadCloud size={16} /> {t('scan.uploadTab')}
        </button>
        <button
          className={`scan-tab ${activeTab === 'webcam' ? 'active' : ''}`}
          onClick={() => setActiveTab('webcam')}
        >
          <Camera size={16} /> {t('scan.cameraTab')}
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
                <h3>{t('scan.dragDrop')}</h3>
                <p className="text-muted">{t('scan.browseText')}</p>
                <input type="file" id="file-upload" accept="image/*" onChange={handleFileUpload} style={{ display: 'none' }} />
                <div className="upload-actions">
                  <label htmlFor="file-upload" className="btn-primary">{t('scan.browseBtn')}</label>
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
                        <p>{t('scan.aiAnalyzing')}</p>
                      </div>
                    )}
                  </div>
                  <div className="preview-actions">
                    <button className="btn-secondary" onClick={resetScan} disabled={isScanning}>{t('scan.cancelBtn')}</button>
                    <button className="btn-primary" onClick={startScan} disabled={isScanning}>
                      {isScanning ? t('scan.analyzing') : t('scan.analyzeBtn')}
                    </button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            <AnimatePresence>
              {result && (
                result.isRejected ? (
                  /* ── REJECTION CARD: shown when image is not skin or confidence too low ── */
                  <motion.div
                    className="results-area glass-card"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    style={{ borderColor: 'rgba(251,146,60,0.4)' }}
                  >
                    <div style={{ textAlign: 'center', padding: '1.5rem 1rem' }}>
                      <div style={{
                        width: '64px', height: '64px',
                        borderRadius: '50%',
                        background: 'rgba(251,146,60,0.15)',
                        border: '2px solid rgba(251,146,60,0.5)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        margin: '0 auto 1.25rem',
                      }}>
                        <AlertTriangle size={30} style={{ color: '#fb923c' }} />
                      </div>

                      <h3 style={{ color: '#fb923c', marginBottom: '0.5rem', fontSize: '1.15rem' }}>
                        {result.rejectionType === 'low_confidence'
                          ? 'Unclear Image / Normal Skin'
                          : t('scan.notSkinTitle',       { defaultValue: 'Invalid Input: Not Skin' })}
                      </h3>

                      <p style={{
                        color: 'var(--text-muted)', fontSize: '0.9rem',
                        lineHeight: '1.6', maxWidth: '420px', margin: '0 auto 1.5rem',
                        whiteSpace: 'pre-wrap'
                      }}>
                        {result.rejectionMessage}
                      </p>

                      {/* Show the uploaded image so user can see what was rejected */}
                      {image && (
                        <img
                          src={image}
                          alt="Rejected"
                          style={{
                            width: '140px', height: '140px', objectFit: 'cover',
                            borderRadius: 'var(--radius-md)',
                            border: '2px solid rgba(251,146,60,0.4)',
                            marginBottom: '1.5rem', opacity: 0.75,
                          }}
                        />
                      )}

                      <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'center', flexWrap: 'wrap' }}>
                        <button className="btn-primary" onClick={resetScan}
                          style={{ background: 'linear-gradient(135deg,#fb923c,#f97316)' }}>
                          <RefreshCw size={16} style={{ marginRight: '6px' }} />
                          {t('scan.tryAgain', { defaultValue: 'Try Another Image' })}
                        </button>
                      </div>
                    </div>
                  </motion.div>
                ) : (
                  /* ── NORMAL RESULTS CARD ── */
                  <motion.div
                    className="results-area glass-card"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                  >
                    <div className="results-grid">

                      {/* ── Image column: original + Grad-CAM heatmap ── */}
                      <div className="result-image-col">
                        <p className="text-muted" style={{ fontSize: '0.72rem', marginBottom: '4px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                          {t('scan.originalImage', { defaultValue: 'Original Image' })}
                        </p>
                        <img
                          src={image}
                          alt="Analyzed"
                          className="result-image"
                          style={{ width: '100%', borderRadius: 'var(--radius-md)', marginBottom: '0.75rem' }}
                        />

                        {/*
                         * [GRAD-CAM PURPOSE]
                         * Grad-CAM (Gradient-weighted Class Activation Mapping) is a technique that makes AI models transparent.
                         * Simple explanation for students: It creates a "heatmap" showing exactly which parts of the image 
                         * the AI looked at to make its decision. 
                         * RED/warm areas = "high attention" (where the AI found disease features).
                         * BLUE/cool areas = "low attention".
                         * This helps doctors and users trust the AI by seeing its visual reasoning.
                         */}
                        {result.heatmapBase64 && (
                          <>
                            <p className="text-muted" style={{ fontSize: '0.72rem', marginBottom: '4px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                              {t('scan.heatmap', { defaultValue: 'Grad-CAM Heatmap' })}
                            </p>
                            <img
                              src={`data:image/jpeg;base64,${result.heatmapBase64}`}
                              alt="Grad-CAM Heatmap"
                              className="result-image"
                              style={{ width: '100%', borderRadius: 'var(--radius-md)' }}
                            />
                          </>
                        )}
                      </div>

                      {/* ── Result details column ── */}
                      <div className="result-details-col">
                        <div className="confidence-badge">
                          <span className="badge glass">{t('scan.analysisComplete')}</span>
                        </div>

                        <h3 className="disease-name">{result.disease}</h3>

                        <div className="confidence-meter">
                          <div className="confidence-circle" style={{ '--percent': `${result.confidence}%` }}>
                            <span className="confidence-value text-gradient">{result.confidence}%</span>
                            <span className="confidence-label">{t('scan.confidence')}</span>
                          </div>
                        </div>

                        {result.report && (
                          <div className="report-card glass" style={{ marginTop: '1rem', padding: '1rem', borderRadius: 'var(--radius-md)', background: 'rgba(255,255,255,0.05)' }}>
                            <h4 style={{ marginBottom: '0.5rem', color: '#c4b5fd' }}>{t('scan.analysisReport', { defaultValue: 'Analysis Report' })}</h4>
                            <p style={{ fontSize: '0.85rem', marginBottom: '0.25rem' }}><strong>{t('scan.severity', { defaultValue: 'Severity' })}:</strong> {result.report.severity}</p>
                            <p style={{ fontSize: '0.85rem', marginBottom: '0.25rem' }}><strong>{t('scan.precautions', { defaultValue: 'Precautions' })}:</strong> {result.report.precautions}</p>
                            <p style={{ fontSize: '0.85rem' }}><strong>{t('scan.suggestedDoctor', { defaultValue: 'Suggested Doctor' })}:</strong> {result.report.doctor}</p>
                          </div>
                        )}

                        <div className="chat-explanation glass" style={{ marginTop: '1rem' }}>
                          <p>{result.explanation}</p>
                          {result.heatmapBase64 && (
                            <p style={{ marginTop: '0.5rem', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                              {t('scan.gradcamExplanation', { defaultValue: 'The highlighted regions show where the model focused while making the prediction using Grad-CAM.' })}
                            </p>
                          )}
                        </div>

                        <div className="result-actions" style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', marginTop: '1.5rem' }}>
                          {result.pdfBase64 && (
                            <button className="btn-secondary" onClick={downloadPDF} style={{ width: '100%', display: 'flex', justifyContent: 'center', gap: '0.5rem' }}>
                              <Download size={18} /> {t('scan.downloadPdf', { defaultValue: 'Download PDF Report' })}
                            </button>
                          )}
                          <div style={{ display: 'flex', gap: '0.5rem' }}>
                            <button className="btn-secondary" onClick={resetScan} style={{ flex: 1 }}>
                              <RefreshCw size={16} /> {t('scan.scanAnother', { defaultValue: 'Try Another Image' })}
                            </button>
                            <button className="btn-primary" onClick={() => navigate(`/doctors?condition=${result.disease}`)} style={{ flex: 1 }}>
                              {t('scan.consultDoctor', { defaultValue: 'Find Doctor' })}
                            </button>
                          </div>
                        </div>
                      </div>

                    </div>
                  </motion.div>
                )
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
                  <p className="text-muted">{t('scan.cameraNotStarted')}</p>
                </div>
              )}
            </div>

            {camError && (
              <div className="tm-error glass-card">
                <AlertTriangle size={16} /> {camError}
              </div>
            )}

            <div className="webcam-controls">
              {!camRunning ? (
                <button className="btn-primary flex-center" onClick={startCamera} style={{ gap: '0.5rem' }}>
                  <Play size={18} />
                  {t('scan.startCamera')}
                </button>
              ) : (
                <>
                  <button className="btn-primary flex-center" onClick={captureImageAndAnalyze} style={{ gap: '0.5rem', marginBottom: '0.5rem' }}>
                    <Camera size={18} /> Capture & Analyze
                  </button>
                  <button className="btn-secondary flex-center text-danger" onClick={stopCamera} style={{ gap: '0.5rem' }}>
                    <StopCircle size={18} /> {t('scan.stopCamera')}
                  </button>
                </>
              )}
            </div>

            <p className="webcam-note text-muted">
              Point your camera at the skin area and click Capture. The image will be sent to the AI for analysis.
            </p>
          </motion.div>
        )}

      </div>
    </div>
  );
};

export default Scan;
