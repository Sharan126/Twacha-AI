import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Star, ExternalLink, Filter, CheckCircle, Clock, Trash2, ShieldAlert } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { feedbackApi } from '../api/feedbackApi';
import { useNavigate } from 'react-router-dom';
import './AdminFeedback.css';

const AdminFeedback = () => {
  const { profile } = useAuth();
  const navigate = useNavigate();
  const [feedbacks, setFeedbacks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterType, setFilterType] = useState('All');

  useEffect(() => {
    if (!profile) {
      navigate('/auth');
      return;
    }
    fetchFeedbacks();
  }, [profile, navigate]);

  const fetchFeedbacks = async () => {
    setLoading(true);
    const res = await feedbackApi.getFeedback();
    if (res.success) {
      setFeedbacks(res.data);
    }
    setLoading(false);
  };

  const handleUpdateStatus = async (id, status) => {
    const res = await feedbackApi.updateStatus(id, status);
    if (res.success) {
      setFeedbacks(feedbacks.map(f => f.id === id ? { ...f, status } : f));
    }
  };

  const filteredFeedbacks = feedbacks.filter(f => {
    if (filterType === 'All') return true;
    return f.feedback_type === filterType;
  });

  return (
    <div className="admin-feedback-page container">
      <div className="admin-header flex-between">
        <div>
          <h2>Admin Dashboard: Feedback</h2>
          <p className="text-muted">Review and manage user feedback submissions.</p>
        </div>
        <div className="admin-stats glass">
          <span>Total: <strong>{feedbacks.length}</strong></span>
          <span>Pending: <strong className="text-warning">{feedbacks.filter(f => f.status === 'pending').length}</strong></span>
        </div>
      </div>

      <div className="admin-filters glass">
        <div className="flex-center" style={{ gap: '0.5rem' }}>
          <Filter size={16} className="text-muted" />
          <select value={filterType} onChange={(e) => setFilterType(e.target.value)} className="admin-select">
            <option value="All">All Types</option>
            <option value="Bug Report">Bug Reports</option>
            <option value="Suggestions">Suggestions</option>
            <option value="UI/Design">UI/Design</option>
            <option value="Performance">Performance</option>
            <option value="Other">Other</option>
          </select>
        </div>
      </div>

      {loading ? (
        <div className="flex-center" style={{ height: '300px' }}>Loading...</div>
      ) : (
        <div className="feedback-grid">
          {filteredFeedbacks.length === 0 ? (
            <div className="empty-state glass-card">
              <ShieldAlert size={48} className="text-muted mb-1" />
              <h3>No Feedback Found</h3>
            </div>
          ) : (
            filteredFeedbacks.map(fb => (
              <motion.div key={fb.id} className="feedback-card glass-card" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                <div className="fb-card-header flex-between">
                  <div className="flex-center" style={{ gap: '0.5rem' }}>
                    <span className="fb-type-badge">{fb.feedback_type}</span>
                    {fb.sentiment === 'Positive' && <span className="fb-sentiment text-success">Positive 😊</span>}
                    {fb.sentiment === 'Negative' && <span className="fb-sentiment text-danger">Negative 😠</span>}
                  </div>
                  <div className="fb-date text-muted">
                    {new Date(fb.created_at).toLocaleDateString()}
                  </div>
                </div>

                <div className="fb-card-body">
                  <div className="fb-user-info mt-1">
                    <strong>{fb.profiles?.full_name || 'Anonymous User'}</strong>
                    <span className="text-muted" style={{ marginLeft: '0.5rem', fontSize: '0.85rem' }}>
                      {fb.profiles?.email || ''}
                    </span>
                  </div>
                  
                  <div className="fb-rating text-warning" style={{ margin: '0.5rem 0' }}>
                    {[...Array(5)].map((_, i) => (
                      <Star key={i} size={14} fill={i < fb.rating ? 'currentColor' : 'none'} />
                    ))}
                  </div>

                  <p className="fb-message">{fb.message}</p>

                  {fb.screenshot_url && (
                    <a href={fb.screenshot_url} target="_blank" rel="noopener noreferrer" className="fb-screenshot-link">
                      <ExternalLink size={14} /> View Screenshot
                    </a>
                  )}
                </div>

                <div className="fb-card-footer flex-between mt-1 pt-1" style={{ borderTop: '1px solid var(--border-glass)' }}>
                  <span className={`status-badge ${fb.status}`}>
                    {fb.status.toUpperCase()}
                  </span>
                  
                  <div className="fb-actions flex-center" style={{ gap: '0.5rem' }}>
                    {fb.status === 'pending' && (
                      <>
                        <button className="btn-secondary text-primary btn-sm" onClick={() => handleUpdateStatus(fb.id, 'reviewed')}>
                          Mark Reviewed
                        </button>
                        <button className="btn-primary btn-sm" onClick={() => handleUpdateStatus(fb.id, 'resolved')} style={{display: 'flex', alignItems: 'center', gap: '4px'}}>
                          <CheckCircle size={14} /> Resolved
                        </button>
                      </>
                    )}
                    {fb.status === 'reviewed' && (
                      <button className="btn-primary btn-sm" onClick={() => handleUpdateStatus(fb.id, 'resolved')} style={{display: 'flex', alignItems: 'center', gap: '4px'}}>
                        <CheckCircle size={14} /> Resolved
                      </button>
                    )}
                  </div>
                </div>
              </motion.div>
            ))
          )}
        </div>
      )}
    </div>
  );
};

export default AdminFeedback;
