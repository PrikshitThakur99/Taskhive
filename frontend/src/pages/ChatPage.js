import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useSocket } from '../context/SocketContext';
import api from '../utils/api';
import toast from 'react-hot-toast';

const ChatPage = () => {
  const { userId } = useParams();
  const { user } = useAuth();
  const { socket } = useSocket();
  const navigate = useNavigate();

  const [conversations, setConversations] = useState([]);
  const [messages, setMessages] = useState([]);
  const [activeUser, setActiveUser] = useState(null);
  const [content, setContent] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [searchUser, setSearchUser] = useState('');
  const [userResults, setUserResults] = useState([]);
  const [typing, setTyping] = useState(false);
  const bottomRef = useRef(null);
  const typingTimer = useRef(null);

  const conversationId = user && activeUser
    ? [user._id, activeUser._id].sort().join('_')
    : null;

  // Load conversations
  useEffect(() => {
    api.get('/messages/conversations')
      .then(({ data }) => setConversations(data.conversations))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  // Load messages when activeUser changes
  useEffect(() => {
    if (!activeUser) return;
    api.get(`/messages/${activeUser._id}`)
      .then(({ data }) => setMessages(data.messages))
      .catch(() => toast.error('Failed to load messages'));
  }, [activeUser]);

  // Open conversation from URL param
  useEffect(() => {
    if (userId && userId !== activeUser?._id) {
      api.get(`/users/${userId}`)
        .then(({ data }) => setActiveUser(data.user))
        .catch(() => {});
    }
  }, [userId]);

  // Socket: join conversation room & listen
  useEffect(() => {
    if (!socket || !conversationId) return;
    socket.emit('conversation:join', conversationId);

    const handleNew = (msg) => {
      if (msg.conversationId === conversationId) {
        setMessages(prev => [...prev, msg]);
      }
    };
    const handleTypingStart = ({ userId: uid }) => {
      if (uid !== user._id) setTyping(true);
    };
    const handleTypingStop = () => setTyping(false);

    socket.on('message:new', handleNew);
    socket.on('typing:start', handleTypingStart);
    socket.on('typing:stop', handleTypingStop);
    return () => {
      socket.off('message:new', handleNew);
      socket.off('typing:start', handleTypingStart);
      socket.off('typing:stop', handleTypingStop);
    };
  }, [socket, conversationId, user._id]);

  // Scroll to bottom
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleTyping = (e) => {
    setContent(e.target.value);
    if (socket && conversationId) {
      socket.emit('typing:start', { conversationId, userId: user._id });
      clearTimeout(typingTimer.current);
      typingTimer.current = setTimeout(() => {
        socket.emit('typing:stop', { conversationId, userId: user._id });
      }, 1500);
    }
  };

  const sendMessage = async (e) => {
    e.preventDefault();
    if (!content.trim() || !activeUser) return;
    setSending(true);
    try {
      const { data } = await api.post('/messages', {
        receiverId: activeUser._id,
        content: content.trim(),
      });
      setMessages(prev => [...prev, data.message]);
      setContent('');
      if (socket && conversationId)
        socket.emit('typing:stop', { conversationId, userId: user._id });
    } catch { toast.error('Failed to send'); }
    finally { setSending(false); }
  };

  const searchUsers = useCallback(async (q) => {
    if (!q.trim()) { setUserResults([]); return; }
    try {
      const { data } = await api.get('/users/search', { params: { q } });
      setUserResults(data.users.filter(u => u._id !== user._id));
    } catch {}
  }, [user._id]);

  useEffect(() => {
    const t = setTimeout(() => searchUsers(searchUser), 300);
    return () => clearTimeout(t);
  }, [searchUser, searchUsers]);

  const selectUser = (u) => {
    setActiveUser(u);
    setUserResults([]);
    setSearchUser('');
    navigate(`/chat/${u._id}`);
  };

  const formatTime = (d) => {
    const date = new Date(d);
    const now = new Date();
    if (date.toDateString() === now.toDateString())
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
  };

  return (
    <div style={{ height: 'calc(100vh - 60px)', display: 'flex', overflow: 'hidden' }}>

      {/* Sidebar */}
      <div style={{
        width: 280, borderRight: '1px solid var(--border)',
        background: 'var(--bg2)', display: 'flex', flexDirection: 'column', flexShrink: 0,
      }}>
        <div style={{ padding: '16px 14px', borderBottom: '1px solid var(--border)' }}>
          <div style={{ fontWeight: 700, fontSize: 15, marginBottom: 10 }}>💬 Messages</div>
          <div style={{ position: 'relative' }}>
            <input
              placeholder="Search users..."
              value={searchUser}
              onChange={e => setSearchUser(e.target.value)}
              style={{ paddingLeft: 32, fontSize: 12 }}
            />
            <span style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: 'var(--text3)', fontSize: 13 }}>🔍</span>
            {userResults.length > 0 && (
              <div style={{
                position: 'absolute', top: '110%', left: 0, right: 0,
                background: 'var(--bg3)', border: '1px solid var(--border2)',
                borderRadius: 8, zIndex: 50, overflow: 'hidden',
              }}>
                {userResults.map(u => (
                  <div key={u._id} onClick={() => selectUser(u)} style={{
                    display: 'flex', alignItems: 'center', gap: 8,
                    padding: '9px 12px', cursor: 'pointer', transition: 'background 0.1s',
                  }}
                    onMouseEnter={e => e.currentTarget.style.background = 'var(--bg4)'}
                    onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                  >
                    <div className="avatar avatar-sm" style={{ fontSize: 10 }}>
                      {u.name?.slice(0, 2).toUpperCase()}
                    </div>
                    <div>
                      <div style={{ fontSize: 13, fontWeight: 500 }}>{u.name}</div>
                      <div style={{ fontSize: 10, color: 'var(--text3)' }}>{u.university || 'Student'}</div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        <div style={{ flex: 1, overflowY: 'auto' }}>
          {loading ? (
            <div style={{ padding: 20, textAlign: 'center' }}><div className="spinner" style={{ margin: '0 auto' }} /></div>
          ) : conversations.length === 0 ? (
            <div style={{ padding: '32px 16px', textAlign: 'center', color: 'var(--text3)', fontSize: 13 }}>
              No conversations yet.<br />Search for a user to start chatting.
            </div>
          ) : (
            conversations.map(conv => {
              const other = conv.otherUser;
              if (!other) return null;
              const isActive = activeUser?._id === other._id;
              return (
                <div key={conv._id} onClick={() => selectUser(other)}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 10,
                    padding: '12px 14px', cursor: 'pointer', transition: 'background 0.1s',
                    background: isActive ? 'var(--bg3)' : 'transparent',
                    borderLeft: isActive ? '2px solid var(--accent)' : '2px solid transparent',
                  }}
                  onMouseEnter={e => { if (!isActive) e.currentTarget.style.background = 'var(--bg3)'; }}
                  onMouseLeave={e => { if (!isActive) e.currentTarget.style.background = 'transparent'; }}
                >
                  <div style={{ position: 'relative' }}>
                    <div className="avatar avatar-sm">{other.name?.slice(0, 2).toUpperCase()}</div>
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span style={{ fontSize: 13, fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{other.name}</span>
                      <span style={{ fontSize: 10, color: 'var(--text3)', flexShrink: 0, marginLeft: 4 }}>
                        {formatTime(conv.lastMessage?.createdAt)}
                      </span>
                    </div>
                    <div style={{ fontSize: 11, color: 'var(--text3)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', marginTop: 2 }}>
                      {conv.lastMessage?.content || ''}
                    </div>
                  </div>
                  {conv.unreadCount > 0 && (
                    <div style={{
                      width: 18, height: 18, borderRadius: '50%', background: 'var(--accent)',
                      color: '#fff', fontSize: 10, fontWeight: 700,
                      display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                    }}>{conv.unreadCount}</div>
                  )}
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* Chat window */}
      {activeUser ? (
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
          {/* Header */}
          <div style={{
            padding: '12px 20px', borderBottom: '1px solid var(--border)',
            background: 'var(--bg2)', display: 'flex', alignItems: 'center', gap: 12,
          }}>
            <div className="avatar avatar-md">{activeUser.name?.slice(0, 2).toUpperCase()}</div>
            <div style={{ flex: 1 }}>
              <div style={{ fontWeight: 700, fontSize: 14 }}>{activeUser.name}</div>
              <div style={{ fontSize: 11, color: 'var(--text3)' }}>{activeUser.university || 'Student'}</div>
            </div>
            <Link to={`/profile/${activeUser._id}`} className="btn btn-ghost btn-sm">View Profile</Link>
          </div>

          {/* Messages */}
          <div style={{ flex: 1, overflowY: 'auto', padding: '20px 24px', display: 'flex', flexDirection: 'column', gap: 12 }}>
            {messages.length === 0 && (
              <div style={{ textAlign: 'center', color: 'var(--text3)', fontSize: 13, marginTop: 60 }}>
                <div style={{ fontSize: 40, marginBottom: 10 }}>👋</div>
                Start a conversation with {activeUser.name}
              </div>
            )}
            {messages.map((msg, i) => {
              const isMe = msg.sender?._id === user._id || msg.sender === user._id;
              const showDate = i === 0 || new Date(msg.createdAt).toDateString() !== new Date(messages[i - 1]?.createdAt).toDateString();
              return (
                <React.Fragment key={msg._id}>
                  {showDate && (
                    <div style={{ textAlign: 'center', fontSize: 11, color: 'var(--text3)', margin: '8px 0' }}>
                      {new Date(msg.createdAt).toLocaleDateString([], { weekday: 'long', month: 'short', day: 'numeric' })}
                    </div>
                  )}
                  <div style={{ display: 'flex', justifyContent: isMe ? 'flex-end' : 'flex-start', gap: 8 }}>
                    {!isMe && (
                      <div className="avatar" style={{ width: 28, height: 28, fontSize: 10, flexShrink: 0, alignSelf: 'flex-end' }}>
                        {activeUser.name?.slice(0, 2).toUpperCase()}
                      </div>
                    )}
                    <div style={{
                      maxWidth: '68%',
                      padding: '10px 14px',
                      borderRadius: isMe ? '16px 16px 4px 16px' : '16px 16px 16px 4px',
                      background: isMe ? 'var(--accent)' : 'var(--bg3)',
                      color: isMe ? '#fff' : 'var(--text)',
                      fontSize: 13, lineHeight: 1.5,
                      border: isMe ? 'none' : '1px solid var(--border)',
                    }}>
                      <div>{msg.content}</div>
                      <div style={{ fontSize: 10, opacity: 0.65, marginTop: 4, textAlign: 'right' }}>
                        {formatTime(msg.createdAt)}
                      </div>
                    </div>
                  </div>
                </React.Fragment>
              );
            })}
            {typing && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <div className="avatar" style={{ width: 28, height: 28, fontSize: 10 }}>{activeUser.name?.slice(0, 2).toUpperCase()}</div>
                <div style={{ background: 'var(--bg3)', border: '1px solid var(--border)', borderRadius: '16px 16px 16px 4px', padding: '10px 14px' }}>
                  <div style={{ display: 'flex', gap: 4 }}>
                    {[0, 1, 2].map(i => (
                      <div key={i} style={{
                        width: 6, height: 6, borderRadius: '50%', background: 'var(--text3)',
                        animation: `bounce 1.2s ${i * 0.2}s infinite`,
                      }} />
                    ))}
                  </div>
                </div>
              </div>
            )}
            <div ref={bottomRef} />
          </div>

          {/* Input */}
          <form onSubmit={sendMessage} style={{
            padding: '14px 20px', borderTop: '1px solid var(--border)',
            background: 'var(--bg2)', display: 'flex', gap: 10,
          }}>
            <input
              value={content}
              onChange={handleTyping}
              placeholder={`Message ${activeUser.name}...`}
              style={{ flex: 1, borderRadius: 20, padding: '10px 16px' }}
              onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage(e); } }}
            />
            <button type="submit" className="btn btn-primary" disabled={!content.trim() || sending}
              style={{ borderRadius: 20, padding: '10px 20px' }}>
              {sending ? '...' : '→'}
            </button>
          </form>
        </div>
      ) : (
        <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: 12, color: 'var(--text3)' }}>
          <div style={{ fontSize: 56 }}>💬</div>
          <div style={{ fontSize: 16, fontWeight: 600, color: 'var(--text2)' }}>Select a conversation</div>
          <div style={{ fontSize: 13 }}>Search for a user above or pick a conversation from the list</div>
        </div>
      )}

      <style>{`
        @keyframes bounce {
          0%, 60%, 100% { transform: translateY(0); }
          30% { transform: translateY(-6px); }
        }
      `}</style>
    </div>
  );
};

export default ChatPage;
