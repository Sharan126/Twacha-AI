import React, { useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Sun, Moon, Shield, ShieldOff, Globe, Menu, LogIn, User, X, MessageSquarePlus } from 'lucide-react';
import { useAppContext } from '../context/AppContext';
import { useAuth } from '../context/AuthContext';
import { useTranslation } from 'react-i18next';
import './Navbar.css';

const Navbar = () => {
  const {
    theme, toggleTheme,
    language, setLanguage,
    privacyMode, togglePrivacy,
    isWalkthroughActive, currentStep, walkthroughSteps,
    setFeedbackModalOpen
  } = useAppContext();
  const { t } = useTranslation();

  const { isAuthenticated, profile, logout } = useAuth();
  const user = profile; // profile has name, role fields

  const [mobileOpen, setMobileOpen] = useState(false);

  const currentWalkthroughTarget = isWalkthroughActive && walkthroughSteps[currentStep]
    ? walkthroughSteps[currentStep].targetId
    : null;

  const navLinks = [
    { name: t('nav.home'),        path: '/' },
    { name: t('nav.scan'),        path: '/scan' },
    { name: t('nav.doctors'),     path: '/doctors' },
    { name: t('nav.history'),     path: '/history' },
    { name: t('nav.records'),     path: '/records' },
    { name: t('nav.medications'), path: '/medications' },
    { name: t('nav.tips'),        path: '/tips' },
    { name: t('nav.settings'),    path: '/settings' },
  ];

  const getLinkId = (path) => path === '/' ? 'nav-home' : `nav-${path.substring(1)}`;

  return (
    <>
      <motion.nav
        className="navbar glass"
        initial={{ y: -80 }}
        animate={{ y: 0 }}
        transition={{ duration: 0.5, type: 'spring' }}
      >
        <div className="navbar-container">

          {/* Brand */}
          <div className="navbar-brand">
            <NavLink to="/">
              <h1 className="logo-text">Twacha AI</h1>
              <span className="slogan">{t('nav.slogan')}</span>
            </NavLink>
          </div>

          {/* Desktop Links */}
          <div className="navbar-links">
            {navLinks.map((link) => {
              const linkId = getLinkId(link.path);
              const isHighlighted = linkId === currentWalkthroughTarget;
              return (
                <NavLink
                  key={link.path}
                  to={link.path}
                  id={linkId}
                  end={link.path === '/'}
                  className={({ isActive }) =>
                    `nav-link ${isActive ? 'active' : ''} ${isHighlighted ? 'guide-highlight-pulse' : ''}`
                  }
                >
                  {link.name}
                </NavLink>
              );
            })}
          </div>

          {/* Controls */}
          <div className="navbar-controls">
            {/* Feedback */}
            <button
              className="control-btn"
              onClick={() => setFeedbackModalOpen(true)}
              title="App Feedback"
            >
              <MessageSquarePlus size={18} />
            </button>

            {/* Language */}
            <button
              className="control-btn"
              onClick={() => setLanguage(language === 'en' ? 'kn' : 'en')}
              title="Toggle Language"
            >
              <Globe size={18} />
              <span className="lang-text">{language === 'en' ? '🇬🇧' : '🇮🇳'}</span>
            </button>

            {/* Theme */}
            <button className="control-btn" onClick={toggleTheme} title="Toggle Theme">
              {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
            </button>

            {/* Privacy */}
            <button
              className={`control-btn privacy-toggle ${privacyMode ? 'active' : ''}`}
              onClick={togglePrivacy}
              title="Privacy Mode"
            >
              {privacyMode
                ? <Shield size={18} className="text-success" />
                : <ShieldOff size={18} />}
            </button>

            {/* Auth */}
            <div className="auth-action" style={{ marginLeft: '0.25rem' }}>
              {isAuthenticated ? (
                <NavLink
                  to="/settings"
                  id="nav-auth"
                  className={`btn-secondary flex-center ${currentWalkthroughTarget === 'nav-auth' ? 'guide-highlight-pulse' : ''}`}
                  style={{ padding: '0.45rem 1rem', gap: '0.4rem' }}
                >
                  <User size={16} />
                  {user?.name || 'User'}
                </NavLink>
              ) : (
                <NavLink
                  to="/auth"
                  id="nav-auth"
                  className={`btn-primary flex-center ${currentWalkthroughTarget === 'nav-auth' ? 'guide-highlight-pulse' : ''}`}
                  style={{ padding: '0.45rem 1rem', gap: '0.4rem' }}
                >
                  <LogIn size={16} />
                  {t('nav.signIn')}
                </NavLink>
              )}
            </div>

            {/* Hamburger */}
            <button className="mobile-menu-btn control-btn" onClick={() => setMobileOpen(true)}>
              <Menu size={22} />
            </button>
          </div>
        </div>

        {privacyMode && (
          <motion.div
            className="privacy-banner"
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
          >
            Privacy Mode ON 🔒 — Your data is not stored
          </motion.div>
        )}
      </motion.nav>

      {/* Mobile Drawer */}
      <AnimatePresence>
        {mobileOpen && (
          <>
            <motion.div
              className="mobile-drawer-overlay"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setMobileOpen(false)}
            />
            <motion.div
              className="mobile-nav-drawer glass"
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              transition={{ type: 'spring', damping: 28, stiffness: 300 }}
            >
              <div className="mobile-drawer-header">
                <h2 className="logo-text" style={{ fontSize: '1.25rem' }}>Twacha AI</h2>
                <button className="control-btn" onClick={() => setMobileOpen(false)}>
                  <X size={20} />
                </button>
              </div>

              {navLinks.map((link) => (
                <NavLink
                  key={link.path}
                  to={link.path}
                  end={link.path === '/'}
                  className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
                  onClick={() => setMobileOpen(false)}
                >
                  {link.name}
                </NavLink>
              ))}

              <div style={{ marginTop: 'auto', paddingTop: '1.5rem', borderTop: '1px solid var(--border-glass)' }}>
                {isAuthenticated ? (
                  <NavLink
                    to="/settings"
                    className="btn-secondary flex-center"
                    style={{ gap: '0.5rem', justifyContent: 'center' }}
                    onClick={() => setMobileOpen(false)}
                  >
                    <User size={16} /> {user?.name || 'User'}
                  </NavLink>
                ) : (
                  <NavLink
                    to="/auth"
                    className="btn-primary flex-center"
                    style={{ gap: '0.5rem', justifyContent: 'center' }}
                    onClick={() => setMobileOpen(false)}
                  >
                    <LogIn size={16} /> {t('nav.signIn')}
                  </NavLink>
                )}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
};

export default Navbar;
