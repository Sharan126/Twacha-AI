import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import {
  User, Stethoscope, Mail, Lock, LogIn, UserPlus,
  Phone, Building, ShieldCheck, ArrowLeft, Eye, EyeOff,
  AlertCircle, CheckCircle, Loader
} from 'lucide-react';
import { useAppContext } from '../context/AppContext';
import { useAuth } from '../context/AuthContext';
import './Auth.css';

const Auth = () => {
  const { t, setIsWalkthroughActive } = useAppContext();
  const { signUp, signIn, profile, isAuthenticated, markFirstLoginDone } = useAuth();
  const navigate = useNavigate();

  const [activeRole, setActiveRole] = useState('user');
  const [authMode, setAuthMode] = useState('register');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [apiError, setApiError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  const [formData, setFormData] = useState({
    email: '',
    password: '',
    name: '',
    phone: '',
    regNumber: '',
    specialization: '',
    hospital: ''
  });
  const [errors, setErrors] = useState({});

  // If already authenticated, redirect
  useEffect(() => {
    if (isAuthenticated && profile) {
      if (profile.role === 'doctor' && !profile.is_verified) return; // stay on page to show message
      navigate('/');
    }
  }, [isAuthenticated, profile]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    if (errors[name]) setErrors(prev => ({ ...prev, [name]: '' }));
    if (apiError) setApiError('');
  };

  const validateForm = () => {
    const newErrors = {};
    if (!formData.email) newErrors.email = 'Email is required';
    else if (!/\S+@\S+\.\S+/.test(formData.email)) newErrors.email = 'Invalid email address';

    if (!formData.password) newErrors.password = 'Password is required';
    else if (formData.password.length < 6) newErrors.password = 'At least 6 characters';

    if (authMode === 'register') {
      if (!formData.name) newErrors.name = 'Full name is required';
      if (activeRole === 'doctor') {
        if (!formData.regNumber) newErrors.regNumber = 'Registration number is required';
        if (!formData.specialization) newErrors.specialization = 'Please select a specialization';
        if (!formData.hospital) newErrors.hospital = 'Hospital/Clinic name is required';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    setLoading(true);
    setApiError('');
    setSuccessMsg('');

    if (authMode === 'register') {
      const { data, error } = await signUp({
        email: formData.email,
        password: formData.password,
        name: formData.name,
        role: activeRole,
        // Doctor extra fields — passed to step 2 update (not to auth.signUp)
        specialization: formData.specialization,
        regNumber: formData.regNumber,
        clinicName: formData.hospital,
      });

      if (error) {
        setApiError(error.message);
      } else {
        setSuccessMsg(
          activeRole === 'doctor'
            ? 'Account created! Check your email to verify your address. Your account will be reviewed before activation.'
            : 'Account created! Please check your email to verify your address, then log in.'
        );
        setAuthMode('login');
      }
    } else {
      // Login
      const { data, error } = await signIn({
        email: formData.email,
        password: formData.password,
      });

      if (error) {
        setApiError(error.message);
      }
      // Navigation handled by useEffect watching isAuthenticated + profile
    }

    setLoading(false);
  };

  // After login, handle first-time tour + doctor verification block
  if (isAuthenticated && profile) {
    if (profile.role === 'doctor' && !profile.is_verified) {
      return (
        <div className="auth-page-wrapper">
          <div className="auth-container">
            <motion.div
              className="auth-card glass"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
            >
              <div className="verification-pending">
                <div className="verify-icon">
                  <ShieldCheck size={48} />
                </div>
                <h2>Account Under Verification</h2>
                <p className="text-muted">
                  Your doctor account is currently being reviewed by our team.
                  This usually takes 1–2 business days. You'll receive an email once your account is approved.
                </p>
                <div className="verify-details glass-card">
                  <p><strong>Name:</strong> {profile.name}</p>
                  <p><strong>Specialization:</strong> {profile.specialization}</p>
                  <p><strong>Reg. Number:</strong> {profile.registration_number}</p>
                </div>
                <button
                  className="btn-secondary full-width"
                  onClick={() => { signOut && navigate('/'); }}
                  style={{ marginTop: '1.5rem' }}
                >
                  Back to Home
                </button>
              </div>
            </motion.div>
          </div>
        </div>
      );
    }

    // First-time login — trigger walkthrough
    if (profile.is_first_login) {
      markFirstLoginDone();
      setIsWalkthroughActive(true);
      navigate('/');
      return null;
    }
  }

  const toggleMode = () => {
    setAuthMode(prev => prev === 'login' ? 'register' : 'login');
    setErrors({});
    setApiError('');
    setSuccessMsg('');
  };

  const tabVariants = {
    enter: (direction) => ({ x: direction > 0 ? 300 : -300, opacity: 0 }),
    center: { x: 0, opacity: 1 },
    exit: (direction) => ({ x: direction < 0 ? 300 : -300, opacity: 0 })
  };

  const direction = activeRole === 'user' ? -1 : 1;

  return (
    <div className="auth-page-wrapper">
      <button className="back-btn glass" onClick={() => navigate('/')}>
        <ArrowLeft size={20} /> {t('auth.backToHome')}
      </button>

      <div className="auth-container">
        <motion.div
          className="auth-card glass"
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
        >
          <div className="auth-header">
            <h2>{authMode === 'login' ? t('auth.welcomeBack') : t('auth.createAccount')}</h2>
            <p className="text-muted">
              {authMode === 'login' ? t('auth.signInSubtitle') : t('auth.registerSubtitle')}
            </p>
          </div>

          {/* Role Toggle */}
          <div className="role-tabs">
            <div
              className={`tab ${activeRole === 'user' ? 'active' : ''}`}
              onClick={() => { setActiveRole('user'); setErrors({}); setApiError(''); }}
            >
              <User size={18} /> {t('auth.user')}
            </div>
            <div
              className={`tab ${activeRole === 'doctor' ? 'active' : ''}`}
              onClick={() => { setActiveRole('doctor'); setErrors({}); setApiError(''); }}
            >
              <Stethoscope size={18} /> {t('auth.doctor')}
            </div>
            <motion.div
              className="tab-indicator"
              layout
              initial={false}
              animate={{ left: activeRole === 'user' ? '4px' : 'calc(50% + 2px)', width: 'calc(50% - 6px)' }}
              transition={{ type: 'spring', stiffness: 300, damping: 30 }}
            />
          </div>

          {/* API Error / Success Banner */}
          {apiError && (
            <motion.div
              className="auth-alert error"
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
            >
              <AlertCircle size={16} /> {apiError}
            </motion.div>
          )}
          {successMsg && (
            <motion.div
              className="auth-alert success"
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
            >
              <CheckCircle size={16} /> {successMsg}
            </motion.div>
          )}

          {/* Form */}
          <div className="auth-form-container">
            <AnimatePresence custom={direction} mode="wait">
              <motion.form
                key={activeRole + authMode}
                className="auth-form"
                custom={direction}
                variants={tabVariants}
                initial="enter"
                animate="center"
                exit="exit"
                transition={{ duration: 0.25 }}
                onSubmit={handleSubmit}
              >
                {/* Register: Name field (both roles) */}
                {authMode === 'register' && (
                  <div className="form-group">
                    <label>Full Name</label>
                    <div className={`input-with-icon ${errors.name ? 'has-error' : ''}`}>
                      <User size={18} className="input-icon" />
                      <input
                        type="text"
                        name="name"
                        placeholder={activeRole === 'doctor' ? 'Dr. John Doe' : 'Jane Doe'}
                        value={formData.name}
                        onChange={handleInputChange}
                      />
                    </div>
                    {errors.name && <span className="error-text">{errors.name}</span>}
                  </div>
                )}

                {/* Doctor-specific register fields */}
                {authMode === 'register' && activeRole === 'doctor' && (
                  <>
                    <div className="form-group">
                      <label>Phone Number</label>
                      <div className={`input-with-icon ${errors.phone ? 'has-error' : ''}`}>
                        <Phone size={18} className="input-icon" />
                        <input type="tel" name="phone" placeholder="+91 9876543210" value={formData.phone} onChange={handleInputChange} />
                      </div>
                      {errors.phone && <span className="error-text">{errors.phone}</span>}
                    </div>

                    <div className="form-group">
                      <label>Medical Registration Number <span className="text-danger">*</span></label>
                      <div className={`input-with-icon ${errors.regNumber ? 'has-error' : ''}`}>
                        <ShieldCheck size={18} className="input-icon" />
                        <input type="text" name="regNumber" placeholder="e.g. KMC123456" value={formData.regNumber} onChange={handleInputChange} />
                      </div>
                      {errors.regNumber && <span className="error-text">{errors.regNumber}</span>}
                    </div>

                    <div className="form-group">
                      <label>Specialization</label>
                      <div className={`input-with-icon ${errors.specialization ? 'has-error' : ''}`}>
                        <Stethoscope size={18} className="input-icon" />
                        <select name="specialization" value={formData.specialization} onChange={handleInputChange}>
                          <option value="">Select Specialization</option>
                          <option value="Dermatologist">Dermatologist</option>
                          <option value="Cosmetologist">Cosmetologist</option>
                          <option value="Trichologist">Trichologist</option>
                        </select>
                      </div>
                      {errors.specialization && <span className="error-text">{errors.specialization}</span>}
                    </div>

                    <div className="form-group">
                      <label>Hospital/Clinic Name</label>
                      <div className={`input-with-icon ${errors.hospital ? 'has-error' : ''}`}>
                        <Building size={18} className="input-icon" />
                        <input type="text" name="hospital" placeholder="SkinCare Clinic" value={formData.hospital} onChange={handleInputChange} />
                      </div>
                      {errors.hospital && <span className="error-text">{errors.hospital}</span>}
                    </div>
                  </>
                )}

                {/* Email */}
                <div className="form-group">
                  <label>{authMode === 'login' ? t('auth.emailPhone') : t('auth.email')}</label>
                  <div className={`input-with-icon ${errors.email ? 'has-error' : ''}`}>
                    <Mail size={18} className="input-icon" />
                    <input type="text" name="email" placeholder="john@example.com" value={formData.email} onChange={handleInputChange} />
                  </div>
                  {errors.email && <span className="error-text">{errors.email}</span>}
                </div>

                {/* Password */}
                <div className="form-group">
                  <label>{t('auth.password')}</label>
                  <div className={`input-with-icon ${errors.password ? 'has-error' : ''}`}>
                    <Lock size={18} className="input-icon" />
                    <input
                      type={showPassword ? 'text' : 'password'}
                      name="password"
                      placeholder="••••••••"
                      value={formData.password}
                      onChange={handleInputChange}
                    />
                    <button
                      type="button"
                      className="password-toggle"
                      onClick={() => setShowPassword(p => !p)}
                      tabIndex={-1}
                    >
                      {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                  {errors.password && <span className="error-text">{errors.password}</span>}
                </div>

                {authMode === 'login' && (
                  <div className="auth-helpers flex-between">
                    <label className="flex-center gap-sm" style={{ gap: '0.4rem' }}>
                      <input type="checkbox" /> {t('auth.rememberMe')}
                    </label>
                    <a href="#" className="text-primary text-sm font-medium">{t('auth.forgotPassword')}</a>
                  </div>
                )}

                {authMode === 'register' && activeRole === 'doctor' && (
                  <div className="doctor-verification-note glass-card bg-warning-light">
                    <ShieldCheck size={20} className="text-warning" />
                    <p className="text-sm">Doctor accounts are manually verified before activation. Ensure all details are accurate.</p>
                  </div>
                )}

                <button
                  type="submit"
                  className="btn-primary full-width flex-center mt-1"
                  style={{ gap: '0.5rem', height: '48px' }}
                  disabled={loading}
                >
                  {loading
                    ? <><Loader size={18} className="spin" /> Processing...</>
                    : authMode === 'login'
                      ? <><LogIn size={18} /> {t('auth.login')}</>
                      : <><UserPlus size={18} /> {t('auth.registerAs')} {activeRole === 'doctor' ? t('auth.doctor') : t('auth.user')}</>
                  }
                </button>
              </motion.form>
            </AnimatePresence>
          </div>

          <div className="auth-footer text-center mt-2">
            <p className="text-muted text-sm">
              {authMode === 'login' ? t('auth.noAccount') : t('auth.haveAccount')}{' '}
              <button type="button" className="text-primary font-medium btn-link" onClick={toggleMode}>
                {authMode === 'login' ? t('auth.signUpHere') : t('auth.loginHere')}
              </button>
            </p>

            {authMode === 'login' && activeRole === 'user' && (
              <div className="social-login mt-2">
                <div className="divider"><span>{t('auth.orContinueWith')}</span></div>
                <button type="button" className="btn-secondary full-width flex-center mt-1">
                  <img src="https://upload.wikimedia.org/wikipedia/commons/5/53/Google_%22G%22_Logo.svg" alt="Google" width="18" height="18" style={{ marginRight: '8px' }} />
                  {t('auth.googleLogin')}
                </button>
              </div>
            )}
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default Auth;
