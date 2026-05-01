import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import {
  User, Stethoscope, Mail, Lock, LogIn, UserPlus,
  ArrowLeft, AlertCircle, CheckCircle, Loader, Eye, EyeOff
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useTranslation } from 'react-i18next';
import './Auth.css';

const Auth = () => {
  const { t } = useTranslation();
  const { signUp, signIn, profile, isAuthenticated } = useAuth();
  const navigate = useNavigate();

  const [authMode, setAuthMode] = useState('login'); // 'login' or 'register'
  const [activeRole, setActiveRole] = useState('user'); // for registration

  const [formData, setFormData] = useState({
    email: '',
    password: '',
    name: '',
  });

  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [apiError, setApiError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // Redirection logic
  useEffect(() => {
    if (isAuthenticated && profile) {
      if (profile.role === 'doctor') {
        navigate('/doctor-dashboard');
      } else {
        navigate('/patient-dashboard');
      }
    }
  }, [isAuthenticated, profile, navigate]);

  const handleInputChange = (e) => {
    setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
    setApiError('');
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    if (!formData.email || !formData.password) {
      setApiError('Please enter both email and password');
      return;
    }

    setLoading(true);
    setApiError('');
    
    const { error } = await signIn({
      email: formData.email,
      password: formData.password
    });

    setLoading(false);

    if (error) {
      setApiError(error.message);
    }
    // Success will trigger useEffect above
  };

  const handleSignup = async (e) => {
    e.preventDefault();
    if (!formData.email || formData.password.length < 6 || !formData.name) {
      setApiError('Please fill all fields. Password must be at least 6 characters.');
      return;
    }

    setLoading(true);
    setApiError('');
    setSuccessMsg('');

    const { error } = await signUp({
      email: formData.email,
      password: formData.password,
      name: formData.name,
      role: activeRole
    });

    setLoading(false);

    if (error) {
      setApiError(error.message);
    } else {
      setSuccessMsg('Account created successfully! You can now log in.');
      setAuthMode('login');
      setFormData(prev => ({ ...prev, password: '' }));
    }
  };

  const toggleMode = () => {
    setAuthMode(prev => prev === 'login' ? 'register' : 'login');
    setApiError('');
    setSuccessMsg('');
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
            <h2>Login / Register</h2>
            <p className="text-muted">
              {authMode === 'login' ? 'Sign in to your account' : 'Create a new account'}
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
              <motion.form 
                key={authMode} 
                initial={{ opacity: 0, x: -20 }} 
                animate={{ opacity: 1, x: 0 }} 
                exit={{ opacity: 0, x: 20 }} 
                onSubmit={authMode === 'login' ? handleLogin : handleSignup} 
                className="auth-form"
              >
                
                {/* ROLE SELECTION (Register Only) */}
                {authMode === 'register' && (
                  <div className="role-tabs mb-2">
                    <div className={`tab ${activeRole === 'user' ? 'active' : ''}`} onClick={() => setActiveRole('user')}>
                      <User size={18} /> Patient
                    </div>
                    <div className={`tab ${activeRole === 'doctor' ? 'active' : ''}`} onClick={() => setActiveRole('doctor')}>
                      <Stethoscope size={18} /> Doctor
                    </div>
                    <motion.div className="tab-indicator" layout initial={false} animate={{ left: activeRole === 'user' ? '4px' : 'calc(50% + 2px)', width: 'calc(50% - 6px)' }} transition={{ type: 'spring' }} />
                  </div>
                )}

                {/* NAME (Register Only) */}
                {authMode === 'register' && (
                  <div className="form-group">
                    <label>Full Name</label>
                    <div className="input-with-icon">
                      <User size={18} className="input-icon" />
                      <input type="text" name="name" placeholder={activeRole === 'doctor' ? 'Dr. John Doe' : 'Jane Doe'} value={formData.name} onChange={handleInputChange} />
                    </div>
                  </div>
                )}

                <div className="form-group">
                  <label>Email Address</label>
                  <div className="input-with-icon">
                    <Mail size={18} className="input-icon" />
                    <input type="email" name="email" placeholder="john@example.com" value={formData.email} onChange={handleInputChange} />
                  </div>
                </div>

                <div className="form-group">
                  <label>Password</label>
                  <div className="input-with-icon">
                    <Lock size={18} className="input-icon" />
                    <input 
                      type={showPassword ? "text" : "password"} 
                      name="password" 
                      placeholder="••••••••" 
                      value={formData.password} 
                      onChange={handleInputChange} 
                    />
                    <button type="button" className="password-toggle" onClick={() => setShowPassword(!showPassword)}>
                      {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                  {authMode === 'register' && <p className="text-sm text-muted mt-1" style={{fontSize: '0.75rem'}}>Minimum 6 characters</p>}
                </div>

                {authMode === 'login' && (
                  <div className="auth-helpers flex-between mt-1 mb-1">
                    <label className="flex-center gap-sm" style={{ gap: '0.4rem', fontSize: '0.85rem' }}>
                      <input type="checkbox" /> Remember me
                    </label>
                    <a href="#" className="text-primary font-medium" style={{ fontSize: '0.85rem' }}>Forgot Password?</a>
                  </div>
                )}

                <button type="submit" className="btn-primary full-width flex-center mt-2" disabled={loading}>
                  {loading ? <Loader size={18} className="spin" /> : (
                    authMode === 'login' ? <><LogIn size={18} /> Login</> : <><UserPlus size={18} /> Create Account</>
                  )}
                </button>

                <div className="text-center mt-2">
                  <p className="text-muted text-sm">
                    {authMode === 'login' ? "Don't have an account?" : "Already have an account?"}{' '}
                    <button type="button" className="btn-link font-medium" onClick={toggleMode}>
                      {authMode === 'login' ? "Sign up here" : "Login here"}
                    </button>
                  </p>
                </div>

              </motion.form>
            </AnimatePresence>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default Auth;
