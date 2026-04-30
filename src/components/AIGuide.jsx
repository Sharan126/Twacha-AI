import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Bot, X, Send, Mic } from 'lucide-react';
import { useAppContext } from '../context/AppContext';
import './AIGuide.css';

const AIGuide = () => {
  const { aiGuideEnabled, chatMessages, setChatMessages, isChatTyping, setIsChatTyping } = useAppContext();
  const [isOpen, setIsOpen] = useState(false);
  const [inputText, setInputText] = useState('');
  const messagesEndRef = useRef(null);

  const quickSuggestions = [
    "Analyze my skin",
    "Skincare routine",
    "Track medication",
    "Skin problems help"
  ];

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    if (isOpen) {
      scrollToBottom();
    }
  }, [isOpen, chatMessages, isChatTyping]);

  const handleSendMessage = (text) => {
    if (!text.trim()) return;

    // Add user message
    const userMsg = { id: Date.now(), sender: 'user', text };
    setChatMessages(prev => [...prev, userMsg]);
    setInputText('');
    setIsChatTyping(true);

    // Simulate AI response
    setTimeout(() => {
      let aiResponse = "I'm a simulated AI assistant. In a live environment, I would connect to a backend to analyze your request about: '" + text + "'. How else can I help?";
      
      if (text.toLowerCase().includes('routine')) {
        aiResponse = "For a basic daily routine, I recommend: 1) Gentle Cleanser, 2) Vitamin C Serum (morning), 3) Moisturizer, and 4) SPF 30+ (morning). Check our Tips section for more!";
      } else if (text.toLowerCase().includes('analyze')) {
        aiResponse = "To analyze your skin, please navigate to the 'Scan' tab from the top menu and upload a clear photo of the affected area.";
      }

      setChatMessages(prev => [...prev, { id: Date.now() + 1, sender: 'ai', text: aiResponse }]);
      setIsChatTyping(false);
    }, 1500);
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      handleSendMessage(inputText);
    }
  };

  if (!aiGuideEnabled) return null;

  return (
    <div className="ai-guide-wrapper">
      <AnimatePresence>
        {isOpen && (
          <motion.div 
            className="chat-panel glass"
            initial={{ opacity: 0, y: 20, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.9 }}
          >
            <div className="chat-header bg-primary text-white">
              <div className="flex-center gap-sm">
                <Bot size={20} />
                <div>
                  <h4 style={{ margin: 0, fontSize: '1rem', color: 'white' }}>Twacha Assistant</h4>
                  <span style={{ fontSize: '0.7rem', opacity: 0.8, fontWeight: 'normal' }}>Ask anything about your skin or the app</span>
                </div>
              </div>
              <button className="chat-close-btn text-white" onClick={() => setIsOpen(false)}>
                <X size={18} />
              </button>
            </div>

            <div className="chat-messages">
              {chatMessages.map(msg => (
                <div key={msg.id} className={`message-bubble ${msg.sender}`}>
                  {msg.sender === 'ai' && <div className="msg-avatar"><Bot size={14} /></div>}
                  <div className="msg-text">{msg.text}</div>
                </div>
              ))}
              
              {isChatTyping && (
                <div className="message-bubble ai">
                  <div className="msg-avatar"><Bot size={14} /></div>
                  <div className="typing-indicator">
                    <span></span><span></span><span></span>
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>

            <div className="quick-suggestions">
              {quickSuggestions.map((suggestion, idx) => (
                <button 
                  key={idx} 
                  className="suggestion-chip glass"
                  onClick={() => handleSendMessage(suggestion)}
                >
                  {suggestion}
                </button>
              ))}
            </div>

            <div className="chat-input-area border-t border-glass">
              <input 
                type="text" 
                placeholder="Type your question..." 
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                onKeyPress={handleKeyPress}
                className="chat-input"
              />
              <button className="icon-btn text-muted" title="Voice Input (Mock)">
                <Mic size={18} />
              </button>
              <button 
                className={`icon-btn send-btn ${inputText.trim() ? 'text-primary' : 'text-muted'}`} 
                onClick={() => handleSendMessage(inputText)}
                disabled={!inputText.trim()}
              >
                <Send size={18} />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <motion.button 
        className="ai-fab bg-primary"
        onClick={() => setIsOpen(!isOpen)}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
      >
        <Bot size={28} color="white" />
        <div className="fab-pulse"></div>
      </motion.button>
    </div>
  );
};

export default AIGuide;
