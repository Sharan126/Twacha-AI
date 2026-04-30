import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Pill, Clock, Plus, Check, X, Bell } from 'lucide-react';
import './Medications.css';

const mockMeds = [
  { id: 1, name: 'Isotretinoin', dosage: '20mg', time: '09:00 AM', status: 'taken', type: 'capsule' },
  { id: 2, name: 'Clindamycin Gel', dosage: 'Apply thin layer', time: '02:00 PM', status: 'pending', type: 'ointment' },
  { id: 3, name: 'Vitamin C Serum', dosage: '3 drops', time: '09:00 PM', status: 'pending', type: 'drop' },
];

const Medications = () => {
  const [meds, setMeds] = useState(mockMeds);
  const [showSetup, setShowSetup] = useState(false);
  const [activeReminder, setActiveReminder] = useState(mockMeds[1]); // Mock active reminder

  const handleStatusUpdate = (id, newStatus) => {
    setMeds(meds.map(m => m.id === id ? { ...m, status: newStatus } : m));
    if (activeReminder && activeReminder.id === id) setActiveReminder(null);
  };

  const progress = Math.round((meds.filter(m => m.status === 'taken').length / meds.length) * 100);

  return (
    <div className="medications-page container">
      <div className="meds-header flex-between">
        <h2>Medication Tracker</h2>
        <button className="btn-primary flex-center" onClick={() => setShowSetup(true)}>
          <Plus size={18} /> Add Reminder
        </button>
      </div>

      <div className="progress-section glass-card">
        <div className="flex-between">
          <h3>Today's Progress</h3>
          <span className="text-primary font-bold">{progress}%</span>
        </div>
        <div className="progress-bar-bg">
          <div className="progress-bar-fill" style={{ width: `${progress}%` }}></div>
        </div>
      </div>

      {/* Active Reminder Mock */}
      <AnimatePresence>
        {activeReminder && (
          <motion.div 
            className="active-reminder glass-card bg-primary-light text-white"
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9 }}
          >
            <div className="reminder-info flex-center">
              <Bell size={24} className="shake-anim" />
              <div>
                <h4>Time to take your medicine 💊</h4>
                <p>{activeReminder.name} - {activeReminder.dosage}</p>
              </div>
            </div>
            <div className="reminder-actions">
              <button className="btn-secondary" onClick={() => setActiveReminder(null)}>Snooze</button>
              <button className="btn-primary" onClick={() => handleStatusUpdate(activeReminder.id, 'taken')}>Mark Taken</button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="timeline-section">
        <h3>Daily Schedule</h3>
        <div className="timeline">
          {meds.map((med, index) => (
            <motion.div 
              key={med.id} 
              className={`timeline-item ${med.status}`}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.1 }}
            >
              <div className="timeline-time glass">{med.time}</div>
              <div className="timeline-content glass-card">
                <div className="med-icon">
                  <Pill size={24} />
                </div>
                <div className="med-details">
                  <h4>{med.name}</h4>
                  <p className="text-muted">{med.dosage}</p>
                </div>
                <div className="med-status">
                  {med.status === 'taken' ? (
                    <span className="status-badge success"><Check size={14} /> Taken</span>
                  ) : med.status === 'missed' ? (
                    <span className="status-badge danger"><X size={14} /> Missed</span>
                  ) : (
                    <div className="action-buttons">
                      <button className="icon-btn check" onClick={() => handleStatusUpdate(med.id, 'taken')}><Check size={18} /></button>
                      <button className="icon-btn cross" onClick={() => handleStatusUpdate(med.id, 'missed')}><X size={18} /></button>
                    </div>
                  )}
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>

      {/* Setup Modal */}
      <AnimatePresence>
        {showSetup && (
          <motion.div 
            className="modal-overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <motion.div 
              className="modal-content glass"
              initial={{ scale: 0.9 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.9 }}
            >
              <button className="close-btn" onClick={() => setShowSetup(false)}><X size={24} /></button>
              <h3>New Medication Reminder</h3>
              
              <div className="form-group mt-2">
                <label>Medicine Name</label>
                <input type="text" placeholder="e.g. Isotretinoin" />
              </div>
              
              <div className="flex-between gap-1 mt-1">
                <div className="form-group w-50">
                  <label>Dosage</label>
                  <input type="text" placeholder="e.g. 20mg" />
                </div>
                <div className="form-group w-50">
                  <label>Time</label>
                  <input type="time" />
                </div>
              </div>
              
              <div className="form-group mt-1">
                <label>Frequency</label>
                <select>
                  <option>Daily</option>
                  <option>Twice a day</option>
                  <option>Weekly</option>
                </select>
              </div>

              <button className="btn-primary full-width mt-2" onClick={() => setShowSetup(false)}>
                Save Reminder
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default Medications;
