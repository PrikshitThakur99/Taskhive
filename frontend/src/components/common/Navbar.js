import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useSocket } from '../../context/SocketContext';
import toast from 'react-hot-toast';

const Navbar = () => {
  const { user, logout } = useAuth();
  const { notifications, clearAll } = useSocket();
  const navigate = useNavigate();
  const location = useLocation();
  const [showNotifs, setShowNotifs] = useState(false);
  const [showMenu, setShowMenu] = useState(false);

  const handleLogout = () => {
    logout();
    toast.success('Logged out successfully');
    navigate('/');
  };

  const initials = user?.name?.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  const unread = notifications.length;

  const navLinks = [
    { to: '/dashboard', label: 'Dashboard' },
    { to: '/tasks', label: 'Browse Tasks' },
    { to: '/chat', label: 'Messages' },
    { to: '/wallet', label: 'Wallet' },
  ];

  return (
    <nav style={{
      position: 'sticky', top: 0, zIndex: 100,
      background: 'var(--bg2)', borderBottom: '1px solid var(--border)',
      height: '60px', display: 'flex', alignItems: 'center', padding: '0 24px',
    }}>
      {/* Logo */}
      <Link to="/dashboard" style={{ display: 'flex', alignItems: 'center', gap: 8, marginRight: 32 }}>
        <div style={{
          width: 30, height: 30, background: 'var(--accent)', borderRadius: 7,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontWeight: 800, fontSize: 14, color: '#fff',
        }}>T</div>
        <span style={{ fontWeight: 800, fontSize: 17, letterSpacing: '-0.03em' }}>TaskHive</span>
      </Link>

      {/* Nav Links */}
      <div style={{ display: 'flex', gap: 4, flex: 1 }}>
        {navLinks.map(link => (
          <Link
            key={link.to}
            to={link.to}
            style={{
              padding: '6px 14px', borderRadius: 6, fontSize: 13, fontWeight: 500,
              color: location.pathname.startsWith(link.to) ? 'var(--text)' : 'var(--text2)',
              background: location.pathname.startsWith(link.to) ? 'var(--bg3)' : 'transparent',
              transition: 'all 0.15s',
            }}
          >{link.label}</Link>
        ))}
        {user?.role === 'admin' && (
          <Link to="/admin" style={{
            padding: '6px 14px', borderRadius: 6, fontSize: 13, fontWeight: 500,
            color: location.pathname === '/admin' ? 'var(--amber)' : 'var(--text2)',
            background: location.pathname === '/admin' ? 'var(--amber-bg)' : 'transparent',
          }}>Admin</Link>
        )}
      </div>

      {/* Right side */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        {/* Post Task */}
        <Link to="/tasks/create" className="btn btn-primary btn-sm">+ Post Task</Link>

        {/* Wallet */}
        <Link to="/wallet" style={{
          display: 'flex', alignItems: 'center', gap: 5,
          padding: '5px 12px', background: 'var(--green-bg)',
          border: '1px solid rgba(45,212,160,0.25)', borderRadius: 20,
          fontSize: 12, color: 'var(--green)', fontWeight: 700,
        }}>
          💰 ${user?.walletBalance?.toFixed(2) || '0.00'}
        </Link>

        {/* Notifications */}
        <div style={{ position: 'relative' }}>
          <button
            className="btn btn-ghost btn-icon"
            onClick={() => setShowNotifs(!showNotifs)}
            style={{ position: 'relative' }}
          >
            🔔
            {unread > 0 && (
              <span style={{
                position: 'absolute', top: 2, right: 2,
                width: 16, height: 16, background: 'var(--red)',
                borderRadius: '50%', fontSize: 9, color: '#fff',
                display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700,
              }}>{unread > 9 ? '9+' : unread}</span>
            )}
          </button>

          {showNotifs && (
            <div style={{
              position: 'absolute', right: 0, top: 40,
              width: 300, background: 'var(--bg2)',
              border: '1px solid var(--border2)', borderRadius: 'var(--radius)',
              boxShadow: 'var(--shadow)', zIndex: 200,
            }}>
              <div style={{ padding: '12px 16px', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontWeight: 600, fontSize: 13 }}>Notifications</span>
                {unread > 0 && <button className="btn btn-ghost btn-sm" onClick={clearAll}>Clear all</button>}
              </div>
              <div style={{ maxHeight: 300, overflowY: 'auto' }}>
                {notifications.length === 0 ? (
                  <div style={{ padding: 24, textAlign: 'center', color: 'var(--text3)', fontSize: 13 }}>No notifications</div>
                ) : notifications.map(n => (
                  <div key={n.id} style={{ padding: '12px 16px', borderBottom: '1px solid var(--border)', fontSize: 12, color: 'var(--text2)' }}>
                    {n.type === 'bid' && `📨 New bid from ${n.bidder} on "${n.taskTitle}"`}
                    {n.type === 'bid_accepted' && `✅ Your bid was accepted for "${n.taskTitle}" — $${n.amount}`}
                    {n.type === 'completed' && `💰 Payment of $${n.amount} received for "${n.title}"`}
                    {n.type === 'message' && `💬 New message received`}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Avatar menu */}
        <div style={{ position: 'relative' }}>
          <button
            onClick={() => setShowMenu(!showMenu)}
            className="avatar avatar-sm"
            style={{ border: '2px solid transparent', transition: 'border-color 0.2s' }}
          >{initials}</button>

          {showMenu && (
            <div style={{
              position: 'absolute', right: 0, top: 40, width: 200,
              background: 'var(--bg2)', border: '1px solid var(--border2)',
              borderRadius: 'var(--radius)', boxShadow: 'var(--shadow)', zIndex: 200,
              overflow: 'hidden',
            }}>
              <div style={{ padding: '12px 16px', borderBottom: '1px solid var(--border)' }}>
                <div style={{ fontWeight: 600, fontSize: 13 }}>{user?.name}</div>
                <div style={{ fontSize: 11, color: 'var(--text3)' }}>{user?.email}</div>
              </div>
              {[
                { label: '👤 My Profile', to: `/profile/${user?._id}` },
                { label: '📋 My Tasks', to: '/dashboard' },
                { label: '💳 Wallet', to: '/wallet' },
              ].map(item => (
                <Link
                  key={item.to}
                  to={item.to}
                  onClick={() => setShowMenu(false)}
                  style={{ display: 'block', padding: '10px 16px', fontSize: 13, color: 'var(--text2)', transition: 'background 0.15s' }}
                  onMouseEnter={e => e.target.style.background = 'var(--bg3)'}
                  onMouseLeave={e => e.target.style.background = 'transparent'}
                >{item.label}</Link>
              ))}
              <div style={{ borderTop: '1px solid var(--border)' }}>
                <button
                  onClick={handleLogout}
                  style={{ display: 'block', width: '100%', padding: '10px 16px', fontSize: 13, color: 'var(--red)', background: 'none', border: 'none', textAlign: 'left', cursor: 'pointer' }}
                >🚪 Logout</button>
              </div>
            </div>
          )}
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
