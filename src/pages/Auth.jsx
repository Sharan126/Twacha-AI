import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import {
  User, Stethoscope, Phone, ShieldCheck, ArrowLeft,
  AlertCircle, CheckCircle, Loader, Key
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useTranslation } from 'react-i18next';
import './Auth.css';

const Auth = () => {
  const { t } = useTranslation();
  const { sendOtp, verifyOtp, completeProfile, profile, isAuthenticated, session } = useAuth();
  const navigate = useNavigate();

  const [step, setStep] = useState('phone'); // 'phone', 'otp', 'role'
  const [phone, setPhone] = useState('');
  const [otp, setOtp] = useState('');
  
  // Profile completion fields
  const [activeRole, setActiveRole] = useState('patient');
  const [name, setName] = useState('');

  const [loading, setLoading] = useState(false);
  const [apiError, setApiError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // Redirection logic
  useEffect(() => {
    if (isAuthenticated && profile) {
      if (profile.role === 'doctor') {
        navigate('/doctor-dashboard');
      } else if (profile.role === 'patient') {
        navigate('/patient-dashboard');
      } else {
        // Needs to select role
        setStep('role');
      }
    } else if (isAuthenticated && !profile) {
      // Authenticated but profile is strictly null (new user row hasn't synced or needs info)
      setStep('role');
    }
  }, [isAuthenticated, profile, navigate]);

  const handleSendOtp = async (e) => {
    e.preventDefault();
    if (!phone || phone.length < 10) {
      setApiError('Please enter a valid mobile number with country code (e.g., +919876543210)');
      return;
    }

    setLoading(true);
    setApiError('');
    
    // Auto format + if missing for simplicity
    const formattedPhone = phone.startsWith('+') ? phone : `+91${phone}`;

    const { error } = await sendOtp(formattedPhone);
    setLoading(false);

    if (error) {
      setApiError(error.message);
    } else {
      setSuccessMsg('OTP sent successfully via SMS');
      setPhone(formattedPhone);
      setStep('otp');
    }
  };

  const handleVerifyOtp = async (e) => {
    e.preventDefault();
    if (!otp || otp.length < 6) {
      setApiError('Please enter the 6-digit OTP');
      return;
    }

    setLoading(true);
    setApiError('');
    setSuccessMsg('');

    const { data, error } = await verifyOtp(phone, otp);
    setLoading(false);

    if (error) {
      setApiError(error.message);
    }
    // Success will trigger useEffect above
  };

  const handleCompleteProfile = async (e) => {
    e.preventDefault();
    if (!name) {
      setApiError('Please enter your full name');
      return;
    }

    setLoading(true);
    setApiError('');

    if (!session?.user?.id) {
       setApiError('Session not found. Please log in again.');
       setLoading(false);
       return;
    }
    
    let result = null;
    let retries = 4;
    let delay = 500;

    while (retries > 0) {
      result = await completeProfile(session.user.id, {
        full_name: name,
        role: activeRole,
        is_first_login: true
      });

      // Break immediately if successful or if the error is NOT a lock error
      if (!result.error || !result.error.message?.includes('lock:sb-')) {
        break;
      }
      
      console.warn(`Token lock collision! Retrying in ${delay}ms...`);
      await new Promise(res => setTimeout(res, delay));
      delay *= 2; // exponential backoff
      retries--;
    }

    setLoading(false);

    if (result.error) {
      setApiError(result.error.message);
    } else {
      if (activeRole === 'doctor') {
        navigate('/doctor-dashboard');
      } else {
        navigate('/patient-dashboard');
      }
    }
  };

  return (
    <div className="auth-page-wrapper">
      <button className="back-btn glass" onClick={() => navigate('/')}>
        <ArrowLeft size={20} /> Back to Home
      </button>

      <div className="auth-container">
        <motion.div
          className="auth-card glass"
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <div className="auth-header">
            <h2>
              {step === 'phone' && 'Login / Register'}
              {step === 'otp' && 'Verify OTP'}
              {step === 'role' && 'Complete Profile'}
            </h2>
            <p className="text-muted">
              {step === 'phone' && 'Enter your mobile number to get an OTP'}
              {step === 'otp' && `Sent to ${phone}`}
              {step === 'role' && 'Tell us a bit about yourself'}
            </p>
          </div>

          {/* Alerts */}
          {apiError && (
            <motion.div className="auth-alert error" initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }}>
              <AlertCircle size={16} /> {apiError}
            </motion.div>
          )}
          {successMsg && (
            <motion.div className="auth-alert success" initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }}>
              <CheckCircle size={16} /> {successMsg}
            </motion.div>
          )}

          <div className="auth-form-container">
            <AnimatePresence mode="wait">
              
              {/* STEP 1: PHONE */}
              {step === 'phone' && (
                <motion.form key="phone" initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }} onSubmit={handleSendOtp} className="auth-form">
                  <div className="form-group">
                    <label>Mobile Number</label>
                    <div className="input-with-icon">
                      <Phone size={18} className="input-icon" />
                      <input type="tel" placeholder="+91 9876543210" value={phone} onChange={e => setPhone(e.target.value)} />
                    </div>
                  </div>
                  <button type="submit" className="btn-primary full-width flex-center mt-1" disabled={loading}>
                    {loading ? <Loader size={18} className="spin" /> : 'Send OTP'}
                  </button>
                </motion.form>
              )}

              {/* STEP 2: OTP */}
              {step === 'otp' && (
                <motion.form key="otp" initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }} onSubmit={handleVerifyOtp} className="auth-form">
                  <div className="form-group">
                    <label>6-Digit OTP</label>
                    <div className="input-with-icon">
                      <Key size={18} className="input-icon" />
                      <input type="text" placeholder="123456" maxLength={6} value={otp} onChange={e => setOtp(e.target.value)} />
                    </div>
                  </div>
                  <button type="submit" className="btn-primary full-width flex-center mt-1" disabled={loading}>
                    {loading ? <Loader size={18} className="spin" /> : 'Verify & Login'}
                  </button>
                  <button type="button" className="btn-link mt-1 text-center full-width text-sm" onClick={() => { setStep('phone'); setOtp(''); setApiError(''); setSuccessMsg(''); }}>
                    Change Mobile Number
                  </button>
                </motion.form>
              )}

              {/* STEP 3: ROLE SELECTION */}
              {step === 'role' && (
                <motion.form key="role" initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }} onSubmit={handleCompleteProfile} className="auth-form">
                  <div className="role-tabs mb-2">
                    <div className={`tab ${activeRole === 'patient' ? 'active' : ''}`} onClick={() => setActiveRole('patient')}>
                      <User size={18} /> Patient
                    </div>
                    <div className={`tab ${activeRole === 'doctor' ? 'active' : ''}`} onClick={() => setActiveRole('doctor')}>
                      <Stethoscope size={18} /> Doctor
                    </div>
                    <motion.div className="tab-indicator" layout initial={false} animate={{ left: activeRole === 'patient' ? '4px' : 'calc(50% + 2px)', width: 'calc(50% - 6px)' }} transition={{ type: 'spring' }} />
                  </div>

                  <div className="form-group">
                    <label>Full Name</label>
                    <div className="input-with-icon">
                      <User size={18} className="input-icon" />
                      <input type="text" placeholder={activeRole === 'doctor' ? 'Dr. John Doe' : 'Jane Doe'} value={name} onChange={e => setName(e.target.value)} />
                    </div>
                  </div>

                  {activeRole === 'doctor' && (
                    <div className="doctor-verification-note glass-card bg-primary-light mt-1 mb-1" style={{ padding: '1rem', borderRadius: 'var(--radius-md)', background: 'rgba(79,70,229,0.1)' }}>
                      <ShieldCheck size={20} className="text-primary mb-1" />
                      <p className="text-sm">You can complete your professional details (Specialization, Experience, Clinic) in your dashboard after registration.</p>
                    </div>
                  )}

                  <button type="submit" className="btn-primary full-width flex-center mt-1" disabled={loading}>
                    {loading ? <Loader size={18} className="spin" /> : 'Complete Setup'}
                  </button>
                </motion.form>
              )}

            </AnimatePresence>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default Auth;
