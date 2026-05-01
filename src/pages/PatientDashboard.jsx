import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../config/supabaseClient';
import { User, Calendar, Save, Loader, Activity, Camera, AlertCircle, CheckCircle } from 'lucide-react';
import './Settings.css';

const PatientDashboard = () => {
  const { session, profile: authProfile } = useAuth();
  const navigate = useNavigate();
  
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState({ type: '', text: '' });
  
  const [formData, setFormData] = useState({
    full_name: '',
    age: '',
    gender: 'Male',
    medical_history: ''
  });

  const [scans, setScans] = useState([]);

  useEffect(() => {
    fetchData();
  }, [session]);

  const fetchData = async () => {
    if (!session?.user) return;
    
    setLoading(true);
    
    // 1. Fetch from PROFILES (Not patients)
    const { data: pData } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', session.user.id)
      .single();

    if (pData) {
      setFormData({
        full_name: pData.full_name || '',
        age: pData.age || '',
        gender: pData.gender || 'Male',
        medical_history: pData.medical_history || ''
      });
    }

    // 2. Fetch scan history
    const { data: sData } = await supabase
      .from('scan_history')
      .select('*')
      .eq('user_id', session.user.id)
      .order('created_at', { ascending: false })
      .limit(5);

    if (sData) setScans(sData);

    setLoading(false);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    setMsg({ type: '', text: '' });

    const { error } = await supabase
      .from('profiles')
      .upsert({
        id: session.user.id,
        full_name: formData.full_name,
        age: parseInt(formData.age) || null,
        gender: formData.gender,
        medical_history: formData.medical_history,
        updated_at: new Date().toISOString()
      });

    setSaving(false);

    if (error) {
      setMsg({ type: 'error', text: error.message });
      // Clear toast after 3 seconds
      setTimeout(() => setMsg({ type: '', text: '' }), 3000);
    } else {
      setMsg({ type: 'success', text: 'Profile saved successfully!' });
      setTimeout(() => setMsg({ type: '', text: '' }), 3000);
    }
  };

  const handleChange = (e) => {
    setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  if (loading) {
    return (
      <div className="flex-center" style={{ minHeight: '80vh' }}>
        <div className="flex-center" style={{ flexDirection: 'column', gap: '1rem' }}>
          <Loader size={40} className="spin text-primary" />
          <p className="text-muted">Loading your dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="settings-page">
      <div className="settings-header">
        <h1>Patient Dashboard</h1>
        <p className="text-muted">Manage your health profile and recent scans</p>
      </div>

      <div className="settings-grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '2rem' }}>
        
        {/* PROFILE CARD */}
        <motion.div className="settings-card glass" initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }}>
          <div className="card-header">
            <h3 className="flex-center gap-sm"><User size={20} className="text-primary"/> Personal Details</h3>
          </div>
          
          {msg.text && (
            <motion.div 
              initial={{ opacity: 0, y: -10 }} 
              animate={{ opacity: 1, y: 0 }}
              className={`auth-alert ${msg.type === 'error' ? 'error' : 'success'}`} 
              style={{ marginBottom: '1.5rem' }}
            >
              {msg.type === 'error' ? <AlertCircle size={16} /> : <CheckCircle size={16} />}
              {msg.text}
            </motion.div>
          )}

          <form onSubmit={handleSave} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            <div className="form-group" style={{ margin: 0 }}>
              <label>Full Name</label>
              <div className="input-with-icon">
                <User size={18} className="input-icon" />
                <input type="text" name="full_name" value={formData.full_name} onChange={handleChange} placeholder="John Doe" required />
              </div>
            </div>

            <div className="form-group" style={{ margin: 0 }}>
              <label>Age</label>
              <div className="input-with-icon">
                <Calendar size={18} className="input-icon" />
                <input type="number" name="age" value={formData.age} onChange={handleChange} placeholder="e.g. 35" min="0" />
              </div>
            </div>

            <div className="form-group" style={{ margin: 0 }}>
              <label>Gender</label>
              <select name="gender" value={formData.gender} onChange={handleChange} className="w-full p-2 rounded border" style={{ background: 'transparent', color: 'var(--text-primary)', borderColor: 'var(--border-color)', height: '44px', width: '100%', outline: 'none' }}>
                <option value="Male" style={{ background: 'var(--bg-card)' }}>Male</option>
                <option value="Female" style={{ background: 'var(--bg-card)' }}>Female</option>
                <option value="Other" style={{ background: 'var(--bg-card)' }}>Other</option>
              </select>
            </div>

            <div className="form-group" style={{ margin: 0 }}>
              <label>Medical History</label>
              <textarea name="medical_history" rows="4" placeholder="Any known allergies, ongoing medications, or past skin conditions..." value={formData.medical_history} onChange={handleChange} className="w-full p-2 rounded border" style={{ background: 'transparent', color: 'var(--text-primary)', borderColor: 'var(--border-color)', width: '100%', resize: 'vertical', outline: 'none', padding: '12px' }}></textarea>
            </div>

            <button type="submit" className="btn-primary mt-1 full-width flex-center" disabled={saving}>
              {saving ? <Loader size={18} className="spin" /> : <><Save size={18} /> Save Profile</>}
            </button>
          </form>
        </motion.div>

        {/* SCANS CARD */}
        <motion.div className="settings-card glass" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }}>
          <div className="card-header flex-between" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h3 className="flex-center gap-sm"><Activity size={20} className="text-primary"/> Recent AI Scans</h3>
            <button className="btn-secondary btn-sm flex-center gap-sm" onClick={() => navigate('/scan')} style={{ padding: '0.4rem 0.75rem', fontSize: '0.85rem' }}>
              <Camera size={14} /> New Scan
            </button>
          </div>
          
          <div className="history-list mt-2" style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            {scans.length === 0 ? (
              <div className="flex-center" style={{ flexDirection: 'column', gap: '1rem', padding: '3rem 1rem', textAlign: 'center', background: 'rgba(255,255,255,0.02)', borderRadius: 'var(--radius-md)', border: '1px dashed var(--border-color)' }}>
                <Camera size={32} className="text-muted" />
                <p className="text-muted" style={{ margin: 0 }}>No scan history found. Try taking a skin scan!</p>
                <button className="btn-primary btn-sm mt-1" onClick={() => navigate('/scan')}>Start First Scan</button>
              </div>
            ) : (
              scans.map(scan => (
                <div key={scan.id} className="history-item glass flex-between" style={{ padding: '1rem', borderRadius: 'var(--radius-md)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                    <div style={{ width: '48px', height: '48px', borderRadius: '8px', overflow: 'hidden', background: 'var(--bg-dark)' }}>
                      {scan.image_url ? (
                        <img src={scan.image_url} alt="Scan thumbnail" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                      ) : (
                        <div className="flex-center" style={{ width: '100%', height: '100%' }}><Activity size={20} className="text-muted" /></div>
                      )}
                    </div>
                    <div>
                      <p className="font-medium m-0" style={{ marginBottom: '0.25rem' }}>{scan.prediction}</p>
                      <p className="text-sm text-muted m-0">{new Date(scan.created_at).toLocaleDateString()}</p>
                    </div>
                  </div>
                  <div className={`badge ${scan.severity === 'HIGH' ? 'bg-danger text-white' : scan.severity === 'MEDIUM' ? 'bg-warning text-white' : 'bg-success text-white'}`} style={{ padding: '4px 10px', borderRadius: '12px', fontSize: '0.75rem', fontWeight: 'bold', background: scan.severity === 'HIGH' ? 'var(--danger)' : scan.severity === 'MEDIUM' ? 'var(--warning)' : 'var(--success)' }}>
                    {scan.severity || 'LOW'} RISK
                  </div>
                </div>
              ))
            )}
            {scans.length > 0 && (
              <button className="btn-link mt-2 full-width text-center" onClick={() => navigate('/history')} style={{ marginTop: '0.5rem' }}>
                View Full Reports
              </button>
            )}
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default PatientDashboard;
