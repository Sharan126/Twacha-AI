import React from 'react';
import { motion } from 'framer-motion';
import { Activity, Camera, Stethoscope, Pill, CheckCircle } from 'lucide-react';
import './Records.css';

const Records = () => {
  return (
    <div className="records-page container">
      <div className="page-header">
        <h2>Health Records & Progress</h2>
        <p className="text-muted">Track your skin journey from diagnosis to recovery</p>
      </div>

      <div className="records-grid">
        {/* Timeline Journey */}
        <motion.div 
          className="journey-timeline glass-card"
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
        >
          <h3>Treatment Journey (Acne Vulgaris)</h3>
          <div className="timeline-container">
            <div className="timeline-step completed">
              <div className="step-icon"><Camera size={16} /></div>
              <div className="step-content">
                <h4>Initial Scan</h4>
                <p>Sep 12, 2023</p>
              </div>
            </div>
            <div className="timeline-step completed">
              <div className="step-icon"><Stethoscope size={16} /></div>
              <div className="step-content">
                <h4>Doctor Consultation</h4>
                <p>Dr. Rajesh Kumar - Sep 14</p>
              </div>
            </div>
            <div className="timeline-step active">
              <div className="step-icon"><Pill size={16} /></div>
              <div className="step-content">
                <h4>Medication Course</h4>
                <p>Ongoing (Week 4 of 12)</p>
              </div>
            </div>
            <div className="timeline-step pending">
              <div className="step-icon"><CheckCircle size={16} /></div>
              <div className="step-content">
                <h4>Final Result</h4>
                <p>Pending</p>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Progress & Compare */}
        <div className="right-col">
          <motion.div 
            className="progress-graph glass-card"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
          >
            <h3>Severity Progress</h3>
            <div className="graph-placeholder flex-center">
              <Activity size={48} className="text-primary opacity-50" />
              <p>Severity decreased by 40% since Sep 12</p>
              {/* Mocking a bar graph with CSS */}
              <div className="mock-chart">
                <div className="bar" style={{height: '80%'}}></div>
                <div className="bar" style={{height: '65%'}}></div>
                <div className="bar" style={{height: '50%'}}></div>
                <div className="bar" style={{height: '40%', background: 'var(--success)'}}></div>
              </div>
            </div>
          </motion.div>

          <motion.div 
            className="compare-scans glass-card"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <h3>Compare Scans</h3>
            <div className="compare-container">
              <div className="scan-img">
                <span className="badge-sm">Day 1</span>
                <img src="https://images.unsplash.com/photo-1556228578-0d85b1a4d571?w=150&h=150&fit=crop" alt="Before" />
              </div>
              <div className="vs-badge flex-center">VS</div>
              <div className="scan-img">
                <span className="badge-sm">Day 28</span>
                <img src="https://images.unsplash.com/photo-1512290923902-8a9f81dc236c?w=150&h=150&fit=crop" alt="After" style={{ filter: 'brightness(1.2)' }} />
              </div>
            </div>
            <button className="btn-secondary full-width mt-1">View Full Comparison</button>
          </motion.div>
        </div>
      </div>
    </div>
  );
};

export default Records;
