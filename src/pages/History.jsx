import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Calendar, ChevronRight, Stethoscope, Star, Trash2, AlertTriangle, RefreshCw, Filter } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../config/supabaseClient';
import './History.css';

const History = () => {
  const { profile } = useAuth();
  const [activeTab, setActiveTab] = useState('scan');
  const [scanHistory, setScanHistory] = useState([]);
  const [consultations, setConsultations] = useState([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [severityFilter, setSeverityFilter] = useState('all');
  
  useEffect(() => {
    if (!profile) return;
    fetchHistory();

    // Set up realtime listeners
    const scanSub = supabase
      .channel('public:scan_history')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'scan_history', filter: `user_id=eq.${profile.id}` }, payload => {
        fetchHistory(); // Easiest way to sync
      })
      .subscribe();

    const consultSub = supabase
      .channel('public:consultation_history')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'consultation_history', filter: `user_id=eq.${profile.id}` }, payload => {
        fetchHistory();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(scanSub);
      supabase.removeChannel(consultSub);
    };
  }, [profile]);

  const fetchHistory = async () => {
    setLoading(true);
    try {
      if (profile) {
        const { data: scans } = await supabase
          .from("scan_history")
          .select("*")
          .eq("user_id", profile.id)
          .order("created_at", { ascending: false });
        
        const { data: consults } = await supabase
          .from("consultation_history")
          .select("*")
          .eq("user_id", profile.id)
          .order("created_at", { ascending: false });

        if (scans) setScanHistory(scans);
        if (consults) setConsultations(consults);
      }
    } catch (err) {
      console.error(err);
    }
    setLoading(false);
  };

  const deleteScan = async (id) => {
    if (window.confirm("Are you sure you want to delete this scan record?")) {
      const { error } = await supabase.from("scan_history").delete().eq("id", id);
      if (!error) {
        setScanHistory(prev => prev.filter(item => item.id !== id));
      }
    }
  };

  const deleteConsultation = async (id) => {
    if (window.confirm("Are you sure you want to delete this consultation record?")) {
      const { error } = await supabase.from("consultation_history").delete().eq("id", id);
      if (!error) {
        setConsultations(prev => prev.filter(item => item.id !== id));
      }
    }
  };

  const deleteAllHistory = async () => {
    if (!profile) return;
    if (window.confirm(`Are you absolutely sure you want to delete ALL ${activeTab === 'scan' ? 'scan' : 'consultation'} history? This cannot be undone.`)) {
      const table = activeTab === 'scan' ? 'scan_history' : 'consultation_history';
      const { error } = await supabase.from(table).delete().eq("user_id", profile.id);
      if (!error) {
        if (activeTab === 'scan') setScanHistory([]);
        else setConsultations([]);
      }
    }
  };

  const filteredScans = scanHistory.filter(scan => {
    if (severityFilter === 'all') return true;
    return scan.severity === severityFilter;
  });

  return (
    <div className="history-page container">
      <div className="page-header flex-between" style={{ flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h2>History</h2>
          <p className="text-muted">Review your past activities</p>
        </div>
        
        {/* Bulk Actions */}
        <button 
          className="btn-secondary text-danger flex-center" 
          onClick={deleteAllHistory}
          disabled={activeTab === 'scan' ? scanHistory.length === 0 : consultations.length === 0}
          style={{ gap: '0.5rem' }}
        >
          <Trash2 size={16} /> Delete All
        </button>
      </div>

      <div className="history-tabs-container flex-between" style={{ flexWrap: 'wrap', gap: '1rem', marginBottom: '2rem' }}>
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

        {activeTab === 'scan' && (
          <div className="history-filters glass" style={{ padding: '0.5rem 1rem', borderRadius: 'var(--radius-full)' }}>
            <div className="flex-center" style={{ gap: '0.5rem' }}>
              <Filter size={16} className="text-muted" />
              <select 
                style={{ background: 'transparent', border: 'none', color: 'var(--text-color)', outline: 'none' }}
                value={severityFilter}
                onChange={(e) => setSeverityFilter(e.target.value)}
              >
                <option value="all">All Severities</option>
                <option value="high">High Severity</option>
                <option value="medium">Medium Severity</option>
                <option value="low">Low Severity</option>
              </select>
            </div>
          </div>
        )}
      </div>

      {!profile ? (
         <div className="empty-state glass-card">
           <AlertTriangle size={48} className="text-warning mb-1" />
           <h3>Login Required</h3>
           <p className="text-muted">Please log in to view your history.</p>
         </div>
      ) : loading ? (
        <div className="flex-center" style={{ minHeight: '300px' }}>
          <RefreshCw size={32} className="spinner text-primary" />
        </div>
      ) : (
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
              {filteredScans.length > 0 ? filteredScans.map((scan, index) => (
                <motion.div 
                  key={scan.id} 
                  className="history-card glass-card"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                >
                  <div className="history-img-container">
                    <img src={scan.image_url} alt={scan.prediction} />
                    <div className={`severity-badge ${scan.severity || 'low'}`}>
                      {scan.severity?.toUpperCase() || 'UNKNOWN'}
                    </div>
                  </div>
                  
                  <div className="history-details">
                    <h3>{scan.prediction}</h3>
                    <div className="flex-between">
                      <div className="date-badge flex-center text-muted">
                        <Calendar size={14} style={{ marginRight: '4px' }} /> 
                        {new Date(scan.created_at).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' })}
                      </div>
                      <span className="text-sm text-primary">{Number(scan.confidence).toFixed(1)}%</span>
                    </div>
                  </div>
                  
                  <div style={{ display: 'flex' }}>
                    <button className="view-btn flex-center" style={{ flex: 1, borderRight: '1px solid var(--border-glass)' }}>
                      View Report
                    </button>
                    <button 
                      className="view-btn text-danger flex-center" 
                      style={{ flex: 0.5 }}
                      onClick={() => deleteScan(scan.id)}
                    >
                      <Trash2 size={16} /> Delete
                    </button>
                  </div>
                </motion.div>
              )) : (
                <div className="empty-state glass-card" style={{ gridColumn: '1 / -1' }}>
                  <Calendar size={48} className="text-muted mb-1" />
                  <h3>No Scans Found</h3>
                  <p className="text-muted">You haven't scanned any skin conditions yet, or none match your filter.</p>
                </div>
              )}
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
                        <div className="consult-icon glass flex-center" style={{ width: '50px', height: '50px', borderRadius: '50%' }}>
                           <Stethoscope size={24} className="text-primary" />
                        </div>
                        <div>
                          <h3>{consult.doctor_name}</h3>
                          <p className="text-muted" style={{margin: 0, fontSize: '0.85rem'}}>
                            {consult.specialization} • {new Date(consult.created_at).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' })}
                          </p>
                        </div>
                      </div>
                      <div className="consult-rating">
                        <span style={{ color: 'var(--success)' }}>{consult.status?.toUpperCase()}</span>
                      </div>
                    </div>
                    
                    <div className="consult-card-actions mt-1">
                      <button 
                        className="btn-secondary text-danger flex-center"
                        style={{ gap: '0.5rem' }}
                        onClick={() => deleteConsultation(consult.id)}
                      >
                        <Trash2 size={16} /> Delete Record
                      </button>
                    </div>
                  </motion.div>
                ))
              ) : (
                <div className="empty-state glass-card">
                  <Stethoscope size={48} className="text-muted mb-1" />
                  <h3>No Consultations</h3>
                  <p className="text-muted">Your past doctor visits will appear here.</p>
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      )}
    </div>
  );
};

export default History;
