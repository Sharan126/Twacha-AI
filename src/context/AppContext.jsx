import React, { createContext, useContext, useState, useEffect } from 'react';
import { translations } from '../translations';

const AppContext = createContext();

export const AppProvider = ({ children }) => {
  const [theme, setTheme] = useState('light');
  const [language, setLanguage] = useState('en'); // 'en' or 'kn'
  const [privacyMode, setPrivacyMode] = useState(false);
  const [aiGuideEnabled, setAiGuideEnabled] = useState(true);
  
  // App-level state (theme, language, etc.)
  // Auth state is managed separately in AuthContext

  // Walkthrough State
  const [isWalkthroughActive, setIsWalkthroughActive] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [isVoiceMuted, setIsVoiceMuted] = useState(false);
  const [isTextOnly, setIsTextOnly] = useState(false);

  const walkthroughSteps = [
    { targetId: 'nav-home', text: "Welcome to Twacha AI! This is your dashboard." },
    { targetId: 'nav-scan', text: "Click the Scan tab to analyze your skin condition using our AI model." },
    { targetId: 'nav-doctors', text: "Here you can find expert dermatologists for online or offline consultations." },
    { targetId: 'nav-tips', text: "Check out the Tips section for daily skincare routines and dietary advice." },
    { targetId: 'nav-medications', text: "Use the Medications tab to track your daily prescriptions and never miss a dose." },
    { targetId: 'nav-auth', text: "Finally, sign in here to securely save your records." }
  ];

  // Chatbot State
  const [chatMessages, setChatMessages] = useState([
    { id: 1, sender: 'ai', text: "Hi! I'm your AI skin assistant. How can I help you today?" }
  ]);
  const [isChatTyping, setIsChatTyping] = useState(false);

  // Feedback State
  const [feedbackModalOpen, setFeedbackModalOpen] = useState(false);
  const [doctorFeedbackModal, setDoctorFeedbackModal] = useState(null); // { doctorId, doctorName, doctorImage, consultType, date }

  const submitWebsiteFeedback = (data) => {
    const newFeedback = {
      id: Date.now().toString(),
      userId: user?.id || null,
      createdAt: new Date().toISOString(),
      ...data
    };
    
    // Simulate saving to DB
    const existing = JSON.parse(localStorage.getItem('website_feedback') || '[]');
    localStorage.setItem('website_feedback', JSON.stringify([newFeedback, ...existing]));
    console.log("Website feedback submitted:", newFeedback);
  };

  const submitDoctorFeedback = (data) => {
    const newFeedback = {
      id: Date.now().toString(),
      userId: user?.id || null,
      ...data
    };
    
    // Simulate saving to DB
    const existing = JSON.parse(localStorage.getItem('doctor_feedback') || '[]');
    localStorage.setItem('doctor_feedback', JSON.stringify([newFeedback, ...existing]));
    console.log("Doctor feedback submitted:", newFeedback);
  };

  // Translation helper
  const t = (key) => {
    const keys = key.split('.');
    let value = translations[language];
    for (let k of keys) {
      if (value === undefined) return key;
      value = value[k];
    }
    return value || key;
  };

  // Toggle Theme
  const toggleTheme = () => {
    setTheme((prev) => (prev === 'light' ? 'dark' : 'light'));
  };

  // Toggle Privacy
  const togglePrivacy = () => {
    setPrivacyMode((prev) => !prev);
  };

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
  }, [theme]);

  return (
    <AppContext.Provider
      value={{
        theme,
        toggleTheme,
        language,
        setLanguage,
        t,
        privacyMode,
        togglePrivacy,
        aiGuideEnabled,
        setAiGuideEnabled,
        isWalkthroughActive,
        setIsWalkthroughActive,
        currentStep,
        setCurrentStep,
        isVoiceMuted,
        setIsVoiceMuted,
        isTextOnly,
        setIsTextOnly,
        walkthroughSteps,
        chatMessages,
        setChatMessages,
        isChatTyping,
        setIsChatTyping,
        feedbackModalOpen,
        setFeedbackModalOpen,
        submitWebsiteFeedback,
        doctorFeedbackModal,
        setDoctorFeedbackModal,
        submitDoctorFeedback
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useAppContext = () => useContext(AppContext);
