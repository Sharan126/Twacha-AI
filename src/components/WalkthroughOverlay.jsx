import React, { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Play, Pause, SkipForward, SkipBack, Volume2, VolumeX, MessageSquareText, X } from 'lucide-react';
import { useAppContext } from '../context/AppContext';
import './WalkthroughOverlay.css';

const WalkthroughOverlay = () => {
  const { 
    isWalkthroughActive, setIsWalkthroughActive,
    currentStep, setCurrentStep,
    isVoiceMuted, setIsVoiceMuted,
    isTextOnly, setIsTextOnly,
    walkthroughSteps 
  } = useAppContext();

  const [isPlaying, setIsPlaying] = useState(false);
  const synthRef = useRef(window.speechSynthesis);

  // Handle speech logic
  useEffect(() => {
    if (isWalkthroughActive && !isTextOnly) {
      speak(walkthroughSteps[currentStep].text);
    }
    return () => {
      synthRef.current.cancel();
      setIsPlaying(false);
    };
  }, [currentStep, isWalkthroughActive, isTextOnly]);

  const speak = (text) => {
    if (isVoiceMuted || isTextOnly) return;
    
    synthRef.current.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    
    const voices = synthRef.current.getVoices();
    const preferredVoice = voices.find(v => v.lang.includes('en') && v.name.includes('Female')) || voices[0];
    if (preferredVoice) {
      utterance.voice = preferredVoice;
    }
    
    utterance.onstart = () => setIsPlaying(true);
    utterance.onend = () => setIsPlaying(false);
    
    synthRef.current.speak(utterance);
  };

  const handlePlayPause = () => {
    if (isPlaying) {
      synthRef.current.pause();
      setIsPlaying(false);
    } else {
      if (synthRef.current.paused) {
        synthRef.current.resume();
      } else {
        speak(walkthroughSteps[currentStep].text);
      }
      setIsPlaying(true);
    }
  };

  const nextStep = () => {
    if (currentStep < walkthroughSteps.length - 1) {
      setCurrentStep(prev => prev + 1);
    } else {
      endWalkthrough();
    }
  };

  const prevStep = () => {
    if (currentStep > 0) {
      setCurrentStep(prev => prev - 1);
    }
  };

  const endWalkthrough = () => {
    setIsWalkthroughActive(false);
    setCurrentStep(0);
    synthRef.current.cancel();
    setIsPlaying(false);
  };

  if (!isWalkthroughActive) return null;

  return (
    <AnimatePresence>
      <div className="walkthrough-overlay-backdrop">
        <motion.div 
          className="walkthrough-panel glass"
          initial={{ opacity: 0, y: 50, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 50, scale: 0.95 }}
        >
          <button className="tour-close-btn" onClick={endWalkthrough} title="Skip Tour">
            <X size={20} />
          </button>
          
          <div className="tour-header">
            <h3>Platform Tour</h3>
            <span className="tour-progress">Step {currentStep + 1} of {walkthroughSteps.length}</span>
          </div>

          <div className="tour-subtitle-box glass-card">
            <p className="tour-subtitle-text">"{walkthroughSteps[currentStep].text}"</p>
          </div>
          
          <div className="tour-controls flex-between mt-1">
            <div className="settings-controls flex-center">
              <button 
                className={`icon-btn ${isVoiceMuted ? 'text-muted' : 'text-primary'}`} 
                onClick={() => {
                  setIsVoiceMuted(!isVoiceMuted);
                  if (!isVoiceMuted) synthRef.current.cancel();
                }}
                title={isVoiceMuted ? "Unmute Voice" : "Mute Voice"}
              >
                {isVoiceMuted ? <VolumeX size={18} /> : <Volume2 size={18} />}
              </button>
              
              <button 
                className={`icon-btn ${isTextOnly ? 'text-primary' : 'text-muted'}`} 
                onClick={() => {
                  setIsTextOnly(!isTextOnly);
                  synthRef.current.cancel();
                }}
                title={isTextOnly ? "Enable Voice" : "Text Only Mode"}
              >
                <MessageSquareText size={18} />
              </button>
            </div>

            <div className="playback-controls flex-center">
              <button className="icon-btn" onClick={prevStep} disabled={currentStep === 0}>
                <SkipBack size={20} />
              </button>
              
              {!isTextOnly && (
                <button className="icon-btn tour-play-btn bg-primary text-white" onClick={handlePlayPause}>
                  {isPlaying ? <Pause size={24} /> : <Play size={24} style={{ marginLeft: '2px' }}/>}
                </button>
              )}

              <button className="icon-btn" onClick={nextStep}>
                <SkipForward size={20} />
              </button>
            </div>

            <button className="btn-secondary skip-btn" onClick={endWalkthrough}>
              Skip Tour
            </button>
          </div>
          
        </motion.div>
      </div>
    </AnimatePresence>
  );
};

export default WalkthroughOverlay;
