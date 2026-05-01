import React, { createContext, useContext, useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';

const AppContext = createContext();

export const AppProvider = ({ children }) => {
  const { t, i18n } = useTranslation();
  const [theme, setTheme] = useState('light');
  const [privacyMode, setPrivacyMode] = useState(false);
  const [aiGuideEnabled, setAiGuideEnabled] = useState(true);
  
  // App-level state (theme, language, etc.)
  // Auth state is managed separately in AuthContext

  // Language state wrapper
  const language = i18n.language;
  const setLanguage = (lang) => {
    i18n.changeLanguage(lang);
  };

  // Walkthrough State
  const [isWalkthroughActive, setIsWalkthroughActive] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [isVoiceMuted, setIsVoiceMuted] = useState(false);
  const [isTextOnly, setIsTextOnly] = useState(false);

  const walkthroughSteps = [
    { targetId: 'nav-home', text: t('walkthrough.home') },
    { targetId: 'nav-scan', text: t('walkthrough.scan') },
    { targetId: 'nav-doctors', text: t('walkthrough.doctors') },
    { targetId: 'nav-tips', text: t('walkthrough.tips') },
    { targetId: 'nav-medications', text: t('walkthrough.medications') },
    { targetId: 'nav-auth', text: t('walkthrough.auth') }
  ];

  // Chatbot State — persistent via localStorage
  const [chatMessages, setChatMessages] = useState(() => {
    try {
      const saved = localStorage.getItem('twacha_chat_history');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch (e) { /* ignore */ }
    return [{ id: 1, sender: 'ai', text: t('chatbot.default_ai') }];
  });
  const [isChatTyping, setIsChatTyping] = useState(false);

  // Persist chat to localStorage whenever it changes
  useEffect(() => {
    try {
      // Keep last 20 messages in storage
      const toSave = chatMessages.slice(-20);
      localStorage.setItem('twacha_chat_history', JSON.stringify(toSave));
    } catch (e) { /* ignore */ }
  }, [chatMessages]);

  const clearChatHistory = () => {
    const welcome = [{ id: Date.now(), sender: 'ai', text: t('chatbot.default_ai') }];
    setChatMessages(welcome);
    localStorage.removeItem('twacha_chat_history');
  };

  // Feedback State
  const [feedbackModalOpen, setFeedbackModalOpen] = useState(false);
  const [doctorFeedbackModal, setDoctorFeedbackModal] = useState(null); // { doctorId, doctorName, doctorImage, consultType, date }

  const submitWebsiteFeedback = (data) => {
    // Note: To submit properly, we'd need user from auth context, but AppContext doesn't have it.
    // It's passed in from components usually, but the original code had `userId: user?.id || null` which was undefined here.
    const newFeedback = {
      id: Date.now().toString(),
      userId: null,
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
      userId: null,
      ...data
    };
    
    // Simulate saving to DB
    const existing = JSON.parse(localStorage.getItem('doctor_feedback') || '[]');
    localStorage.setItem('doctor_feedback', JSON.stringify([newFeedback, ...existing]));
    console.log("Doctor feedback submitted:", newFeedback);
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
        clearChatHistory,
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
