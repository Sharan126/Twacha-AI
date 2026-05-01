import React from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { Activity, ShieldCheck, Clock, ArrowRight, PlayCircle } from 'lucide-react';
import { useAppContext } from '../context/AppContext';
import { useTranslation } from 'react-i18next';
import './Home.css';

const Home = () => {
  const { setIsWalkthroughActive } = useAppContext();
  const { t } = useTranslation();
  const navigate = useNavigate();

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0.1 }
    }
  };

  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: {
      y: 0,
      opacity: 1,
      transition: { type: 'spring', stiffness: 100 }
    }
  };

  return (
    <div className="home-page container">
      <motion.div 
        className="hero-section"
        variants={containerVariants}
        initial="hidden"
        animate="visible"
      >
        <motion.div className="hero-content" variants={itemVariants}>
          <div className="badge glass">{t('home.badge')}</div>
          <h1 className="hero-title">
            {t('home.titleLine1')} <br/>
            <span className="text-gradient">{t('home.titleLine2')}</span>
          </h1>
          <p className="hero-subtitle">
            {t('home.subtitle')}
          </p>
          <div className="hero-actions">
            <button className="btn-primary flex-center" onClick={() => navigate('/scan')}>
              {t('home.startScan')} <ArrowRight size={20} style={{ marginLeft: '8px' }} />
            </button>
            <button className="btn-secondary" onClick={() => navigate('/doctors')}>
              {t('home.findDoctor')}
            </button>
            <button className="btn-tour" onClick={() => setIsWalkthroughActive(true)}>
              <PlayCircle size={18} /> {t('home.takeTour')}
            </button>
          </div>
        </motion.div>

        <motion.div className="hero-cards" variants={containerVariants}>
          <motion.div className="feature-card glass-card" variants={itemVariants} onClick={() => navigate('/scan')}>
            <div className="icon-wrapper bg-primary-light">
              <Activity size={24} color="white" />
            </div>
            <h3>{t('home.feat1Title')}</h3>
            <p>{t('home.feat1Desc')}</p>
          </motion.div>

          <motion.div className="feature-card glass-card" variants={itemVariants} onClick={() => navigate('/doctors')}>
            <div className="icon-wrapper bg-secondary">
              <ShieldCheck size={24} color="white" />
            </div>
            <h3>{t('home.feat2Title')}</h3>
            <p>{t('home.feat2Desc')}</p>
          </motion.div>

          <motion.div className="feature-card glass-card" variants={itemVariants} onClick={() => navigate('/medications')}>
            <div className="icon-wrapper bg-accent">
              <Clock size={24} color="white" />
            </div>
            <h3>{t('home.feat3Title')}</h3>
            <p>{t('home.feat3Desc')}</p>
          </motion.div>
        </motion.div>
      </motion.div>
    </div>
  );
};

export default Home;
