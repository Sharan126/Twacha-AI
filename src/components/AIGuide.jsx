import React, { useState, useRef, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Bot, X, Send, Mic, MicOff, Volume2, VolumeX, Trash2 } from 'lucide-react';
import { useAppContext } from '../context/AppContext';
import { useTranslation } from 'react-i18next';
import './AIGuide.css';

// ============================================================
//  RESPONSE FORMATTER
//  Converts plain text with **bold** and bullets into HTML
// ============================================================
const formatAIResponse = (text) => {
  if (!text) return '';
  let html = text
    // Bold: **text**
    .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
    // Numbered list: lines starting with "1. ", "2. ", etc.
    .replace(/^\d+\.\s(.+)$/gm, '<li class="numbered">$1</li>')
    // Bullet list: lines starting with "- " or "• "
    .replace(/^[-•]\s(.+)$/gm, '<li class="bullet">$1</li>')
    // Newlines to <br>
    .replace(/\n/g, '<br/>');

  // Wrap consecutive <li> in <ul>
  html = html.replace(/(<li[^>]*>.*?<\/li>(<br\/>)?)+/g, (match) => {
    const items = match.replace(/<br\/>/g, '');
    return `<ul>${items}</ul>`;
  });

  return html;
};

// ============================================================
//  SAFETY WARNING DETECTION
// ============================================================
const isSafetyMessage = (text) =>
  text.includes('certified dermatologist') || text.includes('⚠️');

