import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, Sun, Apple, Ban, ChevronDown, CheckCircle2 } from 'lucide-react';
import { useAppContext } from '../context/AppContext';
import './Tips.css';

const Tips = () => {
  const { t } = useAppContext();
  const [activeTab, setActiveTab] = useState('daily');
  const [expandedId, setExpandedId] = useState(null);

  const tipsData = {
    daily: [
      { id: 'd1', title: 'Always use Sunscreen', short: 'Apply SPF 30+ daily, even indoors.', detail: 'UV rays can penetrate windows and cause premature aging and hyperpigmentation. Reapply every 2 hours if outdoors.' },
      { id: 'd2', title: 'Cleanse Twice a Day', short: 'Morning and night routines are crucial.', detail: 'Use a gentle cleanser. Morning removes overnight oils, and night removes makeup, dirt, and pollution.' },
      { id: 'd3', title: 'Moisturize on Damp Skin', short: 'Lock in hydration immediately after washing.', detail: 'Applying moisturizer within 3 minutes of washing your face traps moisture and improves barrier function.' }
    ],
    diet: [
      { id: 'f1', title: 'Stay Hydrated', short: 'Drink at least 8 glasses of water daily.', detail: 'Water flushes out toxins and keeps your skin plump and glowing. Dehydration leads to dry, tight, and flaky skin.' },
      { id: 'f2', title: 'Antioxidant-Rich Foods', short: 'Eat berries, nuts, and leafy greens.', detail: 'Antioxidants fight free radicals that cause cellular damage and premature aging. Vitamin C is essential for collagen production.' },
      { id: 'f3', title: 'Limit Dairy & Sugar', short: 'High glycemic foods can trigger acne.', detail: 'Refined carbs and sugars cause insulin spikes, which increase sebum production and can lead to breakouts.' }
    ],
    avoid: [
      { id: 'a1', title: 'Touching Your Face', short: 'Keep hands away to prevent breakouts.', detail: 'Your hands carry bacteria, oils, and dirt that transfer to your skin, clogging pores and causing acne.' },
      { id: 'a2', title: 'Over-Exfoliating', short: 'Stick to 1-2 times a week.', detail: 'Scrubbing too hard or too often damages the skin barrier, leading to redness, sensitivity, and microscopic tears.' },
      { id: 'a3', title: 'Sleeping with Makeup', short: 'Always remove makeup before bed.', detail: 'Sleeping in makeup clogs pores and prevents your skin from shedding dead cells and repairing itself overnight.' }
    ]
  };

  const getTabIcon = (tab) => {
    switch(tab) {
      case 'daily': return <Sun size={18} />;
      case 'diet': return <Apple size={18} />;
      case 'avoid': return <Ban size={18} />;
      default: return null;
    }
  };

  const toggleExpand = (id) => {
    setExpandedId(expandedId === id ? null : id);
  };

  return (
    <div className="tips-page container">
      <motion.div 
        className="tips-header text-center"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <div className="badge glass inline-flex flex-center gap-sm" style={{ margin: '0 auto 1rem' }}>
          <Sparkles size={16} className="text-accent" /> Skincare Library
        </div>
        <h1 className="hero-title" style={{ fontSize: '2.5rem' }}>Dermatology <span className="text-gradient">Insights</span></h1>
        <p className="text-muted max-w-md mx-auto">Expert advice and daily habits to help you maintain healthy, glowing skin.</p>
      </motion.div>

      {/* AI Personalized Insight */}
      <motion.div 
        className="personalized-insight glass-card"
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.1 }}
      >
        <div className="insight-icon bg-primary-light text-white">
          <Bot size={24} />
        </div>
        <div className="insight-content">
          <h4 className="text-primary flex-center gap-sm" style={{ justifyContent: 'flex-start', margin: 0 }}>
            AI Personalized Tip <CheckCircle2 size={16} />
          </h4>
          <p className="text-sm mt-1 mb-0">
            Based on your last scan, we recommend incorporating a <strong>Salicylic Acid</strong> cleanser to help manage mild congestion in the T-zone.
          </p>
        </div>
      </motion.div>

      {/* Tabs */}
      <div className="tips-tabs flex-center">
        {['daily', 'diet', 'avoid'].map((tab) => (
          <button
            key={tab}
            className={`tips-tab ${activeTab === tab ? 'active' : ''}`}
            onClick={() => { setActiveTab(tab); setExpandedId(null); }}
          >
            {getTabIcon(tab)}
            <span className="capitalize">{tab} Care</span>
          </button>
        ))}
      </div>

      {/* Tips Content */}
      <motion.div className="tips-grid" layout>
        <AnimatePresence mode="popLayout">
          {tipsData[activeTab].map((tip) => (
            <motion.div
              key={tip.id}
              layoutId={tip.id}
              className={`tip-card glass-card ${expandedId === tip.id ? 'expanded' : ''}`}
              onClick={() => toggleExpand(tip.id)}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9 }}
              transition={{ duration: 0.2 }}
            >
              <motion.div className="tip-card-header flex-between" layout>
                <h3 style={{ margin: 0, fontSize: '1.1rem' }}>{tip.title}</h3>
                <motion.div 
                  animate={{ rotate: expandedId === tip.id ? 180 : 0 }}
                  transition={{ duration: 0.2 }}
                >
                  <ChevronDown size={20} className="text-muted" />
                </motion.div>
              </motion.div>
              
              <motion.p className="tip-short text-muted text-sm mt-1" layout>
                {tip.short}
              </motion.p>

              <AnimatePresence>
                {expandedId === tip.id && (
                  <motion.div
                    className="tip-detail"
                    initial={{ opacity: 0, height: 0, marginTop: 0 }}
                    animate={{ opacity: 1, height: 'auto', marginTop: '1rem' }}
                    exit={{ opacity: 0, height: 0, marginTop: 0 }}
                  >
                    <div className="detail-divider"></div>
                    <p className="text-sm line-height-relaxed mt-1 mb-0">
                      {tip.detail}
                    </p>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          ))}
        </AnimatePresence>
      </motion.div>
    </div>
  );
};

// Simple Mock Bot Icon since it's not imported from lucide
const Bot = ({ size, className }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <path d="M12 8V4H8"/><rect width="16" height="12" x="4" y="8" rx="2"/><path d="M2 14h2"/><path d="M20 14h2"/><path d="M15 13v2"/><path d="M9 13v2"/>
  </svg>
);

export default Tips;
