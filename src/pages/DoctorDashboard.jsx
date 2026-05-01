import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../config/supabaseClient';
import { User, Stethoscope, Building, Award, Save, Loader } from 'lucide-react';
import './Settings.css'; // Reuse Settings css for layout

const DoctorDashboard = () => {
  const { session, profile } = useAuth();
  
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState({ type: '', text: '' });
  
  const [formData, setFormData] = useState({
    name: '',
    specialization: '',
    experience: '',
    hospital: ''
  });

  useEffect(() => {
    fetchDoctorData();
  }, [session]);

  const fetchDoctorData = async () => {
    if (!session?.user) return;
    
    setLoading(true);
    const { data, error } = await supabase
      .from('doctors')
      .select('*')
      .eq('user_id', session.user.id)
      .single();

    if (data) {
      setFormData({
        name: data.name || profile?.full_name || '',
        specialization: data.specialization || '',
        experience: data.experience || '',
        hospital: data.hospital || ''
      });
    } else {
      // Initialize with base profile data if new
      setFormData(prev => ({ ...prev, name: profile?.full_name || '' }));
    }
    setLoading(false);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    setMsg({ type: '', text: '' });

    const { error } = await supabase
      .from('doctors')
      .upsert({
        user_id: session.user.id,
        name: formData.name,
        specialization: formData.specialization,
        experience: parseInt(formData.experience) || 0,
        hospital: formData.hospital,
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
        <h1>Doctor Dashboard</h1>
        <p className="text-muted">Manage your professional profile</p>
      </div>

      <div className="settings-grid">
        <motion.div className="settings-card glass" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <div className="card-header">
            <h3 className="flex-center gap-sm"><Stethoscope size={20} className="text-primary"/> Professional Details</h3>
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
              <label>Specialization</label>
              <div className="input-with-icon">
                <Stethoscope size={18} className="input-icon" />
                <input type="text" name="specialization" placeholder="e.g. Dermatologist" value={formData.specialization} onChange={handleChange} required />
              </div>
            </div>

            <div className="form-group">
              <label>Experience (Years)</label>
              <div className="input-with-icon">
                <Award size={18} className="input-icon" />
                <input type="number" name="experience" placeholder="e.g. 5" value={formData.experience} onChange={handleChange} min="0" required />
              </div>
            </div>

            <div className="form-group">
              <label>Hospital / Clinic</label>
              <div className="input-with-icon">
                <Building size={18} className="input-icon" />
                <input type="text" name="hospital" placeholder="e.g. City Care" value={formData.hospital} onChange={handleChange} required />
              </div>
            </div>

            <button type="submit" className="btn-primary mt-2" disabled={saving}>
              {saving ? <Loader size={18} className="spin" /> : <><Save size={18} /> Save Profile</>}
            </button>
          </form>
        </motion.div>
      </div>
    </div>
  );
};

export default DoctorDashboard;
