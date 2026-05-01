import React from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { User, Bell, Shield, Globe, Moon, CreditCard, LogOut } from 'lucide-react';
import { useAppContext } from '../context/AppContext';
import { useAuth } from '../context/AuthContext';
import { useTranslation } from 'react-i18next';
import './Settings.css';

const Settings = () => {
  const { theme, toggleTheme, language, setLanguage, privacyMode, togglePrivacy, aiGuideEnabled, setAiGuideEnabled } = useAppContext();
  const { profile, logout } = useAuth();
  const { t } = useTranslation();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate('/');
  };

  return (
    <div className="settings-page container">
      <div className="page-header">
        <h2>{t('settings.title', { defaultValue: 'Account Settings' })}</h2>
      </div>

      <div className="settings-grid">
        <motion.div 
          className="settings-section glass-card"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <h3><User size={20} /> {t('settings.profileInfo', { defaultValue: 'Profile Information' })}</h3>
          <div className="setting-item">
            <div className="setting-info">
              <h4>{t('settings.fullName', { defaultValue: 'Full Name' })}</h4>
              <p className="text-muted">{profile?.name || t('settings.notSet', { defaultValue: 'Not set' })}</p>
            </div>
            <button className="btn-secondary">{t('settings.edit', { defaultValue: 'Edit' })}</button>
          </div>
          <div className="setting-item">
            <div className="setting-info">
              <h4>{t('settings.emailAddress', { defaultValue: 'Email Address' })}</h4>
              <p className="text-muted">{profile?.id ? t('settings.storedInAuth', { defaultValue: '(stored in auth)' }) : t('settings.notSignedIn', { defaultValue: 'Not signed in' })}</p>
            </div>
          </div>
          {profile?.role === 'doctor' && (
            <div className="setting-item">
              <div className="setting-info">
                <h4>{t('auth.specialization', { defaultValue: 'Specialization' })}</h4>
                <p className="text-muted">{profile?.specialization || 'N/A'}</p>
              </div>
            </div>
          )}
          <div className="setting-item">
            <div className="setting-info">
              <h4>{t('settings.role', { defaultValue: 'Role' })}</h4>
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
          <h3><Shield size={20} /> {t('settings.privacySecurity', { defaultValue: 'Privacy & Security' })}</h3>
          <div className="setting-item flex-between">
            <div className="setting-info">
              <h4>{t('settings.privacyMode', { defaultValue: 'Privacy Mode' })}</h4>
              <p className="text-muted">{t('settings.privacyModeDesc', { defaultValue: 'Do not store scan history or images on servers' })}</p>
            </div>
            <label className="toggle-switch">
              <input type="checkbox" checked={privacyMode} onChange={togglePrivacy} />
              <span className="slider round"></span>
            </label>
          </div>
          <div className="setting-item">
            <div className="setting-info">
              <h4>{t('settings.password', { defaultValue: 'Password' })}</h4>
              <p className="text-muted">{t('settings.passwordDesc', { defaultValue: 'Last changed 3 months ago' })}</p>
            </div>
            <button className="btn-secondary">{t('settings.update', { defaultValue: 'Update' })}</button>
          </div>
        </motion.div>

        <motion.div 
          className="settings-section glass-card"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <h3><Globe size={20} /> {t('settings.preferences', { defaultValue: 'Preferences' })}</h3>
          <div className="setting-item flex-between">
            <div className="setting-info">
              <h4>{t('settings.darkTheme', { defaultValue: 'Dark Theme' })}</h4>
              <p className="text-muted">{t('settings.darkThemeDesc', { defaultValue: 'Switch between light and dark modes' })}</p>
            </div>
            <label className="toggle-switch">
              <input type="checkbox" checked={theme === 'dark'} onChange={toggleTheme} />
              <span className="slider round"></span>
            </label>
          </div>
          <div className="setting-item flex-between">
            <div className="setting-info">
              <h4>{t('nav.settings')}</h4>
              <p className="text-muted">{t('settings.languageDesc', { defaultValue: 'Select your preferred app language' })}</p>
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
              <h4>{t('settings.aiGuide', { defaultValue: 'AI Guidance System' })}</h4>
              <p className="text-muted">{t('settings.aiGuideDesc', { defaultValue: 'Enable floating AI assistant and voice guidance' })}</p>
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
            <LogOut size={20} /> {t('settings.signOut', { defaultValue: 'Sign Out' })}
          </button>
        </motion.div>
      </div>
    </div>
  );
};

export default Settings;
