import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../config/supabaseClient';
import { User, Calendar, Save, Loader, Activity, Camera } from 'lucide-react';
import './Settings.css';

const PatientDashboard = () => {
  const { session, profile } = useAuth();
  const navigate = useNavigate();
  
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState({ type: '', text: '' });
  
  const [formData, setFormData] = useState({
    name: '',
    age: '',
    gender: 'Male',
    history: ''
  });

  const [scans, setScans] = useState([]);

  useEffect(() => {
    fetchPatientData();
  }, [session]);

  const fetchPatientData = async () => {
    if (!session?.user) return;
    
    setLoading(true);
    
    // Fetch patient profile
    const { data: pData } = await supabase
      .from('patients')
      .select('*')
      .eq('user_id', session.user.id)
      .single();

    if (pData) {
      setFormData({
        name: pData.name || profile?.full_name || '',
        age: pData.age || '',
        gender: pData.gender || 'Male',
        history: pData.history || ''
      });
    } else {
      setFormData(prev => ({ ...prev, name: profile?.full_name || '' }));
    }

    // Fetch scan history
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
      .from('patients')
      .upsert({
        user_id: session.user.id,
        name: formData.name,
        age: parseInt(formData.age) || null,
        gender: formData.gender,
        history: formData.history,
        updated_at: new Date().toISOString()
      });

    setSaving(false);

    if (error) {
      setMsg({ type: 'error', text: error.message });
    } else {
      setMsg({ type: 'success', text: 'Profile updated successfully!' });
    }
  };

  const handleChange = (e) => {
    setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  if (loading) {
    return <div className="flex-center" style={{ minHeight: '80vh' }}><Loader className="spin" /></div>;
  }

  return (
    <div className="settings-page">
      <div className="settings-header">
        <h1>Patient Dashboard</h1>
        <p className="text-muted">Manage your health profile and reports</p>
      </div>

      <div className="settings-grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '2rem' }}>
        <motion.div className="settings-card glass" initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }}>
          <div className="card-header">
            <h3 className="flex-center gap-sm"><User size={20} className="text-primary"/> Personal Details</h3>
          </div>
          
          {msg.text && (
            <div className={`auth-alert ${msg.type}`} style={{ marginBottom: '1rem' }}>
              {msg.text}
            </div>
          )}

          <form onSubmit={handleSave}>
            <div className="form-group">
              <label>Full Name</label>
              <div className="input-with-icon">
                <User size={18} className="input-icon" />
                <input type="text" name="name" value={formData.name} onChange={handleChange} required />
              </div>
            </div>

            <div className="form-group">
              <label>Age</label>
              <div className="input-with-icon">
                <Calendar size={18} className="input-icon" />
                <input type="number" name="age" value={formData.age} onChange={handleChange} min="0" />
              </div>
            </div>

            <div className="form-group">
              <label>Gender</label>
              <select name="gender" value={formData.gender} onChange={handleChange} className="w-full p-2 rounded border" style={{ background: 'transparent', color: 'var(--text-primary)', borderColor: 'var(--border-color)', height: '44px', width: '100%' }}>
                <option value="Male" style={{ background: 'var(--bg-card)' }}>Male</option>
                <option value="Female" style={{ background: 'var(--bg-card)' }}>Female</option>
                <option value="Other" style={{ background: 'var(--bg-card)' }}>Other</option>
              </select>
            </div>

            <div className="form-group">
              <label>Medical History</label>
              <textarea name="history" rows="3" placeholder="Any known allergies or past skin conditions..." value={formData.history} onChange={handleChange} className="w-full p-2 rounded border" style={{ background: 'transparent', color: 'var(--text-primary)', borderColor: 'var(--border-color)', width: '100%', resize: 'vertical' }}></textarea>
            </div>

            <button type="submit" className="btn-primary mt-2 full-width" disabled={saving}>
              {saving ? <Loader size={18} className="spin" /> : <><Save size={18} /> Save Profile</>}
            </button>
          </form>
        </motion.div>

        <motion.div className="settings-card glass" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }}>
          <div className="card-header flex-between" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h3 className="flex-center gap-sm"><Activity size={20} className="text-primary"/> Recent Scans</h3>
            <button className="btn-secondary btn-sm flex-center gap-sm" onClick={() => navigate('/scan')}>
              <Camera size={16} /> New Scan
            </button>
          </div>
          
          <div className="history-list mt-2">
            {scans.length === 0 ? (
              <p className="text-muted text-center py-4">No scan history found. Try taking a skin scan!</p>
            ) : (
              scans.map(scan => (
                <div key={scan.id} className="history-item flex-between" style={{ padding: '1rem', borderBottom: '1px solid var(--border-color)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <p className="font-medium m-0">{scan.prediction}</p>
                    <p className="text-sm text-muted m-0 mt-1">{new Date(scan.created_at).toLocaleDateString()}</p>
                  </div>
                  <div className={`badge ${scan.severity === 'HIGH' ? 'bg-danger text-white' : scan.severity === 'MEDIUM' ? 'bg-warning text-white' : 'bg-success text-white'}`} style={{ padding: '4px 8px', borderRadius: '12px', fontSize: '0.8rem', background: scan.severity === 'HIGH' ? 'var(--danger)' : scan.severity === 'MEDIUM' ? 'var(--warning)' : 'var(--success)' }}>
                    {scan.severity || 'LOW'} RISK
                  </div>
                </div>
              ))
            )}
            {scans.length > 0 && (
              <button className="btn-link mt-2 full-width text-center" onClick={() => navigate('/history')}>
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
