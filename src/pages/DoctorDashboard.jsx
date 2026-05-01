import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../config/supabaseClient';
import { 
  LayoutDashboard, Users, Calendar, MessageSquare, Settings, 
  Search, Activity, Clock, CheckCircle, XCircle, Plus, 
  Stethoscope, Save, Loader, AlertCircle, User, Building, Award
} from 'lucide-react';
import './DoctorDashboard.css';

const DoctorDashboard = () => {
  const { session, profile } = useAuth();
  const [activeTab, setActiveTab] = useState('overview');
  const [loading, setLoading] = useState(true);

  // Data States
  const [appointments, setAppointments] = useState([]);
  const [patients, setPatients] = useState([]);
  const [stats, setStats] = useState({ totalPatients: 0, appointmentsToday: 0, pending: 0, earnings: 0 });

  // Prescription State
  const [prescriptionModal, setPrescriptionModal] = useState({ isOpen: false, aptId: null, patientId: null });
  const [medicines, setMedicines] = useState([{ name: '', dosage: '', timing: 'morning' }]);
  const [prescriptionNotes, setPrescriptionNotes] = useState('');

  // Settings State
  const [formData, setFormData] = useState({
    name: '', specialization: '', experience: '', hospital: ''
  });
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState({ type: '', text: '' });

  useEffect(() => {
    if (session?.user) {
      fetchDashboardData();
    }
  }, [session]);

  const fetchDashboardData = async () => {
    setLoading(true);
    try {
      const doctorId = session.user.id;

      // 1. Fetch Doctor Profile Settings
      const { data: docData } = await supabase.from('profiles').select('*').eq('id', doctorId).single();
      if (docData) {
        setFormData({
          name: docData.full_name || '',
          specialization: docData.specialization || '',
          experience: docData.experience || '',
          hospital: docData.clinic_name || ''
        });
      }

      // 2. Fetch Appointments & Patients (Assuming Tables Exist - Will handle gracefully if not)
      const { data: aptData, error: aptError } = await supabase
        .from('appointments')
        .select(`*, patient:patient_id(full_name, age, gender)`)
        .eq('doctor_id', doctorId)
        .order('appointment_date', { ascending: true });

      if (!aptError && aptData) {
        setAppointments(aptData);
        
        // Calculate Stats
        const today = new Date().toISOString().split('T')[0];
        const todayApts = aptData.filter(a => a.appointment_date === today);
        const pendingApts = aptData.filter(a => a.status === 'pending');
        const acceptedApts = aptData.filter(a => a.status === 'accepted');

        // Extract unique patients from appointments
        const uniquePatients = [];
        const seenIds = new Set();
        aptData.forEach(a => {
          if (!seenIds.has(a.patient_id) && a.patient) {
            seenIds.add(a.patient_id);
            uniquePatients.push({
              id: a.patient_id,
              name: a.patient.full_name,
              age: a.patient.age,
              gender: a.patient.gender,
              lastVisit: a.appointment_date,
              status: a.status
            });
          }
        });
        setPatients(uniquePatients);

        setStats({
          totalPatients: uniquePatients.length,
          appointmentsToday: todayApts.length,
          pending: pendingApts.length,
          earnings: acceptedApts.length * 500 // ₹500 per accepted appt as baseline
        });
      } else {
        // Fallback stats if tables not set up yet
        setStats({ totalPatients: 0, appointmentsToday: 0, pending: 0, earnings: 0 });
      }

    } catch (error) {
      console.error("Error fetching doctor data:", error);
    }
    setLoading(false);
  };

  const handleUpdateStatus = async (id, newStatus) => {
    // Optimistic UI update
    setAppointments(prev => prev.map(a => a.id === id ? { ...a, status: newStatus } : a));
    
    // DB Update
    await supabase.from('appointments').update({ status: newStatus }).eq('id', id);
    fetchDashboardData(); // Refresh to recalculate stats
  };

  const handleSaveSettings = async (e) => {
    e.preventDefault();
    setSaving(true);
    setMsg({ type: '', text: '' });

    const { error } = await supabase
      .from('profiles')
      .upsert({
        id: session.user.id,
        full_name: formData.name,
        specialization: formData.specialization,
        experience: parseInt(formData.experience) || null,
        clinic_name: formData.hospital,
        updated_at: new Date().toISOString()
      });

    setSaving(false);
    if (error) {
      setMsg({ type: 'error', text: error.message });
    } else {
      setMsg({ type: 'success', text: 'Profile updated successfully!' });
      setTimeout(() => setMsg({ type: '', text: '' }), 3000);
    }
  };

  const handleAddMedicine = () => {
    setMedicines([...medicines, { name: '', dosage: '', timing: 'morning' }]);
  };

  const handleMedicineChange = (index, field, value) => {
    const updated = [...medicines];
    updated[index][field] = value;
    setMedicines(updated);
  };

  const handleSavePrescription = async () => {
    setSaving(true);
    const { error } = await supabase.from('prescriptions').insert([{
      appointment_id: prescriptionModal.aptId,
      doctor_id: session.user.id,
      patient_id: prescriptionModal.patientId,
      medicines: medicines,
      notes: prescriptionNotes
    }]);
    setSaving(false);
    if (!error) {
      alert('Prescription saved successfully!');
      setPrescriptionModal({ isOpen: false, aptId: null, patientId: null });
      setMedicines([{ name: '', dosage: '', timing: 'morning' }]);
      setPrescriptionNotes('');
    } else {
      alert('Failed to save: ' + error.message);
    }
  };

  if (loading) {
    return (
      <div className="flex-center" style={{ minHeight: '80vh', flexDirection: 'column', gap: '1rem' }}>
        <Loader size={40} className="spin text-primary" />
        <p className="text-muted">Loading your professional dashboard...</p>
      </div>
    );
  }

  return (
    <div className="doctor-dashboard-layout">
      {/* SIDEBAR */}
      <aside className="doctor-sidebar glass">
        <div className="sidebar-header">
          <h3>Dr. {formData.name.split(' ')[0] || 'Doctor'}</h3>
          <p className="text-sm text-muted">{formData.specialization || 'Specialist'}</p>
        </div>
        
        <nav className="sidebar-nav">
          <button className={`nav-btn ${activeTab === 'overview' ? 'active' : ''}`} onClick={() => setActiveTab('overview')}>
            <LayoutDashboard size={18} /> Overview
          </button>
          <button className={`nav-btn ${activeTab === 'appointments' ? 'active' : ''}`} onClick={() => setActiveTab('appointments')}>
            <Calendar size={18} /> Appointments
            {stats.pending > 0 && <span className="badge-count">{stats.pending}</span>}
          </button>
          <button className={`nav-btn ${activeTab === 'patients' ? 'active' : ''}`} onClick={() => setActiveTab('patients')}>
            <Users size={18} /> My Patients
          </button>
          <button className={`nav-btn ${activeTab === 'chat' ? 'active' : ''}`} onClick={() => setActiveTab('chat')}>
            <MessageSquare size={18} /> Chat & Scans
          </button>
          <button className={`nav-btn ${activeTab === 'settings' ? 'active' : ''}`} onClick={() => setActiveTab('settings')}>
            <Settings size={18} /> Settings
          </button>
        </nav>
      </aside>

      {/* MAIN CONTENT AREA */}
      <main className="doctor-main-content">
        <AnimatePresence mode="wait">
          
          {/* TAB: OVERVIEW */}
          {activeTab === 'overview' && (
            <motion.div key="overview" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
              <div className="content-header">
                <h2>Dashboard Overview</h2>
                <p className="text-muted">Welcome back! Here's what's happening today.</p>
              </div>

              <div className="metrics-grid">
                <div className="metric-card glass">
                  <div className="metric-icon bg-primary-light"><Users size={24} className="text-primary"/></div>
                  <div>
                    <p className="metric-label">Total Patients</p>
                    <h3 className="metric-value">{stats.totalPatients}</h3>
                  </div>
                </div>
                <div className="metric-card glass">
                  <div className="metric-icon bg-warning-light"><Calendar size={24} className="text-warning"/></div>
                  <div>
                    <p className="metric-label">Appts Today</p>
                    <h3 className="metric-value">{stats.appointmentsToday}</h3>
                  </div>
                </div>
                <div className="metric-card glass">
                  <div className="metric-icon bg-danger-light"><Activity size={24} className="text-danger"/></div>
                  <div>
                    <p className="metric-label">Pending Requests</p>
                    <h3 className="metric-value">{stats.pending}</h3>
                  </div>
                </div>
                <div className="metric-card glass">
                  <div className="metric-icon bg-success-light"><span style={{fontSize:'1.2rem', fontWeight:'bold', color:'var(--success)'}}>₹</span></div>
                  <div>
                    <p className="metric-label">Earnings (Est)</p>
                    <h3 className="metric-value">₹{stats.earnings}</h3>
                  </div>
                </div>
              </div>

              {/* Today's Appointments Preview */}
              <div className="glass-card mt-3" style={{ padding: '1.5rem' }}>
                <div className="flex-between mb-2">
                  <h3>Recent Appointment Requests</h3>
                  <button className="btn-link" onClick={() => setActiveTab('appointments')}>View All</button>
                </div>
                
                {appointments.filter(a => a.status === 'pending').length === 0 ? (
                  <div className="text-center py-3 text-muted">No pending requests.</div>
                ) : (
                  <div className="appointment-list">
                    {appointments.filter(a => a.status === 'pending').slice(0,3).map(apt => (
                      <div key={apt.id} className="apt-item flex-between">
                        <div>
                          <h4>{apt.patient?.full_name || 'Unknown Patient'}</h4>
                          <p className="text-sm text-muted"><Calendar size={14}/> {apt.appointment_date} <Clock size={14} className="ml-1"/> {apt.appointment_time}</p>
                        </div>
                        <div className="flex gap-sm">
                          <button className="btn-success btn-sm flex-center" onClick={() => handleUpdateStatus(apt.id, 'accepted')}><CheckCircle size={16}/></button>
                          <button className="btn-danger btn-sm flex-center" onClick={() => handleUpdateStatus(apt.id, 'rejected')}><XCircle size={16}/></button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </motion.div>
          )}

          {/* TAB: APPOINTMENTS */}
          {activeTab === 'appointments' && (
            <motion.div key="appointments" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
              <div className="content-header">
                <h2>Appointments & Prescriptions</h2>
              </div>
              <div className="glass-card" style={{ padding: '1.5rem' }}>
                {appointments.length === 0 ? (
                  <p className="text-muted text-center py-4">No appointments scheduled.</p>
                ) : (
                  <table className="doctor-table">
                    <thead>
                      <tr>
                        <th>Patient</th>
                        <th>Date & Time</th>
                        <th>Status</th>
                        <th>Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {appointments.map(apt => (
                        <tr key={apt.id}>
                          <td>{apt.patient?.full_name || 'Unknown'}</td>
                          <td>{apt.appointment_date} | {apt.appointment_time}</td>
                          <td>
                            <span className={`status-badge ${apt.status}`}>{apt.status}</span>
                          </td>
                          <td>
                            {apt.status === 'pending' && (
                              <div className="flex gap-sm">
                                <button className="btn-success btn-sm" onClick={() => handleUpdateStatus(apt.id, 'accepted')}>Accept</button>
                                <button className="btn-danger btn-sm" onClick={() => handleUpdateStatus(apt.id, 'rejected')}>Reject</button>
                              </div>
                            )}
                            {apt.status === 'accepted' && (
                              <button className="btn-primary btn-sm flex-center gap-sm" onClick={() => setPrescriptionModal({ isOpen: true, aptId: apt.id, patientId: apt.patient_id })}>
                                <Plus size={14}/> Prescription
                              </button>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
            </motion.div>
          )}

          {/* TAB: PATIENTS */}
          {activeTab === 'patients' && (
            <motion.div key="patients" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
              <div className="content-header flex-between">
                <h2>My Patients</h2>
                <div className="input-with-icon" style={{ width: '250px' }}>
                  <Search size={18} className="input-icon" />
                  <input type="text" placeholder="Search patients..." />
                </div>
              </div>
              <div className="glass-card" style={{ padding: '1.5rem' }}>
                {patients.length === 0 ? (
                   <p className="text-muted text-center py-4">No patients assigned yet.</p>
                ) : (
                  <div className="patient-grid">
                    {patients.map(p => (
                      <div key={p.id} className="patient-card">
                        <div className="pc-avatar"><User size={24}/></div>
                        <div className="pc-info">
                          <h4>{p.name || 'Unknown'}</h4>
                          <p className="text-sm text-muted">{p.age ? `${p.age} yrs` : 'Age N/A'} • {p.gender}</p>
                          <p className="text-xs text-primary mt-1">Last Visit: {p.lastVisit}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </motion.div>
          )}

          {/* TAB: CHAT & SCANS */}
          {activeTab === 'chat' && (
            <motion.div key="chat" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="chat-panel-container">
              <div className="glass-card flex-center flex-col" style={{ height: '60vh', gap: '1rem', textAlign: 'center' }}>
                 <MessageSquare size={48} className="text-primary opacity-50" />
                 <h3>Realtime Chat & Scan Analysis</h3>
                 <p className="text-muted max-w-md">Select a patient to view their uploaded AI skin scans, add your professional notes, and start a realtime consultation.</p>
                 <button className="btn-primary mt-1" onClick={() => setActiveTab('patients')}>Select a Patient</button>
              </div>
            </motion.div>
          )}

          {/* TAB: SETTINGS */}
          {activeTab === 'settings' && (
            <motion.div key="settings" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
              <div className="content-header">
                <h2>Profile Management</h2>
              </div>
              <div className="glass-card" style={{ padding: '2rem', maxWidth: '600px' }}>
                {msg.text && (
                  <div className={`auth-alert ${msg.type === 'error' ? 'error' : 'success'}`} style={{ marginBottom: '1.5rem' }}>
                    {msg.type === 'error' ? <AlertCircle size={16}/> : <CheckCircle size={16}/>} {msg.text}
                  </div>
                )}
                <form onSubmit={handleSaveSettings} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                  <div className="form-group" style={{ margin: 0 }}>
                    <label>Dr. Name</label>
                    <div className="input-with-icon">
                      <User size={18} className="input-icon" />
                      <input type="text" name="name" value={formData.name} onChange={(e)=>setFormData({...formData, name: e.target.value})} required />
                    </div>
                  </div>
                  <div className="form-group" style={{ margin: 0 }}>
                    <label>Specialization</label>
                    <div className="input-with-icon">
                      <Stethoscope size={18} className="input-icon" />
                      <input type="text" name="specialization" value={formData.specialization} onChange={(e)=>setFormData({...formData, specialization: e.target.value})} required />
                    </div>
                  </div>
                  <div className="form-group" style={{ margin: 0 }}>
                    <label>Experience (Years)</label>
                    <div className="input-with-icon">
                      <Award size={18} className="input-icon" />
                      <input type="number" name="experience" value={formData.experience} onChange={(e)=>setFormData({...formData, experience: e.target.value})} required />
                    </div>
                  </div>
                  <div className="form-group" style={{ margin: 0 }}>
                    <label>Clinic / Hospital</label>
                    <div className="input-with-icon">
                      <Building size={18} className="input-icon" />
                      <input type="text" name="hospital" value={formData.hospital} onChange={(e)=>setFormData({...formData, hospital: e.target.value})} required />
                    </div>
                  </div>
                  <button type="submit" className="btn-primary mt-1" disabled={saving}>
                    {saving ? <Loader size={18} className="spin" /> : <><Save size={18} /> Save Settings</>}
                  </button>
                </form>
              </div>
            </motion.div>
          )}

        </AnimatePresence>

        {/* PRESCRIPTION MODAL */}
        <AnimatePresence>
          {prescriptionModal.isOpen && (
            <div className="modal-overlay">
              <motion.div className="modal-content glass" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} style={{ maxWidth: '600px', width: '90%' }}>
                <div className="flex-between mb-2">
                  <h3 className="flex-center gap-sm"><Plus size={20} className="text-primary"/> Add Prescription</h3>
                  <button className="btn-link text-muted" onClick={() => setPrescriptionModal({isOpen: false, aptId: null, patientId: null})}><XCircle size={20}/></button>
                </div>

                <div className="medicines-list" style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginBottom: '1.5rem' }}>
                  {medicines.map((med, idx) => (
                    <div key={idx} className="flex gap-sm" style={{ alignItems: 'center' }}>
                      <input type="text" placeholder="Medicine Name" value={med.name} onChange={(e) => handleMedicineChange(idx, 'name', e.target.value)} style={{ flex: 2 }} />
                      <input type="text" placeholder="Dosage (e.g. 500mg)" value={med.dosage} onChange={(e) => handleMedicineChange(idx, 'dosage', e.target.value)} style={{ flex: 1 }} />
                      <select value={med.timing} onChange={(e) => handleMedicineChange(idx, 'timing', e.target.value)} style={{ flex: 1, padding: '0.5rem', borderRadius: 'var(--radius-sm)' }}>
                        <option value="morning">Morning</option>
                        <option value="afternoon">Afternoon</option>
                        <option value="night">Night</option>
                        <option value="morning_night">Morning + Night</option>
                      </select>
                    </div>
                  ))}
                  <button className="btn-secondary btn-sm" onClick={handleAddMedicine} style={{ alignSelf: 'flex-start' }}>+ Add Another Medicine</button>
                </div>

                <div className="form-group mb-2">
                  <label>Doctor Notes</label>
                  <textarea rows="3" placeholder="Take after meals..." value={prescriptionNotes} onChange={(e) => setPrescriptionNotes(e.target.value)} style={{ width: '100%', padding: '0.75rem', borderRadius: 'var(--radius-md)' }}></textarea>
                </div>

                <button className="btn-primary full-width flex-center" onClick={handleSavePrescription} disabled={saving}>
                  {saving ? <Loader size={18} className="spin" /> : 'Save Prescription'}
                </button>
              </motion.div>
            </div>
          )}
        </AnimatePresence>

      </main>
    </div>
  );
};

export default DoctorDashboard;
