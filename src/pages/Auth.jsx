import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { User, Stethoscope, Mail, Lock, LogIn, UserPlus, Phone, Building, ShieldCheck, ArrowLeft } from 'lucide-react';
import { useAppContext } from '../context/AppContext';
import './Auth.css';

const Auth = () => {
  const { setIsAuthenticated, setUser } = useAppContext();
  const navigate = useNavigate();

  const [activeRole, setActiveRole] = useState('user'); // 'user' | 'doctor'
  const [authMode, setAuthMode] = useState('login'); // 'login' | 'register'
  
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

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    // Clear error when user types
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const validateForm = () => {
    const newErrors = {};
    if (!formData.email) newErrors.email = 'Email is required';
    else if (!/\S+@\S+\.\S+/.test(formData.email)) newErrors.email = 'Email address is invalid';
    
    if (!formData.password) newErrors.password = 'Password is required';
    else if (formData.password.length < 6) newErrors.password = 'Password must be at least 6 characters';

    if (authMode === 'register') {
      if (activeRole === 'doctor') {
        if (!formData.name) newErrors.name = 'Full Name is required';
        if (!formData.phone) newErrors.phone = 'Phone number is required';
        if (!formData.regNumber) newErrors.regNumber = 'Medical Registration Number is required';
        if (!formData.specialization) newErrors.specialization = 'Please select a specialization';
        if (!formData.hospital) newErrors.hospital = 'Hospital/Clinic name is required';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (validateForm()) {
      // Simulate API call
      setIsAuthenticated(true);
      setUser({
        name: authMode === 'register' ? formData.name || (activeRole === 'doctor' ? 'Dr. Smith' : 'User') : (activeRole === 'doctor' ? 'Dr. Smith' : 'User'),
        type: activeRole
      });
      navigate('/');
    }
  };

  const toggleMode = () => {
    setAuthMode(prev => prev === 'login' ? 'register' : 'login');
    setErrors({});
  };

  // Animation variants for sliding tabs
  const tabVariants = {
    enter: (direction) => ({
      x: direction > 0 ? 300 : -300,
      opacity: 0
    }),
    center: {
      x: 0,
      opacity: 1
    },
    exit: (direction) => ({
      x: direction < 0 ? 300 : -300,
      opacity: 0
    })
  };

  // Direction depends on the active role for the slide animation
  const direction = activeRole === 'user' ? -1 : 1;

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
          transition={{ duration: 0.5 }}
        >
          <div className="auth-header">
            <h2>{authMode === 'login' ? 'Welcome Back' : 'Create an Account'}</h2>
            <p className="text-muted">
              {authMode === 'login' 
                ? 'Sign in to access your Twacha AI dashboard' 
                : 'Join Twacha AI to get started'}
            </p>
          </div>

          {/* Role Toggle Tabs */}
          <div className="role-tabs">
            <div 
              className={`tab ${activeRole === 'user' ? 'active' : ''}`}
              onClick={() => { setActiveRole('user'); setErrors({}); }}
            >
              <User size={18} /> User
            </div>
            <div 
              className={`tab ${activeRole === 'doctor' ? 'active' : ''}`}
              onClick={() => { setActiveRole('doctor'); setErrors({}); }}
            >
              <Stethoscope size={18} /> Doctor
            </div>
            <motion.div 
              className="tab-indicator"
              layout
              initial={false}
              animate={{
                left: activeRole === 'user' ? '4px' : 'calc(50% + 2px)',
                width: 'calc(50% - 6px)'
              }}
              transition={{ type: "spring", stiffness: 300, damping: 30 }}
            />
          </div>

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
                transition={{ duration: 0.3 }}
                onSubmit={handleSubmit}
              >
                {authMode === 'register' && activeRole === 'doctor' && (
                  <>
                    <div className="form-group">
                      <label>Full Name</label>
                      <div className={`input-with-icon ${errors.name ? 'has-error' : ''}`}>
                        <User size={18} className="input-icon" />
                        <input type="text" name="name" placeholder="Dr. John Doe" value={formData.name} onChange={handleInputChange} />
                      </div>
                      {errors.name && <span className="error-text">{errors.name}</span>}
                    </div>

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

                <div className="form-group">
                  <label>{authMode === 'login' ? 'Email / Phone' : 'Email Address'}</label>
                  <div className={`input-with-icon ${errors.email ? 'has-error' : ''}`}>
                    <Mail size={18} className="input-icon" />
                    <input type="text" name="email" placeholder="john@example.com" value={formData.email} onChange={handleInputChange} />
                  </div>
                  {errors.email && <span className="error-text">{errors.email}</span>}
                </div>

                <div className="form-group">
                  <label>Password</label>
                  <div className={`input-with-icon ${errors.password ? 'has-error' : ''}`}>
                    <Lock size={18} className="input-icon" />
                    <input type="password" name="password" placeholder="••••••••" value={formData.password} onChange={handleInputChange} />
                  </div>
                  {errors.password && <span className="error-text">{errors.password}</span>}
                </div>

                {authMode === 'login' && (
                  <div className="auth-helpers flex-between">
                    <label className="flex-center gap-sm">
                      <input type="checkbox" /> Remember me
                    </label>
                    <a href="#" className="text-primary text-sm font-medium">Forgot password?</a>
                  </div>
                )}

                {authMode === 'register' && activeRole === 'doctor' && (
                  <div className="doctor-verification-note glass-card bg-warning-light">
                    <ShieldCheck size={20} className="text-warning" />
                    <p className="text-sm">Doctor accounts will be verified by our team before activation. Please ensure your registration details are accurate.</p>
                  </div>
                )}

                <button type="submit" className="btn-primary full-width flex-center mt-1" style={{ gap: '0.5rem', height: '48px' }}>
                  {authMode === 'login' ? <><LogIn size={18} /> Login</> : <><UserPlus size={18} /> Register as {activeRole === 'doctor' ? 'Doctor' : 'User'}</>}
                </button>
              </motion.form>
            </AnimatePresence>
          </div>

          <div className="auth-footer text-center mt-2">
            <p className="text-muted text-sm">
              {authMode === 'login' ? "Don't have an account? " : "Already have an account? "}
              <button type="button" className="text-primary font-medium btn-link" onClick={toggleMode}>
                {authMode === 'login' ? 'Sign up here' : 'Login here'}
              </button>
            </p>

            {authMode === 'login' && activeRole === 'user' && (
              <div className="social-login mt-2">
                <div className="divider"><span>Or continue with</span></div>
                <button type="button" className="btn-secondary full-width flex-center mt-1">
                  <img src="https://upload.wikimedia.org/wikipedia/commons/5/53/Google_%22G%22_Logo.svg" alt="Google" width="18" height="18" style={{marginRight: '8px'}} />
                  Google Login
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
