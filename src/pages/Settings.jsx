import React from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { User, Bell, Shield, Globe, Moon, CreditCard, LogOut } from 'lucide-react';
import { useAppContext } from '../context/AppContext';
import { useAuth } from '../context/AuthContext';
import './Settings.css';

const Settings = () => {
  const { theme, toggleTheme, language, setLanguage, privacyMode, togglePrivacy, aiGuideEnabled, setAiGuideEnabled } = useAppContext();
  const { profile, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate('/');
  };

  return (
    <div className="settings-page container">
      <div className="page-header">
        <h2>Account Settings</h2>
      </div>

      <div className="settings-grid">
        <motion.div 
          className="settings-section glass-card"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <h3><User size={20} /> Profile Information</h3>
          <div className="setting-item">
            <div className="setting-info">
              <h4>Full Name</h4>
              <p className="text-muted">{profile?.name || 'Not set'}</p>
            </div>
            <button className="btn-secondary">Edit</button>
          </div>
          <div className="setting-item">
            <div className="setting-info">
              <h4>Email Address</h4>
              <p className="text-muted">{profile?.id ? '(stored in auth)' : 'Not signed in'}</p>
            </div>
          </div>
          {profile?.role === 'doctor' && (
            <div className="setting-item">
              <div className="setting-info">
                <h4>Specialization</h4>
                <p className="text-muted">{profile?.specialization || 'N/A'}</p>
              </div>
            </div>
          )}
          <div className="setting-item">
            <div className="setting-info">
              <h4>Role</h4>
              <p className="text-muted" style={{textTransform:'capitalize'}}>{profile?.role || 'N/A'}</p>
            </div>
          </div>
        </motion.div>

        <motion.div 
          className="settings-section glass-card"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <h3><Shield size={20} /> Privacy & Security</h3>
          <div className="setting-item flex-between">
            <div className="setting-info">
              <h4>Privacy Mode</h4>
              <p className="text-muted">Do not store scan history or images on servers</p>
            </div>
            <label className="toggle-switch">
              <input type="checkbox" checked={privacyMode} onChange={togglePrivacy} />
              <span className="slider round"></span>
            </label>
          </div>
          <div className="setting-item">
            <div className="setting-info">
              <h4>Password</h4>
              <p className="text-muted">Last changed 3 months ago</p>
            </div>
            <button className="btn-secondary">Update</button>
          </div>
        </motion.div>

        <motion.div 
          className="settings-section glass-card"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <h3><Globe size={20} /> Preferences</h3>
          <div className="setting-item flex-between">
            <div className="setting-info">
              <h4>Dark Theme</h4>
              <p className="text-muted">Switch between light and dark modes</p>
            </div>
            <label className="toggle-switch">
              <input type="checkbox" checked={theme === 'dark'} onChange={toggleTheme} />
              <span className="slider round"></span>
            </label>
          </div>
          <div className="setting-item flex-between">
            <div className="setting-info">
              <h4>Language</h4>
              <p className="text-muted">Select your preferred app language</p>
            </div>
            <select 
              value={language} 
              onChange={(e) => setLanguage(e.target.value)}
              className="settings-select"
            >
              <option value="en">English</option>
              <option value="kn">Kannada (ಕನ್ನಡ)</option>
            </select>
          </div>
          <div className="setting-item flex-between">
            <div className="setting-info">
              <h4>AI Guidance System</h4>
              <p className="text-muted">Enable floating AI assistant and voice guidance</p>
            </div>
            <label className="toggle-switch">
              <input type="checkbox" checked={aiGuideEnabled} onChange={() => setAiGuideEnabled(!aiGuideEnabled)} />
              <span className="slider round"></span>
            </label>
          </div>
        </motion.div>

        <motion.div 
          className="settings-section glass-card"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <button
            className="btn-secondary text-danger full-width flex-center"
            style={{ gap: '0.5rem', padding: '1rem' }}
            onClick={handleLogout}
          >
            <LogOut size={20} /> Sign Out
          </button>
        </motion.div>
      </div>
    </div>
  );
};

export default Settings;
