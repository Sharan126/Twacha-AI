import React from 'react';
import { NavLink } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Sun, Moon, Shield, ShieldOff, Globe, Menu, LogIn, User, MessageSquarePlus } from 'lucide-react';
import { useAppContext } from '../context/AppContext';
import './Navbar.css';

const Navbar = () => {
  const { theme, toggleTheme, language, setLanguage, privacyMode, togglePrivacy, t, isAuthenticated, user, isWalkthroughActive, currentStep, walkthroughSteps, setFeedbackModalOpen } = useAppContext();

  const currentWalkthroughTarget = isWalkthroughActive && walkthroughSteps[currentStep] ? walkthroughSteps[currentStep].targetId : null;

  const navLinks = [
    { name: t('nav.home'), path: '/' },
    { name: t('nav.scan'), path: '/scan' },
    { name: t('nav.doctors'), path: '/doctors' },
    { name: t('nav.history'), path: '/history' },
    { name: t('nav.records'), path: '/records' },
    { name: t('nav.medications'), path: '/medications' },
    { name: t('nav.tips'), path: '/tips' },
    { name: t('nav.settings'), path: '/settings' }
  ];

  return (
    <motion.nav 
      className="navbar glass"
      initial={{ y: -100 }}
      animate={{ y: 0 }}
      transition={{ duration: 0.5, type: 'spring' }}
    >
      <div className="navbar-container flex-between">
        
        {/* Brand */}
        <div className="navbar-brand">
          <NavLink to="/">
            <h1 className="logo-text">Twacha AI</h1>
            <span className="slogan">{t('nav.slogan')}</span>
          </NavLink>
        </div>

        {/* Links */}
        <div className="navbar-links">
          {navLinks.map((link) => {
            const linkId = link.path === '/' ? 'nav-home' : `nav-${link.path.substring(1)}`;
            const isHighlighted = linkId === currentWalkthroughTarget;
            return (
              <NavLink 
                key={link.name} 
                to={link.path}
                id={linkId}
                className={({ isActive }) => `nav-link ${isActive ? 'active' : ''} ${isHighlighted ? 'guide-highlight-pulse' : ''}`}
              >
                {link.name}
              </NavLink>
            );
          })}
        </div>

        {/* Controls */}
        <div className="navbar-controls flex-center">
          
          <button 
            className="control-btn" 
            onClick={() => setFeedbackModalOpen(true)}
            title="App Feedback"
          >
            <MessageSquarePlus size={20} />
          </button>

          <button 
            className="control-btn" 
            onClick={() => setLanguage(language === 'en' ? 'kn' : 'en')}
            title="Toggle Language"
          >
            <Globe size={20} />
            <span className="lang-text">{language === 'en' ? '🇬🇧' : '🇮🇳'}</span>
          </button>

          <button 
            className="control-btn" 
            onClick={toggleTheme}
            title="Toggle Theme"
          >
            {theme === 'dark' ? <Sun size={20} /> : <Moon size={20} />}
          </button>

          <button 
            className={`control-btn privacy-toggle ${privacyMode ? 'active' : ''}`} 
            onClick={togglePrivacy}
            title="Privacy Mode"
          >
            {privacyMode ? <Shield size={20} className="text-success" /> : <ShieldOff size={20} />}
          </button>

          <button className="mobile-menu-btn control-btn">
            <Menu size={24} />
          </button>
          
          <div className="auth-action" style={{marginLeft: '0.5rem'}}>
            {isAuthenticated ? (
              <NavLink to="/settings" id="nav-auth" className={`btn-secondary flex-center ${currentWalkthroughTarget === 'nav-auth' ? 'guide-highlight-pulse' : ''}`} style={{padding: '0.5rem 1rem'}}>
                <User size={18} style={{marginRight: '0.5rem'}} />
                {user?.name || 'User'}
              </NavLink>
            ) : (
              <NavLink to="/auth" id="nav-auth" className={`btn-primary flex-center ${currentWalkthroughTarget === 'nav-auth' ? 'guide-highlight-pulse' : ''}`} style={{padding: '0.5rem 1rem'}}>
                <LogIn size={18} style={{marginRight: '0.5rem'}} />
                {t('nav.signIn')}
              </NavLink>
            )}
          </div>
        </div>

      </div>

      {privacyMode && (
        <motion.div 
          className="privacy-banner bg-success"
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
        >
          Privacy Mode ON 🔒 - Your data is not stored
        </motion.div>
      )}
    </motion.nav>
  );
};

export default Navbar;
