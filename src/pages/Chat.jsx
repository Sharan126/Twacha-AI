import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '../config/supabaseClient';
import { useAuth } from '../context/AuthContext';
import { ArrowLeft, Send } from 'lucide-react';
import './Chat.css';

const Chat = () => {
  const { doctorId } = useParams();
  const navigate = useNavigate();
  const { profile } = useAuth(); // profile from AuthContext (has id, name)
  
  const [messages, setMessages] = useState([]);
  const [inputText, setInputText] = useState('');
  const [doctorInfo, setDoctorInfo] = useState(null);
  const messagesEndRef = useRef(null);

  const mockDoctors = [
    { id: '1', name: 'Dr. Sarah Jenkins', image: 'https://i.pravatar.cc/150?img=1' },
    { id: '2', name: 'Dr. Rajesh Kumar', image: 'https://i.pravatar.cc/150?img=11' },
    { id: '3', name: 'Dr. Priya Sharma', image: 'https://i.pravatar.cc/150?img=5' }
  ];

  useEffect(() => {
    // Find doctor info
    const doc = mockDoctors.find(d => d.id === doctorId) || { id: doctorId, name: 'Doctor', image: 'https://i.pravatar.cc/150' };
    setDoctorInfo(doc);

    if (!profile) return; // need user to be logged in to fetch messages

    const fetchMessages = async () => {
      const { data, error } = await supabase
        .from('messages')
        .select('*')
        .or(`and(sender_id.eq.${profile.id},receiver_id.eq.${doctorId}),and(sender_id.eq.${doctorId},receiver_id.eq.${profile.id})`)
        .order('created_at', { ascending: true });
        
      if (!error && data) {
        setMessages(data);
      }
    };

    fetchMessages();

    // Subscribe to real-time changes
    const channel = supabase
      .channel(`chat_${profile.id}_${doctorId}`)
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'messages',
        filter: `receiver_id=eq.${profile.id}`, // listen for incoming messages from this doctor
      }, (payload) => {
        if (payload.new.sender_id === doctorId) {
          setMessages(prev => [...prev, payload.new]);
        }
      })
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'messages',
        filter: `sender_id=eq.${profile.id}`, // listen for messages I send (if synced across tabs)
      }, (payload) => {
          // Add to array if not already present
          setMessages(prev => {
              if (!prev.find(m => m.id === payload.new.id)) return [...prev, payload.new];
              return prev;
          });
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [doctorId, profile]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const sendMessage = async (e) => {
    e.preventDefault();
    if (!inputText.trim() || !profile) return;

    const newMsg = {
      sender_id: profile.id,
      receiver_id: doctorId,
      message: inputText.trim()
    };

    setInputText('');

    // Optimistic UI update
    const optimisticMsg = { ...newMsg, id: Date.now().toString(), created_at: new Date().toISOString() };
    setMessages(prev => [...prev, optimisticMsg]);

    await supabase.from('messages').insert([newMsg]);
  };

  if (!profile) {
    return (
      <div className="chat-page container" style={{ justifyContent: 'center', alignItems: 'center' }}>
        <p>Please log in to use the chat feature.</p>
        <button className="btn-primary" onClick={() => navigate('/auth')}>Log In</button>
      </div>
    );
  }

  return (
    <div className="chat-page container">
      <div className="chat-header glass">
        <button className="icon-btn" onClick={() => navigate(-1)}><ArrowLeft size={20}/></button>
        <div className="doctor-chat-info">
          <img src={doctorInfo?.image} alt={doctorInfo?.name} />
          <div>
            <h3>{doctorInfo?.name}</h3>
            <span className="status-online">Online</span>
          </div>
        </div>
      </div>

      <div className="chat-body glass-card">
        {messages.length === 0 && (
          <div style={{ textAlign: 'center', color: 'var(--text-muted)', marginTop: '2rem' }}>
            No messages yet. Say hello to {doctorInfo?.name}!
          </div>
        )}
        {messages.map((msg, i) => {
          const isMine = msg.sender_id === profile?.id;
          return (
            <div key={msg.id || i} className={`chat-bubble-container ${isMine ? 'mine' : 'theirs'}`}>
              <div className={`chat-bubble ${isMine ? 'bg-primary' : 'bg-surface'}`}>
                {msg.message}
              </div>
              <span className="chat-time">
                {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </span>
            </div>
          );
        })}
        <div ref={messagesEndRef} />
      </div>

      <form className="chat-input-area glass" onSubmit={sendMessage}>
        <input 
          type="text" 
          value={inputText}
          onChange={(e) => setInputText(e.target.value)}
          placeholder="Type a message..."
        />
        <button type="submit" className="btn-primary" disabled={!inputText.trim()}>
          <Send size={18} />
        </button>
      </form>
    </div>
  );
};

export default Chat;
