import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MessageSquare, X, Send, Loader2 } from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import { getCourseChatRoomApi, getMessagesApi } from '../../api/chatApi';
import { StompConnection } from '../../lib/stompClient';

export function CourseChatWidget({ courseId, isOpen, onClose }) {
  const { user } = useAuth();
  const [roomId, setRoomId] = useState(null);
  const [messages, setMessages] = useState([]);
  const [inputText, setInputText] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const stompClientRef = useRef(null);
  const messagesEndRef = useRef(null);
  const scrollContainerRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    if (!isOpen || !courseId) return;

    let isMounted = true;
    const initChat = async () => {
      setLoading(true);
      setError(null);
      try {
        // 1. Fetch Room ID
        const roomRes = await getCourseChatRoomApi(courseId);
        const fetchedRoomId = roomRes?.data?.id || roomRes?.id;
        if (!fetchedRoomId) throw new Error("Chưa khởi tạo được phòng chat.");
        
        if (isMounted) setRoomId(fetchedRoomId);

        // 2. Fetch History
        const histRes = await getMessagesApi(fetchedRoomId);
        if (isMounted) {
          // APIs typically return messages sorted by newest first (DESC), 
          // we want oldest first (ASC) for chatting display
          const history = Array.isArray(histRes?.data) ? histRes.data : [];
          setMessages([...history].reverse());
          
          // Update last read mark
          localStorage.setItem(`chat_read_${courseId}`, new Date().toISOString());
        }

        // 3. Connect WebSocket
        const token = localStorage.getItem('token');
        if (token && isMounted) {
          const stomp = new StompConnection(fetchedRoomId, token, (newMsg) => {
            setMessages((prev) => [...prev, newMsg]);
            localStorage.setItem(`chat_read_${courseId}`, new Date().toISOString());
          });
          stomp.connect();
          stompClientRef.current = stomp;
        }
      } catch (err) {
        if (isMounted) setError(err.message || 'Lỗi tải phòng chat');
      } finally {
        if (isMounted) setLoading(false);
        setTimeout(scrollToBottom, 100);
      }
    };

    initChat();

    return () => {
      isMounted = false;
      if (stompClientRef.current) {
        stompClientRef.current.disconnect();
      }
      localStorage.setItem(`chat_read_${courseId}`, new Date().toISOString());
    };
  }, [isOpen, courseId]);

  const handleSend = (e) => {
    e.preventDefault();
    if (!inputText.trim() || !stompClientRef.current) return;
    
    stompClientRef.current.sendMessage(inputText);
    setInputText('');
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0, x: 300 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: 300 }}
          transition={{ type: 'spring', damping: 25, stiffness: 200 }}
          style={{
            position: 'fixed', bottom: '1.5rem', right: '1.5rem',
            width: '350px', height: '500px', backgroundColor: '#fff',
            borderRadius: '1rem', boxShadow: '0 10px 40px rgba(0,0,0,0.15)',
            display: 'flex', flexDirection: 'column', zIndex: 9999, overflow: 'hidden',
            border: '1px solid #e2e8f0'
          }}
        >
          {/* Header */}
          <div style={{
            padding: '1rem', background: 'linear-gradient(135deg, #4f46e5, #3b82f6)',
            color: '#fff', display: 'flex', justifyContent: 'space-between', alignItems: 'center'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <MessageSquare size={18} />
              <h3 style={{ margin: 0, fontSize: '1rem', fontWeight: 600 }}>Thảo luận chung</h3>
            </div>
            <button onClick={onClose} style={{
              background: 'transparent', border: 'none', color: '#fff',
              cursor: 'pointer', opacity: 0.8, display: 'flex'
            }}>
              <X size={18} />
            </button>
          </div>

          {/* Body */}
          <div ref={scrollContainerRef} style={{
            flex: 1, overflowY: 'auto', padding: '1rem', background: '#f8fafc',
            display: 'flex', flexDirection: 'column', gap: '0.75rem'
          }}>
            {loading ? (
              <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%', color: '#94a3b8' }}>
                <Loader2 className="spin" size={24} />
              </div>
            ) : error ? (
              <div style={{ color: '#ef4444', textAlign: 'center', fontSize: '0.875rem' }}>{error}</div>
            ) : messages.length === 0 ? (
              <div style={{ textAlign: 'center', color: '#94a3b8', fontSize: '0.875rem', marginTop: 'auto', marginBottom: 'auto' }}>
                Hãy là người đầu tiên nhắn tin!
              </div>
            ) : (
              messages.map((msg, idx) => {
                const currentId = user?.userId || user?.id; // standard or mock user handle
                const isMe = msg.senderId === currentId;
                
                return (
                  <div key={msg.id || idx} style={{
                    display: 'flex', flexDirection: 'column',
                    alignItems: isMe ? 'flex-end' : 'flex-start'
                  }}>
                    {!isMe && (
                      <span style={{ fontSize: '0.65rem', color: '#94a3b8', marginBottom: '2px', marginLeft: '2px' }}>
                        Thành viên
                      </span>
                    )}
                    <div style={{
                      maxWidth: '85%', padding: '0.6rem 0.85rem',
                      borderRadius: '1rem', fontSize: '0.875rem',
                      background: isMe ? '#e0e7ff' : '#fff',
                      color: isMe ? '#1e3a8a' : '#334155',
                      border: isMe ? 'none' : '1px solid #e2e8f0',
                      borderBottomRightRadius: isMe ? '0.25rem' : '1rem',
                      borderBottomLeftRadius: isMe ? '1rem' : '0.25rem',
                      wordBreak: 'break-word'
                    }}>
                      {msg.content}
                    </div>
                  </div>
                );
              })
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input */}
          <form onSubmit={handleSend} style={{
            padding: '0.75rem', background: '#fff', borderTop: '1px solid #f1f5f9',
            display: 'flex', gap: '0.5rem'
          }}>
            <input
              type="text"
              placeholder="Nhập tin nhắn..."
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              disabled={loading || !!error}
              style={{
                flex: 1, padding: '0.5rem 0.75rem', borderRadius: '99px',
                border: '1px solid #e2e8f0', fontSize: '0.875rem', outline: 'none'
              }}
            />
            <button
              type="submit"
              disabled={!inputText.trim() || loading || !!error}
              style={{
                width: '36px', height: '36px', borderRadius: '50%', border: 'none',
                background: inputText.trim() ? '#4f46e5' : '#e2e8f0',
                color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center',
                cursor: inputText.trim() ? 'pointer' : 'not-allowed', transition: 'background 0.2s'
              }}
            >
              <Send size={16} />
            </button>
          </form>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