// ============================================================
//  MAIN COMPONENT
// ============================================================
const AIGuide = () => {
  const {
    aiGuideEnabled,
    chatMessages,
    setChatMessages,
    isChatTyping,
    setIsChatTyping,
    clearChatHistory,
  } = useAppContext();
  const { t, i18n } = useTranslation();

  const [isOpen, setIsOpen] = useState(false);
  const [inputText, setInputText] = useState('');
  const [isMuted, setIsMuted] = useState(false);
  const isMutedRef = useRef(isMuted);

  useEffect(() => {
    isMutedRef.current = isMuted;
    if (isMuted && window.speechSynthesis) {
      window.speechSynthesis.cancel();
    }
  }, [isMuted]);

  const [isListening, setIsListening] = useState(false);
  const [streamingMsgId, setStreamingMsgId] = useState(null);

  const messagesEndRef = useRef(null);
  const recognitionRef = useRef(null);
  const inputRef = useRef(null);

  // Build history from chatMessages for the backend
  const buildHistory = useCallback(() => {
    const pairs = [];
    const msgs = chatMessages.filter((m) => m.id !== 1 || m.sender !== 'ai'); // skip welcome
    for (let i = 0; i < msgs.length - 1; i += 2) {
      if (msgs[i]?.sender === 'user' && msgs[i + 1]?.sender === 'ai') {
        pairs.push({ user: msgs[i].text, ai: msgs[i + 1].text });
      }
    }
    return pairs.slice(-5); // last 5 exchanges
  }, [chatMessages]);

  // Smart suggestions
  const quickSuggestions = [
    t('chatbot.suggestion_analyze') || '🔍 How does the skin scan work?',
    t('chatbot.suggestion_routine') || '📅 Daily skincare routine',
    '🌿 Natural acne remedies',
    '💧 Oily skin tips',
  ];

  // Auto-scroll on new messages
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    if (isOpen) scrollToBottom();
  }, [isOpen, chatMessages, isChatTyping]);

  // ============================================================
  //  SPEECH-TO-TEXT (Voice Input)
  // ============================================================
  const startVoiceInput = () => {
    const SpeechRecognition =
      window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      alert('Voice input is not supported in this browser. Try Chrome.');
      return;
    }

    if (isListening) {
      recognitionRef.current?.stop();
      setIsListening(false);
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.lang = i18n.language === 'kn' ? 'kn-IN' : 'en-US';
    recognition.interimResults = false;
    recognition.maxAlternatives = 1;

    recognition.onstart = () => setIsListening(true);
    recognition.onend = () => setIsListening(false);
    recognition.onerror = () => setIsListening(false);

    recognition.onresult = (e) => {
      const transcript = e.results[0][0].transcript;
      setInputText(transcript);
      inputRef.current?.focus();
    };

    recognitionRef.current = recognition;
    recognition.start();
  };

  // ============================================================
  //  TEXT-TO-SPEECH (Voice Output)
  // ============================================================
  const speakText = (text) => {
    if (isMutedRef.current || !window.speechSynthesis) return;
    // Cancel any ongoing speech
    window.speechSynthesis.cancel();
    // Strip HTML tags for TTS
    const plain = text.replace(/<[^>]+>/g, '').replace(/[*•]/g, '');
    const utterance = new SpeechSynthesisUtterance(plain);
    utterance.lang = i18n.language === 'kn' ? 'kn-IN' : 'en-US';
    utterance.rate = 0.95;
    utterance.pitch = 1;
    window.speechSynthesis.speak(utterance);
  };

  // ============================================================
  //  SEND MESSAGE WITH STREAMING
  // ============================================================
  const handleSendMessage = async (text) => {
    if (!text.trim() || isChatTyping) return;

    const userText = text.trim();
    const userMsgId = Date.now();
    const aiMsgId = Date.now() + 1;

    // 1. Add user message
    setChatMessages((prev) => [
      ...prev,
      { id: userMsgId, sender: 'user', text: userText },
    ]);
    setInputText('');
    setIsChatTyping(true);

    // 2. Add empty AI bubble (will be filled by streaming)
    setChatMessages((prev) => [
      ...prev,
      { id: aiMsgId, sender: 'ai', text: '', streaming: true },
    ]);
    setStreamingMsgId(aiMsgId);

    try {
      const history = buildHistory();

      const res = await fetch('https://twacha-ai.onrender.com/api/ai-stream', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: userText, history, language: i18n.language }),
      });

      if (!res.ok) throw new Error(`Backend error: ${res.status}`);

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let accumulated = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        accumulated += decoder.decode(value, { stream: true });

        // Update the streaming AI bubble in real-time
        setChatMessages((prev) =>
          prev.map((m) =>
            m.id === aiMsgId ? { ...m, text: accumulated } : m
          )
        );
        scrollToBottom();
      }

      // 3. Mark streaming done
      setChatMessages((prev) =>
        prev.map((m) =>
          m.id === aiMsgId ? { ...m, streaming: false } : m
        )
      );

      // 4. Speak the response
      speakText(accumulated);
    } catch (err) {
      console.error('[AIGuide] Streaming error:', err);
      const errMsg =
        '⚠️ Unable to connect to Twacha AI. Please ensure the backend server is running.';
      setChatMessages((prev) =>
        prev.map((m) =>
          m.id === aiMsgId
            ? { ...m, text: errMsg, streaming: false, error: true }
            : m
        )
      );
    } finally {
      setIsChatTyping(false);
      setStreamingMsgId(null);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
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
            initial={{ opacity: 0, y: 24, scale: 0.92 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 24, scale: 0.92 }}
            transition={{ type: 'spring', damping: 22, stiffness: 300 }}
          >
            {/* ─── Header ─── */}
            <div className="chat-header bg-primary text-white">
              <div className="flex-center gap-sm">
                <div className="chat-avatar-ring">
                  <Bot size={18} />
                </div>
                <div>
                  <h4 style={{ margin: 0, fontSize: '0.95rem', color: 'white' }}>
                    {t('chatbot.title') || 'Twacha AI'}
                  </h4>
                  <span className="chat-status-dot">
                    <span className="dot-pulse" />
                    {isChatTyping ? 'Typing...' : 'Online'}
                  </span>
                </div>
              </div>
              <div className="chat-header-actions">
                {/* Mute TTS toggle */}
                <button
                  className="chat-icon-action"
                  title={isMuted ? 'Unmute voice' : 'Mute voice'}
                  onClick={() => setIsMuted((m) => !m)}
                >
                  {isMuted ? <VolumeX size={16} /> : <Volume2 size={16} />}
                </button>
                {/* Clear chat */}
                <button
                  className="chat-icon-action"
                  title="Clear chat history"
                  onClick={clearChatHistory}
                >
                  <Trash2 size={16} />
                </button>
                {/* Close */}
                <button
                  className="chat-close-btn text-white"
                  onClick={() => setIsOpen(false)}
                >
                  <X size={18} />
                </button>
              </div>
            </div>

            {/* ─── Messages ─── */}
            <div className="chat-messages">
              {chatMessages.map((msg) => (
                <motion.div
                  key={msg.id}
                  className={`message-bubble ${msg.sender}${msg.error ? ' error-bubble' : ''}${isSafetyMessage(msg.text) ? ' safety-bubble' : ''}`}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.25 }}
                >
                  {msg.sender === 'ai' && (
                    <div className="msg-avatar">
                      <Bot size={13} />
                    </div>
                  )}
                  <div className="msg-content">
                    {msg.sender === 'ai' && msg.text ? (
                      <div
                        className="msg-text formatted"
                        dangerouslySetInnerHTML={{
                          __html: formatAIResponse(msg.text),
                        }}
                      />
                    ) : (
                      <div className="msg-text">{msg.text}</div>
                    )}
                    {/* Streaming cursor */}
                    {msg.streaming && (
                      <span className="stream-cursor">▌</span>
                    )}
                  </div>
                </motion.div>
              ))}

              {/* Typing indicator (fallback before first chunk) */}
              {isChatTyping && streamingMsgId === null && (
                <div className="message-bubble ai">
                  <div className="msg-avatar">
                    <Bot size={13} />
                  </div>
                  <div className="typing-indicator">
                    <span /><span /><span />
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* ─── Quick Suggestions ─── */}
            <div className="quick-suggestions">
              {quickSuggestions.map((suggestion, idx) => (
                <button
                  key={idx}
                  className="suggestion-chip glass"
                  onClick={() => handleSendMessage(suggestion)}
                  disabled={isChatTyping}
                >
                  {suggestion}
                </button>
              ))}
            </div>

            {/* ─── Input Area ─── */}
            <div className="chat-input-area border-t border-glass">
              <input
                ref={inputRef}
                type="text"
                placeholder={
                  isListening
                    ? '🎤 Listening...'
                    : t('chatbot.placeholder') || 'Ask about skincare...'
                }
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                onKeyPress={handleKeyPress}
                className={`chat-input ${isListening ? 'listening' : ''}`}
                disabled={isChatTyping}
              />
              {/* Voice Input */}
              <button
                className={`icon-btn mic-btn ${isListening ? 'listening-active' : 'text-muted'}`}
                title={isListening ? 'Stop listening' : 'Voice input'}
                onClick={startVoiceInput}
              >
                {isListening ? <MicOff size={18} /> : <Mic size={18} />}
              </button>
              {/* Send */}
              <button
                className={`icon-btn send-btn ${inputText.trim() && !isChatTyping ? 'text-primary' : 'text-muted'}`}
                onClick={() => handleSendMessage(inputText)}
                disabled={!inputText.trim() || isChatTyping}
              >
                <Send size={18} />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ─── FAB Button ─── */}
      <motion.button
        className={`ai-fab bg-primary ${isOpen ? 'open' : ''}`}
        onClick={() => setIsOpen(!isOpen)}
        whileHover={{ scale: 1.08 }}
        whileTap={{ scale: 0.93 }}
        title="Twacha AI Assistant"
      >
        <AnimatePresence mode="wait">
          {isOpen ? (
            <motion.div
              key="x"
              initial={{ rotate: -90, opacity: 0 }}
              animate={{ rotate: 0, opacity: 1 }}
              exit={{ rotate: 90, opacity: 0 }}
              transition={{ duration: 0.2 }}
            >
              <X size={26} color="white" />
            </motion.div>
          ) : (
            <motion.div
              key="bot"
              initial={{ rotate: 90, opacity: 0 }}
              animate={{ rotate: 0, opacity: 1 }}
              exit={{ rotate: -90, opacity: 0 }}
              transition={{ duration: 0.2 }}
            >
              <Bot size={26} color="white" />
            </motion.div>
          )}
        </AnimatePresence>
        {!isOpen && <div className="fab-pulse" />}
      </motion.button>
    </div>
  );
};

export default AIGuide;
