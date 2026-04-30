import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Star, X, Check, Video, Stethoscope } from 'lucide-react';
import { useAppContext } from '../context/AppContext';
import './DoctorFeedbackModal.css';

const DoctorFeedbackModal = () => {
  const { doctorFeedbackModal, setDoctorFeedbackModal, submitDoctorFeedback } = useAppContext();
  
  const [overall, setOverall] = useState(0);
  const [hoverOverall, setHoverOverall] = useState(0);
  
  const [categories, setCategories] = useState({
    communication: 0,
    treatment: 0,
    timeManagement: 0
  });
  
  const [review, setReview] = useState('');
  const [recommend, setRecommend] = useState(null); // true, false, or null
  const [submitted, setSubmitted] = useState(false);

  // Reset state when modal opens with new doctor
  useEffect(() => {
    if (doctorFeedbackModal && !submitted) {
      setOverall(0);
      setHoverOverall(0);
      setCategories({ communication: 0, treatment: 0, timeManagement: 0 });
      setReview('');
      setRecommend(null);
    }
  }, [doctorFeedbackModal]);

  if (!doctorFeedbackModal) return null;

  const handleCategoryRating = (cat, val) => {
    setCategories(prev => ({ ...prev, [cat]: val }));
  };

  const handleSubmit = () => {
    if (overall === 0) return;
    
    submitDoctorFeedback({
      doctorId: doctorFeedbackModal.doctorId,
      doctorName: doctorFeedbackModal.doctorName,
      doctorImage: doctorFeedbackModal.doctorImage,
      consultType: doctorFeedbackModal.consultType,
      date: doctorFeedbackModal.date || new Date().toISOString(),
      overallRating: overall,
      categories,
      review,
      recommend
    });
    
    setSubmitted(true);
    
    setTimeout(() => {
      handleClose();
    }, 3000);
  };

  const handleClose = () => {
    setDoctorFeedbackModal(null);
    setTimeout(() => setSubmitted(false), 300);
  };

  const renderStars = (value, onClick, size = 24, onHover = null, hoverVal = 0) => {
    return [1, 2, 3, 4, 5].map((star) => (
      <button
        key={star}
        className={`dfb-star-btn ${value >= star ? 'filled' : ''} ${hoverVal >= star ? 'hovered' : ''}`}
        onMouseEnter={() => onHover && onHover(star)}
        onMouseLeave={() => onHover && onHover(0)}
        onClick={() => onClick(star)}
      >
        <Star size={size} fill={(value >= star || hoverVal >= star) ? 'currentColor' : 'none'} />
      </button>
    ));
  };

  return (
    <AnimatePresence>
      {doctorFeedbackModal && (
        <motion.div 
          className="dfb-overlay"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          style={{ zIndex: 9999 }}
        >
          <motion.div 
            className="dfb-modal"
            initial={{ scale: 0.9, y: 20, opacity: 0 }}
            animate={{ scale: 1, y: 0, opacity: 1 }}
            exit={{ scale: 0.9, y: 20, opacity: 0 }}
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
          >
            {!submitted ? (
              <>
                <button className="dfb-close-btn" onClick={handleClose}>
                  <X size={20} />
                </button>
                
                <div className="dfb-header-bg">
                  <div className="dfb-doc-profile">
                    <img src={doctorFeedbackModal.doctorImage} alt={doctorFeedbackModal.doctorName} className="dfb-doc-img" />
                    <div className="dfb-doc-info">
                      <h3>{doctorFeedbackModal.doctorName}</h3>
                      <p>
                        {doctorFeedbackModal.consultType === 'online' ? <Video size={14}/> : <Stethoscope size={14}/>}
                        {doctorFeedbackModal.consultType === 'online' ? 'Video Consultation' : 'Clinic Visit'}
                        <span className="dfb-badge">Completed</span>
                      </p>
                    </div>
                  </div>
                </div>

                <div className="dfb-body">
                  <div className="dfb-overall">
                    <p>How was your experience?</p>
                    <div className="dfb-stars-large">
                      {renderStars(overall, setOverall, 36, setHoverOverall, hoverOverall)}
                    </div>
                  </div>

                  <div className="dfb-categories">
                    <div className="dfb-category-row">
                      <span className="dfb-cat-label">Communication</span>
                      <div className="dfb-stars-small">
                        {renderStars(categories.communication, (v) => handleCategoryRating('communication', v), 20)}
                      </div>
                    </div>
                    <div className="dfb-category-row">
                      <span className="dfb-cat-label">Treatment Quality</span>
                      <div className="dfb-stars-small">
                        {renderStars(categories.treatment, (v) => handleCategoryRating('treatment', v), 20)}
                      </div>
                    </div>
                    <div className="dfb-category-row">
                      <span className="dfb-cat-label">Time Management</span>
                      <div className="dfb-stars-small">
                        {renderStars(categories.timeManagement, (v) => handleCategoryRating('timeManagement', v), 20)}
                      </div>
                    </div>
                  </div>

                  <div className="dfb-textarea-wrap">
                    <label className="dfb-label">Share your review</label>
                    <textarea 
                      className="dfb-textarea" 
                      placeholder="Write about the doctor's approach, clinic hygiene, wait times, etc..."
                      value={review}
                      onChange={(e) => setReview(e.target.value)}
                    ></textarea>
                  </div>

                  <div className="dfb-recommend">
                    <span className="dfb-recommend-label">Would you recommend this doctor?</span>
                    <div className="dfb-toggles">
                      <button 
                        className={`dfb-toggle-btn yes ${recommend === true ? 'active' : ''}`}
                        onClick={() => setRecommend(true)}
                      >Yes</button>
                      <button 
                        className={`dfb-toggle-btn no ${recommend === false ? 'active' : ''}`}
                        onClick={() => setRecommend(false)}
                      >No</button>
                    </div>
                  </div>

                  <button 
                    className="dfb-submit-btn" 
                    disabled={overall === 0}
                    onClick={handleSubmit}
                  >
                    Submit Review
                  </button>
                </div>
              </>
            ) : (
              <div className="wfb-success" style={{padding: '4rem 2rem'}}>
                <motion.div 
                  className="wfb-success-icon"
                  initial={{ scale: 0, rotate: -180 }}
                  animate={{ scale: 1, rotate: 0 }}
                  transition={{ type: "spring", stiffness: 200, damping: 15 }}
                >
                  <Check size={36} color="white" strokeWidth={3} />
                </motion.div>
                <h3>Review Submitted!</h3>
                <p>Your review helps others choose better doctors 🙏</p>
              </div>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default DoctorFeedbackModal;
