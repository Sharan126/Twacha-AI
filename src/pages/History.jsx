import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Calendar, ChevronRight, Stethoscope, Star } from 'lucide-react';
import { useAppContext } from '../context/AppContext';
import './History.css';

const scanHistory = [
  { id: 1, date: 'Oct 24, 2023', result: 'Benign Nevus (Mole)', severity: 'low', image: 'https://images.unsplash.com/photo-1612456225451-bb8d10d0131d?w=300&h=300&fit=crop' },
  { id: 2, date: 'Sep 12, 2023', result: 'Mild Acne Vulgaris', severity: 'medium', image: 'https://images.unsplash.com/photo-1556228578-0d85b1a4d571?w=300&h=300&fit=crop' },
  { id: 3, date: 'Jul 05, 2023', result: 'Contact Dermatitis', severity: 'high', image: 'https://images.unsplash.com/photo-1512290923902-8a9f81dc236c?w=300&h=300&fit=crop' }
];

const History = () => {
  const { setDoctorFeedbackModal } = useAppContext();
  const [activeTab, setActiveTab] = useState('scan');
  const [consultations, setConsultations] = useState([]);

  useEffect(() => {
    // Load consultations from localStorage
    const feedback = JSON.parse(localStorage.getItem('doctor_feedback') || '[]');
    setConsultations(feedback);
  }, []);

  return (
    <div className="history-page container">
      <div className="page-header">
        <h2>History</h2>
        <p className="text-muted">Review your past activities</p>
      </div>

      <div className="history-tabs glass">
        <button 
          className={`history-tab ${activeTab === 'scan' ? 'active' : ''}`}
          onClick={() => setActiveTab('scan')}
        >
          Scan History
        </button>
        <button 
          className={`history-tab ${activeTab === 'consultation' ? 'active' : ''}`}
          onClick={() => setActiveTab('consultation')}
        >
          Consultation History
        </button>
      </div>

      <AnimatePresence mode="wait">
        {activeTab === 'scan' ? (
          <motion.div 
            key="scan-tab"
            className="history-grid"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
            transition={{ duration: 0.3 }}
          >
            {scanHistory.map((scan, index) => (
              <motion.div 
                key={scan.id} 
                className="history-card glass-card"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
              >
                <div className="history-img-container">
                  <img src={scan.image} alt={scan.result} />
                  <div className={`severity-badge ${scan.severity}`}>
                    {scan.severity.toUpperCase()}
                  </div>
                </div>
                
                <div className="history-details">
                  <h3>{scan.result}</h3>
                  <div className="date-badge flex-center text-muted">
                    <Calendar size={14} style={{ marginRight: '4px' }} /> {scan.date}
                  </div>
                </div>
                
                <button className="view-btn flex-between">
                  View Report <ChevronRight size={16} />
                </button>
              </motion.div>
            ))}
          </motion.div>
        ) : (
          <motion.div 
            key="consult-tab"
            className="history-consult-list"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.3 }}
          >
            {consultations.length > 0 ? (
              consultations.map((consult, index) => (
                <motion.div 
                  key={consult.id}
                  className="consult-card glass-card"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                >
                  <div className="consult-card-header">
                    <div className="flex-center" style={{gap: '1rem'}}>
                      <img src={consult.doctorImage || 'https://i.pravatar.cc/150'} alt={consult.doctorName} className="consult-doc-img" />
                      <div>
                        <h3>{consult.doctorName}</h3>
                        <p className="text-muted" style={{margin: 0, fontSize: '0.85rem'}}>
                          {new Date(consult.createdAt).toLocaleDateString()} • {consult.consultType === 'online' ? 'Video' : 'Clinic'}
                        </p>
                      </div>
                    </div>
                    <div className="consult-rating">
                      <Star size={16} fill="#F59E0B" color="#F59E0B" />
                      <span>{consult.overallRating}/5</span>
                    </div>
                  </div>
                  
                  {consult.review && (
                    <div className="consult-review">
                      "{consult.review}"
                    </div>
                  )}
                  
                  <div className="consult-card-actions">
                    <button 
                      className="btn-secondary"
                      onClick={() => setDoctorFeedbackModal({
                        doctorId: consult.doctorId,
                        doctorName: consult.doctorName,
                        doctorImage: consult.doctorImage,
                        consultType: consult.consultType,
                        date: consult.date
                      })}
                    >
                      Edit Review
                    </button>
                  </div>
                </motion.div>
              ))
            ) : (
              <div className="empty-state glass-card">
                <Stethoscope size={48} className="text-muted mb-1" />
                <h3>No consultations yet</h3>
                <p className="text-muted">Your past doctor visits and reviews will appear here.</p>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default History;
