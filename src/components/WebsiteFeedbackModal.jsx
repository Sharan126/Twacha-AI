import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Star, X, Check, Image as ImageIcon, MessageSquarePlus } from 'lucide-react';
import { useAppContext } from '../context/AppContext';
import './WebsiteFeedbackModal.css';

const WebsiteFeedbackModal = () => {
  const { feedbackModalOpen, setFeedbackModalOpen, submitWebsiteFeedback } = useAppContext();
  
  const [rating, setRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [type, setType] = useState('Suggestions');
  const [text, setText] = useState('');
  const [screenshot, setScreenshot] = useState(null);
  const [submitted, setSubmitted] = useState(false);

  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      // Create a fake object URL for display purposes
      const url = URL.createObjectURL(file);
      setScreenshot({ name: file.name, url });
    }
  };

  const handleSubmit = () => {
    if (rating === 0) return; // Basic validation
    
    submitWebsiteFeedback({
      rating,
      type,
      text,
      screenshot: screenshot ? screenshot.name : null
    });
    
    setSubmitted(true);
    
    // Auto close after 3 seconds
    setTimeout(() => {
      handleClose();
    }, 3000);
  };

  const handleClose = () => {
    setFeedbackModalOpen(false);
    // Reset state after animation
    setTimeout(() => {
      setSubmitted(false);
      setRating(0);
      setHoverRating(0);
      setType('Suggestions');
      setText('');
      setScreenshot(null);
    }, 300);
  };

  return (
    <AnimatePresence>
      {feedbackModalOpen && (
        <motion.div 
          className="wfb-overlay"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          style={{ zIndex: 9999 }}
        >
          <motion.div 
            className="wfb-modal"
            initial={{ scale: 0.9, y: 20, opacity: 0 }}
            animate={{ scale: 1, y: 0, opacity: 1 }}
            exit={{ scale: 0.9, y: 20, opacity: 0 }}
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
          >
            {!submitted ? (
              <>
                <div className="wfb-header">
                  <div className="wfb-title-block">
                    <h3>App Feedback</h3>
                    <p>Help us improve your experience</p>
                  </div>
                  <button className="wfb-close-btn" onClick={handleClose}>
                    <X size={20} />
                  </button>
                </div>

                <div className="wfb-section">
                  <label className="wfb-label">Overall Rating</label>
                  <div className="star-row">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <button
                        key={star}
                        className={`star-btn ${rating >= star ? 'filled' : ''} ${hoverRating >= star ? 'hovered' : ''}`}
                        onMouseEnter={() => setHoverRating(star)}
                        onMouseLeave={() => setHoverRating(0)}
                        onClick={() => setRating(star)}
                      >
                        <Star size={32} fill={(rating >= star || hoverRating >= star) ? 'currentColor' : 'none'} />
                      </button>
                    ))}
                    {rating > 0 && (
                      <span className="rating-hint flex-center">
                        {rating === 1 && "Poor"}
                        {rating === 2 && "Fair"}
                        {rating === 3 && "Good"}
                        {rating === 4 && "Very Good"}
                        {rating === 5 && "Excellent!"}
                      </span>
                    )}
                  </div>
                </div>

                <div className="wfb-section">
                  <label className="wfb-label">Feedback Type</label>
                  <select 
                    className="wfb-select" 
                    value={type} 
                    onChange={(e) => setType(e.target.value)}
                  >
                    <option value="UI/Design">UI/Design</option>
                    <option value="Performance">Performance / Speed</option>
                    <option value="Bug Report">Bug Report</option>
                    <option value="Suggestions">Feature Suggestion</option>
                    <option value="Other">Other</option>
                  </select>
                </div>

                <div className="wfb-section">
                  <label className="wfb-label">Details</label>
                  <textarea 
                    className="wfb-textarea" 
                    placeholder="Tell us what you loved or what needs fixing..."
                    value={text}
                    onChange={(e) => setText(e.target.value)}
                    maxLength={500}
                  ></textarea>
                  <div className="wfb-char-count">{text.length}/500</div>
                </div>

                <div className="wfb-section">
                  <label className="wfb-label flex-center" style={{justifyContent: 'flex-start'}}>
                    Screenshot <span className="wfb-optional-badge">Optional</span>
                  </label>
                  
                  {screenshot ? (
                    <div className="wfb-upload-preview flex-between">
                      <div className="flex-center" style={{gap: '0.5rem'}}>
                        <ImageIcon size={16} />
                        <span className="text-truncate" style={{maxWidth: '200px'}}>{screenshot.name}</span>
                      </div>
                      <button onClick={() => setScreenshot(null)} style={{color: 'var(--danger)', padding: '0.2rem'}}>
                        <X size={16} />
                      </button>
                    </div>
                  ) : (
                    <div className="wfb-upload-zone">
                      <input type="file" accept="image/*" onChange={handleImageUpload} />
                      <div className="flex-center" style={{flexDirection: 'column'}}>
                        <ImageIcon size={24} className="wfb-upload-icon" />
                        <span>Click or drag to upload screenshot</span>
                      </div>
                    </div>
                  )}
                </div>

                <button 
                  className="wfb-submit-btn" 
                  disabled={rating === 0}
                  onClick={handleSubmit}
                >
                  Submit Feedback
                </button>
              </>
            ) : (
              <div className="wfb-success">
                <motion.div 
                  className="wfb-success-icon"
                  initial={{ scale: 0, rotate: -180 }}
                  animate={{ scale: 1, rotate: 0 }}
                  transition={{ type: "spring", stiffness: 200, damping: 15 }}
                >
                  <Check size={36} color="white" strokeWidth={3} />
                </motion.div>
                <h3>Thanks for your feedback! 🙌</h3>
                <p>Your input helps us make Twacha AI better for everyone.</p>
                <button className="wfb-close-success" onClick={handleClose}>
                  Close
                </button>
              </div>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default WebsiteFeedbackModal;
