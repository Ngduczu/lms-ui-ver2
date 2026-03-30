import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MessageSquare, X, Send, Loader2 } from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import { getCourseChatRoomApi, getMessagesApi } from '../../api/chatApi';
import { StompConnection } from '../../lib/stompClient';
import { getStoredToken } from '../../lib/storage';

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
      setMessages([]); // Force clear old messages
      setLoading(true);
      setError(null);
      try {

        const roomRes = await getCourseChatRoomApi(courseId);
        const fetchedRoomId = roomRes?.data?.id || roomRes?.id;
        if (!fetchedRoomId) throw new Error("Chưa khởi tạo được phòng chat.");
        
        if (isMounted) setRoomId(fetchedRoomId);


        const histRes = await getMessagesApi(fetchedRoomId);
        if (isMounted) {

          const innerData = Array.isArray(histRes) ? histRes : (histRes?.data || []);
          const history = Array.isArray(innerData) ? innerData : [];
          setMessages([...history].reverse());
          
          localStorage.setItem(`chat_read_${courseId}`, new Date().toISOString());
        }

        const token = getStoredToken();
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
        stompClientRef.current = null;
      }
      setLoading(false);
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
            width: '360px', height: '520px', backgroundColor: 'var(--color-surface)',
            borderRadius: 'var(--radius-xl)', boxShadow: 'var(--shadow-modal)',
            display: 'flex', flexDirection: 'column', zIndex: 9999, overflow: 'hidden',
            border: '1px solid var(--color-border)'
          }}
        >
          <div style={{
            padding: '1rem', background: 'linear-gradient(135deg, var(--color-primary), var(--color-accent))',
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
            flex: 1, overflowY: 'auto', padding: '1rem', background: 'var(--color-surface-alt)',
            display: 'flex', flexDirection: 'column', gap: '0.75rem'
          }}>
            {loading ? (
              <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%', color: 'var(--color-text-muted)' }}>
                <Loader2 className="spin" size={24} />
              </div>
            ) : error ? (
              <div style={{ color: 'var(--color-error)', textAlign: 'center', fontSize: '0.875rem' }}>{error}</div>
            ) : messages.length === 0 ? (
              <div style={{ textAlign: 'center', color: 'var(--color-text-muted)', fontSize: '0.875rem', marginTop: 'auto', marginBottom: 'auto' }}>
                Hãy là người đầu tiên nhắn tin!
              </div>
            ) : (
              messages.map((msg, idx) => {
                const currentId = user?.userId || user?.id; // standard or mock user handle
                const isMe = msg.senderId === currentId;
                
                return (
                  <div key={msg.id || idx} style={{
                    display: 'flex', flexDirection: 'column',
                    alignItems: isMe ? 'flex-end' : 'flex-start',
                    width: '100%',
                  }}>
                    {!isMe && (
                      <span style={{ fontSize: '0.65rem', color: 'var(--color-text-muted)', marginBottom: '4px', marginLeft: '36px' }}>
                        {msg.senderName || 'Thành viên'}
                      </span>
                    )}
                    <div style={{
                      display: 'flex',
                      flexDirection: isMe ? 'row-reverse' : 'row',
                      gap: '0.5rem',
                      alignItems: 'flex-start',
                      maxWidth: '90%',
                    }}>
                      <img 
                        src={msg.senderAvatarUrl || `https://ui-avatars.com/api/?name=${encodeURIComponent(msg.senderName || 'U')}&background=${isMe ? '7c3aed' : 'e2e8f0'}&color=${isMe ? 'fff' : '475569'}`} 
                        alt="avatar" 
                        style={{ width: '28px', height: '28px', borderRadius: '50%', objectFit: 'cover', flexShrink: 0, marginTop: '2px' }}
                      />
                      <div style={{
                        padding: '0.6rem 0.85rem',
                        borderRadius: '1rem', fontSize: '0.875rem',
                        background: isMe ? 'linear-gradient(135deg, var(--color-primary), var(--color-accent))' : 'var(--color-surface)',
                        color: isMe ? '#ffffff' : 'var(--color-text)',
                        border: isMe ? 'none' : '1px solid var(--color-border)',
                        borderBottomRightRadius: isMe ? '0.25rem' : '1rem',
                        borderBottomLeftRadius: isMe ? '1rem' : '0.25rem',
                        wordBreak: 'break-word',
                        boxShadow: 'var(--shadow-card)'
                      }}>
                        {msg.content}
                      </div>
                    </div>
                  </div>
                );
              })
            )}
            <div ref={messagesEndRef} />
          </div>

          <form onSubmit={handleSend} style={{
            padding: '0.875rem', background: 'var(--color-surface)', borderTop: '1px solid var(--color-border)',
            display: 'flex', gap: '0.5rem'
          }}>
            <input
              type="text"
              placeholder="Nhập tin nhắn..."
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              disabled={loading || !!error}
              style={{
                flex: 1, padding: '0.625rem 1rem', borderRadius: '99px',
                border: '1px solid var(--color-border)', fontSize: '0.875rem', outline: 'none',
                background: 'var(--color-surface-alt)', color: 'var(--color-text)',
                transition: 'all var(--transition-fast)'
              }}
              onFocus={(e) => { e.target.style.borderColor = 'var(--color-primary)'; e.target.style.background = 'var(--color-surface)' }}
              onBlur={(e) => { e.target.style.borderColor = 'var(--color-border)'; e.target.style.background = 'var(--color-surface-alt)' }}
            />
            <button
              type="submit"
              disabled={!inputText.trim() || loading || !!error}
              style={{
                width: '40px', height: '40px', borderRadius: '50%', border: 'none',
                background: inputText.trim() ? 'linear-gradient(135deg, var(--color-primary), var(--color-accent))' : 'var(--color-border)',
                color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center',
                cursor: inputText.trim() ? 'pointer' : 'not-allowed', transition: 'all var(--transition-fast)'
              }}
            >
              <Send size={16} style={{ marginLeft: inputText.trim() ? '2px' : '0' }}/>
            </button>
          </form>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
